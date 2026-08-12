// Builds the language-neutral conformance corpora from the JavaScript fixtures.
//
// Fixtures are authored as code, because that keeps them readable and lets them
// share helpers. But a corpus only authored in JavaScript can only be run from
// JavaScript, and the point of these cases is that any implementation should
// have to pass them. So this script encodes each one to a `.cbor` file and
// writes a manifest saying which are meant to validate and why.
//
// The output is committed, so a Rust or Go or C++ suite needs no Node to run
// it. `test/conformance.test.js` regenerates in memory and compares, which is
// what stops the committed copy drifting from the fixtures it came from.
//
// One directory per specification. A second spec means a second import and a
// second entry in SPECS; nothing else here is spec-aware.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { encode, sha256 } from "../test/cbor.js";
import { valid, invalid, malformedDeterminism, malformedStructure } from "../test/bundles.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CONFORMANCE = "conformance";

export const SPECS = [
  {
    slug: "universal-saves",
    title: "Universal Saves Format conformance cases",
    fixtures: "test/bundles.js",
    versionFrom: "src/content/docs/specifications/universal-saves-format.md",
    cases: { valid, invalid, malformedDeterminism, malformedStructure },
  },
];

export const outDir = (spec) => join(CONFORMANCE, spec.slug);

// The version is read rather than restated, so a corpus cannot claim to
// describe a spec revision that no longer exists.
function specVersion(spec) {
  const front = readFileSync(join(ROOT, spec.versionFrom), "utf8").split("---")[1] ?? "";
  const badge = front.match(/text:\s*v([\d.]+)/);
  if (!badge) throw new Error(`no version badge found in ${spec.versionFrom}`);
  return badge[1];
}

// Each case's note is the comment written above it in the fixture source. A
// comment introducing a run of cases carries to all of them, which is how the
// source already reads; a blank line ends the run.
function notes(spec) {
  const found = new Map();
  let block = null;
  let carrying = null;

  for (const line of readFileSync(join(ROOT, spec.fixtures), "utf8").split("\n")) {
    const opens = line.match(/^export const (valid|invalid|malformedDeterminism|malformedStructure) = \{/);
    if (opens) {
      block = opens[1];
      carrying = null;
      continue;
    }
    if (block === null) continue;
    if (line === "};") {
      block = null;
      continue;
    }

    if (/^ {2}\/\//.test(line)) {
      carrying = carrying === null ? [] : carrying;
      carrying.push(line.replace(/^ {2}\/\/ ?/, ""));
      continue;
    }
    if (line.trim() === "") {
      carrying = null;
      continue;
    }
    const entry = line.match(/^ {2}(?:"([^"]+)"|([A-Za-z_][\w]*)):/);
    if (entry) found.set(`${block}/${entry[1] ?? entry[2]}`, carrying?.join(" ").trim() || null);
  }
  return found;
}

export function corpus(spec) {
  const note = notes(spec);
  const files = new Map();
  const cases = [];

  // `rejected_by` says which layer of an implementation should catch a case,
  // which is what an implementer wants to know when one of them fails.
  //
  //   schema        the CDDL rejects it
  //   determinism   RFC 8949 4.2, plus NFC text and the ordering rules on top
  //   structure     needs a look inside a payload, or a comparison across parts
  //
  // Only the first is checkable by a validator. Everything in the other two
  // validates against the schema and is malformed anyway, so an implementation
  // that ports the schema and stops there passes them and computes content
  // hashes nobody else agrees with.
  const sets = [
    ["valid", "valid", null],
    ["invalid", "invalid", "schema"],
    ["malformedDeterminism", "invalid", "determinism"],
    ["malformedStructure", "invalid", "structure"],
  ];
  const seen = new Set();
  for (const [block, expect, rejectedBy] of sets) {
    for (const [name, value] of Object.entries(spec.cases[block] ?? {})) {
      const file = `${expect}/${name}.cbor`;
      if (seen.has(file)) throw new Error(`two cases named ${file}`);
      seen.add(file);
      const bytes = encode(value);
      files.set(file, bytes);
      cases.push({
        name,
        expect,
        ...(rejectedBy ? { rejected_by: rejectedBy } : {}),
        file,
        sha256: sha256(bytes).toString("hex"),
        note: note.get(`${block}/${name}`) ?? null,
      });
    }
  }

  const count = (expect) => cases.filter((c) => c.expect === expect).length;
  const manifest = {
    corpus: spec.title,
    spec_version: specVersion(spec),
    generated_from: spec.fixtures,
    counts: { valid: count("valid"), invalid: count("invalid") },
    cases,
  };

  return { manifest, files };
}

export function serialize(spec) {
  const { manifest, files } = corpus(spec);
  const out = new Map(files);
  out.set("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
  return out;
}

function main() {
  for (const spec of SPECS) {
    const dir = join(ROOT, outDir(spec));
    const written = serialize(spec);
    for (const sub of ["valid", "invalid"]) rmSync(join(dir, sub), { recursive: true, force: true });
    for (const [path, bytes] of written) {
      const full = join(dir, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, bytes);
    }
    const bare = corpus(spec).manifest.cases.filter((c) => !c.note).length;
    console.log(`${spec.slug}: ${written.size - 1} cases${bare ? `, ${bare} without a note` : ""}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
