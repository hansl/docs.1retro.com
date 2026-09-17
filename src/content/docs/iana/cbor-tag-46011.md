---
title: CBOR tag 46011
description: The tag that marks a MD5 digest in the Universal Saves Format, and its registration details.
slug: iana/cbor-tag-46011
---

The permanent reference for one entry in the IANA **CBOR Tags** registry. Not yet filed.

| Field     | Value                                          |
| --------- | ---------------------------------------------- |
| Tag       | 46011                                          |
| Data item | byte string, exactly 16 bytes                  |
| Semantics | MD5 digest                                     |
| Reference | `https://docs.1retro.com/iana/cbor-tag-46011/` |
| Range     | First Come First Served                        |
| Contact   | `spec@1retro.com`                              |

## Why it is not in the COSE block

IANA assigns bare-hash tags at 18300-18811, where the tag for COSE algorithm _N_ is `18556 + N`. COSE registers no
CRC-32 and no MD5, and the range of algorithm numbers that block maps is assigned by Standards Action, so neither will
ever appear there. This tag is taken instead from the First Come First Served range, where registration is a form and no
review.

## Use

MD5 is carried only to match a file against a catalog, never for integrity. Where these specifications need a digest to
be trusted they name SHA-256 directly and offer no choice.

## Specification

[Hash value](/specifications/common-types/hash-value/).
