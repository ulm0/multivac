# Tasks: Issues from the change files, one way

**Tests**: included, per the constitution.

## Phase 1: Foundational

- [X] T001 Add `tracker?: string` to `Config` in src/types.ts and parse `tracker:` in src/lib/config.ts
- [X] T002 Add `issue?: number` to the change file in src/change/file.ts, validated and serialized only when set
- [X] T003 [P] Test that `tracker:` and `issue:` parse and round-trip, in test/change/tracker.test.ts

## Phase 2: US1 — the projection 🎯

- [X] T004 [US1] Create src/adapters/tracker.ts with an entry per tracker carrying the vendor's documented commands
- [X] T005 [US1] Implement the runner: create, update, close, each through the declared command
- [X] T006 [US1] Add `roadmap sync` in src/commands/roadmap.ts, creating an issue per change without one and recording the number
- [X] T007 [US1] Update rather than replace when a number is recorded
- [X] T008 [US1] Report a recorded number whose issue is gone, and never re-create silently
- [X] T009 [P] [US1] Test creation records the number, in test/change/tracker.test.ts
- [X] T010 [P] [US1] Test a second run creates nothing, in test/change/tracker.test.ts
- [X] T011 [P] [US1] Test an undeclared tracker says so and does nothing, in test/change/tracker.test.ts
- [X] T012 [P] [US1] Test an absent binary refuses, naming it, in test/change/tracker.test.ts

## Phase 3: US2 — one way

- [X] T013 [US2] Close the issue of an archived change
- [X] T014 [P] [US2] Test that no tracker output can change a change file, in test/change/tracker.test.ts
- [X] T015 [P] [US2] Test that an archived change closes its issue, in test/change/tracker.test.ts

## Phase 4: US3 — only our labels

- [X] T016 [US3] Write only the namespaced state label, through the declared command
- [X] T017 [P] [US3] Test that the command never removes a label it does not own, in test/change/tracker.test.ts

## Phase 5: The law

- [X] T018 Write MV-99's statement into .multivac/invariants.md
- [X] T019 Anchor MV-99 to the entries, the sync, the recorded identity and the label namespace
- [X] T020 Write MV-99's `absent` leg over the three offline commands
- [X] T021 Run `verify` and confirm MV-99 resolves

## Phase 6: Documentation

- [X] T022 [P] Document `roadmap sync` in site/content/docs/reference/commands.md
- [X] T023 [P] Document `tracker:` in site/content/docs/reference/configuration.md
- [X] T024 Add the CHANGELOG entry

## Phase 7: Polish

- [X] T025 Run `pnpm test` and `verify --strict`
