# Tasks: One page saying what is automatic, what is a gate, and what is yours

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: Foundational

- [X] T002 Add `FLOW_PATH` to src/lib/config.ts

## Phase 3: US1 — the three groups 🎯

- [X] T003 [US1] Create src/doors/flow.ts with `renderFlow(config)` building the three groups from the registry and the config
- [X] T004 [US1] Render each gating step as the command that refuses and the artifact it refuses without, never an identifier
- [X] T005 [US1] Render each unprovable step carrying the adapter's own reason, verbatim
- [X] T006 [US1] Render the lifecycle's own entries so a brain with no adapters still gets a useful page
- [X] T007 [US1] Render an unverified adapter as declared-but-unknown with the fields to declare
- [X] T008 [US1] Write the page from `doors` in src/commands/doors.ts through the managed block
- [X] T009 [P] [US1] Test the three groups against a config declaring an SDD tool and a grapher, in test/doors/flow.test.ts
- [X] T010 [P] [US1] Test that a gating row names its command and artifact, in test/doors/flow.test.ts
- [X] T011 [P] [US1] Test that an unprovable row carries the adapter's own words, in test/doors/flow.test.ts
- [X] T012 [P] [US1] Test that a bare brain still gets a page, in test/doors/flow.test.ts
- [X] T013 [P] [US1] Test that an unverified adapter is named as unknown, in test/doors/flow.test.ts

## Phase 4: US2 — derived, and saying so

- [X] T014 [US2] Write the header naming what regenerates the page and pointing at the law as what binds
- [X] T015 [P] [US2] Test that the page carries no invariant identifier, in test/doors/flow.test.ts
- [X] T016 [P] [US2] Test that a changed declaration changes the page, in test/doors/flow.test.ts
- [X] T017 [P] [US2] Test that writing outside the managed block survives regeneration, in test/doors/flow.test.ts

## Phase 5: The law

- [X] T018 Write MV-96's statement into .multivac/invariants.md, stating that the page binds nothing
- [X] T019 Anchor MV-96 to `renderFlow` and the write
- [X] T020 Write MV-96's `absent` leg keeping identifiers out of the renderer
- [X] T021 Anchor MV-96 to test/doors/flow.test.ts
- [X] T022 Run `verify` and confirm MV-96 resolves

## Phase 6: Documentation

- [X] T023 Document the page in site/content/docs/reference/commands.md
- [X] T024 Add the CHANGELOG entry

## Phase 7: Polish

- [X] T025 Run `pnpm test` and `verify --strict`

## Dependencies

Phase 2 blocks Phase 3. US2 is assertions plus one header, and depends on Phase 3.
