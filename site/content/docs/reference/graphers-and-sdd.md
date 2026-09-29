---
title: Graphers and SDD
weight: 4
---

Two kinds of foreign tool, one contract. A **grapher** builds the map layer —
what exists, what calls what — which is the one layer a machine can derive
well. An **SDD** tool (spec-driven development) runs its own workflow — for
OpenSpec, creating a change, writing its artifacts, applying its tasks and
archiving it — alongside multivac's change lifecycle.

multivac never installs either one. It reads what they leave on disk and, when
you ask, invokes the binaries it finds on `PATH` or in the repository's own
`node_modules/.bin`. Installing the tool stays yours; running the tool's own
`init` **in this repository**, once, is the lifecycle's — see
[the scaffold](#the-scaffold-declaring-a-tool-that-has-never-run-here).

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
| **read** | multivac can consume what the tool produced | the tool **installed** in that root: its own state file passes its check |
| **run** | multivac can invoke the tool | every **required binary**, found on `PATH` or in that root's `node_modules/.bin` |

| adapter | installed when | artifact | binary | refresh |
| --- | --- | --- | --- | --- |
| `opsx` | `openspec/config.yaml` or `openspec/config.yml` is a file | `openspec/specs`, `openspec/changes` | `openspec` | `openspec update` — refreshes only the command bodies a human installed; in a brain the scaffold made there are none, and it does nothing |
| `speckit` | `.specify/integration.json` parses, with `integration_state_schema` 1 and a non-empty `installed_integrations` | `.specify` | `specify` | `specify check` |
| `graphify` | `graphify-out/graph.json` parses as JSON | `graphify-out/graph.json`, shared | `graphify` | `graphify update .` |
| `codegraph` | `.codegraph/codegraph.db` is a file | `.codegraph/codegraph.db`, local | `codegraph` | `codegraph sync` (build: `codegraph init`) |
| *any other grapher* | its declared artifact exists | **unverified — you declare it** (see below) | | |

**Installed is what the vendor wrote, never a path being there.** One
probe answers for every surface — the scaffold, the first build, the choice
between build and refresh, both graph gates, the project-document gate and
`doctor` — from files alone, spawning nothing. It gives one of four states:

| state | means |
| --- | --- |
| **installed** | a state file passes its check |
| **missing** | nothing of the tool is in that root |
| **partial** | the tool's directory, or a state file, is there and fails — the reason names the path and the check |
| **unevaluable** | a state file is there and cannot be read — the reason names the path and the error |

A `.specify/` made with `mkdir`, a 0-byte or truncated `graph.json`, and a
`.codegraph/` holding only codegraph's own `.gitignore` are all partial. The
ceilings: a spec-kit install that never wrote `integration.json` reads partial; a
database moved with `CODEGRAPH_DIR` reads partial; a JSON file that is not a
graph passes.

**One lookup finds a binary.** Every surface that runs an adapter's
command, or says whether it can — the scaffold, the validator, the build and
the refresh at close, the graph gate, `doors`' post-edit hook and `doctor` —
asks the same question in the root the command runs in: each `PATH` directory
in order (on Windows, with each extension `PATHEXT` lists), then that root's
own `node_modules/.bin`, where a project-local `npm i -D` puts a tool. A match
is an executable file, a copy on `PATH` wins, and what runs is what was found.
The binary column above is each entry's `required` list: all of them must be
found. A binary missing from a root is named with its adapter, the install
line and the vendor's repository:

```txt
`graphify` found on neither PATH nor api's node_modules/.bin — install graphify: uv tool install graphifyy (https://github.com/Graphify-Labs/graphify)
```

A grapher you declare has no vendor on record, so its line says
`declared in .multivac/config.yml (graphers.<name>)` instead. The Windows half
is read from `PATHEXT`'s documented meaning and has never been run there.

If you cloned a repo that already has a shared artifact committed, the read
half works with the tool not installed at all. A local one, codegraph's
database, is built in each checkout. The binary is only needed to
*invoke* — and that is the line multivac never crosses: it reads foreign
artifacts and invokes declared binaries, but it never installs foreign
software.

Declared repos are the exception, because they are the tool's own data:
`repos sync` clones them, on explicit request.

## The three-state policy

| state | `verify`, `doctor`, `doors` | `init`, `repos sync`, `change` |
| --- | --- | --- |
| **not declared** | nothing, not even a notice | nothing |
| **declared, binary absent** | a notice, **exit 0** | refuses with **exit 1**, naming the binary, the install line and the vendor, before writing anything, where the tool would run |
| **declared, installed** | adapter active | adapter active; nothing is re-run |

Declaring means "this project uses it", which stays true on a machine that does
not have it yet. The surfaces that only read (`verify`, `doctor`, `doors`) never
turn red over an absent tool. The commands that set a repo up run the tool, so
they refuse where it cannot run: `init --sdd speckit` without `specify`, a
`repos sync` that would equip a repo, a `change new` whose SDD is missing. An
SDD under `sdd_auto: false`, or a tool already installed, is not required.

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
grapher    graphify @ brain: installed (shared) · binary ok · fresh
grapher    graphify @ api: missing (no graphify-out/graph.json) → run `graphify update .` there
```

Every degraded shape is a pointer with the exact command:

```txt
grapher    codegraph @ brain: missing (no .codegraph/codegraph.db) · binary missing → `codegraph` found on neither PATH nor brain's node_modules/.bin — install codegraph: npm i -g @colbymchenry/codegraph (https://github.com/colbymchenry/codegraph), then `codegraph init`
grapher    codegraph @ brain: installed (local) · binary missing → `codegraph` found on neither PATH nor brain's node_modules/.bin — install codegraph: npm i -g @colbymchenry/codegraph (https://github.com/colbymchenry/codegraph) (graph cannot refresh)
grapher    graphify @ brain: installed (shared) · binary ok · graph STALE (older than last commit) → run `graphify update .` there
grapher    graphify @ api: partial (graphify-out/graph.json does not parse as JSON) → run `graphify update .` there
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
in the table because it was **run against the shipped binary**, not because a
help screen lists it.

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

Where build and refresh differ, `doctor` names the right one for the situation
— here a fresh clone, whose `.codegraph/` holds no database:

```txt
grapher    codegraph @ brain: partial (.codegraph is there and .codegraph/codegraph.db is not) → run `codegraph init` there
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

The **first build** is separate, because a repo cannot be refreshed before it
has been built. `init`, `repos sync`, `change new` and the gates build the graph in every declared
repo on disk that is not read-only where the grapher is not installed — missing,
or partial like a 0-byte `graph.json` — with the adapter's `create` where it
declares one, its `refresh` otherwise, and skip every repo where it is
installed. A graph is
derived from the tree, so rebuilding a partial one loses nothing. A repo whose
state file cannot be read gets neither command:

```txt
graph graphify @ api: built (`graphify update .`) — artifact left uncommitted
```

Before a first build, the grapher's ignore lines are added where they are
missing. For graphify that is `.graphifyignore`, which keeps `.claude/`,
`.multivac/`, `.specify/`, `specs/` and `openspec/` out of the graph, and two
`.gitignore` lines, `graphify-out/*` and `!graphify-out/graph.json`, which leave
the graph the only output git reports. Without them a fresh brain's first
graph was mostly the SDD's own skills and templates. Lines already there are
left alone, and if one of your rules still ignores `graph.json` the build says
which command names it rather than editing your rule.

```txt
graph graphify @ brain: wrote .graphifyignore (+5) and .gitignore (+2) before the first build
```

Before this, the graph was only ever built for repos a change explicitly
touched, so a repo had to be worked on before it could be navigated — backwards
for an agent that reads the graph in order to do the work.

**The grapher's own install into each harness.** graphify also ships a
project install per agent harness: a skill, a rule or hooks that tell that
agent to ask the graph. Once a repo's graph is built, the same commands run
`graphify install --project --platform <p>` there for each declared door that
does not have it yet:

| door | platform | installed when this exists | writes `## graphify` |
| --- | --- | --- | --- |
| `agents` | `agents` | `.agents/skills/graphify/SKILL.md` | nowhere |
| `claude` | `claude` | `.claude/skills/graphify/SKILL.md` | its own `CLAUDE.md` |
| `cursor` | `cursor` | `.cursor/rules/graphify.mdc` | nowhere |
| `codex` | `codex` | `.codex/skills/graphify/SKILL.md` | `AGENTS.md` |
| `opencode` | `opencode` | `.opencode/skills/graphify/SKILL.md` | `AGENTS.md` |
| `gemini` | `gemini` | `.gemini/skills/graphify/SKILL.md` | its own `GEMINI.md` |
| `copilot` | `copilot` | `.copilot/skills/graphify/SKILL.md` | nowhere |

Where the section lands decides two things. The door cites
`## graphify` as the manual for the verbs only where a declared platform writes
it into `AGENTS.md` — outright, or through a symlink door, which is why
**every symlink door is linked before the vendor runs**: measured on the
graphify release the registry records, `claude` and `gemini` write their section
through the link, and without it they leave a regular `CLAUDE.md` or `GEMINI.md`
that multivac may not replace, so the harness reads the vendor and never the
door. `doctor` offers an
install from the same set, and `cursor`, whose rules file only repeats what the
section says, is skipped where the section is already there — after the
platforms that write it have run.

graphify has no windsurf platform, and that door is named instead.

The hooks graphify writes for claude, codex and gemini name the binary by the
absolute path it has on the machine that ran the install. Those files are
committed, so multivac rewrites that path to plain `graphify`, found on `PATH`
on every machine, and says so — on **every** run that equips a root, not only
the one that installs, because an install run by hand afterwards writes the
absolute path again. `*.graphify-bak`, the backup graphify leaves of
a settings file it edited, goes into `.gitignore` first. `doctor` names a door
whose install is missing, with the command, and runs nothing.

```txt
graph graphify @ brain: installed into claude (`graphify install --project --platform claude`)
graph graphify @ brain: .claude/settings.json named graphify by an absolute path — rewritten to `graphify`, found on PATH
```

**The harness post-edit hook.** `doors` writes it into the hook config of each
declared target whose harness has such a hook — for Claude Code that is one
more entry in the same managed `.claude/settings.json` merge that carries
`verify`, matched on `Edit|Write|MultiEdit`:

```json
{ "matcher": "Edit|Write|MultiEdit",
  "hooks": [{ "type": "command",
              "command": "L=.multivac/cache/graph-refresh.lock; f=$(sed -n … | head -n 1); t=$(git -C \"$(dirname \"${f:-.}\")\" rev-parse --show-toplevel 2>/dev/null); [ -n \"$t\" ] && [ -e \"$t/graphify-out/graph.json\" ] && cd \"$t\"; PATH=\"$PATH:$PWD/node_modules/.bin\"; … mkdir \"$L\" 2>/dev/null || exit 0; { graphify update .; rmdir \"$L\"; } >/dev/null 2>&1 </dev/null & exit 0" }] }
```

The hook first reads the edited file's path from what the harness passes it.
When that file sits in a git repository holding the graph, the refresh runs
there, under that repository's lock. So an edit in a change worktree of another
repo refreshes that repo's graph, not the session's. Otherwise it runs where
the session is.

The door promises "refreshed after your edits" only where a declared harness
has this hook. Elsewhere it says the graph is refreshed at `change land` and
`change close`.

**Asking the graph is yours.** No committed file records that an agent asked
the graph before reading the tree. graphify writes only an untracked
`graphify-out/cache/last_query_stamp`, and a query that found nothing writes it
too. graphify's own Claude hook nudges toward a query and blocks no read.
`flow.md` and `doctor` say so.

Where graphify's own install covers a declared door, it writes a `## graphify`
section into that door file, with its verbs and when to use them. The multivac
door then names the commands and points to that section rather than repeating
it. `doctor` reports a door file where the section is missing.

The hook appends the repository's `node_modules/.bin` to `PATH`, so it reaches
the same binary the lookup found when `doors` decided to wire it. After that it
exports the grapher entry's opt-outs, outside the declared command — for
codegraph, `export DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1;
`. graphify declares none, so its hook is exactly as shown.

**The opt-outs are applied, not only named.** Every vendor command
multivac runs for an entry — the scaffold, the validator, the build and the
refresh — runs with that entry's `env` over your environment: opsx sets
`DO_NOT_TRACK=1` and `OPENSPEC_TELEMETRY=0`, codegraph `DO_NOT_TRACK=1`,
`CODEGRAPH_TELEMETRY=0` and `CODEGRAPH_NO_DOWNLOAD=1`, and spec-kit and
graphify set nothing. A `DO_NOT_TRACK=0` in your shell does not reach those
runs; run the tool by hand to opt in.

The `env` reaches every run multivac makes and **none of the commands it
prints**. OpenSpec's steps are openspec's own terminal verbs, run by your agent
in the agent's own environment, so the opt-outs that reach them are
`OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1` set there — either alone is enough —
or `openspec config set telemetry.enabled false` on the releases that ship
`config`. The printed flow needs a release whose `archive` takes `--json`, and
the scaffold one whose `init` takes `--no-animation`; the opsx entry's `note`
in the registry names each release by number, which this site's pages never
carry. What those calls do without an opt-out depends on the release, and was
measured with a fetch recorder and `HOME` isolated, not read: older releases
send one anonymous event per command, `--json` included; the latest send nothing
until a run without `--json` shows openspec's first-run notice, which writes
`~/.config/openspec/config.json`, after which every command sends. Of the calls
a change prints, the text-mode `openspec status` is the first that can show that
notice. A text-mode call whose stderr is a terminal also records a completion
tip in that file whatever the opt-outs, which `OPENSPEC_NO_COMPLETIONS=1`
stops. The `codegraph query` a door prints runs in your agent's environment
too, so codegraph's variables reach it only when that environment sets them.
Whether codegraph honours its variables was read from its source and docs, not
measured on the network.

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
refreshes at `change land` and `change close` only. `doctor` names the live path:

```txt
grapher    refresh path: claude post-edit hook (installed when the binary is present) · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh
```

**`change land` commits the graph.** Before it prints the push line for a
ready repo, `land` refreshes that repo's graph in the checkout that holds the
change's branch, and commits the graph there when it changed. The merge then
carries a graph of the merged tree:

```txt
graph graphify @ api: refreshed (`graphify update .`) — artifact left uncommitted
committed: graph: points-expire — refreshed on the change branch
  api: git -C /home/you/api push -u origin points-expire
```

A repo on a detached HEAD, or one whose graph is ignored, cannot take that
commit. `land` names it and exits 1. A read-only repo, and a grapher whose
artifact is built in each checkout, get no refresh and no commit.

**`change close`, the net.** A change can land edits made outside the harness,
so close still **runs** the refresh — in the brain and in each repo the change
names that is not read-only, using the grapher that root resolves: its own
`grapher:`, the brain's own entry included, else the ecosystem's, and none where
that is `none` — and reports each scope's result:

```txt
graph graphify @ brain: refreshed (`graphify update .`) — artifact left uncommitted
graph graphify @ api: refreshed (`graphify update .`) — artifact left uncommitted
```

The git hook shims run `verify` only — there is no refresh on the git hook
path: an ergonomic convenience does not belong on a gate, and it would blow
the hook's sub-second budget. Between refreshes, a stale graph next to a
present binary is a `doctor` warning carrying the manual command.

A missing binary degrades to a notice naming it, the install line and the
vendor; a refresh that exits non-zero is a warning that quotes the tool's cause
and hands the command back — `close` never fails because a foreign tool did:

```txt
graph graphify @ brain: refresh skipped — `graphify` found on neither PATH nor brain's node_modules/.bin — install graphify: uv tool install graphifyy (https://github.com/Graphify-Labs/graphify), then `graphify update .` there
graph graphify @ api: refresh failed (PermissionError: [Errno 13] Permission denied: 'graphify-out/.rebuild.lock') — run `graphify update .` there by hand
```

The cause is found the same way for every vendor command multivac runs — the
scaffold, the validator, the build and the refresh: lines drawn only in box or
block characters are dropped, then a Python traceback is quoted by the exception
that closes it, else the lines naming an error, a refusal, a denial or something
not found, else the last lines — at most three. The cause words are English; a
tool that says it otherwise is quoted by its last lines.

The refresh at close runs before the archive commit is printed. A brain graph
it changed is part of that commit. For each named repo whose graph changed,
close prints the commit to make there. A change worktree whose only
uncommitted file is the graph gets that file restored, and is removed. The refresh module itself never runs git: the
commits are made by `land` and printed by `close`.

A declared repo that no change names is left alone by the lifecycle.
`repos sync` builds its first graph.

No grapher is declared by default. A newborn brain is two content files, and a
graph of that is noise.

## A declared grapher obliges something

Declaring a grapher used to be closer to a wish than a decision: the tool
ran where it could, every failure was a notice that kept going, and a change
could close with four declared repos ungraphed without a word. The SDD adapter
had already been gated at both ends; this one had no gate anywhere.

Now `change close` refuses while a declared root on disk that multivac may
write in has no graph — see [the graph gate](../commands/#the-graph-gate). The
cost of the old behaviour was invisible by design, which is exactly why it
needed a gate: the door tells every agent to ask the graph before reading the
tree, so a missing graph never failed — it degraded into agents grepping, which
looks like working.

Two things arrived with it. The refresh at close reaches every declared repo
on disk rather than the ones a change happened to name — except a read-only one.
And the door projected into each declared repo now carries the same graph block
the brain's door has always carried, resolved with the grapher that applies to
that repo — requiring an artifact in a repo whose own door never mentioned it is
the tool talking to itself.

## And it is part of the repository

Existence was half the question. A graph that lives only in the author's working
tree passes the gate above and helps nobody who clones the repo — where the door
still tells every agent to ask it. So `change close` refuses while a declared,
present root where the grapher is installed has not **committed** its shared
artifact. It asks the committed `HEAD` (`git cat-file -e HEAD:./<artifact>`),
never the index, because a clone gets `HEAD`: a graph staged and never
committed is refused.

```txt
graph: `change close points-expire` refused — 2 roots keep their graph out of the repository
  api: graphify-out/graph.json is not committed — `git -C ../api add graphify-out/graph.json && git -C ../api commit -m "chore: commit the graph" -- graphify-out/graph.json`
  web: graphify-out/graph.json is ignored by .gitignore — remove the rule, then `git -C ../web add graphify-out/graph.json && git -C ../web commit -m "chore: commit the graph" -- graphify-out/graph.json`
```

**A local artifact is never asked.** codegraph's `.codegraph/codegraph.db` is a
SQLite database its own `.gitignore` keeps out of git, so the entry declares it
local: this gate skips it, the graph gate still refuses a checkout that has
not built it, and the door tells agents never to commit it. graphify's graph,
and any grapher you declare, is shared. The refusal's commit names the graph as
its pathspec, so work already staged in that repo stays out of it. A
committed graph changed in the working tree passes, since freshness is not this
gate's question; and `HEAD` is not the ref a landing branch integrates.

**Ignored gets its own message** because the fix is different: `git add` on an
ignored path reports nothing most people read, and `-f` is the wrong advice when
the rule is what is wrong.

**multivac stages nothing.** The gate names the command; you run it. The refresh
module is kept out of git entirely — a refresher that touches your index
turns a background convenience into something that edits your commit — and this
gate does not relax that. It lives in its own module for the same reason.

**The obligation is the declared artifact**, not the directory around it. The
tool writes caches, dated exports and generated HTML beside it, which your own
ignore rules exclude; demanding the whole directory would be a rule its author
already breaks. `doctor` reports the same state per root and gates on nothing:

```txt
grapher    graphify @ api: installed (shared) · binary ok · fresh · NOT COMMITTED → `git -C ../api add graphify-out/graph.json`, then commit it
```

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
install, no constitution, and no step block in its door — one line instead:

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
there; it is refused in the code repo, whose gate reads the brain's SDD.
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
not — stages the brain's slug directories whatever `sdd_auto` and `--no-sdd`
say: those switches skip the steps and their gates, never what was already
written. A slug directory git reports deleted is staged too, and so is each main
spec that carries the merge: OpenSpec's archive moves `openspec/changes/<slug>/`
under `archive/` and merges its `specs/<cap>/spec.md` into
`openspec/specs/<cap>/spec.md`, and all of it lands in close's one commit. A
main spec carries the merge when its `## Requirements` section holds, whole and
under the same name, every `### Requirement:` block under the archived delta's
ADDED and MODIFIED sections — line endings, trailing whitespace and runs of
blank lines normalised on both sides, tracked or untracked alike, and both read
the way openspec reads them: a block runs to the next requirement or `## `
header, and a header inside a fenced code block is none. Only `spec.md` is
merged, so a file you keep beside a delta maps to nothing under
`openspec/specs/`. One that does not carry it — the archive was made without
merging, or the file is a draft of yours — is named dirty and not staged:

```txt
sdd opsx: openspec/specs/billing/spec.md is dirty and was not staged — it is not this change's to commit
```

A delta with no ADDED or MODIFIED block is staged as the archive left it. Only
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
deadlock. `change plan` refuses without `specs/<n>-<slug>/spec.md` — a SUFFIX
match, so another change's directory that merely contains the slug is not proof
of this one's step; that file comes from `/speckit.specify`; that chat command
does not exist until `specify init` has run — and `specify init` was what the
blocked change was going to do. The only exits were `--no-sdd` and
`sdd_auto: false`, both of which turn the gate off to fix the reason it fired.

So an adapter also declares its **scaffold**: the vendor's own init command,
verbatim. Whether it has already run in a repo is the tool's own state file,
read by the probe above, never a directory being there.

| key | installed when | the tool's own init |
| --- | --- | --- |
| `speckit` | `.specify/integration.json` passes its check | `specify init --here --integration <key> --force --ignore-agent-tools`, then `specify integration install <key>` for each further door |
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
installs the first and names the rest; it never passes `--force` to put them
together. A door with no spec-kit integration is named too. With no harness
door at all, spec-kit gets `claude`: its `generic` integration needs a commands
directory no harness here is known to read. A door you add after spec-kit is
installed is not added to it; run the vendor's own install for it. OpenSpec has
no gap and no later install: a door added later needs nothing from it.

`init`, `change new`, `change plan`, `change apply` and `change close` run it **in
the brain** when the tool is missing there, print it first, and skip it where it
is installed. `repos sync` does the same for the brain after it clones and
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
`/speckit.constitution`'s job, and multivac's own check treats a file identical
to the template as missing.
{{< /callout >}}

### Each tool's own flow, not a fixed triple

An SDD's steps are **commands the agent runs**, never subcommands multivac
spawns: chat commands for spec-kit, openspec's own terminal verbs for OpenSpec.
A step name is not a verb — `openspec propose` exits 1 with `unknown command`.
And the tools do not agree on what the steps *are*: OpenSpec creates a change,
writes its artifacts, applies its tasks and archives it; spec-kit has eight
commands and no archive at all. So the shipped registry
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

The refusal names the command, the path, and where it looked, so the fix is on
the line above the error:

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
where it found the artifact —

```txt
sdd opsx: brain: openspec/changes/add-user-auth/proposal.md ok
```

— so a bare relative path never leaves you guessing which checkout satisfied the
gate.

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

It asks the one lookup in the repo that holds the artifact — `PATH`, then that
repo's `node_modules/.bin` — so a project-local `npm i -D` is found, exactly as
`doctor` and every other surface find it. And it never tells you to remove
`sdd:` — that key also renders the whole flow into the brain door, so dropping
it would delete the agent's instructions along with the check.

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
`plan-template.md` is checked against the file it actually copied — the skeleton
multivac writes into `overrides/` included:

```txt
sdd speckit: `change apply add-user-auth` refused — brain:specs/003-add-user-auth/plan.md is byte-identical to .specify/templates/overrides/plan-template.md: the scaffolding wrote it, nobody has
```

What this does **not** catch is said rather than hidden: an agent that edits one
line and stops.

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
| `/speckit.analyze` | STRICTLY READ-ONLY by its own spec — it writes zero bytes |
| `/speckit.implement` | "all tasks `[X]`" is the agent grading its own homework |
| `/speckit.converge` | a clean converge is forbidden to touch `tasks.md` — success is invisible on disk |

A lifecycle point with nothing to prove says so rather than passing quietly:

```txt
sdd speckit: `change close` is not gated — this tool declares no step whose artifact could prove it
```

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
`change close` stages none of them: a main spec is staged only when it carries
the merge (see [What close lands](#the-sdd-lives-in-the-brain)).

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
only when every entry it reaches on disk is tracked, and the entries are listed
one by one otherwise. Entries git does not track are named apart, to delete by
hand, since `git rm -r` fails on a path it does not track:

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
the template's own tokens, such as `[PROJECT_NAME]`. The line names the token:

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md is still the unfilled template shipped by the tool (placeholders remain: [PROJECT_NAME]) → run /speckit.constitution …
```

A written constitution may keep the template's HTML comments, and may cite
`[1]` or `[API]`: only the template's own tokens, outside comments, count.

Those states are also a **gate**. `change plan` refuses while the document is
missing, unreadable, empty, or still the template. The tokens are the ones
`/speckit.constitution` explicitly asks the author to replace, so a written
constitution has none:

```txt
sdd speckit: `change plan <slug>` refused — .specify/memory/constitution.md is missing or unreadable — looked in brain
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
sdd        speckit project law — .specify/memory/constitution.md present (last modified 2026-08-01) but the law's newest row is 2026-08-15 — STALE: the law moved while this did not; a report, never a gate
```

It stays a report. Whether a principle still fits the product is a judgement,
and no file mtime can make it.

`change new` asks for the document before `change plan` refuses over it. When
the tool is installed in the brain and the document is not written, it prints
one line. That line does not tell the agent to continue unattended: the
principles come from you.

```txt
sdd speckit @ brain: .specify/memory/constitution.md is template (placeholders remain: [PROJECT_NAME]) — run /speckit.constitution in your agent … Ask the human for the principles and write their answers; `change plan` refuses until it is written
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

Neither stops `change close` from staging the brain's slug directories and
citing one in the change body: the switches skip the steps and their gates,
never what was already written. With `sdd_auto: false`, the brain door, flow.md
and `doctor` also stop saying anything refuses; flow.md and `doctor` say no
command runs the init, and `doctor` names no code the SDD governs, since the
code gate is off too.

```txt
sdd        opsx @ brain: missing (no openspec) · binary ok · sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself
```

That is exploration mode. `doctor` keeps reporting the adapter either way —
turning automation off is not the same as undeclaring it; you still want to
know the tool is installed and the binary is current.

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
