# Tasks: The gate runs the code in this tree

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: US1 — the hook runs the multivac that governs this repo 🎯

- [X] T002 [US1] Reverse the runner order in the shim text in src/hooks/install.ts: repo build, then declared dependency, then PATH
- [X] T003 [US1] Restate the shim's header comment to say most-specific-first and why, so the order is not re-inverted by the next reader
- [X] T004 [P] [US1] Test that the shim text tries dist/cli.js before node_modules and node_modules before mvac, in test/hooks/runner.test.ts
- [X] T005 [P] [US1] Test that the repo's own gate still runs first and its exit code still wins, in test/hooks/runner.test.ts
- [X] T006 [P] [US1] Test that a shim with nothing runnable exits 0 and prints the INACTIVE report, in test/hooks/runner.test.ts

## Phase 3: US2 — a test run reflects the tree

- [X] T007 [US2] Clear both compiled output directories before compiling, in package.json, without adding a dependency
- [X] T008 [P] [US2] Test that every compiled test in the output has a source in the tree, in test/hooks/runner.test.ts
- [X] T009 [P] [US2] Test that the clean removes output whose source is gone, by planting an orphan and rebuilding, in test/hooks/runner.test.ts

## Phase 4: The law

- [X] T010 Write MV-92's statement into .multivac/invariants.md
- [X] T011 Anchor MV-92 to the runner order in src/hooks/install.ts
- [X] T012 Anchor MV-92 to the clean in package.json
- [X] T013 Anchor MV-92 to test/hooks/runner.test.ts
- [X] T014 Run `verify` and confirm MV-92 resolves

## Phase 5: Documentation

- [X] T015 [P] Document the runner order in site/content/docs/reference/hooks.md
- [X] T016 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T017 Run `pnpm test` and `verify --strict`
- [X] T018 Walk quickstart.md

## Dependencies

The two stories are independent: US1 touches the shim, US2 touches the build. Either ships alone. Phase 4 follows both.

## Parallel execution

US1 and US2 can be built concurrently; they share one test file, which is where they serialise.
