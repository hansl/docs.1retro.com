# Style guide

How we write in this repository.
The goal is documentation that is easy to read, easy to review, and consistent across many authors.

## One sentence per line

Write each sentence on its own line.
Do not wrap paragraphs at a fixed column width, and do not put several sentences on one line.

A paragraph is a run of one-sentence lines with no blank line between them.
Blank lines still separate paragraphs as usual, so the rendered output is unchanged.

This convention is sometimes called [semantic line breaks](https://sembr.org) or ventilated prose.
We use it because it makes diffs and reviews far better:

- A reworded sentence shows up as a one-line change, not a reflowed paragraph.
- Review comments attach to a single sentence instead of a wall of text.
- Moving or deleting a sentence is a clean line operation.

For a long sentence with internal clauses, you may break after a clause boundary (a comma, semicolon, or colon) so no single line runs too wide.
Keep the breaks at natural pauses rather than at an arbitrary column.

```markdown
Good:
The bundle is a single CBOR value.
Two encoders given the same input produce identical bytes.

Avoid:
The bundle is a single CBOR value. Two encoders given the same input produce identical bytes.

Avoid:
The bundle is a single CBOR value. Two encoders given the same input
produce identical bytes, wrapped at 80 columns.
```

## Voice and tone

Write plainly and concretely.
Prefer short sentences, concrete examples, and the active voice.

Address the reader directly in guides ("you").
Describe behavior neutrally in specifications.

Avoid filler, hype, and emoji.
Say what a thing does, not how exciting it is.

Avoid AI sounding sections.
Write everything in your words.

## Specifications

Use the RFC 2119 keywords MUST, SHOULD, and MAY deliberately, and only when you mean them.
Reserve them for normative requirements, not for emphasis.

Define a term before you rely on it.
When a field or value has a fixed vocabulary, list every allowed value.

Note the version a feature belongs to when it matters for compatibility.

## Markdown conventions

- Do not write a top-level `#` heading in the body.
  Starlight sets the page title from frontmatter, so body headings start at `##`.
- Put a language tag on every fenced code block, such as `sh`, `rust`, or `json`.
- Use reference-free inline links, and prefer root-relative links between pages (`/specifications/...`).
- Keep tables readable in source; align columns when it is cheap, but do not fight the formatter over it.

## Markdown and MDX

Write pages as plain Markdown (`.md`) by default.
Use MDX (`.mdx`) only when a page needs components such as cards, tabs, or steps.

Keep specifications in plain `.md` so they stay easy to read in the repo and to edit without the toolchain.
When you do reach for `.mdx`, import Starlight's components rather than hand-writing HTML.

## Frontmatter

Both `.md` and `.mdx` pages must start with a YAML frontmatter block, fenced by `---`.

Every content page needs a `title`.
Add a `description` for anything a reader might land on from search.

Use `sidebar.order` to pin a section's landing page to the top; otherwise pages sort alphabetically.

## File naming

Name files in `kebab-case`, matching the URL slug you want.
A page at `src/content/docs/specifications/universal-saves-format.md` is served at `/specifications/universal-saves-format/`.
