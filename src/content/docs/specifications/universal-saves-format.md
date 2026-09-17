---
title: Universal Saves Format
description: A portable, self-describing CBOR container for retro console save files and everything attached to them.
sidebar:
  label: Overview
  badge:
    text: v0.2
    variant: caution
---

This is version 0.2 of this specification, and it is not yet stabilized. Expect breaking changes; until 1.0 they happen
in place, under the same bundle tag.

## Changelog

Newest first. Nothing in a file says which version wrote it before 1.0, so this list is the only record that the rules
moved. A version covers the format, the [common types](/specifications/common-types/) it leans on, and the
[extension keys](/specifications/extensions/) these specifications own; a key belonging to a producer changes on that
producer's schedule instead.

- **0.2**, 2026-09-14. Breaking: shapes are explicit. A bundle names one in required header key 0, and `created_at`
  moved to key 6.
- **0.1**, 2026-08-12. First published version.

## Context

A retro save is a bare binary dump with no agreed way to say what game it belongs to, what wrote it, or what else
belongs with it. Every emulator invented its own convention: the game is implied by a filename or a per-game directory,
a clock reading or a completion percentage has nowhere to live beside the bytes, save states and screenshots become
sidecar files named differently by every tool, and multi-part media like N64 controller paks or PS1 memory cards each
got their own layout.

This document specifies one portable container file, extension `.1saves`, holding typed binary parts plus whatever
identifying context and interpretation a producer has. Everything but the parts is optional: a system slug and a chunk
of bytes is a valid bundle. It is for moving saves around, not for an emulator to read in place.

The encoding is CBOR ([RFC 8949](https://datatracker.ietf.org/doc/html/rfc8949)), which keeps bytes as bytes and has a
defined [deterministic form](https://datatracker.ietf.org/doc/html/rfc8949#name-deterministically-encoded-c).

## Format Overview

- **Extension**: `.1saves`
- **MIME**: `application/vnd.1saves+cbor`
- **Framing**: the whole file is a single CBOR value: the array envelope wrapped in one application CBOR tag. There are
  no non-CBOR bytes, so any conforming CBOR reader can walk the structure even without knowing the application tag.

  ```text
  [0..5]   0xDA 0x31 0x53 0x41 0x56  bundle tag #827539798, ASCII "1SAV" from byte 1
  [5..]    CBOR array envelope
  ```

  - The envelope CBOR tag is `827539798` (`0x31534156`), whose 5-byte encoding is the file magic: `1SAV` in a hex dump,
    starting at byte 1. Byte 0 is the tag's head byte `0xDA`. Reading as ASCII magic follows
    [RFC 9277](https://datatracker.ietf.org/doc/rfc9277/), except that this format omits the self-describe tag #55799
    that convention puts in front, so the magic sits at byte 0. A bundle never carries #55799.
  - The major version lives in the tag number. A future breaking format uses a different tag, so an old decoder rejects
    a new-major file on its own, with no separate version field to check.
  - Minor, additive changes happen _inside_ the bundle, as new optional integer keys in the header or part maps; see
    [Additive integer keys](#additive-integer-keys).
  - The only other tags a bundle carries are tag 1 on an epoch field and the
    [hash value](/specifications/common-types/hash-value/) tags in `rom_hashes`.

- **Determinism**: RFC 8949 section 4.2, with no deviations from it. Definite-length items, preferred serialization for
  every head (so integer map keys and floats both encode shortest), map keys sorted bytewise on their encodings, no
  duplicate keys. A generic deterministic-CBOR validator accepts a conforming bundle as-is, with no exceptions to
  unteach it.

  Three further rules sit on top, and a generic validator will not check them: text is in NFC, parts are sorted by
  ascending `id`, and `rom_hashes` entries follow the ordering rule on
  [hash values](/specifications/common-types/hash-value/). What deterministic encoding does not settle at all is a data
  model that can say one thing two ways; see [One encoding per bundle](#one-encoding-per-bundle).

### One encoding per bundle

A bundle's [content hash](/specifications/bundle/#content-hash-and-file-hash) is the identifier a store keys on and the
value a [`bundle` part](/specifications/bundle/#nested-bundles) carries, so it has to be a function of what the bundle
says and not of how a producer chose to say it. Deterministic encoding gets most of the way: it fixes how a given value
is written. What it cannot fix is a format that offers two ways to say the same thing.

So this one offers one, everywhere:

- **Nothing is absence.** An optional container has exactly one encoding of empty, and that is not being there. An empty
  `game`, `game_id` or `rom_hashes` is malformed, and so is an empty `parts` array.
- **A default is absence.** Where a field has a default, the default is written by leaving the key out, and spelling it
  out is malformed. A part's [`kind`](/specifications/bundle/#part-kinds) means `save` when absent, its
  [`role`](/specifications/bundle/#part-map) means `primary`, its [`path`](/specifications/bundle/#part-map) means the
  role is the whole address, and its [`encoding`](/specifications/bundle/#part-map) means `"none"`.
- **One type per value.** A field that could take an integer or a float takes the integer, because
  [RFC 8949 section 4.2.2](https://datatracker.ietf.org/doc/html/rfc8949#name-additional-deterministic-en) declines to
  choose between them. Every epoch field here is whole seconds.

Each is a rule a producer follows and a decoder enforces. Breaking one is malformed rather than merely unusual, because
a consumer that accepted both spellings would compute two content hashes for one save.

### Additive integer keys

Integer keys belong to this specification, in every map it defines. Text keys belong to producers; that is the
[extension](#extensions) mechanism, and the two never meet.

So a decoder that meets an integer key it does not recognize MUST ignore it and round-trip it unchanged. There is only
one thing an unfamiliar integer key can be: a field a later minor version assigned after this decoder shipped.

A later minor version assigns the next free key in whatever map needs it. A change that cannot be expressed that way
takes a new bundle tag and a new major version, which old decoders reject on the tag alone.

### Names

Wherever this format names a category, the field says which of three kinds of name it holds, and there is nothing more
to it than that.

- **Free-form text**, where the value is a human's to write: a `description`, a `rom_filename`.
- **A [slug](/specifications/common-types/slug/)**, where the value comes from a list this spec or a registry keeps: a
  `system`, a card `format`, a `role`, a `device_kind`. A producer takes a name from the list rather than inventing one,
  and the list grows by a PR.
- **A [reverse-DNS name](/specifications/common-types/reverse-dns-name/)**, where the value is the producer's own to
  mint with nobody to ask: an extension key, a source's `app`, a part's `kind` it invented.

The two named types are normative and their pages carry the rules, including what a consumer does with a name it has
never seen. Each field in [Bundle](/specifications/bundle/) says which kind it holds.

## Shapes

[`shape`](/specifications/bundle/#0-header-map) names one of four, and each has a document that defines what its parts
mean:

| Shape                                        | The bundle is                       | Its parts are                                       |
| -------------------------------------------- | ----------------------------------- | --------------------------------------------------- |
| [`save`](/specifications/saves/)             | one game's state                    | the regions or files that state is made of          |
| [`card`](/specifications/cards/)             | one memory card                     | one `bundle` part per save, and the card's own      |
| [`device`](/specifications/device/)          | one console's storage, read whole   | one `bundle` part per component, each with a `role` |
| [`collection`](/specifications/collections/) | several cards and saves in one file | one `bundle` part per card or save                  |

A decoder reads `shape` rather than inferring it from what the header happens to carry. The vocabulary is spec-owned,
and a later minor version assigns a new one with a document to go with it.

A shape is a [slug](/specifications/common-types/slug/) and follows that page's rules, which is what keeps a new one
additive. A decoder meeting a shape it does not know **MUST** parse the bundle and round-trip it unchanged, exactly as
it does for an integer key a later version assigned. It **MUST NOT** guess what the shape means, and **MUST** decline
any operation that depends on knowing: walking the parts, restoring a save, rebuilding a card. Refusing to act on a
bundle is not the same as rejecting it, and only the second loses the bytes.

The schema is the narrower of the two on purpose. It pins the four shapes this version defines, so validating against it
says "this is a conforming 0.2 bundle" rather than "some decoder can read this", the same asymmetry
[Additive integer keys](#additive-integer-keys) describes.

A bundle names its shape and a decoder reads it; what the parts then mean is that shape's document, and
[Bundle](/specifications/bundle/) is where every field those documents refer to is defined.

## Extensions

The spec owns the integer-keyed namespace of every map it defines. Everything else attaches through **extension keys**:
map entries whose key is a text string in [reverse-DNS form](/specifications/common-types/reverse-dns-name/)
(`x.1sav.rtc`, `com.1retro.forge`). This is how a clock reading, parser-extracted gameplay tags, emulator-native
structures and third-party annotations ride along, without the spec needing to know anything about them.

The [header](/specifications/bundle/#0-header-map) and a [`Part`](/specifications/bundle/#part-map) both take them,
flat, alongside their integer keys. The rules:

- An extension key **MUST** be a well-formed reverse-DNS name, and there is no unnamespaced alternative. A producer with
  no domain to reverse takes a name in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree). The
  namespace is the whole of what stops two producers meaning different things by one key.
- **What sits under the key is entirely the producer's.** Any CBOR value of any shape: a map, a text string, a byte
  string, a number. The spec never looks inside one, imposes nothing on it, and the rule that integer keys belong to the
  spec stops at the key.
- Decoders **MUST** round-trip an unknown extension key unchanged, value included. Never drop one just because you don't
  recognize it.
- The integer namespace belongs to the spec, so an integer key is never an extension. Unknown ones are handled by
  [Additive integer keys](#additive-integer-keys).
- A field that becomes first-class moves from an extension key to an integer key in a later minor version.

A producer with several fields to attach SHOULD put a map under one key rather than take a key each. The name is a
namespace, not a field label, so paying for it once buys single-byte integer keys inside a space nobody else can reach:

```text
"com.1retro.forge": { 0: "ff7", 1: { 0: "Aeris", 1: 42 } }
```

Whether a key is [listed](/specifications/extensions/) is a social matter and not a structural one. A catalogued key and
one a producer invented this morning are the same thing on the wire, and no decoder can tell them apart; the catalogue
exists so a producer finds an existing key instead of inventing one that overlaps.

## Out of scope of this specification

The spec deliberately does _not_ cover:

- **Encryption.** The bundle is plaintext CBOR. Confidentiality is the transport's responsibility (TLS) or a separate
  envelope. Unbinding a [bound payload](/specifications/bundle/#bound-payloads) is out too: decryption, where it is even
  possible, needs keys this format does not carry.
- **Compression at the file level.** Compression is per-part, via a part's `encoding` field; the outer file is never
  wrapped in another compression layer.
- **Authentication / signing.** No signatures inside the bundle. If signed bundles are ever needed, they belong in a new
  outer CBOR tag that wraps this one.
- **On-disk canonicalization for emulator save directories.** Devices that natively read `.sav` / `.srm` continue to do
  so; the bundle is for transport and archival, not for in-place emulator consumption.
- **Per-part deduplication across bundles.** Two bundles that share an identical part each carry a full copy.
  Deduplication, if you want it, is a storage-layer concern that works from each part's `sha256`.
- **Migration from any specific legacy save layout.** How a producer or consumer chooses to coexist with raw
  `.sav`/`.srm`/emulator-native formats is a deployment concern, not part of the format.
