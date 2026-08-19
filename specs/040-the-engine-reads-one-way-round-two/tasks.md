---

description: "Task list for the-engine-reads-one-way-round-two"
---

# Tasks: The engine reads one way, round two

**Input**: Design documents from `specs/040-the-engine-reads-one-way-round-two/`

## Phase 1: Setup

- [ ] T001 Baseline: `pnpm run build && pnpm test`
- [ ] T002 Confirm no leg targets a tracked symlink, and that this repo tracks one

## Phase 2: Foundational

- [ ] T003 Write MV-116 with its anchors; record on MV-109 that both its ceilings are closed; amend MV-71 for the enumerator's new shape

## Phase 3: US1 — a heal never lands on prose (P1)

- [ ] T004 [US1] In `src/anchor/evaluate.ts`, fence heal candidates by the include's own trailing extension, keeping the `.multivac/` fence
- [ ] T005 [US1] When the fences empty the list, report what was refused instead of "found nowhere"
- [ ] T006 [US1] Assert both: a `.md` candidate is refused and named; a single `.ts` candidate still heals

## Phase 4: US2 — a symlink is not read twice (P2)

- [ ] T007 [US2] In `src/lib/git.ts`, read the mode in `lsFiles` and `lsTree` and skip `120000`/`160000`, keeping one entry per path
- [ ] T008 [US2] Assert a tracked symlink is absent from both, and that merge stages still collapse

## Phase 5: Polish

- [ ] T009 Update the four places the `moved` rule is written — commands.md, DESIGN.md, writing-anchors.md, claims-and-anchors.md — and the skill reference plus its mirror
- [ ] T010 `pnpm test` green with `mvac` off PATH; `verify --strict` 0 blocking broken with MV-116 anchored

## Dependencies

- T003 precedes the code. T004 precedes T005.

## Implementation strategy

US1 is the one that writes the law file, so it goes first.
