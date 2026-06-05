# Contributing

Thanks for helping improve the 1Retro docs.
Corrections, clarifications, and new specs or guides are all welcome.

## How to propose a change

- **Small fixes** (typos, broken links, clearer wording): open a pull request directly.
- **Larger changes** (a new spec, a restructured guide, a behavioral change to an existing format): open an issue first so we can agree on the shape before you write it.

You do not need the site toolchain to contribute.
Specs and guides are plain Markdown, so editing prose is just editing a `.md` file.
The richer Starlight components are reserved for places where a maintainer opts into them.

## LLMs and AI

The usage of LLM is welcome, with the following caveat:

- You need to understand what you've written.
  You will be asked questions and clarifications on what you (or your LLM) wrote, and it is expected to have you answer it.
- We reserve the right to close and dismiss any issue or pull request that do not cross the bar.
  This includes (but not limited to) content that we thing should not be LLM generated or sloppy.

## Style

See [STYLE.md](./STYLE.md) for the full guide.
The essentials:

- **Write one sentence per line.**
  Do not wrap paragraphs at a fixed width; this keeps diffs and review comments scoped to a single sentence.
  Readers are expected to use soft wordwrap or rendered view.
- Write plainly and concretely, preferring short sentences and concrete examples.
- For specifications, be precise about what a producer or consumer MUST, SHOULD, and MAY do.
  Define a term before you lean on it.
- Match the voice of the surrounding document rather than imposing a new one.

## Sign-off (DCO)

This repo uses the [Developer Certificate of Origin](https://developercertificate.org).
It is a lightweight statement that you wrote the contribution, or otherwise have the right to submit it under this repository's licenses.
There is no CLA.

Add a `Signed-off-by` line to each commit by committing with `-s`:

```sh
git commit -s -m "Clarify the parts cap in the saves format"
```

That appends a line like:

```text
Signed-off-by: Your Name <you@example.com>
```

using your `git config` name and email, which must be your real identity.

## Licensing of contributions

By contributing, you agree that your documentation content is licensed under [CC BY 4.0](./LICENSE-CONTENT) and any code samples under the [MIT License](./LICENSE-CODE), consistent with the rest of the repository.
