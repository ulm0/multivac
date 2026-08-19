---

description: "Task list for the-ledger-keeps-itself"
---

# Tasks: The ledger keeps itself

**Input**: Design documents from `specs/034-the-ledger-keeps-itself/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ledger.md, quickstart.md

**Tests**: requested. One existing test used `git add -A` around the step whose
defect this fixes, so it is replaced rather than extended — a sweep cannot see
an uncommitted write.

## Phase 1: Setup

- [ ] T001 Baseline: `pnpm run build && pnpm test`, record the count
- [ ] T002 Reproduce all five with the "before" block of quickstart.md

## Phase 2: Foundational

- [ ] T003 Write MV-110 in `.multivac/invariants.md` and amend MV-46 in place (a slug collides with the archive too); anchor MV-110 to each site and its test

## Phase 3: User Story 1 — a gate is satisfied by its own artifact (P1)

- [ ] T004 [US1] In `src/adapters/registry.ts`, change the four speckit artifact globs from `specs/*<slug>*/…` to `specs/*-<slug>/…`
- [ ] T005 [US1] In `test/change/sdd-gates.test.ts`, plant a directory containing the slug but not ending in it, and assert the gate still refuses

## Phase 4: User Story 2 — an archived slug is refused (P1)

- [ ] T006 [US2] In `src/commands/change.ts`, make `cmdNew` refuse a slug whose `changes/archive/<slug>.md` exists, naming it — the check `roadmap add` already performs
- [ ] T007 [US2] In `test/change/`, assert the refusal and that nothing was written

## Phase 5: User Story 3 — what it writes, it commits (P1)

- [ ] T008 [US3] In `src/commands/change.ts`, call `commitBookkeeping` after `saveChange` in `cmdLand`
- [ ] T009 [US3] In `src/commands/change.ts`, include the law path in the commit `close` prints, since `archiveChange` repoints its links on every close
- [ ] T010 [US3] In `test/change/lifecycle-polish.test.ts`, replace the `git add -A` with the command the tool prints, and assert the bookkeeping paths are clean afterwards

## Phase 6: User Story 4 — abandon tells the truth (P2)

- [ ] T011 [US4] In `src/commands/change.ts`, make `--abandon` name the repos that landed instead of asserting none did
- [ ] T012 [US4] In `test/change/`, assert an abandoned change with a landed repo does not say nothing landed

## Phase 7: User Story 5 — a failed tracker call is a failure (P1)

- [ ] T013 [US5] In `src/adapters/tracker.ts`, add `labelFlag` to `TrackerEntry` — `--label` for glab, `--add-label` for gh — and use it in `updateIssue`
- [ ] T014 [US5] In `src/commands/roadmap.ts`, report a failed update or close with the tool's own message, still never creating a second issue
- [ ] T015 [US5] In `test/change/tracker.test.ts`, assert the flag each vendor documents is the one sent, and that a failing call prints the failure

## Phase 8: Polish & Cross-Cutting

- [ ] T016 In `src/change/file.ts`, correct the scaffold's "Values round-trip unchanged" sentence — the lifecycle drops keys it does not know, and the file should say so
- [ ] T017 Update `site/content/docs/reference/graphers-and-sdd.md` and `commands.md` where they state how a gate matches and what `roadmap sync` reports
- [ ] T018 `pnpm test` green; `node dist/cli.js verify` 0 blocking broken with MV-110 anchored

## Dependencies

- T003 precedes the code.
- The five stories touch different functions and are independent. [P]

## Implementation strategy

MVP is US1 + US3: one accepts another change's work as proof, the other leaves
the brain dirty in a way that blocks the next command. US2, US4 and US5 are
each a single edit beside them.
