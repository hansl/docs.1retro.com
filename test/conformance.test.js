// Every committed conformance corpus has to be what its fixtures currently
// produce. Without this, `conformance/` silently describes whatever a spec
// looked like the last time somebody remembered to regenerate it, which is
// worse than having no corpus at all: an implementation would pass a suite
// that no longer matches the format.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

import { SPECS, corpus, serialize, outDir } from "../scripts/build-conformance.js";
import { sha256 } from "./cbor.js";

const REGENERATE = "run `npm run conformance` to update the committed corpora";

describe("conformance corpora", () => {
  for (const spec of SPECS) {
    describe(spec.slug, () => {
      const dir = outDir(spec);
      const expected = serialize(spec);
      const { manifest } = corpus(spec);

      it("is committed", () => {
        assert.ok(existsSync(join(dir, "manifest.json")), `${dir}/manifest.json is missing; ${REGENERATE}`);
      });

      it("matches what the fixtures produce, byte for byte", () => {
        for (const [path, bytes] of expected) {
          assert.ok(readFileSync(join(dir, path)).equals(bytes), `${dir}/${path} is stale; ${REGENERATE}`);
        }
      });

      it("carries no case the fixtures no longer define", () => {
        for (const sub of ["valid", "invalid"]) {
          for (const file of readdirSync(join(dir, sub))) {
            assert.ok(expected.has(`${sub}/${file}`), `${dir}/${sub}/${file} is orphaned; ${REGENERATE}`);
          }
        }
      });

      // A consumer vendoring a corpus checks these rather than re-encoding, so
      // a wrong digest would send them hunting for a bug in their own decoder.
      it("records a digest that matches each file", () => {
        for (const entry of manifest.cases) {
          const bytes = readFileSync(join(dir, entry.file));
          assert.equal(sha256(bytes).toString("hex"), entry.sha256, `${entry.file}: manifest digest disagrees`);
        }
      });

      it("explains every case, since a bare pass/fail teaches an implementer nothing", () => {
        const bare = manifest.cases.filter((c) => !c.note).map((c) => c.name);
        assert.deepEqual(bare, [], `these cases need a comment above them in ${spec.fixtures}`);
      });

      it("names the spec version it was built from", () => {
        assert.match(manifest.spec_version, /^\d+\.\d+$/);
      });

      // The parent README indexes the corpora, and a spec whose row is missing
      // is one nobody vendoring from the top level will find.
      it("is listed in the parent README", () => {
        const index = readFileSync(join("conformance", "README.md"), "utf8");
        assert.match(index, new RegExp(`\\./${spec.slug}/`), `add a row for ${spec.slug} to conformance/README.md`);
      });
    });
  }
});
