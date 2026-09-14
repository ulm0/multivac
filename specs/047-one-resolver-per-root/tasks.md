---

description: "Task list for one-resolver-per-root"
---

# Tasks: One resolver per root

**Input**: Design documents from `specs/047-one-resolver-per-root/`

**Where the work happens**: in the checkout `change apply one-resolver-per-root`
prints (the change worktree, on branch `one-resolver-per-root`). The decisions
are in research.md R1–R6, the notes in R7 and the legs in R8.

**Tests first**: every behaviour change begins with an assertion, which is built
and seen failing before the code it pins.
- New scratch ecosystems put their stubs on a PATH the test builds
  (`<bin>:/usr/bin:/bin`), never the host's.
- No global-only assertion is edited (SC-004).
- New test text never spells a phrase MV-122's `absent` legs forbid.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build`, `node dist/cli.js verify --strict` (0 blocking broken) and `node --test "dist-test/**/*.test.js"`, all green. Then `multivac count` R8 legs 2–4 and confirm 43, 17 and 5
- [X] T002 `node dist/cli.js change apply one-resolver-per-root`; check the branch is `one-resolver-per-root`, and link `node_modules` there (untracked) if the worktree lacks it. Done instead in a scratch clone on `main`, where `change apply` would run vendor scaffolds

## Phase 2: Foundational — the law moves first (Principle III)

- [X] T003 Replace the RESERVED MV-122 row in .multivac/invariants.md with the stated rule (research R9): `specified | proposed | 2026-09-14`, source `changes/one-resolver-per-root.md`. Keep it ≤ ~400 words, with no pipe and no literal `Amended 2026-09-14 by MV-122`
- [X] T004 Add MV-122's seven legs under its row in .multivac/invariants.md, exactly as research R8
- [X] T005 MV-56 and MV-59 in .multivac/invariants.md: append the R7 notes
- [X] T006 MV-87 in .multivac/invariants.md: append the R7 note, and move legs :658 and :659 as R8 says
- [X] T007 MV-90 in .multivac/invariants.md: append the R7 note, and move leg :706 as R8 says
- [X] T008 MV-114 in .multivac/invariants.md: append the R7 note that WITHDRAWS "`--grapher` is checked against the registry only"; the clause stays visible

## Phase 3: Foundational — the resolver

- [X] T009 Test first in test/doctor/adapters.test.ts, replacing the `sddFor` assertions at :238-242. It fails to build. For both kinds, `adapterFor`:
  - takes the repo's value first, the ecosystem's otherwise;
  - reads the `isBrain` entry for `'brain'`;
  - gives `undefined` for `none` at repo or top level;
  - gives the repo's own adapter under a top-level `none`.
  `adaptersByRoot` puts the brain first, includes absent repos, and leaves `none` roots ungrouped. `NO_SDD` becomes `NO_ADAPTER`. The `policy`/`detect` tests (:52-83), their imports and the header comment are deleted
- [X] T010 [P] Test first in test/lib/config.test.ts: a `graphers.none` entry is refused by name at load. It fails
- [X] T011 src/adapters/detect.ts: add `NO_ADAPTER`, `adapterFor` and `adaptersByRoot` (R1). `sddRoots` resolves through `adapterFor`, and its doc loses the `cfg.sdd` sentence (:82-85). Delete `sddFor`, `NO_SDD`, `AdapterStatus`, `Policy`, `policy()` and `detect()` (R6). T009 passes
- [X] T012 src/lib/config.ts: split an exported `readConfig` (parse only) out of `loadConfig`, which keeps its layout check. Refuse `graphers.none` with `=== NO_ADAPTER`, and rewrite the comment at :242. T010 passes

## Phase 4: US1 — the SDD gate and its steps follow each root (P1)

- [X] T013 [US1] Test first in the new test/change/per-root.test.ts. All fail:
  - no top-level `sdd:` and `repos.web.sdd: speckit`: `change plan` exits 1, naming speckit's artifact and `looked in web`;
  - `change new` prints speckit's steps;
  - `sdd: opsx` with web on speckit: web is asked only for the spec, and the brain only for the proposal;
  - flow.md lists both adapters, each row naming its roots;
  - a global-only config's steps and flow.md carry no `@` and no ` — in `.
- [X] T014 [US1] src/adapters/sdd.ts `sddGate` (:298-558): group the present roots by `root.sdd` and run the body per group (R3). Drop :506, print the unknown line once per name and the `--no-sdd` hint once. MV-56's strings stay verbatim
- [X] T015 [US1] src/adapters/sdd.ts `sddInstructions` (:565-596) iterates `adaptersByRoot(cfg, 'sdd')`, adding ` @ <roots>` only when several adapters resolve. The `sddGate` doc says "no root resolves an sdd"
- [X] T016 [US1] src/doors/flow.ts (:53-101): per-adapter rows from `adaptersByRoot`, naming roots only where they differ (R4). T013 passes, and test/doors/flow.test.ts and test/change/urging.test.ts pass unedited

## Phase 5: US2 and US3 — `none` is a token; the brain reads its own entry (P1, P2)

- [X] T017 [US2] Tests first. All fail:
  - per-root.test.ts, `repos.web.grapher: none`: `doctor` prints `none @ web` out of scope and no `not verified`; `doors` prints no notice; `change close` prints no `not verified` and builds nothing in web;
  - per-root.test.ts, `repos.web.sdd: none` with the spec only in web: plan refuses, and `looked in` excludes web;
  - per-root.test.ts, top-level `sdd: none` and `grapher: none`: no door block names `none`, and flow.md has both no-adapter rows;
  - per-root.test.ts, a top-level `none` under a repo adapter: the repo's adapter applies;
  - test/doors/ecosystem.test.ts:118-130: the opted-out door has no `Features gate` line;
  - test/change/grapher-gate.test.ts:152-177: close prints no `not verified`.
- [X] T018 [US3] Tests first in per-root.test.ts, with stubs on the constructed PATH. All fail:
  - `grapher: graphify` with `repos.brain.grapher: codegraph`: the brain door, flow.md, `doctor` and the gate name codegraph;
  - no top-level grapher and `repos.brain.grapher: graphify`: close builds in the brain and the gate judges it;
  - `repos.brain.sdd: none` under `sdd: speckit` with a speckit sibling: the brain door has no SDD block, while the steps and flow.md name speckit for the sibling.
- [X] T019 [P] [US2] Test first in test/change/ritual.test.ts: `ritualSeed({ sdd: 'none' })` offers no spec line, and `ritualSeed({ repos: { web: { path: '../web', sdd: 'speckit' } } })` does. Then src/lib/ritual.ts (:39) uses `adaptersByRoot`, and init's call is unchanged
- [X] T020 [US2] [US3] src/adapters/refresh.ts `graphScopes` (:150-158) resolves every root through `adapterFor`, the brain included, and the doc at :144-149 says so. `graphGate` (:231) and src/adapters/tracked.ts (:54) stay silent when `adaptersByRoot(cfg, 'grapher').size === 0`
- [X] T021 [US2] [US3] Resolve per root in every door:
  - src/doors/brain.ts: `grapherLines`/`sddLines` take the resolved name with no fallback, the comments at :61-64 and :99-102 are rewritten, and `renderBrainDoor` passes `adapterFor(config, 'brain', …)`;
  - src/doors/consumer.ts (:51-55) passes `adapterFor(config, repoKey, …)`;
  - src/commands/doors.ts :293 and :326 hand `projectInto` the resolved grapher, and the comment at :324-325 is rewritten.
- [X] T022 [US2] src/commands/doctor.ts `grapherLines` (:276-290): silent when no present root resolves a grapher, otherwise one `none @ <scope>` line per unresolved root, through the helper the SDD line (:196-201) uses. `out of scope, not a gap` appears once. T017 and T018 pass

## Phase 6: US4 — `init --grapher` refuses a name it cannot honour (P2)

- [X] T023 [US4] Tests first in test/init/init.test.ts. The unreadable-config test (:420) is not edited. All new tests fail:
  - `--grapher graphfy` into a directory that does not exist: exit 2, the path absent, and `graphify, codegraph` named;
  - with `graphers.mytool` declared in the existing config, `--grapher mytool` exits 0;
  - without it, `--grapher graphfy` exits 2, names `mytool` too, and leaves the tree byte-identical;
  - `--grapher none` and `--sdd none` exit 2;
  - a legacy-layout brain declaring `graphers.mytool`: `mytool` is accepted, and `graphfy` exits 2 with nothing moved.
- [X] T024 [US4] src/commands/init.ts: the vocabulary check after `parseFlags` and before `mkdir` (:302), through `readConfig` (R5). The message is `init: unknown --grapher ${…} — known: …`, joining `[...grapherNames, ...declared]`. The comment at :88-94 says where and against what the flag is checked. T023 passes, and the legs of MV-69 and MV-114 stay green

## Phase 7: US5 — one reader, and the law says so (P3)

- [X] T025 [US5] `multivac count` the legs in R8: 1, 0, 0, 0, 1, 1 and 5 (6 after T032). The moved MV-87 and MV-90 legs are green. Re-read MV-122 against the landed code; it is ≤ ~400 words
- [X] T026 [US5] Bite run (R10) in a scratch clone of the branch, never this repository: each of the four reintroductions gives exit 1

## Phase 8: Polish, copies and verification

- [X] T027 [P] Docs, each citing MV-122 where they state the rule:
  - site/content/docs/reference/commands.md:88: the `--grapher` flag row names the verified graphers or a name under `graphers:` in the config already there, refused before anything is created. The doctor rows at :691-692 state "no root resolves one" and the `none` grapher line, and the init section gains the refusal line;
  - site/content/docs/reference/configuration.md: `none` for top-level `sdd`/`grapher`, `graphers.none` refused, `grapher: none` in the repos example, and the brain's own entry;
  - site/content/docs/reference/graphers-and-sdd.md:232: the resolution, and "The gate" judging each adapter in its own roots;
  - DESIGN.md:1211: the opt-out names both kinds and the brain's entry.
- [X] T028 MV-111 sweep: `git grep -nE 'sddFor|NO_SDD|cfg\.sdd|cfg\.grapher|config\.sdd|config\.grapher|back to the global|the ecosystem.s otherwise|declared anywhere|any tool name|policy\(' -- ':!specs' ':!.multivac/changes' ':!CHANGELOG.md' ':!docs'`, skills/** included. Classify every hit; none may describe resolution other than through `adapterFor`
- [X] T029 `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking broken, MV-122 `proposed`), then `node --test "dist-test/**/*.test.js"`, all green (SC-005). Commit by pathspec every file plan.md lists — .multivac/invariants.md, the change file, DESIGN.md, the 13 under src/, the 7 under test/ with the new test/change/per-root.test.ts, the 3 site pages — and specs/047-one-resolver-per-root/, never graphify-out/
- [X] T030 /speckit.converge until Converged; fix any drift on the branch (/speckit.analyze runs before implementing, as `change apply` prints)

## Phase 9: Review fixes

- [X] T031 [US1] `sddGate` grouped the PRESENT roots, so an adapter only uncloned repos resolve was never judged: `sdd: none` with `repos.web.sdd: speckit` and web absent passed `change plan` with no line, under a flow.md saying it refuses. Groups now come from `adaptersByRoot` and are searched in their present roots; a group with none refuses, naming them, with `repos sync` (MV-90: a gate that cannot be evaluated refuses). Test first in per-root.test.ts; MV-56's note, FR-004, the edge cases and graphers-and-sdd.md say so
- [X] T032 MV-50 still said "per-scope grapher falling back to the global one", which leg 4's glob never reaches and T028's sweep missed. It gets a note withdrawing that clause and the stale "the change touched"; the change file touches MV-50, leg 7 reads count=6, and FR-014, SC-006, R7 and plan.md say six. graphers-and-sdd.md's copy of "the change touched" becomes "each declared, present repo (MV-90)"
- [X] T033 MV-122 claimed its read leg saw "direct reads of both keys". It sees dotted reads through five names; the mechanical clause and the ceiling now say a bracket read, a destructuring or another identifier passes it. The row stays at ~400 words. Leg 4 takes `.claude/skills/**` minus `speckit-*`, as MV-121's legs do
- [X] T034 Copies: configuration.md's `grapher` "Without it" names repo declarations like its `sdd` twin, both re-wrapped; commands.md's doctor `grapher` row says any root resolving none while another resolves one is out of scope; init's refusal de-duplicates a verified name redeclared under `graphers:`; plan.md lists src/types.ts and DESIGN.md:1242
- [X] T035 Tests off host policy: the brain-own-grapher test stops asserting codegraph's tracked-graph refusal (codegraph's tracking is a later change's) and asserts no graphify-out line for the brain; grapher-gate's `none` test asks close's exit code instead of a `refreshed` line that needs `true` on the host PATH
- [X] T036 Re-run the bite (T026) on the changed legs with MV-122 active: leg 4 on a restored phrase in `.claude/skills/multivac/SKILL.md`, leg 7 with MV-50's note removed; each gives exit 1

## After the tasks — the lifecycle, not the ledger

1. Merge `--no-ff`, then `change land one-resolver-per-root --landed brain`.
2. `change close one-resolver-per-root`: walk the ritual, and commit the archive
   with the pathspec it prints.
3. Enactment of MV-122 (alone in its own commit, MV-81) and any push belong to
   the human.

## Dependencies and parallel work

- T002 precedes every edit, and T003–T008 precede every source edit.
- T009 and T010 precede T011–T012, and T011 precedes all later code.
- Tests precede their code: T013 before T014–T016, T017–T018 before T020–T022,
  and T023 before T024.
- T014 and T015 share sdd.ts, and T012's `readConfig` precedes T024.
- In parallel: T010 with T009, T019 with T020–T022, T027 with T028.
- T025–T030 come last.

## Implementation strategy

US1 and US2 are P1: they are the gate that silently switches off and the
opt-out that still proves a step. US3 follows from the same resolver. US4
shares only `readConfig`. US5's legs describe every edit, so the change lands
only as a whole.

> T030 closed in the real lifecycle (2026-09-14): `change apply` created the worktree on branch `one-resolver-per-root`; the reviewed prep commit cherry-picked cleanly with `verify --strict` 0 blocking and the full suite green; the stage-4 verifier and stage-5b spec/plan/tasks fidelity review left no gap — converged.
