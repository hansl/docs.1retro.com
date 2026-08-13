// Where things land in an encoded bundle, and the determinism underneath it.
//
// These need no external tooling, so they always run. CDDL cannot express any
// of this: it validates the data model, not the encoding, which is exactly why
// the spec's ordering claims need tests of their own.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { encode, encodedKeyLayout, everyPart, map, sha256 } from "./cbor.js";
import { part, ps1Card, valid } from "./bundles.js";

const PAYLOAD = -1;
const KIND = 1;
const SLOT = 4;
const DIRENT = 5;
const SHA256 = 9;
const GAME = 11;
const SYSTEM = 12;

describe("file framing", () => {
  it("starts with the 1SAV magic", () => {
    const bytes = encode(ps1Card);
    assert.equal(bytes.subarray(0, 5).toString("hex"), "da31534156");
    assert.equal(bytes.subarray(1, 5).toString("ascii"), "1SAV", "bytes 1-4 read as ASCII magic");
  });
});

describe("part key ordering", () => {
  const entries = ps1Card.value[1];

  it("assigns every key ahead of the payload", () => {
    for (const p of entries) {
      const { order } = encodedKeyLayout(p);
      assert.deepEqual(order, [0, KIND, 2, 3, SLOT, DIRENT, SHA256, GAME, SYSTEM, PAYLOAD]);
    }
  });

  it("puts the payload last, at every nesting level", () => {
    for (const { part: p } of everyPart(ps1Card)) {
      const { order } = encodedKeyLayout(p);
      assert.equal(order.at(-1), PAYLOAD);
    }
  });

  it("keeps game, slot and dirent ahead of the blob", () => {
    for (const p of entries) {
      const { offsets } = encodedKeyLayout(p);
      for (const key of [GAME, SLOT, DIRENT]) {
        assert.ok(offsets.get(key) < offsets.get(PAYLOAD), `key ${key} precedes payload`);
      }
    }
  });

  it("leaves the blob bytes at the tail of the part", () => {
    for (const { part: p } of everyPart(ps1Card)) {
      assert.ok(encode(p).subarray(-p.get(PAYLOAD).length).equals(p.get(PAYLOAD)));
    }
  });
});

describe("cheap identification", () => {
  it("fits the head region ahead of the first blob in under 2 KiB", () => {
    const bytes = encode(ps1Card);
    const firstBlob = bytes.indexOf(ps1Card.value[1][0].get(PAYLOAD));
    assert.ok(firstBlob > 0, "payload bytes appear in the encoded bundle");
    assert.ok(firstBlob < 2048, `head region is ${firstBlob} bytes, spec claims typically under 2 KiB`);
  });

  // What a card lists is its saves, and each entry's index data sits ahead of
  // that save's bundle. So listing the contents of a card never means decoding
  // one, which is why the outer part repeats the inner header's game.
  it("keeps every card entry's index data ahead of its save", () => {
    const bytes = encode(ps1Card);
    for (const { part: p, depth } of everyPart(ps1Card)) {
      if (depth !== 0) continue;
      const blobAt = bytes.indexOf(p.get(PAYLOAD));
      const gameAt = bytes.indexOf(encode(p.get(GAME)));
      assert.ok(gameAt > 0 && gameAt < blobAt, `entry ${p.get(0)}'s game hint precedes its bundle`);
    }
  });
});

describe("determinism", () => {
  it("encodes the same logical bundle to the same bytes", () => {
    assert.ok(encode(ps1Card).equals(encode(ps1Card)));
  });

  it("ignores insertion order, because keys sort on their encodings", () => {
    const forwards = part({ game: map({ 4: "Metal Gear Solid" }), slot: 1, dirent: Buffer.from("DIR") });
    const backwards = new Map([...forwards].reverse());
    assert.ok(encode(forwards).equals(encode(backwards)));
  });
});

// Why the payload sits at a negative key. Nothing in the format is allowed to
// depend on where a key lands inside a part, but -1 is chosen so that no
// unsigned key a later minor version assigns can ever displace it.
describe("negative payload key", () => {
  it("sorts after every unsigned key, whatever its magnitude", () => {
    for (const key of [0, 23, 24, 255, 256, 65535, 2 ** 32]) {
      const p = new Map([
        [key, "assigned later"],
        [PAYLOAD, Buffer.from("BLOB")],
      ]);
      assert.equal(encodedKeyLayout(p).order.at(-1), PAYLOAD, `payload still follows key ${key}`);
    }
  });

  it("costs one byte, the same as key 23 did", () => {
    assert.equal(encode(PAYLOAD).length, 1);
    assert.equal(encode(23).length, 1);
    assert.equal(encode(24).length, 2);
  });

  it("still precedes a flat extension key, which the format no longer minds", () => {
    const p = new Map([
      [0, 0],
      [PAYLOAD, Buffer.from("BLOB")],
      ["x.example.thing", map({ 0: 1 })],
    ]);
    assert.deepEqual(encodedKeyLayout(p).order, [0, PAYLOAD, "x.example.thing"]);
  });
});

// One logical bundle has one encoding, or the content hash stops being a
// function of what the bundle says. CDDL catches most of this; these are the
// rules it cannot reach, because "at least one of these optional keys" and
// "any slug except this one" are both beyond what a schema can say.
describe("one encoding per bundle", () => {
  const everyBundle = function* (b, depth = 0) {
    yield { bundle: b, depth };
    for (const { bundle: inner, depth: d } of everyPart(b)) if (inner) yield { bundle: inner, depth: d };
  };

  // Absence is the only encoding of each of these. Three of the four are
  // catchable by the schema; `role` is not, because `primary` is a well-formed
  // slug and XSD regular expressions have no negative lookahead, so this test
  // is the only thing standing between the rule and a bundle that breaks it.
  const DEFAULTS = [
    [2, "primary", "role"],
    [3, "", "path"],
    [7, "none", "encoding"],
    [KIND, "save", "kind"],
  ];
  it("never spells out a default", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { part: p } of everyPart(fixture)) {
        for (const [key, def, field] of DEFAULTS) {
          assert.notEqual(p.get(key), def, `${name}: part ${p.get(0)} writes ${field} out as "${def}"`);
        }
      }
    }
  });

  // The same rule for every optional container: nothing is absence.
  it("omits an empty container rather than encoding one", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { bundle: b } of everyBundle(fixture)) {
        const header = b.value[0];
        for (const key of [2, 4]) {
          const m = header.get(key);
          if (m !== undefined) assert.ok(m.size > 0, `${name}: header key ${key} is present but empty`);
        }
      }
      for (const { part: p } of everyPart(fixture)) {
        for (const key of [11]) {
          const m = p.get(key);
          if (m !== undefined) assert.ok(m.size > 0, `${name}: part ${p.get(0)} key ${key} is present but empty`);
        }
      }
    }
  });
});

describe("fixtures", () => {
  // Both fields cover the *uncompressed* payload, so this only holds where the
  // stored bytes are the payload. A `zstd` part is supposed to match neither,
  // which is why it is skipped rather than accommodated.
  it("hashes every uncompressed part payload with its own sha256", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { part: p } of everyPart(fixture)) {
        if (!(p.get(PAYLOAD) instanceof Uint8Array)) continue; // an external ref carries no bytes
        if (p.get(7) !== undefined) continue;
        assert.ok(sha256(p.get(PAYLOAD)).equals(p.get(SHA256).value), `${name}: part ${p.get(0)} sha256 matches`);
        assert.equal(p.get(8), undefined, `${name}: part ${p.get(0)} carries a derivable size`);
      }
    }
  });

  it("keeps a compressed part's stored bytes distinct from its uncompressed size", () => {
    const compressed = [...everyPart(valid["compressed-and-aux"])].filter(({ part: p }) => p.get(7) === "zstd");
    assert.equal(compressed.length, 1, "the fixture carries a zstd part");
    const p = compressed[0].part;
    assert.notEqual(p.get(8), p.get(PAYLOAD).length, "size is the uncompressed length, not the stored one");
    assert.ok(!sha256(p.get(PAYLOAD)).equals(p.get(SHA256).value), "sha256 is over the uncompressed bytes");
  });
});
