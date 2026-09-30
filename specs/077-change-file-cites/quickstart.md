# Quickstart: walk it with the built CLI and the real vendors

Every command runs in scratch with spec-kit 1.0.11, openspec 1.13.2, graphify 0.9.29 and
codegraph 1.6.0 on PATH where a walk names them, `HOME` and `GIT_CONFIG_GLOBAL` isolated. Every
mutating command is chained with its `cd` in ONE invocation — a `cd` that does not persist must
never let a vendor command or a commit fire in the real repository. `MV` is this change's build
(the worktree's `dist/`); `BASE` is the build of the branch's base, for the twins that must not
move. The hook's third tier runs `mvac`, so a wrapper for `MV` goes FIRST on PATH (research.md
R13). Expected lines are in [contracts/cli-output.md](contracts/cli-output.md); the measurements
they are checked against are in [research.md](research.md).

```bash
WT=/home/user/multivac/.multivac/worktrees/change-file-cites/brain; SCR=<scratch>
PLANSCR=/tmp/claude-0/-home-user-multivac/2009d32c-ec8a-53c2-87bc-5b2df689ff4a/scratchpad   # c7/ and c78/: the planning and design scripts
export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0 \
  CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1
mkdir -p $HOME $SCR/bin && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
cd $WT && corepack pnpm build
MV="node $WT/dist/cli.js"; printf '#!/bin/sh\nexec node %s/dist/cli.js "$@"\n' "$WT" > $SCR/bin/mvac && chmod +x $SCR/bin/mvac
export PATH=$SCR/bin:$PATH
BASEREV=$(git -C $WT merge-base HEAD main); mkdir -p $SCR/base && git -C $WT archive $BASEREV | tar -x -C $SCR/base \
  && cd $SCR/base && corepack pnpm install --frozen-lockfile && corepack pnpm build
BASE="node $SCR/base/dist/cli.js"
```

`brainpp <dir> <sdd-flags>` below is: `mkdir -p <dir> && cd <dir> && git init -q && printf
'print(1)\n' > app.py && $MV init . --provider claude <sdd-flags> && printf 'repos:\n  brain: .\n'
>> .multivac/config.yml`, then the printed step-0 commit. `declare <slug> <ID>` edits
`.multivac/changes/<slug>.md` to `repos: { brain: { status: planned } }`, `landing_order:
[[brain]]` and `claims: [<ID>]` (the reserved ID `change new` printed), writes `<!-- @anchor
<ID> brain:app.py /print/ -->` under the row in `.multivac/invariants.md` (never in the change
file), and commits both.

## Walk A — speckit 1.0.11, brain==code (US1, US2, US3)

1. `brainpp $SCR/A "--sdd speckit"`; write the constitution (replace the template tokens) and
   commit it, in one chain with `cd $SCR/A`.
2. `cd $SCR/A && $MV change new wsk "W" | tee $SCR/A.new` — the third edit is
   `  3. claims: [INV-01]                           # the rows close verifies; each states its rule`;
   `grep -c 'statement\|Statements are prose' $SCR/A.new .multivac/changes/wsk.md` is 0 for both
   (SC-003). `cd $SCR/A && declare wsk INV-01`, leaving the row RESERVED.
3. Run the printed speckit steps (`$PLANSCR/c78/synth/sk.sh` fakes `specs/001-wsk/{spec,plan,tasks}.md`
   from fixtures), then `cd $SCR/A && $MV change plan wsk && $MV change apply wsk` — plan prints no
   `close refuses this` line (the claim is declared; unstated is not a declaration defect).
4. Commit in `.multivac/worktrees/wsk/brain`, tick `tasks.md`, merge into main, then
   `cd $SCR/A && $MV change land wsk --landed brain` — after the unchanged armed line,
   `  close refuses until: INV-01: its row states no rule yet — …`, and the last line
   `all stages landed — fix the line close refuses on above, then: multivac change close wsk`
   (US3-AS2).
5. `cd $SCR/A && $MV verify --strict; echo rc=$?` — the refusing finished line, `1 blocking broken
   · exit 1`, rc=1 (US3-AS1).
6. `cd $SCR/A && $MV change close wsk; echo rc=$?` — `sdd speckit: brain: specs/001-wsk/tasks.md —
   nothing left open`, `INV-01: ok`, the unstated line, the summary, rc=1; `ls
   .multivac/changes/archive/wsk.md` fails and `git status --porcelain` is unchanged (SC-005).
7. State the row in `.multivac/invariants.md` and commit (`cd $SCR/A && … && git commit -qam
   "state INV-01"`). `cd $SCR/A && $MV verify --strict` prints `close it: multivac change close
   wsk`; `cd $SCR/A && $MV change close wsk; echo rc=$?` is rc=0, prints only `INV-01: ok` for the
   claim, and `grep -A1 '^claims:' .multivac/changes/archive/wsk.md` is `  - INV-01`; the archive
   ends with `` Specified in `specs/001-wsk/` (speckit). `` (SC-012).

## Walk B — openspec 1.13.2, brain==code (US3)

1. `brainpp $SCR/B "--sdd opsx"`; `cd $SCR/B && $MV change new greet "Greet" && declare greet INV-01`.
2. Follow the printed openspec verbs (`openspec new change greet --json`, the `status` /
   `instructions` loop, writing the artifacts by hand); `cd $SCR/B && openspec validate greet`
   exits 0. `cd $SCR/B && $MV change plan greet && $MV change apply greet` — the carry moves
   `openspec/changes/greet/` into the worktree.
3. Commit there, merge, `cd $SCR/B && $MV change land greet --landed brain` — the refusal notice;
   `cd $SCR/B && openspec archive greet --json --yes </dev/null` (the human said yes).
4. `cd $SCR/B && $MV verify --strict; echo rc=$?` — rc=1 with the refusing finished line.
   `cd $SCR/B && $MV change close greet; echo rc=$?` — `sdd opsx: brain:
   openspec/changes/archive/<date>-greet ok`, `INV-01: ok`, the refusal, rc=1, nothing staged.
5. State the row, commit, close again: rc=0; the printed pathspec holds the archive directory,
   `openspec/specs/…/spec.md` and `openspec/changes/greet`; the archive ends with
   `` Specified in `openspec/changes/archive/<date>-greet/` (opsx). `` (SC-012).

## Walk C — graphify 0.9.29 and codegraph 1.6.0, the clean twin (SC-009)

1. `brainpp $SCR/C1 "--grapher codegraph"` and the same brain under `BASE` at `$SCR/C0`; in each,
   open `cln`, declare it with a claim of a row that is stated and anchored, land and close,
   teeing each command's stdout to `$SCR/C<n>.<cmd>` (`BASE` writes the legacy claim form it
   prints; `MV` the bare one).
2. `for c in plan apply land strict close after; do cmp <(sed 's/[0-9a-f]\{7\}/SHA/g' $SCR/C0.$c) <(sed 's/[0-9a-f]\{7\}/SHA/g' $SCR/C1.$c) && echo same $c; done`
   — `same` six times (257, 537, 520, 535, 655, 298 B); `wc -c $SCR/C0.new $SCR/C1.new` differ by
   25 B. Repeat the unstated walk of A under `--grapher graphify`: the same rc sequence; the
   passing close prints ``graph graphify @ brain: refreshed (`graphify update .`)`` and its commit
   carries `graphify-out/graph.json` (SC-012).

## Walk D — a code-less brain, api and web with bare origins (SC-012)

1. Two bare remotes `api.git`, `web.git`, each seeded with `src/index.ts`; `cd $SCR/D && mkdir
   brain && cd brain && git init -q && $MV init . --provider claude` with `repos: { api:
   ../api, web: ../web }` declared before step 0; `cd $SCR/D/brain && $MV repos sync`.
2. `cd $SCR/D/brain && $MV change new wcl "W"`, declare `repos: {api, web}`, `landing_order:
   [[api, web]]`, `claims: [INV-04]` with its anchor on `api:src/index.ts`; plan, apply, commit
   and push in both worktrees, merge on the remotes, `land --landed api`, `land --landed web`.
3. `cd $SCR/D/brain && $MV verify --strict; echo rc=$?` is 1; `cd $SCR/D/brain && $MV change
   close wcl` prints exactly the three lines of the contract's code-less sample (235 B), rc=1;
   stated, rc=0.

## Walk E — a fresh claude-door brain, a change that adds nothing (US4, SC-016)

1. `brainpp $SCR/E ""` and the same at `$SCR/E0` with `BASE`.
2. In each: `change new leak "Leak"`, `repos: { brain: { status: landed } }`, `landing_order:
   [[brain]]`, commit, `change close leak`.
3. `BASE`: rc 0, no release line, `grep -c '| INV-01 |' .multivac/invariants.md` is 1. `MV`:
   `released unused reservation: INV-01`, and the count is 0.

## Walk F — a brain behind its channel (US2-AS4, US2-AS5, US3-AS3, SC-007)

1. A bare `origin.git`; `brainpp` a brain, push it, and clone it twice: `$SCR/F/op` (the operator)
   and `$SCR/F/other`.
2. In `op`: `change new up "Up"`, declare `up INV-02`, commit and push; plan, apply, commit in the
   worktree, merge into main locally — but do not record the last land yet.
3. In `other`: `git pull`, state INV-02's row, commit, push. In `op`: `git fetch` only.
4. `cd $SCR/F/op && $MV change land up --landed brain` — `  close refuses until: INV-02: its row
   states no rule here, but origin/main states it (1 commit(s) this checkout lacks) — pull, then
   re-run close`; never "state it". `cd $SCR/F/op && $MV verify --strict` — the read line names
   `1 behind its own channel origin/main`; the finished line says "state it" (the stated ceiling).
5. `cd $SCR/F/op && $MV change close up; echo rc=$?` — the same pull line, rc=1. `cd $SCR/F/op &&
   git pull --no-rebase -q && $MV change close up; echo rc=$?` — rc=0.
6. Again with `repos: { brain: { path: ., channel: origin/trunk } }` and the stating commit pushed
   to `trunk`: land, close and the read line all name `origin/trunk`.

## Walk G — a stray claim key (US1-AS4, SC-004)

1. `brainpp $SCR/G "--sdd speckit"`; open `xk`, declare it, run its speckit steps and apply (so the
   SDD gates pass and step 4 reaches the change file), then in the brain checkout add
   `note: why this matters` under the claim (as a map `- id: INV-01` / `  note: …`) and commit.
2. `cd $SCR/G && $MV verify; echo rc=$?` — the rc step 1 recorded before the key was added, plus
   the notice line naming `unknown key "note"`; no `ecosystem … is stale` line after
   `cd $SCR/G && $MV doors`; `cd $SCR/G && $MV roadmap` lists `xk` in flight. (`$BASE` is no twin
   here: the old reader refuses an ID map with no statement and drops the change whole.)
3. A code commit in `.multivac/worktrees/xk/brain` passes its hook (the code gate still sees
   `xk`).
4. `cd $SCR/G && $MV change plan xk; echo rc=$?` — the refusal with `unknown key "note"`, rc=1,
   `git status --porcelain` unchanged; the same for `land` and `close`.

## Walk H — refusals named before close (US2, SC-006, SC-008, SC-013, SC-014, SC-015)

In `brainpp $SCR/H ""` (no SDD), one landed change per case, each checked with `land`,
`verify --strict` and `close`:

1. **Orphan**: the claim's only anchor inside `.multivac/changes/orp.md`, row stated — land and the
   finished line name `INV-0n: anchored only in .multivac/changes/orp.md, which close archives …`;
   close prints MV-117's `close refused — … anchored ONLY in …` unchanged.
2. **Every defect in one run**: a claim with a red anchor, `NOPE-99`, and a claim of a row the
   change does not declare — one close run, the three lines, exactly two "close refused" lines.
3. **An active row under `adds`**: `already in .multivac/invariants.md (active) — not new; move it
   to invariants.touches`; never "drop it from … the law".
4. **Retiring**: a change retiring a row and claiming it — close refuses with the `retiring` line
   while the row is active; flip it to `retired` with a tombstone and an `absent` leg that holds,
   and close passes; break the leg and close is red on it.
5. **Abandon**: `close --abandon` over a change whose reserved row was stated — rc=1, the
   `states a rule this abandoned change never verified` line, nothing archived; over a RESERVED
   row an anchor names — rc=0 and the row kept.

## Walk I — the skew, read before upgrading (US6)

1. In Walk A's brain, `cd $SCR/A && $BASE change plan wsk2; echo rc=$?` against an ID-only
   `wsk2` — `each claim needs a string "id" and "statement"`, rc=1; `$BASE roadmap` prints `in
   flight: no open change`; `$BASE doors` drops `change:wsk2` from `ecosystem.json`.
2. With `requires: ">=<next release>"` in `.multivac/config.yml` (in scratch only), `$BASE verify`
   prints the red floor line in the brain; a consumer mounting it prints none. `$MV verify` at the
   un-bumped version prints the floor line too — which is why the floor waits for the release.

## Walk J — the law and the words on the branch (SC-002, SC-018, SC-019, SC-020)

1. `sed "s#$PLANSCR/c7/main-build#$SCR/base#" $PLANSCR/c7/roundtrip.mjs > $SCR/rt.mjs && cd $WT && node $SCR/rt.mjs $WT`
   (old reader `BASE`, new reader the branch) — `{"files":131,"identicalOldVsNew":130,"differ":0,"bothFail":1,…}`,
   or the branch head's file count with `differ` 0 and `bothFail` 1 (SC-002).
2. `sed "s#$PLANSCR/c7/main-build#$SCR/base#" $PLANSCR/c7/anchsets.mjs > $SCR/as.mjs && node $SCR/as.mjs $WT`
   — `mvRawOnly` 0 (SC-018).
3. `cd $WT && git grep -c -E 'ended (up )?consistent|checks law and code|anywhere the change touched' -- DESIGN.md .specify/memory/constitution.md 'site/content/**' 'skills/**' '.claude/skills/multivac/**'`
   prints nothing; the same for the retired-example regex over its glob.
4. `cd $WT && $MV doors && $MV verify --strict; echo rc=$?` — rc=0, nothing `moved`,
   `grep -c 'Amended 2026-09-29 by MV-150' .multivac/invariants.md` is 4.
5. `cd $WT && git diff main -- .multivac/config.yml | grep -c requires` is 0; the changelog's
   Unreleased names MV-150 and `requires:`.
