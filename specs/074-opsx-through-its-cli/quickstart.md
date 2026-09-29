# Quickstart: walk it with the real openspec

Every command runs in scratch with openspec 1.13.2 (and spec-kit 1.0.11 for the twin) on
PATH, `HOME` and `GIT_CONFIG_GLOBAL` isolated. Every mutating command is chained with its
`cd` in ONE invocation — a `cd` that does not persist must never let a vendor command fire in
the real repository. `MV` is this change's build; `BASE` is the build at `6e2a265`, for the
twins that must not move. Expected lines are in [contracts/cli-output.md](contracts/cli-output.md);
the measurements they are checked against are in [research.md](research.md).

```bash
REPO=/home/user/multivac; SCR=<scratch>
export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig OPENSPEC_TELEMETRY=0 DO_NOT_TRACK=1
mkdir -p $HOME && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main
MV="node $REPO/dist/cli.js"
mkdir -p $SCR/base && git -C $REPO archive 6e2a265 | tar -x -C $SCR/base \
  && cd $SCR/base && corepack pnpm install --frozen-lockfile && corepack pnpm build
BASE="node $SCR/base/dist/cli.js"
openspec --version    # 1.13.2
```

`FX` is a two-capability change (`proposal.md`, `design.md`, `tasks.md` with open boxes,
`specs/greeting/spec.md` and `specs/farewell/spec.md`, each an `## ADDED Requirements` block
with one scenario), written once under `$SCR/fx/add-greeting/`.

## Walk A — a fresh opsx brain, brain==code, `doors: [agents, claude]` (US1, US2)

1. `mkdir -p $SCR/A && cd $SCR/A && git init -q && printf 'print(1)\n' > app.py && $MV init . --provider claude --sdd opsx`
   — the scaffold line names `openspec init --tools none --no-animation .`. Before step 0,
   declare the brain as the repo it is, as `init` says (every repo before step 0; once
   committed the config changes only inside a change):
   `cd $SCR/A && printf 'repos:\n  brain: .\n' >> .multivac/config.yml`;
   `cd $SCR/A && find . -path ./.git -prune -o -type f -print | grep -E 'openspec-|opsx'`
   prints nothing; `find openspec -type f` lists `config.yaml` and two `.gitkeep`s (SC-001).
   Run the printed step-0 commit; it passes its hooks. `cd $SCR/A && $MV doctor` prints no
   leftover-bodies line.
2. `cd $SCR/A && grep -E '^  - `change (new|plan|apply|land)` →' AGENTS.md | wc -c` — at
   most 1,300 (SC-003); `grep -c 'saying `Updating`' AGENTS.md` is 0.
3. `cd $SCR/A && $MV change new add-greeting "Add greeting" | tee $SCR/lines.log` — the step,
   its guide, the instruction, last (US1-AS2, AS3). Before `change plan`, make the edits it
   prints in `.multivac/changes/add-greeting.md`: `repos: { brain: { status: planned } }`,
   `landing_order: [[brain]]`, and, since this change adds no row, `invariants.adds: []` with
   the reserved row's line dropped from `.multivac/invariants.md`. Every walk below that
   opens a change declares the same.
4. Follow the lines, each call appended to `$SCR/vendor.log`:
   `cd $SCR/A && openspec new change add-greeting --json </dev/null | tee -a $SCR/vendor.log`
   (exit 0, `root.source` `nearest`); then, until `status` shows no `[ ]`,
   `cd $SCR/A && openspec status --change add-greeting </dev/null | tee -a $SCR/vendor.log`
   and `cd $SCR/A && openspec instructions <id> --change add-greeting --json </dev/null | tee -a $SCR/vendor.log`,
   copying each file from `$FX` to the instruction's `resolvedOutputPath`.
5. `cd $SCR/A && $MV change plan add-greeting | tee -a $SCR/lines.log` — `proposal.md ok`, the
   plan step, its guide, the instruction.
6. `cd $SCR/A && $MV change apply add-greeting | tee -a $SCR/lines.log` — `tasks.md ok`, the
   real validator passes, no note; the carry moves `openspec/changes/add-greeting/` into
   `.multivac/worktrees/add-greeting/brain`. There:
   `cd $SCR/A/.multivac/worktrees/add-greeting/brain && openspec instructions apply --change add-greeting --json </dev/null | tee -a $SCR/vendor.log`
   gives `state` `ready`; tick every box; the same call gives `all_done` and "ready to be
   archived" (which the apply guide gives to `change land`).
7. Commit in the worktree, merge it locally into `main`, then
   `cd $SCR/A && $MV change land add-greeting --landed brain | tee -a $SCR/lines.log` —
   exactly three `sdd opsx:` lines: the step naming `openspec archive add-greeting --json`
   and no `--yes`, the guide starting `` `archive_confirmation_required` saying `Updating` ``,
   the instruction (SC-006).
8. `cd $SCR/A && openspec archive add-greeting --json </dev/null | tee -a $SCR/vendor.log`
   — exit 1, `status[0].code` `archive_confirmation_required`, message `Updating 2 spec(s)
   requires confirmation: rerun with --yes.`, `git status --porcelain` unchanged.
   `cd $SCR/A && openspec show add-greeting --json --deltas-only </dev/null | tee -a $SCR/vendor.log`
   — exit 0, the two deltas, `git status` still unchanged. The human says yes:
   `cd $SCR/A && openspec archive add-greeting --json --yes </dev/null | tee -a $SCR/vendor.log` — exit 0.
9. `cd $SCR/A && $MV change close add-greeting` — exit 0; the printed pathspec holds the
   archive directory, `openspec/changes/add-greeting` and both merged
   `openspec/specs/{greeting,farewell}/spec.md`; after the printed commit,
   `git status --porcelain -uall` shows no path of the slug (US2-AS2, SC-007).
10. `wc -c < $SCR/vendor.log` and `grep '^sdd opsx:' $SCR/lines.log | wc -c` — together under
    30,000 B when the brain's absolute path is short (SC-004 counts the vendor output and the
    `sdd opsx:` lines, not the change-file and commit lines `lines.log` also holds; openspec's
    JSON repeats the path, about 45 B more per character of it; research.md measured
    24,329 + 4,077 at 8 characters, the walk 24,418 + 4,395). `ls -A $HOME/.config 2>/dev/null`
    is empty.

## Walk B — design skipped (US3-AS2)

Repeat A to step 4 writing only proposal and specs: text `status` shows `[ ] design` and
`[-] tasks (blocked by: design)`;
`cd $SCR/A && openspec instructions tasks --change <slug> --json </dev/null` exits 0 anyway.
`$MV change plan <slug>` prints the plan guide naming exactly that; with `tasks.md` written,
`change apply` passes without a design.

## Walk C — the three answers at archive (US2-AS3, AS4, SC-008)

A brain like A with `openspec/specs/billing/spec.md` committed; a change `bw` with a
MODIFIED billing block that exists there and an ADDED `refunds` block.
- `--skip-specs`: after land, append a human's line to `openspec/specs/billing/spec.md`
  (uncommitted) and write an untracked `openspec/specs/refunds/spec.md` draft;
  `cd $SCR/C && openspec archive bw --json --skip-specs </dev/null` exits 0, `specsUpdated`
  false; `cd $SCR/C && $MV change close bw` names both
  `openspec/specs/billing/spec.md` and `openspec/specs/refunds/spec.md` `is dirty and was not
  staged`, and the pathspec holds neither.
- `--yes` twin: both delta blocks appear verbatim in the main specs; close stages the archive,
  the moved-from directory and both merge targets, and names nothing dirty.
- CRLF twin: the same with the delta files converted to CRLF before the archive
  (`sed -i 's/$/\r/'`); openspec writes the merged spec LF; close still stages both targets.

## Walk D — the archive run in the worktree (US2-AS5, SC-007)

Repeat A to step 7, then run step 8's yes in `.multivac/worktrees/add-greeting/brain`
(`cd $SCR/A/.multivac/worktrees/add-greeting/brain && openspec archive add-greeting --json --yes </dev/null`).
`cd $SCR/A && $MV change close add-greeting` exits 1: `… is only in the change's worktree,
.multivac/worktrees/add-greeting/brain/openspec/changes/archive/<date>-add-greeting, which
never reaches the brain checkout`, then the land step and its guide. Archive in the brain
checkout instead: close exits 0.

## Walk E — a brain scaffolded before this change (US4, SC-011)

`mkdir -p $SCR/E && cd $SCR/E && git init -q && printf 'print(1)\n' > app.py && $MV init . --provider claude --sdd opsx`,
commit step 0, then
`cd $SCR/E && openspec init --tools agents,claude --no-animation . </dev/null && mkdir -p .codex/skills && cp -r .agents/skills/openspec-propose .codex/skills/`
(the `.codex/` copy is what 1.7.0's codex wrote) and commit through the installed hooks —
exit 0.
- `cd $SCR/E && $MV doctor` prints one line naming `.agents/skills/.openspec-target`,
  `.agents/skills/openspec-*`, `.claude/commands/opsx`, `.claude/skills/openspec-*` and
  `.codex/skills/openspec-propose` (one sibling, so not collapsed) with `git rm -r`, and exits 0.
- `cd $SCR/E && $MV change new probe "Probe"` prints the same step lines as Walk A and no
  init line, since the probe reads the root as installed (US4-AS4).
- `cd $SCR/E && git rm -r <the printed paths> && git commit -m "drop openspec bodies"`
  through the installed hooks — exit 0; `cd $SCR/E && $MV verify --strict` — exit 0;
  `$MV doctor` — no such line.

## Walk F — slugs (US5-AS1–3, SC-012)

In A's brain: `cd $SCR/A && $MV change new Fix_Auth "x"` and `$MV change new archive "x"` each
exit 1 with the slug line and leave `git status --porcelain` unchanged, also with `--no-sdd`
and with `sdd_auto: false`; `cd $SCR/A && $MV roadmap add Fix_Auth "x"` exits 2 and records
nothing; `cd $SCR/A && $MV change new fix-auth "x"` proceeds. openspec 1.13.2 itself refuses
`Fix_Auth`, `a.b`, `a_b`, `a--b`, `Ab`, `a-b-`, `-ab` and accepts `ab-c`, `1ab`, `a1`, `x`. In a
speckit brain (`$MV init . --provider claude --sdd speckit`), `change new Fix_Auth "x"` and
`roadmap add Fix_Auth "x"` are accepted as before.

## Walk G — the validator note (US5-AS4, SC-013)

In A's brain, a change whose MODIFIED header the main spec lacks:
`cd $SCR/A && openspec validate bw --json --no-interactive </dev/null` exits 0 with the INFO
issue "Archive would refuse this delta: …"; `cd $SCR/A && $MV change apply bw` exits 0 and
prints the note line after `tasks.md ok`.

## Walk H — twins that must not move (SC-005, US3-AS4)

- speckit: a brain initialised with `--sdd speckit` by `$BASE` and a copy by `$MV`: `diff` of
  `AGENTS.md`, `.multivac/flow.md`, `doctor` output and the `change new`/`plan`/`apply`
  output — identical but for paths.
- `sdd_auto: false` in A's config: the door still lists the four runs, `change new` prints no
  step and `change plan` gates nothing.
- no SDD declared: no `sdd` line anywhere, as before.
- `cd $SCR/A && openspec update </dev/null` prints `No configured tools found.` and writes
  nothing (the refresh fact).

## Walk I — this repository

In the change's worktree: `multivac doors` leaves `AGENTS.md`, `CLAUDE.md` and
`.multivac/flow.md` byte-identical (this brain declares speckit) and re-renders
`.multivac/ecosystem.json` and `.claude/skills/multivac/`; `corepack pnpm test` passes;
`multivac verify` reports every claim anchored and 0 blocking; `grep -c 'Amended
[0-9-]* by MV-147' .multivac/invariants.md` is 12 — MV-51, 56, 63, 75, 95, 121, 124, 130,
133, 142 (added at review), 144 and 146 — as MV-147's `count=12` leg pins (SC-016). The subprocess count (SC-002) is
the logging-stub test's, not a walk.
