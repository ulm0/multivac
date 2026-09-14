---
slug: the-record-earns-its-length
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
    - MV-120
  adds: []
  retires: []
claims:
  - id: MV-120
    statement: "The record matches the release: a released version's changelog entry names every row it made law unless an earlier entry already did, a row whose rule a later row changed says so at that row, and a document that states its own version states the one its newest amendment recorded."
---

# The record earns its length

`the-record-matches-the-release` closed with its ritual unmet on the second
line: *the prose earns its length, or it gets shorter*. It did not.

- MV-120 was 821 words. The longest row before it, MV-119, is 512.
- Its two amendment notes were each longer than the rule they amended.
- The 0.10.0 changelog entry was 2546 words. 0.8.0 shipped the same fifteen
  rows' worth of law in 1548.

This change shortens those texts by deletion, and no rule moves:

- MV-120 goes to 396 words. The measured evidence stays in the archived
  change and in `specs/044`.
- The notes go to 52 and 57 words.
- The 0.10.0 entry goes to 1467 words.

An adversarial pass restored every qualifier the cut had taken, including ceilings,
scopes and "on a broken config". Every leg still bites.

MV-121 was reserved by `change new` and is given back, because this change
adds no law.
