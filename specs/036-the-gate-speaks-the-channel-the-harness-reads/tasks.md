---

description: "Task list for the-gate-speaks-the-channel-the-harness-reads"
---

# Tasks: The gate speaks the channel the harness reads

**Input**: Design documents from `specs/036-the-gate-speaks-the-channel-the-harness-reads/`

**Tests**: requested, and one of them must RUN the projected string. The defect
is a command that looked right and delivered nothing; the existing CLI-level
captures merge both streams, so a channel regression is invisible to them.

## Phase 1: Setup

- [ ] T001 Baseline: `pnpm run build && pnpm test`, record the count
- [ ] T002 Measure the three commands against a stub on a constructed PATH, per quickstart.md

## Phase 2: Foundational

- [ ] T003 Write MV-112 in `.multivac/invariants.md` with its anchors, including the ceilings the row must state

## Phase 3: User Stories 1 and 2 — the two channels (P1)

- [ ] T004 [US1] In `src/doors/settings.ts`, replace `HOOK_CMD` with `VERIFY` plus `SESSION_GATE` and `EDIT_GATE`, each carrying the contract in its comment — the comments are what MV-112 pins
- [ ] T005 [US1] Project `SESSION_GATE` at `SessionStart` and `EDIT_GATE` at `PostToolUse`
- [ ] T006 [US1] Update the module header and the duplicate notice to name the engine rather than the removed constant
- [ ] T007 [US1] In `test/doors/settings.test.ts`, add the runnable proof: a stub `mvac` on a CONSTRUCTED PATH, both commands executed, exit codes and streams asserted, including the no-binary case

## Phase 4: User Story 3 — an existing brain upgrades (P1)

- [ ] T008 [US3] Widen `ownsVerify` to the three exact strings, with the upgrade path in its comment
- [ ] T009 [US3] In `test/doors/settings.test.ts`, assert a legacy bare entry on each event is rewritten in place, one entry, matcher untouched, and that a second merge is byte-identical
- [ ] T010 [US3] Update the existing assertions that quote the bare command, in `settings.test.ts` and `doors.test.ts`

## Phase 5: Polish & Cross-Cutting

- [ ] T011 Re-project this repository's own `.claude/settings.json` by running `doors` — never by hand — and commit it
- [ ] T012 Update `site/content/docs/reference/hooks.md` and `integrations.md` so they quote what is projected, with the reason
- [ ] T013 `pnpm test` green with `mvac` off PATH, the way CI runs it
- [ ] T014 `node dist/cli.js verify --strict` 0 blocking broken, MV-112 anchored

## Dependencies

- T003 precedes the code (Constitution III).
- T004 blocks T005 and T008.
- T011 must follow T004–T008, since it runs the new projection.

## Implementation strategy

US1 and US2 are one edit — the two constants and where they are projected. US3
is the predicate beside them, and it is not optional: without it every existing
brain gets a second gate rather than a working one.
