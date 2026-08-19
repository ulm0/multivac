---

description: "Task list for presence-is-not-identity"
---

# Tasks: Presence is not identity

**Input**: Design documents from `specs/032-presence-is-not-identity/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ownership.md, quickstart.md

**Tests**: requested. Three of the five defects are "the tool reported it
checked"; a test that asserts the report rather than the effect would reproduce
exactly that mistake, so US1 and US2 assert the EFFECT — content survival, and a
`dist/cli.js` that leaves evidence if it runs.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build && pnpm test`, and record the count
- [X] T002 Reproduce all five with the "before" block of quickstart.md

## Phase 2: Foundational

- [X] T003 Write MV-108 in `.multivac/invariants.md` and amend MV-92 in place with its ceiling (FR-010), anchoring MV-108 to the shim, the shared predicate, the stub branch and their tests
- [X] T004 In `src/hooks/install.ts`, export the shim's managed header as a named constant and a predicate that answers "did multivac write this hook"
- [X] T005 In `src/hooks/install.ts`, add one shared `runsMultivac(text)` — the mention on a line whose first non-space character is not `#`

## Phase 3: User Story 1 — a door never eats what the operator wrote (P1)

- [X] T006 [US1] In `src/commands/doors.ts`, make the `stub` branch read the file first and pass it to `applyManagedBlock`, writing frontmatter only when the file was absent
- [X] T007 [US1] In `src/doors/block.ts`, take the file path and name it in the malformed-block error (FR-009), and pass it at every call site
- [X] T008 [US1] In `test/doors/`, assert operator content survives a `doors` run and a second one, and that the malformed-block error names the file

## Phase 4: User Story 2 — the hook runs multivac, or nothing (P1)

- [X] T009 [US2] In `src/hooks/install.ts`, gate the first runner rung on `$root/package.json` naming multivac — in the shim (sh) and in `findRunner` (Node), which are a declared mirror pair
- [X] T010 [US2] In `test/init/hook-shim.test.ts`, assert a repo whose `dist/cli.js` would leave evidence never has it executed, and that a repo whose package.json names multivac still uses its build

## Phase 5: User Story 3 — "armed" means armed (P1)

- [X] T011 [US3] In `src/commands/doctor.ts`, replace the local regex with the shared predicate from T005
- [X] T012 [US3] In `test/doctor/`, assert a hook mentioning multivac only in a comment is reported as not running it, and that `--strict` does not call the gate armed

## Phase 6: User Story 4 — a shim we wrote is a shim we may rewrite (P2)

- [X] T013 [US4] In `installAlongside`, regenerate an existing hook that carries our header; keep "wired" for a foreign hook that runs multivac, and the refusal for one that does not
- [X] T014 [US4] In `test/init/coexist.test.ts`, assert `strict_pre_push` reaches an already-installed multivac shim, and that a foreign hook is still never rewritten

## Phase 7: User Story 5 — `init` does not undo `doors` (P2)

- [X] T015 [US5] In `src/commands/init.ts`, pass the config's strictness to `installHooks`, and stamp `.multivac/projected.yml` only when it is absent
- [X] T016 [US5] In `test/init/reinit.test.ts`, assert both: the shim stays strict and the record does not move

## Phase 8: Polish & Cross-Cutting

- [X] T017 Update `site/content/docs/reference/hooks.md` and `integrations.md` where they describe the runner order and what a projection owns
- [X] T018 `pnpm test` green, with any test asserting the old behaviour updated rather than deleted
- [X] T019 `node dist/cli.js verify` in this brain: 0 blocking broken, MV-108 anchored

## Dependencies

- T003 precedes the code (Constitution III).
- T004/T005 block T011 and T013.
- The five stories are otherwise independent and touch different files.

## Parallel opportunities

- US1 (doors.ts, block.ts), US2 (install.ts shim), US5 (init.ts) touch
  different files and can proceed in parallel once Phase 2 lands. [P]
- T017 is documentation. [P]

## Implementation strategy

MVP is US1 + US2: one destroys user data on every run, the other executes an
unrelated program. US3–US5 are the same discipline applied where the cost is a
gate that quietly does not fire.

## Phase 9: Convergence

- [X] T020 Pin SC-004 (partial): an existing multivac shim is regenerated so `strict_pre_push` reaches it, and a foreign hook is still never rewritten
- [X] T021 Pin SC-005 (partial): `init` run twice leaves the shim strictness and `.multivac/projected.yml` exactly as `doors` left them
