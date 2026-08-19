# Implementation Plan: The projection survives its environment

**Branch**: `the-projection-survives-its-environment` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Four environment edges: the hooks directory resolved through the wrong dir in a
linked worktree, a declared command interpreted two ways, one mangled file
ending a multi-repo run, and a gutted shim reported as armed. Each is a small,
local change; together they are the difference between "works here" and "works
where it lands".

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM; the shim is POSIX sh

**Primary Dependencies**: none added

**Testing**: `node:test` — `test/init/`, `test/doors/`, `test/doctor/`

**Project Type**: single project

**Constraints**: a foreign hook is still never rewritten; refusals keep their
wording; the shim and its Node mirror stay a declared pair (MV-92)

**Scale/Scope**: `src/hooks/install.ts`, `src/adapters/refresh.ts`,
`src/doors/block.ts`, `src/commands/doors.ts`, `src/commands/init.ts`,
`src/commands/doctor.ts`

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-115 pins each edge |
| II — The tool's own failure mode | Reports success it did not check? | PASS — it ends two (a skipped gate, a gutted shim called armed) |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency | PASS |
| V — An invented integration is a lie | The operator's command stays theirs | PASS — and the first-word probe is stated as a ceiling |
| Engineering: tests ship with behaviour | Pinned | PASS |

## Project Structure

```text
src/hooks/install.ts     # --git-common-dir, in the shim and in gitHooksDir
src/adapters/refresh.ts  # the declared command runs through a shell
src/doors/block.ts       # all markers found; a second pair refused
src/commands/*.ts        # every applyManagedBlock caller keeps going
src/commands/doctor.ts   # our shim is judged by what it runs
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
