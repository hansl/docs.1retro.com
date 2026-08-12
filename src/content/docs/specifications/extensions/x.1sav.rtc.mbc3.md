---
title: x.1sav.rtc.mbc3
description: The clock an MBC3 Game Boy cartridge keeps, in the form every emulator writes it.
slug: specifications/extensions/x.1sav.rtc.mbc3
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the bundle header and a
part · **Status:** normative schema, optional to carry

An MBC3 cartridge keeps its clock in the save file, as a footer after the SRAM. Pokemon Gold, Silver and Crystal are
where most people meet it. This key holds what a writer needs to put that footer back, which the SRAM bytes alone do not
carry.

VBA, BGB, Gambatte and mGBA all write that footer the same way. The representation belongs to no one of them, which puts
the name in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) for the reason
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) gives, under that key rather than beside it.

## Schema

```cddl file=./x.1sav.rtc.mbc3.cddl

```

Keys 0 and 1 hold the same five registers twice: seconds, minutes, hours, day counter low and day counter high. Key 0 is
the clock as it runs and key 1 the latched copy the game reads, and the two differ whenever the game has not latched
recently.

The high register is three things at once. Bit 0 is the day counter's ninth bit, bit 6 halts the clock, and bit 7 is the
carry it sets on running past 511 days. They stay packed where the hardware puts them, so what a consumer writes back is
what it read.

Key 2 is the host clock at the moment the emulator wrote the save, which is the anchor the counters advance from; the
[reading](/specifications/extensions/x.1sav.rtc/#a-reading-not-an-anchor) is that plus the elapsed time they describe.
Key 3 is how many bytes the timestamp occupied.

## Why the timestamp width is carried

Emulators disagree about it. Some write four bytes and some eight, so one clock and one save produce two different
footers depending on which wrote it. A consumer rebuilding the footer without the width has to guess, and a wrong guess
changes the file's bytes and with them its [`sha256`](/specifications/universal-saves-format/#part-map).

Carrying it is what makes the footer regenerable rather than an opaque blob. Between the four keys, a writer has every
byte the footer holds and the length it occupied, which is the whole of what regenerating it takes.

## Not the same chip as the GBA

[`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) dates: it latches a year, a month, a day and a
weekday, in BCD. This one counts, and knows nothing about the calendar. Neither shape can be read as the other, which is
why each chip has a schema of its own.

## When to set it

Only when the cartridge carries the clock, which on the Game Boy means MBC3 and nothing else.

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/universal-saves-format/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map: a consumer that only wants the instant should
not have to reconstruct one out of a day counter, and the two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
