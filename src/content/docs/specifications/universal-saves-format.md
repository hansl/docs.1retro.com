---
title: "Universal Saves Format (.1saves)"
description: A portable, self-describing CBOR container for retro console save files and everything attached to them.
sidebar:
  badge:
    text: v0.1
    variant: caution
---

This is version 0.1 of this specification, and it is not yet stabilized.
Expect breaking changes; until 1.0 they happen in place, under the same bundle tag.

## Context

Retro consoles have had battery-backed saves for almost forty years,
and there has never been a portable, self-describing format for them.
What exists instead is a pile of bare binary dumps, with a different convention for every emulator:

- **Identity.**
  A `.sav`, `.srm`, `.mcr`, `.fls` or `.sa1` file is just raw SRAM, sometimes with a little metadata in front.
  The game it belongs to is implied by the ROM filename sitting next to it, or by the emulator's per-game directory layout, or by nothing at all.
  Move the file somewhere else and that link is gone.
- **Metadata.**
  Emulators and tools are constantly computing things like the real-time clock value (Pokemon Gold/Silver, Animal Crossing), the region and revision, the last time you played, the player's name, or completion percentage.
  There is no agreed place to keep any of it next to the bytes.
- **Related files.**
  Save states, screenshots, thumbnails, rewind buffers and per-game configuration each become a separate sidecar file, named differently by every emulator.
  Keeping them together with the save means a zip, a tarball, or some emulator's own container.
- **Multi-part platforms.**
  N64 controller paks, Neo Geo memory cards, 3DS extdata directories, PS1 multi-block memcards: each emulator picked its own layout, and a save written by one won't load in another.
- **Provenance.**
  There is no standard way to say "this exact save, byte for byte" or "this came from emulator X on date Y."

So sharing, archiving or syncing a save reliably means either trusting filename conventions or wrapping everything in some archive format that only one tool understands.

This document specifies one portable container file (extension `.1saves`) that covers all of the above.
It is a binary format that doesn't care about transport or storage.
The idea is to have a single self-contained file you can use anywhere a save needs to move around: export, import, sharing, cloud sync, archival.

What the format has to do:

1. **Carry typed binary parts.**
   Cartridge SRAM, controller paks, memory-card blocks, extdata directories, save states, screenshots, thumbnails.
2. **Carry identifying context, when there is any.**
   What game, what system, who produced the file.
   All of it is best-effort and none of it is required.
   A save that is nothing more than a system slug and a chunk of bytes is still a valid bundle.
3. **Carry interpretation, also optional.**
   Parsed metadata (level, playtime, party), a clock reading, annotations from other tools.
4. **Be deterministic.**
   Two encoders given the same input produce the same bytes, so the file's SHA-256 is a stable content hash.
5. **Keep the blobs at the end.**
   Adding a part only touches the end of the file, and rewriting metadata never moves the blob bytes.
6. **Stay valid CBOR from start to finish.**
   Any CBOR reader can walk the structure, even one that has never seen this spec.

We use CBOR for this.
It is an IETF standard (RFC 8949) with libraries in every mainstream language, and it has a defined deterministic encoding (RFC 8949 §4.2).
It runs in `no_std` environments, so an embedded front-end or a WASM parser can read and write bundles without pulling in a heavy runtime.
It also keeps the bytes as bytes, instead of paying the ~33% that base64 would add on the wire.

## Format Overview

- **Extension**: `.1saves`
- **MIME**: `application/vnd.1retro.1saves+cbor`
- **Framing**: the whole file is a single CBOR value, framed by two CBOR tags.
  There are no non-CBOR bytes, so any conforming CBOR reader can walk the structure even without knowing the application tag.

  ```text
  [0..3]   0xD9 0xD9 0xF7          CBOR self-describe tag #55799
  [3..8]   0xDA 0x31 0x53 0x41 0x56  bundle tag #827539798, ASCII "1SAV" in a hex dump
  [8..]    bundle array (definite-length CBOR 3-array)
  ```

  - The self-describe tag (#55799) is the conventional file-type sniff for CBOR streams;
    it is already registered in the standard, so no action is needed to use it.
  - The bundle tag is `827539798` (`0x31534156`), whose 5-byte encoding spells `1SAV` in a hex dump.
    This follows the RFC 9277 ("On Stable Storage for Items in CBOR") convention of wrapping a stored item in the self-describe tag plus an application tag chosen to read as ASCII file magic.
    The number is in the IANA **First-Come-First-Served** band (≥ 32768), which is registered by a short note to IANA with a link to this spec, not a standards process.
    Producers can emit it today; registering it is a formality that only guards against collisions.
  - The major version lives in the tag number.
    A future breaking format uses a different tag, so an old decoder rejects a new-major file on its own, with no separate version field to check.
    Major bumps are rare, and each one is just another FCFS registration.
  - Minor, additive changes happen *inside* the bundle, as new optional keys in the header, metadata or part maps.
    Decoders MUST reject unknown integer keys (the spec owns that namespace) and MUST round-trip unknown reverse-DNS text keys in the [1] metadata slot.
- **Determinism**: per RFC 8949 §4.2.
  Definite-length items, integer map keys encoded shortest, map keys sorted bytewise, no duplicate keys, strings in NFC, floats use shortest exact representation, parts sorted by ascending `id`.
- **Why tags, and not a custom prefix**: the file stays a valid CBOR document, so any CBOR debug tool can dump it.
  It also lets the format version itself through the tag number.
  And per RFC 9277, it needs no central registry to be recognized as a file, only to avoid tag collisions.

## Top-Level CBOR Document (v1)

The bundle is a CBOR array of three elements, one slot per concern.
There is no `kind` field, because the application tag already identifies the document and pins the major version.
Using positions instead of names keeps the spec small and unambiguous: every decoder knows what slot 0, 1 and 2 hold without looking up a string.

```text
[
  <header>,    // [0]  identity: created_at, game, source
  <metadata>,  // [1]  interpretation: parsed tags, RTC, anything else (optional, may be null)
  <parts>,     // [2]  payload: array of typed parts, numbered, max 20
]
```

The blob bytes still end up at the tail of the file, because array element [2] is encoded last and inside each part the `payload` field is the last entry.

### [0] Header (`map`)

This map carries what identifies the bundle and who produced it.
Keys are small unsigned integers, for a compact canonical encoding.
Only `type` and `created_at` are required; the rest is best-effort context that helps a consumer match the bundle to a game.

| Key | Name         | Type                   | Req? | Notes                                                                                                                                                             |
|-----|--------------|------------------------|------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0   | `type`       | text                   | yes  | High-level intent of the bundle. See vocabulary below. Encoded first by canonical ordering, so streaming decoders can dispatch before reading anything else.      |
| 1   | `created_at` | CBOR tag 1 (epoch sec) | yes  | When the bundle was assembled.                                                                                                                                    |
| 2   | `system`     | text                   | no   | System slug (`"gb"`, `"snes"`, `"n64"`, `"3ds"`, ...). Independent of game identification, since a parser can sometimes do useful work knowing only the system.   |
| 3   | `game`       | map (hints)            | no   | Optional bag of game-identification clues. If absent or empty, the bundle is *unidentified*; consumers should store it as-is and let the user associate it later. |
| 4   | `source`     | map                    | no   | `{ device_type, fingerprint, app, app_version }`, all optional. Identifies the producer.                                                                          |

#### `type` vocabulary

`type` describes what the bundle *as a whole* represents.
It is separate from the per-part kind discriminator, which describes what each individual blob *is*.

| Value             | Meaning                                                                                                                                                                                                                                  | Typical parts                                                                       |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `single_save`     | One game, one save. The default, and by far the most common case.                                                                                                                                                                            | One `save` part. Optional `thumbnail` / `screenshot`.                               |
| `multi_game_save` | A producer-curated bundle of saves for several distinct games in one file (manual export, "all my Pokemon saves across generations").                                                                                                    | Multiple `save` parts, each with a distinct `role` / `path`.                        |
| `memory_card`     | A complete card or cartridge storage image whose slot-to-game mapping lives *in the bytes themselves* (PS1 memcard, N64 controller pak, Neo Geo memory card). The whole card is one logical unit; what's on it is a card-layout concern. | Typically one `save` part containing the card image.                                |
| `save_state`      | The bundle is primarily an emulator snapshot rather than a battery save. May still carry a `save` part as supporting context.                                                                                                            | One or more `save_state` parts. Optional accompanying `save` part and `screenshot`. |
| `archive`         | A preservation-focused bundle with maximum metadata, parsed tags, screenshots, and possibly multiple historical revisions of the same save.                                                                                              | Mix of `save` + `save_state` + `screenshot` plus rich `parsed`/extension metadata.  |

Consumers MUST round-trip unknown `type` values unchanged and MAY treat them as `single_save` for best-effort handling.
New `type` values are added in subsequent minor versions of the spec.

#### `game` (hints map)

A producer fills in as many clues as it has; consumers pick the strongest match (rough order of strength: `gameId` > strongest hash > serial > filename > name).
All keys optional.

| Key | Name           | Type            | Notes                                                                                                                                                                                                                                                                  |
|-----|----------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0   | `gameId`       | map (see below) | Ids for this game in one or more catalogs, keyed by resolver name. Skips resolution at the consumer. If unsure, omit and use a hash or filename instead. |
| 1   | `rom_hashes`   | map (see below) | Any subset of known ROM hashes.                                                                                                                                                                                                                                        |
| 2   | `rom_filename` | text            | Original ROM filename or stem (`"pokemon_red.gb"`). Useful for filename- or normalized-name-based catalog lookup.                                                                                                                                                      |
| 3   | `serial`       | text            | Per-system serial code from the ROM header: GB title bytes, GBA `AGB-XXXX-USA`, DS `NTR-XXXX`, PS1 disc serial (`SLUS-00404`). Highly reliable when present.                                                                                                           |
| 4   | `name`         | text            | Best-known game name as a free string, last resort.                                                                                                                                                                                                                    |
`gameId` is itself a map from resolver name to this game's id in that catalog (`{"com.1retro": 1234, "com.mobygames": 5501}`).
The resolver name is the catalog's domain in reverse-DNS form, the same convention as extension keys: own the domain and the name is yours, with no registry needed to avoid collisions.
The id is an integer or a string, whichever form the catalog publishes.
A producer aligned with several catalogs records one entry per catalog.
An empty map is malformed; a producer with nothing resolved omits the key entirely.
Consumers MUST round-trip entries with unknown resolver names unchanged and skip them when matching.
Known resolvers: `com.1retro` (the 1retro catalog), `com.mobygames` (MobyGames game id), `org.hasheous` (Hasheous id).
To list a new resolver here, open a PR against this spec; the listing is only for discovery.

`rom_hashes` is itself a map of hash kinds (all values are lowercase hex text):

| Key | Hash     | Notes                                                                                                     |
|-----|----------|-----------------------------------------------------------------------------------------------------------|
| 0   | `sha1`   | 40 hex chars. The most common ROM identifier in public retro databases (No-Intro, Redump).                |
| 1   | `md5`    | 32 hex chars. Older No-Intro sets and many emulator front-ends key on this.                               |
| 2   | `sha256` | 64 hex chars. Future-proof; less common in current databases but trivial to compute alongside the others. |
| 3   | `crc32`  | 8 hex chars. Used by Hasheous and most emulator front-ends. Compact but collision-prone for large sets.   |

Decoders MUST reject unknown integer keys inside `game` and `rom_hashes` (these namespaces are owned by the spec).
New hash kinds become reserved keys in a later minor version.

### [1] Metadata (`map` or `null`)

This is the interpretation layer: anything a parser, an emulator or a third party wants to attach that is not part of the binary save itself.
When there is nothing to put here it is encoded as `null` (`0xF6`), so the array keeps its fixed three-element shape.

| Key | Name          | Type | Notes                                                                                                                                                  |
|-----|---------------|------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0   | `description` | text | Free-form human-readable note about this bundle ("Right before the final boss", "100% completion run", "Pre-Elite Four"). No length limit by spec; producers should keep it short enough to display in a list view. |
| 1   | `rtc`         | map  | Portable clock snapshot: `{ epoch_seconds: tag 1, source_clock: text, accuracy_ms: uint? }`. For battery-backed clocks in games like Pokemon Gold/Silver and Animal Crossing. Details below. |

In `rtc`, `epoch_seconds` is the in-game clock reading normalized to a Unix instant, `source_clock` names the originating clock, and `accuracy_ms` gives its uncertainty.
Raw chip-format values (BCD components, weekday, 12/24h mode, PM flag) and emulator-internal RTC state are **not** stored here.
They belong in an emulator extension key such as `io.mgba.rtc` (see [Extensions](#extensions)).

Anything richer than `description` and `rtc` attaches as an **extension key**: a reverse-DNS text string such as `com.1retro.forge.parsed` or `io.mgba.rtc`.
That is where parser-extracted gameplay tags (character name, level, playtime, gold), emulator-native structures, and annotations from other tools go.
See [Extensions](#extensions) for the mechanism, the round-tripping rules, and the list of known keys.

### [2] Parts (`array of Part`, max 20 entries)

If a save honestly needs more than 20 parts, something has gone wrong in the design: either group the parts into a sub-archive, or split the bundle in two.
Decoders MUST reject arrays of more than 20 parts.

Each entry is either a bare `Part` map (the default, interpreted as a `save` part) or a `Part` map wrapped in a CBOR tag that discriminates the kind:

| Wrapping tag       | Kind         | Notes                                                                                                     |
|--------------------|--------------|-----------------------------------------------------------------------------------------------------------|
| *(none, bare map)* | `save`       | Default. The vast majority of parts are save data; not requiring a tag keeps the common case small.       |
| tag `40010`        | `save_state` | Emulator snapshot. Requires `content_type` if a known format (e.g. `"application/x-mednafen-savestate"`). |
| tag `40011`        | `screenshot` | Lossy/lossless image captured by an emulator. `content_type` required (`"image/png"`, `"image/webp"`).    |
| tag `40012`        | `thumbnail`  | Small preview, typically derived from a screenshot. `content_type` required.                              |
| tag `40013`        | `aux`        | Anything else binary. `content_type` SHOULD be set.                                                       |

(These part-kind tags sit in the same IANA First-Come-First-Served band as the bundle tag, and register the same non-blocking way.
They only ever appear nested inside a `1SAV` bundle, so even a collision in the global registry would not break decoding.
Producers can use them today; registering them is a courtesy, not a prerequisite.)

Decoders encountering an unknown discriminator tag on a part MUST treat the part as `aux` for round-tripping and MUST NOT discard it.

#### `Part` (map)

| Key | Name           | Type        | Req? | Notes                                                                                                                                                                                                                                                                                                                                                                                  |
|-----|----------------|-------------|------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0   | `id`           | uint (0-19) | yes  | Stable numeric identifier within the bundle. Parts are stored in ascending `id` order for canonicalization. `id` lets metadata or other parts cross-reference (e.g. a thumbnail can point to its source screenshot's `id`).                                                                                                                                                            |
| 1   | `role`         | text        | yes  | Semantic role of this part. Standard roles: `"primary"` (the only or principal save), `"cartridge"`, `"controller_pak_1"`..`"controller_pak_4"` (N64), `"neogeo_card_a"`..`"neogeo_card_d"`, `"memcard_1"`..`"memcard_n"` (PS1), `"extdata"` (3DS), `"sysnand"`, `"sd"`. Max 64 chars, `[a-z0-9_]+`. Producers MAY mint new roles per system; consumers MUST round-trip unknown roles. |
| 2   | `path`         | text        | yes  | Relative path within the bundle, for parts that are intrinsically multi-file (e.g. a 3DS extdata directory). `""` for one-file-per-role parts; `"title/00040000/data.bin"` for 3DS-style folders. Max 512 chars. Forbidden: leading `/`, `..` segments.                                                                                                                                |
| 3   | `content_type` | text        | no   | MIME hint. Required for non-`save` kinds.                                                                                                                                                                                                                                                                                                                                              |
| 4   | `size`         | uint        | yes  | **Uncompressed** byte length of the payload.                                                                                                                                                                                                                                                                                                                                           |
| 5   | `sha256`       | byte string | yes  | SHA-256 over the **uncompressed** payload (32 bytes).                                                                                                                                                                                                                                                                                                                                  |
| 6   | `encoding`     | text        | yes  | `"none"` \| `"zstd"`. Compression is per-part.                                                                                                                                                                                                                                                                                                                                         |
| 7   | `payload`      | union       | yes  | Embedded byte string with the (optionally compressed) bytes, **or** an external-reference map `{ 0: "ref", 1: <sha256 bytes>, 2: <optional URI text> }`. The reference's SHA-256 MUST equal key 5.                                                                                                                                                                                     |

A bundle is **self-contained** when every part carries its bytes inline, and **thin** when at least one part does not.
A self-contained bundle works on its own; a thin one needs an external content-addressable store to resolve the referenced SHA-256s.

### Layout consequences (blob-at-end ordering)

The three-element shape pins `parts` to position [2], which encodes after the header [0] and the metadata [1].
Within each part, `payload` (key 7) is the highest key, so its byte string is written last.
The result is that the blob bytes always sit at the tail of the file.
That has a few consequences:

- **Cheap metadata updates**: rewriting [1] metadata only touches the small head region (typically <2 KiB).
  Existing part bytes never move.
- **Mostly-append for adding a part**: the new part entry's bytes go at the end of the file.
  The only existing bytes that change are the few that encode the parts array's length header (1 or 2 bytes for up to 20 entries).
  Everything before the parts array, and every existing part's blob bytes, are byte-identical.
- **In-place blob streaming on encode**: a writer can serialize the header + metadata, then stream each part's bytes directly into the output without first holding them in memory.

### Streaming-write mode (opt-in)

For producers that need true open-and-append semantics (e.g. a recorder appending screenshots over a session), the spec defines a **streaming variant**: the parts array is encoded with a CBOR indefinite-length header (`0x9F` ... `0xFF`).
Appending a part is then literally `fseek(end-1); write(part); write(0xFF)`.

Streaming-mode files are **not canonical**: two writers can produce different bytes for the same logical content.
A canonicalization step re-encodes the file with definite-length headers and id-sorted parts before hashing.
Anywhere a stable content hash matters, the bundle must be in canonical form.

### Canonical hash

The bundle's content hash is the SHA-256 of the whole file (self-describe tag + bundle tag + array, in canonical encoding).
Because the encoding is deterministic, two encoders that build the same logical bundle produce the same hash.
That hash is the identifier a content-addressable store would key on.

## Extensions

The spec owns the integer-keyed namespace of every map it defines.
Everything else attaches through **extension keys**: map entries whose key is a text string in reverse-DNS form (`io.mgba.rtc`, `com.1retro.forge.parsed`).
This is how parser-extracted gameplay tags, emulator-native structures and third-party annotations ride along, without the spec needing to know anything about them.

Extension keys are currently defined for the **[1] metadata** map. The rules:

- Decoders **MUST** round-trip unknown text keys unchanged.
  Never drop an extension just because you don't recognize it.
- Decoders **MUST** reject unknown integer keys.
  The integer namespace belongs to the spec, so a stray integer key is a malformed bundle, not an extension.
- A producer **SHOULD** prefix its keys with a reverse-DNS domain it controls, so two producers never collide.
- A field that becomes first-class moves from an extension string to a reserved integer key in a later minor version.

### Registry of known extension keys

*Non-normative.*
An extension key's schema belongs to whoever owns the key, not to this spec.
This table is only an index, so producers can find and reuse existing keys instead of inventing overlapping ones.
To list a key, open a PR against this spec.
Registration is first-come and non-blocking: it reserves the name socially, not technically.

| Key                       | Owner  | Applies to | Purpose                                                                                                       |
|---------------------------|--------|------------|--------------------------------------------------------------------------------------------------------------|
| `io.mgba.rtc`             | mGBA   | metadata   | Native GBA/GB RTC chip state (BCD components, control register, host-clock offset) for byte-exact round-trip. |
| `com.1retro.forge.parsed` | 1retro | metadata   | Parser-extracted gameplay tags (character name, level, playtime, gold, completion).                          |

### Worked example: `io.mgba.rtc`

The spec-owned `rtc` field carries only the portable, normalized instant.
An emulator that needs byte-exact RTC round-tripping stores its native chip state under its own key instead.
mGBA's GBA RTC (a Seiko S-3511A) maps naturally to:

```text
"io.mgba.rtc" = {
  components: <7 bytes, BCD>,  // year-since-2000, month, day, weekday, hour, minute, second
  hour24:     bool,            // 24-hour-mode control bit (PM flag is bit 7 of the hour byte in 12h mode)
  control:    uint,            // raw control register
  offset:     int,             // mGBA derives the clock as host_clock − offset
  last_latch: tag 1,           // when the RTC was last read
}
```

The 2-digit year, the separate weekday byte, the 12/24-hour mode and the `offset` / `last_latch` reconstruction model are all specific to the chip and the emulator.
That is why they live here and not in `rtc`.
A consumer that only wants to know what time the game thinks it is reads `rtc.epoch_seconds` and ignores this key.

## Out of scope of this specification

The spec deliberately does *not* cover:

- **Encryption.**
  The bundle is plaintext CBOR.
  Confidentiality is the transport's responsibility (TLS) or a separate envelope.
- **Compression at the file level.**
  Compression is per-part via the `encoding` field (currently `"none"` or `"zstd"`); the outer file is never wrapped in another compression layer.
- **Authentication / signing.**
  No signatures inside the bundle.
  If signed bundles are ever needed, they belong in a new outer CBOR tag that wraps this one.
- **On-disk canonicalization for emulator save directories.**
  Devices that natively read `.sav` / `.srm` continue to do so; the bundle is for transport and archival, not for in-place emulator consumption.
- **Per-part deduplication across bundles.**
  Two bundles that share an identical part each carry a full copy.
  Deduplication, if you want it, is a storage-layer concern that works from each part's `sha256`.
- **Migration from any specific legacy save layout.**
  How a producer or consumer chooses to coexist with raw `.sav`/`.srm`/emulator-native formats is a deployment concern, not part of the format.

## Appendix A: CDDL schema

A [CDDL](https://www.rfc-editor.org/rfc/rfc8610) (RFC 8610) schema describes the **canonical** (definite-length) encoding of a v1 bundle.
A bundle in streaming-write mode must be canonicalized first (see [Streaming-write mode](#streaming-write-mode-opt-in)).
Tools such as `cddl` and `cuddle` can validate a decoded bundle against this schema.

The schema lives in [`universal-saves-format.cddl`](https://github.com/hansl/docs.1retro.com/blob/main/src/content/docs/specifications/universal-saves-format.cddl), the single source of truth that validators consume directly.
A [rendered copy](/specifications/universal-saves-format-cddl/) with notes on reading it is part of these docs.
