# Tasks: A stale mount is said when work starts

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — the report at the start 🎯

- [X] T002 [US1] Export `stalenessLines` from src/commands/verify.ts
- [X] T003 [US1] Report it from `cmdNew` in src/commands/change.ts, under a heading printed only when there is a line, and never refusing
- [X] T004 [US1] Report it from `cmdApply` in src/commands/change.ts, the same way
- [X] T005 [P] [US1] Test that a pin behind its channel is reported at new, naming repo, distance and the refresh command, in test/change/staleness-at-start.test.ts
- [X] T006 [P] [US1] Test the same at apply, in test/change/staleness-at-start.test.ts
- [X] T007 [P] [US1] Test that current pins print nothing, in test/change/staleness-at-start.test.ts
- [X] T008 [P] [US1] Test that a stale pin never refuses: both commands exit 0 and the change file exists, in test/change/staleness-at-start.test.ts

## Phase 3: US2 — the report knows what it cannot know

- [X] T009 [P] [US2] Test that an unresolvable channel is reported as uncomparable rather than guessed, in test/change/staleness-at-start.test.ts
- [X] T010 [P] [US2] Test that no network is reached by either command, in test/change/staleness-at-start.test.ts

## Phase 4: The law

- [X] T011 Write MV-94's statement into .multivac/invariants.md, stating the offline ceiling
- [X] T012 Anchor MV-94 to the export and to both call sites
- [X] T013 Anchor MV-94 to test/change/staleness-at-start.test.ts
- [X] T014 Run `verify` and confirm MV-94 resolves

## Phase 5: Documentation

- [X] T015 Document what `new` and `apply` now report in site/content/docs/reference/commands.md
- [X] T016 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T017 Run `pnpm test` and `verify --strict`

## Dependencies

Phase 2 is the whole feature; US2 is assertions about behaviour Phase 2 inherits from the verifier.
