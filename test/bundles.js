// Bundle fixtures shared by the layout, schema and nesting tests.
//
// The valid ones are the arrangements the spec describes; the invalid ones are
// the arrangements it forbids. Both sets matter: a schema that accepts
// everything passes the positive tests just as happily as a correct one.

import { Float, Raw, Tag, encode, map, sha256 } from "./cbor.js";

const BUNDLE_TAG = 827539798;

// Payload bytes are patterned rather than zero-filled. A run of zeros would
// both hide an off-by-one that copied the wrong region and make byte offsets
// ambiguous to search for.
// A part's digest is tagged, so a generic CBOR reader can name it. Only
// sha256 is legal there, which is what keeps identity a single answer.
const digest = (bytes) => new Tag(18540, sha256(bytes));

const pattern = (length, seed = 1) => Buffer.from(Array.from({ length }, (_, i) => (i * 31 + seed) & 0xff));

const SAVE = Buffer.from("SAVE");
const BLOCK = pattern(8192);
const CARD = pattern(131072, 7);

// One entry per algorithm, ascending by tag number: sha256, sha1, crc32, md5.
const ROM_HASHES = [
  new Tag(18540, pattern(32, 41)),
  new Tag(18542, pattern(20, 43)),
  new Tag(46010, pattern(4, 47)),
  new Tag(46011, pattern(16, 53)),
];

export const bundle = (header, parts) => new Tag(BUNDLE_TAG, [header, parts]);

// Builds a part with the keys in the order the spec assigns them. `extra` goes
// on last so a fixture can add or override a key without rebuilding the map.
export function part({ id = 0, role, path, payload = SAVE, game, slot, dirent, kind, system, binding, extra } = {}) {
  // `role`, `path` and `encoding` all default to absence, so the helper only
  // writes what a part actually says. `size` is absent too: an embedded
  // uncompressed payload already states its own length.
  const p = new Map([[0, id]]);
  if (kind) p.set(1, kind); // absent means "save", which is never written out
  if (role) p.set(2, role);
  if (path) p.set(3, path);
  if (slot !== undefined) p.set(4, slot);
  if (dirent) p.set(5, dirent);
  p.set(9, digest(payload));
  if (game) p.set(11, game);
  if (system) p.set(12, system);
  if (binding) p.set(13, binding);
  p.set(-1, payload);
  if (extra) for (const [k, v] of extra) p.set(k, v);
  return p;
}

// One nested entry: a `bundle` part whose payload is `inner` encoded. `size`
// and `sha256` fall out of part() over those bytes, so the outer part's key 5
// is the inner bundle's content hash with nothing extra to keep in step, and
// the `system` index is read off the inner header rather than passed in, so a
// fixture cannot drift from what it wraps.
export const nested = (inner, options = {}) =>
  part({ system: inner.value[0].get(1), ...options, kind: "bundle", payload: encode(inner) });

// A save that is one file: the shape every card entry nests.
const oneFileSave = (system, game, payload) => bundle(map({ 1: system, 2: game }), [part({ payload })]);

const card = (system, format, capacity, entries) =>
  bundle(map({ 1: system, 4: map({ 0: format, 1: capacity }) }), entries);

// Three saves on one PS1 card, two of them for the same game. Final Fantasy VII
// writes one file per save slot, so its two entries carry byte-identical game
// maps and are told apart only by `path` and `slot`. That is the case the flat
// model got wrong, which is why it is the fixture the other tests run against.
const FF7 = map({ 3: "SCUS-94163", 4: "Final Fantasy VII" });
const MGS = map({ 3: "SLUS-00594", 4: "Metal Gear Solid" });

export const ps1Card = card("psx", "ps1-mc", 131072, [
  nested(oneFileSave("psx", FF7, BLOCK), {
    id: 0,
    role: "memcard-1",
    path: "BASCUS-94163FF7-S01",
    game: FF7,
    slot: 1,
    dirent: pattern(128, 1),
  }),
  nested(oneFileSave("psx", FF7, pattern(8192, 3)), {
    id: 1,
    role: "memcard-1",
    path: "BASCUS-94163FF7-S02",
    game: FF7,
    slot: 2,
    dirent: pattern(128, 2),
  }),
  nested(oneFileSave("psx", MGS, pattern(8192, 5)), {
    id: 2,
    role: "memcard-1",
    path: "BASLUS-00594",
    game: MGS,
    slot: 3,
    dirent: pattern(128, 3),
  }),
]);

// A PS2 save is a directory. Its files are the parts of one nested bundle, each
// with its own dirent; the directory's own dirent rides on the outer entry.
const FFX = map({ 3: "SLUS-20312", 4: "Final Fantasy X" });

const ffxSave = bundle(map({ 1: "ps2", 2: FFX }), [
  part({ id: 0, path: "icon.sys", payload: pattern(964), slot: 4, dirent: pattern(512, 4) }),
  part({ id: 1, path: "list.ico", payload: pattern(15168), slot: 5, dirent: pattern(512, 5) }),
  part({ id: 2, path: "BASLUS-20312", payload: pattern(40960), slot: 6, dirent: pattern(512, 6) }),
]);

export const ps2Card = card("ps2", "ps2-mc", 8388608, [
  nested(ffxSave, {
    id: 0,
    role: "memcard-1",
    path: "BASLUS-20312",
    game: FFX,
    slot: 3,
    dirent: pattern(512, 3),
  }),
]);

// Two non-PlayStation entries, for the collection fixture. A cartridge save has
// no card around it, so a collection can hold one directly beside a card.
const MK64 = map({ 3: "NUS-NKTE", 4: "Mario Kart 64" });
const POKEMON = map({ 3: "POKEMON RED", 4: "Pokemon Red" });

const gbSave = oneFileSave("gb", POKEMON, pattern(32768, 11));

export const valid = {
  // An empty header and one bare save. The floor of what a bundle is.
  minimal: bundle(new Map(), [part()]),

  // A PS1 card holding three saves, two of them for one game, and a PS2 card
  // holding one save that is itself a directory of files. Between them they
  // cover both nesting shapes a card takes.
  "ps1-card": ps1Card,
  "ps2-card": ps2Card,

  // A card-image kept alongside the split saves, which the spec allows so a
  // producer can hold on to the deleted-save residue and free-block contents
  // that splitting drops.
  "card-image-beside-splits": card("psx", "ps1-mc", 131072, [
    nested(oneFileSave("psx", MGS, BLOCK), {
      id: 0,
      role: "memcard-1",
      path: "BASLUS-00594",
      game: MGS,
      slot: 1,
      dirent: pattern(128, 1),
    }),
    part({ id: 1, role: "memcard-1", payload: CARD, kind: "card-image" }),
  ]),

  // `system_area` carries the card-level bytes belonging to no save, so a
  // writer can rebuild the card's own identity without a whole card-image. On
  // an N64 pak those bytes are its 32-byte label.
  "card-system-area": bundle(map({ 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
    nested(oneFileSave("n64", MK64, pattern(256)), {
      id: 0,
      role: "controller-pak-1",
      game: MK64,
      slot: 1,
      dirent: pattern(32, 1),
    }),
  ]),

  // A card holding nothing but saves for one game, which is what Final Fantasy
  // VII does to a PS1 card: one block per save, fifteen slots, no room for
  // anything else. The header names the game, because here a single game
  // really does describe the whole card. The `-Sxx` in the name is the game's
  // own slot and the card's directory slot is a different number, so the two
  // entries below are deliberately not aligned.
  "card-of-one-game": bundle(map({ 1: "psx", 2: FF7, 4: map({ 0: "ps1-mc", 1: 131072 }) }), [
    nested(oneFileSave("psx", FF7, BLOCK), {
      id: 0,
      role: "memcard-1",
      path: "BASCUS-94163FF7-S01",
      game: FF7,
      slot: 1,
      dirent: pattern(128, 1),
    }),
    nested(oneFileSave("psx", FF7, pattern(8192, 3)), {
      id: 1,
      role: "memcard-1",
      path: "BASCUS-94163FF7-S03",
      game: FF7,
      slot: 2,
      dirent: pattern(128, 2),
    }),
  ]),

  // A thin card: the entry points at its save's content hash instead of
  // embedding it, so the file is a list of slots, dirents and hashes.
  "thin-card": card("psx", "ps1-mc", 131072, [
    (() => {
      const bytes = encode(oneFileSave("psx", MGS, BLOCK));
      return new Map([
        [0, 0],
        [1, "bundle"],
        [2, "memcard-1"],
        [3, "BASLUS-00594"],
        [4, 1],
        [5, pattern(128, 1)],
        [8, bytes.length],
        [9, digest(bytes)],
        [11, MGS],
        [12, "psx"],
        [-1, map({ 0: "ref", 1: digest(bytes), 2: "https://example.com/blob/mgs" })],
      ]);
    })(),
  ]),

  // A collection: no system, no game, no card of its own, and entries that do
  // not agree on a system. This is how one file spans systems, and it is the
  // deepest shape the spec allows, since the PS1 entry is itself a card.
  collection: bundle(new Map(), [
    nested(ps1Card, { id: 0, role: "memcard-1" }),
    nested(gbSave, { id: 1, role: "cartridge", game: POKEMON }),
  ]),

  // A kind nobody has to recognize. A consumer treats it as `aux` and hands it
  // back unchanged, which is what lets a producer name one out of a domain it
  // owns instead of registering anything.
  "third-party-kind": bundle(map({ 1: "gba" }), [part({ id: 0, payload: pattern(64), kind: "io.mgba.rewind" })]),

  // A save the console bound to itself. The bytes are valid and worth keeping,
  // and they will not restore to another console, which is the one thing a
  // consumer cannot work out from the payload.
  binding: bundle(map({ 1: "wii" }), [part({ payload: pattern(512), binding: "device" })]),

  // One game whose state spans a cartridge and a memory card, which is neither
  // a card (the bundle is not one) nor a collection (it has a system and a
  // game). Mixing a plain save part with a `bundle` part is what covers it.
  "cartridge-and-card": bundle(map({ 1: "n64", 2: MK64 }), [
    part({ id: 0, role: "cartridge", payload: pattern(512, 21) }),
    nested(
      bundle(map({ 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
        nested(oneFileSave("n64", MK64, pattern(256)), {
          id: 0,
          role: "controller-pak-1",
          game: MK64,
          slot: 1,
          dirent: pattern(32, 1),
        }),
      ]),
      { id: 1, role: "controller-pak-1" },
    ),
  ]),

  // Every identification hint at once, plus a populated metadata slot. A real
  // producer emits the hashes it has already computed rather than all four;
  // this is the upper bound, and the only fixture carrying a clock reading.
  "fully-identified": bundle(
    map({
      0: new Tag(1, 1712345678),
      1: "gba",
      2: map({
        0: map({ "com.1retro": 1234 }),
        1: ROM_HASHES,
        2: "pokemon_emerald.gba",
        3: "AGB-BPEE-USA",
        4: "Pokemon Emerald",
      }),
      5: "Right before the Elite Four",
      "x.1sav.rtc": map({ 0: new Tag(1, 1044057600), 1: 500 }),
    }),
    [part({ payload: pattern(131072, 23) })],
  ),

  // A compressed part beside an `aux` one. `size` and `sha256` cover the
  // uncompressed bytes whatever `encoding` says, so a zstd part's stored bytes
  // match neither, and only the parts around it can be read without inflating.
  "compressed-and-aux": bundle(map({ 1: "snes" }), [
    new Map([
      [0, 0],
      [2, "cartridge"],
      [7, "zstd"],
      [8, 32768],
      [9, digest(pattern(32768, 29))],
      [-1, pattern(410, 31)],
    ]),
    part({
      id: 1,
      path: "thumb.png",
      payload: pattern(2048, 37),
      kind: "aux",
      extra: new Map([[6, "image/png"]]),
    }),
  ]),

  // An N64 Controller Pak permits two notes with the same game code and note
  // name, so `path` cannot tell them apart and the producer must carry `slot`.
  // This is the case the uniqueness rule exists for, on real hardware.
  "n64-pak-duplicate-note-names": bundle(map({ 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
    nested(oneFileSave("n64", MK64, pattern(256, 31)), {
      id: 0,
      role: "controller-pak-1",
      path: "MARIOKART64",
      game: MK64,
      slot: 1,
      dirent: pattern(32, 1),
    }),
    nested(oneFileSave("n64", MK64, pattern(256, 37)), {
      id: 1,
      role: "controller-pak-1",
      path: "MARIOKART64",
      game: MK64,
      slot: 2,
      dirent: pattern(32, 2),
    }),
  ]),

  // Saturn keeps a save's directory entry inside the save's own first block, so
  // `saturn-bup` is the one card format where a card entry carries no `dirent`
  // at all. A writer rewrites the block chain in the payload instead.
  "saturn-backup": bundle(map({ 1: "saturn", 4: map({ 0: "saturn-bup", 1: 32768 }) }), [
    nested(oneFileSave("saturn", map({ 4: "Panzer Dragoon Saga" }), pattern(1024, 41)), {
      id: 0,
      path: "PANZER_SV",
      slot: 1,
    }),
  ]),

  // A PS1 save spanning two blocks is one part of 16384 bytes. The card
  // allocated two blocks and they may not have been adjacent, which is not
  // recorded: block placement is the destination allocator's business.
  "ps1-multi-block-save": card("psx", "ps1-mc", 131072, [
    nested(oneFileSave("psx", map({ 3: "SLUS-00892", 4: "Final Fantasy VIII" }), pattern(16384, 43)), {
      id: 0,
      role: "memcard-1",
      path: "BASLUS-00892FF8-S01",
      slot: 1,
      dirent: pattern(128, 5),
    }),
  ]),

  // A Transfer Pak puts a Game Boy cartridge in an N64 controller, and Pokemon
  // Stadium writes that cartridge's SRAM. The save is `gb` because that is what
  // will load it; the N64 is provenance, which is what `source` is for.
  "transfer-pak": bundle(map({ 1: "gb", 2: POKEMON, 3: map({ 0: "console", 2: "x.example.stadium", 3: "1.0" }) }), [
    part({ role: "cartridge", payload: pattern(32768, 47) }),
  ]),

  // A formatted card with nothing saved on it. The card is real and worth
  // carrying, and a `card_image` is the only part it can have, since there is
  // no save to nest.
  "empty-formatted-card": bundle(map({ 1: "psx", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [
    part({ role: "memcard-1", payload: CARD, kind: "card-image" }),
  ]),

  // A zero-length payload. A save slot a console formatted and never wrote to
  // is still a part: `size` is absent because the payload states its own
  // length, and sha256 over no bytes is perfectly well defined.
  "zero-byte-payload": bundle(map({ 1: "gb" }), [part({ payload: Buffer.alloc(0) })]),

  // An amiibo: a few hundred bytes on an NFC tag, signed against that tag's own
  // serial. No `system`, because several consoles read one and none of them
  // owns it, which is a case the optional header is there for. `binding` is
  // `medium` rather than `device`: any console can write it and the result
  // stays valid, but copying it to a second tag does not.
  "token-bound-save": bundle(map({ 2: map({ 4: "Super Smash Bros." }) }), [
    part({ payload: pattern(540, 61), binding: "medium" }),
  ]),

  // A numbered socket past anything the registry enumerates. Eight VMU slots
  // across four Dreamcast controllers, and the prefix is what a consumer
  // matches on, so `memcard-8` is understood without being listed.
  "high-numbered-socket": bundle(map({ 1: "dreamcast" }), [
    part({ id: 0, role: "memcard-1", payload: pattern(128, 53) }),
    part({ id: 1, role: "memcard-8", payload: pattern(128, 59) }),
  ]),

  // Provenance at both levels: a cartridge reader assembled the bundle, and one
  // part came from an emulator instead, so it carries its own source. Note the
  // split inside one map: `device_kind` is a spec slug nobody may mint into,
  // while `app` beside it is the producer's own name, here reverse-DNS for the
  // reader and a Cores registry slug for the emulator.
  "source-provenance": bundle(
    map({ 1: "gb", 3: map({ 0: "cartridge-reader", 1: "a1b2c3", 2: "io.epilogue", 3: "1.0.3" }) }),
    [
      part({ id: 0, role: "cartridge", payload: pattern(32768, 13) }),
      part({
        id: 1,
        payload: pattern(512, 17),
        extra: new Map([[10, map({ 0: "emulator", 2: "mgba", 3: "0.10.2" })]]),
      }),
    ],
  ),

  // Catalog ids, keyed by resolver name. A producer aligned with several
  // catalogs records one entry each, and the id is whatever form that catalog
  // publishes: an integer for one, a string for the next.
  "game-ids": bundle(map({ 1: "psx", 2: map({ 0: map({ "com.1retro": 1234, "org.hasheous": "SLUS-00594" }) }) }), [
    part(),
  ]),

  // Extension keys sit flat on the header and on a part alike, named by
  // reversing a domain the producer holds or by taking a reserved name in the
  // `x` tree when the value belongs to no one producer. Both kinds ride here.
  "part-extension-keys": bundle(
    map({
      1: "gba",
      // A real GBA cartridge clock rather than a placeholder: the value has to
      // satisfy that key's own schema, which is what the extension suite
      // cross-checks.
      "x.1sav.rtc.s3511a": map({ 0: pattern(7), 1: 0x40 }),
    }),
    // The pair: what a parser found, and which parser found it. The map is
    // uninterpretable without the id beside it.
    [
      part({
        extra: new Map([["com.1retro.forge", map({ 0: "ff7", 1: map({ 0: "Aeris" }) })]]),
      }),
    ],
  ),
};

export const invalid = {
  // This schema describes v0.1, so an integer key it does not list fails
  // validation. A shipped decoder is deliberately looser: it ignores and
  // round-trips these, because the only thing they can be is a later minor
  // version's field. That difference is a decoder rule the schema cannot state.
  "part-unknown-integer-key": bundle(new Map(), [part({ extra: new Map([[15, "nope"]]) })]),
  "header-unknown-integer-key": bundle(map({ 16: "nope" }), [part()]),

  // `card` needs both format and capacity; neither is optional.
  "card-without-capacity": bundle(map({ 1: "psx", 4: map({ 0: "ps1-mc" }) }), [part()]),

  // `dirent` is a byte string. Text would make it look parseable, which is the
  // one thing this spec promises it is not.
  "dirent-as-text": bundle(new Map(), [part({ extra: new Map([[5, "not bytes"]]) })]),

  // `kind` is text. An integer here would be a producer reaching for the old
  // tag numbers, which no longer mean anything.
  "kind-as-integer": bundle(new Map(), [part({ extra: new Map([[1, 46005]]) })]),

  // A bundle with nothing in it. Every other container in the format forbids
  // its own empty form, and a bundle holding no part carries no save.
  "empty-parts": bundle(new Map(), []),

  // A default written out, which would give one part several encodings. The
  // schema catches these two; a spelled-out `role: "primary"` it cannot, since
  // `primary` is a well-formed slug, so that one is pinned in layout.test.js.
  "path-spelled-empty": bundle(new Map(), [part({ extra: new Map([[3, ""]]) })]),
  "encoding-spelled-none": bundle(new Map(), [part({ extra: new Map([[7, "none"]]) })]),

  // The pre-coalescing spellings. `memcard_1` and `card_image` were valid when
  // the format ran two slug grammars; one grammar means one spelling, so they
  // are malformed now rather than unrecognized-but-round-trippable.
  "role-with-underscore": bundle(new Map(), [part({ role: "memcard_1" })]),
  "kind-with-underscore": bundle(new Map(), [part({ kind: "card_image" })]),

  // A slug separates runs with a single dash and carries none at either end,
  // so a doubled or dangling one is malformed rather than an odd name.
  "slug-with-doubled-dash": bundle(new Map(), [part({ role: "memcard--1" })]),
  "slug-too-long": bundle(new Map(), [part({ role: `a${"-a".repeat(32)}` })]),

  // The bare-slug vocabularies are lowercase and closed over their own
  // punctuation. `role`, `kind` and `app` separate words with `_`; `system` and
  // the card format use `-`. A value written in the other convention, or in any
  // case but lower, is malformed rather than an unknown-but-round-trippable
  // value: round-tripping applies to names this decoder has not heard of, not
  // to names that could not have been minted.
  "role-with-uppercase": bundle(new Map(), [part({ role: "MemCard" })]),
  "system-slug-with-underscore": bundle(map({ 1: "ps_x" }), [part()]),
  "card-format-with-underscore": bundle(map({ 1: "psx", 4: map({ 0: "ps1_mc", 1: 131072 }) }), [part()]),

  // A card format is one of three vocabularies a producer may not mint into. An
  // unknown format leaves a consumer unable to write the card back at all, so a
  // reverse-DNS name here is malformed rather than a private extension.
  "card-format-reverse-dns": bundle(map({ 1: "psx", 4: map({ 0: "io.mgba.card", 1: 131072 }) }), [part()]),

  // Same for a device kind. `app` in the same map names the producer itself and
  // is minted freely, so the two arms of that map pull in opposite directions.
  "device-kind-reverse-dns": bundle(map({ 1: "gb", 3: map({ 0: "io.epilogue.operator", 2: "io.epilogue" }) }), [
    part(),
  ]),

  // Same for a role. A socket is hardware and belongs to nobody, and a private
  // name for one could not be matched against a target by anything but its
  // author, which is the whole job the field does.
  "role-reverse-dns": bundle(new Map(), [part({ role: "io.mgba.cart-slot" })]),

  // A binding names a category everyone shares, so it is spec-owned too. A
  // private one would split the category instead of extending it, leaving a
  // consumer unable to tell a device binding from an account one.
  "binding-reverse-dns": bundle(new Map(), [part({ binding: "io.mgba.console" })]),

  // A dotted name is a producer's own and therefore has to be a well-formed
  // reverse-DNS name, which forbids `_` in a label. Failing both arms is the
  // point: this is neither a spec slug nor a name anybody could hold.
  "kind-dotted-but-not-reverse-dns": bundle(new Map(), [part({ kind: "io.mgba_rewind" })]),

  // `path` is capped so a consumer can size the head region. 512 is the limit,
  // in bytes rather than characters, since that is what a decoder can check.
  "path-too-long": bundle(new Map(), [part({ path: "a".repeat(513) })]),

  // A resolver name is minted exactly as an extension key is, so a bare word
  // fails for the same reason: nothing says whose catalog this id is from.
  "resolver-name-not-reverse-dns": bundle(map({ 2: map({ 0: map({ hasheous: 1234 }) }) }), [part()]),

  // An extension key is a reverse-DNS name or it is nothing. Without that there
  // is no way to tell whose key this is, which is the one thing the namespace
  // buys. A bare word and an uppercase name are both unmintable.
  "extension-key-not-reverse-dns": bundle(map({ parsed: 1 }), [part()]),
  "extension-key-uppercase": bundle(new Map(), [part({ extra: new Map([["IO.mgba.rtc", 1]]) })]),

  // Tag 1 admits a float and this format does not. Left open, one instant would
  // have two conforming encodings and the content hash would stop being a
  // function of what the bundle says.
  "created-at-as-float": bundle(map({ 0: new Tag(1, new Float(1712345678.5)) }), [part()]),

  // A digest has to match the length its algorithm tag implies, and the tag has
  // to be one of the four the shared type defines. Neither is recoverable by
  // guessing, so both are malformed rather than skippable.
  "rom-hash-wrong-length": bundle(map({ 2: map({ 1: [new Tag(18540, pattern(20))] }) }), [part()]),
  "rom-hash-unknown-tag": bundle(map({ 2: map({ 1: [new Tag(9999, pattern(32))] }) }), [part()]),

  // Empty containers, which absence already encodes.
  "empty-rom-hashes": bundle(map({ 2: map({ 1: [] }) }), [part()]),
  "empty-game-id": bundle(map({ 2: map({ 0: new Map() }) }), [part()]),

  // A part's sha256 is exactly 32 bytes; the spec pins the algorithm, so a
  // shorter digest is a different algorithm smuggled in without its tag.
  "part-sha256-wrong-length": bundle(new Map(), [part({ extra: new Map([[9, new Tag(18540, pattern(16))]]) })]),

  // The tag is what lets a generic reader name the digest, so an untagged one
  // is not a hash value at all. A different algorithm's tag is rejected too:
  // this spec pins sha256 here so that identity has exactly one answer.
  "part-sha256-untagged": bundle(new Map(), [part({ extra: new Map([[9, pattern(32)]]) })]),
  "part-sha256-wrong-algorithm": bundle(new Map(), [part({ extra: new Map([[9, new Tag(18542, pattern(20))]]) })]),

  // `size` is carried only where it cannot be derived. An embedded
  // uncompressed payload states its own length, so repeating it invites the
  // two to disagree.
  "size-on-uncompressed-part": bundle(new Map(), [part({ extra: new Map([[8, 4]]) })]),

  // A pre-renumber bundle, from when the payload sat in the unsigned range.
  // Key 8 is `game` now, and the payload is at -1, so this is rejected rather
  // than read as a game map.
  "payload-at-old-key-8": bundle(new Map(), [
    new Map([
      [0, 0],
      [8, SAVE.length],
      [9, digest(SAVE)],
      [11, SAVE],
    ]),
  ]),
};

// ---------------------------------------------------------------------------
// Malformed by the *determinism* rules rather than the data model.
//
// RFC 8949 section 4.2 is what makes the content hash a function of what a
// bundle says, and a schema cannot see any of it: CDDL validates the decoded
// data, so every case below decodes to a structurally perfect bundle and would
// pass the schema. A decoder that accepts them computes a different content
// hash from every other decoder, which is the one thing the format cannot
// tolerate. Nothing else in this suite covers these, so they are hand-encoded.
//
// Each is the `minimal` bundle with exactly one encoding rule broken. The
// canonical bytes are:
//
//   da 31534156        tag 827539798
//   82                 array(2)
//   a0                 header: map(0)
//   81                 parts: array(1)
//   a3                 part: map(3)
//   00 00                 0: 0                      id
//   09 d9486c 5820 …      9: 18540(h'…32 bytes…')   sha256
//   20 44 53415645       -1: h'SAVE'                payload

const MINIMAL_HEAD = "da3153415682a081";
const PART_ID = "0000";
const PART_SHA = "09d9486c5820" + sha256(SAVE).toString("hex");
const PART_PAYLOAD = "204453415645";
const hex = (...parts) => new Raw(Buffer.from(parts.join(""), "hex"));

export const malformedDeterminism = {
  // 9f/ff is an indefinite-length array. Definite lengths everywhere is the
  // first thing 4.2 requires, and an encoder that streams without knowing its
  // length ahead of time produces this without meaning to.
  "indefinite-length-parts": hex("da3153415682a0", "9f", "a3", PART_ID, PART_SHA, PART_PAYLOAD, "ff"),
  "indefinite-length-part-map": hex(MINIMAL_HEAD, "bf", PART_ID, PART_SHA, PART_PAYLOAD, "ff"),

  // 18 00 encodes 0 in two bytes where 00 does it in one. Preferred
  // serialization means the shortest head that fits, and a library that always
  // writes a fixed width emits this.
  "non-preferred-key-head": hex(MINIMAL_HEAD, "a3", "1800", "00", PART_SHA, PART_PAYLOAD),
  "non-preferred-value-head": hex(MINIMAL_HEAD, "a3", "00", "1800", PART_SHA, PART_PAYLOAD),

  // Keys sort by the bytewise order of their encodings. Here 9 precedes 0,
  // which decodes to the same map and hashes differently.
  "map-keys-out-of-order": hex(MINIMAL_HEAD, "a3", PART_SHA, PART_ID, PART_PAYLOAD),

  // Two entries for key 0. A decoder that keeps the last one and a decoder
  // that keeps the first disagree about what the bundle says.
  "duplicate-map-key": hex(MINIMAL_HEAD, "a4", PART_ID, "0001", PART_SHA, PART_PAYLOAD),

  // The rules below are not about CBOR heads at all. RFC 8949 4.2 leaves them
  // to the application, and the spec takes them on because the content hash
  // needs them: two encoders given one logical bundle have to agree byte for
  // byte, and text normalisation and array order both break that.
  // Parts are stored in ascending `id` order, always. This one holds id 1 then
  // id 0, which decodes to the same two parts and hashes differently.
  "parts-out-of-order": bundle(new Map(), [part({ id: 1 }), part({ id: 0, payload: pattern(16, 3) })]),

  // Text is in NFC. "Pokémon" written with a combining acute (U+0065 U+0301)
  // rather than the precomposed é (U+00E9) is the same string to a reader and
  // a different one to a hash. Real catalogues carry both forms.
  "text-not-nfc": bundle(map({ 1: "gb", 2: map({ 4: "Pok\u0065\u0301mon Red" }) }), [part()]),

  // Hash values sort ascending by tag, so sha1 (18542) after sha256 (18540).
  // Reversed here.
  "rom-hashes-out-of-order": bundle(
    map({ 2: map({ 1: [new Tag(18542, pattern(20, 7)), new Tag(18540, pattern(32, 11))] }) }),
    [part()],
  ),

  // At most one entry per algorithm. Two sha256 digests name two different
  // files, and nothing says which one the bundle means.
  "rom-hashes-duplicate-algorithm": bundle(
    map({ 2: map({ 1: [new Tag(18540, pattern(32, 13)), new Tag(18540, pattern(32, 17))] }) }),
    [part()],
  ),
};

// ---------------------------------------------------------------------------
// Malformed by rules that need a look inside a payload, or across parts.
//
// CDDL cannot reach inside a byte string, so nothing about a nested bundle is
// checkable by the schema, and neither is a rule that compares one part to
// another. These are the cases an implementation has to catch on its own.

const innerSave = bundle(map({ 1: "psx", 2: MGS }), [part({ payload: BLOCK })]);

export const malformedStructure = {
  // Every part of a nested bundle is uncompressed with its payload embedded,
  // so that an inner bundle's file hash and content hash are the same value.
  // Compression belongs on the outer part.
  "nested-part-compressed": card("psx", "ps1-mc", 131072, [
    nested(
      bundle(map({ 1: "psx", 2: MGS }), [
        new Map([
          [0, 0],
          [7, "zstd"],
          [8, 8192],
          [9, new Tag(18540, sha256(BLOCK))],
          [-1, pattern(410, 23)],
        ]),
      ]),
      { id: 0, role: "memcard-1", path: "BASLUS-00594", slot: 1, dirent: pattern(128, 1) },
    ),
  ]),

  // A `bundle` part's payload has to decode as a saves-file. This one is a
  // plain save's bytes wearing the kind of a bundle.
  "bundle-part-payload-not-a-bundle": card("psx", "ps1-mc", 131072, [
    part({ id: 0, role: "memcard-1", path: "BASLUS-00594", kind: "bundle", payload: BLOCK, system: "psx" }),
  ]),

  // The outer sha256 is the inner bundle's identity, which is what makes
  // extracting a save a byte copy. Here it names bytes the payload is not.
  "bundle-part-sha256-mismatch": card("psx", "ps1-mc", 131072, [
    (() => {
      const p = nested(innerSave, { id: 0, role: "memcard-1", path: "BASLUS-00594" });
      p.set(9, new Tag(18540, sha256(Buffer.from("something else"))));
      return p;
    })(),
  ]),

  // Depth is capped at 2: a collection of cards of saves fills all three tiers,
  // and a `bundle` part inside the third is one level too far.
  "nested-deeper-than-two": bundle(new Map(), [nested(valid.collection, { id: 0 })]),

  // No two parts may agree on `role`, `path` and `slot` together, and with all
  // three defaulting to absence two bare parts collide on every one of them.
  // That is a bundle a consumer cannot name a part in, or match against a
  // target, so it cannot act on it at all.
  "parts-share-an-address": bundle(new Map(), [part({ id: 0 }), part({ id: 1, payload: pattern(16, 19) })]),
};
