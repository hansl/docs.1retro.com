// The registries reference each other, and nothing at build time notices when
// one drifts from another. A row can name a system slug that does not exist,
// or a slug can quietly stop matching the grammar every vocabulary shares, and
// the site builds and deploys either way because both are just table cells.
//
// This is the same class of gap the extension suite closes for schemas: two
// documents that agree only by convention until something checks.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const REGISTRIES = "src/content/docs/registries";

// Rows of a markdown table, as arrays of trimmed cells. Header separators and
// prose are skipped, so a file's several tables come back as one list.
function rows(markdown) {
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|[\s:-]+\|/.test(l))
    .map((l) =>
      l
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
    );
}

// Cells under a named header, across every table in the file that has one.
function column(markdown, header) {
  const out = [];
  let at = -1;
  for (const cells of rows(markdown)) {
    const found = cells.indexOf(header);
    if (found !== -1) {
      at = found;
      continue;
    }
    if (at !== -1 && cells[at]) out.push(cells[at]);
  }
  return out;
}

const slugs = (cell) => [...cell.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
const read = (name) => readFileSync(`${REGISTRIES}/${name}.md`, "utf8");

// The one grammar every vocabulary in these specifications shares.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("registries", () => {
  const systems = new Set(column(read("systems"), "Slug").flatMap(slugs));

  it("has a plausible number of systems", () => {
    assert.ok(systems.size > 40, `found ${systems.size} system slugs, which suggests the table did not parse`);
  });

  it("gives every system a slug that matches the shared grammar", () => {
    for (const slug of systems) {
      assert.match(slug, SLUG, `system slug ${slug}`);
      assert.ok(slug.length <= 64, `system slug ${slug} is over 64 bytes`);
    }
  });

  // A role is only meaningful against a system, so a role row naming a system
  // that does not exist describes a socket on a machine this project has never
  // heard of.
  it("names only real systems in the roles registry", () => {
    const cited = new Set(column(read("roles"), "System").flatMap(slugs));
    assert.ok(cited.size > 0, "no System column found in roles.md");
    for (const slug of cited)
      assert.ok(systems.has(slug), `roles.md names system \`${slug}\`, which is not registered`);
  });

  it("names only real systems in the cores registry", () => {
    const cited = new Set(column(read("cores"), "Systems").flatMap(slugs));
    assert.ok(cited.size > 0, "no Systems column found in cores.md");
    for (const slug of cited)
      assert.ok(systems.has(slug), `cores.md names system \`${slug}\`, which is not registered`);
  });

  it("gives every core a slug that matches the shared grammar", () => {
    for (const cell of column(read("cores"), "Slug")) {
      for (const slug of slugs(cell)) assert.match(slug, SLUG, `cores.md: ${slug}`);
    }
  });

  // A role cell holds either a slug or a numbered-socket prefix. A prefix ends
  // in `-` and is not itself a slug, so the check is that appending a number
  // yields one: that is exactly the claim the registry makes about it.
  it("gives every role either a valid slug or a usable prefix", () => {
    const cells = [...new Set([...column(read("roles"), "Role"), ...column(read("roles"), "Prefix")])];
    assert.ok(cells.length > 0, "no Role or Prefix column found in roles.md");
    for (const cell of cells) {
      for (const name of slugs(cell.replace(/`([a-z0-9-]*-)`/g, "`$1PREFIX`"))) {
        if (name.endsWith("-prefix")) {
          const prefix = name.slice(0, -"prefix".length);
          assert.match(`${prefix}1`, SLUG, `roles.md: prefix ${prefix} does not form a slug`);
        } else {
          assert.match(name, SLUG, `roles.md: ${name}`);
        }
      }
    }
  });
});
