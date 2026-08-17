# Implementation Plan: The rows say what they check

**Branch**: `the-rows-say-what-they-check` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

## Summary

Nine claims examined, eight confirmed, one cleared. **Two move the code, five
move the row, two are documents.** No law is added: every row here already says
the right thing or nearly so.

## Technical Context

**Language/Version**: TypeScript, Node ≥ 24. **Dependencies**: none added.
**Testing**: `node:test`; the two code corrections ship with tests.
**Constraints**: no row may be relaxed to describe its drift (Principle III);
no user-visible behaviour changes except where a row already promised it.
**Scale/Scope**: 2 source edits, 7 rows, 2 legs, 2 documents, 2 tests.

## Constitution Check

| Principle | How this plan satisfies it |
| --- | --- |
| **I. A claim nobody checks decays** | This change *is* the principle applied to the law table itself. MV-46's leg matched a comment about the code rather than the code, and was green for years of commits. |
| **II. The tool never claims more than it checked** | Five rows are corrected for claiming more than their mechanism supports. Two of them — MV-21's substring script match, MV-57's mtime-based STALE — keep their claim and gain their **ceiling**, because withdrawing a true-but-imprecise claim would be as wrong as leaving it unqualified. |
| **III. The law changes before the code** | And its converse, which is the load-bearing decision here: where the row is right and the code drifted, the **code** moves. MV-45 and MV-46 are fixed in `src/`, not softened in the table. |
| **IV. Deterministic, offline, small** | No dependency, no network, no measurable cost. `greenfield` names its one file instead of sweeping; `--abandon` reads a set the other path already computes. |
| **V. An invented integration is a lie** | MV-31's dead `unsupported` clause and `CONTRIBUTING.md`'s instruction to write one are both removed — the guide currently sends contributors to author exactly the entry MV-28 forbids. |

**Verdict: no violations.**

## Project Structure

```text
src/commands/change.ts       # greenfield adds its door by name; --abandon reads the anchor set
.multivac/invariants.md      # MV-21, MV-31, MV-45, MV-46, MV-51, MV-56, MV-57
CONTRIBUTING.md              # the unsupported-entry instruction
DESIGN.md                    # ripgrep engine, sha cache
test/change/concurrency.test.ts   # --abandon honours the anchor condition
test/change/lifecycle-polish.test.ts  # greenfield stages its door, not the tree
```

**Structure Decision**: no new files. Every correction lands where the thing it
corrects already lives, and the two tests join the suites that already cover
those commands.

## Complexity Tracking

> No Constitution Check violation. Table intentionally empty.
