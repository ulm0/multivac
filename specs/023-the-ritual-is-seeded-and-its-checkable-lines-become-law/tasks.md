# Tasks: A seeded ritual, and a line that a check can make true belongs in the check

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — the seed 🎯

- [X] T002 [US1] Replace `RITUAL_TEMPLATE` with `ritualSeed(config)` in src/lib/ritual.ts, emitting commented candidates
- [X] T003 [US1] Draw candidates from the declarations, contributing none for work that is automatic
- [X] T004 [US1] Pass the config from src/commands/init.ts, still write-if-missing
- [X] T005 [P] [US1] Test that a seeded ritual carries commented candidates, in test/change/ritual.test.ts
- [X] T006 [P] [US1] Test that a commented candidate prints nothing at close, in test/change/ritual.test.ts
- [X] T007 [P] [US1] Test that uncommenting one makes it print, in test/change/ritual.test.ts
- [X] T008 [P] [US1] Test that an existing ritual is never overwritten, in test/change/ritual.test.ts
- [X] T009 [P] [US1] Test that a declared grapher contributes no candidate, in test/change/ritual.test.ts

## Phase 3: US2 — the migration

- [X] T010 [US2] Rewrite .multivac/ritual.md to the lines no check could decide, naming where each moved obligation went
- [X] T011 [US2] Widen MV-34's template anchor to cover the landing-order prompt the template already carries
- [X] T012 [P] [US2] Test that the repo's own ritual contains no line whose obligation is enforced elsewhere, in test/change/ritual.test.ts

## Phase 4: The law

- [X] T013 Write MV-98's statement into .multivac/invariants.md, naming which obligations moved and which were left
- [X] T014 Anchor MV-98 to `ritualSeed` and to the comment-stripping parse
- [X] T015 Anchor MV-98 to test/change/ritual.test.ts
- [X] T016 Run `verify` and confirm MV-98 and the widened MV-34 both resolve

## Phase 5: Documentation

- [X] T017 Document the seeded ritual in site/content/docs/concepts/the-change.md
- [X] T018 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T019 Run `pnpm test` and `verify --strict`

## Dependencies

US1 and US2 are independent; US2 touches this repo's own files and the law.
