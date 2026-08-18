---
slug: the-cli-is-parsed-by-citty
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-02
    - MV-85
  adds:
    - MV-104
  retires: []
claims:
  - id: MV-104
    statement: "Every command declares its arguments ONCE, as data, and that one declaration is what citty parses and what the refusal reads: parsing is a dependency, refusing what was not declared is not."
---

# The CLI is parsed by citty, and still refuses what it does not declare

Ten commands, ten hand-rolled argument loops, and three of them route through
`undeclared()` while the rest repeat its shape. The parsing is not hard and it
is not where the bugs were — MV-85 exists because commands IGNORED what they
did not declare, not because they mis-parsed what they did.

**Decided, not discovered**: the maintainer chose citty. This change carries the
cost that choice has, in the open.

**The third runtime dependency.** MV-02 pins the count at two and the
constitution says the same in its Engineering Constraints. Both are amended
here, dated, and the row keeps doing its job at three: `citty` is zero-dependency
itself (0.2.2, 52 kB unpacked, one package installed), which is the property
MV-02 is really about — transitive weight, not the number on its own.

**What citty does NOT do, measured before writing a line:**

    declared               ACCEPTED  {"dir":".","strict":true}
    unknown flag --nope    ACCEPTED  {}
    extra positional a b c ACCEPTED  {"dir":"a"}
    --repo=x --loud y      ACCEPTED  {"repo":"x"}

It accepts undeclared arguments in silence. That is precisely MV-85's defect —
the row born from `doctor --sttrict` running a non-strict report and exiting 0.
So the refusal is NOT delegated: `undeclared()` runs first, before citty sees
anything, and a command still exits 2 with its own words.

**The win, stated honestly**: one declaration per command instead of two. Today
a command states its surface for the refusal and then parses that same surface
again by hand. After this, the citty `ArgsDef` is the single declaration —
`undeclared()` reads it, citty parses it, and the hand-rolled loops go.

**Not adopted**: citty's `--help`. MV-69 says every command declares its own
usage, the site documents the exact output, and `renderUsage` would rewrite all
of it to say less. The dispatcher keeps answering `--help` before any command
runs.
