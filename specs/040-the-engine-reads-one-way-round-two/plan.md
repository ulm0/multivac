# Implementation Plan: The engine reads one way, round two

**Branch**: `the-engine-reads-one-way-round-two` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Close MV-109's two stated ceilings. Self-heal gains a fence derived from the
leg — a candidate must share the include's own trailing extension — and says
what it refused when the fences empty the list. Both file enumerators filter
symlinks and gitlinks by their git mode, so the two readers stop disagreeing
about a path neither should have been reading.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Testing**: `node:test` — `test/anchor/`, `test/verify/`, `test/lib/`

**Project Type**: single project

**Constraints**: one entry per path during a merge (MV-71); this brain's own
law stays green; no dependency

**Scale/Scope**: `src/anchor/evaluate.ts`, `src/lib/git.ts`, and the four
places the `moved` rule is written down

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-116 pins both fences and both filters |
| II — The tool's own failure mode | Reports success it did not check? | PASS — a fenced non-heal now says what it refused |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency | PASS |
| Engineering: tests ship with behaviour | Pinned | PASS |

## Project Structure

```text
src/anchor/evaluate.ts   # the kind fence, and the refusal report
src/lib/git.ts           # lsFiles and lsTree read the mode
site/, DESIGN.md, skills/ # the `moved` rule, written the same way everywhere
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
