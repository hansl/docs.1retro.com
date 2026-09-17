---
title: x.1sav.dirent
description: What a card's directory records about one save, normalized to a Unix instant.
slug: specifications/extensions/x.1sav.dirent
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a part · **Status:**
normative schema, optional to carry

When a card's directory dates a save and when it says the console last wrote it, on a scale a consumer can read without
knowing how that card counts time. The entry itself is carried verbatim in [`dirent`](/specifications/bundle/#part-map),
which is enough to write the save back onto a card and useless for anything else. The name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) because the value belongs to no single producer.

## Schema

```cddl file=./x.1sav.dirent.cddl

```

`created_at` is the time the directory dates the entry from, and `modified_at` the time it records for the last write. A
format carries whichever it keeps: a GameCube entry has a modify time and no creation time, a VMU entry the reverse, a
PS2 entry both. A producer holding neither omits the key, which is why the schema is a choice rather than two optional
keys.

Four of the seven [card formats](/specifications/memory-cards/) date an entry. PS1 and Neo Geo carry no time, and Saturn
keeps its date inside the save rather than in a directory.

## Where it goes

The part that stands for one entry in a card's directory: on a card the
[`bundle` part](/specifications/bundle/#nested-bundles) holding the save, and inside a PS2 save the inner part carrying
each file. These times are the card's record and do not survive the save being sliced out, which is why they sit beside
the raw `dirent` bytes rather than in the save's own header.

What does survive is scoped the other way. [`x.1sav.label`](/specifications/extensions/x.1sav.label/) and
[`x.1sav.icon`](/specifications/extensions/x.1sav.icon/) sit on the nested bundle's header, and
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes further and sits only on a save's header, for
the same reason in reverse.

## What does not go here

- **What the save is called, and what it looks like.** [`x.1sav.label`](/specifications/extensions/x.1sav.label/) and
  [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/).
- **Block counts.** Derivable from the payload and the format's
  [block size](/specifications/memory-cards/#per-format-facts).
- **The name the card's directory holds.** [`path`](/specifications/bundle/#part-map), which a consumer matches on.
- **Permission bits, copy protection, a VMU's mini-game type byte.** Format-specific, so they belong under a key named
  for the [card format](/specifications/memory-cards/#per-format-facts) it decomposes. A producer that wants a consumer
  to rebuild an entry carries both keys.

## The format keys

Only a format whose entry holds something a writer cannot get elsewhere gets one, and three of the seven do not.

| Format       | Key                                                                      | Why                                                                                                            |
| ------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `gc-mc`      | [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/) | Comment and image addresses, icon format, permissions.                                                         |
| `ps2-mc`     | not yet written                                                          | Mode bits, attributes and two timestamps per entry.                                                            |
| `vmu`        | not yet written                                                          | The mini-game type byte, copy protection, a header offset.                                                     |
| `n64-cpak`   | not yet written                                                          | A company code and the note's own character encoding.                                                          |
| `neogeo-mc`  | never                                                                    | Its 4 bytes are an NGH number and a sub-number, which are `path`, and a FAT index, which a writer regenerates. |
| `saturn-bup` | never                                                                    | No directory entry to decompose.                                                                               |
| `ps1-mc`     | never                                                                    | Its frame holds a filename, a state byte and a block link: `path`, and two things a writer regenerates.        |

## When to set it

Only when the producer read the entry. A producer that would be guessing omits the key, and **MUST NOT** substitute the
time it performed the dump, which is [`created_at`](/specifications/bundle/#0-header-map) in the bundle header.
