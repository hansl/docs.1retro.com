// A minimal deterministic CBOR encoder, per RFC 8949 section 4.2.
//
// Hand-rolled instead of pulled from npm on purpose. These tests exist to check
// that the format's own ordering rules hold, and borrowing someone else's
// encoder would test their determinism rather than ours. It also keeps a docs
// site at zero test dependencies.
//
// Only the subset the bundle format uses is here: unsigned and negative
// integers, byte and text strings, arrays, maps, tags, null and booleans.

import { createHash } from "node:crypto";

export class Tag {
  constructor(number, value) {
    this.number = number;
    this.value = value;
  }
}

// Only a negative fixture needs one of these. `encode` refuses a bare
// non-integer number on purpose, since a bundle never contains one, so a test
// that wants to prove the schema rejects a float has to ask for it explicitly.
export class Float {
  constructor(value) {
    this.value = value;
  }
}

// Bytes to emit verbatim. The encoder here only produces conforming output,
// which is the point of it, so a fixture that needs a *misencoded* bundle has
// to hand it the bytes. Used for the determinism rules: indefinite lengths,
// non-preferred integer heads, duplicate and misordered map keys. None of
// those are visible to a schema, so nothing else can express them.
export class Raw {
  constructor(bytes) {
    this.bytes = Buffer.from(bytes);
  }
}

function head(major, argument) {
  if (argument < 24) return Buffer.from([(major << 5) | argument]);
  if (argument < 0x100) return Buffer.from([(major << 5) | 24, argument]);
  if (argument < 0x10000) {
    const b = Buffer.alloc(3);
    b[0] = (major << 5) | 25;
    b.writeUInt16BE(argument, 1);
    return b;
  }
  if (argument < 0x100000000) {
    const b = Buffer.alloc(5);
    b[0] = (major << 5) | 26;
    b.writeUInt32BE(argument, 1);
    return b;
  }
  const b = Buffer.alloc(9);
  b[0] = (major << 5) | 27;
  b.writeBigUInt64BE(BigInt(argument), 1);
  return b;
}

export function encode(value) {
  if (value === null) return Buffer.from([0xf6]);
  if (typeof value === "boolean") return Buffer.from([value ? 0xf5 : 0xf4]);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new TypeError("only integers are used in a bundle");
    return value >= 0 ? head(0, value) : head(1, -value - 1);
  }
  if (typeof value === "string") {
    const bytes = Buffer.from(value, "utf8");
    return Buffer.concat([head(3, bytes.length), bytes]);
  }
  if (value instanceof Uint8Array) {
    return Buffer.concat([head(2, value.length), Buffer.from(value)]);
  }
  if (Array.isArray(value)) {
    return Buffer.concat([head(4, value.length), ...value.map(encode)]);
  }
  if (value instanceof Raw) return value.bytes;
  if (value instanceof Tag) {
    return Buffer.concat([head(6, value.number), encode(value.value)]);
  }
  if (value instanceof Float) {
    const b = Buffer.alloc(9);
    b[0] = 0xfb;
    b.writeDoubleBE(value.value, 1);
    return b;
  }
  if (value instanceof Map) {
    return Buffer.concat([head(5, value.size), ...sortedEntries(value).map(([, k, v]) => Buffer.concat([k, v]))]);
  }
  throw new TypeError(`cannot encode ${value}`);
}

// Section 4.2.1 orders map keys by the bytewise lexicographic order of their
// *encodings*, not of the keys themselves. That distinction is the whole reason
// the part map can reserve space ahead of its payload, so it is what the tests
// assert against rather than a numeric sort.
function sortedEntries(map) {
  return [...map].map(([key, value]) => [key, encode(key), encode(value)]).sort((a, b) => Buffer.compare(a[1], b[1]));
}

// Which order the keys land in once encoded, and the byte offset each one
// starts at inside the encoded map.
export function encodedKeyLayout(map) {
  const entries = sortedEntries(map);
  const offsets = new Map();
  let at = head(5, map.size).length;
  for (const [key, encodedKey, encodedValue] of entries) {
    offsets.set(key, at);
    at += encodedKey.length + encodedValue.length;
  }
  return { order: entries.map(([key]) => key), offsets };
}

// ---- Decoding --------------------------------------------------------------
// Needed because a `bundle` part's payload is an encoded bundle, so checking
// what a card actually holds means reading those bytes back. Asserting against
// the pre-encoding fixture value instead would only prove that encode() agrees
// with itself.
//
// Indefinite-length items are rejected rather than supported: the format forbids
// them everywhere, so a decoder that quietly accepted one would hide the bug it
// exists to catch.

function readHead(bytes, at) {
  const initial = bytes[at];
  const major = initial >> 5;
  const info = initial & 0x1f;
  if (info < 24) return { major, argument: info, next: at + 1 };
  if (info === 24) return { major, argument: bytes[at + 1], next: at + 2 };
  if (info === 25) return { major, argument: bytes.readUInt16BE(at + 1), next: at + 3 };
  if (info === 26) return { major, argument: bytes.readUInt32BE(at + 1), next: at + 5 };
  if (info === 27) return { major, argument: Number(bytes.readBigUInt64BE(at + 1)), next: at + 9 };
  if (info === 31) throw new Error(`indefinite-length item at byte ${at}, which a bundle never contains`);
  throw new Error(`reserved additional information ${info} at byte ${at}`);
}

function decodeAt(bytes, at) {
  const { major, argument, next } = readHead(bytes, at);
  switch (major) {
    case 0:
      return { value: argument, next };
    case 1:
      return { value: -argument - 1, next };
    case 2:
      return { value: bytes.subarray(next, next + argument), next: next + argument };
    case 3:
      return { value: bytes.subarray(next, next + argument).toString("utf8"), next: next + argument };
    case 4: {
      const items = [];
      let at2 = next;
      for (let i = 0; i < argument; i++) {
        const item = decodeAt(bytes, at2);
        items.push(item.value);
        at2 = item.next;
      }
      return { value: items, next: at2 };
    }
    case 5: {
      const entries = new Map();
      let at2 = next;
      for (let i = 0; i < argument; i++) {
        const key = decodeAt(bytes, at2);
        const value = decodeAt(bytes, key.next);
        entries.set(key.value, value.value);
        at2 = value.next;
      }
      return { value: entries, next: at2 };
    }
    case 6: {
      const inner = decodeAt(bytes, next);
      return { value: new Tag(argument, inner.value), next: inner.next };
    }
    case 7:
      if (argument === 20) return { value: false, next };
      if (argument === 21) return { value: true, next };
      if (argument === 22) return { value: null, next };
      throw new Error(`unsupported simple value ${argument} at byte ${at}`);
    default:
      throw new Error(`unsupported major type ${major} at byte ${at}`);
  }
}

export function decode(bytes) {
  const { value, next } = decodeAt(bytes, 0);
  if (next !== bytes.length) throw new Error(`${bytes.length - next} trailing bytes after the top-level item`);
  return value;
}

const KIND = 1;
const PAYLOAD = -1;

// Walks a bundle's parts, descending into `bundle` parts so a card's saves are
// visited too. Yields { part, depth, kind, bundle }, where `kind` is undefined
// for a plain save and `bundle` is the decoded inner bundle for a nested part.
export function* everyPart(bundleValue, depth = 0) {
  for (const p of bundleValue.value[1]) {
    const kind = p.get(KIND);
    if (kind !== "bundle") {
      yield { part: p, depth, kind };
      continue;
    }
    // A thin entry references its bundle instead of carrying it, so there is
    // nothing here to descend into.
    const payload = p.get(PAYLOAD);
    const inner = payload instanceof Uint8Array ? decode(payload) : undefined;
    yield { part: p, depth, kind, bundle: inner };
    if (inner) yield* everyPart(inner, depth + 1);
  }
}

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest();

export const map = (object) => new Map(Object.entries(object).map(([k, v]) => [maybeInt(k), v]));

// Object keys stringify, so integer-keyed maps have to be rebuilt as real
// numbers or every spec-owned key would encode as text.
const maybeInt = (key) => (/^-?\d+$/.test(key) ? Number(key) : key);
