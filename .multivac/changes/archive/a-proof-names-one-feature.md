---
slug: a-proof-names-one-feature
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-110
  adds:
    - MV-113
  retires: []
claims:
  - id: MV-113
    statement: "An SDD proof names exactly one feature. The artifact language has no wildcard: `<n>` is one run of digits, which cannot cross a separator, and a step proved by two directories is refused by name rather than resolved by sort order."
---

# A proof names one feature

MV-110 narrowed the speckit proof glob from `specs/*<slug>*/` to
`specs/*-<slug>/` and claimed that ended cross-matching. It did not, and the
row now says so: `specs/*-expire/` compiles to `^.*-expire$`, and the `*`
swallows `030-points`, so slug `expire` is still proved by another feature's
directory. The separator ended the SUBSTRING match; the TAIL match survived.

The wildcard is the problem, not its position. `*` is deleted from the artifact
language and replaced by `<n>` — one run of digits, defined in one place —
because the exact directory name is unknowable in advance but its **shape** is
not: spec-kit numbers (`specs/003-user-auth/`), openspec dates
(`2026-08-19-<slug>`). `[0-9]+` cannot cross the `-`, which is exactly what
kills the tail match. A stray star now matches a literal star.

The second half is the silent shadow. `artifactHit` returned the first hit in
sorted `readdir` order, so an older foreign directory could quietly stand in
for the right one. It returns every hit now, and both gate loops — the artifact
gate and the ledger gate — refuse by name when more than one directory proves
one step.
