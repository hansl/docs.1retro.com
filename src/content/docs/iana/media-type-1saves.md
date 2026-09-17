---
title: application/vnd.1saves+cbor
description: The media type for a Universal Saves Format bundle, as an RFC 6838 registration template.
slug: iana/media-type-1saves
---

The permanent reference for one entry in the IANA **Media Types** registry. Not yet filed.

| Field                           | Value                                                                 |
| ------------------------------- | --------------------------------------------------------------------- |
| Type name                       | application                                                           |
| Subtype name                    | vnd.1saves+cbor                                                       |
| Required parameters             | N/A                                                                   |
| Optional parameters             | N/A                                                                   |
| Encoding considerations         | binary                                                                |
| Interoperability considerations | See below                                                             |
| Published specification         | `https://docs.1retro.com/iana/media-type-1saves/`                     |
| Applications                    | Emulators, cartridge and memory card readers, save managers, archives |
| Fragment identifier             | None defined                                                          |
| Magic number                    | `DA 31 53 41 56` at offset 0                                          |
| File extension                  | `.1saves`                                                             |
| Macintosh file type code        | None                                                                  |
| Intended usage                  | COMMON                                                                |
| Restrictions on usage           | None                                                                  |
| Contact                         | `spec@1retro.com`                                                     |
| Author                          | 1Retro                                                                |
| Change controller               | 1Retro                                                                |

## What it identifies

A portable container for retro console save data: one CBOR document holding a header and an array of typed parts, which
may be one save, one memory card, one console's storage, or a collection of those. The whole file is a single CBOR value
under [tag 827539798](/iana/cbor-tag-827539798/), so a generic CBOR reader can walk it without knowing this format.

## Security considerations

- **Can it carry executable content?** No. A bundle is data: no scripts, no references to external code, nothing a
  consumer is expected to run.
- **What can hostile input cost a decoder?** Nothing it does not agree to spend. A part's declared length, a compressed
  part's expansion and the parts array's count are all claims an attacker can inflate for free, and a consumer is never
  obliged to honour one: it may decline a part, decline to decompress it, or abandon a decompression that outgrows what
  it expected.
- **Does it provide integrity?** Each part carries a SHA-256 of its payload, which detects corruption and substitution
  when a consumer verifies it before use.
- **Does it authenticate?** No. A bundle carries no signature, so an attacker who rewrites a payload rewrites the digest
  beside it. Authenticity comes from the channel a bundle arrived over, never from the bundle.
- **Does it carry personal or identifying data?** It can. `source.fingerprint` is a stable identifier for one device or
  install, and exists so two bundles can be traced to the same producer; a payload may hold a player's name or a save's
  timestamps. A producer that does not want a bundle to be linkable omits `fingerprint`, and a consumer publishing
  bundles treats both it and payload contents as identifying.
- **What does acting on one risk?** Restoring writes to storage a console reads. This format validates no payload
  against any game's expectations, so a malformed save may crash or corrupt the software that loads it.

## Interoperability considerations

The file is deterministically encoded CBOR per RFC 8949 section 4.2 with no exceptions, so two producers building the
same bundle emit the same bytes. Integer map keys belong to the specification and text keys to producers, and a decoder
round-trips both when it does not recognise them, which is what lets a later minor version add fields without breaking
an older reader. A breaking change takes a new CBOR tag, which an old decoder rejects on the tag alone.

## Specification

[Universal Saves Format](/specifications/universal-saves-format/).
