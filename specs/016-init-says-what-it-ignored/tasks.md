# Tasks: init says what it ignored

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: Foundational

- [X] T002 Load the existing config once, before any write, in src/commands/init.ts, and keep its adapters for the resolution below

## Phase 3: US1 — a disagreeing flag is refused 🎯 MVP

- [X] T003 [US1] Compare each requested adapter against the declared one in src/commands/init.ts, collecting every disagreement rather than returning on the first
- [X] T004 [US1] Refuse before the first write in src/commands/init.ts, naming the configured value, the requested value and both ways forward, per contracts/cli-output.md
- [X] T005 [US1] Resolve the door's adapter from the config whenever one exists, never from a flag the config did not receive, in src/commands/init.ts
- [X] T006 [P] [US1] Test that a disagreeing flag refuses with exit 1 and both values named, in test/init/reinit.test.ts
- [X] T007 [P] [US1] Test that a refused run writes nothing — door, hooks and version record untouched, in test/init/reinit.test.ts
- [X] T008 [P] [US1] Test that two disagreements produce one refusal naming both, in test/init/reinit.test.ts
- [X] T009 [P] [US1] Test that a first run with flags is unchanged, in test/init/reinit.test.ts

## Phase 4: US2 — a re-run says what the config already answered

- [X] T010 [US2] Report agreeing flags as already declared in src/commands/init.ts
- [X] T011 [US2] Report a flag naming an adapter the config declares none of, with how to make it stick, in src/commands/init.ts
- [X] T012 [P] [US2] Test the agreement report and that it does not refuse, in test/init/reinit.test.ts
- [X] T013 [P] [US2] Test the declares-none report, in test/init/reinit.test.ts
- [X] T014 [P] [US2] Test that a re-run with no flags reports nothing extra, in test/init/reinit.test.ts

## Phase 5: The law

- [X] T015 Write MV-91's statement into .multivac/invariants.md
- [X] T016 Amend MV-70 in place, dated: projecting what was declared means the CONFIG's declaration on a re-run
- [X] T017 Anchor MV-91 to the refusal and the report in src/commands/init.ts
- [X] T018 Anchor MV-91 to test/init/reinit.test.ts
- [X] T019 Run `verify` and confirm MV-91 resolves

## Phase 6: Documentation

- [X] T020 [P] Document what a re-run does, key by key, in site/content/docs/reference/commands.md
- [X] T021 [P] Say re-running is safe and what it refuses, in site/content/docs/guide/install.md
- [X] T022 Add the CHANGELOG entry

## Phase 7: Polish

- [X] T023 Run `pnpm test` and `verify --strict`
- [X] T024 Walk quickstart.md scenarios 1-4

## Dependencies

Phase 2 blocks both stories. US1 is the MVP. US2 is reporting only and depends on T003's comparison.

## Parallel execution

US1's and US2's test tasks are independent within their phases; both stories touch one source file and one test file, which is where they serialise. T020 and T021 are independent documents.
