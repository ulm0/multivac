# Implementation Plan: graph-owned-and-committed

## Summary
- `graphScopes(brain, cfg, only?)`: the brain always; a repo only when `only` is absent or names it.
- `ensureGraphs`, `installHarness`, `graphGate`, `graphTrackedGate` and `equip` take `only` and pass it on. `gateSdd` takes the change's keys.
- `change.ts`:
  - `commitGraph(cfg, key, dir, slug)` refreshes and commits on the branch, and is called from the `land` report for each ready repo.
  - `cmdClose` loads the change before the gates, scopes them, refreshes before printing the archive commit, prints sibling commits, and restores a graph-only dirty worktree before removing it.
- multivac: untrack the derived graphify outputs.

## Constitution Check
- **I.** New row MV-134, with notes on MV-50, MV-87, MV-90 and MV-103.
- **II.** Refusals name the file and the rule.
- **IV.** git and the declared grapher only.
- **V.** The artifact path comes from the registry.
