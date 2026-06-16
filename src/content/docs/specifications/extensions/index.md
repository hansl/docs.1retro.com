---
title: Extensions
description: Catalogue of defined extension keys for the Universal Saves Format.
---

[Extension keys](/specifications/universal-saves-format/#extensions) let parsers, emulators, and third parties attach data to a bundle's metadata under a reverse-DNS text key, without the core spec having to know about them.
The spec defines the *mechanism* and the round-tripping rules; this catalogue lists the *keys* people have defined.

The catalogue is **non-normative**: a key's schema belongs to its producer, not to the spec.
Registration is first-come and non-blocking; to add a key, open a PR with a new `extensions/<key>.md` page and a row in the table below.

| Key | Owner | Applies to | Purpose |
|-----|-------|------------|---------|
| [`io.mgba.rtc`](/specifications/extensions/io.mgba.rtc/) | mGBA | metadata | Native GBA/GB RTC chip state for byte-exact round-trip. |
| [`com.1retro.forge.parsed`](/specifications/extensions/com.1retro.forge.parsed/) | 1retro | metadata | Parser-extracted gameplay tags (character, level, playtime, …). |
