# Conformance corpora

Encoded test cases for the specifications in this repository, one directory per spec, meant to be run by any
implementation in any language.

| Spec                                                                                     | Corpus                                   |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| [Universal Saves Format](https://docs.1retro.com/specifications/universal-saves-format/) | [`universal-saves/`](./universal-saves/) |

Each corpus is generated from the JavaScript fixtures under `test/` and committed, so running one needs nothing but a
CBOR decoder and a JSON parser. They are meant to be vendored: copy a directory into an implementation, pin the
`spec_version` it records, and re-copy when that spec moves.

## Layout

```text
<spec>/README.md            what this corpus covers, and what it cannot
<spec>/manifest.json
<spec>/valid/<name>.cbor    items a conforming decoder MUST accept
<spec>/invalid/<name>.cbor  items a conforming decoder MUST reject
```

`manifest.json` names the spec version the corpus was built from and carries one entry per case:

```json
{
  "name": "part-sha256-wrong-length",
  "expect": "invalid",
  "file": "invalid/part-sha256-wrong-length.cbor",
  "sha256": "…",
  "note": "A part's sha256 is exactly 32 bytes; the spec pins the algorithm, so a shorter digest is a different algorithm smuggled in without its tag."
}
```

The `note` is why the case exists. When an implementation fails one, that sentence is the thing to read first.

## Running one

For each case, decode `file` and compare the outcome to `expect`. The `sha256` is over the file's bytes, so a vendored
copy can be checked for corruption without re-encoding anything.

**`invalid` means "this spec rejects it", not "this is unparseable".** Most such cases are well-formed CBOR carrying
something a spec forbids: an unknown key, a name in the wrong grammar, a digest of the wrong length. A decoder that only
checks CBOR syntax will accept nearly all of them, and pass for the wrong reason.

**`rejected_by` says which layer should catch it**, which is what you want to know when one fails:

| `rejected_by` | Caught by                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `schema`      | the spec's CDDL, or an equivalent structural check                                             |
| `determinism` | the encoding rules: definite lengths, preferred heads, key and array order, text normalisation |
| `structure`   | a rule needing a look inside a payload, or a comparison across items                           |

Only the first is checkable by a schema validator. Everything marked `determinism` or `structure` **validates against
the CDDL and is malformed anyway**, because CDDL describes the decoded data model: it sees neither the encoding beneath
it nor anything inside a byte string. An implementation that ports the schema and stops there will accept those cases
and compute content hashes nobody else agrees with. They are the reason this corpus exists rather than just the schema.

**A green run is not full coverage.** Valid cases prove a decoder accepts what it must; they cannot prove properties
that no single file expresses. Each corpus README says which ones those are and how to test them directly.

## Adding a case

Add it to that spec's fixtures with a comment saying what it pins, then run `npm run conformance`. The comment becomes
the `note`, and a case without one fails the test suite.

Do not edit anything under these directories by hand. `test/conformance.test.js` regenerates every corpus in memory and
compares it byte for byte, so a hand edit shows up as a failure rather than as a silent divergence from the fixtures.
