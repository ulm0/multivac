---
description: "Task list for graph-answers-where-asked"
---

# Tasks: The graph the agent asks is one that answers

**Input**: Design documents from `/specs/075-graph-answers-where-asked/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included: every claim here lands with a check (Constitution I, "tests ship with
behaviour"). Work in the change's worktree, `.multivac/worktrees/graph-answers-where-asked/brain`.
Line numbers are the design's, on `main` at `92c4c08`; #4 has merged since, so T001 re-anchors
every one on the branch head and each task names its function first. A test whose title an
existing `@anchor` leg reads keeps that title, and the task says which leg; a leg a task makes
false is moved in `.multivac/invariants.md` by that same task.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Confirm a clean worktree and a green build from its root: `git status --porcelain` empty, `corepack pnpm build` exit 0, record the suite's pass/skip counts from `node --test "dist-test/**/*.test.js"` (828 pass at 92c4c08, critic), `graphify --version` 0.9.29 and `codegraph --version` 1.6.0 on PATH for quickstart.md; re-anchor on the head every `file:line` plan.md and research.md cite (#4 touched src/adapters/{registry,sdd,detect}.ts, src/change/carry.ts, src/commands/{change,doctor,roadmap}.ts, src/doors/flow.ts, src/lib/{code-in-change,repo-state}.ts); re-run with `node` over the head's dist the top-level `<dir>/**` globs of `nonCodeGlobs(loadConfig('.'), 'brain')`, minus `graphify-out` and `.codegraph`, and confirm research.md R11's 12 lines and the `(+N)` of 11 (no SDD) and 12 (speckit) in src/lib/code-in-change.ts's current output; re-run research.md R17's "today" counts with `git grep -c -E`

## Phase 2: Foundational (Blocking Prerequisites)

The law first (Constitution III), then the registry data, the pure resolvers, the fixture and a
byte-neutral refactor of the door's literals that every story's lines share.

- [ ] T002 Write MV-148 into its reserved row in .multivac/invariants.md per research.md R18, verbatim — one physical line, authority `open`, state `proposed`, `<date>` the day of this commit — replacing `RESERVED by change graph-answers-where-asked — state the rule here before close.`
- [ ] T003 Append `**Amended <date> by MV-148**: …` at the end of the statement cell of MV-25, MV-50, MV-52, MV-90, MV-103, MV-122, MV-124, MV-128, MV-129, MV-131, MV-132, MV-134, MV-137, MV-139, MV-140 and MV-143 in .multivac/invariants.md, per research.md R18's table — exactly sixteen, each withdrawing only the sentences this change makes false; leave MV-61, MV-102, MV-123, MV-125, MV-144, MV-146 and MV-147 alone
- [ ] T004 Check that .multivac/changes/graph-answers-where-asked.md's `invariants.touches` lists exactly the sixteen rows of T003, `adds: [MV-148]`, `retires: []` (declared at e5d034f), and run every `absent` leg regex of .multivac/invariants.md over the text T002 and T003 wrote: 0 matches (critic gap 12)
- [ ] T005 [P] In src/adapters/registry.ts add to `AdapterSpec` the doc-commented `rebuild?: string`, `askAt?: string` (next to `queries`) and `remove?: string`, `harness.uninstall: string` and a platform's `uninstallFirst?: true`, per data-model.md; on graphify set `rebuild: 'graphify update . --force'`, `askAt: '--graph {checkout}/graphify-out/graph.json'`, `harness.uninstall: 'graphify uninstall --project --platform {key}'` and `uninstallFirst: true` on the gemini platform, each with a comment quoting research.md R4/R5/R13's 0.9.29 measurements; on codegraph set `askAt: '-p {checkout}'` and `remove: 'codegraph uninit --force'` with the 1.6.0 measurements; leave `graphignore` in place (US4 removes it)
- [ ] T006 [P] In src/adapters/detect.ts add `brainHoldsCode(cfg)`, `askedGraphers(cfg)` beside `adaptersByRoot`, and `brainRefreshGrapher(cfg)`, per data-model.md *Resolution*, reading the top level only through `ownDecl` (MV-122's dotted leg and #3's bracket leg stay at 0); no guard yet (US3)
- [ ] T007 [P] In test/helpers/fixture.ts give `makeScratchEcosystem(tmp, opts?)` an option `{ brainIsCode?: true }` that adds `brain: .` under `repos:` and a tracked `src/app.ts`; the default stays code-less (#3's SDD tests depend on it)
- [ ] T008 [P] In src/doors/brain.ts, with no byte of any door changing: make the `ASK` a module constant holding the stem `'ASK IT BEFORE READING THE TREE RAW'` without the period, `grapherLines` appending `.` (MV-61's leg stays at 1); move the freshness ternary into one helper `freshness(hooked)` whose else branch is spelled `: 'refreshed at \`change land\` and \`change close\`';` (MV-140's leg stays at 1) and call it from `grapherLines` with today's condition; move the no-query line into one helper `noQueryLine(name, indent)` (MV-61's `has NO query command` stays at 1) — the existing door tests pass unchanged (critic gap 4)
- [ ] T009 [P] In test/doctor/adapters.test.ts add 'the graphers asked from the brain, and the one its hook runs': `askedGraphers` for a code-less brain (`{ graphify: [web, api] }`), brain==code (the brain's key first), a `managed: false` repo left out, zero repos with a top-level grapher (`{ graphify: [] }`), and an unverified name; `brainRefreshGrapher` for one grapher, for web graphify + api codegraph (undefined), and for a `grapher: none` repo beside a graphify repo (graphify); `brainHoldsCode` for `brain: .`, `core: .` and none; extend the registry snapshot (:463) with `rebuild`, `askAt`, `harness.uninstall`, `uninstallFirst` and `remove` (FR-001, FR-002)

**Checkpoint**: the law states the change; the data, the resolvers and the fixture exist; the door's literals are each spelled once — user story work can begin

## Phase 3: User Story 1 - The agent in the brain is told where to ask, and the answers' paths are placed (Priority: P1) 🎯 MVP

**Goal**: a code-less brain's door names each code repo's graph and the flag that reaches it; a brain==code door adds its worktrees' form; `change apply` names the flag that reaches each checkout's graph; every such pointer places its answers' paths; `change close` removes a worktree holding only the grapher's outputs.

**Independent Test**: quickstart.md Walk B and Walk C step 1, with graphify 0.9.29, in a scratch code-less brain with two code repos; Walk E step 4 for a brain that holds code.

- [ ] T010 [P] [US1] Add test/doors/where.test.ts with "a code-less brain's door names each code repo's graph and the flag that reaches it" (MV-148's leg): the head line and the two-repo graphify block equal contracts/cli-output.md's, at most 1,000 B, no `## graphify`; a codegraph group carries `-p <repo>` and never `<checkout>`; a group with no post-edit door says `refreshed at \`change land\` and \`change close\``; zero repos with `grapher: graphify` and a config whose repos are all `managed: false` or `grapher: none` give the unresolved line and no verb; an unverified grapher gives no group and no head; a code-less brain whose repos resolve graphers with no top-level grapher pins its bytes; the brain==code door keeps both grapher lines byte for byte and appends the graphify line (and the codegraph line for a codegraph brain); a brain==code brain with a sibling renders the siblings head; the consumer door is byte-identical to a pinned copy; no rendered line says "code only" (FR-003–FR-005, FR-008, FR-010; SC-002, SC-007)
- [ ] T011 [P] [US1] Add test/change/graph-where.test.ts with "apply names the flag that reaches each checkout's graph" (MV-148's leg), with stub binaries on a PATH the test builds: a worktree holding a committed graph → `its graph: --graph <wt>/…`; the first change after equip → the base line naming the repo checkout; neither → the none line; a codegraph worktree → the base index line and never `-p <wt>`; codegraph branched in place → `its index: -p <abs>`; `grapher: none` or unverified → nothing; a brain==code brain's own main checkout → nothing new; a partial state → `cannot be pointed at — <reason>`; a path with a space is single-quoted; every printed line that names a flag carries "paths in its answers are relative to" (FR-007, FR-008; SC-003, SC-007)
- [ ] T012 [P] [US1] In test/change/grapher-refresh.test.ts add "a worktree holding only the grapher's outputs is removed at close": a worktree whose `git status --porcelain` is `?? graphify-out/cache/` and ` M graphify-out/graph.json` is removed and says `worktree removed`; one also holding `?? notes.txt` is kept with today's warning (FR-009, SC-005)
- [ ] T013 [P] [US1] In test/doors/ecosystem-graph.test.ts extend 'the doors name it, with graphify\'s --graph verbs only where graphify resolves — MV-139' (no leg reads this title; MV-139's reads :61's) with a code-less brain whose code repos resolve graphify and one with no repo and `grapher: graphify`: both brain doors carry the three `--graph .multivac/ecosystem.json` verbs; a consumer of a codegraph brain still gets none (FR-006, SC-006)
- [ ] T014 [P] [US1] In test/change/concurrency.test.ts keep 'both live at once' (MV-25's leg reads it) and make its exact-stdout match of `change apply` account for the pointer line, or run it on a grapher-free fixture (FR-007)
- [ ] T015 [US1] In src/doors/brain.ts add `export function whereLines(config, groups, holds)` per data-model.md and contracts/cli-output.md — the head from the `ASK` stem, the group lines from `freshness(postEdit && brainRefreshGrapher(config) === name)` with ` there`, the verbs with `askAt` rendered `<checkout>` for `shared` and `<repo>` for `local`, `noQueryLine`, the unresolved line — and make `renderBrainDoor` use it in place of `grapherLines` where `!brainHoldsCode(config)`, and, where the brain holds code, append the brain==code line after `grapherLines` (never inside it — the consumer door shares it, MV-90) and `whereLines` over the groups without the brain's key; never cite a vendor section there (FR-003–FR-005, FR-008, FR-014)
- [ ] T016 [US1] In src/doors/ecosystem.ts make `ecosystemGraphLines(cfg, 'brain', …)` give graphify's `--graph` verbs when `askedGraphers(cfg).has('graphify')`; a consumer key keeps `adapterFor(cfg, key, 'grapher') === 'graphify'` (FR-006)
- [ ] T017 [US1] In src/commands/change.ts add `async function graphPointer(cfg, key, ws, abs)` (spelled `^async function graphPointer\(` for MV-148's leg) per data-model.md *Pointer states*, probing `initState(spec, ws)` and, when `ws !== abs`, `initState(spec, abs)`, and in `cmdApply`'s "work here" loop print its line under each `  <key>: <ws>` (FR-007, FR-008)
- [ ] T018 [US1] In src/commands/change.ts `removeWorktrees` run `gitRun(repo, ['worktree', 'remove', '--force', wt])` when every `git status --porcelain` path matches the key's grapher `local` globs (picomatch, as src/lib/code-in-change.ts matches); otherwise keep today's restore of a lone shared artifact and today's removal and warning (FR-009)

**Checkpoint**: User Story 1 is functional and testable on its own — the door and `apply` point at each checkout's graph in any brain

## Phase 4: User Story 2 - The brain's refresh follows edits into the code and never into a checkout of the brain (Priority: P1)

**Goal**: a code-less brain's post-edit hook runs only in a code repo's checkout holding the artifact, wired only where it can run, and every surface says "after your edits" only of the grapher it runs.

**Independent Test**: quickstart.md Walk C step 2 and Walk G steps 4–5; the four payloads of US2 with a stub grapher.

- [ ] T019 [P] [US2] In test/doors/graph-navigation.test.ts add "a code-less brain's hook never refreshes a checkout of the brain" (MV-148's leg): `refreshHookCmd(…, true)` run synchronously with a stub grapher over a brain-file payload and a brain-worktree payload leaves a kept stub graph byte-identical, and over a sibling-repo payload and a sibling-worktree payload runs there; pin `refreshHookCmd` without `follow` to today's 492 B (graphify) and 558 B (codegraph) strings and with it to 540 B and 606 B; keep 'the post-edit refresh runs in the repo of the edited file when it holds the graph — MV-140' (MV-140's leg reads it) unchanged (FR-011; SC-008, SC-009)
- [ ] T020 [P] [US2] In test/doors/doors.test.ts keep 'grapher declared + present: harness post-edit entry, git shim untouched' (MV-52's leg reads it) — its code-less fixture now gets the follow entry, asserted by the `[ ! -e "$t/.multivac/config.yml" ]` substring — and keep 'no grapher declared: no refresh entry at all' (MV-52's leg); add web graphify + api codegraph → no refresh entry and the mixed notice; the binary in one of two graphify repos' `node_modules/.bin` and not on PATH → no refresh entry and the unreachable notice; a brain==code brain → today's entry byte for byte (FR-011–FR-013; SC-010, SC-011)
- [ ] T021 [P] [US2] In test/doors/flow.test.ts add 'the refresh row promises an edit refresh only for the grapher the brain's hook runs': web graphify + api codegraph with a post-edit door → neither grapher row says `after each edit through the harness hook`; one grapher → its row does (FR-014; SC-010)
- [ ] T022 [P] [US2] In test/doctor/doctor.test.ts add the code-less refresh paths of contracts/cli-output.md: wired → `follows your edits into the code repos' checkouts`; mixed → `the code repos resolve graphify and codegraph`; a brain==code brain → today's line (FR-015; SC-010)
- [ ] T023 [US2] In src/doors/settings.ts give `refreshHookCmd(refresh, env, artifact, follow?)` the follow toplevel test, emitted literally as `[ ! -e "$t/.multivac/config.yml" ] && ` with no `${…}` in it, then `… && cd "$t" || exit 0; `; without `follow` the bytes are today's; pass `follow` through `installHookConfig`; no `--force` anywhere in the file (MV-148's `absent` leg) (FR-011)
- [ ] T024 [US2] In src/commands/doors.ts give `projectInto` a `follow` flag and the roots whose binary lookup decides the wiring; project a code-less brain with `brainRefreshGrapher(cfg)` and `follow: true`, wired only when `missingRequired(spec, root.dir)` is empty for every writable code repo resolving it; print the mixed or the unreachable notice of contracts/cli-output.md otherwise; pass `follow` as `…, notices, spec?.artifacts[0], follow)` and move MV-140's leg `/notices, spec\?\.artifacts\[0\]\)/` to `/notices, spec\?\.artifacts\[0\], follow\)/ unique` in .multivac/invariants.md; MV-52's `missingRequired\(spec, dir\)` stays unique (FR-012, FR-013)
- [ ] T025 [US2] In src/doors/flow.ts write the automatic refresh row's "after each edit through the harness hook, and " only when a declared door has a post-edit hook and `brainRefreshGrapher(config) === name` (critic gap 11) (FR-014)
- [ ] T026 [US2] In src/commands/doctor.ts `grapherLines` make the refresh path of a code-less brain the three forms of contracts/cli-output.md, asking `brainRefreshGrapher` and the same reachability as T024; a brain==code brain keeps today's line (FR-014, FR-015)

**Checkpoint**: User Stories 1 and 2 work; a code-less brain's door, ecosystem verbs and hook no longer depend on the brain resolving a grapher

## Phase 5: User Story 3 - A brain that holds no code keeps no code graph, and nothing about that is silent (Priority: P1)

**Goal**: the brain resolves no grapher unless a repos entry is the brain; `init` counts untracked source; every surface that skips the brain says so; a kept install is reported with its removal and never touched.

**Independent Test**: quickstart.md Walk A and Walk D; `test/change/codeless-brain.test.ts` with a stub grapher.

The guard (T047) turns 25 tests red on its own (critic gap 1); four of them turn green only with
US1's T015/T016 and US2's T024, already in the tree, and flow.md's T048, committed with it. The
tests below are written first; T047 and T048 land in one commit.

- [ ] T027 [P] [US3] In test/doctor/adapters.test.ts rewrite the `adapterFor(cfg, 'brain', 'grapher')` assertions at :396 (in 'the SDD runs in the brain alone … — MV-146') and :427 (in 'one resolver answers for both kinds: a grapher per root, the SDD for the brain alone') to `undefined` for a brain no repos entry declares (no leg reads either title), and add 'a brain resolves a grapher only where a repos entry is the brain': undefined with repos `{ web, api }` and top-level graphify; graphify with `brain: .` and with `core: .`; codegraph with `core: { path: ., grapher: codegraph }`; code repos unchanged (FR-016)
- [ ] T028 [P] [US3] Add test/change/codeless-brain.test.ts with "a code-less brain is never built, gated, refreshed or landed" (MV-148's leg), with a stub grapher: `init` → `repos sync` → `new`/`plan`/`apply`/`land`/`close` write nothing of the grapher in the brain; the archive commit names no brain graph; `graphGate` and `graphTrackedGate` never name the brain; a kept stub graph is byte-identical across the lifecycle and a brain-file hook payload; a change naming `brain` prints `(the brain)` and the plan line of contracts/cli-output.md, and land commits no brain graph (FR-016, FR-019; SC-012, SC-013, SC-016)
- [ ] T029 [P] [US3] In test/doctor/doctor.test.ts add "a kept install in a code-less brain is named with its removal, gemini first" (MV-148's leg): probes for claude, gemini and agents give `--platform gemini` first and the residue clause; codegraph gives `codegraph uninit --force`; a `graphers:` grapher gives `git rm … && rm -f`; after the removal only the fact line remains; `graphify update .` and `graphify install` are never offered for the brain; the exit code is unchanged; no `none @ brain` line; `leftoverGraphs` finds an undeclared platform's probe and reports `tracked`; then move the file's 12 `@ brain` grapher assertions to the `brainIsCode` fixture, keeping every title a leg reads (MV-21, MV-47, MV-53, MV-57, MV-75, MV-87, MV-146, MV-147) (FR-018, FR-020, FR-021; SC-013, SC-017)
- [ ] T030 [P] [US3] In test/repos/check.test.ts add 'a code-less brain with no graph is ok, and a kept install is a fact on its line — MV-148': exit 0, `; leftover graphify install (tracked)` on the brain's line; keep every MV-132, MV-141 and MV-146 title (FR-023; SC-013)
- [ ] T031 [P] [US3] In test/init/equip.test.ts add "untracked source makes the brain code" (MV-148's leg): an untracked `src/server.ts` gives `brain: .` and a graph; add 'an empty repo declaring a grapher it cannot find exits 0 and writes none of it': graphify off PATH → exit 0, no `graphify-out/`, `.graphifyignore`, skill or section, and the init line; give 'declared at init, installed at init: spec-kit scaffolded and the graph built — MV-128' (:44) a source file, and keep 'a tool init would run and cannot find refuses init before anything is written — MV-128' (:86) refusing graphify in a repo holding a source file; where "a fresh brain's step 0 has to pass the code-in-change gate" and "step zero passes its own gate" (MV-142's legs) init an empty repo with `--grapher`, give it a source file (FR-017, FR-018; SC-014, SC-015)
- [ ] T032 [P] [US3] In test/init/reinit.test.ts extend 'init and doors write the same door, byte for byte' (MV-102's leg reads it — keep the title) with a code-less brain holding a kept graphify install: the door both write carries the leftover line and is byte-identical; after the removal and `doors`, the line is gone (FR-022; SC-018)
- [ ] T033 [P] [US3] In test/init/init.test.ts keep 'the scaffolded door names the declared grapher — MV-102' (MV-102's leg reads it): an empty-repo `init --grapher graphify` is now code-less, and its door matches `/graphify/` and `/graphify query/` through the ecosystem verbs and the unresolved line (FR-004, FR-006)
- [ ] T034 [P] [US3] In test/doors/flow.test.ts, in 'the page sorts declared obligations into automatic, gate and yours' (:49; no leg reads it), make the code-less fixture's gate row `` `change close` refuses while a repo the change names has no `graphify-out/graph.json` `` and add a brain==code case keeping "the brain or a repo the change names"; add 'a declared grapher no code repo resolves gets its own row' (the row of contracts/cli-output.md, and the brain not counted among the roots); keep 'an unverified adapter is named as declared-but-unknown, never guessed' (:140) passing (FR-025)
- [ ] T035 [P] [US3] In test/change/grapher-gate.test.ts keep 'close refuses while declared roots have no graph, naming every one at once' (MV-90's leg reads it): the code-less fixture refuses naming `api` and `web` (2 roots) and never `brain`; add a `brainIsCode` twin keeping the brain's refusal (3 roots) (FR-016)
- [ ] T036 [P] [US3] In test/change/grapher-tracked.test.ts move the tests at :92, :105, :132, :176, :236 and :247 to the `brainIsCode` fixture where they assert the brain, keeping 'close proceeds once the graph is committed' and 'the gate stages nothing — every index is exactly as it was' (MV-103's legs read them) (FR-016)
- [ ] T037 [P] [US3] In test/change/harness-install.test.ts give `tmp()` a committed `src/app.ts`, so its MV-131 and MV-143 tests — 'the door is linked before the vendor writes there' (MV-143's leg) among them — still install in the brain, and add 'a code-less brain gets no harness install' (FR-016)
- [ ] T038 [P] [US3] In test/change/equip-lifecycle.test.ts move 'change new refuses the SDD its steps need, before writing anything — MV-129' (:86; no leg reads it) to the `brainIsCode` fixture; 'apply makes a repo, equips it, and only then carries — MV-144' (MV-144's leg) unchanged (FR-016)
- [ ] T039 [P] [US3] In test/change/vendor-state.test.ts (12 `@ brain`) and test/change/binary-lookup.test.ts (7) move each assertion about the brain's grapher to the `brainIsCode` fixture; vendor-state's :235 (codegraph writes no `.graphifyignore`) stays (FR-016)
- [ ] T040 [P] [US3] In test/change/per-root.test.ts (2 `@ brain`), test/change/brain-only.test.ts, test/change/constitution-state.test.ts and test/change/sdd-gates.test.ts (1 each) move each assertion about the brain's grapher to the `brainIsCode` fixture, keeping every title a leg reads (FR-016)
- [ ] T041 [P] [US3] In test/change/grapher-refresh.test.ts move its 4 `@ brain` assertions to the `brainIsCode` fixture, keeping 'close refreshes before its archive commit, and that commit carries the graph', 'never a failed close' (MV-50's legs), 'close takes the SAME lock the post-edit hook takes, and waits for it' (MV-58), 'an unverified grapher refuses at close' (MV-59), 'repos sync builds a declared repo no change names' (MV-87) and 'land refreshes the graph on the change branch and commits it there' (MV-134) (FR-016)
- [ ] T042 [P] [US3] In test/repos/brain-first-class.test.ts make the undeclared brain's plan output (:104-106) read `(the brain)`; the declared one (:100) stays `(brain==code)`, so MV-12's `/brain==code/` leg keeps its matches (FR-019)
- [ ] T043 [P] [US3] In test/verify/code-in-change.test.ts keep `.graphifyignore` non-code (:208) and add 'every known grapher's paths are not code, whichever resolves': graphify's under a codegraph-only config and codegraph's under a graphify-only one; every MV-137, MV-142, MV-146 and MV-147 title kept (FR-024)
- [ ] T044 [US3] In src/lib/code-in-change.ts `nonCodeGlobs` (grapher loop, :100-108) take every name in `grapherNames` and every key of `cfg.graphers`, whichever resolves (FR-024)
- [ ] T045 [US3] In src/lib/repo-state.ts add `LeftoverGraph` and `export async function leftoverGraphs(cfg, dir)` beside `leftoverSdds` per data-model.md *Leftovers* — offline, every known grapher and every `graphers:` key, every platform probe, `uninstallFirst` platforms first (FR-020)
- [ ] T046 [US3] In src/doors/brain.ts give `renderBrainDoor(config, activeInvariants, leftovers = [])` the leftover line of contracts/cli-output.md per leftover; in src/commands/doors.ts and src/commands/init.ts (the door render at :630) pass `await leftoverGraphs(cfg, <brain dir>)` — both callers, so `init` and `doors` write one door (MV-148's `each` leg; MV-102's `renderBrainDoor\(cfg, countActiveInvariants` stays unique) (FR-022)
- [ ] T047 [US3] In src/adapters/detect.ts `adapterFor`, after #3's SDD guard, add `if (kind === 'grapher' && root === 'brain' && own === undefined) return undefined;` and amend the "Graphers still resolve per root" comment (:86-93) with the exception — committed together with T048, after T015, T016 and T024 (FR-016)
- [ ] T048 [US3] In src/doors/flow.ts count the brain among a grapher's roots only where `brainHoldsCode` (`declared`, :58), spell `const who = holds ? 'the brain or a repo the change names' : 'a repo the change names';` on one line for the gate row, and give a declared grapher no writable code repo resolves the row of contracts/cli-output.md in place of "no grapher is declared"; move MV-140's leg `/refuses while the brain or a repo the change names has no/` to `/'the brain or a repo the change names'/ unique` in .multivac/invariants.md (FR-025)
- [ ] T049 [US3] In src/commands/init.ts add `holdsFiles(dir)` (its one `await untrackedFiles(dir)`, per data-model.md), make `toolsInitWouldRun` pass the grapher only when it is true on a first run and use the same answer for the brain entry (:573), and print the init line of contracts/cli-output.md after `equip` (:738) in a code-less brain declaring a grapher; MV-128's `const wouldRun = await toolsInitWouldRun\(dir, kept, f\)` keeps its spelling (FR-017, FR-018)
- [ ] T050 [US3] In src/commands/doctor.ts `grapherLines` let the early return (:367) through the fact line and the leftover lines; print the fact line of contracts/cli-output.md (spelled `holds no code (no repos entry is the brain)`) where `askedGraphers` is non-empty or `leftoverGraphs` finds one, in place of `outOfScope`'s brain line; print one leftover line per `leftoverGraphs` entry from the entry's `harness.uninstall`, `uninstallFirst`, `remove` and paths — never a grapher's name; offer no refresh or install for the brain; exit code unchanged (FR-018, FR-021)
- [ ] T051 [US3] In src/commands/repos.ts `reposCheck` append `; leftover <name> install (tracked|untracked)` for each `leftoverGraphs` entry to a code-less brain's line, never FAIL over a graph there (FR-023)
- [ ] T052 [US3] In src/commands/change.ts `cmdPlan` label the synthetic brain entry `(the brain)` where `!brainHoldsCode(cfg)` (:945) and print the plan line of contracts/cli-output.md where a grapher is declared; reword the comments at :1325-1330 and :1424-1429 to "the brain where it holds code" (FR-019)
- [ ] T053 [US3] In src/adapters/refresh.ts reword the comments at :170-179, :281-286 and `graphGate`'s docstring to "the brain where it holds code" (FR-016)

**Checkpoint**: User Stories 1–3 work; a code-less brain keeps no graph and says so on every surface

## Phase 6: User Story 4 - The grapher's ignore lines keep out what is not code, reach existing repos, and land with the graph (Priority: P2)

**Goal**: derived, anchored ignore lines under a record, written before the first build and at land in the branch checkout, committed with the graph; a state-based rebuild; `doctor` names what is missing; nothing else writes them.

**Independent Test**: quickstart.md Walk C step 3, Walk E steps 1–3 and Walk F; the land test with a stub graphify that refuses to shrink.

- [ ] T054 [P] [US4] In test/change/grapher-refresh.test.ts add "land appends the derived ignore lines, rebuilds and commits them with the graph" (MV-148's leg) with a stub graphify whose `update .` exits 1 while nodes sit under a recorded line and whose `update . --force` purges them: one append, one rebuild, one commit carrying the artifact and `.graphifyignore`; a second land appends and forces nothing; a stub rebuild failing once leaves the file restored and uncommitted, and the next land rebuilds; a repo whose main checkout holds `.graphifyignore` untracked gets the named line and no created copy; the negation, sub-path and record skips; `repos sync`, `doors`, `doctor` and `verify` over an installed root leave the ignore file byte-identical (bytes and mtime); after land, `git status --porcelain` in the branch checkout names no `.gitignore` (critic gap 5) (FR-027–FR-029; SC-022, SC-023)
- [ ] T055 [P] [US4] In test/init/equip.test.ts make 'before the first build, the ignore lines go in, appended — MV-128' (:145; no leg reads it) expect the derived `(+N)` — 11 with no SDD, 12 with speckit, as T001 re-measured — and the file's content the record line plus the anchored lines, with no `/.codegraph/` or `/graphify-out/` (FR-026, FR-027)
- [ ] T056 [P] [US4] In test/verify/code-in-change.test.ts add 'the ignore lines are the root's non-code directories': the brain drops the mount; a code repo adds `/.brain/` and no `/specs/`; a nested declared repo is a relative line; no known grapher's output directory; a grapher without `graphignoreFile` gets `[]`; doors claude and codex give `/.claude/` and `/.codex/` and `/.agents/`; adding windsurf adds `/.devin/` (the stated dependence, critic gap 9) (FR-026; SC-020, SC-021)
- [ ] T057 [P] [US4] In test/doctor/doctor.test.ts add the three ignore facts of contracts/cli-output.md — the missing lines with "rebuilds if the graph holds nodes under them", the uncommitted file, the nodes still under a line — for an installed writable root, none for a read-only root, and the file byte-identical afterwards (FR-030)
- [ ] T058 [P] [US4] Add test/change/graphify-real.test.ts, skipped when graphify is not on PATH: after appending a line over a graph whose files lie under it, a plain `graphify update .` exits 1 and `graphify update . --force` exits 0 with fewer nodes; the `# multivac:` record changes no node count; `/specs/` keeps `src/specs/b.ts` — pinning the 0.9.29 facts MV-121 says to re-measure (FR-027, FR-029)
- [ ] T059 [P] [US4] In test/doctor/adapters.test.ts drop `graphignore` from the registry snapshot (:463) (FR-026, FR-031)
- [ ] T060 [US4] In src/lib/code-in-change.ts add `export function graphIgnoreLines(cfg, brain, scope, spec)` per data-model.md *Derivations* (FR-026)
- [ ] T061 [US4] In src/adapters/refresh.ts add `export const IGNORE_RECORD = '# multivac: kept out of the graph — '`; export `writeIgnores(name, spec, dir, scope, lines, opts?)` with the skip rules and boolean return of data-model.md, the `ignoredPaths` warning on the first-build path only; make `ensureGraphs` call `await writeIgnores(s.name, spec, s.dir, s.scope, graphIgnoreLines(…))` and move MV-128's leg `/await writeIgnores\(s\.name, spec, s\.dir, s\.scope\)/` to `/await writeIgnores\(s\.name, spec, s\.dir, s\.scope, / unique` in .multivac/invariants.md; `runHarnessInstalls` passes `[]`; add `export async function holdsIgnored(spec, dir)` (files only — MV-50/MV-52's `'git'|gitRun` `absent` leg holds) and make `refreshGraph` run `spec.rebuild` while it is true (FR-026–FR-029)
- [ ] T062 [US4] In src/adapters/registry.ts remove `AdapterSpec.graphignore` and graphify's `graphignore: [...]` (MV-148's `absent` leg), reword `graphignoreFile`'s doc, and replace codegraph's "No graphignore: no ignore file of codegraph's was verified" (:981) with research.md R14's 1.6.0 mechanism (FR-026, FR-031)
- [ ] T063 [US4] In src/commands/change.ts `commitGraph`, on the change's branch before `refreshGraph`, apply data-model.md *Land's ignore step*: the HEAD and repo-checkout reads here (never in refresh.ts, MV-103's leg), one `await writeIgnores(…, { gitignore: false, before: 'the refresh at \`change land\`' })` (MV-148's legs), the named line when it may not write, staging `[art, file]` (plus `ECOSYSTEM_PATH` in a brain checkout) when it appended, and the restore and warning when `holdsIgnored` is still true after the refresh (FR-028)
- [ ] T064 [US4] In src/commands/doctor.ts append the three ignore facts to each installed, writable root's grapher line whose grapher is verified with a shared artifact and a `graphignoreFile`, reading only; skip read-only roots without a new `s.readOnly) continue;` spelling (MV-125's `count=6`) (FR-030)

**Checkpoint**: all four stories work

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T065 [P] Amend site/content/docs/reference/graphers-and-sdd.md: new `### A brain that holds no code` under `## Graphers` (the predicate, what is skipped, the `init`/`doctor`/`plan` lines, the kept install and its printed removal — gemini first, review `git diff`, the residue — and how to declare `brain: .`) and `### Where to ask the graph` after `### What the graph answers` (`--graph`/`-p` from the brain, `apply`'s pointer lines, paths relative to the checkout asked, no codegraph worktree index yet, no byte saving against a narrowed grep and why the pointer exists); the ignore paragraph and the `(+5)` sample (:241-252) become the derivation, the anchoring, the record, the skip rules, the whole-directory `!/<dir>/` opt-out, the land retrofit, the state-based rebuild and that an old `specs/` line in a code repo is theirs to delete; the post-edit hook paragraph (:302: the follow form, wired where the binary is reachable, the mixed notice); the `change land` paragraph (:369: the ignore file lands with the graph); the gate and repository sections (:428, :449: "the brain where it holds code"); the doctor examples — no law ID, and none of the phrases research.md R17 lists (FR-034)
- [ ] T066 [P] Amend site/content/docs/reference/commands.md (the `init` sample's `(+N)` and a code-less sample with the init line, :53-71; "the graph's first build in the brain" → "in the brain when it holds code", :99-101; the `doctor` grapher rows; the `repos check` example; the `change apply` example with its pointer line; the `change close` example, :1558) and site/content/docs/reference/configuration.md (`grapher` and `repos.<key>`: a brain with no entry at path `.` keeps no code graph; `brain: .` makes it one; a README-only repo is code at `init`) (FR-034)
- [ ] T067 [P] Amend site/content/docs/guide/running-changes.md (:200-208, the apply sample gains the pointer lines; :320-321, the close sample of this code-less brain refreshes no brain graph and stages no `graphify-out/graph.json`), site/content/docs/guide/getting-started.md (:110-111, `init` installs the grapher in the brain only when it holds code), site/content/docs/concepts/composition.md (:77-80, `doors` wires the refresh where one grapher's binary is reachable) and README.md (:21-23, the graph in every code repo it sets up, and in the brain when it holds code) (critic gap 7) (FR-034)
- [ ] T068 [P] Amend skills/multivac/SKILL.md (:113-136, "Ask the graph before you read the tree": in a code-less brain ask each code repo's graph from here with `--graph <checkout>/graphify-out/graph.json` or `-p <repo>`, paths relative to that checkout, `change apply` prints each checkout's flag — the sentences made false, no trimming) and skills/multivac/references/change.md (:137-146 land also commits the ignore file; :152-153 "in the brain where it holds code, and in every repo the change names"; :168 a brain graph in the archive commit only where the brain holds code; :204-213 the follow-only hook) (FR-034)
- [ ] T069 [P] Amend DESIGN.md (:1368, the MV-52 passage: one sentence on the follow-only brain hook) and record the change in CHANGELOG.md's Unreleased section (MV-148: a code-less brain keeps no code graph and says so; where to ask; the follow hook; derived ignore lines landed with the graph) (FR-034)
- [ ] T070 Fix the source comments that would lie: src/adapters/detect.ts (`adapterFor`'s per-root rationale), src/adapters/refresh.ts (`writeIgnores`' doc, "before the first build" alone), src/commands/change.ts (`removeWorktrees`' "Uncommitted work is never forced"), src/adapters/registry.ts (`graphignoreFile`, `local`: "Nothing reads the shared, local and ignore lists yet") (FR-034)
- [ ] T071 Write MV-148's 40 legs of research.md R17 under its row in .multivac/invariants.md and dry-run each with `git grep -c -E` (`unique` 1, `absent` 0, `each` ≥1 per file, `count=16`); re-run every `absent` leg of the law over the tree: 0 (critic gap 12) (FR-032; SC-025)
- [ ] T072 In the brain's change worktree write `.graphifyignore` with the record line and the derived lines T001 confirmed (12 at 92c4c08, no `/.brain/`), run `graphify update . --force` there (a plain update refuses, research.md R13), review the graph diff (about −4,477 nodes, mostly `specs/` and `.multivac/`), and commit both on the change branch — land runs the installed release, which predates this change, so it cannot retrofit this brain itself (FR-033; SC-024)
- [ ] T073 Run `multivac doors`: AGENTS.md (and CLAUDE.md through the link) gains exactly the brain==code line; .multivac/flow.md and .multivac/ecosystem.json regenerate; .claude/skills/multivac/ is re-projected (FR-033; SC-019)
- [ ] T074 Build and run the full suite (`corepack pnpm test`, against T001's counts); `multivac verify` reports every claim anchored and 0 blocking; `grep -c 'Amended [0-9-]* by MV-148' .multivac/invariants.md` is 16 (SC-019, SC-025)
- [ ] T075 Walk quickstart.md A–H in scratch with graphify 0.9.29 and codegraph 1.6.0, `HOME` isolated, each `cd` and mutating command in one `&&` chain, and record the results in .multivac/changes/graph-answers-where-asked.md's body (SC-001–SC-005, SC-008, SC-012, SC-014, SC-017, SC-018, SC-020, SC-021, SC-023, SC-024)
- [ ] T076 Run `graphify update .` so graphify-out/graph.json matches the change (a plain update exits 0 after T072); `change land` commits it with `.graphifyignore` on the change branch

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: T001 before everything. T002 → T003 → T004 (the law before the code, Constitution III). T005–T009 run beside each other after T004; T009's tests compile once T005 and T006 exist.
- **US1 (Phase 3)** needs Phase 2 (T005 `askAt`, T006 resolvers, T008 literals). Tests T010–T014 first; T015 (brain.ts), T016 (ecosystem.ts), T017 → T018 (change.ts, one file).
- **US2 (Phase 4)** needs Phase 2 (T006 `brainRefreshGrapher`) and US1's T015 (the door's freshness). Tests T019–T022 first; T023 → T024 (the flag, then its caller); T025 and T026 beside them.
- **US3 (Phase 5)** needs US1 and US2: the guard T047 turns 25 tests red alone, and `test/doors/doors.test.ts:338` (MV-52), `test/init/init.test.ts:367` (MV-102) and `test/doors/ecosystem-graph.test.ts:107` go green only with T024, T015/T016; `test/doors/flow.test.ts:140` only with T048 — so **T047 and T048 land in one commit, after T015, T016 and T024** (critic gap 1). Tests T027–T043 first; T044, T045 → T046 (T046 reads T045); T047 + T048 together; T049–T053 after T045 and T047.
- **US4 (Phase 6)** needs Phase 2 and US3's T044 (`graphIgnoreLines` takes its directories from the every-grapher `nonCodeGlobs`). T060 → T061 (T061 calls T060) → T062 (the field can go once nothing reads it) → T063 (land calls T061's exports) ; T064 after T061.
- **Polish (Phase 7)** after every story: T065–T069 in parallel; T070 after T062 and T063; T071 after T065–T070 (the site legs and the `absent` re-run read them); T072 after T071; T073 after T072; T074 after T073; T075 after T074; T076 last.
- Same-file tasks never run in parallel: .multivac/invariants.md (T002–T004, T024, T048, T061, T071), src/doors/brain.ts (T008, T015, T046), src/commands/change.ts (T017, T018, T052, T063), src/commands/doctor.ts (T026, T050, T064), src/doors/flow.ts (T025, T048), src/adapters/registry.ts (T005, T062), src/lib/code-in-change.ts (T044, T060), test/doctor/doctor.test.ts (T022, T029, T057), test/doctor/adapters.test.ts (T009, T027, T059), test/change/grapher-refresh.test.ts (T012, T041, T054), test/init/equip.test.ts (T031, T055), test/verify/code-in-change.test.ts (T043, T056), test/doors/flow.test.ts (T021, T034).

## Parallel Example: User Story 1

```text
T010 test/doors/where.test.ts              T011 test/change/graph-where.test.ts
T012 test/change/grapher-refresh.test.ts   T013 test/doors/ecosystem-graph.test.ts
T014 test/change/concurrency.test.ts
then T015 src/doors/brain.ts  beside  T016 src/doors/ecosystem.ts  beside  T017 → T018 src/commands/change.ts
```

User Story 2: T019, T020, T021, T022 together; then T023 → T024 beside T025 and T026.
User Story 3: T027–T043 together, each in its own file; then T044, T045 → T046; T047 + T048 as one commit; then T049–T053.
User Story 4: T054–T059 together, each in its own file and after that file's earlier-phase task; then T060 → T061 → T062 → T063, T064.

## Implementation Strategy

MVP first: Phases 1–3. After T018 any brain's door and `change apply` point each verb at the
checkout it should ask, with the answers' paths placed — quickstart.md Walk B passes, and a
brain==code brain's door names its worktrees' form. Then US2, so the one refresh that follows
edits made from the brain session is in place; then US3, whose guard lands on surfaces that
already say the right thing, the binding decision; then US4. The change lands as one: `change
close` verifies MV-148's legs, which need every story and the Polish phase.

## Notes

- **Where these artifacts go beyond the design** (research.md): the gemini-first order is data on
  the platform entry (`uninstallFirst: true`, Principle V; T005, T045, T050); `change land`
  writes the grapher's ignore file alone (critic gap 5; T063); the derived lines leave out every
  known grapher's own output directory (critic gap 2; T060); every flag-naming apply line carries
  "paths in its answers are relative to" (FR-008; T017); the door's head no longer names the
  worktree (critic gap 8; T015); the brain==code line no longer says "code only" (critic gap 13;
  T015); four legs are added to the design's 36 (T071).
- **Not done here**: a repo-scope test in the follow hook (a ceiling, research.md R20); narrowing
  `init`'s predicate for README/LICENSE-only repos (a ceiling, research.md R2); a codegraph index
  per worktree, codegraph's ignore lines, per-grapher hooks (`codegraph-worktrees-and-verbs`).

## Coverage

| Requirement | Tasks | | Criterion | Tasks |
| --- | --- | --- | --- | --- |
| FR-001 | T005, T009 | | SC-001 | T010, T075 |
| FR-002 | T006, T009 | | SC-002 | T010, T075 |
| FR-003 | T010, T015 | | SC-003 | T011, T075 |
| FR-004 | T010, T015, T033 | | SC-004 | T075 |
| FR-005 | T010, T015 | | SC-005 | T012, T018, T075 |
| FR-006 | T013, T016, T033 | | SC-006 | T013, T033 |
| FR-007 | T011, T014, T017 | | SC-007 | T010, T011 |
| FR-008 | T010, T011, T015, T017 | | SC-008 | T019, T075 |
| FR-009 | T012, T018 | | SC-009 | T019 |
| FR-010 | T010 | | SC-010 | T020, T021, T022 |
| FR-011 | T019, T020, T023 | | SC-011 | T020, T024 |
| FR-012 | T020, T024 | | SC-012 | T028, T075 |
| FR-013 | T020, T024 | | SC-013 | T028, T029, T030 |
| FR-014 | T008, T015, T021, T022, T025, T026 | | SC-014 | T031, T075 |
| FR-015 | T022, T026 | | SC-015 | T031 |
| FR-016 | T027, T028, T035–T041, T047, T053 | | SC-016 | T028 |
| FR-017 | T031, T049 | | SC-017 | T029, T075 |
| FR-018 | T029, T031, T049, T050 | | SC-018 | T032, T075 |
| FR-019 | T028, T042, T052 | | SC-019 | T073, T074 |
| FR-020 | T029, T045 | | SC-020 | T056, T075 |
| FR-021 | T005, T029, T050 | | SC-021 | T056, T075 |
| FR-022 | T032, T046 | | SC-022 | T054 |
| FR-023 | T030, T051 | | SC-023 | T054, T075 |
| FR-024 | T043, T044 | | SC-024 | T072, T075 |
| FR-025 | T034, T048 | | SC-025 | T004, T071, T074 |
| FR-026 | T055, T056, T059, T060, T062 | | | |
| FR-027 | T054, T055, T058, T061 | | | |
| FR-028 | T054, T063 | | | |
| FR-029 | T054, T058, T061 | | | |
| FR-030 | T057, T064 | | | |
| FR-031 | T005, T059, T062 | | | |
| FR-032 | T002, T003, T004, T071 | | | |
| FR-033 | T072, T073, T076 | | | |
| FR-034 | T065–T070 | | | |
