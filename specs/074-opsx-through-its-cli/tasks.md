---
description: "Task list for opsx-through-its-cli"
---

# Tasks: opsx runs through its own CLI

**Input**: Design documents from `/specs/074-opsx-through-its-cli/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included: every claim here lands with a check (Constitution I, "tests ship with
behaviour"). Work in the change's worktree, `.multivac/worktrees/opsx-through-its-cli/brain`.
Line numbers are this branch's head (`6e2a265`). A test whose title an existing `@anchor`
leg reads keeps that title, and the task says which leg; a leg a task makes false is moved
in `.multivac/invariants.md` by that same task.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Confirm a clean worktree and a green build from its root: `git status --porcelain` empty, `corepack pnpm build` exit 0, record the suite's pass/skip counts from `node --test "dist-test/**/*.test.js"`, `openspec --version` 1.13.2 on PATH for quickstart.md, and dry-run with `git grep -c -E` the retired-phrase regex of research.md R15 over its glob (27 lines in 10 files) and the flag regex over `src/adapters/registry.ts` (0)

## Phase 2: Foundational (Blocking Prerequisites)

The law first (Constitution III), then the shared types, the one derivation and the stub every story's tests use.

- [ ] T002 Write MV-147 into its reserved row in .multivac/invariants.md per research.md R16: the bold title, the measured facts of R1–R12, **The rule.** (*Printed*, *Asked*, *Installed*, *Landed*, *Refused early*, *Disclosed*), **What is mechanical** (R15), and the ceilings of R17 with every edge case of spec.md marked a ceiling — one physical line, authority `open`, state `proposed`, `<date>` the day of this commit
- [ ] T003 Append `**Amended <date> by MV-147**: …` at the end of the statement cell of MV-51, MV-56, MV-63, MV-75, MV-95, MV-121, MV-124, MV-130, MV-133, MV-144 and MV-146 in .multivac/invariants.md, per research.md R16's table — exactly eleven, each withdrawing only the sentences this change makes false (MV-95's listing every question FR-013–FR-016 carry, MV-121's the HOME writes and the first printed call without `--json`, MV-146's the merge test of FR-011); leave MV-142, MV-55 and MV-137 alone; check the MV-121 and MV-124 notes against those rows' `absent` regexes (0 matches)
- [ ] T004 In src/adapters/registry.ts add `SddStep.guide?: string`, `SddStep.validateNotes?: string`, `SddScaffold.bodies?: { names: string[]; dirs: string[] }` and `AdapterSpec.slug?: { pattern: string; reserved: string[]; why: string }` with the doc comments of data-model.md; reword the doc comments data-model.md lists (`AdapterSpec.steps`, `SddScaffold`, `SddScaffold.run`, `SddScaffold.integrations`, `SddStep.unfinished`), and move MV-51's leg `/These are chat commands, not terminal subcommands/` to `/the lifecycle prints them and gates on what they leave behind, and never spawns one/ unique` in .multivac/invariants.md
- [ ] T005 [P] In src/adapters/detect.ts add the pure `bodyGlobs(scaffold)` of data-model.md (every integration's `dirs` plus `bodies.dirs`, each name at depth one and two, with and without `/**`; `[]` without `bodies`)
- [ ] T006 [P] In test/helpers/fixture.ts make `vendorPath`'s `openspec` stub honour `--tools` as 1.13.2 does: always `openspec/config.yaml`, `openspec/specs/.gitkeep`, `openspec/changes/archive/.gitkeep`; for `agents` or `codex` also `.agents/skills/openspec-propose/SKILL.md` and `.agents/skills/.openspec-target`; for `claude` also `.claude/commands/opsx/propose.md` and `.claude/skills/openspec-propose/SKILL.md`; for `none` nothing outside `openspec/`; reword its MV-144 comment

**Checkpoint**: the law states the change; the types, `bodyGlobs` and the stub exist — user story work can begin

## Phase 3: User Story 1 - The agent runs openspec's own CLI, and nothing installs the bodies (Priority: P1) — MVP

**Goal**: opsx's steps print openspec's own verbs with the slug in them; the scaffold writes no command body; a step's guide prints under it at its point and in refusals, never in the door, `doctor` or flow.md; multivac still spawns only the scaffold and the validator.

**Independent Test**: quickstart.md Walk A steps 1–6 in a fresh `init --sdd opsx` brain with openspec 1.13.2, following only the printed lines.

- [ ] T007 [P] [US1] In test/change/door-integration.test.ts retitle 'opsx installs every declared tool in one init — MV-130' (no leg reads it) to 'a scaffold run with no placeholder is returned as it is, whatever the doors — MV-130, MV-147' and assert `scaffoldCommands(opsx, d)` deep-equals `{ commands: ['openspec init --tools none --no-animation .'], gaps: [] }` for `['agents', 'claude', 'copilot']`, `[]` and `['nope']`; speckit's cases unchanged (FR-006)
- [ ] T008 [P] [US1] In test/change/sdd-gates.test.ts add 'opsx: multivac spawns only the scaffold and the validator, new to close': a logging `openspec` stub recording its argv with `DO_NOT_TRACK` and `OPENSPEC_TELEMETRY`; one change walked `new` → `plan` → `apply` → `land` → `close` (the test writes the artifacts and the archive the agent and the human would) logs exactly the two lines of contracts/cli-output.md *Subprocesses*, each with both opt-outs (FR-005, SC-002)
- [ ] T009 [US1] In test/change/sdd-gates.test.ts rewrite the opsx flow tests (:219–:311) for the new runs, keeping the titles 'opsx: new prints propose, and plan REFUSES until proposal.md exists' (MV-51's leg `new prints propose` and MV-56's `plan REFUSES until proposal\.md exists` read it) and "opsx: the tool's own validator is the verdict, not a reimplementation" (MV-56's leg): `new` prints ``in the brain checkout run `openspec new change gate-a --json` ``; the apply refusal names `openspec instructions <id> --change gate-a --json` and, four spaces in, the plan guide (FR-002); `apply` prints ``run `openspec instructions apply --change gate-a --json` ``; `land` prints ``run `openspec archive gate-a --json` to merge ``; no assertion spells the slash form (absence as `/opsx[:]/`); and retitle 'opsx runs its measured init for the declared doors — MV-130' (:1016, no leg reads it) to 'opsx runs its measured init, which installs no harness file — MV-130, MV-147' with the logged init `init --tools none --no-animation . DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0` for `doors: [agents, claude]`
- [ ] T010 [P] [US1] In test/doors/doors.test.ts add 'the door carries each opsx command and no guide': the four step lines equal the contract's door lines with `<slug>` literal, together at most 1,300 B, no guide text, `/opsx[:]/` absent (FR-003, SC-003); update 'brain door carries the SDD flow when one is declared' (:239–:243, no leg reads it) to the new runs
- [ ] T011 [P] [US1] In test/doors/flow.test.ts add 'the ungateable verb is the first backticked command of a required binary': opsx's apply row names `openspec instructions apply --change <slug> --json`; speckit's rows still name `/speckit.analyze`, `/speckit.implement` and `/speckit.converge` (FR-004, SC-005)
- [ ] T012 [P] [US1] In test/doctor/doctor.test.ts update 'doctor: declared sdd with nothing present is a notice, still exit 0' (:89, no leg reads it): the missing state names `openspec init --tools none --no-animation .`, the flow lines read ``flow — new: in the brain checkout run `openspec new change <slug> --json` `` and `flow — land: after the merge, in the brain checkout`, and no flow line carries a guide (FR-003)
- [ ] T013 [P] [US1] In test/change/vendor-state.test.ts (:147) make the partial-state line name ``run `openspec init --tools none --no-animation .` in brain yourself``
- [ ] T014 [P] [US1] In test/init/equip.test.ts keep the title "a fresh opsx brain's step zero passes its own gate — MV-142, MV-144" (MV-142's leg `step zero passes its own gate` reads it): step zero no longer names `.agents`, nothing outside `.git` matches `openspec-|opsx`, `openspec/` holds `config.yaml` and two `.gitkeep`s, and the status after the printed commit is clean (SC-001)
- [ ] T015 [P] [US1] In test/change/urging.test.ts extend "each lifecycle point's steps carry the instruction once, after the last step" (keep the title — MV-146's leg reads `each lifecycle point's steps carry the instruction once, after the last`) with an opsx config: at `new`, `plan`, `apply` and `land` each step line is followed by its registry `guide` as `sdd opsx:   <guide>` whenever it has one, and the clause is the last line, unindented (FR-002, US1-AS3); speckit's cases and 'the boundaries ride with the line, every time' (MV-95's leg) unchanged
- [ ] T016 [P] [US1] In test/doors/registry.test.ts add "a scaffold with no placeholder still records every integration's dirs": opsx's `scaffold.run` holds neither `{key}` nor `{keys}`, and every door key it maps keeps non-empty `dirs` (FR-007); 'every SDD step proves itself or says why it cannot' (MV-55's and MV-56's legs) unchanged
- [ ] T017 [P] [US1] In test/change/binary-lookup.test.ts (:106) make the comment name `openspec init --tools none`
- [ ] T018 [US1] In src/adapters/registry.ts set opsx's `scaffold.run` to `'openspec init --tools none --no-animation .'` and move MV-130's leg `/run: 'openspec init --tools \{keys\} --no-animation \.'/` to `/run: 'openspec init --tools none --no-animation \.'/ unique` in .multivac/invariants.md; put the record comment of data-model.md above the unchanged `integrations` map (MV-144's `dirs: ['.agents']` `count=3` holds); rewrite the scaffold `note`; add the refresh comment ("refreshes only the bodies a human installed", nothing in a `--tools none` brain, 1.13.2) beside `refresh: 'openspec update'` (FR-006, FR-007, FR-024)
- [ ] T019 [US1] In src/adapters/registry.ts replace opsx's four `run`s with contracts/cli-output.md's, verbatim, each a double-quoted string on one line, and add the plan step's `guide` verbatim; every `at`, `artifact`, `gate`, `validate`, `ungateable`, `unfinished` and `merges` unchanged (FR-001, FR-013, FR-015, FR-016's tick clause)
- [ ] T020 [US1] In src/adapters/sdd.ts `scaffoldCommands` (:246), under the comment "a run with no placeholder installs no door's integration", return `{ commands: [scaffold.run], gaps: [] }` when the run holds neither `{key}` nor `{keys}`, for any doors (FR-006); the `{key}`/`{keys}` paths unchanged
- [ ] T021 [US1] In src/adapters/sdd.ts `stepLines` (:899) push `${tag}:   ${withSlug(s.guide, slug)}` after each step line whose step has a guide; `sddInstructions` (:849) still inserts the clause once after the point's last line (FR-002)
- [ ] T022 [US1] In src/adapters/sdd.ts `judgeSdd`, in the missing (:640), empty (:658) and byte-identical (:670) refusals, push `    ${withSlug(step.guide, slug)}` after `  ${withSlug(step.run, slug)}` when the step has a guide; `flowLines` and `proofOf` unchanged (FR-002, FR-003)
- [ ] T023 [US1] In src/doors/flow.ts (:98), under the comment "the first backticked command of a required binary", take the ungateable verb from the first backticked span whose first word is in `spec.required`, then today's `/…` token, then `s.at` (FR-004)

**Checkpoint**: User Story 1 is functional and testable on its own

## Phase 4: User Story 2 - The archive question goes to the human, with no flag printed (Priority: P1)

**Goal**: the land step carries no flag and routes openspec's confirmation to the human with the tool's own preview and answers; a land proof is read in the brain checkout alone; close stages a merged main spec only when it carries the merge; the ledger's reason is true under `--json`.

**Independent Test**: quickstart.md Walks A (steps 7–9), C and D with openspec 1.13.2 in a brain==code scratch brain.

- [ ] T024 [P] [US2] In test/change/sdd-gates.test.ts add 'opsx: land prints the archive with no flag, and the question under it': once every stage has landed the `sdd opsx:` lines are exactly three — the step matching ``run `openspec archive <slug> --json` to merge`` and not `/--(yes|skip-specs|no-validate)/`, the guide starting ``sdd opsx:   `archive_confirmation_required` saying `Updating` ``, the clause; close with no archive re-prints the run and the guide; `renderBrainDoor` holds no ``saying `Updating` `` (FR-009, SC-006)
- [ ] T025 [US2] In test/change/sdd-gates.test.ts add "opsx: a land proof found only in the change's worktree is refused": brain==code keyed `core`, an archive directory holding a `tasks.md` with an open box only under `.multivac/worktrees/<slug>/core` makes close exit 1 with `is only in the change's worktree, .multivac/worktrees/<slug>/core/…` and no `open item(s)` line; moved into the checkout with its tasks ticked, close passes (FR-010, SC-007)
- [ ] T026 [US2] In test/change/sdd-gates.test.ts keep the title 'opsx: close refuses when the archived change still has open tasks' (MV-63's leg reads it), make its comment name `--json --yes` archiving over open tasks with no warning (1.5.0–1.13.2), and assert `led.why` matches `/archives over its own refusal/` and that close over an archived `tasks.md` holding `- [ ]` refuses with that reason (FR-012, SC-009)
- [ ] T027 [P] [US2] In test/change/carry.test.ts read `closeOwnedDirs(…).dirs` in the existing assertions, keeping the titles 'closeOwnedDirs adds a moved-from directory git reports deleted, and each main spec an archive merged into' and "a slug inside a parent directory's name owns its own directory, never the parent" (MV-146's leg reads `owns its own directory, never the parent`), and add `carriesMerge` cases: no ADDED/MODIFIED block → true; blocks verbatim → true; a CRLF delta and trailing spaces → true; a block missing → false; an untracked target without the block → false; an unreadable target → false (FR-011)
- [ ] T028 [P] [US2] In test/change/lifecycle-polish.test.ts add 'a main spec the archive did not merge into is named, not staged': a `--skip-specs` archive (moved, main specs untouched) beside a human's uncommitted line in `openspec/specs/billing/spec.md` and an untracked `openspec/specs/refunds/spec.md` draft → close names both `is dirty and was not staged` and the printed pathspec holds neither (SC-008); in 'an opsx archive lands with the specs it merged and the directory it moved' (keep the title — MV-146's leg reads it) give the deltas real `### Requirement:` blocks merged verbatim, reword the comment at :516 to "as `openspec instructions` guided it", and add a CRLF-delta twin that still stages both targets (US2-AS4)
- [ ] T029 [P] [US2] In test/doors/registry.test.ts add "no SDD step's run carries a flag that answers the tool's own question": no `run` of any entry matches `/--(yes|skip-specs|no-validate)\b/`, and a guide names them only after `never` or as the human's answer (`yes:`, `archive without merging:`) (FR-008, SC-010)
- [ ] T030 [US2] In src/adapters/registry.ts add the land step's `guide` verbatim from contracts/cli-output.md; set `unfinished.why` to "openspec archived this change with tasks still unchecked — `--yes` archives over its own refusal, and under `--json` says nothing", give its comment the 1.5.0–1.13.2 `--json --yes` fact, and move MV-63's leg `/continues over its own warning/` to `/archives over its own refusal/ unique` in .multivac/invariants.md (FR-009, FR-012)
- [ ] T031 [US2] In src/adapters/sdd.ts `judgeSdd`'s artifact loop (:608) keep the root each hit was asked through; for a step with `at === 'land'` whose hit came from the worktree fallback, refuse as contracts/cli-output.md shows (`is only in the change's worktree, <path relative to the brain>, which never reaches the brain checkout`, the run, the guide four spaces in, the re-run line); in the ledger loop (:708) read no ledger of a land step from such a hit; both `await slugHits(brain, r, slug, want)` calls untouched (MV-133's `count=2`) (FR-010)
- [ ] T032 [US2] In src/change/carry.ts add `carriesMerge(brainDir, delta, target)` per data-model.md (ADDED and MODIFIED `### Requirement:` blocks; CRLF → LF and trailing whitespace stripped on both sides; no block → true), and make `closeOwnedDirs` return `{ dirs, uncarried }`, routing each merge target file through `await carriesMerge(brainDir, …)` (FR-011)
- [ ] T033 [US2] In src/commands/change.ts `sddPathsToLand` (:663) take `{ dirs, uncarried }` and push every status path in `uncarried`, modified or untracked, into `dirty`, so the one `is dirty and was not staged` line names it (MV-144's `unique` leg holds); reword its doc comment to "each main spec file that carries the merge" (FR-011)

**Checkpoint**: User Stories 1 and 2 work; the binding decision holds end to end

## Phase 5: User Story 3 - The questions the bodies asked ride on the lines (Priority: P2)

**Goal**: every question openspec 1.13.2's command bodies gave the human is printed, on the run where the door is the only surface, and in the guide at the step's point.

**Independent Test**: read the four opsx steps and their guides as the lifecycle prints them, then the door's runs alone (spec US3).

- [ ] T034 [P] [US3] In test/doors/registry.test.ts add "opsx's lines carry the questions its command bodies asked": `the human's question` in the new, apply and land runs; ``tick `- [x]` only what is fully built`` in apply's; ``a flag its `fix` names is never yours`` in land's; the land guide names ``saying `Updating` ``, `openspec show <slug> --json --deltas-only`, `--skip-specs`, `anything else: stop` and ``never `--no-validate` ``; the new guide `already exists`, `resolvedOutputPath`, `observable behaviour` and `root.source`; the plan guide `[-]` and `Next:`; the apply guide `an unclear task`, `a design issue` and `ready to be archived`; nothing spells `/opsx[:]/` (FR-013–FR-016, SC-010)
- [ ] T035 [P] [US3] In test/doors/doors.test.ts extend 'the door carries each opsx command and no guide': under `sdd_auto: false` the door's new, apply and land runs still contain `the human's question` (US3-AS4)
- [ ] T036 [US3] In src/adapters/registry.ts add the `new` and `apply` steps' `guide`s verbatim from contracts/cli-output.md, each with a comment citing its vendor source by path and version — openspec 1.13.2's `.claude/commands/opsx/propose.md` (step 1, Guardrails, :169, :36) and `.claude/commands/opsx/apply.md` (:110–:115) with `instructions apply --json`'s `all_done` text — and the plan guide's comment citing `status` and `instructions` 1.13.2; never a slash spelling (FR-014, FR-016, FR-017)

**Checkpoint**: User Stories 1–3 work; every opsx step has its run and its guide

## Phase 6: User Story 4 - Brains scaffolded before this change shed the bodies (Priority: P2)

**Goal**: `doctor` names the bodies an earlier init left in the brain, with a removal that works as printed, and the commit of that removal is not code.

**Independent Test**: quickstart.md Walk E.

- [ ] T037 [P] [US4] In test/doctor/doctor.test.ts add 'doctor names opsx bodies an earlier init left in the brain': with `doors: [claude]` and committed `.claude/commands/opsx/propose.md`, `.claude/skills/openspec-propose/SKILL.md`, `.claude/skills/openspec-apply-change/SKILL.md`, `.agents/skills/openspec-propose/SKILL.md`, `.agents/skills/.openspec-target` and `.codex/skills/openspec-explore/SKILL.md`, one `sdd` line names `.agents/skills/.openspec-target`, `.agents/skills/openspec-propose`, `.claude/commands/opsx`, `.claude/skills/openspec-*` and `.codex/skills/openspec-explore` in its `git rm -r`, no line is `fail`, exit 0; an untracked body is named to delete, outside the `git rm -r`; none left, or a speckit brain → no such line (FR-018, SC-011)
- [ ] T038 [P] [US4] In test/init/equip.test.ts add 'bodies an earlier init left leave through any commit — MV-142, MV-144, MV-147': a fresh opsx brain, step zero committed; the stub run as `openspec init --tools agents,claude --no-animation .` plus a `.codex/skills/openspec-propose/SKILL.md`, committed through the hooks `init` installed (exit 0); the `git rm -r …` `doctor` prints, committed through the same hooks, exits 0 and `verify --strict` exits 0; `change new` there prints the step lines of a fresh brain and runs no init (FR-019, SC-011, US4-AS3, AS4)
- [ ] T039 [P] [US4] In test/verify/code-in-change.test.ts add "the bodies an openspec init writes are not code under any integration's directory, declared or not": with `doors: [claude]`, `.devin/skills/openspec-propose/SKILL.md`, `.codex/skills/openspec-explore/SKILL.md`, `.github/prompts/opsx-apply.prompt.md` and `.agents/skills/.openspec-target` are not code, while `.devin/skills/openspec/SKILL.md`, `.codex/config.toml`, `.github/workflows/ci.yml` and `src/cli.ts` are; 'the directories a declared integration installs into are not code — MV-142, MV-144' stays as it is (FR-019)
- [ ] T040 [US4] In src/adapters/registry.ts record opsx's `scaffold.bodies` = `{ names: ['openspec-*', '.openspec-*', 'opsx', 'opsx-*'], dirs: ['.codex'] }` with its measurement comment (1.13.2, all eight keys; codex writes `.codex/skills` on 1.7.0 and `.agents/skills` from 1.8.0) (FR-018)
- [ ] T041 [US4] In src/lib/code-in-change.ts `nonCodeGlobs` (:43) add `bodyGlobs(scaffold)` for every known SDD's scaffold, in every repo, under a comment naming MV-147; the declared-doors loop (MV-142's `for (const d of integration.dirs)` leg) unchanged (FR-019)
- [ ] T042 [US4] In src/lib/repo-state.ts add `leftoverBodies(dir, spec)` beside `leftoverSdds` (:136) per data-model.md: `git ls-files -z --cached` and `git ls-files -z --others --exclude-standard` under the body directories, matched by `bodyGlobs`, reduced to entries, siblings collapsed to `<parent>/openspec-*` or `<parent>/opsx-*`, each flagged tracked (FR-018)
- [ ] T043 [US4] In src/commands/doctor.ts `sddLines` (:257), after the brain's install line and only when the brain's SDD scaffold records `bodies`, `await leftoverBodies(root.dir, spec)` and print the one line of contracts/cli-output.md (tracked, mixed and untracked forms), nothing when empty, never a failure; #3's code-repo `leftoverSdds` lines (:317–:325) unchanged (FR-018)

**Checkpoint**: User Stories 1–4 work; older brains are told what to remove, and can

## Phase 7: User Story 5 - The first command does not fail, and the vendor facts stay true (Priority: P3)

**Goal**: a slug openspec refuses is refused at `change new` and `roadmap add`; the apply gate passes on openspec's "Archive would refuse" and prints it; the opsx note discloses by version what the agent's own calls send and write.

**Independent Test**: quickstart.md Walks F and G, and the note read from the registry entry.

- [ ] T044 [P] [US5] In test/change/sdd-gates.test.ts add "change new refuses a slug the brain's SDD cannot create": in an opsx brain `change new Fix_Auth "x"` and `change new archive "x"` exit 1 with the contract line and leave `git status --porcelain` and `.multivac/invariants.md` unchanged, with and without `--no-sdd` and under `sdd_auto: false`; `change new fix-auth "x"` proceeds; a speckit brain accepts `Fix_Auth` (FR-020, FR-021, SC-012)
- [ ] T045 [US5] In test/change/sdd-gates.test.ts add "the apply gate prints openspec's archive-would-refuse note and passes": `stubOpenspec(0, <research.md R11's JSON>)` → `change apply` exits 0 and prints the note line after `tasks.md ok`; `stubOpenspec(0)` and a non-JSON stdout → exit 0 and no `passes and notes:` (FR-022, SC-013)
- [ ] T046 [P] [US5] In test/change/roadmap.test.ts add "roadmap add refuses a slug the brain's SDD refuses": in an opsx brain `roadmap add Fix_Auth "x"` and `roadmap add archive "x"` exit 2 with the contract line, no file under `.multivac/changes/` and no commit; a speckit brain records `Fix_Auth` (FR-021, SC-012)
- [ ] T047 [P] [US5] In test/doctor/adapters.test.ts update 'opsx names its telemetry, because the gates run openspec validate' (no leg reads it): the note names `1.4.0`, `1.5.0`, `1.7.0`, `edge.openspec.dev`, `1.13.1`, `first-run notice`, `completionTipSeen`, `OPENSPEC_NO_COMPLETIONS=1`, `OPENSPEC_TELEMETRY=0`, `DO_NOT_TRACK=1`, `registry.npmjs.org` and ``carry none of `env` ``; `` /`env` sets/ `` becomes ``/each with this entry's `env`/``; and it matches none of the regexes of MV-121's and MV-124's `absent` legs, copied from .multivac/invariants.md (FR-023, SC-014); 'the telemetry notes say the entry applies the opt-outs, and still name each one' unchanged
- [ ] T048 [P] [US5] In test/doors/registry.test.ts add "a recorded slug grammar is the tool's own, measured": every `slug.pattern` compiles, each `reserved` name is one the pattern alone accepts, opsx's accepts `ab-c`, `1ab`, `a1`, `x` and refuses `Fix_Auth`, `a.b`, `a_b`, `a--b`, `Ab`, `a-b-`, `-ab`; speckit records none (FR-020)
- [ ] T049 [US5] In src/adapters/registry.ts record opsx's `slug` of data-model.md with its 1.13.2 measurement comment, `validateNotes: '^Archive would refuse'` on the plan step, and the `note` verbatim from contracts/cli-output.md (FR-020, FR-022, FR-023)
- [ ] T050 [US5] In src/adapters/sdd.ts add `sddSlugWhy(cfg, slug)` per data-model.md; give `Verdict`'s `ok` kind `notes: string[]`; let `toolVerdict` (:159) take `notes?` and, on exit 0, parse stdout inside a try (empty or non-JSON → no notes) and keep each issue message the ERE matches; in `judgeSdd` pass `step.validateNotes` and print each note as contracts/cli-output.md shows, after the artifact line, refusing nothing; the scaffold's calls pass none (FR-021, FR-022)
- [ ] T051 [US5] In src/commands/change.ts `cmdNew` (:774) ask `sddSlugWhy(cfg, slug)` first — before `sayStaleMounts`, the archived-slug check and promotion, whatever `sdd_auto` and `--no-sdd` say — and on a reason warn the contract line and return 1 (FR-021)
- [ ] T052 [US5] In src/commands/roadmap.ts, after the format check (:335), load the config with `loadConfig(brain)` and, when `sddSlugWhy` gives a reason, warn the contract line and return 2 before `add` records anything (FR-021)

**Checkpoint**: all five stories work

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T053 Fix the source comments that would lie (FR-026, FR-027): src/adapters/sdd.ts's header (:1–:13 — the steps are what the agent runs, chat commands for spec-kit and openspec's own terminal verbs for opsx; keep "A step is never faked by shelling out", MV-51's leg) and `runScaffold` doc (:191–:245 — the deadlock is spec-kit's; the steps stay what the agent runs); src/commands/change.ts's `runSdd` doc (:112–:119 — keep "INSTRUCT the agent, never shell out", MV-51's leg; "would silently skip" becomes "`openspec propose` exits 1, `unknown command` (1.13.2)") and the :891 comment ("chat commands that exist" becomes "steps that can run")
- [ ] T054 [P] Amend site/content/docs/reference/graphers-and-sdd.md: the refresh cell (:37); the `env` paragraph (:340–:347: `env` reaches every run multivac makes and none it prints, the agent's calls by version, `openspec config set telemetry.enabled false` from 1.10.0, measured not read); the `doctor` sample (:504–:508, plus the leftover-bodies line); the callout (:516–:520); "The SDD lives in the brain" (:528: a land step reads the brain checkout alone); what close lands (:580–:587: only a main spec that carries the merge, others named dirty); the init table (:635); the integration lead and the paragraph after the table (:637–:656: `--tools none`, no gap, no later install for opsx; the `cursor` row, MV-130's leg, kept); the scaffold callout (:741–:747); "Each tool's own flow" (:752–:761: steps are **commands the agent runs**, the opsx row of verbs; drop "would silently do nothing") and move MV-51's leg `/chat commands the agent runs/` to `/steps are \*\*commands the agent runs\*\*/ unique` in .multivac/invariants.md; the refusal sample (:806–:810, run and guide); the gate search (:813); the ledger (:896–:913, `--json --yes` says nothing); the ungateable table (:932); and the three new sections of contracts/cli-output.md, `### The question openspec asks at archive` first — no law ID, no slash spelling (FR-024, FR-027)
- [ ] T055 [P] Amend site/content/docs/reference/configuration.md (:566), site/content/docs/reference/commands.md (:1409 and :1641–:1642), site/content/docs/guide/running-changes.md (:170, and a sentence in "The SDD files ride onto the branch" — heading kept, MV-133's leg — saying `instructions apply` runs where `openspec/changes/<slug>/` now is and the archive after the merge in the brain checkout) and site/content/docs/concepts/composition.md (:65–:69, "The cost, stated") to the sentences FR-027 lists (FR-027)
- [ ] T056 [P] Amend DESIGN.md (:1307 — only a merged main spec that carries the merge is staged; :1343 — a land step's proof is read in the brain checkout alone) (FR-027)
- [ ] T057 [P] Amend skills/multivac/references/change.md (:230–:236 — the steps are commands you run in the agent, chat commands for spec-kit and openspec's own terminal verbs for opsx; opsx's apply runs where `openspec/changes/<slug>/` is; :256 — `openspec instructions apply` leaves only `- [x]`); the installed copy under .claude/skills/multivac/ is re-projected by T060 (FR-026, FR-027)
- [ ] T058 [P] Record the change in CHANGELOG.md's Unreleased section (MV-147): opsx's steps are openspec's own CLI; no command body is installed and `doctor` names what an earlier init left; the archive is printed without `--yes` and its question goes to the human; a land proof is read in the brain checkout; close stages a merged spec only when it carries the merge; `change new` and `roadmap add` refuse a slug openspec refuses; the validator note; the disclosure by version (FR-027)
- [ ] T059 Write MV-147's legs of research.md R15 under its row in .multivac/invariants.md and dry-run each with `git grep -c -E`: the retired-phrase leg 0 (SC-015), the flag leg 0, `withSlug\(step\.guide, slug\)` 4, the dated notes 11 (FR-025, FR-026)
- [ ] T060 Run `multivac doors`: AGENTS.md, CLAUDE.md and .multivac/flow.md byte-identical (this brain declares speckit, SC-005), .multivac/ecosystem.json and .claude/skills/multivac/ re-rendered
- [ ] T061 Build and run the full suite (`corepack pnpm test`, package.json's `test` script, against T001's counts); `multivac verify` reports every claim anchored and 0 blocking; `grep -c` finds exactly 11 notes by MV-147 in .multivac/invariants.md (SC-015, SC-016)
- [ ] T062 Walk quickstart.md A–I in scratch with the real openspec 1.13.2, `HOME` isolated, each `cd` and mutating command in one `&&` chain, and record the results in .multivac/changes/opsx-through-its-cli.md's body (SC-001, SC-004, SC-005, SC-007, SC-008, SC-011, SC-012, SC-013)
- [ ] T063 Run `graphify update .` so graphify-out/graph.json matches the change; `change land` commits it on the change branch

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: T001 before everything. T002 → T003 → T004 (the law before the code, Constitution III; T004 moves a leg in the same file). T005 and T006 run beside T004.
- **US1 (Phase 3)** needs Phase 2. Its tests (T007–T017) are written first and fail; T018 → T019 (one file), T020 → T021 → T022 (one file), T023 alone.
- **US2 (Phase 4)** needs US1's land run (T019) and guide printers (T021, T022). T030 (registry.ts) after T019; T031 (sdd.ts) after T022; T032 → T033 (T033 reads T032's return).
- **US3 (Phase 5)** needs US1's printers; T036 after T030 (registry.ts).
- **US4 (Phase 6)** needs only Phase 2 (T005 `bodyGlobs`, T006 stub); T040 after T036 when run in order (registry.ts); T041, T042 in parallel; T043 after T042.
- **US5 (Phase 7)** needs only Phase 2; T049 after T040 (registry.ts); T050 after T031 (sdd.ts); T051 and T052 after T050.
- **Polish (Phase 8)** after every story: T053–T058 in parallel; T059 after T053–T058 (the retired-phrase leg must find 0); T060 after T057; T061 after T059 and T060; T062 after T061; T063 last.
- Same-file tasks never run in parallel: src/adapters/registry.ts (T004, T018, T019, T030, T036, T040, T049), src/adapters/sdd.ts (T020–T022, T031, T050), test/change/sdd-gates.test.ts (T008, T009, T024–T026, T044, T045), test/doors/registry.test.ts (T016, T029, T034, T048), test/doors/doors.test.ts (T010, T035), .multivac/invariants.md (T002–T004, T018, T030, T054, T059).

## Parallel Example: User Story 1

```text
T007 test/change/door-integration.test.ts    T010 test/doors/doors.test.ts
T011 test/doors/flow.test.ts                 T012 test/doctor/doctor.test.ts
T013 test/change/vendor-state.test.ts        T014 test/init/equip.test.ts
T015 test/change/urging.test.ts              T016 test/doors/registry.test.ts
T017 test/change/binary-lookup.test.ts       T008 test/change/sdd-gates.test.ts (then T009)
then T018 → T019 (registry.ts) beside T020 → T021 → T022 (sdd.ts) beside T023 (flow.ts)
```

User Story 2: T024 (then T025, T026) beside T027, T028, T029; then T030, T031, T032 → T033.
User Story 4: T037, T038, T039 together; then T040, T041, T042 → T043.
User Story 5: T044 (then T045), T046, T047, T048 together; then T049, T050 → T051, T052.

## Implementation Strategy

MVP first: Phases 1–3. After T023 an opsx brain installs no command body, prints openspec's
own verbs and never spawns anything new — quickstart.md Walk A steps 1–6 pass, and the land
run already names the archive question as the human's. Then US2, the binding decision, and
US3, so every question the bodies asked is printed before any brain relies on the lines
alone; then US4 and US5 in either order. The change lands as one: `change close` verifies
MV-147's legs, which need every story and the Polish phase.

## Notes

- **Where this plan goes beyond the design**, both recorded in research.md: the code gate
  reads openspec's body entries as not code under every integration's directory and
  `.codex/`, declared door or not (R9) — FR-019 cannot hold for `.codex/` or a door no longer
  declared otherwise; and `doctor` prints `git rm -r` only for tracked bodies, naming
  untracked ones to delete (R9), since `git rm -r` fails on an untracked pathspec.
- **Spec US5-AS5 and its independent test** were reworded before apply: the note is read on the
  registry entry (T047) and the site (T054); no command prints an adapter's `note`, and `doctor`
  gains no line for it — about 2 KB per run would work against the plan's own purpose.
- The retired-phrase leg reads `test/**` for the literal `/opsx:`: a test asserts absence
  with `/opsx[:]/`, and no regex literal may start with `opsx:` (write `/^sdd opsx: …/` or
  `/ opsx: …/`), or the leg counts it.
