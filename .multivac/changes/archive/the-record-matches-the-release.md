---
slug: the-record-matches-the-release
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-14
    - MV-111
  adds:
    - MV-120
  retires: []
claims:
  - id: MV-120
    statement: "The record matches the release: a released version's changelog entry names every row that release made law unless an earlier entry already did, a row whose rule a later row changed says so at that row and its copies move with it, and a document that states its own version states the one its newest amendment recorded."
---

# The record matches the release

Nothing in the code is wrong this time. The records about it are — each one a
release or a row behind what happened, and every gate green over all of them.

- **0.10.0 shipped fifteen rows and its entry names none of them.** MV-105 …
  MV-119 reached `active` in one commit on 2026-08-19. The release followed on
  2026-08-24, and its entry, written in the commit the tag names, carries one
  bullet — the door's graphify wording, MV-50. Not one of the fifteen IDs
  appears anywhere in `CHANGELOG.md`. MV-78's test passed, because it asks
  whether the version has an entry and never what the entry names. Measured
  over every entry after the 0.1.0 baseline, there is one older gap: MV-72,
  made law in 0.2.0 and never named; this change names it in that entry.
- **MV-14 still states the runner order MV-92 inverted.** PATH first, the
  repository's build last — for three releases. The change that inverted it
  declared `touches: []`, and MV-14's legs pin two of the three rungs, never
  the order, so the false sentence stayed green. It was copied into
  `DESIGN.md`, the install guide twice and the hooks reference, whose own
  MV-92 section states the right order on the same page.
- **MV-111 records as unfixed a defect MV-112 closed the same day.** MV-112's
  change also declared `touches: []`, and one commit enacted both rows.
- **The constitution's footer says 2.0.0 under a report that records 2.0.1.**
  The change that prepended that report was the one that wrote MV-111.

The two row notes use the amendment shape the table already has. The retired
sentences this change removes get MV-111's device — an `absent` leg on each retired phrase — and
the footer moves to 2.0.2 under a report of its own, with a tombstone on the
stale values.

Out of scope, deliberately: a test that holds every future release to the rows
it made law. The list lives in git between two tags, and a test reading the
table alone would refuse the commit that enacts a row before its release has
an entry — which decides WHEN an entry is written, a policy rather than a
correction. MV-120 names that ceiling instead of implying it is shut.
