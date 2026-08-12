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

Registration is first-come and non-blocking; to add a key, open a PR with a new `extensions/<key>.md` page and a row in
the table.

| Key                                                                  | Owner  | Applies to   | Purpose                                               |
| -------------------------------------------------------------------- | ------ | ------------ | ----------------------------------------------------- |
| [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/)   | 1retro | header, part | What a Forge parser found, and which parser found it. |
| [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)               | (spec) | header, part | A clock reading normalized to a Unix instant.         |
| [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)     | (spec) | header, part | The clock an MBC3 Game Boy cartridge keeps.           |
| [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) | (spec) | header, part | The latched state of a GBA cartridge's Seiko RTC.     |
