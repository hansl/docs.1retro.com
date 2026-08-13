// Locating and driving the RFC 8610 reference tool, shared by the schema tests
// for the bundle format and for each extension key.
//
// Everything here skips when `cddl` is not installed, so the suite stays
// runnable with no Ruby toolchain. To run those tests: `gem install cddl`.
//
// One trap worth knowing about, and the reason `writeItem` checks that each
// fixture exists before anyone draws a conclusion: `cddl validate` exits 1 both
// for an instance that fails the schema and for a file it could not open. A
// negative test that only looks at the exit code therefore passes just as
// happily when the fixture was never written at all.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, statSync, accessSync, constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { encode } from "./cbor.js";

// Homebrew's Ruby installs gem binaries outside the default PATH, so fall back
// to asking RubyGems where it puts them rather than guessing a version folder.
export function findCddl() {
  if (process.env.CDDL_BIN) return process.env.CDDL_BIN;

  const onPath = spawnSync("which", ["cddl"], { encoding: "utf8" });
  if (onPath.status === 0) return onPath.stdout.trim();

  for (const gem of ["gem", "/opt/homebrew/opt/ruby/bin/gem", "/usr/local/opt/ruby/bin/gem"]) {
    const dir = spawnSync(gem, ["environment", "gemdir"], { encoding: "utf8" });
    if (dir.status !== 0) continue;
    const candidate = join(dir.stdout.trim(), "bin", "cddl");
    // Tested for executability rather than by running it: `cddl --version`
    // prints the version and then exits 64, so an exit-code probe rejects a
    // perfectly good install.
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export const cddl = findCddl();
export const skip = cddl ? false : "cddl not installed; run `gem install cddl` to enable these";

// A scratch directory plus the two operations every schema test needs. Call in
// a `before`, and hand the returned `cleanup` to an `after`.
export function harness(schema) {
  const dir = mkdtempSync(join(tmpdir(), "1saves-"));

  const writeItem = (name, value) => {
    const file = join(dir, `${name.replaceAll("/", "-")}.cbor`);
    writeFileSync(file, encode(value));
    assert.ok(statSync(file).size > 0, `fixture ${name} was written and is non-empty`);
    return file;
  };

  return {
    dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
    writeItem,
    validate: (file) => spawnSync(cddl, [schema, "validate", file], { encoding: "utf8" }),
    generate: () => spawnSync(cddl, [schema, "generate"], { encoding: "utf8" }),
  };
}
