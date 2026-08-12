// The nesting rules, which CDDL cannot reach because it never looks inside a
// byte string. A `bundle` part's payload is an encoded bundle, so everything
// the spec says about it has to be checked by decoding those bytes back.
//
// These tests take care not to be circular. Asserting that the fixture's
// declared sha256 matches a hash of the fixture's own payload would only prove
// that the helper which built both used the same buffer twice. What is checked
// instead is that the bytes sitting in the encoded card, found by searching for
// them, decode as a bundle and hash to the value the outer part declares.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decode, encode, encodedKeyLayout, everyPart, map, sha256 } from "./cbor.js";
import { bundle, nested, part, ps1Card, ps2Card, valid } from "./bundles.js";

const BUNDLE_TAG = 827539798;
const PAYLOAD = -1;
const ENCODING = 7;
const SHA256 = 9;
const GAME = 11;
const SYSTEM = 12;

const nestedEntries = (fixture) => [...everyPart(fixture)].filter((e) => e.kind === "bundle" && e.bundle);

describe("nested bundles", () => {
  it("carries a payload that decodes as a saves-file", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { bundle: inner } of nestedEntries(fixture)) {
        assert.equal(inner.number, BUNDLE_TAG, `${name}: inner payload carries the bundle tag`);
        assert.equal(inner.value.length, 2, `${name}: inner bundle is a 2-element array`);
      }
    }
  });

  it("is extractable as a byte slice, and that slice is the save", () => {
    const bytes = encode(ps1Card);

    for (const { part: p } of nestedEntries(ps1Card)) {
      const payload = p.get(PAYLOAD);
      const at = bytes.indexOf(payload);
      assert.ok(at > 0, `save ${p.get(0)}'s bundle appears verbatim in the card`);

      const sliced = bytes.subarray(at, at + payload.length);
      assert.equal(decode(sliced).number, BUNDLE_TAG, "the slice is a bundle on its own");
      assert.ok(sha256(sliced).equals(p.get(SHA256).value), "and hashes to what the card says it does");
    }
  });

  it("re-encodes to the same bytes, so the hash is a content hash", () => {
    for (const { part: p, bundle: inner } of nestedEntries(ps2Card)) {
      assert.ok(encode(inner).equals(p.get(PAYLOAD)), "decode then encode is the identity");
    }
  });

  it("is normalized: every inner part is uncompressed and embedded", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { part: p, depth } of everyPart(fixture)) {
        if (depth === 0) continue;
        assert.equal(p.get(ENCODING), undefined, `${name}: inner part ${p.get(0)} is uncompressed`);
        assert.ok(p.get(PAYLOAD) instanceof Uint8Array, `${name}: inner part ${p.get(0)} embeds its payload`);
      }
    }
  });

  it("never nests deeper than the cap of 2", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { depth } of everyPart(fixture)) {
        assert.ok(depth <= 2, `${name}: depth ${depth} exceeds the cap of 2`);
      }
    }
  });

  it("reaches all three tiers on the collection fixture", () => {
    const depths = new Set([...everyPart(valid.collection)].map((e) => e.depth));
    assert.deepEqual([...depths].sort(), [0, 1, 2], "collection, card and save are all present");
  });

  it("leaves a deeper nesting visible to a decoder that wants to reject it", () => {
    const overDeep = bundle(new Map(), [nested(valid.collection, { id: 0 })]);

    const depths = [...everyPart(overDeep)].map((e) => e.depth);
    assert.equal(Math.max(...depths), 3, "the cap is enforceable, not merely stated");
  });

  // The index copy is the one thing here that can rot silently: nothing breaks
  // at encode time if it disagrees with the header it claims to summarise.
  it("carries a `system` index matching the bundle it wraps", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { part: p, bundle: inner } of nestedEntries(fixture)) {
        assert.equal(p.get(SYSTEM), inner.value[0].get(1), `${name}: entry ${p.get(0)}'s system index matches`);
      }
    }
  });

  // Entry 1's keys necessarily sit after entry 0's blob, since parts serialize
  // in order, so the property is per-entry rather than file-wide: each entry's
  // index data comes before its own payload. That is what lets a consumer list
  // a collection by reading part maps and skipping blobs rather than decoding
  // them.
  it("lets a collection be listed without decoding an entry", () => {
    for (const p of valid.collection.value[1]) {
      const { offsets } = encodedKeyLayout(p);
      for (const key of [GAME, SYSTEM]) {
        if (!p.has(key)) continue;
        assert.ok(offsets.get(key) < offsets.get(PAYLOAD), `entry ${p.get(0)}: key ${key} precedes its own payload`);
      }
    }
  });

  it("does not descend into a thin entry, which has no bytes to descend into", () => {
    const entries = [...everyPart(valid["thin-card"])];
    assert.equal(entries.length, 1, "the referenced bundle contributes no parts");
    assert.equal(entries[0].bundle, undefined);
    assert.ok(entries[0].part.get(PAYLOAD) instanceof Map, "the payload is an external reference");
  });
});

// The bug the flat model had, pinned so it cannot come back: a card holds
// several saves for one game, and nothing in the game map tells them apart.
describe("several saves for one game", () => {
  const ff7 = nestedEntries(ps1Card).filter(({ part: p }) => p.get(GAME)?.get(3) === "SCUS-94163");

  it("keeps them as separate saves despite identical game maps", () => {
    assert.equal(ff7.length, 2);
    assert.ok(
      encode(ff7[0].part.get(GAME)).equals(encode(ff7[1].part.get(GAME))),
      "the game maps really are byte-identical, which is what broke the flat model",
    );
  });

  it("tells them apart by slot and path", () => {
    assert.notEqual(ff7[0].part.get(4), ff7[1].part.get(4));
    assert.notEqual(ff7[0].part.get(3), ff7[1].part.get(3));
  });

  it("gives each one its own content hash", () => {
    assert.ok(!ff7[0].part.get(SHA256).value.equals(ff7[1].part.get(SHA256).value));
  });
});
