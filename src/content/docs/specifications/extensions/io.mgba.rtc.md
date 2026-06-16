---
title: io.mgba.rtc
description: mGBA's native GBA/GB RTC chip state, for byte-exact round-tripping.
slug: specifications/extensions/io.mgba.rtc
---

**Owner:** mGBA · **Applies to:** `[1] metadata` · **Status:** non-normative (schema owned by [mGBA](https://mgba.io))

The Universal Saves Format's spec-owned [`rtc`](/specifications/universal-saves-format/) field carries only the portable, normalized instant.
An emulator that needs byte-exact RTC round-tripping stores its native chip state under this key instead.
mGBA's GBA RTC (a Seiko S-3511A) maps naturally to:

```text
"io.mgba.rtc" = {
  components: <7 bytes, BCD>,  // year-since-2000, month, day, weekday, hour, minute, second
  hour24:     bool,            // 24-hour-mode control bit (PM flag is bit 7 of the hour byte in 12h mode)
  control:    uint,            // raw control register
  offset:     int,             // mGBA derives the clock as host_clock − offset
  last_latch: tag 1,           // when the RTC was last read
}
```

The 2-digit year, the separate weekday byte, the 12/24-hour mode and the `offset` / `last_latch` reconstruction model are all specific to the chip and the emulator.
That is exactly why they live here and not in `rtc`.
A consumer that only wants to know what time the game thinks it is reads `rtc.epoch_seconds` and ignores this key.
