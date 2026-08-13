---
slug: doctor-untracked-build-files
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-21
  retires: []
claims:
  - id: MV-21
    statement: doctor lists untracked, non-ignored files that look build-critical — a root config file, a path a package.json script names, or a path an anchor's include glob covers — as a warning naming each file and `git add or ignore`; it never gates and doctor's exit code is unchanged.
---

# doctor warns about untracked build-critical files

This repo built locally and failed on a fresh clone: a config file the build
reads had never been `git add`ed. Nothing verified "this repo builds from a
clone", because everything that reads the tree — verify included — sees the
world through `git ls-files`, where an unadded file simply does not exist.

`doctor` gets the diagnosis. It lists `git ls-files --others
--exclude-standard` per declared repo and flags the ones that look
build-critical:

- a config file at the repo root (`tsconfig*`, `package*`, `*.config.*`,
  `.*rc`),
- a path named by a `package.json` script,
- a path covered by an anchor's include glob (that anchor is law about to
  evaluate against a file git cannot see).

Warning only. doctor diagnoses, it never gates: exit stays 0.

The anchors declared with this change now live on MV-21's row in
`invariants.md`, where the law keeps them after this change is archived.
