---
slug: the-ritual-has-a-home
status: open
repos:
  self:
    status: branched
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-27
  retires: []
claims:
  - id: MV-27
    statement: The ritual is the ecosystem's closing ceremony, written by the team
      in .multivac/ritual.md. multivac runs the verifiable half in `change
      close` and prints the rest verbatim as a checklist — never verified, never
      gating; an empty or absent ritual prints nothing. init scaffolds the file
      with one comment saying what belongs there.
---

# The ritual has a home

The word appeared nine times across the README, the design and the site and
defined nothing — borrowed vocabulary that named a real ceremony somewhere
else and named nothing here. Two options: delete the word, or make it a
thing. Deleting loses the idea; the idea is real.

**The ritual is the closing ceremony of an ecosystem change.** Half of it is
mechanical and multivac already runs it: the landing order held, every
declared claim resolves green, no invariant was relaxed in code instead of in
the law. The other half is the team's, and no tool can invent or check it:
who reviews what, who gets told, what ships before what when the reason is
not technical.

So it lives where the team writes it — `.multivac/ritual.md`, beside the config
— and it surfaces where it matters: the tail of `change close`, printed
verbatim as a checklist, after the gate passed and the change was archived.
Printed, not verified. Nothing blocks on it.

Why its own file and not a section of the law: `invariants.md` is a
machine-parsed table — `verify` reads its anchors, `change plan` reads its
state cells. The ritual is prose the tool never parses, only prints. Free-form
lines inside a parsed table is how a parser learns to lie.
