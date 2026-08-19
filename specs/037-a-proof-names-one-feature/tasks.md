---

description: "Task list for a-proof-names-one-feature"
---

# Tasks: A proof names one feature

**Input**: Design documents from `specs/037-a-proof-names-one-feature/`

**Tests**: requested. The pair matters: a rule that refuses everything would
satisfy the tail case alone, so the accepting case is what makes it mean
something.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build && pnpm test`
- [X] T002 Measure the two regexes against the three directory names

## Phase 2: Foundational

- [X] T003 Write MV-113 in `.multivac/invariants.md` with its anchors, and amend MV-110 to record that its ceiling is closed here

## Phase 3: User Story 1 — a tail is not a match (P1)

- [X] T004 [US1] In `src/adapters/detect.ts`, replace the `*` matcher with `<n>` — escaping `*` and `?` as literals, substituting the token after the escape — and return every hit
- [X] T005 [US1] In `src/adapters/registry.ts`, move speckit to `specs/<n>-<slug>/…` and opsx's archive to its dated shape
- [X] T006 [US1] In `test/change/sdd-gates.test.ts`, assert the tail case refuses and the numbered case proves

## Phase 4: User Story 2 — a clash is a refusal (P1)

- [X] T007 [US2] In `src/adapters/sdd.ts`, refuse in the artifact gate loop when a root holds more than one hit, naming them
- [X] T008 [US2] The same in the ledger gate loop
- [X] T009 [US2] Assert both refusals, and that one hit still proceeds

## Phase 5: Polish & Cross-Cutting

- [X] T010 Update every assertion that quotes the printed glob — `ledger.test.ts`, `sdd-gates.test.ts`, `doctor.test.ts`, `flow.test.ts` — updated, not deleted
- [X] T011 Update `site/content/docs/reference/graphers-and-sdd.md` and `skills/multivac/references/change.md`, then re-project with `doors` so the mirror and the door follow
- [X] T012 `pnpm test` green with `mvac` off PATH; `verify --strict` 0 blocking broken with MV-113 anchored

## Dependencies

- T003 precedes the code.
- T004 blocks T005 and both gate loops.

## Implementation strategy

US1 is the language; US2 is what the language cannot decide on its own. Both
land together because the resolver's signature changes for both.
