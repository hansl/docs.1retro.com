---
title: Vendor Names
description: Assigned names in the x tree, for producers with no domain to reverse and for names these specs reserve.
---

A [reverse-DNS name](/specifications/common-types/reverse-dns-name/) normally comes from a domain the producer controls.
Producers that own no domain get a name in the `x` tree instead, and this registry is where those names are assigned.

A name is exactly two labels, `x.<vendor>`. The `<vendor>` label follows the label grammar: lowercase letters, digits
and `-`, starting and ending with a letter or a digit. It should be the name the vendor already goes by, lowercased,
with runs of other characters collapsed to a single `-`.

Assignment is first-come and non-blocking, like every registry here. To claim a name, open a PR adding a row below,
alphabetical by name. The registry hands out the two-label name and nothing else: below it the vendor is free to define
whatever names it wants, with nothing further to register.

A vendor that later acquires a domain may switch to reversing it. The old `x` name stays assigned rather than being
recycled, so old bundles keep meaning what they meant when they were written.

Not every name here belongs to a vendor. These specifications take names in the same tree for extension keys that no
single producer owns, marked **reserved** in the **Kind** column. They are assigned the same way, and they cost the same
thing: the two-label namespace is flat and shared, so a name taken as reserved is a name no vendor can claim later.

| Name        | Kind     | Vendor | Notes                                                                                  |
| ----------- | -------- | ------ | -------------------------------------------------------------------------------------- |
| `x.1sav`    | reserved | none   | Extension keys these specifications define but no producer owns, such as `x.1sav.rtc`. |
| `x.example` | reserved | none   | Reserved for documentation. Never assigned.                                            |
