# Implementation Plan: Every command that sets a repo up equips it

**Branch**: `equip-on-sync-and-lifecycle` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

A new `src/adapters/equip.ts` holds three functions:
- **`toolsToRun(roots, opts)`**: the one predicate for which tool would run in which root, taken from `runScaffold` and `ensureGraphs`.
- **`missingTools(brain, cfg, noSdd)`**: MV-123 lines for those tools whose required binaries are not found.
- **`equip(brain, cfg, noSdd)`**: `runScaffold`, then `ensureGraphs`.

Callers:
- **init** uses `toolsToRun` with a single brain root built from its flags or kept config, replacing `toolsInitWouldRun`, and calls `equip`.
- **`change new`** checks `missingTools` before writing and calls `equip` where it called the pair.
- **`gateSdd`** calls `equip`.
- **`plan` and `apply`** call `equip` again after cloning.
- **`repos sync`** prints its lines, then reports `missingTools` (exit 1 if any), then calls `equip`.

## Constitution Check

- **I.** One row, MV-129. MV-87's leg that counts `await ensureGraphs(brain, cfg)` in `change.ts` moves to `equip`. MV-128's two call legs in init move with it. MV-75 gets a note: `repos sync` runs the scaffold too.
- **II.** The probe decides, unchanged. A tool that cannot run is named by repo.
- **III.** Rows move in this change.
- **IV.** `verify`, `doctor` and `doors` stay vendor-free. MV-87's `absent` leg gains `equip`. `repos sync` is already the network command.
- **V.** No registry entry changes.

## Complexity Tracking

| Considered | Rejected because |
|---|---|
| Refusing in `plan`/`apply` over a missing binary | Their gate already refuses on the missing artifact and names the tool. A second refusal would say the same thing earlier with less context. |
| A `--no-equip` flag on `repos sync` | `managed: false` is the declared opt-out, per decision D2a. A flag would be a second, undeclared one. |
