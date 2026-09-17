---
title: CBOR tag 46010
description: The tag that marks a CRC-32 digest in the Universal Saves Format, and its registration details.
slug: iana/cbor-tag-46010
---

The permanent reference for one entry in the IANA **CBOR Tags** registry. Not yet filed.

| Field     | Value                                          |
| --------- | ---------------------------------------------- |
| Tag       | 46010                                          |
| Data item | byte string, exactly 4 bytes                   |
| Semantics | CRC-32/ISO-HDLC digest                         |
| Reference | `https://docs.1retro.com/iana/cbor-tag-46010/` |
| Range     | First Come First Served                        |
| Contact   | `spec@1retro.com`                              |

## Which CRC-32

This tag is for one variant and no other: **CRC-32/ISO-HDLC**, the one zlib, PNG, gzip and every ROM DAT file compute.

| Parameter     | Value                   |
| ------------- | ----------------------- |
| Polynomial    | `0x04C11DB7`, reflected |
| Initial value | `0xFFFFFFFF`            |
| Final XOR     | `0xFFFFFFFF`            |
| Byte order    | big-endian              |

The four bytes read the same left to right as the hex string a DAT file writes. Another CRC-32 variant, Castagnoli's
among them, is a different algorithm and would take a tag of its own rather than share this one.

## Why it is not in the COSE block

IANA assigns bare-hash tags at 18300-18811, where the tag for COSE algorithm _N_ is `18556 + N`. COSE registers no
CRC-32 and no MD5, and the range of algorithm numbers that block maps is assigned by Standards Action, so neither will
ever appear there. This tag is taken instead from the First Come First Served range, where registration is a form and no
review.

## Use

CRC-32 is carried only to match a file against a catalog, never for integrity. Where these specifications need a digest
to be trusted they name SHA-256 directly and offer no choice.

## Specification

[Hash value](/specifications/common-types/hash-value/).
