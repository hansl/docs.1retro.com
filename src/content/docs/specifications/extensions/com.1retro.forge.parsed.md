---
title: com.1retro.forge.parsed
description: Parser-extracted gameplay tags attached by 1Retro Forge.
slug: specifications/extensions/com.1retro.forge.parsed
---

**Owner:** 1retro · **Applies to:** `[1] metadata` · **Status:** non-normative

`com.1retro.forge.parsed` carries gameplay facts a parser extracts from a save.
These are the kind of thing a UI can show in a list view without re-reading the binary blob.
A typical shape, illustrative rather than exhaustive:

```text
"com.1retro.forge.parsed" = {
  character: text,   // trainer / player name
  level:     uint,   // party-leader or player level
  playtime:  uint,   // seconds of in-game time
  gold:      uint,   // currency
  progress:  float,  // completion fraction, 0.0–1.0
}
```

The concrete field set is owned by 1Retro Forge and may grow over time.
Consumers MUST round-trip fields they don't recognise, exactly as for any extension key.
