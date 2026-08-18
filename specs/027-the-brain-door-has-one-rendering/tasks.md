# Tasks: The brain door has one rendering

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — the scaffolded door is the maintained door 🎯 MVP

- [X] T002 [US1] Render the door through renderBrainDoor in src/commands/init.ts, reading the config it just wrote or kept
- [X] T003 [US1] Delete DOOR_BODY and the second SDD-line assembly in src/commands/init.ts
- [X] T004 [P] [US1] Test that a brain scaffolded with a declared grapher gets a door naming it, in test/init/init.test.ts
- [X] T005 [P] [US1] Test that declared sibling repos are listed in the scaffolded door, in test/init/init.test.ts
- [X] T006 [P] [US1] Test that an empty brain still says so, in test/init/init.test.ts

## Phase 3: US2 — scaffolding and projection write the same bytes

- [X] T007 [US2] Test that init then doors leaves the door byte-identical, across declared configurations, in test/init/reinit.test.ts
- [X] T008 [P] [US2] Test that content outside the managed block survives both, in test/init/reinit.test.ts

## Phase 4: The law

- [X] T009 Write MV-102's statement into .multivac/invariants.md
- [X] T010 Amend MV-101 in place, dated: the ceiling it stated is closed, and trim the paragraph MV-91 already carries
- [X] T011 Move MV-101's anchors onto the surviving code, keeping its absent leg
- [X] T012 Anchor MV-102 to the single call site and to the byte-equality test
- [X] T013 Run `verify` and confirm MV-101 and MV-102 both resolve

## Phase 5: Documentation

- [X] T014 Say what the scaffolded door contains, in site/content/docs/reference/commands.md
- [X] T015 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T016 Run `pnpm test` and `verify --strict`
- [X] T017 Walk quickstart.md scenarios 1-4

## Dependencies

T002 and T003 are one edit in two steps and block every test. T010 and T011 are
one amendment: the row and its anchors move together or the claim breaks.

## Parallel execution

US1's tests touch init.test.ts, US2's touch reinit.test.ts — independent files.
T014 and T015 are independent documents.
