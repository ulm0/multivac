# Implementation Plan: init equips the brain it scaffolds

**Branch**: `equip-brain-at-init` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

init calls the two self-limiting functions the lifecycle already uses:
`runScaffold` for the SDD and `ensureGraphs` for the graph. Before its first
write, it asks MV-123's lookup for the binaries of whatever those calls would
run in the brain, and refuses with exit 1 if one is missing. Step zero prints a
pathspec computed from `git status` before and after the run, minus vendor-local
paths, in place of `git add -A`.

## Technical Context

TypeScript, Node ≥ 24, pnpm. No new dependency. Tests are `node --test` with
stub `specify` and `graphify` on a built `PATH`; host `PATH` and `HOME` are never
read.

## Constitution Check

- **I.** One row, MV-128, anchored to the call sites, the pre-write lookup and
  the pathspec. MV-51, MV-75 and MV-91 carry amendment notes, and the copy in
  `src/adapters/sdd.ts`, `src/adapters/registry.ts` and the site moves with them
  (MV-111). Site pages name no ID (MV-126).
- **II.** The probe decides, not the exit code. That is the existing
  `runScaffold` and `ensureGraphs` behaviour, reused unchanged. A tool that does
  not run is said to not run.
- **III.** MV-51's "the scaffold still runs only from `change`" is amended in
  the same change that moves the behaviour.
- **IV.** `verify`, `doctor` and `doors` still run no vendor. The MV-75 `absent`
  leg over those three stays. init was never bound by that rule: it already runs
  `git init` and `doors`.
- **V.** No registry entry changes. The commands run are the recorded ones.

## Design

1. **`toolsInitWouldRun(dir, cfg)`**, in `src/commands/init.ts`. It returns the
   adapter specs whose recorded init or build would run in the brain:
   - the SDD when `sddAuto` is on, a `scaffold` is recorded and `initState` is
     `missing`;
   - the grapher when `grapherSpec` is known and `initState` is not `installed`.

   Resolution uses `adapterFor(cfg, 'brain', kind)`. On a first run the config
   does not exist yet, so a config shape is built from the flags.
2. **Refusal.** After the MV-91 clash check and before `ensureVisibleToGit`,
   init refuses with exit 1 for each spec where `missingRequired(spec, dir)` is
   non-empty, printing `binaryMissing`.
3. **Equip.** After `doorsCommand.run`, init calls `runScaffold(dir, cfg, false)`
   and then `ensureGraphs(dir, cfg)`. The door and hooks are already written, so
   a tool that rewrites `.claude/settings.json` is merged over by the next
   `doors`. The graph is built last, so it sees the files init wrote.
4. **Step zero.** `git status --porcelain=v1 -z --untracked-files=all` runs
   before the first write and after the last. Pathspec = paths new in the
   second set, plus paths in both whose `git hash-object` changed, minus paths
   matching a resolved adapter's `local` globs unless they equal a literal
   `shared` path. If every untracked file under a top-level directory is in the
   set, the pathspec shows that directory instead of its files.

## Complexity Tracking

| Considered | Rejected because |
|---|---|
| A new `equip.ts` module | The two functions it would wrap already exist and never throw. A module adds a name, not a behaviour. Change 7 can extract one if sync needs a third caller shape. |
| Writing `.gitignore` lines for vendor-local files | Change 10 owns the shared/local commit contract. Leaving local paths out of step zero is enough to stop them being committed. |
