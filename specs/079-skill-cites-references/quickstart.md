# Quickstart: walk the pointers with the real vendors

Every command runs in scratch with spec-kit 1.0.11, openspec 1.13.2, graphify 0.9.29 and
codegraph 1.6.0 on PATH, `HOME` and `GIT_CONFIG_GLOBAL` isolated. Every mutating command is
chained with its `cd` in ONE invocation — a `cd` that does not persist must never let a vendor
or lifecycle command fire in the real repository. `MV` is this change's build (the change
worktree); `BASE` is the build of the merged tree T001 recorded, for the before-figures and the
restatement test's red run. Expected strings are in [contracts/cli-output.md](contracts/cli-output.md);
the figures they are checked against in [research.md](research.md) R4–R6.

```bash
REPO=<the change worktree>; SCR=<scratch>; BASE_REV=<T001's merged head>
export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0 \
       CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1 OPENSPEC_NO_COMPLETIONS=1
mkdir -p $HOME && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main
MV="node $REPO/dist/cli.js"
mkdir -p $SCR/base && git -C $REPO archive $BASE_REV | tar -x -C $SCR/base \
  && cd $SCR/base && corepack pnpm install --frozen-lockfile && corepack pnpm build
BASE="node $SCR/base/dist/cli.js"
specify --version; openspec --version; graphify --version; codegraph --version
```

`mk <name> <codeless 0|1> <init flags…>` builds a brain (holding code, or not) with two code
repos `web` and `api`, each cloned from a local bare remote, runs `init` with the flags, declares
the repos, commits, pushes, then `repos sync`, `doors` and `verify` — the design's
`c9/synth/mk.sh` with `$MV` for the CLI, every step `cd $SCR/<name>/brain && …`. A scenario that
needs `managed: false` or `sdd_auto: false` appends the line to `.multivac/config.yml` before
the first commit.

The pointer table of contracts/cli-output.md is copied into `$SCR/pointers.md` with one
column per walk; each walk ticks the rows it printed and marks `n/a (condition)` for the rows
its configuration does not print, naming the condition the pack states.

## Walk A — spec-kit + graphify, the brain holds code (this repository's shape) (US1, US2)

1. `cd $SCR && mk A 0 . --provider claude --sdd speckit --grapher graphify` — `0 blocking
   broken · exit 0`; write a filled constitution (`cd $SCR/A/brain && printf …
   > .specify/memory/constitution.md && git add -A && git commit -qm constitution`).
2. `diff -rq $REPO/skills/multivac $SCR/A/brain/.claude/skills/multivac && diff -rq
   $REPO/skills/multivac $SCR/A/web/.claude/skills/multivac` — no output (SC-007).
3. `cd $SCR/A/brain && sed -n '/multivac:begin/,/multivac:end/p' AGENTS.md > $SCR/A/door.md`
   — the brain-holds-code sentence, the graphify lines, 7 step lines; tick §1's rows.
4. `cd $SCR/A/brain && $MV change | tee $SCR/A/usage.log` — the usage of §3.
5. `cd $SCR/A/brain && $MV change new points-expire "Points expire" | tee $SCR/A/new.log` —
   `committed: change open: …`, the two spec-kit steps with their proof, the run-the-chain
   line. Make the edits it prints (repos `brain`, `landing_order: [[brain]]`, the claim).
6. `cd $SCR/A/brain && $MV change plan points-expire | tee $SCR/A/r-plan.log` — refused,
   naming `specs/<n>-points-expire/spec.md`, the step and `then re-run: …` (§4 refusal row).
   Write the spec, plan and tasks with the design's `skill-pointers/fill.py` (tasks with one
   `- [ ] T001`), then `cd $SCR/A/brain && $MV change plan points-expire` — rc 0.
7. `cd $SCR/A/brain && $MV change apply points-expire | tee $SCR/A/apply.log` — `committed:
   change apply: …`, `work here — …`, and `its graph: --graph …` under the worktree (the
   apply-flag row).
8. Commit a code edit in the worktree, merge it locally, then `cd $SCR/A/brain && $MV change
   land points-expire --landed brain | tee $SCR/A/land.log` — `committed: graph: …`.
9. `cd $SCR/A/brain && $MV change close points-expire | tee $SCR/A/r-close.log` — refused:
   `… tasks.md has 1 open item(s) — …` (the ledger row). Tick the task in the worktree's
   `tasks.md` and commit, then `cd $SCR/A/brain && $MV change close points-expire | tee
   $SCR/A/close.log` — `archived — commit this on a branch; …` and the ritual (SC-008).
10. `cd $SCR/A/brain && git switch -q main && printf 'x\n' > src/z.ts && git add src/z.ts
    && git commit -qm z; echo rc=$?` — refused at commit, naming the change to start (rule 6:
    the brain's own checkout, an SDD governing, automation on); `cd $SCR/A/brain && git reset
    -q && rm src/z.ts` afterwards.

## Walk B — openspec + codegraph, the brain holds code (US2)

1. `cd $SCR && mk B 0 . --provider claude --sdd opsx --grapher codegraph`.
2. The door lists openspec's four steps and codegraph's verbs as #6 renders them; the
   restatement fixture's marker for this shape is present.
3. `new` → `plan` → `apply` → `land` with openspec's printed verbs (`openspec new change
   <slug> --json`, `openspec instructions …`), each `cd $SCR/B/brain && …`: `apply` prints
   `its index: -p …`; `land.log` has no `committed: graph:` line (the never-a-local-index row).

## Walk C — no adapter (US2)

1. `cd $SCR && mk C 0 . --provider claude`.
2. The door has no `[proof:` line and no grapher line (the "or names no grapher" row).
3. `cd $SCR/C/brain && $MV change new third "Third" && $MV change plan third | tee
   $SCR/C/plan.log` — `landing order:` and no next-step line: the core's rhythm names `apply`
   (the rhythm row). `apply` prints no graph flag.
4. The read-line states: `cd $SCR/C/web && git remote remove origin`, then `cd $SCR/C/brain &&
   $MV verify | tee $SCR/C/v-fell.log` — `FELL BACK to the working tree`; `cd $SCR/C/web && git remote add origin $SCR/C/remotes/web.git && git fetch -q origin` restores it;
   `cd $SCR/C/brain && git commit --allow-empty -qm x && git push -q origin main && git reset
   -q --hard HEAD~1 && $MV verify | tee $SCR/C/v-behind.log` — `behind its own channel`; a
   `(last fetch <age> ago)` in every read line (the three fix rows).

## Walk D — code-less brain, spec-kit + graphify, one read-only repo (US2)

1. `cd $SCR && mk D 1 . --provider claude --sdd speckit --grapher graphify`, with a third repo
   `ro` (a clone of `web`'s bare remote at `../ro`) declared `managed: false` before the first
   commit.
2. `diff -rq $REPO/skills/multivac $SCR/D/{brain,web,api}/.claude/skills/multivac` — none;
   `test ! -e $SCR/D/ro/.claude/skills/multivac` (SC-007).
3. `cd $SCR/D/web && sed -n '/multivac:begin/,/multivac:end/p' AGENTS.md` — `its brain is
   mounted at \`.brain/\``, the SDD line, no step line, no `multivac change` (§2).
4. `cd $SCR/D/web && $MV change new fix; echo rc=$?` — the refusal verify-rooted-and-quiet
   left there (at 62d4588: `run \`multivac init .\``, rc 2): whatever it says, *Where you
   are* sends the agent to the brain checkout (SC-009). Record the text.
5. `cd $SCR/D/web && printf 'x\n' > src/y.ts && git add src/y.ts && git commit -qm y; echo
   rc=$?` — rc 0, the `code` line reported; `cd $SCR/D/web && $MV verify --strict --range
   HEAD~1..HEAD --branch main; echo rc=$?` — exit 1 (rule 6's conditions).
6. The brain door says the brain holds no code and names each repo's graph with its flag.

## Walk E — spec-kit under `sdd_auto: false` (US2)

1. `cd $SCR && mk E 0 . --provider claude --sdd speckit` with `sdd_auto: false`.
2. The door keeps the step lines and no refusal clause; `change new` and `plan` print no step
   and no run-the-chain line.
3. Staged code on `main` in the brain: `git commit` rc 0 (rule 6: only where automation is on).

## Walk F — a grapher declared under `graphers:` (US2)

1. `cd $SCR && mk F 0 . --provider claude` with `grapher: mygraph` and `graphers: { mygraph:
   { artifact: out/g.json, refresh: 'mygraph build' } }` (a stub `mygraph` on PATH writing the
   artifact).
2. The door carries `` `mygraph` has NO query command: … Do not invent one. `` (the "says it
   has none: then grep" row); `apply` prints no flag.

## Walk G — a brain with no `claude` target (the follow-up's evidence)

1. `cd $SCR && mkdir G && cd $SCR/G && git init -q && $MV init . --provider codex | tee
   $SCR/G/init.log` — `find $SCR/G -name SKILL.md -path '*multivac*'` prints nothing, and
   `init.log` still says `load the multivac skill in your agent — it carries both protocols`.
   Recorded for `skill-reaches-every-harness`; nothing here changes it.

## Walk H — the restatement check and the family sweep over every rendered door

1. `cd $REPO && node --test dist-test/test/skill.test.js dist-test/test/invariants/skill-copy.test.js`
   — all pass; the restatement test reports its fixture count (at least 9 brain and 4
   consumer doors) and 0 restated (SC-006).
2. The same test against the merged tree's pack: `cp $REPO/test/skill.test.ts
   $SCR/base/test/skill.test.ts && cd $SCR/base && corepack pnpm build && node --test
   dist-test/test/skill.test.js` — red, naming each restated clause (2 at 62d4588); T014
   recorded the same list.
3. Over the doors and flow.md of Walks A–G and the matrix of T005 ({speckit, opsx, none} ×
   {graphify, codegraph, declared, none} × {claude, codex} × {automation on, off}, and one
   code-less brain with a `managed: false` repo), `grep -c -i -E '<family regex>'` for every
   family of research.md R8 — 0 each (SC-012); the clause split of research.md R6 over the same
   doors against the new pack — 0.

## Walk I — the law and the suite

1. `cd $REPO && $MV count '<leg>'` for each MV-152 leg — `unique` legs 1, `absent` legs 0,
   the test-title leg 1 (FR-043, critic gap 11).
2. `cd $REPO && $MV verify --strict --check` — every claim anchored, `0 blocking broken · exit
   0` (SC-015).
3. `cd $REPO && corepack pnpm test` — against T001's counts.
4. `cd $REPO && python3 <sessions script> $SCR/base/skills/multivac $REPO/skills/multivac` —
   the session table of research.md R4 for the merged tree and the new pack; `node dist/cli.js
   change | wc -c`, `node dist/cli.js help anchor | wc -c` and the brain door's `wc -c` for the
   net figures (SC-001–SC-003).

## Walk J — the pages

1. `cd $REPO && $MV count '<glob> /<family regex>/'` for every family — 0 (SC-010, SC-013,
   SC-014); U1 and U2 — 1 each; MV-31's `count=8`, MV-141's README leg, MV-134, MV-80, MV-50,
   MV-52 as their rows state; `git grep -n -i -E 'mv-[0-9]+|[0-9]+\.[0-9]+\.[0-9]+' --
   site/content` — nothing new.
2. Replay each close sample (commands.md, the-change.md, philosophy.md) in the fixture its text
   asserts — a Walk-A-shaped brain, closing a change with an SDD — and compare the printed
   pathspecs to the page (FR-039).
3. `cd $REPO && grep -n 'Sync Impact' .specify/memory/constitution.md` — nothing;
   Principle III says `change close` verifies the rows the change claims; the Compliance line
   says where the hooks are armed; the footer's version moved by PATCH since 3.0.1 (SC-011).

Record every walk's result — each ticked pointer, each `n/a (condition)`, each measured figure
and the refusal text of Walk D step 4 — in `.multivac/changes/skill-cites-references.md`'s body.
