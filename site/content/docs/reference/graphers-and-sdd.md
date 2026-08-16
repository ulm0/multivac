---
title: Graphers and SDD
weight: 4
---

Two kinds of foreign tool, one contract. A **grapher** builds the map layer —
what exists, what calls what — which is the one layer a machine can derive
well. An **SDD** tool (spec-driven development) runs its own propose / apply /
archive workflow alongside multivac's change lifecycle.

multivac never installs either one. It reads what they leave on disk and, when
you ask, invokes what they put on `PATH`.

```yaml
sdd:     opsx
grapher: graphify
```

Like door targets, adapters are **data in a shipped registry**, not modules.
Your config selects them by name; adding one is a merge request to multivac.

## Artifact ≠ binary

This is the distinction the whole design turns on. Each adapter declares two
capabilities, and only the missing half turns off:

| capability | means | needs |
| --- | --- | --- |
| **read** | multivac can consume what the tool produced | the **artifact** on disk |
| **run** | multivac can invoke the tool | the **binary** on `PATH` |

| adapter | artifact | binary | refresh |
| --- | --- | --- | --- |
| `opsx` | `openspec/specs`, `openspec/changes` | `openspec` | `openspec update` |
| `speckit` | `.specify` | `specify` | `specify check` |
| `graphify` | `graphify-out/graph.json` | `graphify` | `graphify update .` |
| `codegraph` | `.codegraph` | `codegraph` | `codegraph sync` (build: `codegraph init`) |
| *any other grapher* | **unverified — you declare it** (see below) | | |

If you cloned a repo that already has the artifact committed, the read half
works with the tool not installed at all. The binary is only needed to
*invoke* — and that is the line multivac never crosses: it reads foreign
artifacts and invokes declared binaries, but it never installs foreign
software.

Declared repos are the exception, because they are the tool's own data:
`repos sync` clones them, on explicit request.

## The three-state policy

| state | behaviour |
| --- | --- |
| **not declared** | nothing. Not even a notice. `doctor` prints no line for it. |
| **declared, nothing present** | notice, feature off, **exit 0** |
| **declared, artifact or binary present** | adapter active |

Declaring means "this project uses it" — which stays true on a machine that
does not have it yet. `mvac init . --sdd speckit` writes the config whether or
not `specify` exists. **No absent adapter ever turns `verify` red.**

That is why not-declared and declared-but-absent are different states: the
first is "we do not use one", the second is "we use one, it is not here", and
only the second deserves a line telling you how to get it.

## Graphers

Declare one globally, or per repo:

```yaml
grapher: graphify
repos:
  api: ../acme-api
  legacy:
    path: ../legacy
    grapher: codegraph     # this repo uses a different tool
```

`doctor` reports one line per scope — the brain, plus every present repo:

```txt
grapher    graphify @ brain: artifact ok · binary ok · fresh
grapher    graphify @ api: artifact missing → run `graphify update .` there
```

Every degraded shape is a pointer with the exact command:

```txt
grapher    codegraph @ brain: artifact missing · binary missing → npm i -g @colbymchenry/codegraph, then `codegraph init`
grapher    codegraph @ brain: artifact ok · binary missing → npm i -g @colbymchenry/codegraph (graph cannot refresh)
grapher    graphify @ brain: artifact ok · binary ok · graph STALE (older than last commit) → run `graphify update .` there
```

Stale means the artifact's mtime is older than the repo's last commit — the
graph describes code that has since moved. It is a `doctor` warning and never
a `verify` failure.

### What the graph answers

Keeping an artifact fresh is the cheap half. The half that pays for it is the
agent asking the graph instead of grepping the tree — so the brain door names
the tool's **own query verbs**, and multivac never paraphrases them into a
generic "query the graph". They are not the same verb wearing two names:

| | `graphify` | `codegraph` |
| --- | --- | --- |
| shape | a **question** in words | a **symbol** by name |
| ask | `graphify query "<question>"` | `codegraph query <symbol>` |
| also | `explain "<node>"`, `path "<A>" "<B>"` | `--kind`, `--limit`, `--json` |

Hand `codegraph` a sentence and you get nothing useful; hand `graphify` a bare
identifier and you have thrown away what it is for. A door that said "query
the graph" would be wrong for one of them, and an agent cannot tell which.

This is what "multivac speaks a grapher" means, and why the table is short:
the verbs have to be run before they can be written down. `graphify query` is
in the table because it was run — it is **absent from `graphify --help`**, so
reading the help output alone would have dropped the most useful verb it has.

A declared grapher gets no query lines. multivac does not know your tool's
verbs and will not guess them; the refresh still runs, the door simply says
the graph is there without telling the agent how to ask it.

### There is no generic contract

multivac used to derive an unknown grapher's spec from its name —
`<name>-out/graph.json`, `<name> update .`, `npm i -g <name>`. It does not any
more, and the reason is a measurement: across ~47 surveyed graph tools that
shape matched **one**, the tool it had been written from. Every other viable
grapher overrides the artifact and the refresh, usually the binary too
(`depcruise` is not `dependency-cruiser`), and half of them have no `update`
verb at all because build and refresh are the same idempotent command. Even
graphify's derived install line was wrong: it ships from PyPI, not npm.

Deriving a contract from a name means printing an invented path as if it were
a fact — the one error this tool exists to prevent. So a name multivac has not
verified is **unverified**: `doctor` reports it, `doors` wires no hook for it,
`change close` runs nothing, and each of them prints the fields to declare.

You do not need a merge request to use your own tool. Declare its contract:

```yaml
grapher: mytool
graphers:
  mytool:
    artifact: .mytool/index.db        # repo-relative, file or directory
    refresh: mytool index             # the one command safe to re-run
    create: mytool init               # optional, if the build differs
    binary: mytool                    # optional, defaults to the first word of refresh
    install: pipx install mytool      # optional, printed when the binary is missing
```

`artifact` and `refresh` are required — half a contract is the same invented
path. A declaration also overrides a registry entry, for when you know your
install better than the table does.

Some good tools have no artifact path of their own — dependency-cruiser writes
wherever `--output-to` points, for instance. For those the path is **your**
choice, and it has to be one the command can actually write: `--output-to`
creates no directories, so a nested path fails with `ENOENT` in any repo that
never made it by hand. A chosen path the command cannot write is the invented
path again, one layer down.

Where build and refresh differ, `doctor` names the right one for the situation:

```txt
grapher    codegraph @ brain: artifact missing → run `codegraph init` there
```

### Automatic refresh

The graph is not a gate. Nothing lands wrong because it is stale — it is the
agent's map, so the refresh **follows the agent, not the commit**. The
automation contract `grapher-refresh` has exactly two paths, and git hooks are
not one of them:

| path | when | what it is |
| --- | --- | --- |
| **harness post-edit hook** | after every file edit in a session | the mechanism |
| **`change close`** | once, at the end of a change | the safety net |
| ~~git hooks~~ | never | the shims run `verify` only |

**The harness post-edit hook.** `doors` writes it into the hook config of each
declared target whose harness has such a hook — for Claude Code that is one
more entry in the same managed `.claude/settings.json` merge that carries
`verify`, matched on `Edit|Write|MultiEdit`:

```json
{ "matcher": "Edit|Write|MultiEdit",
  "hooks": [{ "type": "command",
              "command": "L=.multivac/cache/graph-refresh.lock; … mkdir \"$L\" 2>/dev/null || exit 0; { graphify update .; rmdir \"$L\"; } >/dev/null 2>&1 </dev/null & exit 0" }] }
```

Three properties, on purpose:

- **Non-blocking.** The refresh is backgrounded with its output discarded and
  the hook exits 0 immediately — it never adds latency to the edit loop, and a
  grapher that fails never surfaces as a failed edit.
- **Coalesced.** The lock directory under `.multivac/cache/` is created
  atomically; an edit that arrives while a refresh is running skips instead of
  thrashing a large repo. A lock left by a killed process is cleared after 30
  minutes.
- **Conditional.** Only with a grapher declared **and** its binary present.
  Absent → no entry is written (and an entry from a previous run is removed);
  `doctor` says what is missing.

For a harness with no post-edit hook, nothing is installed and the graph
refreshes at `change close` only. `doctor` names the live path:

```txt
grapher    refresh path: claude post-edit hook (installed when the binary is present) · `change close` is the net · git hooks never refresh
```

**`change close`, the net.** A change can land edits made outside the harness,
so close still **runs** the refresh — in the brain and in each declared+present
repo the change touched, using that scope's grapher (`repos.<key>.grapher`,
falling back to the global one) — and reports each scope's result:

```txt
graph graphify @ brain: refreshed (`graphify update .`) — artifact left uncommitted
graph graphify @ api: refreshed (`graphify update .`) — artifact left uncommitted
```

The git hook shims run `verify` only — there is no refresh on the git hook
path: an ergonomic convenience does not belong on a gate, and it would blow
the hook's sub-second budget. Between refreshes, a stale graph next to a
present binary is a `doctor` warning carrying the manual command.

An absent binary degrades to a notice with the install hint; a refresh that
exits non-zero is a warning that hands the command back — `close` never fails
because a foreign tool did:

```txt
graph graphify @ brain: binary not found — refresh skipped; npm i -g graphify, then `graphify update .` there
graph graphify @ api: refresh failed (…) — run `graphify update .` there by hand
```

multivac never stages or commits the refreshed artifact. Graph output is
regenerated locally; commit it only in dedicated chore commits, if your
project commits it at all.

No grapher is declared by default. A newborn brain is two content files, and a
graph of that is noise.

## SDD adapters

Two entries, selected by the registry key — which is multivac's name for the
adapter, not necessarily the tool's own binary name:

| key | tool | binary | install |
| --- | --- | --- | --- |
| `opsx` | OpenSpec | `openspec` | `npm i -g @fission-ai/openspec` |
| `speckit` | GitHub Spec Kit | `specify` | `uv tool install specify-cli` |

```txt
$ mvac doctor
sdd        opsx: artifact ok · binary ok · sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts
sdd        opsx flow — new: run /opsx:propose <slug> in your agent … [proof: openspec/changes/<slug>/proposal.md — `change plan` refuses without it]
sdd        opsx gates — change plan: refuses without openspec/changes/<slug>/proposal.md · change apply: refuses without openspec/changes/<slug>/tasks.md · change close: refuses without openspec/changes/archive/*-<slug>
sdd        opsx project law — this tool has no project-level document; nothing to create, nothing to keep fresh
```

```txt
sdd        nope: unknown adapter — known: opsx, speckit; fix sdd: in .multivac/config.yml
```

{{< callout >}}
For OpenSpec, the terminal CLI is `init` / `update` / `list` / `show` /
`validate`; `propose`, `apply` and `archive` are the `/opsx:` commands your
agent runs in chat. That is why multivac never shells the steps out: it prints
the instruction, the agent runs it, and the gate checks what it left behind.
{{< /callout >}}

### Each tool's own flow, not a fixed triple

An SDD's steps are **chat commands the agent runs**, not terminal subcommands —
invoking the binary with a step name would silently do nothing. And the tools
do not agree on what the steps *are*: OpenSpec has propose/apply/archive,
spec-kit has eight commands and no archive at all. So the shipped registry
carries, per tool, an **ordered flow of arbitrary length**, each step bound to
a lifecycle point rather than to a name, with the slug interpolated:

| tool | its flow, as multivac drives it |
| --- | --- |
| `opsx` | `new`: `/opsx:propose` · `plan`: finish the propose loop through `tasks.md` · `apply`: `/opsx:apply` · `land`: `/opsx:archive` |
| `speckit` | `new`: `/speckit.specify`, `/speckit.clarify` · `plan`: `/speckit.plan`, `/speckit.tasks` · `apply`: `/speckit.analyze`, `/speckit.implement`, `/speckit.converge` |

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
| `change plan` | the propose-equivalent exists | `openspec/changes/<slug>/proposal.md` | `specs/*<slug>*/spec.md` |
| `change apply` | the plan/tasks artifact exists | `openspec/changes/<slug>/tasks.md` | `specs/*<slug>*/plan.md`, `specs/*<slug>*/tasks.md` |
| `change close` | the archive-equivalent happened | `openspec/changes/archive/*-<slug>` | *no archive step exists — but see the ledger below* |

Beyond the artifact, `change close` also reads the task list each tool keeps —
the archived `tasks.md` for opsx, `specs/*<slug>*/tasks.md` for spec-kit — and
refuses while either still has open boxes. That is [the tool's own
ledger](#the-tools-own-ledger), and it is why spec-kit's close is checked at all
despite having no archive step to prove.

The refusal names the command, the path, and the repos it looked in, so the fix
is on the line above the error:

```txt
$ mvac change plan add-user-auth
sdd opsx: `change plan add-user-auth` refused — openspec/changes/add-user-auth/proposal.md is missing — looked in brain, api, web
  run /opsx:propose add-user-auth in your agent — it loops openspec's own artifact DAG (proposal → spec deltas → design → tasks)
  then re-run: multivac change plan add-user-auth
  (`--no-sdd` skips the SDD gates for one run; `sdd_auto: false` in .multivac/config.yml turns them off)
```

The gate searches the brain and every declared repo present on disk, because
the specs of a change often live in the code repo rather than the brain. Both
halves of that search are said out loud: the refusal lists the repos it looked
in, and the pass names the one it found the artifact in —

```txt
sdd opsx: api: openspec/changes/add-user-auth/proposal.md ok
```

— so in an ecosystem of six a bare relative path never leaves you guessing
which checkout satisfied the gate.

The `*` is a real segment matcher, not decoration: spec-kit numbers its own
feature directory (`specs/003-add-user-auth/`) and OpenSpec date-stamps its
archive (`archive/2026-08-15-add-user-auth`), so the exact path is the tool's
to choose.

**The tool's verdict is reused, never reimplemented.** OpenSpec ships
`openspec validate`, which knows what a well-formed change is — delta headers,
a scenario per requirement, no conflict with the main specs. multivac runs it
for its verdict and quotes it back:

```txt
sdd opsx: `change apply add-user-auth` refused — `openspec validate add-user-auth --json --no-interactive` says: Change must have at least one delta
  fix it in the tool, then re-run: multivac change apply add-user-auth
```

Shelling out happens for **validation only**. A step itself is never faked by
running something that looks like it.

**A gate that cannot be evaluated refuses.** When the validator's binary is not
found, the gate does not quietly fall back to "the file is there, good enough" —
that is the same command going green on a machine that can check nothing:

```txt
sdd opsx: `change apply add-user-auth` refused — `openspec` is not on PATH, so `openspec validate add-user-auth --json --no-interactive` cannot be run
  install it: npm i -g @fission-ai/openspec
  or skip the gates without losing the door: `--no-sdd` for one run, `sdd_auto: false` in .multivac/config.yml for good
```

It looks in `node_modules/.bin` beside the artifact as well as on `PATH`, so a
project-local `npm i -D` is found. And it never tells you to remove `sdd:` —
that key also renders the whole flow into the brain door, so dropping it would
delete the agent's instructions along with the check.

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
also follows spec-kit's documented override stack, so a project with its own
`plan-template.md` is checked against the file it actually copied.

What this does **not** catch is said rather than hidden: an agent that edits one
line and stops.

### The tool's own ledger

Every SDD tool ships a way to finish a step over its own objection.
`openspec archive --yes` prints `Warning: 4 incomplete task(s) found.
Continuing due to --yes flag.` and archives anyway — so the archived directory
proves the archive ran and nothing more. `close` reads the task list the tool
itself just moved:

```txt
sdd opsx: `change close add-user-auth` refused — brain:openspec/changes/archive/2026-08-16-add-user-auth/tasks.md has 3 open item(s) — openspec archived this change with tasks still unchecked
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
| `/opsx:apply` | its only trace is `- [x]` in `tasks.md`, a character the agent types about its own work |
| `/speckit.analyze` | STRICTLY READ-ONLY by its own spec — it writes zero bytes |
| `/speckit.implement` | "all tasks `[X]`" is the agent grading its own homework |
| `/speckit.converge` | a clean converge is forbidden to touch `tasks.md` — success is invisible on disk |

A lifecycle point with nothing to prove says so rather than passing quietly:

```txt
sdd speckit: `change close` is not gated — this tool declares no step whose artifact could prove it
```

### The project-level document

Spec-kit carries a constitution — `.specify/memory/constitution.md`, written
once and **amended** as the product moves. It ships as an unfilled template, so
an untouched repo has a placeholder and not a constitution. Both doors carry
the instruction to create it if absent — `init` writes it into the door it
scaffolds, `doors` into the brain door, because `doors` is a second command and
a constitution the agent only hears about on the second command is one nobody
writes — and `doctor` reports it:

```txt
sdd        speckit project law — .specify/memory/constitution.md missing → run /speckit.constitution in your agent to write the project principles …
sdd        speckit project law — revisit: once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver …
```

Scaffolded is not written. `specify init` installs `constitution.md`
byte-identical to its own template, so the file exists in every fresh repo and
its existence proves nothing. A document still carrying the template's
`[ALL_CAPS]` placeholders is reported as what it is:

```txt
sdd        speckit project law — .specify/memory/constitution.md is still the unfilled template shipped by the tool (placeholders remain) → run /speckit.constitution …
```

Staleness is the interesting half: when the law's newest row is newer than the
constitution, the product's law moved while its constitution did not.

```txt
sdd        speckit project law — .specify/memory/constitution.md present (last modified 2026-08-01) but the law's newest row is 2026-08-15 — STALE: the law moved while this did not; a report, never a gate
```

It stays a report. Whether a principle still fits the product is a judgement,
and no file mtime can make it. OpenSpec has no project-level document at all —
its `openspec/config.yaml` `context:` ships commented out and unvalidated — so
multivac says that rather than inventing one.

### `sdd_auto` and `--no-sdd`

Two ways to opt out, at two scopes. Both turn off the **steps and the gates**:

| | scope | effect |
| --- | --- | --- |
| `sdd_auto: false` in config | permanent | the adapter stays declared and reported; nothing is printed and nothing is gated |
| `--no-sdd` on a `change` invocation | this run | skips the printout and the refusal once |

```txt
sdd        opsx: artifact missing (looked for openspec/specs, openspec/changes) · binary ok · sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself
```

That is exploration mode. `doctor` keeps reporting the adapter either way —
turning automation off is not the same as undeclaring it; you still want to
know the artifact is there and the binary is current.

## Detection at init

`init` proposes adapters it finds, commented out, never enabled:

| found on disk | proposed |
| --- | --- |
| `openspec/` | `sdd: opsx` |
| `.specify/` | `sdd: speckit` |
| `graphify-out/` | `grapher: graphify` |
| `.codegraph/` | `grapher: codegraph` |

```yaml
# detected graphify artifacts — uncomment to enable:
# grapher: graphify
```

Detect, then ask. A directory existing is evidence, not consent.
