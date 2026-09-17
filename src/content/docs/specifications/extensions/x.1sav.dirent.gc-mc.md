---
title: x.1sav.dirent.gc-mc
description: A GameCube memory card directory entry, field by field, for the writer that has to build one.
slug: specifications/extensions/x.1sav.dirent.gc-mc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a part · **Status:**
normative schema, optional to carry

The 64 bytes a GameCube memory card keeps for one save, as fields rather than as a blob. This is the write half of
[`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/), which normalizes the two times any card records but does
not rebuild an entry. The name sits under that key rather than beside it, the way each chip has a key of its own under
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/).

## Schema

```cddl file=./x.1sav.dirent.gc-mc.cddl

```

`game_code` and `maker_code` are the ASCII identifiers at 0x00 and 0x04.
[`game`](/specifications/bundle/#game-hints-map)'s `serial` usually holds them joined, but that is a hint a producer may
normalize or omit.

`filename` is the raw name at 0x08 without its padding, carried as bytes rather than text: a Japanese save names itself
in Shift-JIS and [`path`](/specifications/bundle/#part-map) is UTF-8 by construction, so transcoding in and back out
need not land on the same 32 bytes.

`banner_flags`, `icon_format` and `anim_speed` at 0x07, 0x30 and 0x32 stay packed as the hardware packs them, two bits
per icon and two bits per frame. The decoded picture is [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/).

`permissions` and `copy_counter` at 0x34 and 0x35 are the copy protection bits and the count a console decrements.

`image_offset` and `comments_offset` at 0x2c and 0x3c point into the payload, and are absent where the entry holds
`0xffffffff`.

## What a writer fills in

Four fields of the 64 are not carried here.

| Field         | Offset     | Instead                                                                                              |
| ------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `modtime`     | 0x28       | Carried normalized as `modified_at` in [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/). |
| `first_block` | 0x36       | The allocator's, and [regenerated](/specifications/memory-cards/#what-a-writer-regenerates).         |
| `block_count` | 0x38       | Payload size over the [block size](/specifications/memory-cards/#per-format-facts).                  |
| padding       | 0x06, 0x3a | Constant `0xff` and `0xffff`.                                                                        |

Re-serializing this key therefore reproduces the entry except for the fields a writer owns. A consumer that wants the
original 64 bytes reads the part's [`dirent`](/specifications/bundle/#part-map).

## When to set it

When the producer parsed the entry, and when something downstream may have to build one. A producer **MUST NOT** write a
field the entry does not hold: there is nothing to normalize here, so a value that is not the entry's is wrong.
