# Implementation Plan: A proof names one feature

**Branch**: `a-proof-names-one-feature` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Delete the wildcard from the artifact language and replace it with `<n>`, one
run of digits, defined in one place. `[0-9]+` cannot cross a separator, which
is what ends the tail match the separator alone did not. Then make the resolver
return every hit and both gate loops refuse a clash by name, so an older
directory can no longer shadow the right one in silence.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Storage**: none

**Testing**: `node:test` — `test/change/sdd-gates.test.ts`,
`test/change/ledger.test.ts`, plus the printed-glob assertions in
`test/doctor/` and `test/doors/flow.test.ts`

**Target Platform**: the SDD gates at `plan`, `apply` and `close`

**Project Type**: single project

**Constraints**: opsx's literal paths keep working; the registry stays data;
no dependency

**Scale/Scope**: `src/adapters/detect.ts`, `src/adapters/sdd.ts`,
`src/adapters/registry.ts`, four test files, two doc surfaces, and the
projected door and skill mirror

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-113 pins the token's definition, the all-hits signature and both refusals |
| II — The tool's own failure mode | Reports success it did not check? | PASS — it ends a gate that proved a step with another feature's work |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency | PASS |
| V — An invented integration is a lie | Adapters stay data | PASS — only the artifact language changed, not the dispatch |
| Engineering: tests ship with behaviour | Pinned | PASS — the tail case and the clash both assert |
| Engineering: English everywhere | — | PASS |

## Project Structure

```text
src/adapters/detect.ts     # <n>, and every hit
src/adapters/sdd.ts        # both gate loops refuse a clash
src/adapters/registry.ts   # the declared artifacts stop using a wildcard
test/change/, test/doctor/, test/doors/   # the assertions that quote the glob
site/, skills/, AGENTS.md, .multivac/flow.md   # what is printed and projected
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
