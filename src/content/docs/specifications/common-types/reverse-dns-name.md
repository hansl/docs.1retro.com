---
title: Reverse-DNS name
description:
  A globally unique name a producer mints for itself by reversing a domain it controls, and the reserved tree for
  producers that own no domain.
sidebar:
  order: 1
---

A name a producer mints for itself, with nobody to ask, by reversing a domain it controls. `mgba.io` becomes `io.mgba`,
and every name under `io.mgba` belongs to whoever holds the domain. The specifications use this wherever a value has to
be globally unique and the spec cannot enumerate the possibilities: extension keys, catalog resolver names, the identity
of a producing app, and the open vocabularies a producer can add to, such as a part's kind or role.

A special vendor label `x` is used for names that must be referred to for which there is no DNS associated.

This page is **normative**. When a specification says a field holds a reverse-DNS name, every rule here applies to that
field.

## Grammar

A reverse-DNS name is two or more labels joined by `.`, respecting the following rules:

- Lowercase ASCII only. A name carrying an uppercase letter is malformed, and consumers do not case-fold to rescue it.
- The first label is the reversed top-level domain, so it is letters only, and two or more of them. The single-letter
  label `x` is the one exception, reserved below.
- Every other label holds letters, digits and `-`, starts and ends with a letter or a digit, and runs at most 63
  characters.
- `-` is the only punctuation allowed inside a label. `_` is not, so that reversing any name yields something that is
  still a syntactically valid domain.
- The whole name runs at most 255 characters.
- A domain with non-ASCII labels is written in its punycode form, so `münchen.de` reverses to `de.xn--mnchen-3ya`.

Nothing checks that the domain exists, resolves, or still belongs to the producer that minted the name. The convention
buys uniqueness, not authentication.

The following regular expression can validate a name:

```text
(x|[a-z]{2,63})(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+
```

## Comparison and the tree

Two names are equal when their bytes are equal.

A name is a path rather than an opaque string. `io.mgba.rtc` sits under `io.mgba`, which sits under `io`. Whoever holds
a name holds every name below it and needs no further registration to start using them, which is the whole point of
minting names this way.

Prefix matching happens on label boundaries. `io.mgba` matches `io.mgba` and `io.mgba.rtc`, and does not match
`io.mgbahax`. A consumer asking "is this name under `X`" MUST compare label by label; a plain string prefix test is
wrong and will match names belonging to somebody else.

A name can be in use and be a parent of other names at once. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) is
an extension key carrying a clock reading, and [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) is a
different key under it, so matching the parent as a prefix collects both. Sitting under a name says who holds it and
nothing about what it means. A consumer that groups by prefix MUST NOT treat what it collected as one kind of thing.

## The `x` tree

Plenty of producers don't own a domain. An emulator core is often a repository and nothing more, and asking it to buy a
domain to name itself is absurd.

The top-level label `x` is reserved by these specifications for those producers. A single-letter top-level domain cannot
exist: ICANN requires an applied-for ASCII string to run three characters or more, since the two-character space is
reserved for country codes. So a name in this tree cannot collide with a reversed real one, and no future round of
top-level domains can make it start colliding.

A name in the `x` tree is exactly two labels, `x.<vendor>`, and the `<vendor>` label is assigned in the
[Vendor Names registry](/registries/vendors/). Below its own name a vendor is on its own: whoever holds `x.fceumm` holds
`x.fceumm.anything`, with nothing further to register.

A producer that controls a domain SHOULD reverse that domain instead of asking for an `x` name. The tree is there for
the ones with nothing to reverse.

`x.example` is reserved for documentation and is never assigned to anyone.

## Examples

| Name               | Held by                       | Used as                                                       |
| ------------------ | ----------------------------- | ------------------------------------------------------------- |
| `io.mgba`          | mGBA, from `mgba.io`          | producer identity                                             |
| `com.1retro.forge` | 1retro, from `1retro.com`     | [extension key](/specifications/extensions/com.1retro.forge/) |
| `org.hasheous`     | Hasheous, from `hasheous.org` | catalog resolver name                                         |
| `x.example`        | nobody, reserved for docs     | producer identity                                             |
