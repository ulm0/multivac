# Tasks: A config change needs a change that declares it

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — the gate 🎯

- [X] T002 [US1] Add `configLine(brainDir)` beside `enactmentLine` in src/commands/verify.ts, reading the index and comparing against HEAD
- [X] T003 [US1] Refuse when the config is modified and no change is open, naming both ways forward
- [X] T004 [US1] Report without refusing when a change is open, naming it
- [X] T005 [US1] Wire it into the run's exit code beside the enactment check
- [X] T006 [P] [US1] Test the refusal and its exit code, in test/verify/config-gate.test.ts
- [X] T007 [P] [US1] Test that an open change allows it, in test/verify/config-gate.test.ts
- [X] T008 [P] [US1] Test that an untouched config prints nothing, in test/verify/config-gate.test.ts

## Phase 3: US2 — a brain can be born

- [X] T009 [US2] Treat a config absent from HEAD as free, in src/commands/verify.ts
- [X] T010 [US2] Say nothing outside the brain, and report unanswered on an unreadable index
- [X] T011 [P] [US2] Test that creating a config is never refused, in test/verify/config-gate.test.ts
- [X] T012 [P] [US2] Test that a repo with no previous commit is never refused, in test/verify/config-gate.test.ts

## Phase 4: The law

- [X] T013 Write MV-97's statement into .multivac/invariants.md, stating what the check cannot see
- [X] T014 Anchor MV-97 to `configLine` and the refusal
- [X] T015 Anchor MV-97 to test/verify/config-gate.test.ts
- [X] T016 Run `verify` and confirm MV-97 resolves

## Phase 5: Documentation

- [X] T017 Document the gate in site/content/docs/reference/configuration.md
- [X] T018 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T019 Run `pnpm test` and `verify --strict`

## Dependencies

Phase 2 is the feature; Phase 3 is its exemptions and must land with it or the rule blocks initialisation.
