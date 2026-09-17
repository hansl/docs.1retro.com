---
title: Collections
description: The `collection` shape, which is several cards and saves carried in one file.
---

A `collection` bundle is several cards and saves in one file. It is how one file spans systems, and it is the only shape
with nothing of its own to say.

## Header

`shape` is `"collection"`. `system`, `game` and `card` are all forbidden, because a collection describes no single
system, no single game and no card: each of those belongs to an entry.

| Key | Name          | Req? | Notes                              |
| --- | ------------- | ---- | ---------------------------------- |
| 0   | `shape`       | yes  | `"collection"`.                    |
| 3   | `source`      | no   | What assembled it.                 |
| 5   | `description` | no   | Free-form note.                    |
| 6   | `created_at`  | no   | When the collection was assembled. |

## Parts

Every part is a [`bundle` part](/specifications/bundle/#nested-bundles), one per entry, and each entry is a complete
[card](/specifications/cards/) or [save](/specifications/saves/).

```text
1SAV                                       shape "collection"
└── parts
    ├── kind "bundle"  system "psx"        a card
    │   └── 1SAV  { shape: "card", card: { format: "ps1-mc", … } }
    │       └── parts   kind "bundle" per save
    ├── kind "bundle"  system "ps2"        another card, different system
    │   └── 1SAV  { shape: "card", card: { format: "ps2-mc", … } }
    └── kind "bundle"  system "gb"         a plain save, no card in between
        └── 1SAV  { shape: "save", game: { … } }
```

Entries need not all be the same tier, as above.

Entries need not be the same shape. A collection can hold a PS1 card, a PS2 card and a loose Game Boy save side by side,
and a consumer reads each entry's own `shape` to know which it has.

The outer part's `system` and `game` repeat what the entry's own header says, so a consumer can list a collection from
the head region without opening payloads. They are an index: producers **SHOULD** keep them consistent, and the inner
header wins on a mismatch.

## Depth

A collection may hold cards, and a card holds saves, which is the deepest the format goes. Nesting is
[capped at two](/specifications/bundle/#nested-bundles), so a collection of collections is malformed. Two cards out of
the same console are one collection of two card bundles, not a collection of collections.
