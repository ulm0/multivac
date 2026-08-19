# Implementation Plan: The engine reads one way

**Branch**: `the-engine-reads-one-way` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/033-the-engine-reads-one-way/spec.md`

## Summary

Three reads that answer with something other than the answer: a dialect gate
that compiles the canonical class typo into a pattern matching nothing real, a
line splitter that leaves `\r` on every line of a CRLF file, and a `count` that
reads working trees while `verify` reads channel refs — under a comment saying
it does what verify does.

The approach: widen the gate where it silently accepts, split on `\r?\n`, and
delete `count`'s copy of verify's resolution in favour of the function itself.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Storage**: none

**Testing**: `node:test` — `test/helpers/regex.test.ts`, `test/anchor/`,
`test/cli/count.test.ts`, and the suite that walks this brain's own corpus

**Target Platform**: the deterministic core, every command that evaluates a leg

**Project Type**: single project

**Performance Goals**: `verify` stays sub-second; the gate runs at parse time,
once per leg

**Constraints**: every anchor in this brain must still compile (SC-002); line
numbers must not move; no dependency

**Scale/Scope**: `src/lib/regex.ts`, `src/anchor/match.ts`,
`src/commands/count.ts`, one export added in `src/commands/verify.ts`

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored behaviour | PASS — MV-109 stated and anchored; MV-05 and MV-53 amended in place |
| II — The tool's own failure mode | Any report of success it did not check? | PASS — it removes a false green and a silent disagreement |
| III — Law moves before code | Row first | PASS — first implementation task |
| IV — Deterministic, offline, small | No dependency, sub-second | PASS — a widened parse-time check and one deleted copy |
| V — An invented integration is a lie | — | PASS — not applicable |
| Engineering: tests ship with behaviour | Every refused construct pinned | PASS |
| Engineering: English everywhere | — | PASS |

Post-design re-check: unchanged. `count` gets smaller; `regex.ts` gains one
walk state; `match.ts` changes one split.

## Project Structure

### Documentation (this feature)

```text
specs/033-the-engine-reads-one-way/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/dialect.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── lib/regex.ts          # the gate: bracket state, and the constructs it now names
├── anchor/match.ts       # one split
├── commands/verify.ts    # resolveSources exported, unchanged otherwise
└── commands/count.ts     # its own handle loop deleted

test/
├── helpers/regex.test.ts # every refused construct, and every accepted one
├── anchor/               # CRLF twin
└── cli/count.test.ts     # count agrees with verify, and says what it read
```

**Structure Decision**: single project, unchanged; no file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
