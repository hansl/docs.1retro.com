---
title: Save Roles
description: The socket a save came out of, for every system that has more than one.
---

A role names **which socket** a save came out of, not what medium it is on: a controller pak is a card that lives in a
controller, and its role says which controller. The
[Universal Saves Format](/specifications/universal-saves-format/#part-map) carries it in a part's `role` field.

A role follows the [slug grammar](/specifications/universal-saves-format/#minting-a-name) every vocabulary in these
specifications shares: lowercase ASCII, single hyphens between runs, at most 64 bytes.

A consumer uses `role` to name a part to a user and to match it against a socket when restoring. That second job is why
a producer takes a name from this registry rather than inventing one: a private name is one nothing else can match, and
a consumer meeting a role it does not recognise **MUST NOT** guess which socket is meant. Round-trip it, show it, do not
restore by it.

The list is **non-normative** and first-come; to add a role, open a PR against the section for its system.

## Common

Roles that mean the same thing everywhere, and cover most bundles on their own.

| Role        | Socket                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------- |
| `primary`   | The only socket, or the principal one. The default: a part with no `role` means this.    |
| `cartridge` | The game cartridge's own save memory, whether battery-backed SRAM, EEPROM or flash.      |
| `internal`  | Save storage built into the console itself, as distinct from anything removable.         |
| `sd`        | A removable SD card.                                                                     |
| `sysnand`   | Internal flash holding system-managed save data (Wii, 3DS), as distinct from an SD card. |

## Numbered sockets

Where a system has several sockets of one kind, the role ends in a number: `memcard-1`, `controller-pak-3`. Numbering
starts at 1 and follows the console's own ordering, so player 1's controller is `controller-pak-1` and the first memory
card slot is `memcard-1`. Systems that label their slots with letters are numbered in the same order, so a GameCube's
Slot A is `memcard-1` and Slot B is `memcard-2`; the registry keeps one convention rather than mirroring each console's
silkscreen.

A prefix is registered once and covers every number. A role ending in `-<n>`, where `<n>` is a decimal number with no
leading zero, names the nth socket of the kind its prefix names, and a consumer that recognises the prefix **MAY** match
on the number without that exact role being listed here. A device with eight card slots writes `memcard-8` and is
understood.

This is the only place these specifications allow reading structure out of a slug. Everywhere else a name is opaque and
compared whole, and an unrecognised prefix stays unrecognised however it ends.

| Prefix            | Sockets                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `memcard-`        | Memory card slots, in the console's own order.                        |
| `controller-pak-` | N64 Controller Pak slots, one per controller port.                    |
| `disk-`           | Sides of a disk that are written separately, in the game's own order. |

## Nintendo

| Role              | System       | Socket                                                                                     |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `cartridge`       | `fds`        | A Famicom Disk System disk. Each side is written separately; see below.                    |
| `disk-`           | `fds`        | Disk sides, in the order the game numbers them. A two-sided disk is `disk-1` and `disk-2`. |
| `controller-pak-` | `n64`        | Controller Pak slots, one per controller port.                                             |
| `memcard-`        | `gc`         | GameCube memory card Slot A and Slot B.                                                    |
| `sysnand`         | `wii`, `3ds` | Internal flash.                                                                            |
| `sd`              | `wii`, `3ds` | The SD card.                                                                               |
| `extdata`         | `3ds`        | Extra data a title stores outside its own save, as a directory.                            |

## Sega

| Role       | System              | Socket                                                                                                                   |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `internal` | `sega-cd`, `saturn` | The console's built-in backup RAM.                                                                                       |
| `ram-cart` | `sega-cd`, `saturn` | The Backup RAM Cart, which extends internal storage rather than replacing it. A console can carry saves in both at once. |
| `memcard-` | `dreamcast`         | VMU slots, numbered across controllers: controller 1 slot 1 is `memcard-1`.                                              |

## NEC

| Role       | System                   | Socket                             |
| ---------- | ------------------------ | ---------------------------------- |
| `internal` | `pcengine`, `pcenginecd` | The console's built-in backup RAM. |
| `ram-cart` | `pcengine`, `pcenginecd` | The Tennokoe Bank cartridge.       |

## SNK

| Role          | System   | Socket                                                                         |
| ------------- | -------- | ------------------------------------------------------------------------------ |
| `internal`    | `neogeo` | The AES console's built-in memory.                                             |
| `neogeo-card` | `neogeo` | The Neo Geo memory card, which an arcade cabinet and a home console both take. |

## Sony

| Role       | System                 | Socket             |
| ---------- | ---------------------- | ------------------ |
| `memcard-` | `psx`, `ps2`           | Memory card slots. |
| `internal` | `psp`, `ps3`, `psvita` | Built-in storage.  |

## Adding a role

Prefer a **Common** role if one already fits: a great many systems have exactly one place a save can live, and `primary`
covers all of them. Add a new name only when a system genuinely has a socket the list cannot express, and put it in that
system's section.

A role that turns out to recur across several systems moves to **Common**. `internal` and `ram-cart` both arrived that
way, from four systems that each keep saves in built-in storage and in an add-on that extends it.
