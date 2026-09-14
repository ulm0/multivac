---

description: "Task list for the-record-matches-the-release"
---

# Tasks: The record matches the release

**Input**: Design documents from `specs/044-the-record-matches-the-release/`

**Where the work happens**: after `change apply`, every edit lands in the change
worktree `.multivac/worktrees/the-record-matches-the-release/brain`, on branch
`the-record-matches-the-release`. The drafts were verified in a scratch clone of
`38fbee0`. Two places differ there, because `change new` has already written them:
the MV-120 row (the RESERVED statement replaces it in place) and the change file.

**Tests**: the feature adds no test. Its proof is `verify --strict`, the existing
suite (MV-78 and MV-72 tests included), and the bite run in `quickstart.md`.

## Phase 1: Setup

- [X] T001 Baseline in the main checkout: `node dist/cli.js verify --check --strict` gives 0 blocking broken, and `node dist/cli.js count` on leg 1 (contracts/legs.md) gives 4
- [X] T002 `node dist/cli.js change apply the-record-matches-the-release`; record the worktree path and branch it prints, and check `git -C <worktree> branch --show-current` is `the-record-matches-the-release`
- [X] T003 In the worktree, link `node_modules` from the main checkout (untracked, never committed) so `pnpm run build` and the suite run there

## Phase 2: Foundational — the row that governs the rest

- [X] T004 Replace the RESERVED MV-120 statement in .multivac/invariants.md with the stated rule from the verified draft: authority `specified`, state `proposed`, date 2026-09-13, source `changes/the-record-matches-the-release.md`
- [X] T005 Add MV-120's four legs under its row in .multivac/invariants.md, exactly as in contracts/legs.md

## Phase 3: US1 — the changelog says what 0.10.0 shipped (P1)

- [X] T006 [P] [US1] Rewrite the 0.10.0 section of CHANGELOG.md: add **Changed** (MV-112, MV-107 + MV-117, MV-114, MV-118) and **Fixed** (MV-105, MV-106, MV-108, MV-115, MV-114, MV-109, MV-116, MV-113, MV-110, MV-117, MV-119, MV-111 + MV-118), and keep the MV-50 bullet
- [X] T007 [P] [US1] Add the MV-72 bullet to the 0.2.0 **Added** group in CHANGELOG.md
- [X] T008 [US1] Check that each of MV-105 … MV-119 matches `\(MV-1NN[,)]` in CHANGELOG.md, and that every bullet's behaviour matches its row. Any sentence a row does not state is removed
- [X] T008a [US1] Independent adversarial review of every new CHANGELOG.md bullet against its row and against the code at tag `v0.10.0` (not the author's own reading); correct or cut every sentence the review refutes
- [X] T008b [US1] Tag-by-tag recount over every entry in CHANGELOG.md: 0 rows made law after 0.1.0 (active at a release's tag, not active at v0.1.0) and named by no entry at or before that release (SC-001)

## Phase 4: US2 — the law states the runner order the shim runs (P1)

- [X] T009 [US2] MV-14 in .multivac/invariants.md: the lead cites MV-92 ("in the order MV-92 states — most specific first"), and an `**Amended 2026-09-13 by MV-120**` note quotes the retired order and gives the reason (MV-92, MV-108, `touches: []`, legs pin existence not order)
- [X] T010 [P] [US2] DESIGN.md (§ hooks, ~:383): the order is build (only when the repo is multivac, MV-108) → `npx --no-install multivac` → `mvac` on PATH, citing MV-92
- [X] T011 [P] [US2] site/content/docs/guide/install.md (~:40 and ~:86): both passages state the order in force; "look for `mvac` first" becomes "look for `mvac` last"
- [X] T012 [P] [US2] site/content/docs/reference/hooks.md (~:225): "Installed is not enforcing" cites [Which multivac runs](#which-multivac-runs-mv-92) instead of restating the order
- [X] T013 [US2] `node dist/cli.js count` on leg 1 gives 0 matches in the worktree

## Phase 5: US3 — the law does not call a fixed defect unfixed (P2)

- [X] T014 [US3] MV-111 in .multivac/invariants.md: append an `**Amended 2026-09-13 by MV-120**` note that WITHDRAWS the "unfixed" ceiling, names MV-112, and leaves the remaining gaps to MV-112's ceilings. Do not delete the original clause

## Phase 6: US4 — the constitution states its own version (P2)

- [X] T015 [US4] .specify/memory/constitution.md: prepend the 2.0.1 → 2.0.2 PATCH Sync Impact Report ("a statement of fact corrected") and set the footer to `**Version**: 2.0.2 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-09-13`

## Phase 7: US5 — the rule is law, with its limits stated (P3)

- [X] T016 [US5] Re-read MV-120 against the landed edits: evidence, rule in three halves, "What is mechanical", ceilings. The statement contains neither `Amended 2026-09-13 by MV-120` nor MV-14's old lead
- [X] T017 [US5] Bite run in a scratch clone of the branch (quickstart.md). With MV-120 `active` and the change file moved aside, revert each fix in turn — docs, MV-14 lead, one note, footer — and confirm each gives exit 1 on its leg. Never run this in the real repository

## Phase 8: Polish, landing and close

- [X] T018 In the worktree: `pnpm run build`, `node dist/cli.js verify --strict` (0 blocking broken; MV-120 ok — its legs read pending only when broken, and never block while proposed), and `node --test "dist-test/**/*.test.js"` all pass
- [X] T019 Commit on the branch in the worktree, staging only the six edited files, the specs tasks ledger and .multivac/invariants.md (message cites MV-120)
- [X] T020 /speckit.converge until Converged; fix any drift it surfaces on the branch (/speckit.analyze ran before implementing, as `change apply` prints)

## After the tasks — the lifecycle, not the ledger

These are lifecycle commands rather than work items, so they carry no box: a
box ticked before `change close` runs would be the self-graded claim this
ledger's own close gate reads.

1. In the main checkout: `git merge --no-ff the-record-matches-the-release`, then
   `node dist/cli.js change land the-record-matches-the-release --landed brain`.
2. `node dist/cli.js change close the-record-matches-the-release`; commit the
   archive with the pathspec it prints; `verify --strict` on main shows 0
   blocking broken and MV-120 still `proposed`.
3. Enactment (MV-120 → `active`, alone in its own commit, MV-81) and any push
   are the human's.

## Dependencies

- T002 precedes every edit.
- T004 and T005 precede T016 and T017.
- T009 and T014 must both be in place before leg 3 (count=2) is green.
- T010–T012 must be in place before T013.
- T018 precedes T019; T019 and T020 precede the lifecycle steps.

## Parallel opportunities

- T006, T007, T010, T011, T012 and T015 touch different files.
- T009 and T014 touch the same file (.multivac/invariants.md), so they run in sequence.

## Implementation strategy

US1 and US2 are P1: they are the records readers are misled by today. US3 and
US4 are one note and one report. US5 is the row that stops all four from coming
back. MVP is US1 alone, but the change lands only as a whole, because MV-120's
legs describe every edit.
