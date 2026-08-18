# Tasks: The graph is part of the repository

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: Foundational

- [X] T002 Add `isTracked(repo, path)` beside `ignoredPaths` in src/lib/git.ts

## Phase 3: US1 — an untracked graph is refused 🎯 MVP

- [X] T003 [US1] Add src/adapters/tracked.ts with the per-root tracked verdict, reusing graphScopes and the adapter spec
- [X] T004 [US1] Refuse at close, naming every offending root, its artifact and the command, in src/commands/change.ts
- [X] T005 [P] [US1] Test that an untracked artifact refuses the close and names the command, in test/change/grapher-tracked.test.ts
- [X] T006 [P] [US1] Test that tracking it lets the close proceed, in test/change/grapher-tracked.test.ts
- [X] T007 [P] [US1] Test that several offending roots land in one refusal, in test/change/grapher-tracked.test.ts

## Phase 4: US2 — an ignored graph names the rule

- [X] T008 [US2] Report an ignored artifact as ignored, with removing the rule first, in src/adapters/tracked.ts
- [X] T009 [P] [US2] Test the ignored message, in test/change/grapher-tracked.test.ts

## Phase 5: Boundaries

- [X] T010 [P] Test that a missing artifact is MV-90's refusal and never reported as untracked, in test/change/grapher-tracked.test.ts
- [X] T011 [P] Test that `--no-grapher` and `grapher_auto: false` skip this gate too and say so, in test/change/grapher-tracked.test.ts
- [X] T012 [P] Test that multivac stages nothing — the index is untouched by a refused close, in test/change/grapher-tracked.test.ts

## Phase 6: The report

- [X] T013 Report UNTRACKED and IGNORED per root in src/commands/doctor.ts
- [X] T014 [P] Test the doctor line, in test/doctor/doctor.test.ts

## Phase 7: The law

- [X] T015 Write MV-103's statement into .multivac/invariants.md
- [X] T016 Amend MV-90 in place, dated: existence was half the question
- [X] T017 Anchor MV-103 to the gate, its call site, its tests, and an absent leg keeping git out of refresh.ts
- [X] T018 Run `verify` and confirm MV-103 resolves

## Phase 8: Documentation

- [X] T019 [P] Document the gate in site/content/docs/reference/graphers-and-sdd.md
- [X] T020 [P] Document the refusal in site/content/docs/reference/commands.md
- [X] T021 Add the CHANGELOG entry

## Phase 9: Polish

- [X] T022 Run `pnpm test` and `verify --strict`
- [X] T023 Walk quickstart.md scenarios 1-4

## Dependencies

T002 blocks T003. T003 blocks T004 and every test. T008 extends T003's verdict.

## Parallel execution

The tests are independent within their phases; the two documentation tasks are
independent files.
