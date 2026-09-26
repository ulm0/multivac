# Tasks: Doors reach every harness and say the truth

**Feature**: specs/070-doors-reach-every-harness | **Branch**: `070-doors-reach-every-harness`

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included because this brain's law requires a check beside every claim
(Constitution Principle I), and `change close` verifies the anchors that those
tests protect.

## Phase 1: Setup

- [X] T001 Confirm the working tree is clean and the build runs: `git status --porcelain` empty and `pnpm build` green, from /Users/ulm0/Documents/Projects/personal/multivac
- [X] T002 Record the measured platform table as data by transcribing research.md R1 into a comment beside the graphify harness entry in src/adapters/registry.ts, naming graphify 0.9.29 and the date

## Phase 2: Foundational (blocking prerequisites)

- [X] T003 Write the law first (Principle III): in .multivac/invariants.md, state MV-143 in the reserved proposed row, using the statement declared in .multivac/changes/doors-reach-every-harness.md
- [X] T004 Amend MV-131's statement in .multivac/invariants.md to carry the link before the install, the rewrite on every equip and the redundant-platform skip, with a dated `**Amended 2026-09-25 by MV-143**` note, leaving its 2026-09-16 notes and their count anchor untouched
- [X] T005 Amend MV-140's statement in .multivac/invariants.md to require a section-writing platform for the citation, a truthful doctor repair line and a consumer law path that resolves, with a dated note by MV-143
- [X] T006 Move `linkDoor` from src/commands/doors.ts into the new src/doors/link.ts, exporting it unchanged in behavior, and import it back in src/commands/doors.ts
- [X] T007 [P] Add `section: 'canonical' | 'own-door' | 'none'` and optional `redundant` to the harness platform type in src/adapters/registry.ts, with the values research.md R1 measured: codex, opencode and amp canonical; claude and gemini own-door; agents, cursor and copilot none; redundant on cursor
- [X] T008 [P] Add an optional `retired` path to the `DoorTarget` type in src/adapters/registry.ts, for a file a `doors` run must unproject

## Phase 3: User Story 1 - The brain door reaches an agent working in a code repo (P1)

**Goal**: every declared symlink door exists before the grapher's own install writes there, so the vendor's section lands in the canonical door and the brain door is what the harness reads.

**Independent test**: equip a code repo that has `AGENTS.md` and no `CLAUDE.md`, then confirm `CLAUDE.md` resolves to `AGENTS.md`, the vendor section is in `AGENTS.md` once, and the managed block survives.

- [X] T009 [US1] In `installHarness` in src/adapters/refresh.ts, add the link pass inside the per-root loop, before the platform probe short-circuit: for every declared door whose target kind is `symlink`, call `linkDoor` and print the contract line from contracts/cli-output.md, keeping the read-only and no-harness skips above it
- [X] T010 [US1] Print the notice `linkDoor` returns as a `say` line scoped with the `graph <name> @ <scope>` label, so a regular file, a link pointing elsewhere and an unsupported platform each report without failing the run
- [X] T011 [P] [US1] Add a test in test/init/equip.test.ts: a declared repo with `AGENTS.md` and no `CLAUDE.md` ends with a symlink to `AGENTS.md` after equip, and the run says so
- [X] T012 [P] [US1] Add a test in test/init/equip.test.ts: a regular `CLAUDE.md` is left byte-identical and the run names it, per MV-108
- [X] T013 [P] [US1] Add a test in test/init/equip.test.ts: a read-only declared repo gets no link and no install
- [X] T014 [US1] Add the `unique` anchor for MV-143 on the link call in src/adapters/refresh.ts and on `export function linkDoor(` in src/doors/link.ts, in .multivac/invariants.md

## Phase 4: User Story 2 - Hook commands work on every machine, after any vendor install (P2)

**Goal**: the absolute-path rewrite runs on every equip, not only on the run that installs.

**Independent test**: write an absolute path into a hook file by hand in a root whose platforms are all installed, run any equipping command, and see the path bare and the rewrite reported.

- [X] T015 [US2] Restructure the per-root body of `installHarness` in src/adapters/refresh.ts so the install step is one unit that may return early and the hook rewrite always runs after it
- [X] T016 [P] [US2] Add a test in test/init/equip.test.ts: with every probe present, an absolute binary path in `.claude/settings.json` is rewritten to the bare name and the run reports it
- [X] T017 [P] [US2] Add a test in test/init/equip.test.ts: prose naming the tool without a path is untouched, guarding `bareBinary`'s existing boundary
- [X] T018 [US2] Add the MV-131 anchor for the rewrite's new position in .multivac/invariants.md, so a future return above it breaks the leg

## Phase 5: User Story 3 - A door states only what is true where it is read (P2)

**Goal**: a door cites the vendor's section only where a declared platform writes it, doctor names such a platform, and a consumer door names the law at the path that repo can open.

**Independent test**: render a door in a root whose platforms write no section and a consumer door in a repo with the brain mounted; neither carries a pointer that does not resolve there.

- [X] T019 [US3] In `grapherLines` in src/doors/brain.ts, compute `cites` from the platform's `section`: canonical, or own-door whose door target kind is `symlink`; otherwise print the verbs
- [X] T020 [US3] In src/commands/doctor.ts, choose the platform named in the missing-section repair line from the same rule, and print no such line when no declared platform writes the section
- [X] T021 [US3] Give `projectLawLines` and `sddLines` in src/doors/brain.ts a law-path prefix parameter, defaulting to empty for the brain door
- [X] T022 [US3] Pass `${mount}/` from `renderConsumerDoor` in src/doors/consumer.ts so every law path in a consumer door starts at the mount
- [X] T023 [P] [US3] Add a test in test/doors/doors.test.ts: with only the `agents` door declared, the brain door prints the graph verbs and does not cite `## graphify`; with `claude` declared, it cites the section
- [X] T024 [P] [US3] Add a test in test/doctor/ for the repair line naming a section-writing platform, and none when no platform writes it
- [X] T025 [P] [US3] Add a test in test/doors/doors.test.ts: a consumer door contains no bare `.multivac/invariants.md`, only the mounted path
- [X] T026 [US3] Add the MV-140 anchors for the `cites` rule, doctor's platform choice and the consumer prefix in .multivac/invariants.md

## Phase 6: User Story 4 - Cursor reads the canonical door, once (P3)

**Goal**: the Cursor target projects nothing beyond the canonical door, its old rules file is retired, and the vendor's redundant cursor platform is skipped where the section exists.

**Independent test**: project doors twice in a Cursor root and confirm no multivac rules file remains, a human's own text in that file survives, and the skip is reported when the section is present.

- [X] T027 [US4] Change `doorTargets.cursor` in src/adapters/registry.ts to `kind: 'native'` with `door: 'AGENTS.md'`, a note recording why, and `retired: '.cursor/rules/multivac.mdc'`
- [X] T028 [US4] In src/commands/doors.ts, unproject a target's `retired` path in one run: remove the managed block through the existing block mechanics, delete the file only when nothing else remains, and print the contract lines
- [X] T029 [US4] In `installHarness` in src/adapters/refresh.ts, run platforms whose `section` is canonical before deciding the skip, then skip a `redundant` platform when the canonical door carries `## <name>`, printing the skip line
- [X] T030 [P] [US4] Add a test in test/doors/registry.test.ts: the cursor target is native, names AGENTS.md and declares its retired path
- [X] T031 [P] [US4] Add a test in test/doors/doors.test.ts: a rules file holding only the managed block is deleted, and one holding a human's line keeps that line without the block
- [X] T032 [P] [US4] Add a test in test/init/equip.test.ts: with `## graphify` present in AGENTS.md, the cursor platform is skipped and reported; without it, the platform runs
- [X] T033 [US4] Add the MV-143 and MV-131 anchors for the native cursor target and the skip in .multivac/invariants.md

## Phase 7: Polish and cross-cutting

- [X] T034 [P] Update the door-target and grapher-platform reference tables in site/content/docs/reference/ so cursor reads AGENTS.md and the platform table carries the section column, keeping MV-131's existing site anchor line valid
- [X] T035 [P] Update DESIGN.md where it lists door kinds, and CHANGELOG.md with the behavior changes
- [X] T036 Run the whole suite and the law: `node --test test/` and `node dist/cli.js verify --strict`, both green
- [X] T037 Walk quickstart.md end to end in a scratch ecosystem with an isolated HOME, and record in the change file that each scenario matched
- [X] T039 [P] Make a door file a target no longer projects non-code for the gate in src/lib/code-in-change.ts, so the `doors` run that deletes it is not refused as code (FR-010), with a test in test/verify/code-in-change.test.ts
- [X] T038 Refresh the code graph with `graphify update .` so `change land` commits a current graph

## Dependencies

- Phase 1 before everything.
- Phase 2 blocks every story: T003 to T005 are the law before the code, T006 moves the shared function, T007 and T008 add the data every later rule reads.
- US1 (Phase 3) depends on T006 and T008. US2 (Phase 4) depends on T009's restructure landing first, because both edit the same loop body. US3 (Phase 5) depends on T007. US4 (Phase 6) depends on T007, T008 and T029's ordering on T009.
- Phase 7 last, and T036 must pass before `change land`.

## Parallel opportunities

- T007 and T008 together: same file, different types, no behavior yet.
- Within US1: T011, T012 and T013 in parallel once T009 and T010 land.
- Within US3: T023, T024 and T025 in parallel once T019 to T022 land.
- Across stories: US3's door work and US4's registry work touch different files and can proceed together once Phase 2 is done; US2 must wait for US1's restructure.

## Implementation strategy

US1 alone is the minimum that pays: it is the correction every later saving in a
consumer door depends on. Land it with its tests and anchors, then US2, which is
two lines of restructure and a test, then US3, which fixes the two false
statements, and finally US4, whose saving depends on a human confirming Cursor's
behavior and which can be dropped without touching the rest.
