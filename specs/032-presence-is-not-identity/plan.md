# Implementation Plan: Presence is not identity

**Branch**: `presence-is-not-identity` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/032-presence-is-not-identity/spec.md`

## Summary

Five places decide "is this mine?" by presence: a stub door overwrites whatever
file it finds, the hook shim executes any `dist/cli.js`, "runs multivac" is a
substring of the whole hook text in two hand-copied places, an existing shim is
never rewritten because it merely mentions multivac, and `init` re-does two
things `doors` owns. MV-74 already recorded this class in the settings merge;
this applies the same discipline to the rest.

The approach: one ownership predicate per artifact, each reading a fact the
artifact states about itself — the shim's own managed header, the repo's own
`package.json` name, the managed block's own markers — and one shared function
where two readers exist today.

## Technical Context

**Language/Version**: TypeScript 5.6 targeting Node >= 24, ESM; the shim is
POSIX sh

**Primary Dependencies**: none added

**Storage**: files multivac projects into repos; nothing new is stored

**Testing**: `node:test`. `test/doors/`, `test/init/hook-shim.test.ts`,
`test/init/coexist.test.ts`, `test/doctor/`

**Target Platform**: every repo multivac projects into, including ones it did
not create

**Project Type**: single project

**Performance Goals**: one `package.json` read added to a hook run

**Constraints**: the shim and `findRunner` are a declared mirror pair (MV-92)
and must stay in step; refusals keep their wording; no dependency

**Scale/Scope**: `src/hooks/install.ts`, `src/commands/doors.ts`,
`src/commands/doctor.ts`, `src/commands/init.ts`, `src/doors/block.ts`

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Behaviour ships anchored | PASS — MV-108 stated and anchored; MV-92 amended in place |
| II — The tool's own failure mode | Anything reporting success it did not check? | PASS — this change removes three such reports (armed-by-comment, wired-by-comment, a gate that never arms) |
| III — Law moves before code | Row before code | PASS — MV-108 is the first implementation task |
| IV — Deterministic, offline, small | No dependency, no network | PASS — one extra file read |
| V — An invented integration is a lie | Adapter entries untouched | PASS — the registry is data and stays data |
| Engineering: tests ship with behaviour | Each branch pinned | PASS — including a `dist/cli.js` that would leave evidence if executed |
| Engineering: English everywhere | — | PASS |

Post-design re-check: unchanged. The shim grows one condition, `block.ts` grows
one optional argument, and two hand-copied regexes become one function — a
consolidation, not an abstraction.

## Project Structure

### Documentation (this feature)

```text
specs/032-presence-is-not-identity/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ownership.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── hooks/install.ts     # the runner rung, the ownership header, the shared predicate
├── commands/
│   ├── doors.ts         # the stub door reads before it writes
│   ├── doctor.ts        # reads the shared predicate instead of its own copy
│   └── init.ts          # strictness from the config; the record only when absent
└── doors/block.ts       # a malformed block names its file

test/
├── doors/               # stub-door content survival, block error wording
├── init/                # shim regeneration, strictness, the record
└── doctor/              # armed means armed
```

**Structure Decision**: single project, unchanged. No file is added under
`src/`.

## Complexity Tracking

No Constitution Check violation.
