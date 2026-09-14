---

description: "Task list for managed-repos"
---

# Tasks: Managed repos

**Input**: Design documents from `specs/050-managed-repos/`

**Where the work happens**: in the checkout `change apply managed-repos` prints
(branch `managed-repos`). In a scratch clone, where apply would run vendor
scaffolds, work on `main`. The decisions are in research.md R1–R5, the notes in
R6, the legs in R7 and the row in R8.

**Tests first**: every behaviour change begins with an assertion, built and seen
failing before its code.
- Stubs go on a PATH the test builds (`<bin>:/usr/bin:/bin`), never the host's.
  Each stub appends `$PWD` to a marker.
- A shallow fixture is `git clone --depth 1 file://<bare>` of a repo with two
  commits. A full fixture uses `initRepo`.
- No existing assertion is edited, and only the three MV-111 comments move.
- New test text never spells a phrase leg 10 forbids.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking), then `node --test "dist-test/**/*.test.js"`, all green. `multivac count` R7 leg 10 gives 19, and legs 5 and 6 give 0
- [X] T002 `node dist/cli.js change apply managed-repos`, or `main` in a scratch clone (see above). Link `node_modules` if missing

## Phase 2: Foundational — the law moves first (Principle III)

- [X] T003 Replace the RESERVED MV-125 row in .multivac/invariants.md with R8's rule: `specified | proposed | 2026-09-14`, source `changes/managed-repos.md`, ≤ ~400 words, no pipe, no literal `Amended 2026-09-14 by MV-125`
- [X] T004 Add R7's fourteen legs under MV-125 in .multivac/invariants.md
- [X] T005 Append R6's notes to MV-50, MV-56 and MV-87 in .multivac/invariants.md, each at the clause it changes
- [X] T006 Append R6's notes to MV-90, MV-103 and MV-122 in .multivac/invariants.md. `verify --strict` shows MV-125 pending, with no blocking failure

## Phase 3: Foundational — the key and the answer (US1, US2, US6)

- [X] T007 [P] [US1] [US6] Tests first in test/lib/config.test.ts; they fail:
  - `managed: false` loads, and the entry's `managed` is false;
  - `managed: true` and an absent key load, and neither entry carries `managed`;
  - `managed: "false"`, `managed: 0` and `managed: null` are refused naming `"repos.api.managed" must be true or false`;
  - `brain: { path: ., managed: false }` and `self: { path: ., managed: false }` are refused naming `the brain is always managed`.
- [X] T008 [P] [US2] Test first in test/lib/git-env.test.ts; it fails to build:
  - `isShallow` answers true for a `file://` depth-1 clone, false for a full clone, and false for a directory that is not a repository;
  - with `GIT_DIR` pointing at the shallow clone, it still answers false for the full one.
- [X] T009 [US1] [US2] Tests first in the new test/change/managed-repos.test.ts; they fail to build. `readOnly(cfg, key, dir)` gives:
  - `not managed` for a present and for a missing `managed: false` sibling, even with `PATH` empty;
  - `shallow` for the shallow clone;
  - `not managed` for a shallow clone that also says `managed: false`;
  - null for a full clone, for `brain`, for an `isBrain` alias whose checkout is shallow, and after `git fetch --unshallow`.
- [X] T010 [US1] src/types.ts `RepoEntry.managed?`, and src/lib/config.ts per R3 (:222, :227, :238-250, :395-409). T007 passes
- [X] T011 [US2] src/lib/git.ts: `isShallow` per R1, beside `inHead`. Then src/adapters/detect.ts:
  - add `ReadOnly` and `readOnly` after `adapterFor`;
  - add `readOnly?` to `SddRoot`, set it in `sddRoots`;
  - the header and :86 say what R1 says.

  T008 and T009 pass

## Phase 4: US1 and US2 — nothing is written there (P1)

- [X] T012 [US1] [US2] Tests first in test/change/managed-repos.test.ts, for a missing-SDD, missing-graph sibling declared `managed: false` and for a shallow clone; all fail:
  - `change new` runs specify and graphify 0 times there, prints no line naming it, and leaves `git status --porcelain` empty there (SC-001);
  - `change close` runs no refresh there;
  - `doors` writes no `AGENTS.md`, `CLAUDE.md`, `.claude/`, skill or hook shim there, leaves `core.hooksPath` unset, and prints exactly one line matching `^api: (not managed|shallow), read-only — nothing projected` (SC-002);
  - the same ecosystem with no `managed` key and a full clone runs both stubs there, as today (FR-010).
- [X] T013 [US1] [US2] src/adapters/refresh.ts:
  - `GraphScope.readOnly?`, set in `graphScopes`;
  - `ensureGraphs` skips it;
  - the header keeps `never spawns git` and names the scope read (R1);
  - the comments at :156 and :173.
- [X] T014 [US1] [US2] src/adapters/sdd.ts `runScaffold` skips `root.readOnly` silently (:240). src/commands/change.ts close refresh: `if (s.name && !s.readOnly)` (:1103-1105), with the comment at :1095
- [X] T015 [US1] [US2] src/commands/doors.ts: ask `readOnly` after the brain check (:318-336), print the R4 line and `continue`. Reword the header (:1-3) and usage (:359-362). T012 passes

## Phase 5: US3 — reported, never failed (P2)

- [X] T016 [US3] Tests first in test/change/managed-repos.test.ts, with three fixtures: not managed and present, not managed and missing, and shallow. All fail:
  - `repos` marks all three `, read-only` (SC-005);
  - `doctor`'s repos line names each. Its sdd and grapher lines say `@ api: not managed, read-only` and `out of scope, not a gap`, never `missing`, `run`, `change new runs`, `NOT COMMITTED` or `IGNORED`, even with an uncommitted graph there. Its pins line says `no mount expected` and never `submodule`;
  - bare and `--strict` `doctor` print every other line, and exit, as the same ecosystem without those siblings does;
  - `repos sync` still fetches the present one, with exit 0.
- [X] T017 [P] [US2] Tests first in test/repos/sync.test.ts :86-104; they fail:
  - the clone line matches `\(shallow\) — read-only: multivac will not write there`;
  - `reposCommand.usage` holds `multivac will not write there`;
  - a non-shallow clone line is unchanged.
- [X] T018 [US3] src/commands/doctor.ts per R4: `outOfScope(kind, scope, name?, why?)` (:63-64); `sddLines` (:204-208) and its project-document roots (:257-262); `grapherLines` (:289-295); `reposLine` (:349-370); `pinsLine` expects no mount in a read-only repo
- [X] T019 [US2] [US3] src/commands/repos.ts per R4: `reposList` (:35-39), the clone line (:84) and the usage (:112). T016 and T017 pass

## Phase 6: US4 and US5 — no gate or change demands a file there (P2)

- [X] T020 [US4] Tests first in test/change/managed-repos.test.ts; all fail:
  - with a read-only sibling that has no graph, no SDD state and no spec, `change plan`, `apply` and `close` name it in no refusal, and the brain's gate lines are unchanged (SC-003);
  - with an installed graph HEAD does not hold there, `change close` passes and `graphTrackedGate` returns ok with no line, while the same managed full clone refuses naming it;
  - the SDD refusal's `looked in` omits it;
  - when only read-only siblings resolve `sdd: speckit`, the gate passes with the one `not gated — every root that resolves speckit is read-only` line;
  - a managed, uncloned sibling still refuses, naming only that sibling.
- [X] T021 [US5] Tests first in test/change/managed-repos.test.ts; all fail:
  - a change naming a `managed: false` sibling, on disk and not, refuses `plan` and `apply` with exit 1, naming both fixes and MV-97;
  - a change naming the shallow clone refuses, naming `git -C .* fetch --unshallow`;
  - after each refusal the change file, the law, `git rev-parse HEAD`, every branch list and every worktree list are identical, and nothing was cloned.
- [X] T022 [US4] src/adapters/refresh.ts `graphGate` (:261-266) and src/adapters/tracked.ts (:57-59) skip `s.readOnly`, and tracked.ts:24 says so. src/adapters/sdd.ts `sddGate` and `judgeSdd` per R4 (:325-333, :378-386)
- [X] T023 [US5] src/commands/change.ts `refuseReadOnly` per R5, called in `cmdPlan` (:658) and `cmdApply` (:736). T020 and T021 pass

## Phase 7: Polish, copies and verification

- [X] T024 [P] Docs, each citing MV-125 where it states the rule:
  - site/content/docs/reference/configuration.md: a new `### \`repos.<key>.managed\`` after `role` giving the default, what read-only means, the shallow twin and the brain refusal. Add `managed: false` to the :429-452 example, and reword :452;
  - site/content/docs/reference/commands.md: doors (:644-652) with the read-only sample line, repos (:763-806) with the marks and the clone line, :1232 and :1277;
  - site/content/docs/reference/graphers-and-sdd.md :226, :289, :334, :341, :441, :495 and :558, site/content/docs/reference/hooks.md:54, integrations.md:9-10 and site/content/docs/guide/session-zero.md:128-130, and commands.md's doctor rows (:704-708, pins included);
  - DESIGN.md :876-877 (plan/apply refuse a read-only repo, `--shallow` is read-only), :1043, :1208, :1222 and :1256;
  - skills/multivac/references/change.md :140 and :154, with the identical .claude/skills copy.
- [X] T025 MV-111 sweep: `git grep -n -i -E 'declared, present|present on disk|declared\+present|never land in|known: repos\.' -- ':!specs' ':!.multivac/changes' ':!.multivac/invariants.md' ':!CHANGELOG.md' ':!internal' ':!graphify-out'`. Classify every hit: a copy saying a write or gate reaches a read-only repo changes, and flow.ts, flow.md and flow.test.ts stay (FR-010). Reword the comments at test/change/grapher-gate.test.ts:1, grapher-refresh.test.ts:241 and sdd-gates.test.ts:881. R7 leg 10 gives 0. The legs and git grep read one line at a time, so repeat the sweep with a multi-line match (`perl -0777`, `\s+` between words) for copies wrapped across lines, and for "every declared repo" and "every present repo" sentences about a write
- [X] T026 `multivac count` every R7 leg in .multivac/invariants.md, expecting its mode. Re-read MV-125 against the landed code, keeping it ≤ ~400 words. `verify --strict` shows MV-125 `proposed` with 0 blocking
- [X] T027 Bite run in a scratch clone of the branch, never this repository, with MV-125 active and the change file aside. Each of these gives exit 1, and a comment-only control gives 0:
  - doors.ts no longer asking `readOnly` (legs 7 and 8);
  - a second `'--is-shallow-repository'` in detect.ts (leg 5);
  - `entry.managed` read in doors.ts (leg 6);
  - `readOnly` dropped from tracked.ts (leg 7);
  - one `refuseReadOnly` call removed (leg 9);
  - one `if (s.readOnly) continue;` removed from refresh.ts, which still spells `readOnly` elsewhere (leg 14 only).
- [X] T028 SC-006: in a scratch ecosystem under the tmp root, with stubs on a built PATH, run `doctor`, `repos`, `doors` and `change new` from a `22c9fa8` build and from this one. With no `managed` key and no shallow clone, stdout, exit codes and `git status --porcelain` in every repo match byte for byte
- [X] T029 Run `pnpm run build`, `node dist/cli.js verify --strict` (0 blocking, MV-125 `proposed`) and `node --test "dist-test/**/*.test.js"`, all green. Commit by pathspec every file plan.md lists plus specs/050-managed-repos/, never graphify-out/
- [X] T030 /speckit.converge until Converged, and fix any drift on the branch (/speckit.analyze runs before implementing, as `change apply` prints)

## After the tasks — the lifecycle, not the ledger

1. Merge `--no-ff`, then `change land managed-repos --landed brain`.
2. `change close managed-repos`: walk the ritual, and commit the archive with
   the pathspec it prints.
3. Enacting MV-125 (alone in its own commit, MV-81) and any push belong to the
   human.

## Dependencies and parallel work

- T002 precedes every edit, and T003–T006 precede every source edit.
- Tests precede their code:
  - T007–T009 before T010–T011;
  - T012 before T013–T015;
  - T016–T017 before T018–T019;
  - T020–T021 before T022–T023.
- Shared files:
  - T013 and T022 share refresh.ts;
  - T014, T022 and T023 share sdd.ts or change.ts;
  - T009, T012, T016, T020 and T021 share managed-repos.test.ts.
- In parallel: T007 with T008; T017 with T016; T024 with T025.
- T026–T030 come last.

## Implementation strategy

US1 and US2 are P1: every write into a repo multivac does not own is a diff
nobody can land. Phase 3's answer is the foundation every later phase asks.
US3–US5 read the same field, and US6's key and refusal land in Phase 3. MV-125's
legs describe every edit, so the change lands only as a whole.

> T030 closed in the real lifecycle (2026-09-14): `change apply` created the worktree on branch `managed-repos`. The reviewed prep commit cherry-picked with one conflict, on the MV-122 row. This change's amended statement met the archive link written by `one-resolver-per-root`'s close; the resolution kept this change's statement and the archive link, and nothing else. `verify --strict` 0 blocking, suite 680/680. The stage-4 verifier and the stage-5b fidelity review left no gap, so the change is converged.
