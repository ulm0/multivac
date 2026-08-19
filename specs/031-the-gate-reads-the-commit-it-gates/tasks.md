---

description: "Task list for the-gate-reads-the-commit-it-gates"
---

# Tasks: The gate reads the commit it gates

**Input**: Design documents from `specs/031-the-gate-reads-the-commit-it-gates/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/index-reads.md, quickstart.md

**Tests**: requested, and at hook level. SC-001 says so for a reason: the defect
lives in the environment a hook runs under, so a test that calls the check
directly would pass while the defect survived untouched.

## Phase 1: Setup

- [ ] T001 Confirm the baseline: `pnpm run build && pnpm test`, 529 tests pass
- [ ] T002 Reproduce both halves with a scratch repo and a printing pre-commit hook, per research.md measurements 1 and 4

## Phase 2: Foundational

**Blocking**: the law rows first (Constitution III), then the git helper both
user stories read.

- [ ] T003 Write MV-106 and MV-107 in `.multivac/invariants.md`, turning the reserved ids into stated rules, and anchor them to `src/lib/git.ts`, `src/commands/verify.ts` and their hook-level tests
- [ ] T004 In `src/lib/git.ts`, add a memoised resolution of the ambient repo — `GIT_DIR` resolved to an absolute git directory, compared with `samePath` from `src/lib/paths.ts` — returning null when `GIT_DIR` is unset
- [ ] T005 In `src/lib/git.ts`, give `run()` an opt-in that keeps `GIT_INDEX_FILE` (and only it) when the target repo is the ambient one; every other pointer stays dropped for every call

## Phase 3: User Story 1 — `git commit -a` is gated (P1)

**Goal**: MV-81 and MV-97 see the paths the commit contains.

**Independent test**: a real installed hook refuses a `git commit -a` that it
refuses under a plain `git commit`.

- [ ] T006 [US1] In `src/commands/verify.ts`, have `stagedPaths` opt in to the ambient index, and make the same read serve the `cat-file blob :<path>` calls that ask about the index version
- [ ] T007 [US1] In `test/verify/enact.test.ts`, add the hook-level case: a row reaching active beside its code, committed with `git commit -a`, is refused
- [ ] T008 [US1] In `test/verify/config-gate.test.ts`, add the same form for MV-97: a config edit committed with `-a` is seen
- [ ] T009 [P] [US1] Add or extend a test proving FR-002 did not regress: during a brain hook run, each sibling repo still reports its own state

## Phase 4: User Story 2 — a pathspec commit is judged on what it contains (P2)

- [ ] T010 [US2] In `test/verify/enact.test.ts`, stage two paths, commit one by pathspec, and assert the verdict is about the committed path alone

## Phase 5: User Story 3 — the law cannot die quietly (P1)

**Goal**: a row leaving `active`, or the law file leaving the commit, is refused.

**Independent test**: `git rm .multivac/invariants.md && git commit` is refused;
so is deleting one active row; retiring one is not.

- [ ] T011 [US3] In `src/commands/verify.ts`, extend the HEAD-vs-index read in `enactmentLine` so rows `active` at HEAD and absent from the index are collected beside the rows that reached active
- [ ] T012 [US3] Emit the refusal as its own diagnostic line, naming the ids and pointing at retirement rather than deletion, gating like every other blocking finding (exit 1)
- [ ] T013 [US3] Handle the whole-file case: an index that removes the law file is the same refusal, worded for the file
- [ ] T014 [US3] Keep the unanswerable states unanswered — no HEAD, unreadable index, law absent from this checkout — and never gate there
- [ ] T015 [US3] In `test/verify/enact.test.ts`, assert all four transitions from data-model.md: row deleted (refused), file deleted (refused), row retired (allowed), proposed row dropped (allowed)

## Phase 6: Polish & Cross-Cutting

- [ ] T016 Update `site/content/docs/reference/commands.md` so `verify`'s exit matrix and diagnostic list name the law-death refusal beside the enact and config lines
- [ ] T017 Run `pnpm test`; every test passes, and any test that asserted the old silence is updated rather than deleted
- [ ] T018 Run `node dist/cli.js verify` in this brain: 0 blocking broken, MV-106 and MV-107 anchored

## Dependencies

- T003 precedes the code (Constitution III).
- T004 blocks T005; T005 blocks T006; T006 blocks US1 and US2's assertions.
- US3 (T011–T015) depends on T006 only in the sense that both read the index; the
  death check is otherwise independent and could ship alone.

## Parallel opportunities

- T009 is a different test file from T007/T008. [P]
- T016 is documentation and is parallel with everything after T012. [P]

## Implementation strategy

MVP is US1 + US3 together: they are the two silent-bypass halves, and they land
in the same two files. US2 is one extra assertion once US1's read is correct.
