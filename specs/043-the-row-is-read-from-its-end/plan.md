# Implementation Plan: The row is read from its end

**Branch**: `the-row-is-read-from-its-end` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Three parsers read the law table by counting cells from the left. The body is
prose that quotes shell, so a `|` in it moves every column after it, and the
state lands somewhere inside the prose. Count the trailing cells from the end
instead, and delete the two duplicate parsers in favour of the one that the
surviving docstring already claims exists.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Testing**: `node:test` — `test/anchor/parse.test.ts`, `test/verify/`,
`test/change/`, `test/doors/`

**Project Type**: single project

**Constraints**: no new file under `src/`; one parser, not three; the id keeps
being the first cell

**Scale/Scope**: `src/anchor/parse.ts`, `src/change/reserve.ts`,
`src/doors/brain.ts`, plus the law row

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-119 pins the right-counting read and the deletion of the duplicates |
| II — The tool's own failure mode | Reports success it did not check? | PASS — this is that defect, in MV-81's own gate, and it closes it |
| III — Law moves before code | Row first | PASS — MV-119 reserved at `change new` |
| IV — Deterministic, offline, small | No dependency, net deletion | PASS — two parsers deleted, one kept |
| Engineering: tests ship with behaviour | Pinned on the input that separates the readings | PASS |

## Project Structure

```text
src/anchor/parse.ts     # the one parser: id from the front, the rest from the end
src/change/reserve.ts   # lawRows deleted — it read four shifted cells
src/doors/brain.ts      # countActiveInvariants reads the shared parser
.multivac/invariants.md # MV-119
```

**Structure Decision**: single project. No file added under `src/`; two
functions removed.

## Complexity Tracking

No Constitution Check violation.
