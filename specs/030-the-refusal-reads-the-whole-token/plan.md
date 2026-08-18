# Implementation Plan: The refusal reads the whole token

**Branch**: `the-refusal-reads-the-whole-token` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/030-the-refusal-reads-the-whole-token/spec.md`

## Summary

One function decides what every command refuses. It compares whole argv tokens
against the declared surface, so `--provider=claude` matches nothing and is
refused as unknown — a regression published in 0.9.0 — and a declared valued
flag consumes whatever follows it, so `verify --repo --strict` runs non-strict
and says nothing. A tenth command, `change`, never reaches the function at all
and keeps a check that sees only `--` tokens.

The approach: teach `undeclared()` to read a `--name=value` token by its name,
to refuse a valued flag whose value is missing or flag-shaped, and delete
`change`'s private check in favour of the shared one. Three defects, one
function, a smaller file than before.

## Technical Context

**Language/Version**: TypeScript 5.6 targeting Node >= 24, ESM

**Primary Dependencies**: `citty@0.2.2` (parsing only — the refusal is not
delegated, MV-104), `picomatch`, `yaml`. None added.

**Storage**: N/A — this is argument handling, before anything is read or written

**Testing**: `node:test`, no frameworks. `test/cli/args.test.ts` (the unit
seam), `test/cli/unknown-args.test.ts` (walks the command registry)

**Target Platform**: the CLI, every command

**Project Type**: single project — CLI tool that is its own brain

**Performance Goals**: unchanged; the guard is one pass over argv

**Constraints**: refusal exits 2 and runs before any side effect (MV-85); the
refusal runs before the parser and is never delegated to it (MV-104); each
command keeps its own usage wording (MV-69); net deletion of source lines

**Scale/Scope**: 10 commands, one shared function, two test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | The behaviour ships anchored: MV-105 is reserved, and its anchors must point at the guard and at the registry-walking test | PASS — MV-105 is declared in the change file and anchored before close |
| II — The tool's own failure mode is the one to avoid | Does the change leave anything reporting success it did not check? | PASS — it removes three such reports and adds none |
| III — Law moves before code | MV-105 is reserved and stated before the code lands | PASS — reserved at `change new`, stated before `change close` |
| IV — Deterministic, offline, small | No dependency added, no network, no model, and the diff must be a net deletion | PASS — see FR-007; measured at implementation |
| V — An invented integration is a lie | No adapter entry is touched | PASS — not applicable |
| Engineering: tests ship with behaviour | Every branch added is pinned | PASS — one unit test per form, plus the registry walk |
| Engineering: English everywhere | — | PASS |

Post-design re-check: unchanged. The design adds no module, no option, no
configuration key and no abstraction; it edits one function and deletes a
second, narrower copy of it.

## Project Structure

### Documentation (this feature)

```text
specs/030-the-refusal-reads-the-whole-token/
├── plan.md              # This file
├── spec.md
├── research.md          # Phase 0 — measured citty behaviour
├── data-model.md        # Phase 1 — the surface and the token
├── quickstart.md        # Phase 1 — how to prove it
├── contracts/
│   └── refusal.md       # Phase 1 — the argument contract every command keeps
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── args.ts          # the one guard — the equals split and the missing-value refusal land here
└── commands/
    └── change.ts        # the private check is deleted; the shared guard is called

test/
└── cli/
    ├── args.test.ts     # the unit seam: one input, both readers
    └── unknown-args.test.ts   # walks the registry, so command ten is covered without a list
```

**Structure Decision**: single project, unchanged. The whole change lives in
`src/lib/args.ts` and `src/commands/change.ts`; no file is added to `src/`.

## Complexity Tracking

No Constitution Check violation. Nothing to justify.
