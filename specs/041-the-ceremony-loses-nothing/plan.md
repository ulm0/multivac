# Implementation Plan: The ceremony loses nothing

**Branch**: `the-ceremony-loses-nothing` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Four silent losses in and around `change close`: a claim orphaned by the
archive that just verified it, an archive overwritten, a retired row deleted,
and a frontmatter key dropped without a word. Each is a guard where there was
none.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Testing**: `node:test` — `test/change/`, `test/verify/`

**Project Type**: single project

**Constraints**: MV-110's two recorded decisions stay recorded; refusals name
what they refuse; no dependency

**Scale/Scope**: `src/change/file.ts`, `src/commands/verify.ts`, and their tests

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — and US1 is literally about a claim nobody would check |
| II — The tool's own failure mode | Reports success it did not check? | PASS — US1 removes the worst instance in the codebase |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency | PASS |
| Engineering: tests ship with behaviour | Pinned | PASS |

## Project Structure

```text
src/change/file.ts        # the close gate's orphan check; the archive guard; the dropped-key notice
src/commands/verify.ts    # lawDeath covers retired
test/change/, test/verify/
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
