---
title: Hash value
description:
  A raw digest carried as a CBOR byte string under a tag naming the algorithm, with the four algorithms these
  specifications use.
sidebar:
  order: 2
---

A digest of some bytes, carried as the raw digest in a CBOR byte string, wrapped in a CBOR tag that names the algorithm
that produced it. The value is self-describing: nothing around it has to say which algorithm this is, and no hex text is
involved. The specifications use this wherever a file or a ROM is identified by content rather than by name.

This page is **normative**. When a specification says a field holds a hash value, every rule here applies to that field.

## Algorithms

| Tag     | Algorithm | Digest bytes | Notes                                                                              |
| ------- | --------- | ------------ | ---------------------------------------------------------------------------------- |
| `18540` | `sha256`  | 32           | Carried by newer No-Intro sets. The strongest of the four, and the one to prefer.  |
| `18542` | `sha1`    | 20           | The most common ROM identifier in public databases: No-Intro, Redump, MAME, TOSEC. |
| `46010` | `crc32`   | 4            | The oldest and weakest, and still in every DAT file ever published.                |
| `46011` | `md5`     | 16           | Carried by No-Intro, Redump and TOSEC alongside CRC-32 and SHA-1.                  |

That is the whole list, and it is short on purpose. These four are what retro databases actually key on. Adding BLAKE3
or xxHash would cost every implementer a dependency and buy nobody a lookup they can perform today.

`crc32` is CRC-32 as used by zlib, PNG and every DAT file (ISO-HDLC: polynomial `0x04C11DB7` reflected, initial value
`0xFFFFFFFF`, final XOR `0xFFFFFFFF`). The four bytes are the check value in big-endian order, so they read the same
left to right as the hex string a DAT file writes.

`crc32`, `md5` and `sha1` are all broken as cryptography and none of them are used here for integrity. They identify a
known file by matching it against a catalog, which is a job a weak hash still does. Where these specifications need a
digest to be trusted, they name SHA-256 directly and do not offer a choice.

## Where the tags come from

Tags 18540 and 18542 are not ours. IANA registers a block of bare-hash tags at 18300-18811, where the tag for COSE
algorithm _N_ is `18556 + N`
([draft-bormann-cbor-notable-tags, section 3.1.1](https://datatracker.ietf.org/doc/draft-bormann-cbor-notable-tags/)).
SHA-256 is COSE algorithm -16 and SHA-1 is -14, which gives 18540 and 18542. A generic CBOR tool that knows that block
decodes those two entries without knowing anything about these specifications.

COSE registers no CRC-32 and no MD5, and it never will: the range of COSE algorithm numbers that block maps is assigned
by Standards Action, which means an RFC. So 46010 and 46011 are taken by these specifications from the IANA
First-Come-First-Served range, where a registration is a form and no review.

Neither is registered there yet. Until the forms are filed, the two numbers are held by nothing but this page: a generic
CBOR tool has no way to learn what they mean, and nothing stops another producer claiming them first.

Mixing the two origins is deliberate. Minting private tags for SHA-1 and SHA-256 when standard ones exist would buy
uniformity in this table at the cost of recognition by every tool that already reads the standard block.

## Rules

- A consumer MUST reject a hash value whose tag is not in the table above, and MUST reject one whose digest length does
  not match the algorithm. Both are malformed, and neither is recoverable by guessing.
- A consumer that does not implement an algorithm in the table still round-trips the value unchanged, and skips it when
  matching.
- Where a specification holds several hash values together, it holds at most one per algorithm, sorted ascending by tag
  number. Ascending tag number puts the two standard tags before the two local ones, which is arbitrary but stable, and
  a deterministic encoding needs an order more than it needs a meaningful one.
- Two hash values are equal when their tags are equal and their digest bytes are equal. Values with different tags never
  compare, even when both identify the same file.

## Adding an algorithm

Open a PR against this page. An algorithm that has a COSE number in -256..255 already has a bare-hash tag and takes it;
anything else needs a new First-Come-First-Served registration, which is a form and no review. An algorithm already
listed here never changes tag, even if it later gains a standard one.
