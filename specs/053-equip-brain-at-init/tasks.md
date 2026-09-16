# Tasks: init equips the brain it scaffolds

## Phase 1: Setup
- [X] T001 `multivac change apply equip-brain-at-init`, symlink `node_modules`, build in `.multivac/worktrees/equip-brain-at-init/brain`

## Phase 2: Tests first
- [X] T002 [US1] In `test/init/equip.test.ts` with stub `specify`/`graphify` on a built PATH: `init --sdd speckit --grapher graphify` leaves `.specify/integration.json` and `graphify-out/graph.json`, each tool runs once, a re-run runs neither
- [X] T003 [US1] In `test/init/equip.test.ts`: `sdd_auto: false` in a kept config runs no SDD init; `--sdd opsx` executes nothing
- [X] T004 [US2] In `test/init/equip.test.ts`: `PATH=/usr/bin:/bin` with `--sdd speckit` exits 1 naming `github.com/github/spec-kit`, creates no `.multivac` and no `.git`; the same for `--grapher graphify`; a missing binary for an installed tool does not refuse
- [X] T005 [US3] In `test/init/equip.test.ts`: brain==code with a dirty tracked file and an untracked user file — step zero names neither, names `.multivac` and `AGENTS.md`, and has no `-A`; `graphify-out/cache` is not named
- [X] T006 Give `test/init/init.test.ts` and `test/init/reinit.test.ts` a built PATH with stub vendors, so their `--sdd`/`--grapher` runs do not depend on the host — through a shared vendorPath() in test/helpers/fixture.ts; under a CI-like HOME and PATH, 13 init tests had refused before it

## Phase 3: Implementation
- [X] T007 [US2] `toolsInitWouldRun` and the pre-write refusal in `src/commands/init.ts`
- [X] T008 [US1] Call `runScaffold` then `ensureGraphs` after `doorsCommand.run` in `src/commands/init.ts`
- [X] T009 [US3] Before/after status snapshot and pathspec step zero in `src/commands/init.ts` — plus a rule found in the real run: a vendor directory holding local outputs is never collapsed to its name
- [X] T010 Amend the "only the change lifecycle" copies in `src/adapters/sdd.ts` and `src/adapters/registry.ts`

## Phase 4: Law and docs
- [X] T011 MV-128 statement and legs; amendment notes on MV-51, MV-75 and MV-91; bite every leg under `--strict` in a scratch copy — 9 legs, all bitten under --strict; the MV-91 note also records that its clash refusal never preceded git init
- [X] T012 Site: `graphers-and-sdd.md` scaffold section, the `init` section of `commands.md`, and step zero in `getting-started.md`

## Phase 5: Land
- [X] T013 Full suite with a CI-like HOME (`user.useConfigOnly`), `verify --strict`, a real run against spec-kit 1.0.6 and graphify 0.9.29 in scratch — 709 pass CI-like and on the host; real run with spec-kit 1.0.7 and graphify 0.9.29: scaffolded, built, graph 1853 bytes
- [X] T014 Commit, merge, land, close, MR — merged --no-ff and landed; closed by the change close this commit precedes, MR from close-equip-brain-at-init

## Phase 6: Convergence
- [X] T015 Before a graph's first build, append the grapher's ignore lines (`.graphifyignore`, `.gitignore`) and name a rule that still ignores the shared artifact, in `src/adapters/refresh.ts` — found in the real run: the first graph was 223001 bytes, 530 nodes of them vendor scaffolding (partial)
