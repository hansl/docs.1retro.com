---
title: com.1retro.forge
description: What a Forge parser read out of a save, and which parser read it.
slug: specifications/extensions/com.1retro.forge
---

**Owner:** 1retro · **Applies to:** the bundle header and a part · **Status:** non-normative

What a Forge parser pulled out of a save, together with the name of the parser that pulled it.

```cddl file=./com.1retro.forge.cddl

```

## One key, not two

The two halves are useless apart. A bag of parsed values says nothing without the name of the parser that produced it,
since nothing in the bag says how to read it; the name on its own says only that something ran. Keeping them under one
key means nothing can separate them: a consumer that copies, filters or merges extension keys either takes both or takes
neither.

It is also what the format [advises](/specifications/universal-saves-format/#extensions) — a producer with several
fields to attach puts a map under one key rather than taking a key each, because the name is a namespace rather than a
field label.

## Do not interpret key 1

There is no stable field set to code against. What it holds depends on the game and on the parser version, a shape
observed in one bundle says nothing about the next, and Forge is free to change both without notice.

Key 0 is what makes the rest legible: a consumer that recognises the parser name knows how to read the map beside it,
and one that does not round-trips the whole thing and reads none of it.

## Key 0 is not a format slug

The saves format checks several vocabularies against a strict
[slug grammar](/specifications/universal-saves-format/#minting-a-name): lowercase ASCII, single dashes, at most 64
bytes. This is not one of them. What a parser is called is Forge's business, so the value is free-form text — compare it
by equality, and do not parse it for structure that may not be there.

## Status

Deliberately underspecified. The Forge specification will live in this repository eventually and will define both keys
properly; until then this page fixes only the envelope. Tightening it later is a change to Forge rather than to the
saves format, which never looks inside an extension key.
