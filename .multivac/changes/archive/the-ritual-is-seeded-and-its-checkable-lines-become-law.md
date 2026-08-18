---
slug: the-ritual-is-seeded-and-its-checkable-lines-become-law
status: archived
horizon: later
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-98
  retires: []
claims:
  - id: MV-98
    statement: A fresh brain gets a ritual seeded from what it declared, every line commented out so nothing is asserted on the operator's behalf — and a ritual line that a check could make true belongs in the check, not on the poster.
---

# Seed the ritual from the config, and move its checkable lines into law

Two halves of one thesis about enforcement being real rather than posted.

**Seed the ritual.** `init` writes it as a bare comment, so a fresh brain gets a
blank ceremony. Seed it with candidate lines derived from the declared config,
written COMMENTED OUT — the idiom `init` already uses for detected adapters, so
nothing is asserted on the operator's behalf and the blank page goes away.
Seeded lines are tier-three only: things no tool can check. A declared grapher
contributes none, because it is automated.

**Move the checkable lines into law.** This repo's own ritual holds four lines
and all four are checkable; none is checked. That is not "the ceremony no tool
can verify" — it is debt wearing philosophy's clothes. The fourth is the
sharpest and the one that nearly escaped this very session: a change that adds
user-visible behaviour while touching neither the site nor the changelog.

**The first design was killed in review.** The docs gate read `git diff
<base>...<slug>`, which is empty by construction in the only state `close` can
run in — close refuses until every repo is recorded landed, and landed means the
branch is already an ancestor of the trunk, so the merge base is the branch tip.
It would have refused every correctly landed change and passed only when the
operator's remote was stale. If the gate is kept, diff from the fork point that
`apply` already prints, not from a merge base computed at close.

The review also found that two of the four lines are already partly enforced,
and that one of them is prompted by the merge-request template on disk while the
law anchors only half of it.

## What this change does NOT do, and why

The design's second half proposed a gate refusing a close whose diff touched
neither the site nor the changelog while adding user-visible behaviour. The
review killed it, and the reason is worth keeping:

    close refuses until every declared repo is recorded landed, and landed
    means the change branch is already an ancestor of the trunk — so the merge
    base IS the branch tip, and `git diff <base>...<slug>` is empty by
    construction in the only state close can run in. It would have refused
    every correctly landed change, and passed only when the operator's remote
    was stale.

There is a way — persist the fork point `apply` already prints, and diff from
that — but it is a different mechanism with its own failure modes, and it does
not belong bolted onto a change about seeding a template. Recorded, not
shipped.
