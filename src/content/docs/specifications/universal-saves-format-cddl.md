---
title: "CDDL Schema (.1saves)"
description: The CDDL schema for the Universal Saves Format, rendered with notes on how to read it.
sidebar:
  hidden: true
---

This is the [CDDL](https://www.rfc-editor.org/rfc/rfc8610) (RFC 8610) schema for the [Universal Saves Format](/specifications/universal-saves-format/).
The source of truth is [`universal-saves-format.cddl`](https://github.com/hansl/docs.1retro.com/blob/main/src/content/docs/specifications/universal-saves-format.cddl); validators consume that file directly, and this page renders it at build time.

Two things the spec's prose leaves implicit are pinned here: the small named maps (`rtc`, `source`) use **integer keys in listing order**, consistent with the format's compact-uint convention; and `metadata`'s `* tstr => any` rule is what makes unknown *text* keys valid extensions while unknown *integer* keys fail validation.
A handful of constraints are not expressible in CDDL and remain prose-only in [the spec](/specifications/universal-saves-format/): `content_type` being required for non-`save` part kinds, an unknown discriminator tag being treated as `aux`, and a referenced payload's hash equaling key 5.

```cddl file=./universal-saves-format.cddl
```
