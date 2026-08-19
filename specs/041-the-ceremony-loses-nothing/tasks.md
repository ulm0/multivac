---

description: "Task list for the-ceremony-loses-nothing"
---

# Tasks: The ceremony loses nothing

**Input**: Design documents from `specs/041-the-ceremony-loses-nothing/`

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build && pnpm test`

## Phase 2: Foundational

- [X] T002 Write MV-117 with its anchors, and record on MV-107 that retirement is covered too

## Phase 3: US1 — a claim is not orphaned by its own close (P1)

- [X] T003 [US1] In `src/change/file.ts`, make the close gate refuse a claim whose anchors all come from the change file being archived
- [X] T004 [US1] Assert it, and assert a claim anchored in code still closes

## Phase 4: US2 — an archive is never overwritten (P2)

- [X] T005 [US2] In `archiveChange`, refuse when the destination exists
- [X] T006 [US2] Assert it

## Phase 5: US3 — a retired row is undeletable (P2)

- [X] T007 [US3] In `lawDeath`, cover `retired` as well as `active`, leaving `proposed` free
- [X] T008 [US3] Assert both directions

## Phase 6: US4 — a dropped key is said out loud (P3)

- [X] T009 [US4] Name the unknown frontmatter keys where they are dropped
- [X] T010 [US4] Assert it

## Phase 7: Polish

- [X] T011 `pnpm test` green with `mvac` off PATH; `verify --strict` 0 blocking broken with MV-117 anchored

## Dependencies

- T002 precedes the code.

## Implementation strategy

US1 first: it is the ceremony reporting success about the one thing it exists
to check.
