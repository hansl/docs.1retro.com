// Fixtures for each extension key, checked against that key's own schema.
//
// An extension value is `any` to the bundle schema, so nothing here is caught
// by the format's own validator. That is the point: these keys are where a
// documented shape and its example can drift apart with nobody noticing.
//
// Each entry names the schema file it validates against, so adding a key means
// adding a `.cddl` beside its page and a block here.

import { Float, Tag, map } from "../cbor.js";

const DIR = "src/content/docs/specifications/extensions";
const pattern = (length, seed = 1) => Buffer.from(Array.from({ length }, (_, i) => (i * 31 + seed) & 0xff));

export const extensions = {
  // Normative: these specifications own the shape, so the negatives here are
  // real conformance tests rather than documentation checks.
  "x.1sav.rtc": {
    schema: `${DIR}/x.1sav.rtc.cddl`,
    valid: {
      full: map({ 0: new Tag(1, 1044057600), 1: 500 }),
      // `accuracy_ms` is the only optional key: a producer with nothing useful
      // to say about uncertainty omits it rather than guessing a number.
      "without-accuracy": map({ 0: new Tag(1, 1044057600) }),
    },
    invalid: {
      // The reading is the whole of what this key carries, so it is required.
      "without-reading": map({ 1: 500 }),
      // Whole seconds only, for the reason `created_at` gives: tag 1 admits a
      // float, and allowing it would give one instant two encodings.
      "reading-as-float": map({ 0: new Tag(1, new Float(1044057600.5)) }),
      // The reading is tagged. A bare integer could be anything.
      "reading-untagged": map({ 0: 1044057600 }),
      "accuracy-negative": map({ 0: new Tag(1, 1044057600), 1: -1 }),
      // Naming the originating clock was key 1 and is not carried any more:
      // the chip key beside this one says which clock, and `source` says who
      // read it.
      "source-clock-as-text": map({ 0: new Tag(1, 1044057600), 1: "gba-rtc" }),
      "unknown-key": map({ 0: new Tag(1, 1044057600), 2: "nope" }),
      "not-a-map": "1044057600",
    },
  },

  // The GBA cartridge clock, spec-owned for the same reason: the S-3511A's
  // latched bytes are written the same way by everyone who keeps them.
  "x.1sav.rtc.s3511a": {
    schema: `${DIR}/x.1sav.rtc.s3511a.cddl`,
    valid: {
      // Control 0x40 is bit 6 set, which is 24-hour mode. There is no separate
      // flag to agree with, which is the point of carrying the raw register.
      documented: map({ 0: pattern(7), 1: 0x40 }),
      "12-hour-mode": map({ 0: pattern(7), 1: 0x00 }),
    },
    invalid: {
      // The S-3511A latches seven BCD bytes: year, month, day, weekday, hour,
      // minute, second. Any other length is a different chip.
      "components-too-long": map({ 0: pattern(8), 1: 0x40 }),
      "components-too-short": map({ 0: pattern(6), 1: 0x40 }),
      // Neither key is derivable from the other, so neither is optional.
      "without-components": map({ 1: 0x40 }),
      "without-control": map({ 0: pattern(7) }),
      // 24-hour mode lives in bit 6 of the control register. A field beside it
      // would be a second spelling of one value, and the two could disagree.
      "hour24-as-its-own-key": map({ 0: pattern(7), 1: 0x40, 2: true }),
      // The latched bytes are a byte string, not seven numbers: what a
      // consumer writes back has to be what it read.
      "components-as-array": map({ 0: [0, 1, 2, 3, 4, 5, 6], 1: 0x40 }),
      "control-negative": map({ 0: pattern(7), 1: -1 }),
      "not-a-map": "40",
    },
  },

  // The Game Boy cartridge clock. A different chip, and one that counts rather
  // than dates, so none of the S-3511A's fields fit it. The four keys together
  // are what regenerating the save's footer takes.
  "x.1sav.rtc.mbc3": {
    schema: `${DIR}/x.1sav.rtc.mbc3.cddl`,
    valid: {
      // 12:30:59 on day 456, running. Day 456 needs the counter's ninth bit,
      // which is bit 0 of the high register: 456 is 0x1C8, so low 0xC8, high 1.
      documented: map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // The same clock from an emulator that wrote an 8-byte timestamp. Same
      // reading, different footer bytes, which is what key 3 records.
      "wide-timestamp": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 8,
      }),
      // The latched copy lags the live registers until the game latches again,
      // so the two disagreeing is the ordinary case rather than an error.
      "latch-behind-live": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [12, 28, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 4,
      }),
      // Halted with the counter carried: bits 6 and 7 of the high register,
      // which is where a cartridge sits after running past 511 days unread.
      "halted-and-carried": map({
        0: [0, 0, 0, 0xff, 0xc0],
        1: [0, 0, 0, 0xff, 0xc0],
        2: new Tag(1, 1044057600),
        3: 4,
      }),
    },
    invalid: {
      // Five registers, exactly: seconds, minutes, hours, day low, day high.
      // Four is a reader that dropped the high byte and with it the halt flag.
      "four-registers": map({ 0: [59, 30, 12, 0xc8], 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      "six-registers": map({
        0: [59, 30, 12, 0xc8, 0x01, 0],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 4,
      }),
      // Both copies are required. They hold different values, and a producer
      // that writes one has already read the other.
      "without-live": map({ 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      "without-latched": map({ 0: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // The timestamp is tagged, for the reason `x.1sav.rtc` gives: a bare
      // integer beside four registers could be anything.
      "timestamp-untagged": map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x01], 2: 1044057600, 3: 4 }),
      // 4 or 8, because those are the widths emulators actually write. A third
      // value would be a footer nobody can rebuild.
      "timestamp-width-six": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 6,
      }),
      // Without the width the footer cannot be regenerated byte for byte,
      // which is the whole reason this key can hold a decoded clock.
      "without-timestamp-width": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
      }),
      "registers-as-bytes": map({ 0: pattern(5), 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      "not-a-map": "1044057600",
    },
  },

  // One key, not two: the parser name and what it found are useless apart, so
  // nothing should be able to separate them. Key 0 is free-form and pointedly
  // not the format's slug grammar; key 1 is Forge's to shape as it likes.
  "com.1retro.forge": {
    schema: `${DIR}/com.1retro.forge.cddl`,
    valid: {
      documented: map({ 0: "ff7", 1: map({ 0: "Aeris", 1: 42, 2: 130500 }) }),
      // A parser that ran and found nothing worth recording still names itself.
      "id only": map({ 0: "alttp" }),
      "empty parsed": map({ 0: "alttp", 1: new Map() }),
      // Spellings a format slug would reject, which key 0 is not.
      "id with underscore": map({ 0: "pokemon_gold" }),
      "id with uppercase": map({ 0: "FF7" }),
      "id with spaces": map({ 0: "chrono trigger (jp)" }),
      "parsed with mixed key types": new Map([
        [0, "alttp"],
        [
          1,
          new Map([
            [0, "Link"],
            ["hearts", 12],
            [new Tag(1, 1044057600), "last save"],
          ]),
        ],
      ]),
    },
    invalid: {
      // The parser name is what makes the rest legible, so it is required.
      "no id": map({ 1: map({ 0: "Aeris" }) }),
      "id not text": map({ 0: 42 }),
      "parsed not a map": map({ 0: "alttp", 1: "Aeris" }),
      "not a map": "alttp",
    },
  },
};
