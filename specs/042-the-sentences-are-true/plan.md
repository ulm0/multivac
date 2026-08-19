# Implementation Plan: The sentences are true

**Branch**: `the-sentences-are-true` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Five sentences and the code disagree. In four of them the sentence is the
design and the code is the defect, so the code moves: three commands honour the
documented exit contract, and `doctor` gates on the law validity its own help
promises. The fifth is a guide that would lose an operator's work, and two rows
that describe a shape the code left behind.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Testing**: `node:test` — `test/cli/`, `test/doctor/`, `test/seed/`,
`test/repos/`

**Project Type**: single project

**Constraints**: `doors` and `doctor` keep exit 1 on an unloadable config, as
the contract says; no dependency

**Scale/Scope**: `src/commands/{seed,repos,roadmap,doctor}.ts`, the guide, and
two law rows plus one new one

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-118 pins the exit contract and the doctor gate |
| II — The tool's own failure mode | Reports success it did not check? | PASS — `roadmap` reporting exit 0 over a sync it never did is exactly that |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency | PASS — one catch per command, one discarded value kept |
| Engineering: tests ship with behaviour | Pinned | PASS |

## Project Structure

```text
src/commands/seed.ts, repos.ts, roadmap.ts   # the documented exit
src/commands/doctor.ts                        # its own promise, kept
site/content/docs/guide/session-zero.md       # output outside the block
.multivac/invariants.md                       # MV-85 amended; MV-118 added
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
