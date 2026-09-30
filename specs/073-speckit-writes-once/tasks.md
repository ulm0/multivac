# Tasks: The SDD lives in the brain and writes once

**Feature**: specs/073-speckit-writes-once | **Branch**: `073-speckit-writes-once`

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included: every claim here lands with a check (Constitution I). Work in the
change's worktree, `.multivac/worktrees/speckit-writes-once/brain`.

## Phase 1: Setup

- [X] T001 Confirm a clean worktree and a green build from its root: `git status --porcelain` empty, `pnpm build` exit 0, the suite at 785 pass / 3 skipped

## Phase 2: Foundational (blocking prerequisites)

- [X] T002 Write MV-146 into its reserved row in .multivac/invariants.md: the measured facts of research.md R1–R9, **The rule.** (in the brain alone; written once; printed once; cited, never restated), what is mechanical, and the ceilings of research.md R11 — state `proposed`, authority `open`
- [X] T003 Append a dated note "**Amended 2026-09-28 by MV-146**: …" to each of MV-55, MV-56, MV-75 (the skeleton AND the withdrawal of its "`repos sync` runs it too, in every declared repo" sentence), MV-76, MV-87, MV-93, MV-95, MV-120, MV-122, MV-129, MV-130, MV-132, MV-133, MV-134, MV-135, MV-136, MV-137, MV-140, MV-143, MV-144 in .multivac/invariants.md — exactly twenty, each withdrawing only the sentences this change makes false
- [X] T004 In src/adapters/detect.ts add the private `ownDecl(cfg, root, kind)` as the one raw read of `sdd`/`grapher` (empty string reads as unset) and route `adapterFor` through it
- [X] T005 In src/adapters/detect.ts make `adapterFor(cfg, root, 'sdd')` return `undefined` for every root but the brain (the `brain` handle, or the `isBrain` entry under any key); graphers unchanged
- [X] T006 In src/adapters/detect.ts add `sddGoverning(cfg, root)` and `sddDeclarationRefusal(cfg)` per data-model.md, the three refusal texts per contracts/cli-output.md
- [X] T007 In src/adapters/detect.ts give each `sddRoots` root a `key` (the `isBrain` entry's key, else `brain`)
- [X] T008 In src/adapters/registry.ts add the types `SddScaffold.skeleton`, `SddStep.merges`, `SddSpec.pointer`; record speckit's `pointer` and opsx's archive `merges: { from: 'specs', into: 'openspec/specs' }` with the measured version in a comment
- [X] T009 In src/lib/config.ts call `sddDeclarationRefusal` in `loadConfig` once `isBrain` is derived: throw `ConfigError` by default, record `cfg.sddRefusal` under `{ sddDeclaration: 'report' }`; keep all refusal logic in detect.ts (MV-122's `=== NO_ADAPTER` leg stays unique)

## Phase 3: User Story 1 - One SDD, in the brain, and still no code outside a change (P1)

**Goal**: no code repo holds, prints or is gated for the SDD, and every code repo's code is still gated.

**Independent test**: quickstart Walk A steps 1–6 and 13–15.

- [X] T010 [US1] In src/lib/code-in-change.ts switch `codeInChangeLine` on `sddGoverning(cfg, repoKey)` and `cfg.sddAuto`
- [X] T011 [US1] In src/lib/code-in-change.ts make `nonCodeGlobs(cfg, repoKey?)` add the SDD's step-artifact top directories and project-step artifacts only for the brain's entry, and every KNOWN SDD's shared, local and install paths (including `openspec/**` and `.specify/**`) and integration/harness directories everywhere; pass `repoKey` from `codeInChangeLine`
- [X] T012 [US1] In src/commands/verify.ts load the mounted brain's config with `{ sddDeclaration: 'report' }` in BOTH consumer loads (`runVerify` and `evaluateCore`, via an `EvaluateOpts` field or by passing the loaded config), print the `sdd` line per contracts/cli-output.md, and gate it only under `--strict`
- [X] T013 [US1] In src/commands/count.ts load a consumer's mounted config in report mode and print the refusal on stderr
- [X] T014 [US1] In src/adapters/sdd.ts join `slugHits` on `root.key` instead of `root.scope`
- [X] T015 [US1] In src/adapters/sdd.ts add a stray-search helper (NOT a third `slugHits(brain, r, slug, want)` call, no read-only guard) that, on a missing-proof refusal only, names each match for the slug in a declared, present non-brain repo and its change worktree as "not read"
- [X] T016 [US1] In src/change/carry.ts add `pointFeature(dir, spec, featureDir)` and `closeOwnedDirs(brainDir, spec, slug)`; replace `doCarry`'s hard-coded `sdd === 'speckit'` pointer write with `pointFeature`; leave `slugArtifactDirs` unchanged
- [X] T017 [US1] In src/commands/change.ts drop `sddPathsToLand`'s `sdd_auto`/`--no-sdd` early return, key it on `adapterFor(cfg, 'brain', 'sdd')`, and stage every status path under `closeOwnedDirs`, deletions included, never naming them dirty
- [X] T018 [US1] In src/commands/change.ts call `pointFeature` from `cmdPlan` after its gate passes and from `cmdApply` where the directory stayed in the checkout, printing the pointer line when it named another directory; print the code-location line at `cmdPlan` when the change names a repo other than the brain's entry
- [X] T019 [US1] In src/doors/consumer.ts replace the SDD block and project-document line with the one governing line from `sddGoverning(config, repoKey)` (none under `sdd: none` or `sdd_auto: false`); the law line carries the mount prefix
- [X] T020 [US1] In src/doors/brain.ts drop `projectLawLines`' `lawPrefix` parameter
- [X] T021 [US1] In src/doors/flow.ts drop the SDD rows' ` — in <roots>` suffix and word the scaffold and project-document rows for the brain
- [X] T022 [US1] In src/doors/ecosystem.ts set each repo node's `sdd` from `sddGoverning`
- [X] T023 [US1] In src/commands/doctor.ts report the SDD for the brain only, add the governs line (only when a non-brain repo is declared) and one leftover line per writable code repo per known SDD whose state is not missing (tracked or not, with the removal of contracts/cli-output.md), never failing over it
- [X] T024 [US1] In src/commands/repos.ts ask the SDD checks of the brain only in `repos check` and append the leftover fact to a code repo's line without changing its exit code
- [X] T025 [US1] In src/commands/seed.ts report the brain's project document and no code repo's; in src/commands/init.ts word step 4 for the brain's project document
- [X] T026 [P] [US1] Add test/change/brain-only.test.ts: a top-level sdd scaffolds the brain alone, and no code repo (one `specify` spawn); `change new` needs no `specify` for a code repo; the stray match is named, not read; the code-location line only when a non-brain repo is named; two changes, `plan alpha` repoints the pointer and says so; brain==code keyed `core` refuses close over an open task; `ecosystem.json` nodes carry the governing SDD and an exempt node null
- [X] T027 [P] [US1] Extend test/lib/config.test.ts (or the config suite): refusals (i), (ii) with another tool and with `none`, (iii), each naming its key, exit 2; `repos.<k>.sdd: none` and `''` accepted; a brain entry equal to the top level accepted; report mode records `sddRefusal`
- [X] T028 [P] [US1] Extend test/doctor/adapters.test.ts for `sddGoverning` and the brain-only `adapterFor`, including an `isBrain` entry keyed `core`
- [X] T029 [P] [US1] Extend test/verify/code-in-change.test.ts: code on `main` in a governed code repo refused under `--strict`; `sdd: none` exempts; brain `sdd: none` or `sdd_auto: false` gives null; "a code repo's specs/ is code; the brain's is not"; a staged `openspec/config.yaml` and `.specify/x` in a code repo are not code; a consumer with a refused mounted config prints the line, exit 0, and 1 under `--strict`
- [X] T030 [P] [US1] Extend test/change/lifecycle-polish.test.ts: "close cites and stages the directory, whatever --no-sdd says" (also under `sdd_auto: false`); "an opsx archive lands with the specs it merged and the directory it moved"; `--abandon` stages and cites
- [X] T031 [P] [US1] Extend test/change/carry.test.ts for `pointFeature` and `closeOwnedDirs`
- [X] T032 [P] [US1] Extend test/doctor/doctor.test.ts for the leftover line (tracked, untracked, speckit and opsx), the governs/exempt line and its absence with no code repo
- [X] T033 [US1] Update every test the cascade used to satisfy — test/change/per-root.test.ts, test/change/sdd-gates.test.ts, test/change/equip-lifecycle.test.ts, test/change/managed-repos.test.ts, test/doctor/doctor.test.ts, test/doctor/adapters.test.ts, test/doors/ecosystem.test.ts, test/doors/doors.test.ts, test/doors/flow.test.ts, test/repos/check.test.ts, test/seed/seed.test.ts, test/change/ritual.test.ts, test/init/init.test.ts, test/change/constitution-state.test.ts — keeping every title an existing leg matches, retitling where the old title is false and moving that leg in T003

## Phase 4: User Story 2 - The templates are skeletons (P2)

**Goal**: a fresh spec-kit scaffold leaves skeleton templates where spec-kit resolves first.

**Independent test**: quickstart Walk A steps 2, 9, 11 and 16.

- [X] T034 [US2] Add src/adapters/skeletons.ts with the spec, plan and tasks skeleton bodies, each keeping the H2 headings of research.md R6 and none of the per-integration tokens
- [X] T035 [US2] Record speckit's `scaffold.skeleton` in src/adapters/registry.ts: dir, files, keeps, `measured: 'spec-kit 1.0.11'`, `floor: '0.9.4'`, tokens
- [X] T036 [US2] In src/adapters/sdd.ts add `writeSkeleton(rootDir, spec)` (absent dir, recorded version ≥ floor, kept headings present, `wx`) and call it only from `runScaffold`'s missing → installed branch; extend the pre-run and `scaffolded` lines per contracts/cli-output.md
- [X] T037 [US2] In src/commands/doctor.ts append the skeleton clause AFTER "(it writes the vendor's files into the tree)" in the missing-state line, and print the preset line for an enabled preset a skeleton outranks
- [X] T038 [P] [US2] Extend test/change/sdd-gates.test.ts: "a scaffold writes the skeleton where spec-kit resolves templates first"; none into an installed root, an existing `overrides/` (a human's file byte-identical), below the floor, or a partial/failed scaffold; a missing kept heading skips that body naming it; a plan byte-identical to the plan skeleton refuses `apply` naming the override
- [X] T039 [P] [US2] Extend test/doors/registry.test.ts: every skeleton body carries each kept heading and none of its tokens
- [X] T040 [US2] Add .specify/templates/overrides/{spec,plan,tasks}-template.md to this brain, byte-identical to src/adapters/skeletons.ts

## Phase 5: User Story 3 - The flow is printed once (P3)

**Goal**: the run-the-chain instruction once per point; the door's step lines carry the proof or `[ungateable]`.

**Independent test**: count the instruction lines across `new`, `plan`, `apply` (3).

- [X] T041 [US3] In src/adapters/sdd.ts make `stepLines` return the step lines alone and `sddInstructions` add the instruction once, unindented, after the last step of the point; none when no step printed
- [X] T042 [US3] In src/doors/brain.ts end each step line with `[proof: <artifact>]` or `[ungateable]`; `projectLawLines` takes `sddAuto` and under `sdd_auto: false` keeps "CREATE IT IF ABSENT" and drops the refusal clause
- [X] T043 [US3] In src/doors/flow.ts and src/commands/doctor.ts say "not gated (`sdd_auto: false`)" instead of any refusal under `sdd_auto: false`
- [X] T044 [P] [US3] Replace test/change/urging.test.ts's per-step assertion with "each lifecycle point's steps carry the instruction once, after the last step" (one at `new` and at `apply`, none at speckit's `land`/`close`, none under `sdd_auto: false`)
- [X] T045 [P] [US3] Extend test/doors/doors.test.ts: the brain door's step endings; no "refuses without" under `sdd_auto: false`; the consumer door's one line, none under `sdd: none` or `sdd_auto: false`, never `[ungateable:`

## Phase 6: User Story 4 - The constitution commits no amendment report (P3)

**Goal**: no surface tells the agent to prepend a report; this brain carries none.

**Independent test**: `grep -c 'Sync Impact' .specify/memory/constitution.md` is 0.

- [X] T046 [US4] In src/adapters/registry.ts change speckit's revisit to end "; commit no Sync Impact Report." with a comment quoting the vendor's ≤1.0.5 and 1.0.6–1.0.12 wording
- [X] T047 [US4] Remove the six Sync Impact Reports from .specify/memory/constitution.md, reword its amendment procedure (report removed before commit; git keeps the record) without the words "Sync Impact" on one line, and bump the footer to 3.0.1, last amended 2026-09-28
- [X] T048 [P] [US4] Extend test/doors/registry.test.ts: the revisit matches /commit no Sync Impact Report/ and not /prepend/

## Phase 7: User Story 5 - The change body cites its spec (P4)

**Goal**: close appends one pointer line; new tells the agent where the why goes.

**Independent test**: an archived body ends with the pointer and its pre-close body is a byte prefix.

- [X] T049 [US5] Add src/change/cite.ts: `citeSpec(body, dir, sdd)` and `citeLine(name)` per data-model.md and contracts/cli-output.md; it prints no continue instruction
- [X] T050 [US5] In src/commands/change.ts add `landSdd(brain, cfg, parsed, slug)` — the directory found checkout-then-worktree, `citeSpec` on the body, the staging of T017, the "nothing cited" line only with automation on and no `--no-sdd` — and call it before `archiveChange` in close and in `--abandon`
- [X] T051 [US5] In src/commands/change.ts print `citeLine` in `cmdNew` after the project-document line, when the brain resolves an SDD with automation on and no `--no-sdd`
- [X] T052 [US5] In src/change/file.ts make the scaffold's ownership sentence say close appends only the line citing the directory
- [X] T053 [P] [US5] Extend test/change/file.test.ts: `citeSpec` keeps the untrimmed body as a byte prefix, is a no-op on a body naming `<dir>/`, and round-trips through serialize/parse; the scaffold sentence

## Phase 8: Polish & cross-cutting

- [X] T054 Add the MV-146 legs and move the amended rows' legs in .multivac/invariants.md per research.md R10: `unique` legs on each mechanism, `absent` legs on bracket reads outside detect.ts, on `writeSkeleton` in verify/doctor/doors, on the continue instruction in cite.ts and on the retired phrases, a count on the twenty notes, test-title legs, a site leg
- [X] T055 [P] Update CHANGELOG.md (Unreleased: breaking, changed, fixed — MV-146) and DESIGN.md (the SDD lives in the brain; the pointer line; withdraw "a change's specs often live in the code repo")
- [X] T056 [P] Update site/content/docs/reference/{configuration,graphers-and-sdd,commands}.md, site/content/docs/guide/{session-zero,running-changes,getting-started}.md and README.md wherever they say the SDD reaches every repo, show a code repo's constitution, a per-repo SDD, or "prepend" (no law IDs on site pages, Principle I)
- [X] T057 [P] Fix the sentences this change makes false in skills/multivac/SKILL.md and skills/multivac/references/{change,discovery,interview}.md (facts only; trimming is skill-cites-references')
- [X] T058 Fix the code comments that would lie: src/adapters/detect.ts (adapterFor, the sddRoots rationale), src/commands/change.ts (sddPathsToLand), src/lib/ritual.ts, src/commands/doctor.ts, src/adapters/sdd.ts
- [X] T059 Run `multivac doors` to re-render AGENTS.md, flow.md and the projected skills
- [X] T060 Build and run the full suite; `mvac verify` 0 blocking with every claim anchored
- [X] T061 Walk quickstart.md A–D in scratch with the real vendors and record the results in the change file's body
- [X] T062 `graphify update .` and commit the graph on the change branch

## Phase 9: Review fixes

- [X] T063 In src/change/carry.ts find the slug's segment in the artifact template, never the substituted path (`spec` took `specs`), in `slugArtifactDirs` and `closeOwnedDirs`; stage each merged main spec file, never its capability's directory; tests in test/change/carry.test.ts and test/change/lifecycle-polish.test.ts
- [X] T064 In src/adapters/sdd.ts refuse close when a task ledger is found only outside the brain, naming it unread; drop the gate's dead all-read-only branch; tests in test/change/brain-only.test.ts
- [X] T065 In src/commands/doctor.ts and src/commands/repos.ts report leftovers only where the brain resolves an SDD; under `sdd_auto: false` no `change new` init, no skeleton clause and no governs line; drop the unreachable unknown-adapter branch; in src/doors/flow.ts move the init row to what is yours under `sdd_auto: false`; tests in test/doctor/doctor.test.ts, test/repos/check.test.ts, test/doors/flow.test.ts
- [X] T066 In src/commands/change.ts name every repo the change names, the brain's entry too, in the code-location line; in src/adapters/detect.ts keep an empty `grapher:` naming nothing at its root; rewrite `RepoEntry.sdd`'s comment in src/types.ts; tests in test/change/brain-only.test.ts and test/doctor/adapters.test.ts
- [X] T067 Tests for `change apply`'s repoint, `change new`'s cite line and its absence, close citing from the brain==code worktree, the three refusals through a consumer's mount, `doctor` and `verify` in the refused-config loop, the byte budgets of SC-002, SC-009 and SC-013, and a deterministic graph freshness in test/change/managed-repos.test.ts
- [X] T068 Law: notes on MV-125 and MV-139 (twenty-two, MV-125 and MV-139 added to `touches`), MV-146's row and the MV-56, MV-87, MV-122 and MV-137 notes made true, the constitution leg widened to `/Sync Impact/`, MV-87's doctor-test leg moved with its retitling
- [X] T069 Spec, contract, data model, CHANGELOG and site pages made to match: the `doctor`/`doors` exit 1, the contract's printed lines, the leftover condition, the pointer's installed precondition, the not-code wording


## Phase 10: Convergence

- [X] T070 Move each SDD's measured leftover removal and spec-kit's preset layout (registry path, templates directory, the ids that propagate into core templates) into the registry entry as data, and have doctor dispatch on those fields instead of the adapter or preset name, per Constitution V (contradicts)
- [X] T071 Print the brain door's "the change lifecycle runs the tool's own init" line only with SDD automation on, and under `sdd_auto: false` say no command runs it, per FR-023 (partial)
- [X] T072 Name `init` beside `doctor` and `doors` as exiting 1 on a refused SDD declaration (MV-114) in the contract, the MV-146 row and configuration.md, and pin it in the refused-everywhere test, per US1/AC5 (contradicts)
