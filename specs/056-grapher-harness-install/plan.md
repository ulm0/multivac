# Implementation Plan: grapher-harness-install

## Summary
- The graphify entry in `src/adapters/registry.ts` gains `harness: { run, platforms, hookFiles, ignore }`.
- `installHarness(brain, cfg)` in `src/adapters/refresh.ts`:
  - For each writable scope and each declared door with a platform whose probe is missing, it runs the install through `sh`, with the entry's `env` and the root's `node_modules/.bin`.
  - It then rewrites absolute graphify paths in `hookFiles`.
  - Before the first install it appends the harness `ignore` lines.
- `equip` calls it after `ensureGraphs`.
- `doctor` appends missing harness installs to the grapher line.

## Constitution Check
- **I.** One row, MV-131, with legs. MV-129's `equip` gains a third call; its leg pins the call site, so it is unaffected.
- **II.** A gap is named per door, and each rewrite is reported.
- **IV.** `doctor` reads probe files only.
- **V.** Platforms, probes and hook files are measured on graphify 0.9.29. codegraph's install is not measured and stays unrecorded.

## Complexity Tracking
| Considered | Rejected because |
|---|---|
| A per-platform install function | Adapters are data. One template and a table cover every platform. |
| Leaving the absolute path and warning | The path breaks the hook on every other machine that clones the repo. The rewrite is one regex over files multivac already merges. |
