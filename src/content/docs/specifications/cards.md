---
title: Cards
description: The `card` shape, which is one memory card holding its saves one per part.
---

A `card` bundle is one memory card. Its header describes the card and nothing else; each save it holds is a
[`bundle` part](/specifications/bundle/#nested-bundles) carrying a complete [save bundle](/specifications/saves/).

What a writer has to regenerate to put those saves back on real hardware, and the numbers each format fixes, are in
[Memory Cards](/specifications/memory-cards/).

## Header

`shape` is `"card"`, and `card` is required: it is what makes the bundle one.

| Key | Name          | Req? | Notes                                                                            |
| --- | ------------- | ---- | -------------------------------------------------------------------------------- |
| 0   | `shape`       | yes  | `"card"`.                                                                        |
| 1   | `system`      | no   | The system the card belongs to. A card is one system.                            |
| 2   | `game`        | no   | Only where every save on the card is for one game.                               |
| 3   | `source`      | no   | What read the card.                                                              |
| 4   | `card`        | yes  | The card's [format, capacity and system area](/specifications/bundle/#card-map). |
| 5   | `description` | no   | Free-form note.                                                                  |
| 6   | `created_at`  | no   | When the dump was assembled.                                                     |

The header says nothing about any individual save. What a save is called, what it looks like and what game it is for are
in that save's own header, inside its nested bundle, where they stay correct once the save is sliced out.

## Parts

One [`bundle` part](/specifications/bundle/#nested-bundles) per save, plus whatever belongs to the card itself.

A save's part carries the card's record of that save, and only that:

| Key | Name     | Notes                                                                         |
| --- | -------- | ----------------------------------------------------------------------------- |
| 3   | `path`   | The name the card's directory holds, which tells two saves of one game apart. |
| 4   | `slot`   | Its index in the directory.                                                   |
| 5   | `dirent` | Its directory entry, verbatim bytes.                                          |
| 2   | `role`   | Which socket the card was in, where that matters.                             |
| 9   | `sha256` | The inner bundle's content hash, which is the save's identity.                |

Card-level parts sit beside those: a [`card-image`](/specifications/bundle/#part-kinds) for a byte-exact archive of the
whole medium, and `aux` for anything else binary that belongs to the card rather than to a save.

A save's files are **not** parts of the card. They are parts of that save's own bundle, which is
[required and not conventional](/specifications/bundle/#nested-bundles): a save flattened into its card has no bundle to
hash, and so no identity.

## Extension keys

On a save's part, describing the card's record of it:

- [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/), when the directory dates the save and last wrote it.
- [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/) and the other per-format keys, which
  decompose the entry so a writer can rebuild it.

[`x.1sav.label`](/specifications/extensions/x.1sav.label/) and [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/)
go on the nested save's own header instead, since they describe the save rather than the card. `x.1sav.label` MAY also
be repeated on the part as an index copy, so a consumer can list the card without opening every payload.
