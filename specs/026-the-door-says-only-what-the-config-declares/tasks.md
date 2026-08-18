# Tasks: The door says only what the config declares

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — the door never names an undeclared adapter 🎯 MVP

- [X] T002 [US1] Resolve the door's adapter from the config whenever a config exists, never from a flag it does not answer, in src/commands/init.ts
- [X] T003 [P] [US1] Test that a flag the config declares none of never reaches the door, in test/init/reinit.test.ts
- [X] T004 [P] [US1] Test that the unanswered-flag report is unchanged and still exits 0, in test/init/reinit.test.ts
- [X] T005 [P] [US1] Test that a declared adapter still reaches the door on a re-run with no flag, in test/init/reinit.test.ts

## Phase 3: US2 — two commands, one door

- [X] T006 [US2] Test that `init` followed by `doors`, nothing edited between, leaves the door byte-identical, in test/init/reinit.test.ts
- [X] T007 [P] [US2] Test that a first run is unchanged — the flag writes the config and the door, in test/init/reinit.test.ts

## Phase 4: The law

- [X] T008 Write MV-101's statement into .multivac/invariants.md
- [X] T009 Amend MV-91 in place, dated: the belt-and-braces ordering was silent about the declares-none row
- [X] T010 Anchor MV-101 to the resolution in src/commands/init.ts, with an absent leg tombstoning the fallback
- [X] T011 Anchor MV-101 to the agreement test in test/init/reinit.test.ts
- [X] T012 Run `verify` and confirm MV-101 resolves

## Phase 5: Documentation

- [X] T013 Say what a re-run projects, in site/content/docs/reference/commands.md
- [X] T014 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T015 Run `pnpm test` and `verify --strict`
- [X] T016 Walk quickstart.md scenarios 1-4

## Dependencies

T002 blocks every test below it. US2's agreement test is the one that states the
rule; US1's tests name the symptom it was found by.

## Parallel execution

All test tasks touch one file and serialise there; they are independent in
content. T013 and T014 are independent documents.
