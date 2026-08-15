---
slug: sync-fetches-the-channel
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-53
  adds:
    - MV-54
  retires: []
claims:
  - id: MV-54
    statement: "`repos sync` fetches every declared repo already on disk, and a brain-scoped `verify` names how old each channel ref is and whether the brain's own tree is behind its own channel."
---

# The channel is only as true as the last fetch

MV-53 moved the brain's verdict onto each sibling's **channel ref**. That was
right, and it killed the wolf: a teammate parked on a WIP branch no longer
reddens the ecosystem's law.

It also moved the whole ecosystem's verdict onto a **local remote-tracking
ref** — and left nothing that refreshes one.

- `repos sync`, which every staleness line in `verify` names as the fix, only
  ever **cloned the missing**. A repo already on disk got `present at ../api`
  and nothing else. `verify`'s own text promised otherwise —
  "`multivac repos sync` fetches it" — and DESIGN said "fetching happens only
  in explicit operations (`repos sync`, …)". Both were false.
- The `read` line said `origin/main @ 1a2b3c4 — the channel, as published`
  with no hint that the snapshot could be days old. A fix already merged to
  `main` therefore reads as a red, and the operator concludes the gate is
  broken — the exact conclusion MV-53 exists to prevent, one layer up.
- The brain's own repo is read as a **working tree** on purpose: it is the
  commit the run gates. But that makes it the one repo whose staleness MV-53
  could not catch, and an out-of-date law table judging a current ecosystem
  looks identical to a red ecosystem. Every sibling already gets an "OFF
  channel" sentence; the brain got silence.

Found by running the real six-repo ecosystem: `verify` was red on a claim
whose brain-side fix was already two commits up its own `origin/main`. Nothing
in the report said so.

## What changes

- `repos sync` fetches every present repo as well as cloning the missing ones.
  A failed **clone** still gates (exit 1); a failed **fetch** reports and never
  gates — offline, or a remote-less repo, still leaves a usable if older ref,
  and the `read` line now carries its age.
- Every channel `read` line names the ref's age: `(last fetch 2h ago)` or
  `(never fetched here)`.
- A brain==code tree behind its own channel says so on its `read` line, and
  `doctor`'s `branches` line names it with the pull that fixes it.

Nothing gains a network call it did not have: `verify`, `doctor` and `doors`
stay offline (MV-01). The freshness is bought where it was always bought — in
the one explicit command that already touches the network.
