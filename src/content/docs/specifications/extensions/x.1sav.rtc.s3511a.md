---
title: x.1sav.rtc.s3511a
description: The latched state of the Seiko S-3511A clock in a GBA cartridge, for byte-exact round-tripping.
slug: specifications/extensions/x.1sav.rtc.s3511a
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the bundle header and a
part · **Status:** normative schema, optional to carry

The GBA's clock is a Seiko S-3511A on the cartridge. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the
instant a consumer needs to display it; this key carries what the chip itself holds, which is what a producer handing
the cartridge back byte for byte needs.

Every emulator that keeps this clock keeps the same two values, so the representation belongs to no one of them and the
name sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) for the reason
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) gives, under that key rather than beside it.

## Schema

```cddl file=./x.1sav.rtc.s3511a.cddl

```

Key 0 is what the chip latches on a read: year since 2000, month, day, weekday, hour, minute and second, one BCD byte
each and in that order. Bit 7 of the hour byte carries PM, and only when 24-hour mode is off. Key 1 is the control
register as read, whose bit 6 is that 24-hour flag and whose bit 7 is the power-off status.

## 24-hour mode is not a field of its own

It is bit 6 of key 1. A boolean beside the register would be a second spelling of one value, and a producer that set the
two differently would write a bundle contradicting itself. The format keeps
[one encoding per value](/specifications/universal-saves-format/#one-encoding-per-bundle) everywhere else. Read the flag
out of the register.

## What does not go here

How an emulator keeps the clock running between the moments a game reads it. One derives the current time from an offset
against the host clock, another holds an absolute base, and neither is chip state. A schema every producer has to
satisfy can only require what the chip itself holds. An emulator with a model worth preserving carries it beside this
key under a [name of its own](/specifications/common-types/reverse-dns-name/).

## When to set it

Only for a GBA cartridge carrying this chip. Pokemon Ruby, Sapphire and Emerald use it, as do the Boktai games. A Game
Boy cartridge keeps a different clock and takes [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/).

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/universal-saves-format/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map: a consumer that only wants to know what time the
game thinks it is should not have to decode BCD to find out, and the two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
