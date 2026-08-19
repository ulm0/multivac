---

description: "Task list for a-paraphrase-ages-silently"
---

# Tasks: A paraphrase ages silently

**Input**: Design documents from `specs/035-a-paraphrase-ages-silently/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/retirement.md, quickstart.md

**Tests**: the prose is pinned by anchors rather than by unit tests — that is
the point of the change. The two code edits ship with assertions, and MV-111's
own tombstone is the regression test for the class.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build && pnpm test`, record the count
- [X] T002 Count every restatement with the "before" block of quickstart.md

## Phase 2: Foundational

- [X] T003 Write MV-111 in `.multivac/invariants.md`, with the `absent` legs that make the class self-detecting, excluding the amendment notes that quote the retired phrases

## Phase 3: User Story 1 — one question, one answer (P1)

- [X] T004 [US1] Correct `.specify/memory/constitution.md` Principle IV, bump CONSTITUTION_VERSION, and prepend a Sync Impact Report naming what moved
- [X] T005 [US1] Correct MV-85's and MV-86's bodies in place, marked as amendments
- [X] T006 [P] [US1] Correct `CONTRIBUTING.md` and `site/content/docs/reference/configuration.md`
- [X] T007 [P] [US1] Correct the header of `test/invariants/deps.test.ts` without breaking MV-02's leg on it

## Phase 4: User Story 2 — a row does not outlive its meaning (P1)

- [X] T008 [US2] MV-68: mark the "and nothing else" clause WITHDRAWN, naming MV-77, and retarget its `count=2` leg off the false sentence
- [X] T009 [US2] MV-84: make the headline state the enforced rule
- [X] T010 [US2] MV-82: six legs, not five
- [X] T011 [US2] MV-31: narrow the claim to what the frozen list checks, or widen the list — and say which
- [X] T012 [US2] MV-01: widen the tombstone to the directories `verify`, `doctor` and `doors` import

## Phase 5: User Story 3 — the skill teaches what the tool does (P1)

- [X] T013 [US3] `skills/multivac/references/change.md`: stages, not arrow edges; delete the "apply re-projects doors" claim; fix the gate table
- [X] T014 [US3] `skills/multivac/references/interview.md`: the interview's output goes OUTSIDE the managed block, and the file says why
- [X] T015 [US3] Re-project with `doors` so the `.claude` mirror stays byte-identical (MV-72)
- [X] T016 [P] [US3] `DESIGN.md`: correct `targets.yml` where it describes what shipped

## Phase 6: User Story 4 — the first minutes work (P2)

- [X] T017 [US4] `src/change/reserve.ts` (or wherever the refusal is worded): "untracked or modified", not "uncommitted edits"
- [X] T018 [US4] `src/commands/init.ts`: the closing report names committing the scaffold as a step
- [X] T019 [US4] Assert both in `test/init/`

## Phase 7: Polish & Cross-Cutting

- [X] T020 [P] `site/content/docs/guide/install.md` and `getting-started.md`: remove the citations of deleted tests and the stale init transcript
- [X] T021 `site/content/docs/reference/commands.md`: the `doors` section, which still says it takes no flags
- [X] T022 `pnpm test` green; `node dist/cli.js verify` 0 blocking broken with MV-111 anchored
- [X] T023 Re-run the quickstart counts: every retired phrase returns zero outside a recorded amendment

## Dependencies

- T003 first: its tombstones are what the rest is measured against.
- T015 must follow T013 and T014.
- Everything else is independent. [P]

## Implementation strategy

MVP is US1 + US2: they are the rows and documents a reader cites. US3 is the
artifact that multiplies, and US4 is the first thing a stranger meets.
