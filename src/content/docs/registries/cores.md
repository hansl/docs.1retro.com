---
title: Emulator Cores
description: Known emulator cores, their canonical slugs, and the systems they run.
---

An emulator core is the engine that actually runs the game, as distinct from the frontend or device that hosts it. The
registry covers three kinds:

- **`libretro`** — software cores hosted by RetroArch, OnionOS and most handheld firmwares. The canonical name is the
  core's `library_name`, the exact string RetroArch uses to name a `saves/<core>/` folder.
- **`mister`** — MiSTer FPGA cores. The canonical name is the core's repository name in the MiSTer-devel organization
  (`NES_MiSTer`), which derives to `nes-mister`; the `MiSTer` suffix namespaces the slug on its own.
- **`openfpga`** — Analogue Pocket openFPGA cores. The canonical name is the `Author.Platform` folder the core installs
  to on the SD card, so the slug carries its author.

The slug is what a producer writes in the Universal Saves Format's
[`source.app`](/specifications/universal-saves-format/#source-map) field when a save was produced by that core. A core
listed here MUST use its slug rather than a reverse-DNS name, even if it holds a domain, so that one core has one
spelling. A slug is derived mechanically from the kind's canonical name: lowercase, with every run of non-alphanumeric
characters replaced by a single `-`, and any leading or trailing one dropped. The result conforms to the
[slug grammar](/specifications/universal-saves-format/#minting-a-name) every vocabulary here shares. Where a core also
exists as a standalone emulator (mGBA, DuckStation), the slug covers both; the engine is the same.

The **Systems** column uses slugs from the [System Slugs registry](/registries/systems/). The **Also seen as** column
records other names for the same core: former names (the Mednafen cores were renamed Beetle, Genesis_MiSTer became
MegaDrive_MiSTer), the SD-card saves folders a MiSTer core writes to (`/media/fat/saves/<name>/`), or Analogizer builds
of a Pocket core, which count as the same core. They help mapping folders and old data, and are never emitted.

Cores are grouped by system family for browsing. Each core appears exactly once, and the **Systems** column is the
authoritative coverage; some cores reach past their section (blueMSX also runs `sg-1000`, PicoDrive also runs
`mastersystem`).

The list is **non-normative** and first-come; to add a core, open a PR with a row in the right section, alphabetical by
slug.

## NES

| Slug                | Core              | Kind       | Systems      | Also seen as               |
| ------------------- | ----------------- | ---------- | ------------ | -------------------------- |
| `agg23-nes`         | agg23.NES         | `openfpga` | `nes`        | `RndMnkIII.NES_Analogizer` |
| `fceumm`            | FCEUmm            | `libretro` | `nes`        |                            |
| `mesen`             | Mesen             | `libretro` | `nes`        |                            |
| `nes-mister`        | NES_MiSTer        | `mister`   | `nes`, `fds` | `NES`                      |
| `nestopia`          | Nestopia          | `libretro` | `nes`        |                            |
| `quicknes`          | QuickNES          | `libretro` | `nes`        |                            |
| `spiritualized-nes` | Spiritualized.NES | `openfpga` | `nes`, `fds` |                            |

## SNES

| Slug                             | Core                           | Kind       | Systems | Also seen as            |
| -------------------------------- | ------------------------------ | ---------- | ------- | ----------------------- |
| `agg23-snes`                     | agg23.SNES                     | `openfpga` | `snes`  | `agg23.SNES_Analogizer` |
| `bsnes`                          | bsnes                          | `libretro` | `snes`  |                         |
| `bsnes-hd-beta`                  | bsnes-hd beta                  | `libretro` | `snes`  |                         |
| `bsnes-mercury-accuracy`         | bsnes-mercury Accuracy         | `libretro` | `snes`  |                         |
| `mesen-s`                        | Mesen-S                        | `libretro` | `snes`  |                         |
| `nside`                          | nSide                          | `libretro` | `snes`  |                         |
| `snes9x`                         | Snes9x                         | `libretro` | `snes`  |                         |
| `snes9x-2002`                    | Snes9x 2002                    | `libretro` | `snes`  |                         |
| `snes9x-2005`                    | Snes9x 2005                    | `libretro` | `snes`  |                         |
| `snes9x-2010`                    | Snes9x 2010                    | `libretro` | `snes`  |                         |
| `snes-mister`                    | SNES_MiSTer                    | `mister`   | `snes`  | `SNES`                  |
| `timboettiger-pro-action-replay` | timboettiger.Pro Action Replay | `openfpga` | `snes`  |                         |

## Game Boy family

| Slug                    | Core                  | Kind       | Systems            | Also seen as                  |
| ----------------------- | --------------------- | ---------- | ------------------ | ----------------------------- |
| `beetle-gba`            | Beetle GBA            | `libretro` | `gba`              |                               |
| `budude2-gb`            | budude2.GB            | `openfpga` | `gb`               | `budude2.GB_Analogizer`       |
| `budude2-gbc`           | budude2.GBC           | `openfpga` | `gbc`              | `budude2.GBC_Analogizer`      |
| `gambatte`              | Gambatte              | `libretro` | `gb`, `gbc`        |                               |
| `gameboy-mister`        | Gameboy_MiSTer        | `mister`   | `gb`, `gbc`        | `GAMEBOY`, `GAMEBOY2P`, `GBC` |
| `gba-mister`            | GBA_MiSTer            | `mister`   | `gba`              | `GBA`, `GBA2P`                |
| `gpsp`                  | gpSP                  | `libretro` | `gba`              |                               |
| `mgba`                  | mGBA                  | `libretro` | `gba`, `gbc`, `gb` |                               |
| `mincer-ray-gba`        | mincer_ray.GBA        | `openfpga` | `gba`              |                               |
| `sameboy`               | SameBoy               | `libretro` | `gb`, `gbc`        |                               |
| `sgb-mister`            | SGB_MiSTer            | `mister`   | `gb`               | `SGB`                         |
| `spiritualized-gb`      | Spiritualized.GB      | `openfpga` | `gb`               |                               |
| `spiritualized-gba`     | Spiritualized.GBA     | `openfpga` | `gba`              |                               |
| `spiritualized-gbc`     | Spiritualized.GBC     | `openfpga` | `gbc`              |                               |
| `spiritualized-supergb` | Spiritualized.SuperGB | `openfpga` | `gb`               |                               |
| `vba-m`                 | VBA-M                 | `libretro` | `gba`, `gbc`, `gb` |                               |
| `vba-next`              | VBA Next              | `libretro` | `gba`              |                               |

## Nintendo 64

| Slug               | Core             | Kind       | Systems | Also seen as |
| ------------------ | ---------------- | ---------- | ------- | ------------ |
| `mupen64plus-next` | Mupen64Plus-Next | `libretro` | `n64`   |              |
| `n64-mister`       | N64_MiSTer       | `mister`   | `n64`   | `N64`        |
| `parallel-n64`     | ParaLLEl N64     | `libretro` | `n64`   |              |

## Nintendo DS

| Slug           | Core         | Kind       | Systems | Also seen as |
| -------------- | ------------ | ---------- | ------- | ------------ |
| `desmume`      | DeSmuME      | `libretro` | `nds`   |              |
| `desmume-2015` | DeSmuME 2015 | `libretro` | `nds`   |              |
| `melonds`      | melonDS      | `libretro` | `nds`   |              |
| `melonds-ds`   | melonDS DS   | `libretro` | `nds`   |              |

## Virtual Boy

| Slug        | Core      | Kind       | Systems      | Also seen as  |
| ----------- | --------- | ---------- | ------------ | ------------- |
| `beetle-vb` | Beetle VB | `libretro` | `virtualboy` | `Mednafen VB` |

## Sega 8- and 16-bit

| Slug                    | Core                  | Kind       | Systems                                                    | Also seen as                             |
| ----------------------- | --------------------- | ---------- | ---------------------------------------------------------- | ---------------------------------------- |
| `blastem`               | BlastEm               | `libretro` | `genesis`                                                  |                                          |
| `drizzt-gg`             | drizzt.GG             | `openfpga` | `sega-gg`                                                  |                                          |
| `drizzt-megadrive`      | drizzt.MegaDrive      | `openfpga` | `genesis`                                                  |                                          |
| `drizzt-sg-1000`        | drizzt.SG-1000        | `openfpga` | `sg-1000`                                                  |                                          |
| `drizzt-sms`            | drizzt.SMS            | `openfpga` | `mastersystem`                                             |                                          |
| `ericlewis-genesis`     | ericlewis.Genesis     | `openfpga` | `genesis`                                                  | `ericlewis.Genesis_Analogizer`           |
| `genesis-plus-gx`       | Genesis Plus GX       | `libretro` | `genesis`, `mastersystem`, `sega-gg`, `sg-1000`, `sega-cd` |                                          |
| `genesis-plus-gx-wide`  | Genesis Plus GX Wide  | `libretro` | `genesis`, `mastersystem`, `sega-gg`, `sg-1000`, `sega-cd` |                                          |
| `jeremy-megacd`         | jeremy.MegaCD         | `openfpga` | `sega-cd`                                                  |                                          |
| `megacd-mister`         | MegaCD_MiSTer         | `mister`   | `sega-cd`                                                  | `MegaCD`                                 |
| `megadrive-mister`      | MegaDrive_MiSTer      | `mister`   | `genesis`, `mastersystem`                                  | `Genesis_MiSTer`, `MegaDrive`, `Genesis` |
| `picodrive`             | PicoDrive             | `libretro` | `genesis`, `sega-32x`, `sega-cd`, `mastersystem`           |                                          |
| `s32x-mister`           | S32X_MiSTer           | `mister`   | `sega-32x`                                                 | `S32X`                                   |
| `sms-mister`            | SMS_MiSTer            | `mister`   | `mastersystem`, `sega-gg`, `sg-1000`                       | `SMS`                                    |
| `spiritualized-genesis` | Spiritualized.Genesis | `openfpga` | `genesis`                                                  |                                          |
| `spiritualized-gg`      | Spiritualized.GG      | `openfpga` | `sega-gg`                                                  |                                          |
| `spiritualized-sg-1000` | Spiritualized.SG-1000 | `openfpga` | `sg-1000`                                                  |                                          |
| `spiritualized-sms`     | Spiritualized.SMS     | `openfpga` | `mastersystem`                                             |                                          |

## Sega Saturn

| Slug            | Core          | Kind       | Systems  | Also seen as      |
| --------------- | ------------- | ---------- | -------- | ----------------- |
| `beetle-saturn` | Beetle Saturn | `libretro` | `saturn` | `Mednafen Saturn` |
| `kronos`        | Kronos        | `libretro` | `saturn` |                   |
| `saturn-mister` | Saturn_MiSTer | `mister`   | `saturn` | `Saturn`          |
| `yabasanshiro`  | YabaSanshiro  | `libretro` | `saturn` |                   |

## PC Engine

| Slug                       | Core                     | Kind       | Systems                                | Also seen as                          |
| -------------------------- | ------------------------ | ---------- | -------------------------------------- | ------------------------------------- |
| `agg23-pc-engine`          | agg23.PC Engine          | `openfpga` | `pcengine`, `supergrafx`               | `agg23.PC Engine_Analogizer`          |
| `beetle-pce`               | Beetle PCE               | `libretro` | `pcengine`, `pcenginecd`               |                                       |
| `beetle-pce-fast`          | Beetle PCE Fast          | `libretro` | `pcengine`, `pcenginecd`               | `Mednafen PCE Fast`                   |
| `beetle-supergrafx`        | Beetle SuperGrafx        | `libretro` | `supergrafx`, `pcengine`               | `Mednafen SuperGrafx`                 |
| `mazamars312-pc-engine-cd` | Mazamars312.PC Engine CD | `openfpga` | `pcenginecd`                           | `Mazamars312.PC Engine CD_Analogizer` |
| `turbografx16-mister`      | TurboGrafx16_MiSTer      | `mister`   | `pcengine`, `supergrafx`, `pcenginecd` | `TGFX16`, `TGFX16-CD`                 |

## PlayStation

| Slug            | Core          | Kind       | Systems | Also seen as |
| --------------- | ------------- | ---------- | ------- | ------------ |
| `beetle-psx`    | Beetle PSX    | `libretro` | `psx`   |              |
| `beetle-psx-hw` | Beetle PSX HW | `libretro` | `psx`   |              |
| `duckstation`   | DuckStation   | `libretro` | `psx`   |              |
| `pcsx-rearmed`  | PCSX-ReARMed  | `libretro` | `psx`   |              |
| `psx-mister`    | PSX_MiSTer    | `mister`   | `psx`   | `PSX`        |
| `swanstation`   | SwanStation   | `libretro` | `psx`   |              |

## PlayStation Portable

| Slug     | Core   | Kind       | Systems | Also seen as |
| -------- | ------ | ---------- | ------- | ------------ |
| `ppsspp` | PPSSPP | `libretro` | `psp`   |              |

## WonderSwan and Neo Geo Pocket

| Slug                | Core              | Kind       | Systems                          | Also seen as          |
| ------------------- | ----------------- | ---------- | -------------------------------- | --------------------- |
| `agg23-wonderswan`  | agg23.WonderSwan  | `openfpga` | `wonderswan`, `wonderswan-color` |                       |
| `beetle-neopop`     | Beetle NeoPop     | `libretro` | `ngp`, `ngpc`                    | `Mednafen NeoPop`     |
| `beetle-wonderswan` | Beetle WonderSwan | `libretro` | `wonderswan`, `wonderswan-color` | `Mednafen WonderSwan` |
| `jotego-jtngp`      | jotego.jtngp      | `openfpga` | `ngp`                            |                       |
| `jotego-jtngpc`     | jotego.jtngpc     | `openfpga` | `ngpc`                           |                       |
| `wonderswan-mister` | WonderSwan_MiSTer | `mister`   | `wonderswan`, `wonderswan-color` | `WonderSwan`          |

## Neo Geo and arcade

| Slug                 | Core               | Kind       | Systems          | Also seen as                    |
| -------------------- | ------------------ | ---------- | ---------------- | ------------------------------- |
| `fb-alpha`           | FB Alpha           | `libretro` | `neogeo`, `mame` |                                 |
| `finalburn-neo`      | FinalBurn Neo      | `libretro` | `neogeo`, `mame` |                                 |
| `mazamars312-neogeo` | Mazamars312.NeoGeo | `openfpga` | `neogeo`         | `Mazamars312.NeoGeo_Analogizer` |
| `neogeo-mister`      | NeoGeo_MiSTer      | `mister`   | `neogeo`         | `NEOGEO`                        |

## Atari

| Slug                 | Core               | Kind       | Systems                    | Also seen as              |
| -------------------- | ------------------ | ---------- | -------------------------- | ------------------------- |
| `atari7800-mister`   | Atari7800_MiSTer   | `mister`   | `atari-7800`, `atari-2600` | `ATARI7800`               |
| `atari800`           | Atari800           | `libretro` | `atari-5200`               |                           |
| `atari800-mister`    | Atari800_MiSTer    | `mister`   | `atari-5200`               | `ATARI5200`               |
| `atarilynx-mister`   | AtariLynx_MiSTer   | `mister`   | `atari-lynx`               | `AtariLynx`               |
| `beetle-lynx`        | Beetle Lynx        | `libretro` | `atari-lynx`               | `Mednafen Lynx`           |
| `budude2-lynx`       | budude2.Lynx       | `openfpga` | `atari-lynx`               | `budude2.Lynx_Analogizer` |
| `handy`              | Handy              | `libretro` | `atari-lynx`               |                           |
| `prosystem`          | ProSystem          | `libretro` | `atari-7800`               |                           |
| `spiritualized-2600` | Spiritualized.2600 | `openfpga` | `atari-2600`               |                           |
| `spiritualized-7800` | Spiritualized.7800 | `openfpga` | `atari-7800`               |                           |
| `stella`             | Stella             | `libretro` | `atari-2600`               |                           |
| `stella-2014`        | Stella 2014        | `libretro` | `atari-2600`               |                           |
| `virtual-jaguar`     | Virtual Jaguar     | `libretro` | `atari-jaguar`             |                           |

## MSX and ColecoVision

| Slug                   | Core                 | Kind       | Systems                                  | Also seen as |
| ---------------------- | -------------------- | ---------- | ---------------------------------------- | ------------ |
| `bluemsx`              | blueMSX              | `libretro` | `msx`, `msx2`, `colecovision`, `sg-1000` |              |
| `boogermann-msx`       | boogermann.msx       | `openfpga` | `msx`                                    |              |
| `colecovision-mister`  | ColecoVision_MiSTer  | `mister`   | `colecovision`, `sg-1000`                | `Coleco`     |
| `fmsx`                 | fMSX                 | `libretro` | `msx`, `msx2`                            |              |
| `msx1-mister`          | MSX1_MiSTer          | `mister`   | `msx`                                    | `MSX1`       |
| `msx-mister`           | MSX_MiSTer           | `mister`   | `msx`, `msx2`                            | `MSX`        |
| `spiritualized-coleco` | Spiritualized.Coleco | `openfpga` | `colecovision`                           |              |

## Other systems

| Slug                     | Core                   | Kind       | Systems         | Also seen as    |
| ------------------------ | ---------------------- | ---------- | --------------- | --------------- |
| `3do-mister`             | 3DO_MiSTer             | `mister`   | `3do`           | `3DO`           |
| `c64-mister`             | C64_MiSTer             | `mister`   | `c64`           | `C64`           |
| `freeintv`               | FreeIntv               | `libretro` | `intellivision` |                 |
| `intv-mister`            | Intv_MiSTer            | `mister`   | `intellivision` | `Intellivision` |
| `markus-zzz-myc64`       | markus-zzz.MyC64       | `openfpga` | `c64`           |                 |
| `o2em`                   | O2EM                   | `libretro` | `odyssey2`      |                 |
| `obsidian-vectrex`       | obsidian.Vectrex       | `openfpga` | `vectrex`       |                 |
| `odyssey2-mister`        | Odyssey2_MiSTer        | `mister`   | `odyssey2`      | `ODYSSEY2`      |
| `opera`                  | Opera                  | `libretro` | `3do`           | `4DO`           |
| `spiritualized-intv`     | Spiritualized.Intv     | `openfpga` | `intellivision` |                 |
| `spiritualized-odyssey2` | Spiritualized.Odyssey2 | `openfpga` | `odyssey2`      |                 |
| `vectrex-mister`         | Vectrex_MiSTer         | `mister`   | `vectrex`       | `VECTREX`       |
| `vecx`                   | vecx                   | `libretro` | `vectrex`       |                 |
