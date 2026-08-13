---
title: "Universal Saves Format (.1saves)"
description: A portable, self-describing CBOR container for retro console save files and everything attached to them.
sidebar:
  badge:
    text: v0.1
    variant: caution
---

This is version 0.1 of this specification, and it is not yet stabilized. Expect breaking changes; until 1.0 they happen
in place, under the same bundle tag.

## Changelog

Newest first. Nothing in a file says which version wrote it before 1.0, so this list is the only record that the rules
moved. A version covers the format, the [common types](/specifications/common-types/) it leans on, and the
[extension keys](/specifications/extensions/) these specifications own; a key belonging to a producer changes on that
producer's schedule instead.

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

A bundle's [content hash](#content-hash-and-file-hash) is the identifier a store keys on and the value a
[`bundle` part](#nested-bundles) carries, so it has to be a function of what the bundle says and not of how a producer
chose to say it. Deterministic encoding gets most of the way: it fixes how a given value is written. What it cannot fix
is a format that offers two ways to say the same thing.

So this one offers one, everywhere:

- **Nothing is absence.** An optional container has exactly one encoding of empty, and that is not being there. An empty
  `game`, `game_id` or `rom_hashes` is malformed, and so is an empty `parts` array.
- **A default is absence.** Where a field has a default, the default is written by leaving the key out, and spelling it
  out is malformed. A part's [`kind`](#part-kinds) means `save` when absent, its [`role`](#part-map) means `primary`,
  its [`path`](#part-map) means the role is the whole address, and its [`encoding`](#part-map) means `"none"`.
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

### Minting a name

Two fields hold a name out of an open vocabulary: a part's [`kind`](#part-kinds) and a source's [`app`](#source-map).
Each works the same way.

Five fields look like they belong here and do not. The header's [`system`](#0-header-map), a card's
[`format`](#card-map), a part's [`binding`](#bound-payloads) and [`role`](#part-map), and a source's
[`device_kind`](#source-map) take spec or registry slugs only, and a producer cannot mint into any of them. `system` and
`role` draw from a registry, which grows by a PR rather than a new version of this spec.

The test is whether the name belongs to the producer or to everybody. `app` names the producer itself and a minted
`kind` names a format it invented, so both are its own, and nobody should have to ask permission to name a thing they
made. A system, a card format, a binding, a socket and a kind of device are categories everyone shares. Minting into a
shared category does not extend it, it splits it: two producers writing `io.mgba.emulator` and `com.libretro.emulator`
have named one concept twice, and a consumer grouping by that field now sees two unrelated strings. Shared vocabularies
grow by a PR against this spec, or against the registry the field names.

Two of them do more than group. An unrecognized `format` fails to degrade at all, since a consumer that does not know it
cannot rebuild the card, so it round-trips the bundle unchanged and **MUST NOT** attempt the write. An unrecognized
`role` is what a consumer matches a part against a socket by, so a consumer **MUST NOT** guess which socket an
unfamiliar one means: round-trip it and show it, but never match on it, because restoring a controller pak's save into a
cartridge slot is worse than declining to restore it. That is also why the [registry](/registries/roles/) is worth
adding to: an unlisted role still round-trips, it just cannot be restored by anything that has not heard of it.

The one exception is a numbered socket. A role ending in `-<n>` names the nth socket of the kind its prefix names, so a
consumer that recognises `memcard-` matches `memcard-8` without that exact role being registered. This is the only place
these specifications read structure out of a slug; everywhere else a name is compared whole, and an unrecognised prefix
stays unrecognised however it ends. An unknown `system`, `binding` or `device_kind` costs nothing beyond the grouping.

A **bare slug** belongs to this specification, or to the registry the field names. It is lowercase ASCII, at most 64
bytes, and separates runs with a single `-`, with no leading or trailing one: `card-image`, `cartridge-reader`,
`memcard-1`, `atari-2600`, `ps1-mc`. One grammar covers every slug the format uses, whether this spec invented the name
or borrowed it from the world. Only a new version of this spec, or a PR against the registry, adds one.

A **[reverse-DNS name](/specifications/common-types/reverse-dns-name/)** belongs to whoever holds the domain (e.g.
`io.mgba.rewind`). A producer mints one with nobody to ask, which is the whole point: a tag would have to be registered
with IANA, and a bare slug would have to be registered here, and neither should stand between a producer and a name for
something it already owns. A producer with no domain takes a name in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree).

The two grammars are disjoint: a slug is exactly one DNS label, a reverse-DNS name is two or more joined by `.`, and no
string is both. So a producer mints without checking what this spec might assign later, and a later version of this spec
assigns without auditing what producers have minted.

Two rules cover every one of these fields, and are not repeated at each:

- Consumers **MUST** round-trip a name they do not recognize, unchanged. An unfamiliar name is a name from a later minor
  version or from a producer you have not heard of, never a reason to drop what it labels.
- Consumers **MUST** reject a value that is neither a well-formed slug nor a well-formed reverse-DNS name. That is not a
  name anybody could have minted, so there is nothing to round-trip.

## Top-Level CBOR Document (v1)

The bundle is a CBOR array of two elements. There is no format or version field: the application tag already identifies
the document and pins the major version.

```text
[
  <header>,  // what this bundle is: identity, provenance, interpretation
  <parts>,   // the bytes: array of typed parts, numbered
]
```

### [0] Header (`map`)

Everything the bundle says about itself: which game and system, who produced it, and whatever a parser or emulator
attached. Keys are small unsigned integers, for a compact canonical encoding. Every key is optional; all of it is
best-effort context. An empty header (`{}`, encoded `0xA0`) is valid, and describes a bundle whose parts are all a
consumer knows about it.

| Key | Name          | Type             | Req? | Notes                                                                                                                                                                                                                                                                                   |
| --- | ------------- | ---------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `created_at`  | CBOR tag 1 (int) | no   | When the bundle was assembled, in whole epoch seconds. Tag 1 also admits a float, which this format forbids; see [One encoding per bundle](#one-encoding-per-bundle).                                                                                                                   |
| 1   | `system`      | text             | no   | Slug of the system **these bytes are a save for**: the one that reads them natively, whatever happened to write them (`"gb"`, `"snes"`, `"n64"`, `"3ds"`, ...). See the [System Registry](/registries/systems/), and the note below on why it sits beside `game` rather than inside it. |
| 2   | `game`        | map (hints)      | no   | Optional bag of game-identification clues. If absent or empty, the bundle is _unidentified_; consumers should store it as-is and let the user associate it later or use other means (e.g. filename).                                                                                    |
| 3   | `source`      | map              | no   | Who assembled the bundle, and the default source for every part. See below.                                                                                                                                                                                                             |
| 4   | `card`        | map              | no   | Present when the bundle _is_ a memory card. Carries the card's format, its capacity, and the bytes belonging to no save. See below.                                                                                                                                                     |
| 5   | `description` | text             | no   | Free-form human-readable note about this bundle ("Right before the final boss", "100% completion run"). No length limit by spec; producers should keep it short enough to display in a list view.                                                                                       |

A bundle's saves are its [`bundle` parts](#nested-bundles) if it has any, and its parts with no `kind` otherwise. A
memory card takes the first form, one nested bundle per save, and so does a [collection](#shapes); a plain cartridge
save takes the second. Whether a bundle is a memory card is the presence of `card`, independently of either. Everything
else a bundle carries is named by a [part kind](#part-kinds).

That counts saves as the medium stored them, not as a player would. This format never looks inside a payload, so a game
keeping several of its own slots in one blob is one save here: A Link to the Past holds three playthroughs in a single 8
KB SRAM image, and splitting them would mean parsing a format per game.

#### Why `system` is not part of `game`

Read `system` as "who will load these bytes", never as "who wrote them", because the two come apart on real hardware: an
N64 Transfer Pak lets Pokemon Stadium write a Game Boy cartridge's SRAM, and that is a `gb` save whatever produced it.
It is a property of the medium rather than of the reader, so a `.vmp` virtual PS1 card on a PSP memory stick is `psx`
and so is a PS1 card read through a PS2, with the hosting platform recorded as [`source`](#source-map) provenance
instead.

It sits beside `game` rather than inside it because a card has a system and often no game at all, and because `game`
refines per-part where `system` cannot: a card is one system, and a genuinely varying one means you have crossed into a
[collection](#shapes).

#### `game` (hints map)

A producer fills in as many clues as it has; a consumer matches with whatever its catalog can resolve. This spec fixes
no resolution order, because the hints answer different questions rather than the same one with different confidence: a
`sha256` or `sha1` hash identifies one dump, `serial` identifies one release and many dumps share it, and `crc32`,
`rom_filename` and `name` narrow the field without settling it. A producer that wants the answer pinned rather than
inferred emits `game_id`, which is what it is for. All keys are optional.

| Key | Name           | Type              | Notes                                                                                                                                                    |
| --- | -------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `game_id`      | map (see below)   | Ids for this game in one or more catalogs, keyed by resolver name. Skips resolution at the consumer. If unsure, omit and use a hash or filename instead. |
| 1   | `rom_hashes`   | array (see below) | Any subset of known ROM hashes, each a tagged byte string.                                                                                               |
| 2   | `rom_filename` | text              | Original ROM filename or stem (`"pokemon_red.gb"`). Useful for filename- or normalized-name-based catalog lookup.                                        |
| 3   | `serial`       | text              | Per-system serial code from the ROM header: GBA `AGB-XXXX-USA`, DS `NTR-XXXX`, PS1 disc serial (`SLUS-00404`). Only a real serial belongs here.          |
| 4   | `name`         | text              | Best-known game name as a free string. Also where a title that is not a serial goes, such as the Game Boy header's title bytes.                          |

`game_id` is itself a map from resolver name to this game's id in that catalog
(`{"com.1retro": 1234, "com.mobygames": 5501}`). The resolver name is the catalog's domain in
[reverse-DNS form](/specifications/common-types/reverse-dns-name/), the same convention as extension keys: own the
domain and the name is yours, with no registry needed to avoid collisions. The id is an integer or a string, whichever
form the catalog publishes. A producer aligned with several catalogs records one entry per catalog. Consumers MUST
round-trip entries with unknown resolver names unchanged and skip them when matching. Known resolvers: `com.1retro` (the
1retro catalog), `com.mobygames` (MobyGames game id), `org.hasheous` (Hasheous id). To list a new resolver here, open a
PR against this spec; the listing is only for discovery.

`rom_hashes` is an array of [hash values](/specifications/common-types/hash-value/), which is where the four algorithms,
their tags, their ordering and their comparison rules all live. A producer emits every hash it has already computed and
computes none it doesn't need: a consumer matching against a catalog only needs one hash the catalog also carries.

#### `source` (map)

Who produced the bytes. The same map attaches in two places. In the header (key 3) it names the producer that assembled
the bundle, and serves as the default source for every part. On a part (key 10) it names the producer of that part's
bytes, for bundles whose saves don't all come from the same place; a part without its own `source` inherits the
header's. Provenance belongs to each save, not just to the file around it: a bundle can hold one save read from a real
cartridge and another exported by an emulator, each carrying its own part-level `source`. All keys optional; consumers
use this for display and provenance, never for game matching.

| Key | Name          | Type | Notes                                                                                                                                                                                                                                                                               |
| --- | ------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `device_kind` | text | What kind of producer read the bytes. See vocabulary below.                                                                                                                                                                                                                         |
| 1   | `fingerprint` | text | Opaque stable identifier for the specific device or install, so two bundles can be traced to the same producer. SHOULD carry no personal information.                                                                                                                               |
| 2   | `app`         | text | The producing software or device. A [minted name](#minting-a-name): a bare slug names an [Emulator Cores registry](/registries/cores/) entry (`"mgba"`), and a producer with no entry takes a reverse-DNS name (`"io.mgba"`, `"x.epilogue.operator"`). See below for which applies. |
| 3   | `app_version` | text | Version of `app`, in whatever scheme that app uses.                                                                                                                                                                                                                                 |

The Cores registry covers emulator cores and nothing else, so a cartridge reader, a flashcart or a service has no slug
to take and names itself in reverse-DNS instead.

Which arm applies is not a preference. A producer listed in the [Cores registry](/registries/cores/) **MUST** write that
slug, and one with no entry **MUST** write a reverse-DNS name, so a producer has exactly one spelling: mGBA is `mgba`
because it is listed, never `io.mgba`, though it holds the domain. Left to taste, two producers would describe one piece
of software two ways, and `source` sits in the header where that changes the
[content hash](#content-hash-and-file-hash).

The slug is also the string a consumer already has, since it derives mechanically from the `saves/<core>/` folder a core
writes to. That matters most for the one case where a producer names somebody else: a tool reporting saves it found in
someone's RetroArch install is describing an observation, and a registry slug says that, where minting a reverse-DNS
name on that core's behalf would claim a name in a namespace the tool does not hold.

A producer that writes a reverse-DNS name and is later listed switches to the slug. Bundles written before keep the name
they were written with and round-trip unchanged, the same way an [`x` name](/registries/vendors/) stays assigned after a
vendor acquires a domain.

`device_kind` values. The list is spec-owned and a producer cannot mint into it, for the reason
[Minting a name](#minting-a-name) gives; a new category comes from a PR against this spec. `app` one row above is the
opposite case: it names the producer itself, so it is the producer's to mint.

| Value              | Meaning                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `console`          | Real console hardware writing its own save: a PS2 to its memory card, an N64 to a Transfer Pak cartridge. |
| `emulator`         | A software emulator or emulator front-end.                                                                |
| `cartridge-reader` | Hardware that reads a physical cartridge or memory card (Epilogue GB Operator, GBxCart RW, Sanni reader). |
| `flashcart`        | A flash cartridge that carries saves on real hardware (EverDrive, EZ-Flash).                              |
| `service`          | A server-side producer, such as a sync or conversion service.                                             |

#### `card` (map)

Present when the bundle _is_ a memory card. Its saves are then the bundle's [`bundle` parts](#nested-bundles), one per
save, each carrying that save's directory entry. Everything hardware-specific about cards is in
[Memory Cards](/specifications/memory-cards/): what each format fixes, what a writer has to regenerate, and what
splitting a card drops.

| Key | Name          | Type | Req? | Notes                                                                                                                                                                                    |
| --- | ------------- | ---- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `format`      | text | yes  | `ps1-mc` \| `ps2-mc` \| `n64-cpak` \| `gc-mc` \| `neogeo-mc` \| `vmu` \| `saturn-bup`. The one open vocabulary a producer may not mint into; see [Minting a name](#minting-a-name).      |
| 1   | `capacity`    | uint | yes  | The card's **data** capacity in bytes: what saves can occupy, excluding any out-of-band area. Never the length of a dump, which a [`card-image`](#part-kinds) reports in its own `size`. |
| 2   | `system_area` | bstr | no   | The card-level bytes that belong to no save, verbatim and opaque.                                                                                                                        |

`format` and [`system`](#0-header-map) answer different questions. `system` decides which emulators can load these bytes
at all; `format` decides how they are laid out, fixing the length of each save's `dirent` and selecting which rebuild
rules apply. Both are properties of the medium rather than of the reader, for the reason
[`system`](#why-system-is-not-part-of-game) gives, so a PS1 card read through a PS2 is `system: "psx"` and
`format: "ps1-mc"` at once.

### [1] Parts (`array of Part`)

A bundle holds at least one part. There is no upper limit. Most bundles hold a handful, but a producer that explodes a
memory card into one part per save legitimately reaches into the dozens, and picking a number here would only be a guess
at where that stops. Decoders MAY reject a bundle with more parts than they are willing to handle, and SHOULD NOT size
any buffer from the array's declared count before reading that many parts, since the count costs an attacker nothing to
inflate.

#### Part kinds

A part's `kind` (key 1) says what role its bytes play. It is absent on the common case:

| Kind         | Notes                                                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(absent)_   | `save`. The vast majority of parts are save data, so the common case carries no kind at all.                                                                                                                                                       |
| `card-image` | A complete memory-card image, kept whole instead of split into its saves (PS1 and PS2 memcards, N64 controller pak, GameCube memory card, Dreamcast VMU). Handled like a save; `content_type` optional, since these rarely have a registered type. |
| `bundle`     | The payload is itself a complete `1SAV` bundle. This is how a card holds its saves. See [Nested bundles](#nested-bundles).                                                                                                                         |
| `aux`        | Anything else binary. `content_type` SHOULD be set.                                                                                                                                                                                                |

A `card-image` says the blob is a whole card rather than one game's save, so a consumer knows to stop reading the
bundle's `game` as a description of its contents.

A producer MAY carry both: the image as a byte-exact archive of one physical card, and that card's saves as `bundle`
parts for portability. Keeping the image alongside the split saves is how a producer preserves what splitting drops; see
[`system_area`](#card-map).

##### Minting a kind

A kind is a [minted name](#minting-a-name): the four above are this spec's, and a producer with a kind of its own takes
a reverse-DNS name. An unrecognized kind is handled as `aux`, so never drop a part because you don't know what it is.

Mint sparingly, and only for a name that changes how a consumer has to **handle** the part. A name that merely describes
the bytes changes no behaviour, and describing the bytes is [`content_type`](#part-map)'s job.

#### Nested bundles

A `bundle` part's payload is a complete `1SAV` bundle, carried as an ordinary byte string. Nothing about the outer part
changes: `sha256` is its hash, and `encoding` compresses it like any other blob.

This is how a memory card holds its saves. One `bundle` part per save, carrying that save's `slot` and `dirent`, and
inside it a bundle with the save's own `game` and one part per file:

```text
1SAV                                       the card
├── header  { system, card: { format, capacity, system_area } }
└── parts
    ├── kind "bundle"  slot 1, dirent, path, game hint
    │   └── 1SAV                           one save
    │       ├── header  { system, game, description, com.1retro.forge }
    │       └── parts   one per file, each with its own slot and dirent
    ├── kind "bundle"  slot 2, ...
    └── kind "card-image"                  optional byte-exact archive
```

Grouping saves this way is structural rather than inferred, which matters because a card routinely holds several saves
for the same game, carrying byte-identical `game` maps that only their nesting, `slot` and `path` tell apart. See
[several saves for the same game](/specifications/memory-cards/#several-saves-for-the-same-game).

The rules a decoder enforces:

- **Nested bundles are normalized.** Every inner part MUST be uncompressed with its payload embedded, so an inner
  bundle's [file hash and content hash](#content-hash-and-file-hash) are the same value. Compression belongs on the
  outer part, where it does not change `sha256` and compresses better anyway for having the whole inner bundle to work
  with.
- **`sha256` is the inner bundle's identity.** A card is therefore a list of content hashes, which is what makes
  extracting a save a byte copy rather than a re-encode, and what lets two producers of the same save agree on what to
  call it.
- **Nothing is inherited.** An inner bundle does not read `system`, `game` or `source` from the enclosing header. It
  means the same thing sliced out as it does in place, which is the entire point.
- **Depth is capped at 2.** A bundle's own parts are depth 0, a nested bundle's are depth 1, and one nested inside that
  is depth 2. Put the other way: a `bundle` part may sit at depth 0 or depth 1 and never at depth 2. Anything deeper is
  malformed, and decoders MUST enforce it so recursion stays bounded. A save, a [card](#card-map) and a
  [collection](#shapes) of cards are what fills all three tiers; they are the deepest shapes, not the only ones.
- **A bundle's parts need not be all one thing.** A `bundle` part sits beside ordinary save parts in the same array
  whenever a producer has both. See [Shapes](#shapes).
- **The outer `game` and `system` are an index.** They repeat what the inner header says so a consumer can list a card's
  or a collection's contents from the head region without stepping into payloads. Producers SHOULD keep them consistent;
  on a mismatch the inner header wins.
- `content_type` SHOULD be omitted. It is `application/vnd.1saves+cbor` by construction.

An outer part MAY use an external reference instead of embedding, which makes a **thin card**: a list of slots, dirents
and content hashes, with the saves themselves resolved from a content-addressable store.

##### Shapes

Nesting is not card-specific. Three arrangements come up often enough to name, though a decoder does not distinguish
them: all three are just a bundle whose parts include `bundle` parts.

A **card** is the one above: `card` in the header, one `bundle` part per save. `card` is header-scoped, so one bundle is
at most one card, and two cards out of the same console are a collection of two card bundles.

A **collection** has no `system`, no `game` and no `card`, and all of its parts are `bundle` parts. It is how one file
spans systems.

```text
1SAV                                       a collection: no system, no game, no card
└── parts
    ├── kind "bundle"  system "psx"        a card
    │   └── 1SAV  { card: { format: "ps1-mc", … } }
    │       └── parts   kind "bundle" per save
    ├── kind "bundle"  system "ps2"        another card, different system
    │   └── 1SAV  { card: { format: "ps2-mc", … } }
    └── kind "bundle"  system "gb"         a plain save, no card in between
        └── 1SAV  { game: { … } }
```

Entries need not all be the same tier, as above.

A **mixed bundle** is an ordinary bundle with its own `system` and `game`, whose parts happen to include a `bundle`
part. One game whose state spans two media wants it: an N64 game keeps progress in the cartridge's battery SRAM and its
ghosts in a Controller Pak, both belonging to one game on one system, so `card` stays absent and the pak nests:

```text
1SAV                                       { system "n64", game "Mario Kart 64" }
└── parts
    ├── role "cartridge"                   the battery save, an ordinary part
    └── kind "bundle"  role "controller-pak-1"
        └── 1SAV  { card: { format: "n64-cpak", … } }
            └── parts   kind "bundle" per note
```

Nesting the pak rather than keeping it as a [`card-image`](#part-kinds) buys per-note addressing and a place for the
pak's `system_area`, both of which a whole-image part gives up.

The same shape covers one system's software wrapping another's save, which is two systems and therefore two bundles
rather than one [`system`](#0-header-map) field forced to choose. A Wii Virtual Console save is a `wii` bundle whose one
`bundle` part has an inner header saying `nes`.

#### `Part` (map)

| Key | Name           | Type        | Req? | Notes                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------- | ----------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | `id`           | uint        | yes  | Stable numeric identifier within the bundle, any CBOR unsigned integer. Parts are stored in ascending `id` order, always. `id` is what an extension key names when it needs to point at one particular part. Ids are never reused: a part removed from a bundle takes its `id` with it, so a stored reference to it dangles rather than silently pointing at something else.               |
| 1   | `kind`         | text        | no   | What role this part's bytes play. Absent means `save`. See [Part kinds](#part-kinds).                                                                                                                                                                                                                                                                                                      |
| 2   | `role`         | text        | no   | Which socket these bytes came out of, not what medium they are on: a controller pak is a card that lives in a controller. Absent means `"primary"`, the only socket or the principal one. See the [Save Roles registry](/registries/roles/); a producer takes a name from there rather than inventing one, for the reason [Minting a name](#minting-a-name) gives.                         |
| 3   | `path`         | text        | no   | Where these bytes sat in the container they came from, as a relative path. Absent when the role is the whole address; `"title/00040000/data.bin"` for a 3DS extdata folder; on a card's [`bundle`](#nested-bundles) part, the name the card's directory holds for that save, which is what tells two saves of one game apart. Max 512 bytes. Forbidden: empty, leading `/`, `..` segments. |
| 4   | `slot`         | uint        | no   | The index this part occupied in whatever container it came out of: a card's directory slot, an emulator's save-state slot. Display order, not an address. A writer that packs the parts into different slots has not done anything wrong.                                                                                                                                                  |
| 5   | `dirent`       | byte string | no   | That container's own directory entry for this part, verbatim. Fully opaque: this spec never says what a byte inside it means, which is what keeps a card-format parser out of the container. Its length is fixed by the card's [`format`](#card-map), except on `saturn-bup`, which keeps its entry inside the save's first block and so omits this key.                                   |
| 6   | `content_type` | text        | no   | Media type of the payload. No [kind](#part-kinds) requires it, but it is the only place the format says what a blob is, so set it whenever there is a registered type to name.                                                                                                                                                                                                             |
| 7   | `encoding`     | text        | no   | `"zstd"` when the payload is compressed. Absent means `"none"`, which MUST NOT be written out. Compression is per-part.                                                                                                                                                                                                                                                                    |
| 8   | `size`         | uint        | some | **Uncompressed** byte length of the payload. Carried only where it cannot be derived: when the payload is `zstd` or an external reference. MUST be absent otherwise, since an embedded uncompressed payload already states its own length.                                                                                                                                                 |
| 9   | `sha256`       | tagged bstr | yes  | SHA-256 over the **uncompressed** payload, as a [hash value](/specifications/common-types/hash-value/): 32 bytes under tag `18540`. Only that tag is legal, so identity and dedup have one answer; the tag is there so a generic CBOR tool can name the digest without knowing this format.                                                                                                |
| 10  | `source`       | map         | no   | Who produced this part's bytes, when that differs from the bundle's [`source`](#source-map). Same shape as the header map. Absent means the header's source applies.                                                                                                                                                                                                                       |
| 11  | `game`         | map         | no   | Which game this part's bytes belong to, when that differs from the bundle's [`game`](#game-hints-map). Same shape as the header map. Absent means the header's game applies.                                                                                                                                                                                                               |
| 12  | `system`       | text        | no   | [Index copy](#nested-bundles) of a nested bundle's [`system`](#0-header-map). Meaningless on a part that is not a `bundle`.                                                                                                                                                                                                                                                                |
| 13  | `binding`      | text        | no   | Present when this payload is bound to the console, account or medium it came from, so it will not restore anywhere else. `device` \| `account` \| `device-account` \| `medium`. Spec-owned; a producer may not mint one, see [Minting a name](#minting-a-name). Absent means the bytes are portable. See [Bound payloads](#bound-payloads).                                                |
| -1  | `payload`      | union       | yes  | Embedded byte string with the (optionally compressed) bytes, **or** an external-reference map `{ 0: "ref", 1: <sha256 hash value>, 2: <optional URI text> }`. The reference's hash MUST equal key 9. Negative, so the whole unsigned range stays free for later minor versions; see [Additive integer keys](#additive-integer-keys).                                                       |

Keys are grouped so that a decoder reading them in order builds meaning as it goes. `kind` comes first because it
conditions everything after it: whether the payload is another bundle, whether `system` means anything, how `game`
should be read. Then where the bytes came from, then what they are, then how to read them, in the order that work
happens: inflate, allocate, verify. Refinements of the header come last, since they change nothing about the decoding.

Two limits are worth knowing. The payload lands after every unsigned key because it sits at [-1](#additive-integer-keys)
and not because of where the others are numbered, so that property survives any later assignment. And extension keys are
text, which sorts after `-1`, so a producer's own data arrives _after_ the bytes it describes; anything a consumer needs
in order to read the payload belongs in an integer key rather than an extension.

`slot` and `dirent` describe a part's place in the container it came from, and they apply at both nesting levels. On a
card's [`bundle`](#nested-bundles) part they carry the save's own directory entry; inside that nested bundle they carry
each file's, which is what a PS2 save needs, since it is a directory with an entry of its own and an entry per file.

A part's `game` refines the header's exactly as its `source` does, and for the same reason: identity belongs to each
save, not only to the file around it. A bundle holding a memory card whose saves span several titles leaves the header's
`game` absent, because none of them describes the card, and each `bundle` part names its own. A card whose saves are all
for one game may name it in the header instead, and that is the honest answer to "what is this card"; see
[a card of one game](/specifications/memory-cards/#a-card-of-one-game).

Whether the parts then repeat it is the [index copy](#nested-bundles) question, not an identity question.

No two parts in one bundle may agree on `role`, `path` and `slot` together. Those three are how a consumer names a part
to a user and matches it against a target, so two parts a consumer cannot tell apart is a bundle it cannot act on. Where
a container allows duplicate names, an N64 controller pak permits two notes with the same game code and note name, the
producer MUST carry `slot` so the two stay distinct.

A bundle is **self-contained** when every part carries its bytes inline, and **thin** when at least one part does not. A
self-contained bundle works on its own; a thin one needs an external content-addressable store to resolve the referenced
SHA-256s. A thin part MUST NOT set `encoding`: its reference is keyed by the hash of the uncompressed payload, so what
the store holds is uncompressed by construction.

Between them, `encoding` and the payload's form give a part one of three shapes, and whether `size` appears follows from
which:

| Shape                  | `size`  | `encoding` | `payload`          |
| ---------------------- | ------- | ---------- | ------------------ |
| Embedded, uncompressed | absent  | absent     | byte string        |
| Embedded, compressed   | present | `"zstd"`   | byte string        |
| Thin                   | present | absent     | external reference |

#### Bound payloads

Every console from roughly the Wii onward encrypts or signs its saves against the hardware that wrote them, binding the
bytes to it. A Wii `data.bin` is bound by the console's per-unit key. 3DS savedata and extdata on the SD card are
encrypted under a key derived from `movable.sed`, which is console-unique. PS3 and Vita saves are signed per console and
often per account.

A save can also be bound to the thing carrying it rather than to any console. An amiibo is a few hundred bytes on an NFC
tag, signed against that tag's own serial: any console can write one and the result stays valid, but copying it to a
second tag does not. Skylanders and Disney Infinity figures work the same way. Those are `medium`, and the field is
worth having for them precisely because nothing else in the part would say the bytes are stuck where they are.

Every other field in such a part reads as an ordinary save, so without `binding` a consumer would offer the file to
another console and the restore would fail or corrupt. Its presence is what a consumer acts on; the value only names
what the payload is bound to, so a consumer that has never seen the value still knows not to treat it as portable.

| Value            | Bound to                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `device`         | The console that wrote it, identified by [`source.fingerprint`](#source-map).  |
| `account`        | The user account that wrote it, whatever console it runs on.                   |
| `device-account` | Both, which is the strictest and the most common on modern consoles.           |
| `medium`         | The physical thing carrying the bytes, whatever console or account wrote them. |

The rules:

- A producer that knows the bytes it read are bound **MUST** set `binding`. Absence is a claim of portability, so a
  producer that cannot tell says so in `source` and does not guess in either direction.
- Bytes that merely _mention_ where they live are not bound. A GameCube save for Phantasy Star Online carries the
  destination card's flash serial and a checksum over it, and a writer re-signs both on every copy, so the save is
  portable and **MUST NOT** set `binding`. The test is whether anything but the original can be made to accept it.
- A consumer **MUST NOT** present a bound payload as restorable to anything but the producer named in `source`. It
  **MUST** still store, sync, hash and round-trip it like any other part.
- `binding` belongs on the part holding the bound bytes. On a card, that is a part inside the nested bundle, not the
  `bundle` part wrapping it.
- Two consoles writing the same save produce different bound bytes, so they produce different `sha256` values and
  different [content hashes](#content-hash-and-file-hash). Bound saves do not deduplicate across devices, and cannot.

### Layout consequences

The two-element shape pins `parts` to position [1], which encodes after the header [0]. That is the whole of the layout
this format guarantees. Where a key sits inside a part is not part of it: `payload` at [-1](#part-map) does sort after
every unsigned key, so a blob lands at its part's tail in practice, but nothing may depend on that.

- **Cheap identification**: the header occupies a small head region (typically <2 KiB), so a consumer that only needs to
  know what a bundle is reads the front and stops. Listing what a card or a [collection](#shapes) _holds_ is a different
  read: entry two sits behind entry one's blob, so a consumer walks the parts and skips each payload by its length
  prefix. That is a handful of seeks rather than a decode, and it never touches a nested bundle's bytes.
- **Cheap header rewrites**: changing the header re-encodes the head region only. Part bytes shift by the size delta,
  but none of their content changes, so a rewriter copies them through without re-encoding or re-hashing anything.
- **Appending a part**: parts sort by ascending `id`, so a new one goes last. A writer updates the array's count and
  appends, without touching a byte of any existing part.
- **Payloads are contiguous and length-prefixed**: every payload is a definite-length byte string at a known offset. A
  decoder can mmap the file and hand out payload slices without copying, and never has to hold a blob in memory to parse
  the parts around it.
- **In-place blob streaming on encode**: a writer can serialize the head, then stream each part's bytes directly into
  the output without holding them in memory. A `zstd` part is the exception, since a CBOR byte string is length-prefixed
  and the compressed length is only known once compression finishes.

### Content hash and file hash

A bundle has two hashes, and they answer different questions.

The **file hash** is the SHA-256 of the bytes on disk (bundle tag + array, as encoded). It identifies this exact file,
and it is what an integrity check compares.

The **content hash** is the SHA-256 of the bundle's _normalized_ encoding: the same logical bundle, canonically encoded,
with every part uncompressed and every payload embedded. It is a pure function of what the bundle says, so two producers
that build the same logical bundle agree on it. That is the identifier a content-addressable store keys on, and the
value a [`bundle`](#nested-bundles) part's `sha256` holds.

They are the same value for a bundle that is self-contained and uncompressed, which is every bundle nested inside
another. They differ otherwise, and the reason they have to be defined separately is that determinism does not survive
either compression or external references:

- `zstd` output depends on the implementation, its version and the level, none of which the format pins, so two encoders
  building the same logical bundle produce different files.
- A thin bundle and its self-contained twin say the same thing with different bytes, so they cannot share a file hash
  and must not have different content hashes. The price is that a thin bundle cannot compute its own content hash:
  normalizing it means embedding every referenced payload, which means resolving every reference against the store
  first.

#### What a content hash does not answer

Both hashes are over bytes, and identical bytes are a stronger claim than identical save. Two honest dumps of one
cartridge can differ in length or padding, and two consoles produce different [bound](#bound-payloads) bytes for the
same progress, so one save can arrive under two content hashes.

The format has no canonical byte form for a save and does not try to acquire one, since deciding that a 64 KB dump and
its 32 KB half are the same save takes exactly the per-system parsing this container keeps out. The content hash answers
"are these the same bytes", which is what a store needs to deduplicate safely; a producer that wants "is this the same
playthrough" builds that on top.

## Extensions

The spec owns the integer-keyed namespace of every map it defines. Everything else attaches through **extension keys**:
map entries whose key is a text string in [reverse-DNS form](/specifications/common-types/reverse-dns-name/)
(`x.1sav.rtc`, `com.1retro.forge`). This is how a clock reading, parser-extracted gameplay tags, emulator-native
structures and third-party annotations ride along, without the spec needing to know anything about them.

The [header](#0-header-map) and a [`Part`](#part-map) both take them, flat, alongside their integer keys. The rules:

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

### Known extension keys

The keys people have defined are catalogued in [Extensions](/specifications/extensions/).

A key whose meaning is not one producer's takes a reserved name in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) rather than any company's domain, and these
specifications define it like any other page in the catalogue. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) is
the one to read: it carries a clock reading normalized to a Unix instant, with
[`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) under it for the chip state a GBA cartridge keeps.
[`com.1retro.forge`](/specifications/extensions/com.1retro.forge/) is the contrast: what one parser read out of a save
is that parser's, so its key sits under the domain 1retro holds rather than in the shared tree.

## Out of scope of this specification

The spec deliberately does _not_ cover:

- **Encryption.** The bundle is plaintext CBOR. Confidentiality is the transport's responsibility (TLS) or a separate
  envelope. Unbinding a [bound payload](#bound-payloads) is out too: decryption, where it is even possible, needs keys
  this format does not carry.
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

## Appendix A: CDDL schema

A [CDDL](https://www.rfc-editor.org/rfc/rfc8610) (RFC 8610) schema describes a v1 bundle. It lives in
[`universal-saves-format.cddl`](https://github.com/one-retro/docs/blob/main/src/content/docs/specifications/universal-saves-format.cddl),
the single source of truth that validators such as `cddl` and `cuddle` consume directly. The
[rendered copy](/specifications/universal-saves-format-cddl/) carries it alongside the list of what a schema can and
cannot check here.
