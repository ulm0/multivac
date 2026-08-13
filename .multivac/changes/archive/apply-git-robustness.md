---
slug: apply-git-robustness
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-13
  retires: []
claims:
  - id: MV-13
    statement: "`change apply` branches from the newer of the local default branch
      and its remote-tracking ref, never a stale remote, and always prints the
      chosen base with its sha and why. It carries the change's own declaration
      file onto the branch, refuses with a named file and an exact command
      instead of a raw git error, and reuses an existing branch."
---

# change apply survives a local-only brain

A brain that has never been pushed is the normal state of a young ecosystem —
multivac's own. Two `change apply` defects fall out of the opposite
assumption (brain is a remote-first, separate repo):

- it branches from `origin/main` whenever that ref exists, even when local
  `main` is ten commits ahead, so the branch starts in the past and prints
  nothing about it;
- it aborts with a raw git "would be overwritten by checkout" on
  `changes/<slug>.md` — the declaration file the lifecycle itself just wrote.

The fix, all in `change.ts`:

- `chooseBase` picks between the local default branch (`main`, else `master`)
  and its remote-tracking ref by ancestry — no network, only what git already
  knows — and returns the reason. Diverged histories keep the local side.
- `apply` always prints `base <ref> <sha> — <why>`.
- the change's own declaration file is carried across the switch: read, drop,
  switch, restore. A switch that still fails names the offending files and the
  exact `git stash push` command instead of surfacing git's stderr.
- an existing branch is switched to and reported, never a failure.

Anchors for MV-13 live on the invariants row; the fixtures are
`test/change/apply-base.test.ts`.
