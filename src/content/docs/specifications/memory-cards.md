---
title: Memory Cards
description:
  What a writer has to regenerate to put saves back on a memory card, the per-format facts it needs, and worked examples
  of real cards.
---

How a card is represented is in the [Universal Saves Format](/specifications/universal-saves-format/#nested-bundles):
the card is a bundle, its `card` map holds the card's own properties, and each save is a `bundle` part carrying that
save's directory entry. This page is the other half, the part that is specific to real hardware. What a writer has to
regenerate. What each format fixes. What splitting costs, worked through on actual cards.

That representation is enough to write the saves back onto a card of the same kind. It is not enough to reproduce the
original card byte for byte, and it is not meant to be. A producer that wants byte-exact fidelity keeps a
[`card-image`](/specifications/universal-saves-format/#part-kinds) part alongside the split saves.

## Per-format facts

`format` fixes the length of `dirent`:

| Format       | `dirent` | Notes                                                                        |
| ------------ | -------- | ---------------------------------------------------------------------------- |
| `ps1-mc`     | 128      |                                                                              |
| `ps2-mc`     | 512      | One entry for the save's directory, one per file inside it.                  |
| `n64-cpak`   | 32       |                                                                              |
| `gc-mc`      | 64       |                                                                              |
| `vmu`        | 32       |                                                                              |
| `neogeo-mc`  | 4        |                                                                              |
| `saturn-bup` | none     | The entry lives in the first block of the save itself, so the key is absent. |

The names are the ones already in circulation for these layouts, not system slugs with a suffix, which is why `ps1-mc`
says `ps1` where the [registry](/registries/systems/) says `psx`, and why `vmu` carries no system at all. Reading a
system out of one of these names is a mistake; that is what
[`system`](/specifications/universal-saves-format/#0-header-map) is for.

The table covers the formats this spec has rebuild rules for, not every backup medium ever built. PC Engine internal
backup RAM, a Famicom Disk System disk, a WonderSwan's internal EEPROM and several others have no entry yet, and adding
one means documenting its `dirent` length and its rebuild rules alongside the name.

## Capacity and out-of-band bytes

[`capacity`](/specifications/universal-saves-format/#card-map) is the card's data capacity: the bytes saves can occupy.
It is not necessarily the length of a dump of that card, because some media carry an out-of-band area that is invisible
to the filesystem.

PS2 is the case that bites. An 8 MB PS2 card holds 8388608 bytes of data, and a raw dump from a hardware reader is
8650752 bytes, because every 512-byte page carries 16 further bytes of spare area holding ECC. So `capacity` on a PS2
card is 8388608, and a byte-exact [`card-image`](/specifications/universal-saves-format/#part-kinds) part of the same
card is 8650752 bytes, and the two are _supposed_ to disagree. Read the image's length off its own `size`; never derive
it from `capacity`.

The split follows what a writer does. ECC is regenerated on write, like every other structural field below, so a save's
payload never carries it and `capacity` never counts it. A `card-image` keeps it, because keeping the card byte for byte
is the only reason that part exists.

## Why there are no block positions

Because no console addresses a save by block, and every tool that moves saves between cards throws that field away:

- The PS1 memory card format specifies that a `.mcs` importer parse the filename and the filesize "while other fields
  should be ignored", reconstructing the rest against the destination card.
- Dreamcast's `.dci` specification says outright that "the 'location of first block' field should be ignored when
  reading".
- MPKEdit writes `0xCAFE` over the start-page field when it exports an N64 `.note`, and uses that as the file's type
  magic.
- Dolphin overwrites a `.gci`'s stored first block on every load, allocating fresh blocks at the destination.

Consoles open saves by name and identifier instead: `bu00:BASLUS-XXXXX` on PS1, gamecode plus makercode plus filename on
GameCube, company and game code plus note name on N64, NGH plus sub-number on Neo Geo. Block placement is an allocator's
business, so recording it would preserve a number that is wrong the moment the save lands anywhere else.

Block _counts_ are a different thing, and they are still not stored, because they are derivable: a producer stores
exactly the bytes the card allocated, so the count is the nested bundle's total payload size divided by the format's
block size.

## What a writer regenerates

Everything structural: block chains, the FAT or BAT and its mirrors, every checksum, the header block, directory
ordering, and ECC where the medium has it. `dirent` plus the payload is sufficient input for every format here, which is
what `.mcs`, `.psu`, `.note` and `.gci` each demonstrate in production, since none of them carries more than that.

Three cases need more:

- **Saturn** stores its own block chain inside the save's first block, so a writer rewrites those numbers rather than
  treating the payload as opaque. It is the only format here where that is true.
- **GameCube** saves for Phantasy Star Online and F-Zero GX embed the destination card's flash serial and a CRC32 over
  it, and the game rejects a save whose serial does not match. A writer re-signs them, as Dolphin does on every copy.
- **Dreamcast** mini-games must start at block 0 and stay contiguous, because they execute in place from flash. The
  dirent's type byte distinguishes them (`0xCC` for a mini-game, `0x33` for data), so a writer can tell without
  understanding the payload.

Neo Geo needs contiguity too, and stores no length of its own, so a writer allocates a run of the save's size rather
than following a chain.

## What splitting a card drops

[`system_area`](/specifications/universal-saves-format/#card-map) is what a writer needs to rebuild a card's own
identity rather than only its contents: an N64 controller pak's 32-byte label, a Neo Geo card's 16-byte cardholder
username, a Dreamcast VMU's custom colour and icon shape. None of it belongs to any save, so splitting a card would
otherwise drop it, and keeping it would otherwise mean keeping a whole `card-image` for a few dozen bytes.

What `system_area` does not cover is the residue of deleted saves, whose payload blocks a card keeps intact long after
the directory stops pointing at them, and the contents of free blocks. Neither belongs to any save, so neither survives
a split, and a producer that wants them keeps a `card-image` too. That is the whole of what splitting a card costs.

## Several saves for the same game

A card routinely holds more than one save for a single game, because many of them write one file per save slot. Final
Fantasy VII is the extreme case: one 8192-byte block per save, named `BASCUS-94163FF7-S01` through `-S15` on the US
release, which is fifteen separate directory entries and every block a PS1 card has. A card can be nothing but Final
Fantasy VII saves. Each is a separate save, and nothing about the game identifies which is which.

Two details of that naming are worth having, because they are what `path` and `slot` are each for:

- **The `-Sxx` number is the game's slot, not the card's.** It is the slot Final Fantasy VII shows in its own menu, and
  it lands in whatever directory slot the card's allocator picked. Save to the game's slot 7 on an empty card and
  `…FF7-S07` sits in directory slot 1. `path` carries the first, `slot` the second, and they are independent.
- **All three US discs share one save name.** The discs are `SCUS-94163`, `SCUS-94164` and `SCUS-94165`, but the save
  filename always carries the disc-1 code so every disc reads the same saves. A `serial` taken from a card filename is
  the save's product code, not necessarily the code of the disc that wrote it.

## Saves made of several files

A PS2 save is a directory: `BASLUS-20312/` holding `icon.sys`, an icon file and the game's own data. Those are the parts
of that save's nested bundle, distinguished by [`path`](/specifications/universal-saves-format/#part-map) exactly as
`path` already covers 3DS extdata.

The directory has a directory entry of its own, carrying its mode bits and timestamps, and it belongs to no file. That
one rides on the outer `bundle` part, alongside the slot. `.psu` is laid out the same way, with the directory's entry
first and `.` and `..` behind it.

## Worked example: a PS1 card

Three saves on a 128 KiB card, two of them for the same game. The Final Fantasy VII saves went to the game's slots 1 and
3, and landed in directory slots 1 and 2 in the order they were written.

```text
[0] header:
{
  1: "psx",
  4: { 0: "ps1-mc", 1: 131072 },
}

[1] parts:
  { 0: 0, 1: "bundle", 2: "memcard-1", 3: "BASCUS-94163FF7-S01", 4: 1, 5: h'…128 bytes…',
    9: 18540(h'…'), 11: { 3: "SCUS-94163", 4: "Final Fantasy VII" }, 12: "psx",
    -1: h'DA31534156…' }

  { 0: 1, 1: "bundle", 2: "memcard-1", 3: "BASCUS-94163FF7-S03", 4: 2, 5: h'…128 bytes…',
    9: 18540(h'…'), 11: { 3: "SCUS-94163", 4: "Final Fantasy VII" }, 12: "psx",
    -1: h'DA31534156…' }

  { 0: 2, 1: "bundle", 2: "memcard-1", 3: "BASLUS-00594", 4: 3, 5: h'…128 bytes…',
    9: 18540(h'…'), 11: { 3: "SLUS-00594", 4: "Metal Gear Solid" }, 12: "psx",
    -1: h'DA31534156…' }
```

Each payload is a complete bundle holding one part, the save's 8192 bytes, plus the inner bundle's own framing. The two
Final Fantasy VII entries differ from the Metal Gear Solid one by a single byte, because their game names differ by a
character. The header carries no `game`, because none of the three describes the card. Each nested bundle's `size`
covers every block the save occupied, so a save spanning two blocks is one part of 16384 bytes, and the fact that its
two blocks were not adjacent is not recorded.

Inside the first payload:

```text
[0] header:
{
  1: "psx",
  2: { 3: "SCUS-94163", 4: "Final Fantasy VII" },
  5: "Midgar, before the reactor",
}

[1] parts:
  { 0: 0, 9: 18540(h'…'), -1: h'…8192 bytes…' }
```

The inner part carries no `slot` and no `dirent`. A Final Fantasy VII save is one file with one directory entry, and
that entry is on the outer part. That is the whole difference from the PS2 case below, where the save is a directory and
its files have entries of their own.

### A card of one game

Fifteen Final Fantasy VII saves fill a PS1 card, and the shape above still holds. Three things about that card are worth
knowing before you build one.

The `game` map appears sixteen times: once in each nested bundle, and once per outer part as the index copy. The inner
copies are not removable. [Nothing is inherited](/specifications/universal-saves-format/#nested-bundles) across the
nesting boundary, which is exactly what lets a save be sliced out of the card as a byte copy and still say what game it
belongs to. The outer copies are removable, since a part with no `game` falls back to the header's, and dropping all
fifteen of them recovers 495 bytes out of 128505. That is 0.4%, in exchange for giving up listing the card without
reading a payload.

Such a card may name Final Fantasy VII in its own header, because for once a single game does describe the whole card.
That is the exception to the rule that a card has no header `game`, and it is what makes the card answer "yes" to
[the identified test](/specifications/universal-saves-format/#0-header-map).

The other thing the full card shows is what splitting is worth. Fifteen saves come to 128505 bytes against the 131072 of
a raw card image, so splitting a card that is genuinely full saves nothing. What it buys is that each save is separately
addressable, extractable and content-hashed.

## Worked example: a PS2 save

One game, three files plus the directory's own entry, on an 8 MB card. `capacity` is the card's data capacity, which is
not the length of a dump of it; see [Capacity and out-of-band bytes](#capacity-and-out-of-band-bytes).

```text
[0] header:
{
  1: "ps2",
  4: { 0: "ps2-mc", 1: 8388608 },
}

[1] parts:
  { 0: 0, 1: "bundle", 2: "memcard-1", 3: "BASLUS-20312", 4: 3, 5: h'…512 bytes…',
    9: 18540(h'…'), 11: { 3: "SLUS-20312", 4: "Final Fantasy X" }, 12: "ps2",
    -1: h'DA31534156…' }
```

and inside that payload, the save itself:

```text
[0] header:
{
  1: "ps2",
  2: { 3: "SLUS-20312", 4: "Final Fantasy X" },
}

[1] parts:
  { 0: 0, 3: "icon.sys",     4: 4, 5: h'…512 bytes…', 9: 18540(h'…'), -1: h'…' }
  { 0: 1, 3: "list.ico",     4: 5, 5: h'…512 bytes…', 9: 18540(h'…'), -1: h'…' }
  { 0: 2, 3: "BASLUS-20312", 4: 6, 5: h'…512 bytes…', 9: 18540(h'…'), -1: h'…' }
```

The directory's own entry is on the outer part, which is what a writer needs to recreate the directory with the right
mode bits and timestamps. Each file's entry is on its own inner part. The outer payload is the three inner payloads plus
the inner bundle's framing, most of which is the three 512-byte dirents. A card holding several PS2 saves repeats this
arrangement once per save, and nothing has to infer where one save ends and the next begins.
