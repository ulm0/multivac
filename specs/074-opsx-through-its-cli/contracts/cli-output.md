# Contract: what the commands print and run

Lines are printed exactly; tests pin the load-bearing substrings. `<slug>` is interpolated
everywhere but the door, `doctor` and flow.md, which print it literally. Examples use slug
`add-greeting` in a brain==code brain whose entry is keyed `brain`. A speckit brain, and a
brain with no SDD, print byte-for-byte what they printed before this change.

## The opsx runs and guides (registry data)

Each `run` is one source line, a double-quoted string. No `run` in any entry carries
`--yes`, `--skip-specs` or `--no-validate`.

| step | `run` |
| --- | --- |
| `new` | ``in the brain checkout run `openspec new change <slug> --json`, then write each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json`; a material ambiguity is the human's question`` |
| `plan` | ``keep writing each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json` until tasks.md is written`` |
| `apply` | ``where openspec/changes/<slug>/ is (the brain's change worktree once `change apply` carried it there), run `openspec instructions apply --change <slug> --json` before the first task and after the last; tick `- [x]` only what is fully built, until its `state` is `all_done`; scope beyond the spec is the human's question`` |
| `land` | ``after the merge, in the brain checkout (never a change worktree), run `openspec archive <slug> --json` to merge the deltas into openspec/specs/ and archive the change; `archive_confirmation_required` is the human's question, and a flag its `fix` names is never yours`` |

| step | `guide` |
| --- | --- |
| `new` | ``` `already exists` for a change you did not open in this run is the human's question; otherwise go on. A `root.source` of `implicit` means you ran outside the brain checkout: delete the openspec/ it made. Write the file each instruction's `resolvedOutputPath` names from its `instruction` and `template`; its `context` and `rules` bind you and are never copied in. Before the proposal, ask the human about any ambiguity that would change scope, observable behaviour, compatibility or acceptance, and about any conflict with a main spec; assume and record the rest. `unknown option '--json'`: openspec is older than the 1.5.0 this flow needs — upgrade it``` |
| `plan` | ``design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change <slug> --json` though status marks it `[-]`. Its `Next:` apply is not yours before `change apply` `` |
| `apply` | ``an unclear task, a design issue the work reveals, work beyond the spec and tasks, a task you would narrow, defer or drop to make it fit, and a blocker are each the human's question, never absorbed silently. Its "ready to be archived" is `change land`'s, after the merge`` |
| `land` | ``` `archive_confirmation_required` saying `Updating`: nothing was written; show the human the deltas from `openspec show <slug> --json --deltas-only`, which writes nothing either — yes: `openspec archive <slug> --json --yes`, then relay its `warnings`; archive without merging: `openspec archive <slug> --json --skip-specs`; anything else: stop. `archive_tasks_incomplete`: finish them where apply ran, or the human drops them from tasks.md; never tick to pass. Any other code: fix what it names and re-run with no flag, never `--no-validate`. `unknown option '--json'`: openspec is older than 1.5.0 — upgrade it``` |

Beside each guide, a registry comment cites its source by path and version, e.g.
"openspec 1.13.2's `.claude/commands/opsx/propose.md` step 1, Guardrails and :169" and
"openspec 1.13.2's `.claude/commands/opsx/apply.md` :110–115; `instructions apply --json`
at `all_done`". No file in the retired-phrase leg's scope spells the slash form.

Sizes (research.md R2): door step lines 1,220 B; lifecycle lines over four points 4,077 B.

## Lifecycle, at each point (automation on, no `--no-sdd`)

Each step line, then its guide under it (three spaces after the tag), then once per point
the unchanged run-the-chain line, last and unindented.

`change new add-greeting "Add greeting"` (after the scaffold and #3's cite line):
```
sdd opsx: in the brain checkout run `openspec new change add-greeting --json`, then write each artifact `openspec status --change add-greeting` marks `[ ]` from `openspec instructions <id> --change add-greeting --json`; a material ambiguity is the human's question [proof: openspec/changes/add-greeting/proposal.md — `change plan` refuses without it]
sdd opsx:   `already exists` for a change you did not open in this run is the human's question; otherwise go on. A `root.source` of `implicit` means you ran outside the brain checkout: delete the openspec/ it made. Write the file each instruction's `resolvedOutputPath` names from its `instruction` and `template`; its `context` and `rules` bind you and are never copied in. Before the proposal, ask the human about any ambiguity that would change scope, observable behaviour, compatibility or acceptance, and about any conflict with a main spec; assume and record the rest. `unknown option '--json'`: openspec is older than the 1.5.0 this flow needs — upgrade it
sdd opsx: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

`change plan add-greeting` (after `sdd opsx: brain: openspec/changes/add-greeting/proposal.md ok`):
```
sdd opsx: keep writing each artifact `openspec status --change add-greeting` marks `[ ]` from `openspec instructions <id> --change add-greeting --json` until tasks.md is written [proof: openspec/changes/add-greeting/tasks.md — `change apply` refuses without it]
sdd opsx:   design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change add-greeting --json` though status marks it `[-]`. Its `Next:` apply is not yours before `change apply`
sdd opsx: run the chain through without asking to continue — …
```

`change apply add-greeting` (after the tasks and validator lines):
```
sdd opsx: where openspec/changes/add-greeting/ is (the brain's change worktree once `change apply` carried it there), run `openspec instructions apply --change add-greeting --json` before the first task and after the last; tick `- [x]` only what is fully built, until its `state` is `all_done`; scope beyond the spec is the human's question [ungateable: apply leaves no artifact of its own — its only trace is `- [x]` in tasks.md, a character the agent types about its own work; nothing links a checkbox to a commit, a test, or a line of code]
sdd opsx:   an unclear task, a design issue the work reveals, work beyond the spec and tasks, a task you would narrow, defer or drop to make it fit, and a blocker are each the human's question, never absorbed silently. Its "ready to be archived" is `change land`'s, after the merge
sdd opsx: run the chain through without asking to continue — …
```

`change land add-greeting --landed brain`, once every stage has landed — exactly three
`sdd opsx:` lines, then the existing close line:
```
sdd opsx: after the merge, in the brain checkout (never a change worktree), run `openspec archive add-greeting --json` to merge the deltas into openspec/specs/ and archive the change; `archive_confirmation_required` is the human's question, and a flag its `fix` names is never yours [proof: openspec/changes/archive/<n>-<n>-<n>-add-greeting — `change close` refuses without it]
sdd opsx:   `archive_confirmation_required` saying `Updating`: nothing was written; show the human the deltas from `openspec show add-greeting --json --deltas-only`, which writes nothing either — yes: `openspec archive add-greeting --json --yes`, then relay its `warnings`; archive without merging: `openspec archive add-greeting --json --skip-specs`; anything else: stop. `archive_tasks_incomplete`: finish them where apply ran, or the human drops them from tasks.md; never tick to pass. Any other code: fix what it names and re-run with no flag, never `--no-validate`. `unknown option '--json'`: openspec is older than 1.5.0 — upgrade it
sdd opsx: run the chain through without asking to continue — …
all stages landed — run `multivac change close add-greeting`
```

`change close`: unchanged (`sdd opsx: close — this tool has no agent-run close step; nothing to run`).

## Refusals that re-print a step

The missing, empty and byte-identical refusals (src/adapters/sdd.ts:640, :658, :670) and the
worktree-only refusal print the run two spaces in and, when the step has one, its guide four
spaces in, before the re-run line:
```
sdd opsx: `change plan add-greeting` refused — openspec/changes/add-greeting/proposal.md is missing — looked in brain
  in the brain checkout run `openspec new change add-greeting --json`, then write each artifact … a material ambiguity is the human's question
    `already exists` for a change you did not open in this run is the human's question; otherwise go on. …
  then re-run: multivac change plan add-greeting
  (`--no-sdd` skips the SDD gates for one run; `sdd_auto: false` in .multivac/config.yml turns them off)
```
A step with no guide (every speckit step) prints exactly what it printed before.

A land step's proof found only in the change's worktree (`change close`):
```
sdd opsx: `change close add-greeting` refused — openspec/changes/archive/<n>-<n>-<n>-add-greeting is only in the change's worktree, .multivac/worktrees/add-greeting/brain/openspec/changes/archive/2026-09-28-add-greeting, which never reaches the brain checkout
  after the merge, in the brain checkout (never a change worktree), run `openspec archive add-greeting --json` …
    `archive_confirmation_required` saying `Updating`: …
  then re-run: multivac change close add-greeting
  (`--no-sdd` skips the SDD gates for one run; `sdd_auto: false` in .multivac/config.yml turns them off)
```
The worktree is named by the brain entry's key (`…/<slug>/core` for an entry keyed `core`).
No ledger line follows for that step: its task list is not read from the worktree.

The ledger refusal (MV-63), reason changed:
```
sdd opsx: `change close add-greeting` refused — brain:openspec/changes/archive/2026-09-28-add-greeting/tasks.md has 1 open item(s) — openspec archived this change with tasks still unchecked — `--yes` archives over its own refusal, and under `--json` says nothing
    - [ ] 1.2 Say farewell
  finish them in the tool, then re-run: multivac change close add-greeting
```

## The validator note (`change apply`)

After the artifact line, for each issue of a PASSING verdict whose message matches the
step's `validateNotes`; the gate still passes:
```
sdd opsx: brain: openspec/changes/add-greeting/tasks.md ok
sdd opsx: `openspec validate add-greeting --json --no-interactive` passes and notes: Archive would refuse this delta: billing MODIFIED failed for header "### Requirement: Yearly invoice" - not found — fix the delta before `change land`
```
Exit 0 with empty, whitespace or non-JSON stdout: no note, no other line.

## Close's merged main specs

A merge target that does not carry the merge (research.md R6), modified or untracked, is
named through the existing line and left out of the printed pathspec:
```
sdd opsx: openspec/specs/billing/spec.md is dirty and was not staged — it is not this change's to commit
```
A target that carries it is staged as #3 stages it; no line.

## Slug refusals

`change new` (exit 1, nothing written, whatever `sdd_auto` and `--no-sdd` say):
```
`Fix_Auth`: the brain's SDD takes no such slug — openspec 1.13.2's `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`; `multivac change new "<title>"` derives one
```
`roadmap add` (exit 2, nothing recorded):
```
roadmap add: `Fix_Auth`: the brain's SDD takes no such slug — openspec 1.13.2's `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`
```
A speckit brain, or one with no SDD, accepts `Fix_Auth` in both, as before.

## The scaffold

```
sdd opsx: openspec is missing in brain — running the tool's own init there: `openspec init --tools none --no-animation .`
sdd opsx: scaffolded — brain:openspec is there now; its steps are runnable
```
The same command, whatever `doors:` holds (none included), with no `has no verified
integration` warning. `doctor`'s missing and partial states and the lifecycle's partial
warning name `openspec init --tools none --no-animation .` wherever they named the
`--tools <keys>` command. spec-kit's lines are unchanged.

## Doors, `doctor`, flow.md

Brain door step lines (run alone, no guide):
```
  - `change new` → in the brain checkout run `openspec new change <slug> --json`, then write each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json`; a material ambiguity is the human's question [proof: openspec/changes/<slug>/proposal.md]
  - `change plan` → keep writing each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json` until tasks.md is written [proof: openspec/changes/<slug>/tasks.md]
  - `change apply` → where openspec/changes/<slug>/ is (the brain's change worktree once `change apply` carried it there), run `openspec instructions apply --change <slug> --json` before the first task and after the last; tick `- [x]` only what is fully built, until its `state` is `all_done`; scope beyond the spec is the human's question [ungateable]
  - `change land` → after the merge, in the brain checkout (never a change worktree), run `openspec archive <slug> --json` to merge the deltas into openspec/specs/ and archive the change; `archive_confirmation_required` is the human's question, and a flag its `fix` names is never yours [proof: openspec/changes/archive/<n>-<n>-<n>-<slug>]
```
Under `sdd_auto: false` the same four lines, nothing printed at the points, nothing gated.

`doctor`'s flow lines keep their form, `sdd        opsx flow — <at>: <run> [<proof>]`, with
the runs above and no guide.

flow.md, the ungateable row (the first backticked command whose first word is a required
binary):
```
- `openspec instructions apply --change <slug> --json` — apply leaves no artifact of its own — its only trace is `- [x]` in tasks.md, a character the agent types about its own work; nothing links a checkbox to a commit, a test, or a line of code
```
speckit's rows keep `/speckit.analyze`, `/speckit.implement`, `/speckit.converge`.

`doctor`, bodies an earlier init left in the brain, one line after the brain's install line,
never a failure; paths sorted, siblings sharing `openspec-` or `opsx-` collapsed; no law ID,
since the site shows the line:
```
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .agents/skills/.openspec-target .agents/skills/openspec-* .claude/commands/opsx .claude/skills/openspec-* .codex/skills/openspec-*` removes them; they are not code, so the commit needs no open change
```
Some untracked: `` — `git rm -r <tracked>` removes them, and <untracked> are untracked: delete them; they are not code, so the commit needs no open change ``.
All untracked: `` — <untracked> are untracked: delete them ``. None left: no line.

## The opsx note (the registry entry's `note`)

No command prints an adapter's `note` today, `doctor` included (no reader of the field in
`src/`); the tests read `sddSpec('opsx').note`, and the site's reference page carries the
same facts in its own words (spec US5 AS5 reads "when `doctor` prints the opsx note": see
tasks.md, Notes).

> The steps are openspec's own terminal verbs, run by the agent: `new change`, `status`,
> `instructions` and `archive`, each listed by `openspec --help` 1.13.2 and run there with
> stdin closed. The printed flow needs 1.5.0 or later (`archive --json`; `new change --json`
> and `resolvedOutputPath` ship in 1.4.0), the scaffold 1.7.0 (`--no-animation`). multivac
> itself runs only `openspec validate` and the scaffold, each with this entry's `env`.
> Network, measured with a fetch recorder and HOME isolated: 1.4.1 through 1.13.0 send one
> anonymous PostHog event to edge.openspec.dev from every command, `--json` included; 1.13.1
> and 1.13.2 send nothing until a run without `--json` and without an opt-out shows the
> first-run notice, which writes ~/.config/openspec/config.json and sends, and every command
> from then on sends — the printed text `openspec status` is the first printed call that can.
> The agent's calls — 15 per change as printed, plus the `openspec list`, `openspec show` and
> `openspec validate` openspec's own output names — carry none of `env`: the opt-outs that
> reach them are OPENSPEC_TELEMETRY=0 or DO_NOT_TRACK=1 in the agent's own environment,
> either alone (measured 1.4.1 through 1.13.2), or `openspec config set telemetry.enabled
> false` from 1.10.0. A text-mode call whose stderr is a terminal writes `completionTipSeen`
> to ~/.config/openspec/config.json whatever the opt-outs (1.10.0 on), which
> OPENSPEC_NO_COMPLETIONS=1 stops. `openspec init` or `openspec update` run over installed
> workflow files writes that file too, and `openspec update` also checks registry.npmjs.org;
> the scaffold runs only where openspec/config.yaml is missing, and there it wrote nothing to
> HOME. Archive names its directory `YYYY-MM-DD-<slug>`, so the gate matches the slug suffix.
> `--yes`, `--skip-specs` and `skip_specs: true` are the tool's own escape hatches, which the
> human chooses: the printed archive carries none, and multivac gates on what landed on disk,
> not on how it got there.

It matches none of MV-121's or MV-124's retired-phrase regexes.

## Subprocesses

Over one change `new` → `plan` → `apply` → `land` → `close`, multivac starts exactly two
openspec commands, each with `DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0` over the environment:
```
init --tools none --no-animation .
validate <slug> --json --no-interactive
```

## The site (site/content/docs/reference/graphers-and-sdd.md)

New sections: `### The question openspec asks at archive` (the JSON refusal, the `show`
preview, the three answers, the other codes), `### Command bodies an earlier init left` (the
`doctor` line and its `git rm -r`), `### Installing openspec's bodies by hand` (`openspec init
--tools <keys> --no-animation .` keeps `config.yaml` and adds only harness directories;
re-running it, or `openspec update`, over an install writes `~/.config/openspec/config.json`;
no printed step names those bodies). No site page names a law ID (Principle I).
