// Each extension key against its own schema, plus the one thing the bundle
// schema can still say about them: that carrying any of these leaves a bundle
// valid, since an extension value is `any` there.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { skip, harness } from "../cddl.js";
import { everyPart, map } from "../cbor.js";
import { bundle, part, valid as validBundles } from "../bundles.js";
import { extensions } from "./fixtures.js";

const BUNDLE_SCHEMA = "src/content/docs/specifications/universal-saves-format.cddl";

describe("extension schemas", { skip }, () => {
  for (const [key, { schema, valid, invalid }] of Object.entries(extensions)) {
    describe(key, () => {
      let h;
      before(() => (h = harness(schema)));
      after(() => h.cleanup());

      it("parses, and generates an instance from itself", () => {
        const run = h.generate();
        assert.equal(run.status, 0, run.stderr);
      });

      // A page that documents a shape and a schema that checks it are only
      // worth having if the page actually renders the schema.
      it("is the schema its page renders", () => {
        const page = readFileSync(schema.replace(/\.cddl$/, ".md"), "utf8");
        assert.match(page, new RegExp(`\`\`\`cddl file=\\./${key.replaceAll(".", "\\.")}\\.cddl`));
      });

      describe("accepts", () => {
        for (const [name, value] of Object.entries(valid)) {
          it(name, () => {
            const run = h.validate(h.writeItem(`${key}-${name}`, value));
            assert.equal(run.status, 0, `expected valid, got: ${run.stdout}${run.stderr}`);
          });
        }
      });

      describe("rejects", () => {
        for (const [name, value] of Object.entries(invalid)) {
          it(name, () => {
            const run = h.validate(h.writeItem(`${key}-${name}`, value));
            assert.equal(run.status, 1, "expected the schema to reject this value");
          });
        }
      });
    });
  }

  // Extension values inside the bundle fixtures are `any` to the bundle schema,
  // so nothing else checks them against the schema of the key they sit under.
  // That is how a key can end up documented with one shape and used with
  // another, which is exactly what happened to the Forge key: the
  // format's own example carried integer fields while its page declared text
  // ones, and the two never met because each corpus tested the other's absence.
  describe("as used by the bundle fixtures", () => {
    const everyMap = function* (b) {
      yield b.value[0];
      for (const { part: p, bundle: inner } of everyPart(b)) {
        yield p;
        if (inner) yield* everyMap(inner);
      }
    };

    const used = [];
    for (const [name, fixture] of Object.entries(validBundles)) {
      for (const m of everyMap(fixture)) {
        for (const [key, value] of m) {
          if (typeof key === "string" && extensions[key]) used.push({ name, key, value });
        }
      }
    }

    it("uses at least one extension key somewhere", () => {
      assert.ok(used.length > 0, "no bundle fixture carries a catalogued extension key");
    });

    for (const [i, { name, key, value }] of used.entries()) {
      it(`${name} carries a ${key} its own schema accepts`, () => {
        const h = harness(extensions[key].schema);
        try {
          const run = h.validate(h.writeItem(`used-${i}`, value));
          assert.equal(run.status, 0, `${name}'s ${key} value: ${run.stdout}${run.stderr}`);
        } finally {
          h.cleanup();
        }
      });
    }
  });

  // The composition test. Every key above rides in a real bundle at once, and
  // the bundle schema has to accept the lot without knowing any of them.
  describe("carried in a bundle", () => {
    let h;
    before(() => (h = harness(BUNDLE_SCHEMA)));
    after(() => h.cleanup());

    const header = new Map([[1, "gba"]]);
    for (const [key, { valid }] of Object.entries(extensions)) {
      header.set(key, Object.values(valid)[0]);
    }

    it("accepts a header carrying every extension key at once", () => {
      const run = h.validate(h.writeItem("all-extensions", bundle(header, [part()])));
      assert.equal(run.status, 0, `expected valid, got: ${run.stdout}${run.stderr}`);
    });

    it("accepts a part carrying them too, since both maps take the same keys", () => {
      const extras = new Map(Object.entries(extensions).map(([k, { valid }]) => [k, Object.values(valid)[0]]));
      const run = h.validate(h.writeItem("part-extensions", bundle(map({ 1: "gba" }), [part({ extra: extras })])));
      assert.equal(run.status, 0, `expected valid, got: ${run.stdout}${run.stderr}`);
    });
  });
});
