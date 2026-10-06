---
title: SDD tools
weight: 4
aliases: ["/docs/reference/graphers-and-sdd/"]
---

An **SDD** tool (spec-driven development) runs its own workflow — for
OpenSpec, creating a change, writing its artifacts, applying its tasks and
archiving it — alongside multivac's change lifecycle.

multivac never installs one. It reads what the tool leaves on disk and, when
you ask, invokes the binary it finds on `PATH` or in the repository's own
`node_modules/.bin`. Installing the tool stays yours; running the tool's own
`init` **in this repository**, once, is the lifecycle's — see
[the scaffold](#the-scaffold-declaring-a-tool-that-has-never-run-here).

```yaml
sdd: opsx
```

Like door targets, adapters are **data in a shipped registry**, not modules.
Your config selects one by name; adding one is a merge request to multivac.

multivac keeps no code graph: it declares, builds, refreshes and commits none,
and no door points an agent at one. A config an earlier release wrote that
still declares one loads, and `verify` and `doctor` say the key is ignored
(see [`configuration`](../configuration)).

## Artifact ≠ binary

This is the distinction the whole design turns on. Each adapter declares two
capabilities, and only the missing half turns off:

| capability | means | needs |
| --- | --- | --- |
| **read** | multivac can consume what the tool produced | the tool **installed** in that root: its own state file passes its check |
| **run** | multivac can invoke the tool | every **required binary**, found on `PATH` or in that root's `node_modules/.bin` |

| adapter | installed when | artifact | binary | refresh (recorded, never run) |
| --- | --- | --- | --- | --- |
| `opsx` | `openspec/config.yaml` or `openspec/config.yml` is a file | `openspec/specs`, `openspec/changes` | `openspec` | `openspec update` — refreshes only the command bodies a human installed; in a brain the scaffold made there are none, and it does nothing |
| `speckit` | `.specify/integration.json` parses, with `integration_state_schema` 1 and a non-empty `installed_integrations` | `.specify` | `specify` | `specify check` |

**Installed is what the vendor wrote, never a path being there.** One
probe answers for every surface — the scaffold, the carry onto a change's
branch, the project-document gate, `repos check` and `doctor` — from files
alone, spawning nothing. It gives one of four states:

| state | means |
| --- | --- |
| **installed** | a state file passes its check |
| **missing** | nothing of the tool is in that root |
| **partial** | the tool's directory, or a state file, is there and fails — the reason names the path and the check |
| **unevaluable** | a state file is there and cannot be read — the reason names the path and the error |

A `.specify/` made with `mkdir` is partial. The ceiling: a spec-kit install
that never wrote `integration.json` reads partial.

**One lookup finds a binary.** Every surface that runs an adapter's
command, or says whether it can — `init`, the scaffold, the validator and
`doctor` — asks the same question in the root the command runs in: each
`PATH` directory in order (on Windows, with each extension `PATHEXT` lists),
then that root's own `node_modules/.bin`, where a project-local `npm i -D`
puts a tool. A match is an executable file, a copy on `PATH` wins, and what
runs is what was found. The binary column above is each entry's `required`
list: all of them must be found. A binary missing from a root is named with
its adapter, the install line and the vendor's repository:

```txt
`specify` found on neither PATH nor brain's node_modules/.bin — install speckit: uv tool install specify-cli (https://github.com/github/spec-kit)
```

The Windows half is read from `PATHEXT`'s documented meaning and has never
been run there.

If you cloned a repo whose SDD files are already committed, the read half
works with the tool not installed at all. The binary is only needed to
*invoke* — and that is the line multivac never crosses: it reads foreign
artifacts and invokes declared binaries, but it never installs foreign
software.

Declared repos are the exception, because they are the tool's own data:
`repos sync` clones them, on explicit request.


## The three-state policy

| state | `verify`, `doctor`, `doors` | `init`, `repos sync`, `change` |
| --- | --- | --- |
| **not declared** | nothing, not even a notice | nothing |
| **declared, binary absent** | `doctor` names the binary, the install line and the vendor; `verify` and `doors` say nothing; **exit 0** | `init` and `change new` refuse with **exit 1**, naming the same, before writing anything, where the tool would run; `repos sync` does its clone, fetch and mount pass first, then exits **1**; `change plan`, `apply` and `close` (not `close --abandon`) print the scaffold's line, and the gate that follows decides on its own terms |
| **declared, installed** | adapter active | adapter active; nothing is re-run |

Declaring means "this project uses it", which stays true on a machine that does
not have it yet. The surfaces that only read (`verify`, `doctor`, `doors`) never
turn red over an absent tool. The commands that set a repo up run the tool, so
they say so where it cannot run: `init --sdd speckit` without `specify` and a
`change new` whose SDD is missing refuse before writing anything, and a
`repos sync` that would equip the brain exits 1 once its other work is done. An
SDD under `sdd_auto: false`, or a tool already installed, is not required.

That is why not-declared and declared-but-absent are different states: the
first is "we do not use one", the second is "we use one, it is not here", and
only the second deserves a line telling you how to get it — `doctor` prints it,
and so does a command that would run the tool.

## SDD adapters

Two entries, selected by the registry key — which is multivac's name for the
adapter, not necessarily the tool's own binary name:

| key | tool | binary | install |
| --- | --- | --- | --- |
| `opsx` | OpenSpec | `openspec` | `npm i -g @fission-ai/openspec` |
| `speckit` | GitHub Spec Kit | `specify` | `uv tool install specify-cli` |

```txt
$ mvac doctor
sdd        opsx @ brain: installed · binary ok · sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .claude/commands/opsx .claude/skills/openspec-*` removes them; they are not code, so the commit needs no open change
sdd        opsx governs the code of api — its steps run in the brain
sdd        opsx flow — new: in the brain checkout run `openspec new change <slug> --json`, then write each artifact … [proof: openspec/changes/<slug>/proposal.md — `change plan` refuses without it]
sdd        opsx gates — change plan: refuses without openspec/changes/<slug>/proposal.md · change apply: refuses without openspec/changes/<slug>/tasks.md · change close: refuses without openspec/changes/archive/<n>-<n>-<n>-<slug>
sdd        opsx project law @ brain: openspec/config.yaml `context:` written — reported, never gated
```

A name multivac does not know never reaches the `sdd` line: the config is
refused when it loads, and `doctor` says so on its `config` line, with exit 1:

```txt
config     invalid — sdd: nope — REFUSED: no SDD adapter is named nope (known: opsx, speckit). Fix: correct sdd: in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
```

{{< callout >}}
For OpenSpec, the steps are openspec's own terminal verbs — `new change`,
`status`, `instructions` and `archive` — which your agent runs; the terminal
commands multivac runs itself are `openspec validate` and the scaffold. That is
why multivac never shells the steps out: it prints the instruction, the agent
runs it, and the gate checks what it left behind.
{{< /callout >}}

### The SDD lives in the brain

With an SDD declared, it lives in the brain alone. It is installed there, its
steps print there, its gates read the brain and the change's worktrees — a step
printed at `change land` reads the brain checkout alone — and its project
document is the brain's. A code repo gets none of that: no vendor
install, no constitution, and no step block in its door — one line instead
(none under `sdd: none` or `sdd_auto: false`):

```txt
- The brain's `speckit` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there. Code here lands only on the branch of an open change declaring this repo; `verify --strict` refuses it anywhere else.
```

What the brain's SDD does reach is every declared repo's **code**: it lands only
on the branch of an open change (see
[Code lands in a change](../commands#code-lands-in-a-change)), unless the repo
says `sdd: none` — the one value a repo's own `sdd:` takes. A tool named there
is refused when the config loads; see [`sdd`](../configuration#sdd).

**Where the steps run.** The steps `change plan` prints run from the brain
checkout, before `change apply` carries the slug's directory onto the change's
branch. For a change that names a code repo, that checkout holds none of the
change's code, and `change plan` says so:

```txt
sdd speckit: its steps run from the brain checkout, which holds no code of this change — tasks name code paths under .multivac/worktrees/<slug>/<repo>/, and code is written only there
```

That line is an instruction, not a gate. A brain with no code of its own
declares no code, so code written into its checkout by mistake is not refused
there; `verify --strict` in the code repo refuses it, because the brain's SDD
governs that repo's code.
OpenSpec's apply step says where it runs itself: where
`openspec/changes/<slug>/` is, which is the brain's change worktree once
`change apply` carried it there. Its archive runs after the merge, in the brain
checkout.

**The feature pointer.** spec-kit keeps one pointer per checkout,
`.specify/feature.json`, naming the directory its plan and tasks scripts write
into. Two changes open in one brain share it, so planning one right after
specifying the other wrote into the other's directory — and that directory's
gate then passed. `change plan` and `change apply` point it at the slug's own
directory, and say so when it named another:

```txt
sdd speckit: .specify/feature.json named specs/002-beta; it names specs/001-probe-sdd now
```

Steps of two changes interleaved in one checkout can still cross: the pointer
makes the sequential case right, and the gate names the directory it read.

**A spec written in a code repo.** A proof is looked for in the brain and in the
change's worktree that the brain's own entry names — the brain checkout alone
for a step printed at `change land`. A spec an agent wrote into a
code repo by habit proves nothing, but a refusal that only said "missing" would
send it back to the same wrong checkout, so the refusal names it — and does not
read it:

```txt
sdd opsx: `change plan add-user-auth` refused — openspec/changes/add-user-auth/proposal.md is missing — looked in brain
sdd opsx:   api: openspec/changes/add-user-auth/proposal.md — not read; the SDD runs only in the brain
```

**What close lands, and the one line it writes.** `change close` — abandoning or
not — puts the brain's slug directories in the `git add` of the commit it
prints, whatever `sdd_auto` and `--no-sdd` say: those switches skip the steps
and their gates, never what was already written. A slug directory git reports
deleted is listed too, and so is each main spec that carries the merge:
OpenSpec's archive moves `openspec/changes/<slug>/` under `archive/` and merges
its `specs/<cap>/spec.md` into `openspec/specs/<cap>/spec.md`, and all of it
goes in that one commit. A main spec carries the merge when its `## Requirements`
section holds, whole and under the same name, every `### Requirement:` block
under the archived delta's ADDED and MODIFIED sections — line endings, trailing
whitespace and runs of blank lines normalised on both sides, tracked or
untracked alike, and both read the way openspec reads them: a block runs to the
next requirement or `## ` header, and a header inside a fenced code block is
none. Only `spec.md` is merged, so a file you keep beside a delta maps to
nothing under `openspec/specs/`. One that does not carry it — the archive was
made without merging, or the file is a draft of yours — is named dirty and left
out of that commit:

```txt
sdd opsx: openspec/specs/billing/spec.md is dirty and was not staged — it is not this change's to commit
```

A delta with no ADDED or MODIFIED block is listed as the archive left it. Only
the files the archive merged into: an unrelated edit beside them in
`openspec/specs/<cap>/` is named dirty and left for you to commit. Close then
appends one line to the change body, naming the first slug directory found in
the brain checkout, then in the change's worktree:

```txt
Specified in `specs/001-probe-sdd/` (speckit).
```

It writes nothing else in the body, and nothing at all when the body already
names the directory. `change new` says so before the first step, so the why, the
design and the tasks go into the SDD's files rather than into the body:

```txt
sdd speckit: the why, the design and the tasks go into its files — the change body keeps what it held while planned, or one sentence, and `change close` cites the directory; do not cite it yourself
```

**Leftover installs.** A code repo an earlier release equipped keeps the vendor's
files until someone removes them. While the brain declares an SDD, `doctor`
names each one in a repo multivac may write in, tracked or not, with its
removal; `repos check` appends it to that repo's line; neither fails over it.
With no SDD in the brain, a code repo's own install is that team's use of the
tool, and neither command mentions it. Every known SDD's install paths are not code in any repo, so the removal
commits on any branch:

```txt
sdd        leftover speckit install @ api: .specify/integration.json (tracked) — delete .specify/ there; `specify integration uninstall <key>` removes its skills and leaves .specify/
sdd        leftover opsx install @ web: openspec/config.yaml (untracked) — delete openspec/ and the openspec-* skills and opsx commands its init wrote under each harness directory
```

Until it is removed, a tracked leftover still captures the vendor's own root
lookup in that repo's worktrees.

### The scaffold: declaring a tool that has never run here

Declaring `sdd: speckit` in a brain where spec-kit has never run used to be a
deadlock. `change plan` refuses without `specs/<n>-<slug>/spec.md` — the slug
must follow one run of digits and a `-` exactly, so another change's directory
that merely contains the slug is not proof of this one's step; that file comes from `/speckit.specify`; that chat command
does not exist until `specify init` has run — and `specify init` was what the
blocked change was going to do. The only exits were `--no-sdd` and
`sdd_auto: false`, both of which turn the gate off to fix the reason it fired.

So an adapter also declares its **scaffold**: the vendor's own init command,
verbatim. Whether it has already run in a repo is the tool's own state file,
read by the probe above, never a directory being there.

| key | installed when | the tool's own init |
| --- | --- | --- |
| `speckit` | `.specify/integration.json` passes its check | `specify init --here --integration <key> --force --ignore-agent-tools`, then `specify integration install <key>` for each further door's integration that is safe beside the first |
| `opsx` | `openspec/config.yaml` or `openspec/config.yml` | `openspec init --tools none --no-animation .` |

For spec-kit, the integration follows your `doors:`, from a map measured by
running each vendor's own tool. For OpenSpec the map records what `openspec
init --tools <key>` writes; multivac runs `--tools none`, which writes
`openspec/config.yaml` and two `.gitkeep`s and nothing outside `openspec/`,
whatever the doors, because its steps are terminal verbs every harness runs
alike and need no command body:

| door | spec-kit | openspec |
| --- | --- | --- |
| `agents` | — | `agents` |
| `claude` | `claude` | `claude` |
| `cursor` | `cursor-agent` | `cursor` |
| `codex` | `codex` | `codex` |
| `gemini` | `gemini` | `gemini` |
| `opencode` | `opencode` (not safe beside another) | `opencode` |
| `copilot` | `copilot` (not safe beside another) | `github-copilot` |
| `windsurf` | — | `windsurf` |

spec-kit marks some integrations unsafe to install beside another. multivac
installs the integration of the first door that has one, then each further one
only when both it and the first are safe, and names the rest; it never passes
`--force` to put them together. A door with no spec-kit integration is skipped
and named too, except `agents`. With no door that has one, spec-kit gets
`claude`: its `generic` integration
needs a commands directory no harness here is known to read. A door you add after spec-kit is
installed is not added to it; run the vendor's own install for it. OpenSpec has
no gap and no later install: a door added later needs nothing from it.

`init`, `change new`, `change plan`, `change apply` and `change close` run it **in
the brain** when the tool is missing there, print it first, and skip it where it
is installed; `change close --abandon` never runs it. `repos sync` does the same for the brain after it clones and
fetches, and never installs the SDD in a code repo:

```txt
sdd speckit: .specify is missing in brain — running the tool's own init there: `specify init --here --integration claude --force --ignore-agent-tools`, then multivac writes its skeleton templates to .specify/templates/overrides
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable; skeleton: .specify/templates/overrides/{spec,plan,tasks}-template.md
```

A brain where the tool is **partial** or **unevaluable** — a `.specify/` made by
hand, an init that stopped half way, a state file that cannot be read — is
warned and never re-initialised, because a re-run can revert files someone
edited:

```txt
sdd speckit: brain is partial — .specify is there and .specify/integration.json is not — the init is not run over it, since a re-run can revert edited files; run `specify init --here --integration claude --force --ignore-agent-tools` in brain yourself
```

`--ignore-agent-tools` is there because spec-kit checks for the integration's
own CLI before it writes anything: measured without the flag and without
`claude` installed, the init exits 1 and writes nothing; with it, the init exits
0.

Installed is the brain's own question, answered by its own state file: a code
repo somebody initialized by hand answers nothing for it, and is reported as a
leftover rather than counted.

`verify`, `doctor` and `doors` **never** run it: the init writes the vendor's
files into the tree, and running it again can revert skills and templates
someone edited — not something a check, a report or a door may do. `doctor`
reports the state and names the command instead:

```txt
sdd        speckit @ brain: missing (no .specify) — declared but never run here; `change new` runs the tool's own `specify init --here --integration claude --force --ignore-agent-tools`, doctor never does (it writes the vendor's files into the tree); that run then writes multivac's skeleton templates to .specify/templates/overrides if it is absent · binary ok · sdd_auto on …
sdd        speckit governs the code of api — its steps run in the brain; exempt (sdd: none): landing
```

Six outcomes, all of them said out loud:

| state | what happens |
| --- | --- |
| installed **in the brain** | nothing runs, nothing is printed |
| partial or unevaluable | nothing runs; a warning names the reason and the init to run by hand |
| missing, no init recorded for that tool | the gap is stated with the install line; **nothing is executed** |
| missing, a required binary not found | one line naming the binary, the install line and the vendor — the lookup reads the brain's own `node_modules/.bin` |
| ran, now installed | `scaffolded`, and the skeleton written or the reason it was not |
| ran, still not installed | the tool's cause, quoted, the command handed back — `left .specify partial (<reason>)` when it wrote half — and the gate that follows still refuses on its own terms |

The last row is the honest one: an exit code is the tool's claim, its state
file is the fact, and the probe reads the file.

`--no-sdd` and `sdd_auto: false` turn the scaffold off with everything else;
there is no separate switch.

**Skeleton templates.** spec-kit's specify, plan and tasks steps each start from
a template, and its core templates are long: the three steps read about 18 KB of
guidance per change that the agent then deletes. Every template resolver
spec-kit ships reads `.specify/templates/overrides/<name>.md` before its core
template, and its init never creates that directory. So the run that turns the
brain from missing to installed also writes three short skeletons there —
`spec-template.md`, `plan-template.md` and `tasks-template.md` — each keeping
the core template's section headings and none of its per-integration command
tokens, and the steps read about 4 KB instead. It writes them only when the
directory is absent, only when the version spec-kit recorded is at or above the
lowest one measured to resolve all three through it, each only where the
installed core template still carries every heading the skeleton keeps, never
over a file, and never again. A brain installed before this, or one whose
`overrides/` a human made, gets none; a later vendor init leaves them as they
are. When one is skipped, the `scaffolded` line says why:

```txt
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable; skeleton skipped: .specify/templates/overrides exists
```

An override outranks every spec-kit preset, so a preset installed later is
shadowed for the templates the skeleton covers. `doctor` names each enabled
preset that is, with the override to delete to let the preset win:

```txt
sdd        preset <id> is outranked for plan-template.md by .specify/templates/overrides/plan-template.md — delete that override to let the preset win
```

{{< callout >}}
A scaffold is **not a step**. It is the tool's own terminal command, run once
in the brain; the steps stay what your agent runs, and nothing about the
scaffold satisfies one. `specify init` writes `.specify/memory/constitution.md`
as the *unfilled template* — writing the constitution is still
`/speckit.constitution`'s job, and multivac's own check reports a file identical
to the template as still the unfilled template.
{{< /callout >}}

### Each tool's own flow, not a fixed triple

An SDD's steps are **commands the agent runs**, never subcommands multivac
spawns: chat commands for spec-kit, openspec's own terminal verbs for OpenSpec.
A step name is not a verb — `openspec propose` exits 1 with `unknown command`.
And the tools do not agree on what the steps *are*: OpenSpec creates a change,
writes its artifacts, applies its tasks and archives it; spec-kit has ten
commands and no archive among them. So the shipped registry
carries, per tool, an **ordered flow of arbitrary length**, each step bound to
a lifecycle point rather than to a name, with the slug interpolated:

| tool | its flow, as multivac drives it |
| --- | --- |
| `opsx` | `new`: `openspec new change <slug> --json`, then the `openspec status` / `openspec instructions` loop · `plan`: the same loop through `tasks.md` · `apply`: `openspec instructions apply --change <slug> --json` · `land`: `openspec archive <slug> --json` |
| `speckit` | `new`: `/speckit.specify`, `/speckit.clarify` · `plan`: `/speckit.plan`, `/speckit.tasks` · `apply`: `/speckit.analyze`, `/speckit.implement`, `/speckit.converge` |

Each lifecycle point prints its own steps, each with what proves it ran, and
then, once, the instruction to run them through — so `change new` for spec-kit
ends:

```txt
sdd speckit: run /speckit.specify in your agent to write the spec for add-user-auth — give it add-user-auth as the short name so the feature directory matches [proof: specs/<n>-add-user-auth/spec.md — `change plan` refuses without it]
sdd speckit: run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers [ungateable: optional, and its `## Clarifications` session is written by the agent — …]
sdd speckit: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

The brain door lists the same flow with each step ending in its proof path or
`[ungateable]`: the reason a step cannot be proved is printed where the step is
run, by the lifecycle, and by `doctor` and flow.md.

An OpenSpec step's line also names the human's question on it, on every
surface, so the door alone still says where to stop. What else openspec's own
command bodies told the agent rides in a **guide**, printed under the step at its
lifecycle point and in any refusal that re-prints it, and never in the door,
`doctor` or flow.md, which every session reads. `change plan` for OpenSpec ends:

```txt
sdd opsx: keep writing each artifact `openspec status --change add-user-auth` marks `[ ]` from `openspec instructions <id> --change add-user-auth --json` until tasks.md is written [proof: openspec/changes/add-user-auth/tasks.md — `change apply` refuses without it]
sdd opsx:   design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change add-user-auth --json` though status marks it `[-]`. Its `Next:` apply is not yours before `change apply`
sdd opsx: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

No printed OpenSpec step carries `--yes`, `--skip-specs` or `--no-validate`:
those answer the tool's own questions, and the answer is yours.

Spec-kit has **no archive step**; the lifecycle says so instead of inventing
one:

```txt
sdd speckit: close — this tool has no agent-run close step; nothing to run
```

### The gate: what the tool really produces

Every step names the artifact that **proves** it ran, and the next lifecycle
command refuses without it:

| refuses | until | opsx | speckit |
| --- | --- | --- | --- |
| `change plan` | the propose-equivalent exists | `openspec/changes/<slug>/proposal.md` | `specs/<n>-<slug>/spec.md` |
| `change apply` | the plan/tasks artifact exists | `openspec/changes/<slug>/tasks.md` | `specs/<n>-<slug>/plan.md`, `specs/<n>-<slug>/tasks.md` |
| `change close` | the archive-equivalent happened | `openspec/changes/archive/<n>-<n>-<n>-<slug>` | *no archive step exists — but see the ledger below* |

Beyond the artifact, `change close` also reads the task list each tool keeps —
the archived `tasks.md` for opsx, `specs/<n>-<slug>/tasks.md` for spec-kit — and
refuses while either still has open boxes. That is [the tool's own
ledger](#the-tools-own-ledger), and it is why spec-kit's close is checked at all
despite having no archive step to prove.

The refusal names the command, the path, and where it looked, and the lines
under it carry the fix:

```txt
$ mvac change plan add-user-auth
sdd opsx: `change plan add-user-auth` refused — openspec/changes/add-user-auth/proposal.md is missing — looked in brain
  in the brain checkout run `openspec new change add-user-auth --json`, then write each artifact `openspec status --change add-user-auth` marks `[ ]` from `openspec instructions <id> --change add-user-auth --json`; a material ambiguity is the human's question
    `already exists` for a change you did not open in this run is the human's question; otherwise go on. …
  then re-run: multivac change plan add-user-auth
  (`--no-sdd` skips the SDD gates for one run; `sdd_auto: false` in .multivac/config.yml turns them off)
```

The gate searches the brain checkout, then the change's worktree named after the
brain's own entry — where `change apply` carries the artifacts of a change that
names the brain. A step printed at `change land` runs after every stage has
merged, so its proof is read in the brain checkout alone: an archive found only
in the change's worktree never reached the brain, and is refused by name —

```txt
sdd opsx: `change close add-user-auth` refused — openspec/changes/archive/<n>-<n>-<n>-add-user-auth is only in the change's worktree, .multivac/worktrees/add-user-auth/brain/openspec/changes/archive/2026-08-16-add-user-auth, which never reaches the brain checkout
  after the merge, in the brain checkout (never a change worktree), run `openspec archive add-user-auth --json` …
    `archive_confirmation_required` saying `Updating`: …
  then re-run: multivac change close add-user-auth
```

— and no task list is read from it.

The SDD lives in the brain alone, so no code repo's checkout proves a step (one
that holds a match is named, never read — see
[The SDD lives in the brain](#the-sdd-lives-in-the-brain)). Both halves of that
search are said out loud: the refusal says where it looked, and the pass names
the artifact it accepted —

```txt
sdd opsx: brain: openspec/changes/add-user-auth/proposal.md ok
```

— the same line whether the checkout or the change's worktree held the file;
only a task ledger's line names the worktree path it was read from.

`<n>` in a path stands for one run of digits and nothing else: spec-kit numbers
its own feature directory (`specs/003-add-user-auth/`) and OpenSpec date-stamps
its archive (`archive/2026-08-15-add-user-auth`), so the exact name is the
tool's to choose and its shape is not. A directory a wildcard would accept
proves nothing: `specs/030-points-add-user-auth/` is not `add-user-auth`'s.

**The tool's verdict is reused, never reimplemented.** OpenSpec ships
`openspec validate`, which knows what a well-formed change is — delta headers,
a scenario per requirement, no conflict with the main specs. multivac runs it
for its verdict and quotes it back:

```txt
sdd opsx: `change apply add-user-auth` refused — `openspec validate add-user-auth --json --no-interactive` says: Change must have at least one delta
  fix it in the tool, then re-run: multivac change apply add-user-auth
```

A passing verdict can still carry news. When a modified requirement's header is
missing from the main spec, `openspec validate` passes and says in an INFO issue
that the archive would refuse the delta — which you would otherwise learn only
after answering yes at archive. The gate prints it and still passes, since the
tool itself calls the change valid:

```txt
sdd opsx: brain: openspec/changes/add-user-auth/tasks.md ok
sdd opsx: `openspec validate add-user-auth --json --no-interactive` passes and notes: Archive would refuse this delta: billing MODIFIED failed for header "### Requirement: Yearly invoice" - not found — fix the delta before `change land`
```

Shelling out happens for **validation** and the scaffold only. A step itself is
never faked by running something that looks like it.

**A gate that cannot be evaluated refuses.** When the validator's binary is not
found, the gate does not quietly fall back to "the file is there, good enough" —
that is the same command going green on a machine that can check nothing:

```txt
sdd opsx: `change apply add-user-auth` refused — `openspec validate add-user-auth --json --no-interactive` cannot be run — `openspec` found on neither PATH nor brain's node_modules/.bin — install opsx: npm i -g @fission-ai/openspec (https://github.com/Fission-AI/OpenSpec)
  or skip the gates without losing the door: `--no-sdd` for one run, `sdd_auto: false` in .multivac/config.yml for good
```

It asks the one lookup in the root that holds the artifact — `PATH`, then that
root's `node_modules/.bin` — so a project-local `npm i -D` is found when the
artifact is in the checkout. Found only in the change's worktree (a re-run of
`change apply` after the carry), that worktree is the root: a tool installed
only in the checkout is not found there, though `doctor` finds it, and the
refusal still names the brain's `node_modules/.bin`.

It never tells you to remove `sdd:` — that key also renders the whole flow into
the brain door, so dropping it would delete the agent's instructions along with
the check.

### Existence is the weakest proof

A file being there does not mean anyone wrote it. Two ways a present artifact
proves nothing, both refused exactly as a missing one is.

**Empty.** No declaration needed — a step's artifact is never legitimately
empty, whatever the tool. spec-kit's `setup-plan.sh` falls back to `rm -f` then
`touch` when it cannot resolve a template, which used to sail through.

**Byte-identical to the template it was copied from.** `setup-plan.sh` runs
`resolve_template_content "plan-template" > "$IMPL_PLAN"` as part of *starting*
the step, so `plan.md` exists in full before the agent writes a word:

```txt
sdd speckit: `change apply add-user-auth` refused — brain:specs/003-add-user-auth/plan.md is byte-identical to .specify/templates/plan-template.md: the scaffolding wrote it, nobody has
```

Whole files are compared, never a guessed placeholder, and the reason is worth
stating because the obvious approach is wrong. The tempting pin is the
template's own `# Implementation Plan: [FEATURE]` heading — but nothing in
spec-kit ever asks anyone to change that line, so a finished, real plan keeps
it and a regex on it would refuse honest work forever. Equality has no false
positives at all: a written plan is never byte-identical to its template. It
is compared with the core template and with
`.specify/templates/overrides/plan-template.md`, the skeleton multivac writes
there included:

```txt
sdd speckit: `change apply add-user-auth` refused — brain:specs/003-add-user-auth/plan.md is byte-identical to .specify/templates/overrides/plan-template.md: the scaffolding wrote it, nobody has
```

What this does **not** catch is said rather than hidden: an agent that edits one
line and stops, and a plan left as a preset's own `plan-template.md`, which is
never compared.

### The tool's own ledger

Every SDD tool ships a way to finish a step over its own objection. In text
mode `openspec archive --yes` prints `Warning: 4 incomplete task(s) found.
Continuing due to --yes flag.` and archives anyway; `openspec archive <slug>
--json --yes` archives over open tasks and says nothing at all. The printed
archive carries no `--yes`, so openspec refuses open tasks itself first, with
`archive_tasks_incomplete` — but a `--yes` you give still archives them open,
so the archived directory proves the archive ran and nothing more. `close`
reads the task list the tool itself just moved:

```txt
sdd opsx: `change close add-user-auth` refused — brain:openspec/changes/archive/2026-08-16-add-user-auth/tasks.md has 3 open item(s) — openspec archived this change with tasks still unchecked — `--yes` archives over its own refusal, and under `--json` says nothing
    - [ ] 1.2 Backfill existing rows
    - [ ] 1.3 Wire the nightly job
    - [ ] 1.4 Tell the customer
  finish them in the tool, then re-run: multivac change close add-user-auth
```

This is not reimplementing the tool's rules. The tool wrote the file and
already decided what the marker means; multivac only declines to ignore it.

The ledger check carries its **own** lifecycle point, separate from the step's,
and that is the whole design. spec-kit's implement stays ungateable — whether
it *ran* leaves no trace and never will — while whether its task list still has
open boxes is a fact on disk. Two different questions about one step, with
different honest answers.

It still does not prove the work happened. `- [x]` is a character an agent types
about its own work. It proves the tool's own book does not say UNDONE, which is
strictly more than the artifact proved before.

### Ungateable steps are stated, never faked

Some steps leave nothing behind, by their own design. Those are declared
ungateable with the reason and are simply not gated — you still run them:

| step | why nothing can prove it |
| --- | --- |
| `openspec instructions apply --change <slug> --json` | its only trace is `- [x]` in `tasks.md`, a character the agent types about its own work |
| `/speckit.clarify` | optional, and its `## Clarifications` session is the agent's own text — it never shows that a human answered |
| `/speckit.analyze` | STRICTLY READ-ONLY by its own spec — it writes zero bytes |
| `/speckit.implement` | "all tasks `[X]`" is the agent grading its own homework |
| `/speckit.converge` | a clean converge is forbidden to touch `tasks.md` — success is invisible on disk |

### The question openspec asks at archive

The land step prints `openspec archive <slug> --json` with no flag. On a change
that carries spec deltas, openspec does not archive: it exits 1, writes nothing,
and asks —

```json
{ "archive": null, "status": [ { "severity": "error", "code": "archive_confirmation_required",
  "message": "Updating 2 spec(s) requires confirmation: rerun with --yes.",
  "fix": "openspec archive <change-name> --json --yes" } ] }
```

That question is **yours**, never the agent's, and the step's line says so on
every surface: a flag its `fix` names is never the agent's to add. The guide
under the step at `change land` tells the agent what to do with it:

- **Show you the deltas first.** `openspec show <slug> --json --deltas-only`
  prints what would be merged into `openspec/specs/`, and writes nothing either.
- **Offer the tool's own three answers.** Yes: `openspec archive <slug> --json
  --yes`, then relay its `warnings`. Archive without merging: `openspec archive
  <slug> --json --skip-specs` — what openspec's own interactive prompt does on
  `n`. Anything else: stop.
- **Other codes are not that question.** `archive_tasks_incomplete` is
  resolved by finishing the tasks where apply ran, or by you dropping them from
  `tasks.md` — never by ticking boxes to pass. Any other code is fixed and the
  archive re-run with no flag, never `--no-validate`. `unknown option '--json'`
  means openspec is older than this flow needs.

A change with no spec delta archives at once, so it asks nothing. Whether the
agent asked, rather than adding the flag itself, leaves nothing on disk; what
lands is your answer, and close still reads [the tool's own
ledger](#the-tools-own-ledger).

The same step's `--skip-specs` answer leaves the main specs as they were, so
`change close` lists none of them in its commit: a main spec is listed only when
it carries the merge (see [What close lands](#the-sdd-lives-in-the-brain)).

### Command bodies an earlier init left

An OpenSpec brain scaffolded before the steps became openspec's terminal verbs
got a command body per workflow, per harness: `.claude/commands/opsx/`, the
`openspec-*` skills under `.claude/skills/`, `.agents/skills/` and the other
harness directories. No printed step names them now, and a session still reads
their listing. `doctor` names what is left in the brain, one line after the
brain's install line, and never fails over it:

```txt
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .agents/skills/.openspec-target .agents/skills/openspec-* .claude/commands/opsx .claude/skills/openspec-*` removes them; they are not code, so the commit needs no open change
```

Sibling entries sharing `openspec-` or `opsx-` are collapsed into one pattern,
which your shell expands before `git rm -r` sees it — so a pattern is printed
only when every entry it reaches on disk is tracked, or every one is untracked,
and the entries are listed one by one otherwise. Entries git does not track are
named apart, to delete by hand, since `git rm -r` fails on a path it does not
track:

```txt
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .claude/commands/opsx` removes them, and .codex/skills/openspec-explore are untracked: delete them; they are not code, so the commit needs no open change
```

Every entry an OpenSpec init writes under any harness directory, and under
`.codex/`, is **not code**, whichever doors the brain declares today — so the
removal commits on any branch, with no change open. The match is by the names
openspec's inits give (`openspec-*`, `.openspec-*`, `opsx`, `opsx-*`), so an
entry of your own under such a name is named with them.

### Installing openspec's bodies by hand

If you want openspec's own command bodies — its explore, sync or update
workflows, which the lifecycle never prints — install them yourself:

```bash
openspec init --tools claude --no-animation .
```

Run over a brain the scaffold made, it keeps `openspec/config.yaml` and adds
only the harness directories of the keys you name; the keys are those in the
integration table above. Re-running it, or `openspec update`, over installed
bodies writes `~/.config/openspec/config.json` in your home directory, and
`openspec update` also checks the npm registry. No printed step names those
bodies, and `doctor` names them as an earlier init's leftovers.

### The project-level document

Spec-kit carries a constitution — `.specify/memory/constitution.md`, written
once and **amended** as the product moves. It is the brain's: the ecosystem has
one, and no code repo is asked for its own. It ships as an unfilled template, so
an untouched brain has a placeholder and not a constitution. Both brain doors
carry the instruction to create it if absent — `init` writes it into the door it
scaffolds, `doors` into the brain door, because `doors` is a second command and
a constitution the agent only hears about on the second command is one nobody
writes — and `doctor` reports it:

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md missing → run /speckit.constitution in your agent to write the project principles …
sdd        speckit project law — revisit: once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver (MAJOR removes/redefines, MINOR adds, PATCH clarifies); commit no Sync Impact Report. …
```

The revisit says to commit no amendment report. `/speckit.constitution` writes
one for review, and spec-kit's own command calls it scratch to remove before the
amended constitution is committed; git and the change that amended the document
keep the record. A report committed into the constitution is read by every step
that reads the constitution, on every change after.

Scaffolded is not written. `specify init` installs `constitution.md`
byte-identical to its own template, so the file exists in every fresh repo and
its existence proves nothing. A document is still the template when it is
byte-identical to the one spec-kit recorded in
`.specify/memory/.constitution-template.json`, or when it still carries one of
the template's own tokens, such as `[PROJECT_NAME]`. The line says which decided
— here the untouched scaffold; an edited file that keeps a token says
`placeholders remain: [PROJECT_NAME]` in its place:

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md is still the unfilled template shipped by the tool (byte-identical to the template recorded in .specify/memory/.constitution-template.json) → run /speckit.constitution …
```

A written constitution may keep the template's HTML comments, and may cite
`[1]` or `[API]`: only the template's own tokens, outside comments, count.

Those states are also a **gate**. `change plan` refuses while the document is
missing, unreadable, empty, or still the template. The tokens are the ones
`/speckit.constitution` explicitly asks the author to replace, so a written
constitution has none:

```txt
sdd speckit: `change plan <slug>` refused — brain:.specify/memory/constitution.md is missing or unreadable
  run /speckit.constitution in your agent to write the project principles …
  then re-run: multivac change plan <slug>
```

Only `plan`, and only that: the document is what `/speckit.plan`'s own
Constitution Check reads, so it is the first point at which its absence changes
the work. Nothing about the document's content is judged — three real lines
pass, and so does a constitution nobody agrees with.

Staleness is the interesting half: when the law's newest row is newer than the
constitution, the product's law moved while its constitution did not.

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md present (last modified 2026-08-01) but the law's newest row is 2026-08-15 — STALE: the law moved while this did not; a report, never a gate
```

It stays a report. Whether a principle still fits the product is a judgement,
and no file mtime can make it.

`change new` asks for the document before `change plan` refuses over it. When
the tool is installed in the brain and the document is not written, it prints
one line. That line does not tell the agent to continue unattended: the
principles come from you.

```txt
sdd speckit @ brain: .specify/memory/constitution.md is template (byte-identical to the template recorded in .specify/memory/.constitution-template.json) — run /speckit.constitution in your agent … Ask the human for the principles and write their answers; `change plan` refuses until it is written
```

Where a project document and an active row of `.multivac/invariants.md`
disagree, the row wins. Amend the document, or change the row through a change.
The brain door says so.

OpenSpec's nearest equivalent is `context:` in `openspec/config.yaml`.
`openspec init` writes it commented out, openspec calls it optional, and it
ignores one over 51200 bytes. multivac reports it and never gates on it.

### `sdd_auto` and `--no-sdd`

Two ways to opt out, at two scopes. Both turn off the **steps and the gates**:

| | scope | effect |
| --- | --- | --- |
| `sdd_auto: false` in config | permanent | the adapter stays declared and reported; nothing is printed and nothing is gated |
| `--no-sdd` on a `change` invocation | this run | skips the printout and the refusal once |

Neither stops `change close` from listing the brain's slug directories in the
commit it prints and citing one in the change body: the switches skip the steps
and their gates, never what was already written. With `sdd_auto: false`, the
brain door, flow.md and `doctor` also stop saying anything refuses; flow.md and
`doctor` say no command runs the init, and `doctor` names no code the SDD
governs, since the code gate is off too.

```txt
sdd        opsx @ brain: missing (no openspec) — declared but never run here; under `sdd_auto: false` no command runs the tool's own `openspec init --tools none --no-animation .`: run it there yourself, doctor never does (it writes the vendor's files into the tree) · binary ok · sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself
```

That is exploration mode. `doctor` keeps reporting the adapter either way —
turning automation off is not the same as undeclaring it; you still want to
know the tool is installed and the binary is current.

## Detection at init

When it writes the config and `--sdd` names none, `init` proposes the adapter it
finds, commented out, never enabled — `openspec/` first, so a repo holding both
gets `opsx` alone; a config already there is left as it is:

| found on disk | proposed |
| --- | --- |
| `openspec/` | `sdd: opsx` |
| `.specify/` | `sdd: speckit` |

```yaml
# detected speckit artifacts — uncomment to enable:
# sdd: speckit
```

Detect, then ask. A directory existing is evidence, not consent.
