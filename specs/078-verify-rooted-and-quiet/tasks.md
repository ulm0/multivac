---
description: "Task list for verify-rooted-and-quiet"
---

# Tasks: A run reads the checkout that holds where it was asked, and says one line when nothing is off

**Input**: Design documents from `/specs/078-verify-rooted-and-quiet/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included: every claim here lands with a check (Constitution I, "tests ship with
behaviour"). Work in the change's worktree, `.multivac/worktrees/verify-rooted-and-quiet/brain`.
This change lands after graph-answers-where-asked (#5), codegraph-worktrees-and-verbs (#6) and
change-file-cites (#7): every `file:line` below is the design's (main at 62d4588) and is
re-anchored by T001 on the tree with the three merged; each task names its function first. No
task retitles a test an existing `@anchor` leg reads: a task that edits such a test keeps its
title and names the leg. A leg a task makes false is moved in `.multivac/invariants.md` by that
same task. Site pages name no law ID and no version string (MV-126, MV-84).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Confirm the base and a green build from the worktree's root: graph-answers-where-asked, codegraph-worktrees-and-verbs and change-file-cites are closed and merged (MV-148, MV-149 and MV-150 stated; #7's `OpenChanges.changes`, `Evaluated.closeRefusals` and the finished line's refusing variant in src/commands/verify.ts; #6's `installHookConfig(dir, hookConfig, refreshes, notices)` reading only `hookConfig.path` and `hookConfig.postEdit`; #5's and #6's refresh hooks in `.claude/settings.json`); record that head as the quickstart's `BASE_REV`; `git status --porcelain` empty; `corepack pnpm build` exit 0; record the suite's pass/skip counts from `node --test "dist-test/**/*.test.js"`; confirm `change new` reserved MV-151 (else substitute the reserved ID in every artifact, the notes' count leg included); re-read MV-150 as enacted in .multivac/invariants.md for "MV-86's `requires:` floor makes the brain loud and does not reach a consumer's run" and record whether R17's MV-150 note is written; re-anchor every `file:line` plan.md and research.md cite (src/commands/{verify,count,doctor,doors,roadmap}.ts, src/cli.ts, src/lib/{git,out,config,code-in-change}.ts, src/adapters/registry.ts, src/anchor/evaluate.ts, src/hooks/install.ts, src/types.ts, site/content/docs/reference/{commands,configuration,hooks}.md, DESIGN.md, skills/multivac/{SKILL.md,references/verify.md}); re-measure this brain's green report and quiet line with `node dist/cli.js verify --check | wc -c` (348 B and 195 B at 62d4588) and each command string in `.claude/settings.json` (`wc -c`; #5 pins its refresh commands at 492/558/540/606 B), and adapt contracts/cli-output.md where the merged text differs; re-list the tests that spawn the built CLI (`git grep -n -E "process\.execPath|exec node" -- test`); re-run research.md R16's "today" counts with `git grep -c -E`

## Phase 2: Foundational (Blocking Prerequisites)

The law first (Constitution III), then the plumbing every story reads: the toplevel read, the
context and command fields, the output tap, the test environment and the dispatcher's io.

- [X] T002 Write MV-151 into its reserved row in .multivac/invariants.md per research.md R17, verbatim — one physical line, authority `open`, state `proposed`, the date the day of this commit — replacing `RESERVED by change verify-rooted-and-quiet — state the rule here before close.`; check the line holds exactly 7 `|` (FR-038; SC-042)
- [X] T003 Append `**Amended <date> by MV-151**: …` at the end of the statement cell of MV-53, MV-112, MV-127 and MV-138 in .multivac/invariants.md per research.md R17 — and of MV-150 only if T001 found its consumer-floor sentence; nothing else in those rows changes (FR-038; SC-042)
- [X] T004 Check that .multivac/changes/verify-rooted-and-quiet.md declares `invariants.touches` exactly as T003 wrote notes (MV-53, MV-112, MV-127, MV-138, and MV-150 only with its note), `adds: [MV-151]`, `retires: []` and `claims: [MV-151]` in ID form — declare them there before `change apply` if the declare commit did not — and run every active `absent` leg regex of .multivac/invariants.md over the text T002 and T003 wrote: 0 matches in the globs that text enters (FR-038)
- [X] T005 [P] In src/lib/git.ts, after `normUrl`, add `export class ToplevelError`, `export async function toplevel(dir)` (spelled with `['-C', dir, 'rev-parse', '--show-toplevel']` and `{ env: cleanEnv() }`; null only when `gitFailure` matches `/not a git repository|must be run in a work tree/`, else `` throw new ToplevelError(`git rev-parse --show-toplevel failed in ${dir}: ${cause}`) ``) and `export async function superproject(top)` (`--show-superproject-working-tree`, same env, null on failure); in test/lib/git-env.test.ts add 'toplevel reads the work tree it is given, never the one GIT_DIR points at, and quotes any other refusal — MV-151' (a subdirectory's toplevel under an ambient `GIT_DIR` to another repo; null outside a repo and inside `.git`; a thrown `ToplevelError` for a missing directory); the file's existing tests unchanged (FR-002, FR-018)
- [X] T006 [P] In src/types.ts add `CommandContext.env?: Record<string, string | undefined>`, `CommandContext.stdin?: () => Promise<string | null>` and `Command.rooted?: true` with the doc comments of data-model.md (FR-032, FR-033)
- [X] T007 [P] In src/lib/out.ts add `tapOutput(t)`, the warning counter and `export const warnings = (): number => warned;`, route `say` and `warn` through the tap when one is set and count every `warn`; colour and every other helper unchanged; in test/lib/out.test.ts add 'a tap holds both streams in order and counts every warning — MV-151' (say, warn, say through a tap arrive in order with their stream; `warnings()` grows by one per warn, tapped or not; with the tap removed nothing is held) (FR-026)
- [X] T008 [P] In test/helpers/fixture.ts add `export function scrubbedEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv` — `process.env` without `MULTIVAC_QUIET` and `CLAUDE_PROJECT_DIR`, merged with `extra` — with its doc comment (FR-032)
- [X] T009 Spawn every test process that runs the built CLI with `scrubbedEnv(…)`: test/verify/code-in-change.test.ts (the `spawnSync('git', ['-C', b, 'merge', …])` of 'a real git merge runs pre-merge-commit before MERGE_HEAD exists, and is judged by the branch it merges — MV-137', :407–:431 on 564aed4; MV-137's leg reads that title — keep it), test/verify/law-death.test.ts (the commits that run the hooks written at :107 and :130; MV-106's, MV-107's and MV-117's legs read titles there — keep them) and test/init/equip.test.ts (the hook environments of the `mvac` wrappers written at :177, :256, :284 and :366 and the `spawnSync` at :340; MV-142's and MV-147's legs read titles there — keep them), and any file T001's grep added; then `MULTIVAC_QUIET=1 CLAUDE_PROJECT_DIR=/x node --test "dist-test/**/*.test.js"` matches T001's counts (FR-032; SC-041)
- [X] T010 In src/cli.ts make `main(argv, cwd, io = {})` with `io: { env?, stdin? }`, pass `cmd.run(rest, { cwd, env: io.env, stdin: io.stdin })`, add `function readStdin(): Promise<string | null>` (null on a TTY; null after 2,000 ms with `process.stdin.destroy()`; the concatenated text on `end`; null on `error`) and call `main(process.argv.slice(2), process.cwd(), { env: process.env, stdin: readStdin })` at the entry point, spelled `{ env: process.env, stdin: readStdin }`; no command reads either field yet, so every existing test passes unchanged (FR-029, FR-032)

**Checkpoint**: the law states the change; the toplevel read, the context fields, the tap, the scrubbed test environment and the dispatcher's io exist — user story work can begin

## Phase 3: User Story 1 - A run from any directory is the run at its checkout's root (Priority: P1) 🎯 MVP

**Goal**: `verify` resolves the root of the directory it is asked from before any config is read, judges and reports that root, and names it in one line when it is not the directory asked.

**Independent Test**: quickstart.md Walk A steps 1–4 and Walk F on scratch fixtures, and Walk D step 2.

- [X] T011 [P] [US1] Add test/verify/rooted.test.ts (scratch fixtures through `test/helpers/fixture.ts`, in-process `verify.run(argv, { cwd })`, ANSI stripped) with "a run from any directory of a checkout prints its root's report and names the root — MV-151" (MV-151's leg): a brain from `src`, `src/commands` and `.multivac/hooks`, and a consumer from `src` and `db/migrations` — with the `root` line removed each output is byte-identical to the root's; the root line reads `  root      <root> (asked from <rel>)`; at the root there is none; `[dir]` given as an absolute path outside the root gives an absolute `asked from` (FR-001, FR-003, FR-006; SC-001, SC-002)
- [X] T012 [US1] In test/verify/rooted.test.ts add 'a consumer whose root is not a git toplevel keeps its verdict from every directory in it — MV-151' (MV-151's leg): a repository `mono` with `services/api/.brain` naming `mount: .brain` and an `absent` leg broken in `services/api/src` — exit 1 and the same report from `services/api` and `services/api/src` (plus the root line); a brain fixture under a consumer's `test/fixtures` (default `mount:`) is not taken for the brain: `test/fixtures` and `test/fixtures/other` scope to the consumer's key (FR-004, FR-005; SC-006, SC-007)
- [X] T013 [US1] In test/verify/rooted.test.ts add 'a mount the brain names below the first level is found — MV-151' (no leg): `mount: docs/brain` recorded in `.gitmodules` — the consumer's root, `src` and `docs` each print `scoped to repo "<key>"`, exit 0; inside `docs/brain` the run is brain-scoped (FR-004, FR-005; SC-003)
- [X] T014 [US1] In test/verify/rooted.test.ts add 'a consumer subdirectory, a door and a stale pin answer as their toplevel — MV-151' (no leg): a repository with a projected door and no mount — from `src`, MV-127's warning naming the repository's root, exit 0; a stale mount — from the host, today's MV-49 text; from `src`, the same plus ` Run it in <host>.`, exit 2 (FR-004; SC-004, SC-005)
- [X] T015 [US1] In src/commands/verify.ts, after `findStaleMount`, add `export type Root` (the brain kind carrying `top`), `noConfig`, `namedMount`, `declaredMount`, `staleError(host, stale, from?)` and `export async function resolveRoot(start)` per data-model.md steps 0, 1, 3–8 and 10 (step 2 and 11 return `noConfig(start)` and step 9 is skipped until T029), spelling `const m = await namedMount(d);`, `const unnamed = findMount(real);`, `const wt = worktreeBrain(top);` and `if (await hasProjectedDoor(top)) return { kind: 'door', top };` exactly; leave the bodies of `worktreeBrain`, `findMount`, `findStaleMount` and `resolveRepoKey` unchanged; in .multivac/invariants.md move MV-127's leg `/if \(await hasProjectedDoor\(startDir\)\)/` and MV-138's leg `/const wt = existsSync\(join\(startDir, CONFIG_PATH\)\) \? null : worktreeBrain\(startDir\)/` to the new legs of research.md R16 (FR-003, FR-004, FR-038)
- [X] T016 [US1] In src/commands/verify.ts `runVerify` replace the lookup cascade (`const wt = existsSync(join(startDir, CONFIG_PATH)) ? null : worktreeBrain(startDir)` through the door branch, :1066–:1121 on 564aed4) with `const asked = resolve(ctx.cwd, a.dir ?? '.')`, `const root = await resolveRoot(asked)` and a switch on `root.kind` per data-model.md — `none` throws its message; `door` keeps MV-127's warning naming `root.top`, exit 0; `consumer` via `worktree` keeps MV-138's undeclared-key text; `consumer` via `mount` sets `lagging` and loads with `sddDeclaration: 'report'`; `brain` keeps the `--repo` warning; the `--worktree` warning and the `ConfigError` → exit 2 catch unchanged; MV-146's `sddDeclaration: 'report'` count stays 2 in verify.ts (FR-001, FR-005)
- [X] T017 [US1] In src/commands/verify.ts `runVerify` print the root line after the header lines and before the `read` lines when `!samePath(from, rootDir)` (`rootDir` the consumer's scope dir or the brain; `from` the real path of `asked`; `askedFrom` relative when inside), spelled with `(asked from ${askedFrom})` (FR-006)

**Checkpoint**: User Story 1 is functional and testable on its own

## Phase 4: User Story 2 - A brain change worktree is its own brain, and reads the change's siblings (Priority: P1)

**Goal**: a brain change worktree is a brain from every directory in it; each sibling is read in the change's own worktree for its key, else where the main checkout reads it; a sibling missing both ways names the main checkout.

**Independent Test**: quickstart.md Walk B, Walk D step 6 and Walk E.

- [X] T018 [P] [US2] In test/verify/rooted.test.ts add 'a brain change worktree is its own brain from every directory in it — MV-151' (MV-151's leg): with an active row `MV-999` whose `unique` leg matches nothing committed on the worktree's branch, `--check --strict` from `<wt>/src` exits 1 and names it `· blocking`, with no `scoped to repo`; the slug directory `.multivac/worktrees/<slug>` prints the main brain's report plus the root line, exit 0 (FR-007; SC-008, SC-010)
- [X] T019 [US2] In test/verify/rooted.test.ts add "a brain change worktree reads each sibling in the change's own worktree, else where the main checkout does — MV-151" (MV-151's leg): a code-less brain with siblings beside the main checkout, from the worktree's root and its `.multivac` — exit 0, no `not on disk`; with `path: ../<key>` and the change's own `api` worktree on the change's branch carrying a string an active blocking `absent` leg forbids, `--check --worktree` from the brain's worktree exits 1 reading `api: working tree on <branch>`; the same with `path: ../acme-api` and key `api`; a sibling missing both ways says `` run `multivac repos sync` in <main> `` on its read line and in its legs (FR-008, FR-009; SC-009, SC-012)
- [X] T020 [P] [US2] In test/doctor/doctor.test.ts add 'doctor in a brain change worktree finds the siblings the main checkout has — MV-151' (no leg): `repos      2/2 cloned` and no `git clone` advice from the worktree; with the change's own `api` worktree, the branches fact names `api: on <branch>`; a sibling missing both ways gains ` in <main checkout>` and still says `multivac repos sync` (MV-127's `each` leg over doctor.ts); 'doctor names the branch each repo is parked on, and whether it is the channel' (MV-53's leg) unchanged (FR-010; SC-011, SC-012)
- [X] T021 [US2] In src/commands/verify.ts add `export function siblingBase(brainDir)` (spelled `return worktreeBrain(brainDir)?.brain ?? brainDir;`) and `export function siblingDir(brainDir, key, path)` per data-model.md (spelled `const own = join(wt.brain, '.multivac', 'worktrees', wt.slug, key);` and `existsSync(own) ? own : resolve(wt.brain, path)`); in `resolveSources` read every entry that is not `isBrain` at `siblingDir(brainDir, key, e.path)` and in `stalenessLines` at `siblingDir(brainDir, key, entry.path)`; the brain's own entry stays at `resolve(brainDir, e.path)` (FR-007, FR-008)
- [X] T022 [US2] In src/anchor/evaluate.ts add `EvaluateOptions.missing?: string` and read it for a leg on a repo not on disk (`` detail: opts.missing ?? 'repo not on disk — run `multivac repos sync` to clone it' ``); in src/commands/verify.ts add `RepoSource.why?`, word `resolveSources`' missing entry as `` run `multivac repos sync` `` plus ` in <siblingBase(brainDir)>` when that is not `brainDir`, on the read line and in `why`, and pass `missing` from `evaluateCore` (FR-009)
- [X] T023 [US2] In src/commands/doctor.ts make `presentRepoDirs`, `reposLine`, `branchesLine`, `pinsLine` and `untrackedLine` iterate `[key, e]` and read `e.isBrain ? brain : siblingDir(brain, key, e.path)` (`presentRepoDirs` still skipping `isBrain`), spelled `siblingDir(brain, key, e.path)` at all five, and add ` in ${siblingBase(brain)}` to `reposLine`'s clone advice when that is not `brain`; no `resolve(brain, e.path)` remains (FR-008, FR-010)

**Checkpoint**: User Stories 1 and 2 work on their own

## Phase 5: User Story 3 - A mount is judged as the brain checkout it is (Priority: P1)

**Goal**: a mount stays brain-scoped with every brain gate, and words a missing sibling with its host, never `repos sync`.

**Independent Test**: quickstart.md Walk D steps 3–4.

- [X] T024 [P] [US3] In test/verify/rooted.test.ts add 'a mount is judged as the brain it is, and never advises repos sync — MV-151' (MV-151's leg): a submodule mount and a plain-clone mount — a staged deletion of an active row is refused (`law REFUSED … · blocking`, exit 1) from the mount and from its `.multivac` (with the root line); with the siblings not beside the mount, each missing read line says `beside this mount` and names the host once, its legs say `repo not on disk beside this mount — verify from a brain checkout`, no line contains `repos sync`, and the exit equals today's (FR-011, FR-012, FR-013; SC-013, SC-014)
- [X] T025 [US3] In src/commands/verify.ts add `mountHost(brainDir, cfg)` per data-model.md and, in `resolveSources`' missing branch, ask it once (`host ??= await mountHost(brainDir, cfg)`) and, with a host, write the read line `<key>: not on disk beside this mount — nothing read; verify in <host> for its verdict, or from a brain checkout` and `why` `repo not on disk beside this mount — verify from a brain checkout`; 'a consumer whose mounted config is refused prints the line, exits 0, and 1 under --strict — MV-146' in test/verify/code-in-change.test.ts (MV-146's leg) passes unchanged (FR-012, FR-013; SC-015)

**Checkpoint**: the three P1 stories hold; every brain gate holds wherever the brain is checked out

## Phase 6: User Story 4 - Ungoverned and failing lookups say where they are (Priority: P2)

**Goal**: outside a governed checkout nothing is walked and no advice names another directory; any other git refusal is quoted; a command refused below a brain names that brain.

**Independent Test**: quickstart.md Walk G.

- [X] T026 [P] [US4] In test/verify/rooted.test.ts add 'outside a work tree nothing is walked, and no advice names another directory — MV-151' (no leg): a directory in no repository — today's text byte for byte; one holding a child brain — `is in no git repository — nothing was verified; the brain at <child> verifies from there`; below an ungoverned toplevel — `is inside <top>, which no brain governs — nothing was verified`, no `init`, while a directory there holding an unnamed child brain keeps today's `matches no repo declared` answer; a vendored submodule of a brain — `is a submodule of <superproject>, which multivac verifies from there`; inside a stale-pin mount — MV-49's text with `Run it in`; every case exit 2; 'no config and no mount stays exit 2 with the init hint' and 'a hook somebody else wrote is not a multivac door — exit 2 stands — MV-127' (whose assertion at test/verify/consumer.test.ts:175 is today's text) and the tests MV-09's and MV-49's legs read there pass unchanged (FR-014, FR-015, FR-016, FR-017; SC-016, SC-018)
- [X] T027 [US4] In test/verify/rooted.test.ts add 'a git refusal other than no repository is quoted, not read as none — MV-151' (no leg; a chowned copy of a consumer when the test runs as root, else skipped and saying why — exit 2 from its root and `src`, the output naming `dubious ownership`) and 'rooting ignores an ambient GIT_DIR — MV-151' (no leg; `GIT_DIR` set to another repository in the environment the run is given leaves a brain's `src` run that brain's) (FR-002, FR-018; SC-017, SC-019)
- [X] T028 [P] [US4] Add test/cli/rooted-refusal.test.ts with 'a command refused below a brain names that brain — MV-151' (MV-151's leg): `change new x "x"` and `repos sync` through `main([...], <brain>/src)` exit 2 with `it is inside the brain at <brain>; run this there` and never `multivac init`; from a brain change worktree's `src` they name the worktree; at a toplevel with no brain and outside any repository the text is today's, byte for byte (FR-019; SC-019)
- [X] T029 [US4] In src/commands/verify.ts `resolveRoot` add steps 2, 9 and 11 of data-model.md — outside a work tree the child-brain message; `const sup = await superproject(top)` with `staleError(sup, top, top)` or the submodule message; below an ungoverned toplevel the `is inside` message — and turn a `ToplevelError` into a `ConfigError` (FR-014, FR-015, FR-016, FR-017, FR-018)
- [X] T030 [P] [US4] In src/lib/config.ts add `export function enclosingBrain(dir)` per data-model.md (imports gain `existsSync` and `dirname`) and, in `readConfig`'s no-config catch, spell `const holder = enclosingBrain(brainDir);` and print `no ${CONFIG_PATH} in ${brainDir} — it is inside the brain at ${holder}; run this there` when it is non-null, today's text otherwise (FR-019)

**Checkpoint**: every lookup that finds no governed root says where it is

## Phase 7: User Story 5 - One line when nothing is off (Priority: P2)

**Goal**: under `--quiet` or `MULTIVAC_QUIET=1` a run prints one line led by the summary when nothing is off, the reads that are not plain and non-gating stale pins beneath it, and the whole report byte for byte otherwise; the shims export the switch.

**Independent Test**: quickstart.md Walk A step 4, Walk D step 5 and Walk I steps 1–2.

- [X] T031 [P] [US5] Add test/verify/quiet.test.ts with 'a quiet run with nothing off is one line carrying summary, header, reads and enact — MV-151' (no leg): a brain, a consumer and a consumer change worktree — `['--quiet']` and `{ env: { MULTIVAC_QUIET: '1' } }` give the same single line, starting `0 blocking broken · exit 0`, carrying the header, the read clauses and the enact clause of contracts/cli-output.md (`(the change worktree for <slug>)` and `enact not answered (decided in the brain)` in the consumer forms); a code commit staged on an open change's branch ends `· enact none (law untouched) · code → <slug>`; on every fixture the exit code is the same with and without quiet (FR-020, FR-022, FR-025; SC-020, SC-021, SC-026)
- [X] T032 [US5] In test/verify/quiet.test.ts add 'anything off prints the whole report byte for byte — MV-151' (MV-151's leg): each case run quiet equals the run without quiet — a reported-only broken leg, a vacuous leg, a pending claim, a drift row, a moved leg under write, a parse error, a finished change under `--strict` (change-file-cites' refusing variant included), a gating stale pin, a staged law without enactment, an enactment, a refusal, a config new or modified, a code line with `SDD skipped at`, a refused code line, a mounted SDD refusal, law death, an unparsable open change file, an anchor on no row (FR-023, FR-024; SC-025)
- [X] T033 [US5] In test/verify/quiet.test.ts add 'a read that is not plain and a pin that does not gate print under the one line — MV-151' (MV-151's leg): parked, never fetched here, FELL BACK, behind its own channel, MID-MERGE, `--worktree`, not on disk, and a non-gating stale pin each give the one line and, beneath it, that read's or pin's full line; a gating pin gives the whole report (FR-022; SC-023, SC-024)
- [X] T034 [US5] In test/verify/quiet.test.ts add 'any warning prints the whole report, streams in their order — MV-151' (MV-151's leg: `--repo` in a brain, and a planned change with an unknown frontmatter key warning before and during the report — both streams, captured in their interleaved order, equal the run without quiet) and 'a quiet run that throws still prints what it had — MV-151' (no leg) (FR-026; SC-025)
- [X] T035 [US5] In test/verify/quiet.test.ts add 'through the shims, a code-only commit is one line and a law commit the whole report — MV-151' (no leg): a fresh brain whose shims `doors` wrote, a `mvac` wrapper on the PATH running `dist/cli.js`, every spawn through `scrubbedEnv` — the root commit prints in full (`is new here`), a law commit in full, a code-only commit one line, a commit weakening a row statement in full; a stub `mvac` that refuses unknown flags still lets the commit through (FR-020, FR-023, FR-027; SC-022)
- [X] T036 [P] [US5] In test/doors/doors.test.ts add 'every shim exports MULTIVAC_QUIET after its chain block and before its runners — MV-151' (MV-151's leg): each of the three shims holds `export MULTIVAC_QUIET=1` once, after the chain block's `fi` (or the non-chain `root=` line) and before `# The build is used only when this repo IS multivac`, under the two comment lines of contracts/cli-output.md, and matches `/MV-[0-9]+/` nowhere; 'hook shims installed and core.hooksPath set, brain and consumers' and the test MV-11's leg reads (`strict_pre_push`) unchanged (FR-027; SC-022)
- [X] T037 [US5] In src/commands/verify.ts make `Diagnostic.quiet: string | null` required (spelled `^  quiet: string \| null;$` as its own line) with the doc comment of data-model.md, and set it in every producer per data-model.md's table: `stalenessLines` null on every line, `configLine` null on every branch, `lawDeath` null, `enactmentLine` the three clauses and null elsewhere, `mountedRefusalLine` null, the consumer's enact line `enact not answered (decided in the brain)` (FR-021, FR-023, FR-025)
- [X] T038 [P] [US5] In src/lib/code-in-change.ts make `CodeLine.quiet: string | null` required (spelled as its own line `  quiet: string | null;`) and set it on every return: `` skipped ? null : `code → ${slug}` `` for "lands in open change", null for `unanswered`, the undeclared-repo refusal, the consumer line and the blocking line (FR-021, FR-023)
- [X] T039 [US5] In src/commands/verify.ts make `RepoSource.clause: string | null` required (spelled `^  clause: string \| null;$`), add `plainTree(key, wt, extra)`, set `clause` in `resolveSources` per data-model.md (brain and brain==code working trees through `plainTree`; a sibling at its channel with a fetch age, not off channel, not mid-merge; null for every other read and for `brainAtChannel`), and add `export async function consumerSource(key, dir)` used by `evaluateCore`'s scoped branch (FR-021, FR-022)
- [X] T040 [US5] In src/commands/verify.ts add `OpenChanges.unparsed: string[]` beside change-file-cites' `changes`, push the file name in `openChangeClaims`' catch, add it to the empty-open literal `evaluateCore` builds for a claim-scoped run, and return it on `Evaluated` (FR-024)
- [X] T041 [US5] In src/commands/verify.ts `runVerify`: add `quiet` to `ARGS` and `, --quiet` to `TAKES`; compute `quiet` from `a.quiet` and `ctx.env?.MULTIVAC_QUIET === '1'` and `warnedBefore = warnings()`; route every report line through `emit(text, quiet)` per data-model.md's table (change-file-cites' finished variant with null); under quiet install `tapOutput` before the first line; collect `unplain` (spelled `else if (quiet) unplain.push(d.text);` for non-gating stale lines); at the end flush the whole report when `finalExit !== 0 || blocking !== 0 || ev.unparsed.length > 0 || orphan`, `warnings() !== warnedBefore` or any held line is off, else `say([summary, ...rest].join(' · '))` and each `unplain` line; on a throw replay what was held and rethrow; `tapOutput(null)` in `finally`; exactly three direct `say(` remain in verify.ts (FR-020, FR-021, FR-023, FR-024, FR-025, FR-026)
- [X] T042 [P] [US5] In src/hooks/install.ts `shim()` insert, after the chain block and the non-chain `root=` line and before `'# The build is used only when this repo IS multivac: …'`, the two comment lines and `'export MULTIVAC_QUIET=1'` of contracts/cli-output.md; the emitted lines hold no row ID, no version, neither `graph` nor `refresh` (MV-52's blocking `absent` leg on this file matches inside words) and no `--git-common-dir` (MV-115's `count=3`); a source comment above may cite MV-151 (FR-027)

**Checkpoint**: quiet works from the flag and the variable; the shims carry the switch

## Phase 8: User Story 6 - The harness hook asks through its payload, and the gate strings never move (Priority: P2)

**Goal**: under the claude door's declared payload, a session start is quiet and starts at the payload's session directory, and an edit gate follows the edited file into the checkout that governs it; no settings.json string moves.

**Independent Test**: quickstart.md Walk C, and Walk I step 5.

- [X] T043 [P] [US6] In test/verify/rooted.test.ts add 'the post-edit run roots at the edited file when a brain governs it — MV-151' (MV-151's leg), through `verify.run([], { cwd, env: { CLAUDE_PROJECT_DIR: cwd }, stdin: async () => payload })`: an edit in a brain change worktree breaking a blocking leg follows — exit 2, the red report with the root line naming the worktree; a file under a directory in no repository, in an ungoverned nested repository, and in one holding only `.multivac/cache` stay at the session's root; with no marker, or with a `[dir]`, stdin is never read (a stub that throws proves it); a `Stop` event and unparsable input are ignored; a code-less brain session editing its own worktree's law reads the siblings at the channel; an edit in a consumer's change worktree gives `(the change worktree for <slug>)` (FR-029, FR-030; SC-028, SC-029, SC-030, SC-031)
- [X] T044 [US6] In test/verify/rooted.test.ts add 'a hook starts where its payload says, and never follows into a nested brain — MV-151' (MV-151's leg): `cwd` set to a directory outside the project with a payload whose `cwd` is the project — the session event gives the project's quiet line and the edit event the project's run, no `init`; without `cwd` in the payload the marker's value is used, and without either the process's directory; an edit inside a committed, deliberately red brain fixture below its repository's toplevel verifies the session's root and nothing of the fixture (FR-030; SC-030, SC-032)
- [X] T045 [P] [US6] In test/verify/quiet.test.ts add 'a session start is quiet through the hook payload, and the gate strings do not move — MV-151' (no leg): the `SessionStart` payload gives the same one line as `--quiet`; a `PostToolUse` payload does not make the run quiet (FR-020, FR-029, FR-031; SC-020)
- [X] T046 [P] [US6] In test/doors/settings.test.ts add 'an older doors over a newer projection leaves settings.json byte-identical — MV-151' (MV-151's leg): the projected session and edit gates equal the literals `mvac verify 2>&1 || true` and `mvac verify >&2 || exit 2`; merging over a settings.json this build projected — with the refresh hooks graph-answers-where-asked and codegraph-worktrees-and-verbs write, one grapher and two — returns it byte-identical with one session gate and one edit gate; 'the projected commands map the harness channels — MV-112' and 'a legacy bare gate is upgraded in place, per event — MV-112' (MV-112's legs) and the MV-52 and MV-74 titles in this file unchanged (FR-031; SC-033)
- [X] T047 [P] [US6] In test/doors/registry.test.ts add 'a hook payload names every field, and only the measured harness declares one — MV-151' (no leg): the claude target's `hookConfig.payload` holds `env`, `event`, `session`, `edit`, `file` and `cwd` as data-model.md states, and no other target declares one; 'every entry is one multivac can actually own' (MV-28's leg) unchanged (FR-028)
- [X] T048 [US6] In src/adapters/registry.ts add `export interface HookPayload` before `DoorTarget` with the doc comment of data-model.md, give `hookConfig` its `payload?: HookPayload`, and add to the claude target, on one physical line under the measurement comment naming Claude Code 2.1.283, `payload: { env: 'CLAUDE_PROJECT_DIR', event: 'hook_event_name', session: 'SessionStart', edit: 'PostToolUse', file: 'tool_input.file_path', cwd: 'cwd' },`; codegraph-worktrees-and-verbs' codegraph lines and every other target unchanged (FR-028)
- [X] T049 [US6] In src/commands/verify.ts add `async function hookAsk(ctx)` and `export function followable(root)` per data-model.md, and in `runVerify` compute `hook` (only with no `[dir]`), add `hook.session` to `quiet`, start at `a.dir !== undefined ? resolve(ctx.cwd, a.dir) : (hook.dir ?? ctx.cwd)`, and take `followed` (`await resolveRoot(dirname(resolve(asked, hook.file)))`) when `followable(followed)`, else `await resolveRoot(asked)`; src/doors/settings.ts is not edited (FR-029, FR-030, FR-031)

**Checkpoint**: a session start is quiet and the edit gate follows the edited file, with the gate strings unchanged

## Phase 9: User Story 7 - The version notice reads the brain the run reads (Priority: P2)

**Goal**: for the rooted commands the dispatcher reads MV-86's notice from the root's brain; a consumer hears the floor only.

**Independent Test**: quickstart.md Walk D steps 8–9.

- [X] T050 [P] [US7] In test/cli/version-skew.test.ts add 'a subdirectory and a consumer hear the floor the brain declares — MV-151' (MV-151's leg), through `main([...], cwd)`: `requires: ">=99.0.0"` in a brain and its mount prints the floor line exactly once from the brain, its `.multivac`, the consumer and the consumer's `src`; a consumer whose mount has no record and no floor prints no notice while the brain and the mount print the yellow one; a directory whose resolution throws (a stale pin) falls back to its own config; a non-rooted command (`change`) reads the directory's own config as today; no exit code moves; the tests MV-86's legs read (`the notice moved the exit code`, `only init and doors --adopt may`) unchanged (FR-033, FR-034, FR-035; SC-034, SC-035)
- [X] T051 [US7] In src/cli.ts look the command up before the notice and, for a command with `rooted`, read the config of `resolveRoot(cwd)`'s brain (`brain` or `consumer`) inside the existing guard, falling back to `cwd` on a throw; suppress a non-red notice in a consumer, spelled `const n = root?.kind === 'consumer' && found?.level !== 'red' ? null : found;`; keep `if (n) warn(paint(n))` the one print; set `rooted: true` on `verify` in src/commands/verify.ts, `count` in src/commands/count.ts, `doctorCommand` in src/commands/doctor.ts, `doorsCommand` in src/commands/doors.ts and `roadmap` in src/commands/roadmap.ts (FR-033, FR-034, FR-035)

**Checkpoint**: the floor reaches every run that reads the brain

## Phase 10: User Story 8 - `count`, `doctor`, `doors` and `roadmap` root the same way (Priority: P3)

**Goal**: `count` resolves through the same root and reads a consumer's own key as its checkout; `doctor`, `doors` and `roadmap` take the brain that holds the directory and name it when it is not the directory, compared by real path.

**Independent Test**: quickstart.md Walk A steps 5–6, Walk D step 7 and Walk I step 3.

- [X] T052 [P] [US8] In test/cli/count.test.ts add 'count from a subdirectory, a worktree or a consumer reads what verify reads there — MV-151' (no leg): a brain leg from `src` and from a brain change worktree's `src` exits 0 with the `read` line; `api:<glob>` from a consumer and from its change worktree's `src` reads `api: working tree … — this checkout`; a door with no mount prints `<top> carries a multivac door but no brain is mounted here — nothing to count against`, exit 2; 'count says what it read, and reads what verify reads — MV-109' (MV-109's leg) and the MV-40 and MV-48 titles unchanged (FR-036; SC-036, SC-037)
- [X] T053 [P] [US8] In test/doctor/doctor.test.ts add 'doctor from a subdirectory reports the brain that holds it and names it — MV-151' (no leg): from a fresh brain's `src`, exit 0 and `root      <brain> (asked from <dir>)` first; 'doctor: invalid config is the one exit-1 case' unchanged (FR-037; SC-038)
- [X] T054 [P] [US8] In test/change/roadmap.test.ts add "roadmap from a subdirectory lists the brain's changes and names the root — MV-151" (no leg): with one planned change, from `src` the root line and then `roadmap: 1 planned`; "roadmap add refuses a slug the brain's SDD refuses" (MV-147's leg) and 'a planned change is invisible to the unclosed-change gate' (MV-89's leg) unchanged (FR-037; SC-039)
- [X] T055 [P] [US8] In test/doors/doors.test.ts add 'doors from a subdirectory projects the brain that holds it and names it once — MV-151' (no leg): from `src`, `root: <brain> (asked from <dir>)` once, and the projection equals the run at the root (FR-037)
- [X] T056 [US8] In test/verify/rooted.test.ts add 'a symlinked path to the root is the root, and names no root — MV-151' (MV-151's leg): with `cwd` a symlink to a brain's root, `verify`, `doctor`, `doors` and `roadmap` print no root line (FR-006, FR-037; SC-040)
- [X] T057 [US8] In src/commands/verify.ts add `export async function rootedBrain(start)` per data-model.md (a `brain` root's brain, else `start`; a throw gives `start`) (FR-037)
- [X] T058 [US8] In src/commands/count.ts resolve through `root = await resolveRoot(startDir)` per data-model.md: `none` and `door` refuse with exit 2; `loadConfig`'s SDD mode keyed on `root.kind` (MV-146's count stays 1 here); `consumerKey` from the worktree's key or `resolveRepoKey`; keep `await resolveSources(brainDir, cfg, false)` (MV-109's leg) and replace the consumer's own key with `await consumerSource(consumerKey, root.dir)`; drop the unused `findMount`, `existsSync` and `CONFIG_PATH` imports (FR-036)
- [X] T059 [P] [US8] In src/commands/doctor.ts `doctorCommand.run` call `const brain = await rootedBrain(ctx.cwd);`, print `root      ${brain} (asked from ${ctx.cwd})` under `if (!samePath(brain, ctx.cwd)) say(`, and pass `brain` to `doctorReport` (FR-037)
- [X] T060 [P] [US8] In src/commands/doors.ts `run` set `const brainDir = await rootedBrain(ctx.cwd);` and print `root: ${brainDir} (asked from ${ctx.cwd})` under `if (!samePath(brainDir, ctx.cwd)) say(` (FR-037)
- [X] T061 [P] [US8] In src/commands/roadmap.ts `run` set `const brain = await rootedBrain(ctx.cwd);` and print `root: ${brain} (asked from ${ctx.cwd})` under `if (!samePath(brain, ctx.cwd)) say(` (FR-037)

**Checkpoint**: every rooted command answers for the checkout that holds where it was asked

## Phase 11: Polish & Cross-Cutting Concerns

Every page edit is dry-run against the active `absent` legs over its file before commit (MV-84's
version strings and MV-126's IDs on the site, MV-141's retired shim phrases over DESIGN.md and
the site, MV-111's arrow leg over `skills/**`, MV-121–MV-125, MV-146 and MV-147 over the root
Markdown files, `src/**`, `test/**`, the site and the skills).

- [X] T062 [P] Amend site/content/docs/reference/commands.md: add `### Where a run roots` (the site leg) before `### From a consumer repo` (:609) — the root order, the root's report plus the root line, the mount rule, the worktree sibling rule (the change's own worktree first), the outside-a-repository messages and the refusal that names the enclosing brain; the scope table (:384, :386) says "run anywhere in the brain's checkout" and "run anywhere in a code repo's checkout" instead of "cwd is …" (MV-151's `absent` leg); the consumer section (:609–:617) "run anywhere in a code repo's checkout"; the change-worktree paragraph (:647–:657) applies "from any directory of it", keeping `A change worktree is found from its path first.` at a line start (MV-138's site leg); the read-line sentences (:340, :394) gain the quiet clause form, keeping `What each run reads` (MV-53's site leg); a `--quiet` subsection (the line, the summary first, what prints beneath, what prints whole, the variable and the shims); the `verify takes …` samples (:150, :1746) equal today's `TAKES`; the no-config sample (:1751) beside the from-below, enclosing-brain and outside-a-repository variants; "Otherwise … it gets the `run multivac init .` hint" (:686) says when it still does; the `count` section (:703) roots from any directory and reads a consumer's own key as its working tree; the `doctor`, `doors` and `roadmap` sections show their `root` line; the stale-mount message sentence kept (MV-49's site leg) — no law ID, no version string (FR-039; SC-042)
- [X] T063 [P] Amend site/content/docs/reference/configuration.md (:672) with the same no-config variants, keeping `The ecosystem as published` (MV-53's leg) (FR-039)
- [X] T064 [P] Amend site/content/docs/reference/hooks.md: "re-checks after every write" (:268–:270) gains "in the checkout of the file written, when a brain governs it (read from the harness payload; the command above is unchanged)"; "A green run says nothing on either event, deliberately." (:286) becomes "After an edit a green run says nothing; at session start it is one line — summary, header, reads, enact." (MV-151's `absent` leg); the shim listing (:69–:103) copies the three new lines of contracts/cli-output.md exactly; codegraph-worktrees-and-verbs' refresh-hook paragraphs and MV-74's phrases untouched (FR-027, FR-039; SC-042)
- [X] T065 [P] Amend DESIGN.md: the table row (:626) "consumer-scoped (run anywhere in a code repo's checkout)" (MV-151's `absent` leg); "short sha, on every run" (:630–:631) qualified for a quiet run (MV-151's `absent` leg); one sentence on rooting under "Each context verifies what it is responsible for" (MV-53's leg kept); no MV-141 phrase (FR-039; SC-042)
- [X] T066 [P] Amend skills/multivac/SKILL.md (:59, "verify prints one `read` line per repo" gains "(a quiet run folds the plain ones into its one line)"; nothing added to the door block) and skills/multivac/references/verify.md (:90, "Every run prints a `read` line per repo …" becomes "A run prints a `read` line per repo, or on a quiet run a clause of its one line …" — MV-151's `absent` leg — plus a short "Quiet" paragraph), keeping `Read the .read. lines before you read the verdicts` (MV-53's skill leg) and matching no MV-111 arrow line; the copy under .claude/skills/multivac/ is re-projected by T069 (FR-039; SC-042)
- [X] T067 [P] In src/commands/verify.ts `verify.usage` add the `[--quiet]` synopsis, the `--quiet` lines, the `[dir]` sentence and the qualified read-line sentence of contracts/cli-output.md (FR-001, FR-020, FR-039)
- [X] T068 [P] Record the change in CHANGELOG.md's Unreleased section (MV-151): a run reads the checkout that holds where it was asked and names its root; the worktree, mount and monorepo fixes; the enclosing-brain refusal; quiet, its flag, its variable and the shims; the payload follow and the quiet session start; the notice from the root's brain (FR-039)
- [X] T069 Run `multivac doors` with the new build: `.multivac/hooks/{pre-commit,pre-merge-commit,pre-push}` regenerated with the export, `.claude/skills/multivac/` re-projected, `.multivac/ecosystem.json` re-rendered, AGENTS.md, CLAUDE.md and `.multivac/flow.md` byte-identical; `git diff --exit-code .claude/settings.json src/doors/settings.ts` passes (FR-027, FR-031; SC-033)
- [X] T070 Write MV-151's legs of research.md R16 under its row in .multivac/invariants.md and dry-run each with the new `mvac count` (or `multivac verify --check`): every count R16 lists, the three retired-phrase legs, the scope-table leg and T074's load-model leg 0, the shims' `each` 1 per shim, the row-ID leg 0, the notes 5 (4 without MV-150's); and MV-126's `site/content/** /mv-[0-9]+/i`, MV-84's version leg and MV-52's `install.ts /graph|refresh/` still 0 (FR-021, FR-038; SC-042)
- [X] T071 Build and run the full suite twice — `corepack pnpm test` and `MULTIVAC_QUIET=1 CLAUDE_PROJECT_DIR=/x corepack pnpm test` — against T001's counts; `multivac verify --strict` reports every claim anchored and 0 blocking; `grep -c 'Amended 2026-09-29 by MV-151' .multivac/invariants.md` is 6 — the five notes and the count leg's own line, which the leg does not read, so `count` gives 5 (T071 at apply: the matcher skips anchor lines) (FR-032; SC-015, SC-041, SC-042)
- [X] T072 Walk quickstart.md A–J in scratch with the built CLI, `HOME` isolated, each `cd` and mutating command in one `&&` chain, the payloads simulated as written, and record the results — every byte figure of spec.md's SCs as measured on the merged tree, and the replay of Walk J step 4 — in .multivac/changes/verify-rooted-and-quiet.md's body; Walk K is the human's (SC-001–SC-014, SC-016–SC-024, SC-027–SC-040)
- [X] T073 Run `graphify update .` so graphify-out/graph.json matches the change; `change land` commits it on the change branch

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: T001 before everything. T002 → T003 → T004 (the law before the code, Constitution III). T005, T006, T007 and T008 run beside T004; T009 after T008; T010 after T006.
- **US1 (Phase 3)** needs Phase 2. Its tests (T011–T014) are written first and fail; then T015 → T016 → T017 (one file).
- **US2 (Phase 4)** needs US1's resolver (T015–T016). T021 → T022 (T022 reads T021's `siblingBase`); T023 after T021.
- **US3 (Phase 5)** needs US2's missing-sibling wording (T022); T025 after T022.
- **US4 (Phase 6)** needs US1 (T015); T029 after T015 (same function); T030 alone.
- **US5 (Phase 7)** needs Phase 2's tap (T007) and US1's report path; T037 → T039 → T040 → T041 (verify.ts), T038 beside T037, T042 alone.
- **US6 (Phase 8)** needs US1 (the resolver) and US5 (the quiet line); T048 alone; T049 after T041.
- **US7 (Phase 9)** needs US1 (T015) and T006, T010; T051 after T010.
- **US8 (Phase 10)** needs US1 and US2 (doctor's siblings, T023); T057 → T058, T059 (after T023, same file), T060, T061.
- **Polish (Phase 11)** after every story: T062–T068 and T074 in parallel; T069 after T042 and T066; T070 after T062–T069 and T074; T071 after T070; T072 after T071; T073 last.
- Same-file tasks never run in parallel: src/commands/verify.ts (T015–T017, T021, T022, T025, T029, T037, T039–T041, T049, T051, T057, T067), src/commands/doctor.ts (T023, T051, T059), test/verify/rooted.test.ts (T011–T014, T018, T019, T024, T026, T027, T043, T044, T056), test/verify/quiet.test.ts (T031–T035, T045), test/doors/doors.test.ts (T036, T055), test/doctor/doctor.test.ts (T020, T053), .multivac/invariants.md (T002–T004, T015, T070), src/cli.ts (T010, T051), src/commands/count.ts (T051, T058), src/commands/doors.ts (T051, T060), src/commands/roadmap.ts (T051, T061).

## Parallel Example: User Story 1

```text
T011 test/verify/rooted.test.ts (then T012, T013, T014 in the same file)
then T015 → T016 → T017 (src/commands/verify.ts)
```

User Story 2: T018 (then T019) beside T020; then T021 → T022, T023.
User Story 4: T026 (then T027) beside T028; then T029 beside T030.
User Story 5: T031 (then T032–T035) beside T036; then T037 beside T038, T039 → T040 → T041, T042 alone.
User Story 6: T043 (then T044) beside T045, T046, T047; then T048, T049.
User Story 8: T052, T053, T054, T055 together, then T056; then T057 → T058, and T059, T060, T061 together.

## Implementation Strategy

MVP first: Phases 1–3. After T017 `verify` answers for the root of any directory it is asked
from and names that root — the destructive `init .` advice is gone from every brain and
consumer subdirectory. Then US2 and US3, the other two correctness stories (the false green on
a change's own branch, and every brain gate inside a mount); then US4, so no lookup advises
another directory. US5 and US6 bring the quiet line and the payload follow, in that order,
because a session start is quiet only through US5's line. US7 and US8 root the notice and the
other commands. The change lands as one: `change close` verifies MV-151's legs, which need every
story and the Polish phase.

## Notes

- **Where these tasks go beyond the design** (research.md): a sibling is read in the change's
  own worktree by key before the main checkout (critic gap 1; T019, T021); the shim comment names
  no ID and an `absent` leg pins it (gap 2; T036, T042, T070); every spawned test scrubs both
  switches and the suite runs twice (gap 3; T008, T009, T071); the realized saving is the
  per-commit replay (gap 4; T072); the scope table's "cwd is …" wording is retired with a leg
  (gap 5; T062, T065, T070); the root-line comparisons use `samePath` with a leg and a test (gap
  6; T056, T059–T061); the session's directory comes from the payload's `cwd` and the follow takes
  a brain only when it is its own toplevel (gap 7; T044, T048, T049).
- **Not done here** (spec Assumptions): rooting `change`, `repos`, `seed` and `init`; `repos sync`
  typed inside a mount; naming an unparsable change file or an anchor on no row in the full
  report; fetch age in a linked worktree; a quiet explicit `verify` by default; `/tmp/mvac-*`
  hygiene.

## Coverage

| Requirement | Tasks | | Criterion | Tasks |
| --- | --- | --- | --- | --- |
| FR-001 | T011, T016, T067 | | SC-001 | T011, T072 |
| FR-002 | T005, T027 | | SC-002 | T011, T072 |
| FR-003 | T011, T015 | | SC-003 | T013, T072 |
| FR-004 | T012, T013, T014, T015 | | SC-004 | T014, T072 |
| FR-005 | T012, T013, T016 | | SC-005 | T014, T072 |
| FR-006 | T011, T017, T056 | | SC-006 | T012, T072 |
| FR-007 | T018, T021 | | SC-007 | T012, T072 |
| FR-008 | T019, T021, T023 | | SC-008 | T018, T072 |
| FR-009 | T019, T022 | | SC-009 | T019, T072 |
| FR-010 | T020, T023 | | SC-010 | T018, T072 |
| FR-011 | T024 | | SC-011 | T020, T072 |
| FR-012 | T024, T025 | | SC-012 | T019, T020, T072 |
| FR-013 | T024, T025 | | SC-013 | T024, T072 |
| FR-014 | T026, T029 | | SC-014 | T024, T072 |
| FR-015 | T026, T029 | | SC-015 | T025, T071 |
| FR-016 | T026, T029 | | SC-016 | T026, T072 |
| FR-017 | T026, T029 | | SC-017 | T027, T072 |
| FR-018 | T005, T027, T029 | | SC-018 | T026, T072 |
| FR-019 | T028, T030 | | SC-019 | T027, T028, T072 |
| FR-020 | T031, T035, T041, T045, T067 | | SC-020 | T031, T045, T072 |
| FR-021 | T037, T038, T039, T041, T070 | | SC-021 | T031, T072 |
| FR-022 | T031, T033, T039 | | SC-022 | T035, T036, T072 |
| FR-023 | T032, T035, T037, T038, T041 | | SC-023 | T033, T072 |
| FR-024 | T032, T040, T041 | | SC-024 | T033, T072 |
| FR-025 | T031, T037, T041 | | SC-025 | T032, T034 |
| FR-026 | T007, T034, T041 | | SC-026 | T031 |
| FR-027 | T035, T036, T042, T064, T069 | | SC-027 | T072 |
| FR-028 | T047, T048 | | SC-028 | T043, T072 |
| FR-029 | T010, T043, T045, T049 | | SC-029 | T043, T072 |
| FR-030 | T043, T044, T049 | | SC-030 | T043, T044, T072 |
| FR-031 | T045, T046, T049, T069 | | SC-031 | T043, T072 |
| FR-032 | T006, T008, T009, T010, T071 | | SC-032 | T044, T072 |
| FR-033 | T006, T050, T051 | | SC-033 | T046, T069, T072 |
| FR-034 | T050, T051 | | SC-034 | T050, T072 |
| FR-035 | T050, T051 | | SC-035 | T050, T072 |
| FR-036 | T052, T058 | | SC-036 | T052, T072 |
| FR-037 | T053, T054, T055, T056, T057, T059, T060, T061 | | SC-037 | T052, T072 |
| FR-038 | T002, T003, T004, T015, T070 | | SC-038 | T053, T072 |
| FR-039 | T062, T063, T064, T065, T066, T067, T068 | | SC-039 | T054, T072 |
| FR-040 | T074 | | SC-040 | T056, T072 |
| | | | SC-041 | T009, T071 |
| | | | SC-042 | T002, T003, T062, T064, T065, T066, T070, T071, T074 |

## Phase 12: Hand-offs (added before apply)

- [X] T074 Retire the stale hooks/verify-output sentences in DESIGN.md, site/content/docs/concepts/distribution.md, site/content/docs/reference/integrations.md and every copy of the load-model hooks cell ("never read — they fire"), and add the `absent` leg on MV-151 in .multivac/invariants.md, per FR-040
