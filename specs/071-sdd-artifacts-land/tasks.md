# Tasks: What the SDD writes in the brain lands with the change

**Feature**: specs/071-sdd-artifacts-land | **Branch**: `071-sdd-artifacts-land`

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included: every claim here lands with a check (Constitution I).

## Phase 1: Setup

- [ ] T001 Confirm a clean tree and a green build from the repo root: `git status --porcelain` empty, `pnpm build` exit 0

## Phase 2: Foundational (blocking prerequisites)

- [ ] T002 Write MV-144 into its reserved row in .multivac/invariants.md, using the statement declared in .multivac/changes/sdd-artifacts-land.md
- [ ] T003 Amend MV-142's statement in .multivac/invariants.md so the harness directories come from the declared scaffold's integrations, with a dated note by MV-144, leaving its existing anchors matching
- [ ] T004 [P] Add a measured `dirs` field to every integration entry of both adapters in src/adapters/registry.ts, with the versions and the two exceptions recorded in a comment (research.md R5)
- [ ] T005 [P] Extract and export `slugArtifactDirs(repoDir, spec, slug)` from `planCarry` in src/change/carry.ts, leaving the carry's behavior identical

## Phase 3: User Story 1 - The proof of a step lands with the change (P1)

**Goal**: the commit close prints carries the SDD artifacts the closing slug owns.

**Independent test**: close a change whose feature directory is on disk and confirm the pathspec covers it, including a deletion inside it.

- [ ] T006 [US1] In `cmdClose` in src/commands/change.ts, after the graph pass, ask `slugArtifactDirs` for the brain's directories for this slug and read `git status --porcelain=v1 -z --untracked-files=all` there
- [ ] T007 [US1] Add every status path inside those directories to the archive commit's pathspec, deletions included, and keep the existing entries first
- [ ] T008 [US1] Name a dirty tracked path of the SDD's shared set that lies outside those directories on its own line, and never stage it (MV-46)
- [ ] T009 [US1] Leave the pathspec byte-identical when no root resolves an SDD, when `sdd_auto: false`, or when `--no-sdd` was passed
- [ ] T010 [P] [US1] Add a test in test/change/close.test.ts or the closest existing close suite: the printed pathspec names the feature directory's untracked spec, plan and tasks files
- [ ] T011 [P] [US1] Add a test: a file deleted inside the feature directory appears in the pathspec
- [ ] T012 [P] [US1] Add a test: a dirty constitution is named and absent from the pathspec
- [ ] T013 [P] [US1] Add a test: with no SDD declared the pathspec is exactly the four entries it is today
- [ ] T014 [US1] Add the MV-144 anchors for the status read and the pathspec extension in .multivac/invariants.md

## Phase 4: User Story 2 - A repo the lifecycle just made is equipped before its artifacts move (P2)

**Goal**: clone or create, then equip, then branch and carry.

**Independent test**: apply a change naming a repo that is not on disk and read the order of the printed lines.

- [ ] T015 [US2] Split the workspace loop in `cmdApply` in src/commands/change.ts: one pass clones or creates every missing named repo, then `equip`, then a second pass makes each worktree and carries
- [ ] T016 [US2] Keep the status bump and its bookkeeping commit exactly where they are, before any branch is made
- [ ] T017 [P] [US2] Add a test in test/change/ that applies a change naming a greenfield repo and asserts the created line precedes the equip lines, which precede the carry line
- [ ] T018 [US2] Add the MV-144 anchor for the apply order in .multivac/invariants.md

## Phase 5: User Story 3 - The directories a declared tool installs into are not code (P2)

**Goal**: the non-code set is derived from the declared integrations.

**Independent test**: a fresh brain with openspec declared and no grapher passes its own step zero commit.

- [ ] T019 [US3] In `nonCodeGlobs` in src/lib/code-in-change.ts, add the `dirs` of the integrations the declared doors resolve to for each declared SDD, plus the fallback's when no declared door maps
- [ ] T020 [P] [US3] Add a test in test/verify/code-in-change.test.ts: with openspec declared, a path under a directory its declared integration writes is not code, and a path under a directory no declared integration names still is
- [ ] T021 [P] [US3] Extend the step zero test in test/init/equip.test.ts to the openspec-with-no-grapher shape that is refused today
- [ ] T022 [US3] Add the MV-142 and MV-144 anchors for the derivation in .multivac/invariants.md

## Phase 6: Polish and cross-cutting

- [ ] T023 [P] Correct the close paragraph of skills/multivac/references/change.md, which says close stages the change file, the law and the graphs, and run `mvac doors` so the committed mirror under .claude/skills matches (MV-72)
- [ ] T024 [P] Update the commands reference page for close's pathspec and CHANGELOG.md with the three behavior changes
- [ ] T025 Run the suite and the law: `node --test "dist-test/**/*.test.js"` and `node dist/cli.js verify --strict`, both green
- [ ] T026 Walk quickstart.md in a scratch ecosystem with an isolated HOME, including the openspec step zero, and record in the change file what matched
- [ ] T027 Refresh the code graph with `graphify update .`

## Dependencies

- T002 to T005 block every story: the law first, then the data and the extraction both stories read.
- US1 depends on T005. US2 is independent of US1 and touches the same file, so land US1's close edits before US2's apply edits to keep the diff readable. US3 depends on T004.
- Phase 6 last; T025 must pass before `change land`.

## Parallel opportunities

- T004 and T005 together: different files, no behavior yet.
- US1's tests T010 to T013 in parallel once T006 to T009 land.
- US3 is independent of US1 and US2 once T004 is in.

## Implementation strategy

US1 is the one that pays every change: without it the lifecycle asks for proof
and then drops it. US2 and US3 are one-time costs per repo and per ecosystem
shape, and either can be dropped without touching the others.
