---
title: Glossary
description: The terms these specifications use, and where each one is actually defined.
---

These specifications use a small vocabulary precisely. `bundle` and `save` are not synonyms, a `part` is not a file, and
`producer`, `consumer` and `writer` are three different things that most normative rules are addressed to.

Non-normative. Each entry points at the text that defines the term, and that text wins on a disagreement.

## Containers

- **Bundle.** A complete `1SAV` document: the tag, the header and the array of parts. What a bundle _represents_ is
  whatever its header says, so the word alone does not say whether you hold one save, one card or a collection. It is
  the format's self-contained unit and [means the same thing sliced out](/specifications/bundle/#nested-bundles) as in
  place.
- **Part.** One addressed slot inside a bundle, and not the atomic unit:
  [`kind`, `role`, `path`](/specifications/bundle/#part-map) fall back to defaults and `source` and `game` to the
  header, so a part lifted out of its bundle loses most of what it meant.
- **Nested bundle.** A complete bundle carried as a part's payload. This is how a card holds its saves and a collection
  holds its cards. See [Nested bundles](/specifications/bundle/#nested-bundles).
- **`bundle` part.** The part carrying a nested bundle, whose `sha256` is that bundle's content hash. Several extension
  keys turn on whether a part is this kind rather than an ordinary one.
- **Shape.** Which of `save`, `card`, `device` or `collection` a bundle is, carried in the header and never inferred.
  Each has a document of its own, and the vocabulary is closed.
- **Save.** One game's state as a console wrote it, and the [`save` shape](/specifications/saves/). Inside a card, a
  save is a nested bundle rather than a part.
- **Card.** The [`card` shape](/specifications/cards/): one memory card, its saves nested one per part. The
  [`card` map](/specifications/bundle/#card-map) is required on it and forbidden elsewhere.
- **Device.** The [`device` shape](/specifications/device/): one console's storage read whole, its components nested one
  per part and told apart by `role`. `system` is required, which is what separates it from a collection.
- **Collection.** The [`collection` shape](/specifications/collections/): every part a `bundle` part, and no `system`,
  `game` or `card` of its own. It is how one file spans systems.
- **Containment.** Which shapes a bundle may hold, which follows from its own: a collection holds any shape but a
  collection, a device holds cards and saves, a card holds saves, and a save holds nothing nested. The chain never leads
  back to itself, so how deep a file goes is a consequence of what is in it rather than a limit the spec sets.

## Addressing a part

- **Kind.** What a part's bytes play: absent for a save, or
  [`bundle`, `card-image` or `aux`](/specifications/bundle/#part-kinds).
- **Role.** Which socket the bytes came out of, not what medium they are on. A controller pak is a card that lives in a
  controller. Names come from the [Save Roles registry](/registries/roles/).
- **Path.** Where the bytes sat in the container they came from, as a relative path. On a card's `bundle` part it is the
  name the card's directory holds, which is what tells two saves of one game apart.
- **Slot.** A part's index in the container it came from, carried where a container lets two entries share a name.
- **`dirent`.** The container's directory entry for a part, carried verbatim as bytes. The format never says what a byte
  in one means: it is input for a writer, not a description of the save.
- **Index copy.** A value repeated on an outer part so a consumer can list a container without stepping into payloads.
  The inner header is authoritative and [wins on a mismatch](/specifications/bundle/#nested-bundles).

`role`, `path` and `slot` together are [how a consumer names a part](/specifications/bundle/#part-map), and no two parts
of one bundle may agree on all three.

## Who does what

Most normative rules name one of these three, and which one is the whole meaning of the rule.

- **Producer.** Whatever built the bundle: the emulator, card reader or tool that read a save off something and wrote it
  down. Rules about what a bundle may claim are addressed to a producer.
- **Consumer.** Anything that reads a bundle. A consumer is never assumed to know any card format's internals, which is
  what the normalizing [extension keys](/specifications/extensions/) are for.
- **Writer.** A consumer that puts saves back onto real media. A writer
  [regenerates everything structural](/specifications/memory-cards/#what-a-writer-regenerates), block chains, allocation
  tables, checksums and directory ordering, rather than reading it out of the bundle.

## Payloads and integrity

- **Self-contained.** Every part carries its bytes inline, so the bundle works on its own.
- **Thin.** At least one part names its payload by hash instead of carrying it, so the bundle needs a
  content-addressable store to resolve.
- **Content hash.** The SHA-256 of a bundle's normalized encoding: uncompressed, every payload embedded. A pure function
  of what the bundle says, and a nested save's identity. See
  [Content hash and file hash](/specifications/bundle/#content-hash-and-file-hash).
- **File hash.** The SHA-256 of the bytes on disk. It identifies one exact file, and equals the content hash only for a
  bundle that is self-contained and uncompressed.
- **Normalized.** Of a nested bundle: uncompressed with every payload embedded, which is required so that its file hash
  and content hash are the same value.
- **Bound payload.** A payload tied to the console that wrote it, which a consumer
  [must not present as restorable](/specifications/bundle/#bound-payloads) anywhere else.

## Cards

- **Block.** The unit a card allocates in, fixed per format alongside the length of a `dirent`. See
  [Per-format facts](/specifications/memory-cards/#per-format-facts).
- **Capacity.** The size of a card's data area, which is neither the room left for saves nor the length of a dump. See
  [Capacity](/specifications/memory-cards/#capacity-and-out-of-band-bytes).
- **System area.** Card-level bytes belonging to no save, carried on the `card` map rather than on any part.

## Names

- **Extension key.** A [reverse-DNS](/specifications/common-types/reverse-dns-name/) text key on a header or a part,
  carrying what the core format does not define. See [Extensions](/specifications/universal-saves-format/#extensions).
- **The `x` tree.** [Names](/specifications/common-types/reverse-dns-name/#the-x-tree) for values that belong to no
  single producer, which these specifications define.
- **Reserved name.** A [Vendor Names](/registries/vendors/) entry that belongs to nobody, which is what lets these
  specifications define keys under it and own their schemas.
- **Minting a name.** Coining a [reverse-DNS name](/specifications/common-types/reverse-dns-name/) for a field that is
  the producer's own to name, such as a part's `kind` or a source's `app`. A field holding a
  [slug](/specifications/common-types/slug/) is not minted into: its list grows by a PR against the spec or a registry.
