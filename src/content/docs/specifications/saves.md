---
title: Saves
description: The `save` shape, which is one game's state and the only document a producer of saves has to read.
---

A `save` bundle is one game's state as the medium stored it. It is the shape an emulator or a cartridge reader writes,
and this is the only document such a producer needs: cards and collections are other shapes, with documents of their
own.

## Header

`shape` is `"save"`. Everything else identifies what the bytes are.

| Key | Name          | Req? | Notes                                                                        |
| --- | ------------- | ---- | ---------------------------------------------------------------------------- |
| 0   | `shape`       | yes  | `"save"`.                                                                    |
| 1   | `system`      | no   | What will load these bytes. See the [System Registry](/registries/systems/). |
| 2   | `game`        | no   | Identification hints. Absent means unidentified, which is a valid save.      |
| 3   | `source`      | no   | What produced it.                                                            |
| 5   | `description` | no   | Free-form note.                                                              |
| 6   | `created_at`  | no   | When the bundle was assembled, not when the player saved.                    |

`card` is forbidden. A save that came off a card is still a save; the card it came off is a
[card bundle](/specifications/cards/) that holds it.

The full definitions are in the [header map](/specifications/bundle/#0-header-map). Everything about the save that is
not in a payload belongs here, because the header is what survives the bundle being carried anywhere.

## Parts

One part, and that part is the save. Its payload is the bytes the console wrote, its `sha256` is the digest of those
bytes, and every other part key is absent: `kind` defaults to `save`, `role` to `primary`, `path` to nothing.

A consumer **MAY** refuse a save bundle with more than one part. A producer that writes one part is therefore the
producer most consumers can read, and an emulator writing a cartridge save has no reason to write more.

| Key | Name      | Req?           | Notes                                                            |
| --- | --------- | -------------- | ---------------------------------------------------------------- |
| 0   | `id`      | yes            | The part's index, counting from 0.                               |
| 9   | `sha256`  | yes            | Tag 18540 over the uncompressed payload.                         |
| -1  | `payload` | yes            | The bytes, or a reference to them. Always last in the map.       |
| 7   | `size`    | on compression | The uncompressed length, carried only when it cannot be derived. |

Every other key is for a save the container gave more than one part, and [Bundle](/specifications/bundle/#part-map)
defines them all.

### Carrying the payload

Three forms, and a producer picks one:

- **Embedded**, the ordinary case: `sha256` and the bytes. No `encoding`, no `size`, because an embedded uncompressed
  payload states its own length.
- **Compressed**: `encoding`, `size` and `sha256`, then the compressed bytes. `sha256` and `size` both describe the
  payload _before_ compression, so neither changes when a producer recompresses.
- **Thin**: `size` and `sha256`, and a reference instead of bytes, to be resolved from a content-addressable store. A
  thin part **MUST NOT** set `encoding`, since the store is keyed by the hash of the uncompressed payload.

### Encoding

Every container is definite-length and deterministically encoded per RFC 8949 section 4.2: map keys in canonical order,
preferred integer heads, no indefinite lengths. Text is NFC. The rule and its reasons are in
[One encoding per bundle](/specifications/universal-saves-format/#one-encoding-per-bundle), and a producer that emits
canonical CBOR meets it without doing anything special.

### When there is more than one

Three cases need it, and a producer that does not meet them should not reach for it.

- **Several sockets.** One game whose state spans two places on the same system: 3DS savedata in `sysnand` beside
  extdata on `sd`, or an N64 cartridge save beside a Controller Pak. [`role`](/registries/roles/) tells them apart, and
  the pak is a [`bundle` part](/specifications/bundle/#nested-bundles) because it is a card of its own.
- **Several files.** A PS2 save is a directory and a 3DS extdata save is a folder.
  [`path`](/specifications/bundle/#part-map) tells those apart.
- **Anything else binary.** An [`aux` part](/specifications/bundle/#part-kinds) with a `content_type`.

A `save` may itself hold a `bundle` part, which is how one game's state spans two media. An N64 game keeps progress in
the cartridge's battery SRAM and its ghosts in a Controller Pak, both belonging to one game on one system, so the shape
stays `save` and the pak nests:

```text
1SAV                                       { shape: "save", system: "n64", game: "Mario Kart 64" }
└── parts
    ├── role "cartridge"                   the battery save, an ordinary part
    └── kind "bundle"  role "controller-pak-1"
        └── 1SAV  { shape: "card", card: { format: "n64-cpak", … } }
            └── parts   kind "bundle" per note
```

Nesting the pak rather than keeping it as a [`card-image`](/specifications/bundle/#part-kinds) buys per-note addressing
and a place for the pak's `system_area`, both of which a whole-image part gives up.

The same arrangement covers one system's software wrapping another's save, which is two systems and therefore two
bundles rather than one [`system`](/specifications/bundle/#0-header-map) field forced to choose. A Wii Virtual Console
save is a `wii` bundle whose one `bundle` part has an inner header saying `nes`.

No two parts may agree on `role`, `path` and `slot` together, which is
[how a consumer names one](/specifications/bundle/#part-map).

## Extension keys

These attach to the header, because they describe the save and travel with it:

- [`x.1sav.label`](/specifications/extensions/x.1sav.label/), what a console calls the save.
- [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/), the picture it shows for it.
- [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/), a clock reading, where the save carries one.

## The smallest valid save

A shape, one part, and the digest of its payload:

```text
827539798([
  { 0: "save", 1: "gb" },
  [ { 0: 0, 9: 18540(h'…32 bytes…'), -1: h'…the SRAM…' } ]
])
```

Everything else is optional. A save with no `game` is unidentified rather than malformed, and a consumer stores it and
lets the user associate it later.

## What a saves producer can ignore

The `card` map, `slot`, `dirent` and directory entries belong to [Cards](/specifications/cards/). Nesting, content
hashes against file hashes, and the depth cap matter only where a bundle holds another one. A producer writing single
saves needs none of it.
