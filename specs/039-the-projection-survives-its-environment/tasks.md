---

description: "Task list for the-projection-survives-its-environment"
---

# Tasks: The projection survives its environment

**Input**: Design documents from `specs/039-the-projection-survives-its-environment/`

**Tests**: requested. Two of the four are silent, so those assert the effect —
a hook that ran, a repo that was still projected.

## Phase 1: Setup

- [ ] T001 Baseline: `pnpm run build && pnpm test`
- [ ] T002 Measure `--git-dir` against `--git-common-dir` in both checkout shapes

## Phase 2: Foundational

- [ ] T003 Write MV-115 with its anchors; narrow MV-73's headline to the mirror it prunes; retarget MV-108's doctor leg

## Phase 3: US1 — a linked worktree runs the repo's own gates (P1)

- [ ] T004 [US1] In `src/hooks/install.ts`, resolve the chain probe through `--git-common-dir`, and rewrite the docstring that claims worktrees resolve
- [ ] T005 [US1] The same in `gitHooksDir`, so `doctor` names the directory git will use
- [ ] T006 [US1] Requote the shim in `site/content/docs/reference/hooks.md` from the generator
- [ ] T007 [US1] Assert it in a real linked worktree

## Phase 4: US2 — a declared command means one thing (P2)

- [ ] T008 [US2] In `src/adapters/refresh.ts`, run the declared command through a shell, with the ceiling in the comment

## Phase 5: US3 — one mangled file is one notice (P2)

- [ ] T009 [US3] In `src/doors/block.ts`, find every marker and refuse a second pair
- [ ] T010 [US3] Catch at every `applyManagedBlock` call site and report the file
- [ ] T011 [US3] Assert a mangled door in one repo does not starve the next

## Phase 6: US4 — armed means armed (P2)

- [ ] T012 [US4] In `src/commands/doctor.ts`, judge our own shim with `runsMultivac`
- [ ] T013 [US4] Assert a gutted shim is not armed

## Phase 7: Polish

- [ ] T014 `pnpm test` green with `mvac` off PATH; `verify --strict` 0 blocking broken with MV-115 anchored

## Dependencies

- T003 precedes the code. T009 precedes T010.

## Implementation strategy

US1 is the one that disables somebody else's gate, so it goes first. The rest
are one guard each.
