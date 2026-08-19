# Implementation Plan: The ledger keeps itself

**Branch**: `the-ledger-keeps-itself` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/034-the-ledger-keeps-itself/spec.md`

## Summary

Five places break a contract the code itself states — *nothing is left
floating* — and one adapter reports success it did not have. The approach is
five small edits and one registry field: a `-` in four globs, an existence check
`roadmap add` already performs, a path added to a printed commit, a
`commitBookkeeping` call that was never made, a truthful abandon line, and the
label flag moved into the tracker entry where the vendors' difference belongs.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Storage**: the change files and the law row under `.multivac/`

**Testing**: `node:test` — `test/change/`, `test/change/tracker.test.ts`,
`test/change/lifecycle-polish.test.ts`

**Target Platform**: the change lifecycle, and `roadmap sync`

**Project Type**: single project

**Performance Goals**: unchanged

**Constraints**: a commit that cannot happen still degrades to the printed
command; no second issue is ever created; adapters stay data

**Scale/Scope**: `src/adapters/registry.ts`, `src/adapters/tracker.ts`,
`src/commands/change.ts`, `src/commands/roadmap.ts`, `src/change/file.ts`

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-110 stated and anchored; MV-46 amended |
| II — The tool's own failure mode | Reports success it did not check? | PASS — US5 removes two |
| III — Law moves before code | Row first | PASS — first implementation task |
| IV — Deterministic, offline, small | No dependency | PASS |
| V — An invented integration is a lie | Adapter data, not dispatch on a name | PASS — the label flag is a field, and only what each vendor documents |
| Engineering: tests ship with behaviour | Pinned | PASS — including replacing the `git add -A` that hid US3 |
| Engineering: English everywhere | — | PASS |

Post-design re-check: unchanged. One field is added to an interface with two
implementations that already differ in four other fields.

## Project Structure

### Documentation (this feature)

```text
specs/034-the-ledger-keeps-itself/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/ledger.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── adapters/registry.ts   # four globs gain a separator
├── adapters/tracker.ts    # the label flag becomes data
├── commands/change.ts     # the archive check, the land commit, the close paths, abandon's sentence
├── commands/roadmap.ts    # a failure is printed as a failure
└── change/file.ts         # the scaffold stops promising a round-trip it does not do

test/change/               # each of the five, plus the swept-tree test replaced
```

**Structure Decision**: single project, unchanged.

## Complexity Tracking

No Constitution Check violation.
