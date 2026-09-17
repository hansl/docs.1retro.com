---
title: x.1sav.rtc
description: A real-time clock reading normalized to a Unix instant, for the games that keep one.
slug: specifications/extensions/x.1sav.rtc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

A snapshot of the clock a game keeps, normalized so that any consumer can read it without knowing which chip produced
it. Battery-backed clocks are a minority feature, so this is an extension key rather than a header field; what makes it
worth defining centrally is that an in-game clock means nothing without an agreed epoch, and two producers inventing
their own representation could not read each other's.

The name sits in the `x` tree because the value belongs to no single producer. A key under some company's domain would
make one vendor the owner of a value the whole format shares.

## Schema

```cddl file=./x.1sav.rtc.cddl

```

`reading` is whole seconds, for the reason [`created_at`](/specifications/bundle/#0-header-map) gives: tag 1 admits a
float, and leaving the choice open would give one instant two encodings. `accuracy_ms` gives the uncertainty of the
reading, and is omitted when a producer has nothing useful to say about it.

Which clock produced the reading is not a field here. The chip key beside this one names it, a bundle's
[`source`](/specifications/bundle/#source-map) names the producer that read it, and a normalized instant is meant to be
legible without either.

## A reading, not an anchor

`reading` is what the game's clock showed when the bundle was written, never the point a counting clock advances from.

Counting clocks make the difference concrete. An MBC3 cartridge holds elapsed seconds, minutes, hours and days in a
footer beside a host timestamp, and [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/) carries that
timestamp under key 2 because regenerating the footer needs it, which puts it nearest to hand. The timestamp is the
anchor. The reading is the anchor plus the elapsed time the counters describe, and copying the anchor across writes a
number wrong by however long the cartridge has been running.

A producer that cannot compute the reading **MUST** omit the key rather than write the anchor under it. Nothing
downstream can tell the two apart.

## Disagreeing with the chip is not an error

[`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) carries what a chip holds, in the chip's own terms.
This key carries an instant on the Unix scale. The two answer different questions, and a consumer **MUST NOT** treat a
difference between them as malformed or prefer one as authoritative.

They come apart for ordinary reasons. Normalizing a chip's value means resolving a two-digit year, a 12- or 24-hour
mode, a PM bit and whatever the producer knows about the cartridge, so a consumer re-deriving an instant from the same
bytes can land somewhere else without either of them being wrong. Scope pulls them apart too: this key may sit on the
header while the chip key sits on a part, in which case they describe different media.

Read this key when you want the instant, and the chip's key when you want the bytes back.

## What does not go here

Raw chip-format values: BCD components, the weekday byte, a day counter, 12/24-hour mode, the PM flag, and any
emulator-internal reconstruction state. Those are specific to a chip, and each chip has a key of its own:
[`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) for the Seiko clock in a GBA cartridge and
[`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/) for the Game Boy's. A producer that wants byte-exact
round-tripping carries two keys: this one for the instant anyone can read, and the chip's for the state that rebuilds
the bytes. An emulator whose own model of how the clock runs between reads is worth keeping carries that under a name of
its own.

## Where it goes

The [header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/), and
nowhere else.

A clock belongs to the save that carries it, so the reading sits where the save's own header keeps it and stays correct
once the save is sliced out of whatever held it. A nested bundle inherits nothing from the header around it, which is
why a reading recorded outside the save would not survive the cut.

The key **MUST NOT** sit on a [part](/specifications/bundle/#part-map), and **MUST NOT** sit on the header of a
[card](/specifications/cards/) or a [collection](/specifications/collections/). One cartridge keeps one clock, and a
bundle holding several saves whose clocks disagree is several save bundles, each carrying its own.

A card is not an exception. What a memory card records about a save is when the card wrote it, which is
[`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/) and a wall-clock time; this key is a game-world value, and
the two are not the same reading. A device that keeps a clock of its own, as a VMU does, has those bytes preserved
verbatim in [`system_area`](/specifications/bundle/#card-map).

## When to set it

Only when the save actually carries a clock. A Game Boy MBC3 cartridge stores its RTC alongside the SRAM, which is what
Pokemon Gold, Silver and Crystal use; the GBA Pokemon titles and Animal Crossing keep one too. Most saves have no clock
at all, and omitting the key is the right answer for them.

The reading is a game-world value and says nothing about when the bundle was assembled, which is
[`created_at`](/specifications/bundle/#0-header-map)'s job. A player who sets a cartridge clock to 1999 produces a
bundle whose two dates disagree by decades, and both are correct.
