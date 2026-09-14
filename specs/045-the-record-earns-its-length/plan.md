# Implementation Plan: The record earns its length

**Branch**: `the-record-earns-its-length` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

This change makes 21 deletion-first edits to two files and gives back one
reservation. Every edit was drafted, passed through an adversarial fidelity
check that restored 18 lost qualifiers, and was dry-run in a scratch clone of
`f057e4a`. The results:

- MV-120: 821 → 396 words
- Notes: 127/129 → 52/57 words
- 0.10.0 entry: 2546 → 1467 words
- MV-72 bullet: 40 → 32 words

With the edits applied, `verify --strict` is byte-identical to the unedited
clone, 587/587 tests pass, and 2/2 bites fail as expected.

## Technical Context

**Language/Version**: Markdown only

**Primary Dependencies**: none added

**Testing**: `verify --strict`, the full `node:test` suite, a bite sample in a
scratch clone

**Project Type**: single project; documents only

**Constraints**:
- No rule, anchor or code moves.
- The literal `Amended 2026-09-13 by MV-120` stays exactly twice.
- No ` | ` inside a statement cell.

**Scale/Scope**: `.multivac/invariants.md` (3 cells), `CHANGELOG.md` (the 0.10.0
entry and one 0.2.0 bullet), plus removal of the MV-121 reservation row

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is any anchored rule lost? | PASS — all legs are untouched, and verify output is identical |
| II — Never claims more than it checked | Does a cut make a sentence overclaim? | PASS — the fidelity pass restored every scope and qualifier |
| III — Law before code | Does any rule change? | PASS — none |
| IV / V | Dependencies or integrations? | PASS — none |

Complexity Tracking: no violations.

## Project Structure

```text
specs/045-the-record-earns-its-length/   plan.md research.md quickstart.md tasks.md
.multivac/invariants.md                   MV-14 note, MV-111 note, MV-120 statement; MV-121 row removed
CHANGELOG.md                              0.10.0 entry, 0.2.0 MV-72 bullet
```
