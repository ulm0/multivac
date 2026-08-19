---

description: "Task list for the-sentences-are-true"
---

# Tasks: The sentences are true

**Input**: Design documents from `specs/042-the-sentences-are-true/`

## Phase 1: Setup

- [ ] T001 Baseline: `pnpm run build && pnpm test`
- [ ] T002 Measure every command's exit on an unloadable config

## Phase 2: Foundational

- [ ] T003 Write MV-118 with its anchors, and amend MV-85 to describe the argument handling that exists

## Phase 3: US1 — the documented exit (P1)

- [ ] T004 [US1] `seed`, `repos` and `roadmap` exit 2 on a ConfigError
- [ ] T005 [US1] Assert all three, and that `doors` and `doctor` still exit 1

## Phase 4: US2 — doctor keeps its own promise (P2)

- [ ] T006 [US2] Keep `collectBrainAnchors`' diagnostics and gate on them
- [ ] T007 [US2] Assert a malformed anchor makes bare `doctor` exit 1, naming it

## Phase 5: US3 — the guide stops losing work (P1)

- [ ] T008 [US3] `session-zero.md`: interview output lands outside the managed block

## Phase 6: Polish

- [ ] T009 `pnpm test` green with `mvac` off PATH; `verify --strict` 0 blocking broken with MV-118 anchored

## Dependencies

- T003 precedes the code.

## Implementation strategy

US1 and US2 are the code honouring what was written. US3 is one paragraph and
is P1 because following it loses work.
