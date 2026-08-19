# Implementation Plan: The gate reads the commit it gates

**Branch**: `the-gate-reads-the-commit-it-gates` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/031-the-gate-reads-the-commit-it-gates/spec.md`

## Summary

`cleanEnv()` drops every ambient git pointer so a sibling repo is never read
through the hook repo's index. Correct for siblings, wrong for the one repo the
hook is actually about: under `git commit -a` the gates read an index that does
not contain the commit's changes, and under a pathspec commit they read one that
contains more.

The approach: restore `GIT_INDEX_FILE`, and only it, and only when the repo
being read resolves to the same git directory the ambient environment names.
Then extend the HEAD-vs-index read that already exists so a row leaving `active`
— or the whole law file leaving the commit — is refused the way a row arriving
at `active` beside its code already is.

## Technical Context

**Language/Version**: TypeScript 5.6 targeting Node >= 24, ESM

**Primary Dependencies**: none added. `citty`, `picomatch`, `yaml` unchanged.

**Storage**: git objects and the index; nothing of multivac's own is written

**Testing**: `node:test`. The hook-level cases must run a REAL installed hook —
`test/verify/enact.test.ts`, `test/verify/config-gate.test.ts`, and the shared
fixtures in `test/helpers/`

**Target Platform**: the pre-commit path, plus `verify` run by hand

**Project Type**: single project

**Performance Goals**: `verify` stays sub-second; the ambient decision is one
resolution, memoised per process

**Constraints**: no network, no model, git through an argument vector; the
sibling-repo protection `cleanEnv` exists for must not regress

**Scale/Scope**: two functions in `src/lib/git.ts`, one in
`src/commands/verify.ts`, plus the law rows and their tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | The behaviour ships anchored | PASS — MV-106 and MV-107 are reserved and anchored before close |
| II — The tool's own failure mode | Does anything report success it did not check? | PASS — this change is entirely the removal of two such reports |
| III — Law moves before code | Rows stated before the code lands | PASS — both rows are written in the first implementation task |
| IV — Deterministic, offline, small | No dependency, no network, sub-second | PASS — one memoised path resolution |
| V — An invented integration is a lie | No adapter touched | PASS — not applicable |
| Engineering: tests ship with behaviour | Every branch pinned, and at hook level | PASS — SC-001 forbids proving it by calling the function |
| Engineering: English everywhere | — | PASS |

Post-design re-check: unchanged. No module, option or configuration key is
added; `run()` gains one optional field on an options object it already has a
shape for, and `enactmentLine` gains a filter beside the one it already runs.

## Project Structure

### Documentation (this feature)

```text
specs/031-the-gate-reads-the-commit-it-gates/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── index-reads.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── git.ts           # the ambient decision: one helper, one opt-in on run()
└── commands/
    └── verify.ts        # stagedPaths opts in; enactmentLine gains the death check

test/
└── verify/
    ├── enact.test.ts        # commit -a and pathspec, through a real hook
    └── config-gate.test.ts  # MV-97 under the same forms
```

**Structure Decision**: single project, unchanged. No file is added under
`src/`.

## Complexity Tracking

No Constitution Check violation. Nothing to justify.
