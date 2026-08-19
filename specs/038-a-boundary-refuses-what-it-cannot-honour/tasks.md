---

description: "Task list for a-boundary-refuses-what-it-cannot-honour"
---

# Tasks: A boundary refuses what it cannot honour

**Input**: Design documents from `specs/038-a-boundary-refuses-what-it-cannot-honour/`

**Tests**: requested. Three of the four are silent today, so each test asserts
the EFFECT — a shim still armed, a config refused, a floor read — rather than a
message.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build && pnpm test`
- [X] T002 Reproduce all four with the quickstart

## Phase 2: Foundational

- [X] T003 Write MV-114 in `.multivac/invariants.md` with its anchors, and retarget MV-108's and MV-91's legs that pin the `init` lines this package rewrites

## Phase 3: User Story 1 — init never disarms a gate it cannot read (P1)

- [X] T004 [US1] In `src/commands/init.ts`, load the config ONCE, distinguishing absent from broken, and refuse on broken before any projection
- [X] T005 [US1] Delete the other two `loadConfig(dir).catch(() => null)` calls and read the one result
- [X] T006 [US1] In `test/init/`, assert the shim keeps `--strict` when `init` meets a broken config, and that a brain with no config still scaffolds

## Phase 4: User Story 2 — an unknown config key is named (P1)

- [X] T007 [US2] In `src/lib/config.ts`, refuse a stray key at the top level and under `repos.<key>` and `graphers.<name>`, naming the near miss when one exists
- [X] T008 [US2] In `test/lib/`, assert `strict_prepush` is refused and names `strict_pre_push`, and that a legal config still loads

## Phase 5: User Story 3 — a floor with a comment is still a floor (P2)

- [X] T009 [US3] In `src/lib/version.ts`, allow a trailing comment on the `requires:` line
- [X] T010 [US3] Assert the floor is read with a comment, ignored when commented out, and refused by name when malformed

## Phase 6: User Story 4 — an adapter name is checked before it is written (P2)

- [X] T011 [US4] In `src/commands/init.ts`, refuse an `--sdd`/`--grapher` value that names no known adapter — the empty string included — with exit 2, before anything is written
- [X] T012 [US4] Assert both, and update any fixture naming a fictional adapter to a real one

## Phase 7: Polish

- [X] T013 `pnpm test` green with `mvac` off PATH; `verify --strict` 0 blocking broken with MV-114 anchored

## Dependencies

- T003 precedes the code.
- T004 blocks T005 and T011 (all three read the single load).

## Implementation strategy

US1 is the one that costs a gate, and it is also the one that deletes code. The
other three are one guard each.
