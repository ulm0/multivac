---
slug: verify-untracked-and-pending
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-16
    - MV-17
  retires: []
claims:
  - id: MV-16
    statement: When an anchor's glob matches no tracked file but an untracked file on disk would match it, verify says the file exists untracked and names `git add <path>` — never "fix the glob" — and no self-heal rewrites the glob toward somewhere else.
  - id: MV-17
    statement: A claim listed by an open `changes/<slug>.md` is pending, its failing legs report as pending naming the change, never block (not even under --strict), and are never chased by self-heal. Archived changes confer nothing.
---

# Verify tells untracked from vacuous, and pending from broken

Two reporting defects sent the dogfooding session debugging the wrong thing
(DOGFOOD-01, annoying 2 and 3).

**Untracked.** `verify` reads the world through `git ls-files`, so a file that
exists but was never `git add`ed is invisible: the glob "matched no tracked
files", and every message on that path says *fix the glob*. The glob was fine.
Now, whenever a glob survives with zero tracked files, the same globs run over
`git ls-files --others --exclude-standard`; a hit turns the detail into
`file exists but is untracked — git add <path>`, and in `present` mode it also
stops the whole-repo self-heal from rewriting a correct glob toward a stale
copy of the code.

**Pending.** The lifecycle asks you to declare claims *before* writing the code
— and verify then called that a regression: "restore the code or retire the
claim", plus self-heal noise across the repo. A claim id listed in an open
change file is now `pending`: its failing legs print the owning change, do not
count as broken or vacuous, gate nothing, and are skipped by self-heal. Closing
or archiving the change withdraws the grace — the close gate still requires the
claim to be genuinely `ok`.

Anchors for MV-16/MV-17 live on the invariants rows; the fixtures are in
`test/verify/verify.test.ts`.
