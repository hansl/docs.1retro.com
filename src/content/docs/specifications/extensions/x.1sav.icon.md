---
title: x.1sav.icon
description: The image a console shows for a save, decoded so any consumer can display it.
slug: specifications/extensions/x.1sav.icon
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

The picture a console puts beside a save, decoded so a consumer can display it without knowing which card the save came
off. [`x.1sav.label`](/specifications/extensions/x.1sav.label/) answers what the save is called; this answers what it
looks like. The name sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) because the value
belongs to no single producer.

## Schema

```cddl file=./x.1sav.icon.cddl

```

`frames` is the icon in display order, and a still icon is one frame. `hold_ms` is how long a frame shows before the
next, which a GameCube save varies per frame and other formats do not. `banner` is the wider still image a format keeps
beside the icon rather than instead of it: a GameCube save's 96x32 banner, a VMU's 72x56 eyecatch.

## Decoded to PNG

A producer decodes to PNG. A PS1 icon is 4bpp against a 16-colour CLUT, a GameCube icon is RGB5A3 or CI8 depending on
two bits in the directory entry, and a VMU icon is 4bpp against a palette in the VMS header. A consumer should need none
of those decoders.

A producer **MUST NOT** improve the picture. Scaling it up, correcting its palette, compositing a background behind
transparency and reordering frames all produce something the card does not hold. The native bytes stay in the payload,
where a writer reads them through the format's own key.

## Where it goes

The [header](/specifications/bundle/#0-header-map) of the bundle that is the save, because the image bytes are in the
save's payload and travel with it: PS1 in the first block, VMU in the VMS header, GameCube at the image address the
directory entry points to.

An [`aux` part](/specifications/bundle/#part-kinds) is not the place. Beside the save it is linked only by inference
from `slot` and `path`; inside the save's own bundle it joins that bundle's
[content hash](/specifications/bundle/#content-hash-and-file-hash), which is the save's identity.

## What does not go here

- **Native pixel data.** Decode it, or omit the key.
- **A PS2 save's icon.** `icon.sys` and the `.ico` files it names are already parts inside the save's bundle, each with
  its own `path`, `slot` and `dirent`, and a `.ico` is a 3D model rather than a picture.
- **Screenshots and box art.** An [`aux` part](/specifications/bundle/#part-kinds) with a `content_type`.
- **The icon's native format, palette or animation flags.** The format's own key, such as
  [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/).

## When to set it

Only when the producer decoded the picture. A producer that cannot decode a format's icon omits the key. N64 controller
pak notes, Neo Geo saves and Saturn backups have no picture at all.
