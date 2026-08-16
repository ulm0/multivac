---
slug: the-ledger-and-the-link
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-56
  adds:
    - MV-63
    - MV-64
    - MV-65
    - MV-66
    - MV-67
  retires: []
claims:
  - id: MV-63
    statement: "A step whose tool keeps a ledger of its own work is gated on that ledger, so an escape hatch cannot finish a step over the tool's own objection."
  - id: MV-64
    statement: "Archiving a change repoints every law row that cited it, so no source link in the table resolves to a missing file."
  - id: MV-65
    statement: "A gated artifact that is empty, or byte-identical to the template it was copied from, is refused as if it were missing."
  - id: MV-66
    statement: "A gate whose validator binary cannot be found refuses and names it, instead of passing on artifact existence alone."
  - id: MV-67
    statement: "close refuses what plan and apply refuse, and --abandon gives back the id of a change that landed nothing."
---

# The ledger and the link

Two ways the tool was accepting an answer it had not earned.

## The escape hatch

Both SDD tools ship a way to complete a step over their own objection.
`openspec archive --yes` prints `Warning: 4 incomplete task(s) found.
Continuing due to --yes flag.` and archives anyway; spec-kit's implement can
simply stop early with boxes still open. multivac gated on the artifact — the
archived directory, the tasks file — and in both cases the artifact is there.
Green light, unfinished work.

The fix is not to reimplement either tool's rules. It is to read the book the
tool already keeps: `unfinished` names a ledger path, an ERE for a line meaning
"not done", and the lifecycle point that refuses while such a line exists. For
opsx that is the archived `tasks.md`, read at close. For spec-kit it is
`specs/*<slug>*/tasks.md`, also at close.

`unfinished` carries its **own** gate point rather than reusing the step's, and
that is the whole design. spec-kit's implement stays `ungateable` — whether it
RAN leaves no trace and never will — while "does its own task list still have
open boxes" is a fact on disk. Two different questions about one step; the
honest answer differs for each.

This still does not prove the work happened. `- [x]` is a character an agent
types about itself. It proves the tool's own book does not say UNDONE, which is
strictly more than the artifact proved before.

## The link

`archiveChange` moved a change file into `changes/archive/` and left every law
row that cited it pointing at a path that no longer resolved. Fifteen links
across eight changes were dead, and the table disagreed with its own schema:
rows written after an archive already used `changes/archive/<slug>.md`, rows
written while the change was open pointed at nothing.

For a tool whose whole claim is that a citation can be checked, a citation that
resolves to a missing file is the rot it exists to prevent. `close` now
repoints them, matching only `(changes/<slug>.md)` as a link target so prose
naming the change is left alone, and skipping links already archived so a
re-run changes nothing.

MV-56 is touched, not weakened. It said a step with no artifact is never gated,
and that stays true of the STEP. What is new is that a ledger beside it can be
read without pretending the step itself was proven.

## What the adversarial pass changed

Three fixes went in and an independent pass tried to refute each. Two were
holed, and one was worse than the defect it closed — recorded here because the
pattern matters more than the bugs.

**The plan gate was pinned to an unverified assertion.** It refused a plan.md
still carrying `# Implementation Plan: [FEATURE]`, on the stated grounds that
"the agent replaces that heading with the real feature name first thing". That
was never checked. Neither spec-kit's plan skill nor the template's two ACTION
REQUIRED markers mention the title, so a complete, real plan keeps it — the
gate would have refused honest work permanently, with no escape but turning
the SDD off. Replaced by whole-file equality against the template the tool
actually copies from, which is a fact rather than a belief: `setup-plan.sh`
runs `resolve_template_content ... > "$IMPL_PLAN"`, verbatim, no substitution.

**Counting is not checking.** The new close gate tested that `repos` was
non-empty, so one invented repo name walked through a door `plan` and `apply`
both hold shut.

**A fix can close the only exit.** Gating close on repos removed the single
call site of `releaseUnused`, so an abandoned change — and `change new`
reserves an id before anything is declared — leaked its id forever, or forced
a false `status: landed`. `--abandon` is the door that had to exist alongside.

**And a guard nothing would miss is not a guard.** Reverting the
missing-validator refusal left all 288 tests green and `verify --strict` at
0 broken. In a repo whose thesis is that a claim nobody checks decays, an
unpinned behaviour is the same hole one level up. MV-66 now has two.
