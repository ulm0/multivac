---
slug: opsx-through-its-cli
status: archived
horizon: now
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-51
    - MV-56
    - MV-63
    - MV-75
    - MV-95
    - MV-121
    - MV-124
    - MV-130
    - MV-133
    - MV-142
    - MV-144
    - MV-146
  adds:
    - MV-147
  retires: []
claims:
  - id: MV-147
    statement: opsx runs through its own CLI. Its printed steps are openspec's terminal verbs, the scaffold installs no command body, the questions the bodies asked ride on the printed lines, the archive is printed without a flag and its confirmation goes to the human with the tool's own preview and answers, a land step's proof is read in the brain checkout alone, close stages a merged main spec only when it carries the merge, and change new refuses a slug the SDD refuses.
---

# opsx: the agent runs openspec's own CLI, not the command bodies

With openspec declared, the agent drives the flow through openspec's own terminal verbs instead of loading ~58 KB of command bodies that orchestrate the same CLI.

## Walked with the real openspec 1.13.2 (T062, 2026-09-29)

Scratch brains under the session scratchpad, `HOME` and `GIT_CONFIG_GLOBAL` isolated,
`OPENSPEC_TELEMETRY=0 DO_NOT_TRACK=1`, this branch's build (after the review fixes) as `MV`
and 7b849fa's as `BASE`; quickstart.md's walks, in order.

- **A, a fresh brain==code opsx brain** (SC-001, SC-003, SC-006, SC-007): the scaffold ran
  `openspec init --tools none --no-animation .` and wrote `openspec/config.yaml` and the two
  gitkeeps, no `openspec-*` or `opsx` entry anywhere; step zero committed through its hooks;
  `doctor` printed no bodies line. The four door step lines are 1,220 B, with no guide. The
  flow ran as printed: `new change` (`root.source` `nearest`), the `status`/`instructions`
  loop, `instructions apply` in the change's worktree (`ready`, then `all_done`); land printed
  exactly three `sdd opsx:` lines, the archive with no flag; `archive --json` exited 1 with
  `archive_confirmation_required` "Updating 2 spec(s) requires confirmation" and wrote
  nothing, `show --json --deltas-only` wrote nothing, `--json --yes` archived; close staged
  the archive, the moved-from directory and both merged `spec.md`s, and after its printed
  commit `git status -uall` held no path of the slug.
- **SC-004**: 14 vendor calls, 27,619 B of output, plus 4,395 B of `sdd opsx:` lines over the
  four points — 32,014 B, above the 30,000 B the criterion names, because openspec's JSON
  repeats the brain's absolute path, 45 times here, and this brain's path is 96 characters.
  With that path written as an 8-character one the vendor output is 23,659 B and the total
  28,054 B, under 30,000 as research.md measured it (24,329 + 4,077 at its own path): the
  budget holds at a short path and grows 45 B for each character of the brain's path.
  Nothing was written under `$HOME/.config`.
- **B, design skipped** (US3-AS2): `status` showed `[ ] design` and `[-] tasks (blocked by:
  design)`, `instructions tasks --json` exited 0 anyway, plan printed the guide naming it, and
  apply passed without a design.
- **C, the three answers** (SC-008): `--skip-specs` beside a human's uncommitted edit to
  `openspec/specs/billing/spec.md` and an untracked `openspec/specs/refunds/spec.md` draft —
  `specsUpdated` false, close named both dirty and staged neither; `--yes` — close staged the
  archive, the moved-from directory and both targets, naming nothing dirty; the CRLF twin —
  openspec wrote the merged spec LF and close still staged both.
- **The review's regressions, end to end**: a MODIFIED block that only drops the end of a
  line, a requirement holding a fenced `## ` sample with a scenario added, each archived
  `--skip-specs` beside a human's Purpose edit — close named the spec dirty and left it out;
  a REMOVED delta with a fenced `## ADDED Requirements` example, archived `--yes` (7 lines
  removed) — close staged the spec; a `notes.md` beside an ADDED delta and a human's
  untracked `openspec/specs/refunds/notes.md` — close staged `refunds/spec.md` alone.
- **D, the archive run in the worktree** (SC-007): close exited 1 naming
  `.multivac/worktrees/add-greeting/brain/openspec/changes/archive/2026-09-29-add-greeting`
  and "never reaches the brain checkout", then the land step and its guide; archived in the
  checkout instead, close exited 0.
- **E, an earlier init's bodies** (SC-011): `openspec init --tools agents,claude` plus a
  `.codex/skills/openspec-propose` copy committed through the hooks with no change open;
  `doctor` exited 0 with one line, `git rm -r .agents/skills/.openspec-target
  .agents/skills/openspec-* .claude/commands/opsx .claude/skills/openspec-*
  .codex/skills/openspec-propose`; `change new probe` printed a fresh brain's step lines and
  no init, bodies still committed; the printed removal committed through the hooks,
  `verify --strict` exited 0 and `doctor` printed no such line.
- **F, slugs** (SC-012): `change new Fix_Auth` and `change new archive` exited 1 with the
  slug line, as did `--no-sdd` and `sdd_auto: false`, leaving HEAD and `git status`
  unchanged; `change new "Archive"` asked for a slug to be named; `roadmap add Fix_Auth`
  exited 2 recording nothing; `fix-auth` proceeded; `change new -ab` stays the argument
  parser's `unknown flag` (exit 2). openspec itself refused `Fix_Auth`, `a.b`, `a_b`, `a--b`,
  `Ab`, `a-b-`, `archive` and (`unknown option`) `-ab`, and took `ab-c`, `1ab`, `a1`, `x`. A
  speckit brain took `Fix_Auth` in both commands.
- **G, the validator note** (SC-013): a MODIFIED header the main spec lacks validated
  `valid: true` with the INFO "Archive would refuse this delta: …"; apply exited 0 and printed
  the note line after `tasks.md ok`.
- **H, twins** (SC-005): speckit brains made by `BASE` and `MV` gave byte-identical
  `AGENTS.md`, `CLAUDE.md`, `.multivac/flow.md` and `init`, `change new` and `change plan`
  output, and `doctor` and `change apply` output differing only in commit hashes. Under
  `sdd_auto: false` the door kept its four runs, `change new` printed no step and `change
  plan` refused nothing; a brain with no SDD printed no `sdd` line. `openspec update` in a
  `--tools none` brain printed "No configured tools found." and changed nothing.
- **I, this repository**: see the stage's commit — `multivac doors`, the full suite and
  `verify` at 0 blocking, with twelve dated notes by MV-147.

Specified in `specs/074-opsx-through-its-cli/` (speckit).
