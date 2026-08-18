# Tasks: The CLI is parsed by citty

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken
- [X] T002 Add citty to dependencies and confirm the tree grows by exactly one package

## Phase 2: Foundational

- [X] T003 Add `surfaceFrom(ArgsDef)` to src/lib/args.ts so the refusal reads the declaration citty parses
- [X] T004 [P] Test the derivation: boolean, string, positional and alias each become the right surface, in test/cli/args.test.ts
- [X] T005 [P] Test that an undeclared argument is refused before the parser is reached, in test/cli/args.test.ts

## Phase 3: US1 — nothing a user types behaves differently 🎯 MVP

- [X] T006 [US1] Declare ARGS and parse with citty in src/commands/seed.ts, doors.ts, doctor.ts, repos.ts
- [X] T007 [US1] Declare ARGS and parse with citty in src/commands/verify.ts, count.ts, roadmap.ts
- [X] T008 [US1] Declare ARGS and parse with citty in src/commands/init.ts and change.ts, the two with subcommand-shaped arguments
- [X] T009 [US1] Run the whole existing suite unedited and confirm it passes

## Phase 4: US2 — one declaration

- [X] T010 [US2] Delete every hand-rolled flag loop the declaration replaces
- [X] T011 [P] [US2] Test that adding a flag to a declaration is picked up by both readers, in test/cli/args.test.ts

## Phase 5: The law

- [X] T012 Write MV-104's statement into .multivac/invariants.md
- [X] T013 Amend MV-02 in place, dated: three runtime dependencies, named
- [X] T014 Amend MV-85 in place, dated: the refusal reads the declaration and still precedes the parser
- [X] T015 Anchor MV-104 to the derivation, a declaration, and the order
- [X] T016 Amend .specify/memory/constitution.md, bump CONSTITUTION_VERSION, prepend the Sync Impact Report
- [X] T017 Run `verify` and confirm MV-104, MV-02 and MV-85 all resolve

## Phase 6: Documentation

- [X] T018 [P] Say what the CLI is built on in site/content/docs/reference/commands.md
- [X] T019 [P] Update the dependency count wherever the site states it
- [X] T020 Add the CHANGELOG entry

## Phase 7: Polish

- [X] T021 Run `pnpm test` and `verify --strict`
- [X] T022 Walk quickstart.md scenarios 1-4

## Dependencies

T002 blocks everything. T003 blocks T006-T008. T009 is the acceptance gate for
US1 and must pass with an unedited suite.

## Parallel execution

T006 and T007 are independent files; T008 is separate because those two commands
carry positional subcommands.
