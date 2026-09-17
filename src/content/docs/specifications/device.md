---
title: Devices
description: The `device` shape, which is one console's storage read whole, components and all.
slug: specifications/device
---

A `device` bundle is one console's storage as it was when read: every component that holds saves, each a complete
[card](/specifications/cards/) or [save](/specifications/saves/) of its own.

Several systems keep saves in more than one place at once. A Sega CD has internal backup RAM and a Backup RAM Cart, a
Neo Geo CD has internal storage beside a memory card, and an MVS cabinet keeps its own backup RAM behind the card slot.
None of those pairs is one game's state, so none is a [save](/specifications/saves/); none is a single card, so none is
a [card](/specifications/cards/); and all of them came off one system, which is what a
[collection](/specifications/collections/) is not allowed to say.

## Header

`shape` is `"device"`, and `system` is required: it is what a device has that a collection does not.

| Key | Name          | Req? | Notes                                              |
| --- | ------------- | ---- | -------------------------------------------------- |
| 0   | `shape`       | yes  | `"device"`.                                        |
| 1   | `system`      | yes  | The system whose storage this is. A device is one. |
| 3   | `source`      | no   | What read it.                                      |
| 5   | `description` | no   | Free-form note.                                    |
| 6   | `created_at`  | no   | When the dump was assembled.                       |

`game` is forbidden, because the components hold saves for many games rather than for one, and `card` is forbidden,
because a device is not a card even when it holds one.

## Parts

Every part is a [`bundle` part](/specifications/bundle/#nested-bundles), one per component, and each carries a
[`role`](/registries/roles/) naming where that component sits: `internal`, `cartridge`, `memcard-1`. The role is what a
writer puts the component back by, so it is the one field a device's part cannot omit.

```text
1SAV                                       { shape: "device", system: "segacd" }
└── parts
    ├── kind "bundle"  role "internal"     the console's own backup RAM
    │   └── 1SAV  { shape: "save", system: "segacd" }
    └── kind "bundle"  role "cartridge"    the Backup RAM Cart
        └── 1SAV  { shape: "card", card: { … } }
```

A component with a directory is a `card`; a flat one is a `save`, carrying no `game` where it holds saves for several.
Those are the only two, since a device holds no device and no collection. No two parts may share a `role`, which is the
ordinary [addressing rule](/specifications/bundle/#part-map) and here is the whole of what keeps two components apart.

A device is also where a dump lands that holds one game's storage across two components rather than a whole console's.
An N64 cartridge save beside the whole Controller Pak is a device: the pak is a card of its own, holding notes for games
the cartridge knows nothing about. Carry only that game's note instead and there is no device, just a
[save](/specifications/saves/) with two ordinary parts.

## Merging two devices

Two device bundles **MAY** be merged when they name the same `system` and no part of one shares a `role` with a part of
the other. The result is a device whose parts are the union of theirs, renumbered by `id`. This is the case worth
having: a producer that read the internal RAM on Monday and the cart on Tuesday can put the pair together without either
dump having anticipated the other.

Where two parts do share a `role`, the two bundles hold the same component read twice, and this format does not say
which wins. A consumer **MUST NOT** merge them silently: decline, or ask. Identical is the one case it may settle alone,
since two parts with the same [content hash](/specifications/bundle/#content-hash-and-file-hash) are the same component
and either will do.

A merged bundle is newly assembled, so its `created_at` is the time of the merge and its `source` is whatever performed
it. What each component says about itself is untouched, because merging moves nested bundles whole and never opens one.

Merging the _contents_ of two components is a different question and not one this format answers. Two dumps of one card
whose directories disagree need a rule about which save wins, and that rule belongs to whatever is doing the merging.
