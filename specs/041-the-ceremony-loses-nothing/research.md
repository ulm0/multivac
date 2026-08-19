# Phase 0 — Research: The ceremony loses nothing

## Measurement 1 — the orphaned claim

`closeGate` verifies each declared claim against the anchors `collectBrainAnchors`
finds, which includes the anchors inside `.multivac/changes/<slug>.md`.
`archiveChange` then moves that file to `changes/archive/`, and `parse.ts`
never walks the archive. So a claim can be green in the run that archives its
only anchors, and unanchored from the next run onwards — reported as passing by
the ceremony whose job is to stop exactly that.

**Decision**: at close, a declared claim whose anchors ALL come from the change
file being archived is refused, naming the claim.

**Rationale**: the alternative — reading the archive — would make every closed
change's anchors live forever, which is the opposite of archiving. The claim's
anchors belong beside the code they pin.

## Measurement 2 — the overwritten archive

`archiveChange` writes with `writeFile`, unconditionally. MV-110 added a guard
at `change new`, which is the front door — and the parallel-branch path this
project designs for cannot pass through it: two branches, each closing the same
slug, each with its own copy of the change file.

**Decision**: refuse when the destination exists.

## Measurement 3 — the deletable retired row

`lawDeath` filters `state === 'active'`. MV-107 made retirement the sanctioned
way out of `active`, so the retired rows are the record of what a rule used to
be — and removing one is exactly as silent as removing an active one was before
MV-107.

**Decision**: the gate covers `retired` too. `proposed` stays free, because a
reservation given back is what `close --abandon` does.

## Measurement 4 — the silent drop

`normalizeChange` builds a typed object from the parsed frontmatter, so any key
it does not name is gone at the next `saveChange`. MV-110 made the scaffold SAY
so; the drop itself is still silent when it happens.

**Decision**: name the dropped keys where the drop occurs.

**Rationale**: the scaffold's sentence is read once, at creation; the warning is
read when it matters.

## What is deliberately not here

- `close`'s speckit ledger passes when the artifact never existed. MV-110
  names it as a gate-design question and its own change.
- `--abandon` reports rather than refuses over landed repos. MV-110 recorded
  that as a decision, with the reason in the code.

Reversing a decision recorded one change ago needs new evidence, and this
change has none. Both stay named rather than quietly re-opened.
