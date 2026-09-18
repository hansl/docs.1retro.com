---
title: System Slugs
description: The canonical slug for every known gaming system.
---

A system slug is the canonical short name of a gaming system. The
[Universal Saves Format](/specifications/bundle/#0-header-map) carries it in the `system` header field, and other specs
use the same names wherever a system is identified.

A slug follows the [slug grammar](/specifications/common-types/slug/) every vocabulary in these specifications shares:
lowercase ASCII, single hyphens between runs, at most 64 bytes. Each system has exactly one slug. The **Also seen as**
column records names other tools use for the same system (directory names, core names, database labels); they help a
producer map its input to the right slug, and are never emitted.

A slug names **one system, not a family**. Successive generations get their own slug even where their media are
compatible, so `psx` and `ps2` are separate despite a PS2 reading PS1 cards. Emulators support a system rather than a
family, and file-format compatibility is not system identity: converting a PS2 card for a PS1 emulator is meaningless,
and keeping the slugs apart is what lets a tool decline it by ordinary matching instead of a special case. Where two
systems genuinely are interchangeable for some purpose, that is a policy the tool holds, not a fact the slug carries.

Arcade is the exception that rule cannot absorb, and `mame` is the slug for it. An arcade board's identity is its
romset, and nothing above that level is worth naming: a CPS2 board, a System 16 and an MVS cabinet share no medium, no
save layout and no consumer that would treat them alike, so a slug per board family would carry information nobody
matches on. The slug says the bytes came off an arcade machine catalogued by MAME, and which machine lives in
[`game_id`](/specifications/bundle/#game-hints-map) under `org.mamedev`. `neogeo` stays separate from it because a
cabinet and an AES take the same memory card, which is a medium a consumer really does treat alike.

The list is **non-normative** and first-come; to add a system, open a PR with a row in alphabetical order.

| Slug               | System               | Also seen as         |
| ------------------ | -------------------- | -------------------- |
| `3do`              | 3DO                  | `threedo`            |
| `3ds`              | Nintendo 3DS         |                      |
| `atari-2600`       | Atari 2600           | `2600`               |
| `atari-5200`       | Atari 5200           | `5200`               |
| `atari-7800`       | Atari 7800           | `7800`               |
| `atari-jaguar`     | Atari Jaguar         | `jaguar`             |
| `atari-jaguar-cd`  | Atari Jaguar CD      |                      |
| `atari-lynx`       | Atari Lynx           | `lynx`               |
| `c64`              | Commodore 64         | `commodore64`        |
| `colecovision`     | ColecoVision         | `coleco`             |
| `dreamcast`        | Dreamcast            | `dc`                 |
| `fds`              | Famicom Disk System  | `famicomdisk`        |
| `gb`               | Game Boy             | `gameboy`            |
| `gba`              | Game Boy Advance     | `gameboyadvance`     |
| `gbc`              | Game Boy Color       | `gameboycolor`       |
| `gc`               | GameCube             | `gamecube`, `ngc`    |
| `genesis`          | Sega Genesis         | `megadrive`, `md`    |
| `intellivision`    | Intellivision        | `intv`               |
| `mame`             | Arcade               | `arcade`             |
| `mastersystem`     | Master System        | `sms`                |
| `msx`              | MSX                  |                      |
| `msx2`             | MSX2                 |                      |
| `n64`              | Nintendo 64          |                      |
| `nds`              | Nintendo DS          |                      |
| `neogeo`           | Neo Geo              |                      |
| `nes`              | NES                  |                      |
| `ngp`              | Neo Geo Pocket       | `neogeopocket`       |
| `ngpc`             | Neo Geo Pocket Color | `neogeopocketcolor`  |
| `odyssey2`         | Odyssey 2            |                      |
| `pcengine`         | TurboGrafx-16        | `pce`                |
| `pcenginecd`       | TurboGrafx-CD        | `pcecd`              |
| `pcfx`             | PC-FX                |                      |
| `ps2`              | PlayStation 2        | `playstation2`       |
| `ps3`              | PlayStation 3        | `playstation3`       |
| `psp`              | PlayStation Portable |                      |
| `psvita`           | PlayStation Vita     | `vita`, `psv`        |
| `psx`              | PlayStation          | `playstation`, `ps1` |
| `saturn`           | Sega Saturn          |                      |
| `sega-32x`         | Sega 32X             | `32x`                |
| `sega-cd`          | Sega CD              | `segacd`, `scd`      |
| `sega-gg`          | Game Gear            | `gamegear`, `gg`     |
| `sg-1000`          | SG-1000              | `sg`                 |
| `snes`             | Super Nintendo       |                      |
| `supergrafx`       | SuperGrafx           | `sgx`                |
| `vectrex`          | Vectrex              |                      |
| `virtualboy`       | Virtual Boy          | `vb`                 |
| `wii`              | Wii                  |                      |
| `wonderswan`       | WonderSwan           | `ws`                 |
| `wonderswan-color` | WonderSwan Color     | `wsc`                |
