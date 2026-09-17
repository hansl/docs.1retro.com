---
title: IANA Registrations
description: The IANA registrations these specifications hold or intend to file, each with a permanent page of its own.
sidebar:
  label: Overview
  order: 0
---

IANA registrations outlive the documents that explain them. Each page here is the permanent reference for one
registration: it repeats what the form needs and nothing else, so it can be cited once and stay correct while the
specifications around it are reorganised.

These pages deliberately duplicate the specifications. Where the two disagree, the specification is normative and this
page is stale; report it.

| Registration                                              | Registry    | Status        |
| --------------------------------------------------------- | ----------- | ------------- |
| [`application/vnd.1saves+cbor`](/iana/media-type-1saves/) | Media Types | Not yet filed |
| [CBOR tag 827539798](/iana/cbor-tag-827539798/)           | CBOR Tags   | Not yet filed |
| [CBOR tag 46010](/iana/cbor-tag-46010/)                   | CBOR Tags   | Not yet filed |
| [CBOR tag 46011](/iana/cbor-tag-46011/)                   | CBOR Tags   | Not yet filed |

Tags 18540 and 18542 need no registration and never will. They fall in the bare-hash block IANA already assigns at
18300-18811, where the tag for COSE algorithm _N_ is `18556 + N`, so a generic CBOR tool decodes them without knowing
anything about these specifications.

Until a form is filed, a number here is held by nothing but this page, and another producer may claim it first.
