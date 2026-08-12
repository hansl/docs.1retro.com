// Conformance against the bundle CDDL schema, using the RFC 8610 reference
// tool. The tool itself, and the trap in how it reports failures, are in
// ./cddl.js.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

import { cddl, skip, harness } from "./cddl.js";
import { valid, invalid, malformedDeterminism, malformedStructure } from "./bundles.js";

const SCHEMA = "src/content/docs/specifications/universal-saves-format.cddl";

describe("CDDL schema", { skip }, () => {
  let h;
  before(() => (h = harness(SCHEMA)));
  after(() => h.cleanup());

  it("parses, and generates an instance from itself", () => {
    const run = h.generate();
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /^827539798\(/, "generated instance carries the bundle tag");
  });

  describe("accepts", () => {
    for (const [name, bundle] of Object.entries(valid)) {
      it(name, () => {
        const run = h.validate(h.writeItem(name, bundle));
        assert.equal(run.status, 0, `expected valid, got: ${run.stdout}${run.stderr}`);
      });
    }
  });

  describe("rejects", () => {
    for (const [name, bundle] of Object.entries(invalid)) {
      it(name, () => {
        const run = h.validate(h.writeItem(name, bundle));
        assert.equal(run.status, 1, "expected the schema to reject this bundle");
      });
    }
  });

  // Asserted the way round it looks wrong on purpose. Every bundle below is
  // malformed, and the schema takes all of them: CDDL validates the decoded
  // data model, so it sees neither the encoding rules beneath it nor anything
  // inside a payload. Passing the schema is therefore not the same as
  // conforming, and this is the test that says so out loud. If a future cddl
  // release starts rejecting one, that is good news and this is what tells you.
  describe("cannot see the determinism or structure rules", () => {
    for (const [name, raw] of Object.entries({ ...malformedDeterminism, ...malformedStructure })) {
      it(`accepts ${name}, which is malformed`, () => {
        const run = h.validate(h.writeItem(name, raw));
        assert.equal(run.status, 0, "a schema that rejected this would be checking more than CDDL can");
      });
    }
  });

  it("reports a missing file the same way it reports an invalid one", () => {
    // Pinned deliberately: this is why writeItem asserts the file exists. If a
    // future cddl distinguishes the two, this test fails and the guard in
    // writeItem can be relaxed.
    const run = h.validate(`${h.dir}/does-not-exist.cbor`);
    assert.equal(run.status, 1);
  });

  it("finds the tool the same way the extension suite does", () => {
    assert.ok(cddl, "a cddl binary was located");
  });
});
