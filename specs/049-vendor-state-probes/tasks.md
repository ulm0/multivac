---

description: "Task list for vendor-state-probes"
---

# Tasks: Vendor state probes

**Input**: Design documents from `specs/049-vendor-state-probes/`

**Where the work happens**: in the checkout `change apply vendor-state-probes`
prints (branch `vendor-state-probes`). The decisions are in research.md R1–R8,
the notes in R9, the legs in R10 and the row in R11.

**Tests first**: every behaviour change begins with an assertion, built and seen
failing before its code.
- Every test written or touched here puts its stubs on a PATH it builds
  (`<bin>:/usr/bin:/bin`), never the host's.
- Stubs write what the real tools write (R8): the recorded `integration.json`, a
  `graph.json` that parses, and a `codegraph.db`.
- Exit-code assertions are not edited, except the inversions R8 lists. Only
  retired wording moves.
- New test text never spells a phrase leg 14 forbids.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking broken), then `node --test "dist-test/**/*.test.js"`, all green. `multivac count` R10 legs 4, 6 and 14 give 28, 1 and 46
- [X] T002 `node dist/cli.js change apply vendor-state-probes`, then check the branch and link `node_modules` (untracked) if missing. In a scratch clone, where apply would run vendor scaffolds, work on `main` instead

## Phase 2: Foundational — the law moves first (Principle III)

- [X] T003 Replace the RESERVED MV-124 row in .multivac/invariants.md with the rule (R11): `specified | proposed | 2026-09-14`, source `changes/vendor-state-probes.md`, ≤ ~400 words, no pipe, no literal `Amended 2026-09-14 by MV-124`
- [X] T004 Add the fifteen legs under MV-124 in .multivac/invariants.md, exactly as in R10
- [X] T005 MV-75 and MV-121 in .multivac/invariants.md: append the R9 notes. MV-75's WITHDRAWS "the scaffold artifact whose absence means not installed here". MV-121's WITHDRAWS "never claims multivac applies one" and "Applying the opt-outs … is not this row" for declared `env`. Both clauses stay visible
- [X] T006 MV-52 and MV-62 in .multivac/invariants.md: append the R9 notes
- [X] T007 MV-87 and MV-90 in .multivac/invariants.md: append the R9 notes, and move MV-87's leg :671 (R10)
- [X] T008 MV-103 in .multivac/invariants.md: append the R9 note, and move legs :811, :812, :814 and :815 (R10). MV-113 (found while implementing): append the R9 note and move its registry leg (R10)

## Phase 3: Foundational — one probe, and what each entry declares (US1, US6)

- [X] T009 [P] [US1] Test first in the new test/lib/init-state.test.ts; it fails to build. With `process.env.PATH = ''`, `initState` gives:
  - speckit: none → missing; `.specify/` alone → partial naming `.specify/integration.json`; integration.json at 0 bytes, truncated, schema 2, or `installed_integrations: []` → partial naming the file and the check; a directory or a broken link there → partial; the recorded file → installed, and one naming `copilot` → installed;
  - opsx: none → missing; `openspec/specs/` alone → partial; `config.yaml` → installed; `config.yml` → installed;
  - graphify: none → missing; `graphify-out/` alone, a 0-byte, truncated or conflict-marked `graph.json` → partial; `{}` → installed;
  - codegraph: none → missing; `.codegraph/.gitignore` alone → partial; `codegraph.db` → installed;
  - unreadable `integration.json` (mode 000, skipped under uid 0) → unevaluable, naming the file and `EACCES`;
  - a declared grapher whose artifact is a file or a directory → installed, and absent → missing, never partial.
- [X] T010 [P] [US1] [US5] [US6] Test first in test/doctor/adapters.test.ts; it fails:
  - each shipped entry's `state`, `shared`, `local`, `ignore`, `graphignore`, `artifactKind` and `env` equal R2, R3 and R7;
  - every `env` key and value matches `^[A-Za-z0-9_]+$`;
  - codegraph's `artifacts` is `['.codegraph/codegraph.db']`;
  - no `scaffold` carries `artifact`;
  - neither note says "nothing here sets", and both keep the variable names :258-275 match;
  - a declared grapher is `artifactKind: 'shared'`, `shared: [artifact]` and `env: {}`.

  :188-201 asks `initState` instead of `artifactPresent`
- [X] T011 [US1] Create src/lib/init-state.ts: `initState` and `InitState`, exactly as R1. Imports only `node:fs/promises` and types. T009 passes
- [X] T012 [US1] [US6] Edit src/adapters/registry.ts:
  - add `StateProbe` and the required `state`, `shared`, `local`, `ignore` and `env`, plus the optional `graphignore` and `artifactKind`, with the R3 rule in the comment (:236-299);
  - set R2, R3 and R7's values on the four entries and the declared base (:671-682);
  - change codegraph's `artifacts` (:625);
  - delete `SddScaffold.artifact` (:205-206, :455);
  - reword the `artifacts` comment (:238) and the notes at :443 and :643 (R7).

  src/doors/flow.ts:73 renders `spec.state.dir`. T010 passes

## Phase 4: US2 — each surface acts on the state (P1)

- [X] T013 [P] [US2] Add `SPECKIT_INTEGRATION_JSON` to test/helpers/recorded.ts: this brain's `.specify/integration.json` (0.16.4), verbatim
- [X] T014 [US2] Tests first in test/change/sdd-gates.test.ts. `stubSpecify`'s `write` (:104-106) also writes the recorded `integration.json`. Then:
  - :896-913: web's hand-made `.specify` is warned, naming web, `.specify/integration.json` and the init, and specify still never runs there;
  - new: a stub that writes `.specify/memory` only prints `left .specify partial (` for brain and no `scaffolded`;
  - :918-930 still runs specify 0 times and prints no `scaffolded`, while web's partial warning repeats.

  test/change/ledger.test.ts :69 and :89 write the recorded file. The new assertions fail
- [X] T015 [P] [US2] Tests first in test/doctor/doctor.test.ts; they fail:
  - :103 `opsx @ brain: missing`;
  - :140 `missing \(no \.specify\)` with the MV-75 clause;
  - :148-151: `mkdir .specify` → `partial \(\.specify/integration\.json`, then the recorded file → `installed` with no clause;
  - :240-253: brain `missing`, api `partial`, and never `speckit @ brain: installed`;
  - :303 and :310 `installed \(shared\) · binary ok ·`.
- [X] T016 [US2] Tests first in the new test/change/vendor-state.test.ts, with stubs on a built PATH recording runs; all fail:
  - a brain declaring speckit after `mkdir .specify`: `change new` runs specify 0 times and warns, and `doctor` says partial (SC-002 case 1);
  - a committed 0-byte `graphify-out/graph.json` with a stub graphify writing `{}`: close's build ran and the gate passes. With a stub writing nothing, close refuses naming `does not parse as JSON` (case 2);
  - unreadable `integration.json`: no init, and a warning naming `cannot read`;
  - opsx with `openspec/specs/` and no config: partial is warned with the install line, and nothing runs.

  test/change/binary-lookup.test.ts:58's stub writes `graph.json` with `>`, not `>>`
- [X] T017 [US2] src/adapters/sdd.ts: `runScaffold` (:239-282) and the project-document roots (:542-545) ask `initState`, as R4 says. Keep `installed here: silence, not a line` (MV-87 :661), and drop unused imports
- [X] T018 [US2] src/adapters/refresh.ts: `refreshGraph` (:92) skips unevaluable and sets `const first = st.state !== 'installed'`. `ensureGraphs` (:183) skips installed, and its comment (:170-174) says one probe per scope. `graphGate` (:258-273) prints the R4 lines
- [X] T019 [US2] src/commands/doctor.ts `sddLines` (:216-231) per R4. Delete `artifactPresent` from src/adapters/detect.ts (:18-27). T014–T016 pass

## Phase 5: US3 and US4 — codegraph stays local, and the gate reads HEAD (P1, P2)

- [X] T020 [US4] Tests first in test/change/grapher-tracked.test.ts; the new and moved assertions fail:
  - :86-95, :120-121 and :138 expect `is not committed — \`git -C .* add graph-out/graph\.json && git -C .* commit`;
  - :99's title becomes `close proceeds once the graph is committed`;
  - new: staged only → close refuses and `doctor` says `NOT COMMITTED →`, with `git diff --cached` and `rev-parse HEAD` identical before and after (SC-002 case 3);
  - new: committed, then modified → passes;
  - new: a repo with no commit → not committed;
  - :187-215 expect `NOT COMMITTED →`, with titles saying committed.
- [X] T021 [US3] Tests first in test/change/vendor-state.test.ts; all fail:
  - clone a repo whose only codegraph file is a committed `.codegraph/.gitignore`. Run close with a stub codegraph whose `init` writes `.codegraph/codegraph.db` and whose `sync` without it prints `✗ CodeGraph not initialized` and exits 1. `init` ran, never `sync`; the database exists untracked; both gates pass; `doctor` says `installed (local)` and never `NOT COMMITTED` (SC-002 case 4);
  - with an `init` that writes nothing, close refuses naming `.codegraph/codegraph.db` and `a local artifact is built in each checkout`;
  - `.gitignore` is byte-identical after close, and no `.graphifyignore` exists (US6 AS5).

  test/change/per-root.test.ts :317, :321 and :332 name `.codegraph/codegraph.db`, and :354 expects `is not committed`
- [X] T022 [US4] src/lib/git.ts: `inHead` replaces `isTracked` (:317-328), exactly as R5
- [X] T023 [US3] [US4] src/adapters/tracked.ts:
  - delete `heldArtifact` (:23-29);
  - skip `spec.artifactKind === 'local'` and roots `initState` does not find installed;
  - ask `inHead`, and print R5's lines;
  - the header (:1-13) and the gate's doc (:31-47) say committed, HEAD and shared.
- [X] T024 [US3] [US4] src/commands/doctor.ts `grapherLines` (:296-324) per R4: state, kind, and `NOT COMMITTED →` from `inHead`. The `heldArtifact` import (:19) goes. T020–T021 pass

## Phase 6: US5 — the opt-outs are applied (P2)

- [X] T025 [P] [US5] Test first in test/doors/settings.test.ts; it fails:
  - `refreshHookCmd('x update .')` equals today's string, pinned as a literal, and equals the call with `{}`;
  - with `{ DO_NOT_TRACK: '1', CODEGRAPH_TELEMETRY: '0' }` it starts with `L=.multivac/cache/graph-refresh.lock;` and holds `export DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0; ` before `find`, with the declared refresh unchanged;
  - a second merge rewrites the one hook;
  - run by `sh -c` with `PATH=/usr/bin:/bin`, a marker stub records `1 0` within 2 s.
- [X] T026 [US5] Tests first in test/change/vendor-state.test.ts, with the parent at `DO_NOT_TRACK=0`, the other three unset, and `process.env` restored after; all fail (SC-003):
  - opsx's validator at `change apply` records `1 0`;
  - codegraph's build and refresh at close each record `1 0 1`;
  - the hook `doors` writes for codegraph, run by `sh -c`, records `1 0 1`;
  - a graphify stub records the inherited `0`.
- [X] T027 [US5] src/adapters/sdd.ts:164 and src/adapters/refresh.ts:122 spread `...spec.env` as R7 says. MV-123's `localBin(dir)]` stays
- [X] T028 [US5] src/doors/settings.ts: `refreshHookCmd(refresh, env = {})` builds `exported` as R7 says, and its doc (:62-83) says why. Merge opts gain `env` (:239, :276). src/commands/doors.ts `installHookConfig` passes `spec.env` (:155-167, :195, :244). T025–T026 pass

## Phase 7: US7 — the law says so (P3)

- [X] T029 [US7] `multivac count` the R10 legs, expecting 1, 0, each, 0, 1, 0, 1, 1, 1, 1, 2, each, 1, 0 and 8. The six moved legs and R10's unmoved list are green. `verify --strict` shows MV-124 `proposed` with no blocking failure. Re-read MV-124 against the landed code (≤ ~400 words)
- [X] T030 [US7] Bite run (R12) in a scratch clone of the branch, never this repository: each of the six reintroductions gives exit 1

## Phase 8: Polish, copies and verification

- [X] T031 [P] Docs and copies, each citing MV-124 where it states the rule:
  - site/content/docs/reference/graphers-and-sdd.md:
    - :30-41: read means the probe finds it installed, and codegraph's row names `.codegraph/codegraph.db`, local;
    - :103-112 and :188: samples;
    - :196-206: the hook exports the entry's opt-outs, and the first build skips installed repos;
    - :313-340: the tracked half is shared artifacts only, read from HEAD, `is not committed` and `NOT COMMITTED →`, with codegraph exempt;
    - :354-355: samples;
    - :383-433: the state file replaces "scaffold artifact", the outcomes table gains partial and unevaluable, and samples;
  - site/content/docs/reference/commands.md :686-687 and :1254-1267;
  - site/content/docs/reference/configuration.md :141 and :483-484;
  - DESIGN.md :1287-1288;
  - skills/multivac/references/change.md :142-146 (installed, committed), with the identical .claude/skills copy.
- [X] T032 MV-111 sweep: `git grep -nE 'artifactPresent|heldArtifact|isTracked|is untracked|UNTRACKED|artifact ok|artifact missing|nothing here sets|\.codegraph[^/]|scaffold artifact|lacks the artifact|no artifact|tracked' -- ':!specs' ':!.multivac/changes' ':!CHANGELOG.md' ':!docs' ':!internal' ':!graphify-out'`, skills included. Classify every hit. Only anchor vacuity's and doctor's build-critical "untracked", `detectAdapters`' proposal, historical quotes and the law notes may stay. `git grep -nE '\.(shared|local|ignore|graphignore)\b' -- src` finds nothing outside registry.ts (FR-011)
- [X] T033 Run `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking broken, MV-124 `proposed`), then `node --test "dist-test/**/*.test.js"`. All must be green (SC-006). Commit by pathspec every file plan.md lists, plus specs/049-vendor-state-probes/, and never graphify-out/
- [X] T034 /speckit.converge until Converged; fix any drift on the branch (/speckit.analyze runs before implementing, as `change apply` prints)

## Phase 9: Review fixes

- [X] T035 runScaffold's warning after an init that exits 0 and leaves the root partial no longer says "it exited 0 and wrote nothing there": that tail is kept for a root still missing, and a partial one says "it exited 0". The memory-only test in sdd-gates.test.ts matches the whole line and asserts no `partial … wrote nothing`
- [X] T036 The tracked gate's command commits by pathspec, `git -C <dir> add <art> && git -C <dir> commit -m "chore: commit the graph" -- <art>`, so work already staged in that repo stays out of the chore commit (MV-50). grapher-tracked.test.ts pins the pathspec; the samples in commands.md and graphers-and-sdd.md and R5 say so
- [X] T037 Legs 16–21 under MV-124 in .multivac/invariants.md, each dry-run at 1: the probe's `Object.entries(expect)`, the scaffold's `before.state !== 'missing'` guard, `ensureGraphs`' installed skip, the unevaluable skip's warning, the tracked gate's not-installed skip and doors' `spec?.env ?? {}`. Leg 2 also names `http2`, `tls`, `dgram` and unprefixed module names. The row's mechanical sentence names them, the two opt-out entries' count and the probe's `absent` leg, and is 424 words after trimming the tracked-gate and hook sentences. R10, R11, R12 and plan.md say twenty-one legs
- [X] T038 A local artifact's door says "it is built in each checkout, so never commit it", and close's build or refresh line says `local artifact, never committed`; a shared artifact's wording is unchanged, so this brain's projections are byte-identical. per-root.test.ts pins the local door; R6 and graphers-and-sdd.md say so
- [X] T039 `stateLabel(spec)` in src/lib/init-state.ts is the one label for what the probe looks for, called by runScaffold, doctor's sdd line and flow.ts, which printed `undefined` for a scaffold entry with no `state.dir`
- [X] T040 doctor's sdd line: unevaluable says `make it readable; no init is run over it` and names no init; partial adds `since a re-run can revert edited files` before the command, as runScaffold does. The docs sample follows
- [X] T041 Tests for behaviour that shipped untested, in vendor-state.test.ts: an unreadable `graph.json` runs no build or refresh, close refuses `cannot be checked — cannot read graphify-out/graph.json: EACCES`, and doctor's grapher line says `unevaluable (`; doctor names a 0-byte `graph.json` partial with the build; doctor's sdd lines for partial and unevaluable. grapher-tracked.test.ts asserts exit 0 where close proceeds
- [X] T042 Copies and records: change.ts:119 says one probe per scope (MV-111); graphers-and-sdd.md:750 says installed; MV-75's note quotes the withdrawn clause verbatim; the `artifacts` doc comment says an SDD entry's list is read by no command; plan.md's Summary, Scale, Constitution Check and Project Structure list 8 notes (MV-113 included), 6 moved legs (:891 included), 21 legs, 12 source and 10 test files (change.ts, brain.ts and grapher-gate.test.ts added)
- [X] T043 Re-run the build, the suite (658 pass, 0 skipped) and `verify --strict` (124 ok, 0 blocking). On a scratch copy with MV-124 active and the change file aside, the six R12 reintroductions, legs 16–21's clauses and two widened leg-2 imports each give exit 1, and a comment-only control gives 0. On compiled code, the old partial tail, an unskipped unevaluable grapher, an init named for an unevaluable root, a commit without pathspec and the shared door for a local artifact each fail a test

## After the tasks — the lifecycle, not the ledger

1. Merge `--no-ff`, then `change land vendor-state-probes --landed brain`.
2. `change close vendor-state-probes`: walk the ritual, and commit the archive
   with the pathspec it prints.
3. Enactment of MV-124 (alone in its own commit, MV-81) and any push belong to
   the human.

## Dependencies and parallel work

- T002 precedes every edit, and T003–T008 precede every source edit.
- T009–T010 precede T011–T012, which precede all later code.
- Tests precede their code: T013–T016 before T017–T019, T020–T021 before
  T022–T024, and T025–T026 before T027–T028.
- T017 and T027 share sdd.ts. T018 and T027 share refresh.ts. T019 and T024
  share doctor.ts. T016, T021 and T026 share vendor-state.test.ts.
- In parallel: T009 with T010; T013 and T015; T025 with T020; T031 with T032.
- T029–T034 come last, and T035–T043 follow review.

## Implementation strategy

US1–US3 are P1: a hand-made directory reads installed, a broken graph passes,
and codegraph never works in a clone. The probe (Phase 3) is the foundation
every later phase asks. US4 and US5 follow from the same declarations, and
US6's data lands with Phase 3. US7's legs describe every edit, so the change
lands only as a whole.

> T034 closed in the real lifecycle (2026-09-14): `change apply` created the worktree on branch `vendor-state-probes`. The reviewed prep commit cherry-picked with one conflict, the MV-121 row, where this change's amended statement met the archive link `vendor-facts-true`'s close had written. It was resolved by keeping this change's statement and the archive link, and nothing else. `verify --strict` gave 0 blocking and the suite 658/658. The stage-4 verifier and stage-5b fidelity review left no gap: converged.
