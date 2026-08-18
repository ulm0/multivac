# Implementation Plan: The graph is part of the repository

**Branch**: `the-graph-is-part-of-the-repository` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

MV-90 asks whether a declared grapher's artifact EXISTS. A graph that exists
only in one working tree answers that and helps nobody else: the next clone has
none, while the door there tells every agent to ask it. This adds the second
half — the artifact is tracked in the repository it describes — as a refusal,
not as an action, because MV-50 keeps multivac out of anybody's index.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: none. The check is one read-only git question per root.
**Testing**: `node:test`. `pnpm test` builds then runs `dist-test`.
**Target Platform**: CLI, macOS and Linux.
**Project Type**: single project.
**Performance Goals**: one `git ls-files` per declared, present root at close.
**Constraints**: `src/adapters/refresh.ts` must stay free of git (MV-50's absent leg).
**Scale/Scope**: one module, one call site, one doctor line, one row plus one amendment.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-103 anchors the gate, its call site and its tests. |
| II — The tool never claims more than it checked | PASS | The gate reports what git says, and says which of the two fixes applies. |
| III — The law changes before the code | PASS | MV-103 filed proposed; MV-90 amended in place, dated. |
| IV — Deterministic, offline, small | PASS | `git ls-files` and `check-ignore`, both local, both already used elsewhere. |
| V — An invented integration is a lie | PASS | The path asked about is the adapter's declared artifact; an unverified adapter stays out of scope. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/adapters/tracked.ts      # NEW — the tracked question, where git is allowed
src/commands/change.ts       # the gate, beside the graph gate it extends
src/commands/doctor.ts       # the same state, reported
src/lib/git.ts               # `isTracked`, beside `ignoredPaths`
test/change/grapher-tracked.test.ts   # NEW
```

**Structure Decision**: a separate module rather than a branch inside
`refresh.ts`, because MV-50's `absent` leg over that file is the reason the
refresher can never touch the index. The layout states the boundary.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [data-model.md](./data-model.md) — per-root verdicts.
- [contracts/cli-output.md](./contracts/cli-output.md) — the refusal and the doctor lines.
- [quickstart.md](./quickstart.md) — four scenarios.
