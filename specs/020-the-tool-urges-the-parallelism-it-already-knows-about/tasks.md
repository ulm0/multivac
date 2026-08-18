# Tasks: The tool urges the parallelism it already knows about

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — apply names what can be worked at once 🎯

- [X] T002 [US1] After the checkouts are handed back in `cmdApply` in src/commands/change.ts, name the repos of the ready stage when there is more than one
- [X] T003 [US1] Attach the two boundaries to that line: never the same file, never the law
- [X] T004 [P] [US1] Test that a two-repo stage prints the line naming both, in test/change/urging.test.ts
- [X] T005 [P] [US1] Test that a one-repo stage prints nothing about parallelism, in test/change/urging.test.ts
- [X] T006 [P] [US1] Test that the boundaries are present whenever the line is, in test/change/urging.test.ts
- [X] T007 [P] [US1] Test that apply still exits 0 and refuses nothing, in test/change/urging.test.ts

## Phase 3: US2 — the chain says continue

- [X] T008 [US2] Add the continue clause to the shared step-instruction builder in src/adapters/sdd.ts, naming the opt-out on the same line
- [X] T009 [US2] Word it to distinguish a question the tool raises from asking permission to continue
- [X] T010 [P] [US2] Test that each step instruction carries the clause, in test/change/urging.test.ts
- [X] T011 [P] [US2] Test that `--no-sdd` and `sdd_auto: false` print neither steps nor clause, in test/change/urging.test.ts

## Phase 4: The law

- [X] T012 Write MV-95's statement into .multivac/invariants.md, declaring both halves ungateable with their reason
- [X] T013 Anchor MV-95 to the apply line and the continue clause
- [X] T014 Anchor MV-95 to test/change/urging.test.ts
- [X] T015 Run `verify` and confirm MV-95 resolves

## Phase 5: Documentation

- [X] T016 [P] Document both in site/content/docs/reference/commands.md
- [X] T017 [P] Tell the agent to run the chain unattended in skills/multivac/references/change.md
- [X] T018 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T019 Run `pnpm test` and `verify --strict`

## Dependencies

US1 and US2 are independent and touch different files.
