---
title: Registries
description: Non-normative lists of known values for the open vocabularies in the specifications.
sidebar:
  label: Overview
  order: 0
---

The specifications keep several vocabularies open on purpose: a bundle can name a system, an app or an extension key the
spec has never heard of, and decoders round-trip it unchanged. These pages list the known values, so producers reuse
existing names instead of inventing overlapping ones.

Every registry here is **non-normative**: the meaning of a value belongs to the spec or the producer that minted it, not
to the list. Registration is first-come and non-blocking; to add an entry, open a PR against the page.

| Registry                             | Contents                                           |
| ------------------------------------ | -------------------------------------------------- |
| [System Slugs](/registries/systems/) | The canonical slug for every known gaming system.  |
| [Emulator Cores](/registries/cores/) | Known emulator cores and the systems they run.     |
| [Save Roles](/registries/roles/)     | The socket a save came out of, per system.         |
| [Vendor Names](/registries/vendors/) | Assigned `x.*` names for producers with no domain. |

More lists land here as the specs need them; producers that are not cores (cartridge readers, services) are next in
line.
