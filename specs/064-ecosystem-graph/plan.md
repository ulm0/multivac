# Implementation Plan: ecosystem-graph

## Summary
- **Renderer.** `src/doors/ecosystem.ts` `renderEcosystem(brain, cfg)`, taken from the prototype, with a byte comparison for sorting. `writeEcosystem(brain, cfg)` writes when the content differs.
- **`config.ts`.** Adds `ECOSYSTEM_PATH`.
- **`doors.ts`.** Writes the file beside flow.md.
- **`change.ts`.** `commitBookkeeping` re-renders and adds the path when it commits `.multivac/` paths in a brain. Close adds it to the recipe, and `commitGraph` commits it in a brain worktree.
- **`verify.ts`.** A drift line, never gating.
- **Doors.** `brain.ts` and `consumer.ts` get the ecosystem line.
- **DESIGN.** Amended.

## Constitution Check
- **I.** New row MV-139.
- **II.** Plain JSON, no dependency.
- **IV.** Offline and deterministic.
