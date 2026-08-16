# Tasks: The merge keeps what it did not write

**Input**: [plan.md](plan.md), [spec.md](spec.md)
**Branch**: `the-merge-keeps-what-it-did-not-write`

Phases run in order. Within a phase, `[P]` marks tasks that touch different
files and can run in parallel.

## Phase 1: Failing tests first (US1, US2, US3)

The defect is reproducible from the exported function alone, so the regression
pins come before the fix and must fail against the current code.

- [X] **T001** In `test/doors/settings.test.ts`, add `a foreign entry that
  mentions the marker is left alone` — a pre-existing `{matcher: 'Bash', hooks:
  [{command: 'mvac verify --strict'}, {command: 'my-own-linter'}]}` must come
  back with all three parts intact, and the project's own entry must be a
  separate, appended entry. (US1, FR-001, FR-002, FR-004, FR-005)
- [X] **T002** In the same file, add the sibling-and-matcher case for the refresh
  hook: a user command added beside the project's refresh hook survives an update
  that changes the grapher, the entry's matcher is untouched, and exactly one
  refresh command remains. (US2, FR-003, FR-004, FR-005)
- [X] **T003** In the same file, add `a duplicate is reported, never deleted` —
  two entries each carrying the exact check command yield one notice naming the
  event and the count, and both entries survive the merge. (US3, FR-008)
- [X] **T004** In the same file, extend the grapher-removal test: the refresh hook
  is removed from an entry that also holds a user command, and that entry — and
  the user command in it — survives. (US2 scenario 3, FR-010)

Depends on: nothing. Blocks: Phase 2.

## Phase 2: The fix (US1, US2)

- [X] **T005** In `src/doors/settings.ts`, replace the marker-substring
  `ourEntry` with hook-level ownership: an `owns(command): boolean` predicate per
  hook the project installs — whole-string equality for the check command,
  generated-prefix match on the lock preamble for the refresh command. Carry the
  sentence `owns only the entry it wrote` in the comment that explains it, and
  leave no `command.includes(marker)` anywhere in the file. (FR-001, FR-002,
  FR-003)
- [X] **T006** In the same file, rewrite `ensureEvent`: find the owned hook
  object across the event's entries, set its `command` in place, and return
  without touching the entry's matcher or its sibling hooks. Append a fresh entry
  — with the matcher — only when nothing is owned. (FR-004, FR-005, FR-006,
  FR-007)
- [X] **T007** In the same file, rewrite the no-grapher removal branch to drop
  every owned refresh hook from its entry, dropping the entry itself only when it
  is left with no hooks. (FR-010)
- [X] **T008** In the same file, count owned check hooks per event and return
  `{ text, notices }` from `mergeClaudeSettings`, with a notice naming the event,
  the count, and why the tool will not delete. (FR-008)

Depends on: Phase 1. Blocks: Phase 3.

## Phase 3: The report reaches a person (US3)

- [X] **T009** In `src/commands/doors.ts`, adapt `installHookConfig` to the new
  return shape and push the merge's notices into the per-target notices `doors`
  already prints. (FR-009)

Depends on: T008. Blocks: Phase 4.

## Phase 4: Law and documentation

- [X] **T010** In `.multivac/invariants.md`, amend MV-52 so its statement says
  the merge preserves foreign keys **and foreign entries**, dated 2026-08-16.
  (FR-012)
- [X] **T011** In `.multivac/invariants.md`, restate MV-74 so it says what the
  code does — hook-level ownership, the two exact identities, the matcher written
  once, the duplicate reported — and fix its anchor legs against the code
  actually written: the ownership comment, the tombstones on the substring test
  and the matcher rewrite, the notice plumbing, the tests from Phase 1 and the
  documented rule. The row stays `open | proposed`: a human enacts it at close.
  (FR-012)
- [X] **T012** [P] In `site/content/docs/reference/hooks.md`, state the ownership
  rule where the merge is described. (FR-011)
- [X] **T013** [P] In `site/content/docs/reference/integrations.md`, state the
  same rule where the `claude` merge is described. (FR-011)

Depends on: Phase 2 (the legs must resolve against real code).

## Phase 5: Green

- [X] **T014** `pnpm run build && pnpm test` — every test passes, including the
  four added in Phase 1.
- [X] **T015** `node dist/cli.js verify --strict` exits 0 with MV-74's legs and
  MV-52's amended legs resolving.

Depends on: every phase above.
