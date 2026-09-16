# Tasks: Every command that sets a repo up equips it

## Phase 1: Setup
- [X] T001 `change apply`, symlink `node_modules`, build in the worktree

## Phase 2: Tests first
- [X] T002 [US1] `test/repos/equip.test.ts`: sync equips a writable sibling (stubs); a read-only one gets nothing; a missing binary exits 1 naming the repo while the rest still sync; a second sync runs no tool
- [X] T003 [US2] `test/change/equip-new.test.ts`: `change new` with `specify` missing exits 1, and there is no change file, no reserved row and no new commit; `--no-sdd` skips the SDD requirement; an installed tool requires nothing — and `--no-sdd` leaves a missing grapher a notice
- [X] T004 [US3] plan equips a repo it clones, and apply equips a greenfield repo it creates

## Phase 3: Implementation
- [X] T005 `src/adapters/equip.ts`: `toolsToRun`, `missingTools`, `equip`
- [X] T006 init uses `toolsToRun` and `equip`
- [X] T007 `change.ts`: refusal at the top of `cmdNew`, `equip` in `gateSdd` and `cmdNew`, and after the clone loops in `cmdPlan` and `cmdApply` — narrowed during implementation: `change new` refuses over the SDD only; a missing grapher stays a notice there (no printed step needs it) and `change close` refuses a missing graph (MV-90); the 7 existing tests that opened changes without a grapher binary keep passing
- [X] T008 `repos.ts`: missing-tools lines and `equip` after the sync lines, exit 1 on missing tools

## Phase 4: Law and docs
- [X] T009 MV-129 row and legs; move MV-87's and MV-128's call legs to `equip`; MV-75 note; bite every leg under `--strict` — 13 breaking edits over MV-129 and the moved MV-87/MV-128 legs, all failing under --strict
- [X] T010 Site: the `repos sync` section of `commands.md`, the scaffold and first-build text in `graphers-and-sdd.md`, `change new` refusal

## Phase 5: Land
- [X] T011 Full suite CI-like and on the host, `verify --strict`, a real run with spec-kit and graphify in scratch — 714 pass CI-like and on the host; real spec-kit 1.0.7 and graphify 0.9.29: sync scaffolded and built api, a second sync ran nothing
- [X] T012 Commit, merge, land, close, MR — merged, landed and closed; MR from close-equip-on-sync-and-lifecycle
