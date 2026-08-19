---

description: "Task list for the-row-is-read-from-its-end"
---

# Tasks: The row is read from its end

**Input**: Design documents from `specs/043-the-row-is-read-from-its-end/`

## Phase 1: Setup

- [x] T001 Baseline: `pnpm run build && pnpm test`
- [x] T002 Measure the corpus under both readings and record which rows differ

## Phase 2: Foundational

- [x] T003 Write MV-119 with its anchors
- [x] T004 One parser in src/anchor/parse.ts: id from the front, the last four columns from the end, statement is what is left

## Phase 3: US1 — enactment sees the row (P1)

- [x] T005 [US1] Assert a row whose body contains `|` and `||` parses to the state its author wrote
- [x] T006 [US1] Assert the enactment check names such a row when it reaches active

## Phase 4: US2 — the row cannot be deleted in silence (P1)

- [x] T007 [US2] Assert deleting such a row is refused when it is active, and when it is retired

## Phase 5: US3 — gating and retirement (P2)

- [x] T008 [US3] Assert a proposed row with a pipe does not gate
- [x] T009 [US3] Delete `lawRows` in src/change/reserve.ts and read the shared parser
- [x] T010 [US3] Delete the header-index read in src/doors/brain.ts and read the shared parser

## Phase 6: Polish

- [x] T011 `pnpm test` green with `mvac` off PATH; `verify` clean with MV-119 anchored

## Dependencies

- T004 precedes T009 and T010: both call what it returns.

## Implementation strategy

The parser first, then the two deletions it enables, then the four consumers
pinned by tests that use a piped row — the input no existing fixture has.
