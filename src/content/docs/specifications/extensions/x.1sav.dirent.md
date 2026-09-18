---
title: x.1sav.dirent
description:
  What a card's directory records about one save, on a scale a consumer can read, with the zone where one is known.
slug: specifications/extensions/x.1sav.dirent
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a card's or save's part
· **Status:** normative schema, optional to carry

When a card's directory dates a save and when it says the console last wrote it, on a scale a consumer can read without
knowing how that card counts time, and the zone those times were kept in where a producer knows it. The entry itself is
carried verbatim in [`dirent`](/specifications/bundle/#part-map), which is enough to write the save back onto a card and
useless for anything else. The name sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree)
because the value belongs to no single producer.

## Schema

```cddl file=./x.1sav.dirent.cddl

```

`created_at` is the time the directory dates the entry from, and `modified_at` the time it records for the last write. A
format carries whichever it keeps: a GameCube entry has a modify time and no creation time, a VMU entry the reverse, a
PS2 entry both. A producer holding neither omits the key, which is why the schema is a choice rather than two optional
keys.

Both are the wall clock the console showed, put on the Unix scale by reading that wall clock as though it were UTC. They
are deliberately not instants. A GameCube sets its clock in the IPL menu with no notion of a zone, and a VMU is the
same, so the seconds a directory holds fix a date and a time of day and say nothing about where on Earth that was.
Calling such a reading UTC would be a guess dressed as a fact, and one a consumer could not see through.

The offset is what closes the gap, in seconds east of UTC, so the instant is the reading minus the offset. It follows a
reading only where a producer actually knows the zone the console's clock was set to: a PS2 keeps its directory times in
a fixed +9 whatever the console's region, and a producer that read the card as part of a
[device](/specifications/device/) whose [`source`](/specifications/bundle/#source-map) records where the read happened
knows it another way. A producer that does not know writes the one-element form, which is the common case and not a
degraded one.

The first element means the same thing whether a second follows it or not, which is the point of qualifying the reading
rather than replacing it. A consumer that reads only the head of the array gets the wall clock the card recorded, in
every case, and is never wrong by hours without being told. One that reads the tail gets a true instant wherever a
producer could supply one.

The zone rides on each reading rather than on the entry because one entry can hold two of them. A save created in winter
and last written in summer was kept at two offsets on the same console, and a single field beside the pair could not say
so. It is the shape [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/) already uses for a frame, a value and the
qualifier it may turn out not to have, and it leaves an offset with no reading beside it unwritable rather than merely
invalid.

Four of the seven [card formats](/specifications/memory-cards/) date an entry. PS1 and Neo Geo carry no time, and Saturn
keeps its date inside the save rather than in a directory.

## Where it goes

The part that stands for one entry in a directory, which is two places and no others: a [card](/specifications/cards/)'s
[`bundle` part](/specifications/bundle/#nested-bundles) holding a save, and a [save](/specifications/saves/)'s own part
where the save is a directory, as a PS2 save's files are. These times are the directory's record and do not survive the
save being sliced out, which is why they sit beside the raw `dirent` bytes rather than in the save's own header.

It does not go on a [device](/specifications/device/)'s part or a [collection](/specifications/collections/)'s. Those
parts are components and entries, which sit in a socket and in a file rather than in a directory, and neither has an
entry to normalize.

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

The offset is a separate decision from the reading it follows. Not knowing the zone is a reason to write the one-element
form and no reason at all to drop the reading, which is what qualifying it separately buys: before, a producer reading a
GameCube entry had a modify time it could not honestly convert, and the only conforming move was to drop a field the
card really does hold. A producer **MUST NOT** fill the offset with the zone the _dump_ happened in, which is a fact
about the reader rather than about the console, nor with a default of zero, which claims UTC and means it.
