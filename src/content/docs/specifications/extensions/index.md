---
title: Extensions
description: Catalogue of defined extension keys for the Universal Saves Format.
sidebar:
  label: Overview
  order: 0
---

[Extension keys](/specifications/universal-saves-format/#extensions) let parsers, emulators, and third parties attach
data to a bundle's header, or to a single part, under a [reverse-DNS](/specifications/common-types/reverse-dns-name/)
text key, without the core spec having to know about them. The spec defines the _mechanism_ and the round-tripping
rules; this catalogue lists the _keys_ people have defined.

A key's schema belongs to its producer, and those entries are **non-normative**: the page records a shape these
specifications observed, and the producer may change it without notice. A key under a
[reserved name](/registries/vendors/) works the other way, because it belongs to no one producer. These specifications
define it, its page carries a normative schema even though carrying the key is optional, and it moves with the
[format's version](/specifications/universal-saves-format/#changelog) rather than with anybody's release. The `Owner`
column below is what tells the two apart.

Which tree a name sits in follows from the same split. A key whose meaning is one producer's sits under a domain that
producer holds, as [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/) does: what one parser read out of
a save is that parser's. A key whose meaning belongs to nobody takes a reserved name in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) instead, which is where
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries a clock reading normalized to a Unix instant, with
[`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) under it for the chip state a GBA cartridge keeps.

The `Applies to` column names every placement a key allows. Whether "part" includes a
[`bundle` part](/specifications/bundle/#nested-bundles) differs by key, so the column says which.

Registration is first-come and non-blocking; to add a key, open a PR with a new `extensions/<key>.md` page and a row in
the table.

| Key                                                                      | Owner  | Applies to                 | Purpose                                                                   |
| ------------------------------------------------------------------------ | ------ | -------------------------- | ------------------------------------------------------------------------- |
| [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/)       | 1retro | header, part               | What a Forge parser found, and which parser found it.                     |
| [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/)             | (spec) | part, `bundle` too         | When a card's directory dates a save and when it last wrote it.           |
| [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/) | (spec) | part, `bundle` too         | A GameCube directory entry, field by field, for a writer that builds one. |
| [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/)                 | (spec) | save header                | The image a console shows for a save, decoded to PNG.                     |
| [`x.1sav.label`](/specifications/extensions/x.1sav.label/)               | (spec) | save header; part as index | What a console calls a save, and what it says beneath that.               |
| [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)                   | (spec) | save header                | A clock reading normalized to a Unix instant.                             |
| [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)         | (spec) | save header                | The clock an MBC3 Game Boy cartridge keeps.                               |
| [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/)     | (spec) | save header                | The latched state of a GBA cartridge's Seiko RTC.                         |
