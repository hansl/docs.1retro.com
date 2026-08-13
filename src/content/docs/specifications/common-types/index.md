---
title: Common Types
description:
  Named types the specifications share, with their grammar, their comparison rules, and the namespaces they live in.
sidebar:
  label: Overview
  order: 0
---

The specifications here reuse a few small types that are more than the primitive they are built on. A reverse-DNS name
is a text string, but it also carries a grammar, a comparison rule and a tree it belongs to. Writing each one down once
keeps two specs from defining the same thing differently, and gives an implementer a single place to look when a field
says it holds one.

Every page here is **normative**. When a specification says a field holds one of these types, every rule on that type's
page applies to that field.

| Type                                                               | Carried as         | Used for                                                                                                        |
| ------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| [Reverse-DNS name](/specifications/common-types/reverse-dns-name/) | text string        | Extension keys, catalog resolver names, the identity of a producing app. Anything unique that nobody hands out. |
| [Hash value](/specifications/common-types/hash-value/)             | tagged byte string | Identifying a ROM or a file by its content rather than by its name.                                             |

A type lands here once a second specification needs it. Until then it belongs to the spec that uses it, written out in
place.
