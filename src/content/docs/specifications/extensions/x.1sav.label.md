---
title: x.1sav.label
description: What a console calls a save, and what it says about the save beneath that name.
slug: specifications/extensions/x.1sav.label
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header,
and a part as an index copy · **Status:** normative schema, optional to carry

What a console lists a save as, so a consumer can show a person a list of saves rather than a list of addresses. The
name sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) because the value belongs to no
single producer.

## Schema

```cddl file=./x.1sav.label.cddl

```

`title` is the line the console lists the save under, and is required.

`detail` is what the save says about itself beyond its name: the progress a game reports, the point the player left off
at, the status line printed under the title. A GameCube save keeps one in the second of its two comment strings, and a
VMU keeps a longer description for the boot ROM menu than the one it shows in its own. A save that says nothing beyond
its name omits it.

Neither field is a slot for whatever a format prints next. The name of the game or of the application that wrote the
save is [`game`](/specifications/bundle/#game-hints-map), and a title a format breaks across two lines for layout is one
title: a PS2 title carries a break offset into a single string, and both halves are `title`.

## Where the text comes from

On nearly every format it is in the save's payload rather than in the directory entry. GameCube keeps a comment address,
PS1 keeps its 64-byte title in the save's first block, a VMU's descriptions are in the VMS header, Saturn has no entry
at all, and a PS2 save keeps its title in `icon.sys`. N64 is the exception: a controller pak's note table holds the note
name.

## Where it goes

The [header](/specifications/bundle/#0-header-map) of the bundle that is the save, because the text travels with the
save when it is sliced out. [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/) sits on the part instead, being
the card's record rather than the save's.

A producer **MAY** repeat the key on the [`bundle` part](/specifications/bundle/#nested-bundles) carrying the save, as
an index copy so a consumer can list a card without stepping into payloads. Producers **SHOULD** keep the two
consistent, and on a mismatch the inner header wins.

A consumer holding both this key and a [`description`](/specifications/bundle/#0-header-map) **SHOULD** show `title`,
and **MUST NOT** treat a `description` that disagrees as malformed. One is what the console called the save, the other a
free-form note the bundle's author attached.

## What a producer may write

A producer **MUST NOT** write a title or a detail line the save does not say. The latitude is normalization: transcoding
out of Shift-JIS, trimming padding a format pads with. A consumer re-deriving the text from the same bytes may land on a
slightly different string, and **MUST NOT** treat that as malformed.

The key is a projection and does not rebuild an entry. A writer copying an entry takes the bytes from
[`dirent`](/specifications/bundle/#part-map); a writer building one takes the fields from the format's own key, such as
[`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/). A consumer **MUST NOT** prefer this key over
either.

## What does not go here

- **When the card wrote the save down.** [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/).
- **Icons and banners.** [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/).
- **The name the card's directory holds.** [`path`](/specifications/bundle/#part-map), which a consumer matches on. A
  title is for showing a person, and the two are not always the same string.
- **Which game the save belongs to,** including the application that wrote it.
  [`game`](/specifications/bundle/#game-hints-map).

## When to set it

Only when the producer read the text. A producer that would be guessing omits the key. A save with no text anywhere has
nothing to put here: a Neo Geo entry is a sub-number, an NGH number and an index into the FAT, and names nothing at all.
