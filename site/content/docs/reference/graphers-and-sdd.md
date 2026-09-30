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
  brain: .                 # the brain holds code too, so it gets a graph
  api: ../acme-api
  legacy:
    path: ../legacy
    grapher: codegraph     # this repo uses a different tool
```

The brain gets a graph only where a `repos:` entry is the brain, as `brain: .`
is here. A brain whose code lives in other repos keeps none — see
[A brain that holds no code](#a-brain-that-holds-no-code).

`doctor` reports one line per scope — the brain where it holds code, plus every
present repo:

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

### A brain that holds no code

A brain holds code only where one of its `repos:` entries is the brain itself —
`brain: .`, or any key whose path is `.`. A brain whose code lives in other
repos holds the law, the changes and their specs, and none of that is code. So
it resolves **no grapher**, whatever the top level declares: nothing builds,
refreshes, installs, gates, lands or reports a graph there. Not `init`,
`repos sync`, the change lifecycle, the post-edit hook, `repos check` or
`doctor`. Each code repo keeps its own graph, and the brain door says where to
ask them (see [Where to ask the graph](#where-to-ask-the-graph)).

This is measured, not a matter of taste. Before, such a brain resolved the
ecosystem's grapher for itself. `init` installed 23 graphify files and a 2-node
graph of `CLAUDE.md`. After the first close that graph held 63 nodes, 60 of
them graphify's own skill, and asked where the order total is computed it
answered from the skill. codegraph built an index of 0 nodes there.

Every surface that skips the brain says so. `init` in a brain declaring a
grapher:

```txt
init: graphify is declared, and this brain holds no code (no repos entry is the brain), so no graph is built here — each code repo gets its own when `repos sync` or a change reaches it
```

`doctor`, in place of a status line for the brain:

```txt
grapher    brain: holds no code (no repos entry is the brain), so no code graph is built, gated or refreshed here — agents here ask the code repos' graphs; if this repo holds code, add `brain: .` under repos:
```

`change plan`, for a change that names `brain`:

```txt
brain: /home/you/brain (the brain)
brain: named by this change, but no repos entry is the brain — no code graph is built, gated or landed here; if the change lands code in the brain, declare `brain: .` under repos: in this change
```

**Whether a new brain holds code is decided once, at `init`,** before anything
is written. In a git repository it holds code when git lists any file outside
`.multivac/`, tracked or untracked and not ignored. Outside one, it holds code
when any entry but `.multivac` and `.git` is there. A repo that holds code gets
`brain: .` in its config, the grapher's binary looked up and its first graph
built. An empty one gets none of that, so `init --grapher graphify` succeeds on
a machine without graphify. A repo holding only a README, a LICENSE or a
`.gitignore`, as a hosting provider creates one, counts as code. Remove its
`brain: .` entry to make it a brain that holds no code.

**Declaring it later.** Source added to a brain with no entry at `.` is not
graphed until you add one, under `repos:` in `.multivac/config.yml`:

```yaml
repos:
  brain: .
```

Once committed, the config changes only inside a change, so declare it in the
change that brings the code in. `change plan` names that edit when a change
names `brain` in a brain that holds no code.

**An install an earlier release left is kept.** multivac never removes it.
`doors` and `doctor` run no vendor command, and it is your repository. What it
does instead:

- `doctor` names it and prints its removal. It never fails over it.
- `repos check` states it on the brain's line: `brain  ok   cloned; leftover graphify install (tracked)`.
- The brain door says it answers no code question, and that `doctor` prints its
  removal. It names graphify's section and hooks only where a platform found
  wrote them — an `agents` skill alone writes neither. `init` and `doors` write
  that door byte for byte alike, and the line goes once the install is gone and
  `doors` runs again.
- Every known grapher's files are not code in any repo, so the removal commits
  without a change.

```txt
grapher    leftover graphify install @ brain: platforms agents, claude and graphify-out/graph.json (tracked) — kept until you remove it; it graphs none of the code, and graphify's own section and hooks still send agents to it. Remove: cd /home/you/brain && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore; review `git diff` (the uninstall drops the whole hook group it wrote, commands you added to it included, and leaves an emptied hook list in each settings file it touched), then `multivac doors` and commit
grapher    leftover codegraph index @ brain: .codegraph/codegraph.db (local) — kept until you remove it; it indexes none of the code. Remove: cd /home/you/brain && codegraph uninit --force, then `multivac doors`
```

The removal is the grapher's own uninstall, one per platform found, then its
files. Where gemini is among the platforms, its uninstall comes first: once
another platform's uninstall has removed the shared section, gemini's stops
early and leaves its hook behind. **Review `git diff` before you commit.** Each
uninstall drops the whole hook group it wrote, including a command you added to
that group, and leaves an emptied hook list such as `"PreToolUse": []` in each
settings file it touched. Until the install is removed, graphify's own section
and hooks keep sending agents to the bare verb in the session's directory, the
brain: Claude's on a search and an in-project read, Gemini's on every read.

### What the graph answers

Keeping an artifact fresh is the cheap half. The other half is the agent
asking the graph instead of grepping the tree, for an answer about what reaches
what rather than for fewer bytes — so the brain door names the tool's **own
query verbs**, and multivac never paraphrases them into a generic "query the
graph". They are not the same verb wearing two names:

| | `graphify` | `codegraph` |
| --- | --- | --- |
| shape | a **question** in words | a **symbol** by name |
| ask | `graphify query "<question>"` | `codegraph query <symbol>` — its definitions and imports |
| also | `explain "<node>"`, `path "<A>" "<B>"` | `callers <symbol>`, `impact <symbol>`, `node <symbol>` |

Hand `codegraph` a sentence and it returns name matches for its words, not an
answer: give it a symbol. Hand `graphify` a bare identifier and you have thrown
away what it is for. A door that said "query the graph" would be wrong for one
of them, and an agent cannot tell which.

The door's list of verbs claims no saving over grep, for either tool: each line
says what its verb answers, and for codegraph what it misses. codegraph's four
verbs are the ones that were run, on the version the registry entry records,
over multivac's own `src/` and `test/` (141 files): each of the 318 top-level
functions there was asked each question, against what an agent runs instead.

| Question | Verb | Against | What it printed |
| --- | --- | --- | --- |
| Where is X defined | `query` | a narrowed definition grep | **more** for 311 of 318 functions, a median 3.43 times as much; kept for the signature it adds |
| Who calls X | `callers` | `grep -rn 'X('` over the tree | less for 316 of 318, a median 2.01 times less; it names the calling function |
| What breaks if X changes | `impact` | a one-level grep for call sites | less for 182 of 318, a median 1.10 times less; its worth is reach — two calls away, and the tests — and it is a lower bound |
| Show me X's body | `node` | a definition grep and a 60-line read | less for 235 of 318, a median 2.07 times less; it does not replace the read an edit needs |
| What does file Y hold | `node -f <file> --symbols-only`, left out | `grep -n '^export'` | more for 52 of 52 files, a median 3.3 times as much |

What each misses is in its line. `callers` lists 20 unless given `--limit N`,
and its header counts what it lists, not what there is: 20 for a function with
36 callers. `callers` and `impact` merge symbols that share a name, and miss a
call made through an aliased import — one function imported under another name
in seven files. `node` prints every definition of a name; `-f <file>` narrows
it to the definition in that file, spelled as its answers print it — any part
of that path, such as the file name, also matches. A path it does not match,
such as one starting `./`, an absolute one or one outside the repo, prints
every definition again, with no warning and exit 0. `--limit 1` would hide a
second definition, so the door never prints it. Each call took 250 to 410 ms,
against under 10 ms for grep.

Also run, and left out: `explore` (15.7 to 17.2 KB a call), `context` (it found
the expected symbol for 2 of 5 sentences), `files` (what a glob already does),
`affected` (not a question about navigating code) and `callees` (the trail
`node` already prints). What repays the half a kilobyte the list adds to a
session is usually one `node` call — 220 of the 318 functions saved more than
that against a 60-line read; `callers` repays it for heavily called symbols;
`query` and `impact`, by bytes, do not.

This is what "multivac speaks a grapher" means, and why the table is short:
the verbs have to be run before they can be written down. `graphify query` is
in the table because it was **run against the shipped binary**, not because a
help screen lists it.

A declared grapher gets no query lines. multivac does not know your tool's
verbs and will not guess them; the refresh still runs, the door simply says
the graph is there without telling the agent how to ask it.

### Where to ask the graph

A verb run bare asks the graph in the session's directory. From the brain,
that is the brain's graph — none at all in a brain that holds no code, where
`graphify query` exits 1 with `graph file not found`. Each verb takes a flag
that points it at another checkout, and answers there byte for byte as it would
from inside it:

| | `graphify` | `codegraph` |
| --- | --- | --- |
| flag | `--graph <checkout>/graphify-out/graph.json` | `-p <checkout>` |
| no graph at the path | exits 1 | answers from the nearest index above it, exit 0 — or fails where there is none |

**The door names the flag.** In a brain that holds no code, the door lists
each grapher the code repos resolve, the repos with their declared paths, and
every verb with its flag:

```md
- This brain holds no code, so it keeps no code graph: each code repo keeps its own. ASK IT BEFORE READING THE TREE RAW, from here, with each verb's flag pointed at a repo below — in a change, the flag `change apply` printed under that repo's checkout; paths in its answers are relative to the checkout the flag names.
  - `graphify` at `graphify-out/graph.json` (web: `../web`, api: `../api`), refreshed after your edits there, and committed on the change branch by `change land`:
    - `graphify query "<question>" --graph <checkout>/graphify-out/graph.json` — a question in plain words — returns the subgraph that answers it, walked outward from the best-matching nodes
    - `graphify explain "<node>" --graph <checkout>/graphify-out/graph.json` — one node and its neighbours, described in prose
    - `graphify path "<A>" "<B>" --graph <checkout>/graphify-out/graph.json` — the shortest path between two nodes — how A actually reaches B
```

A codegraph index is built in each checkout and never committed, and `change
apply` builds each change worktree its own — see [A change's own codegraph
index](#a-changes-own-codegraph-index). Its verbs carry `-p <checkout>`, as
graphify's carry `--graph`, and its group line names the worktree's index only
with the condition beside it:

```md
  - `codegraph` at `.codegraph/codegraph.db` (api: `../api`), refreshed after your edits there; built in each checkout, never committed — each change worktree's by `change apply`, which prints `its index: -p <worktree>`; where `apply` printed no such line, `-p` at that worktree answers from the nearest index above it, or fails:
    - `codegraph query <symbol> -p <checkout>` — a name's definitions and imports, each with kind, file:line and signature, best 10 first (`--limit N`)
    - …
```

A grapher no writable code repo resolves yet — no repo declared, or every one
`managed: false` or `grapher: none` — is named with no verb. The door never
cites the vendor's own section here: that section tells the agent to run the
bare verb.

**`change apply` names the flag for each checkout it hands out**, under the
checkout's line:

```txt
work here — one checkout per repo, nobody else's tree moves:
  web: /home/you/brain/.multivac/worktrees/points-expire/web
    its graph: --graph /home/you/brain/.multivac/worktrees/points-expire/web/graphify-out/graph.json — paths in its answers are relative to this checkout
  api: /home/you/brain/.multivac/worktrees/points-expire/api
    no graph in this checkout yet (`change land` commits one) — --graph /home/you/api/graphify-out/graph.json answers for the base, without this branch's edits; paths in its answers are relative to /home/you/api
```

The worktree's own graph where it holds one; else the repo checkout's, which
answers for the base without this branch's edits; else that there is none yet
and that `change land` builds and commits one. A codegraph checkout — the
change's worktree, or the repo branched in place — is given `its index: -p
<checkout>` where `change apply` has just built or synced its index there, and
the repo checkout's `-p`, for the base, only where it could not. Nothing is
printed for a checkout whose grapher is `none` or unverified, or for the brain's
own main checkout.

**The answers' paths are relative to the checkout asked.** An answer from a
change's worktree names `src/server.ts`, which read from the brain is a
different file, or none. Every line that hands out a flag says where its
answers' paths are placed. Querying a worktree's graph leaves an untracked
stamp next to it, and a refresh leaves its cache there; `change close` removes a
worktree whose only changes are the grapher's own outputs like these, and keeps
one holding anything else.

**A brain that holds code** keeps its two lines — the graph, and the verbs —
and adds one: its graph answers for this checkout, with the law, the changes
and their specs kept out of it — graphify through its ignore file, codegraph
because it indexes no Markdown; a grapher you declare yourself is not said to
keep them out (the ecosystem graph relates them) — and a
change's worktree has its own, as of its last refresh, asked with `--graph
<worktree>/graphify-out/graph.json`. On codegraph that line says instead that
`change apply` builds each change worktree its own index and prints `its index:
-p <worktree>`, that where it printed no such line `-p` there answers from this
checkout's index, without the branch's edits, and never to run the `codegraph
init` codegraph's notices suggest. Its sibling code repos, where they resolve a
grapher, are listed below it in the form above; a sibling on the brain's own
grapher, whose verbs the door already listed, gets one line in place of the
list: the verbs above, each with `-p <checkout>` (or `--graph
<checkout>/graphify-out/graph.json`) appended.

**This is about correctness, not size.** Asking the graph costs more bytes than
a narrowed grep — 2.1 to 2.6 times as many, measured — and no saving is claimed
for it. What the flag buys is an answer from a graph that holds the code, for
the checkout being read: measured on this project, the trunk graph lacked 27
source symbols of a change's worktree graph, and 73 of the 185 symbols that
moved sat more than 60 lines from where the same path, read from the trunk,
puts them. A graph query worded without the identifier still missed one
question in three; the verb is a map, not an oracle.

### A change's own codegraph index

A codegraph index is built in each checkout and never committed, so a change's
worktree starts with none. Asked there, codegraph answers from the nearest index
above it — the repo checkout's, or the brain's where the brain holds code —
with exit 0 and no warning. Measured on one of this project's branches, the
trunk's index lacked 19 symbols the branch had added and put 24 of the 192 that
moved more than 60 lines from where the branch has them; and a sibling repo's
worktree, nested under a brain that holds code on codegraph, answered with the
brain's code.

**`change apply` builds one in each checkout it hands out** — the change's
worktree, or the repo branched in place — and syncs the one there when apply
runs again. It runs the entry's build, or its refresh where an index is
installed, the way every build runs: the binary looked up in that checkout, the
entry's opt-outs set, that checkout's lock taken, and a failure warned, never
stopping apply:

```txt
api: .codegraph/ added to /home/you/api/.git/info/exclude — git ignored no index here, and that file is never committed
graph codegraph @ api worktree: built (`codegraph init`) — local artifact, never committed
work here — one checkout per repo, nobody else's tree moves:
  api: /home/you/brain/.multivac/worktrees/points-expire/api
    its index: -p /home/you/brain/.multivac/worktrees/points-expire/api — refreshed after your edits; paths in its answers are relative to this checkout
```

**The index never shows in `git status`.** Before it builds, apply asks git
whether it ignores each of the entry's ignore lines — `.codegraph/` — in that
checkout, asking about the line itself as git walks the tree: of a directory
line, whether git ignores the directory, so never descends into it. A line git
does not ignore is appended
to the repository's common `info/exclude`, which every worktree of that
repository reads and nobody commits, and apply says so once. It is not a
`.gitignore` edit: the `.codegraph/` line written into a repo's `.gitignore`
before its first build sits uncommitted in that repo's own checkout, so a
worktree index showed as `?? .codegraph/`, `git add -A` staged codegraph's own
`.codegraph/.gitignore` onto the branch, and `change close` kept the worktree as
holding uncommitted work. A worktree's own `info/exclude` is not read by git.
Asking about the line and not the database matters too: codegraph's
`.codegraph/.gitignore` un-ignores itself, so a repo whose `.gitignore` held only
`*.db` ignored the database and still listed `?? .codegraph/`. So did one
holding `.codegraph/*` or `.codegraph/**`, which ignore everything below the
directory and not the directory itself, letting that file back in: only a line
naming the directory, such as `.codegraph/` or `/.codegraph/`, keeps git out.

**Land syncs it, close removes it.** `change land`, in the checkout that holds
the change's branch, runs the same exclude step, then syncs the index — or
builds it where apply could not — and commits none of it. `change close`
removes the worktree, and the index with it.

**The pointer says where to ask, and how fresh the answer is.** apply prints
`its index: -p <checkout>` only where the index is installed in that checkout,
with one of two wordings: `refreshed after your edits` where a declared harness
has a post-edit hook and the brain's session refreshes codegraph (see [One
post-edit hook per grapher](#one-post-edit-hook-per-grapher)), and otherwise
that the index is as of this apply and refreshed again at `change land`, since
nothing refreshes it between the two.

**Where apply built none, it names none.** The pointer falls back to the repo
checkout's index, for the base, as in [Where to ask the
graph](#where-to-ask-the-graph), and says that `-p` at this checkout answers
from the nearest index above it, or fails. The doors say the same: every line
naming a worktree's index carries "where `apply` printed no such line" beside
it. A binary apply cannot find from the worktree is named once:

```txt
graph codegraph @ api worktree: build skipped — `codegraph` found on neither PATH nor api worktree's node_modules/.bin — install codegraph: npm i -g @colbymchenry/codegraph (https://github.com/colbymchenry/codegraph), then `codegraph init` there
```

— unless the repo's own checkout has no index either, where the first build of
that checkout has just said the same.

**Never run the `codegraph init` its notices suggest.** Asked with `-p` at a
worktree that has no index, from the checkout above it, some verbs print a
notice telling you to run `codegraph init` "here". That rebuilds the checkout
you are in, not the worktree, and run by hand it carries none of the entry's
opt-outs. Re-run `change apply`: it builds the worktree's index with them set.

**A copy found only in a repo's `node_modules/.bin` builds no worktree index.**
git never puts an untracked `node_modules` in a worktree, so the lookup there
finds nothing, and neither the post-edit hook nor your agent's shell would reach
that copy from there. The door names the bare `codegraph`: install it on PATH.

**Every command multivac runs for a grapher has its standard input closed.**
With its file watcher off — `CODEGRAPH_NO_WATCH=1`, or WSL on a `/mnt` path —
`codegraph init` waits on a prompt. Through a runner that left stdin open it had
not returned after 30 seconds; with stdin closed it exited 0 in about a second
and installed no git hook.

**What it costs.** apply's builds run one after another, one per named repo on
codegraph. Measured, `codegraph init` in a worktree took 1.1 to 1.4 seconds and
4 MB for 52 files, and 7 seconds and 36 MB for 1,012; a sync after one edit
took under a second. A repo's first apply builds twice — its own checkout's
first index, then its worktree's. The disk is freed at close.

**graphify gets nothing at apply.** Its graph is committed, so the worktree
checks it out with the branch; a refresh there cost 10 to 18 seconds and a diff
of hundreds of lines to add one edge. `change land` refreshes it and commits it.

What stays true: an index is as fresh as the last apply, land, close or hook
run, so an edit made through a shell command is not in it until the next. A
worktree's mount is empty, so its index never holds the mounted brain.
`CODEGRAPH_DIR` set to another directory is read as a partial index, and the
directory it leaves keeps the worktree at close.

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
missing: for graphify, lines in `.graphifyignore`, and two `.gitignore` lines,
`graphify-out/*` and `!graphify-out/graph.json`, which leave the graph the only
output git reports. If one of your rules still ignores `graph.json`, the build
says which command names it rather than editing your rule.

```txt
graph graphify @ brain: wrote .graphifyignore (+11) and .gitignore (+2) before the first build
```

**The ignore lines are derived, not listed.** They are the top-level
directories of what is not code at that root — multivac's own, each door's,
and what the SDD and every known grapher install there — each anchored to the
root as `/<dir>/`, but never a grapher's own output directory, which the
grapher skips itself. A code repo adds the brain's mount, `/.brain/`, and gets
no `/specs/`: its own `specs/` holds its tests. A declared repo nested inside a
root gets its own line, relative to it. A fixed list missed what it did not
name: a fresh brain's `.agents/` and `.codex/` made 228 of its 305 nodes after
one refresh, a consumer's mount 427 of 501, and an unanchored `specs/` hid a
code repo's own `specs/*.spec.ts`. With the derived lines that fresh brain's
first refresh held 77 nodes, none of them from `.agents/` or `.codex/`. The lines are directories, so a root's own
Markdown files and documentation directories stay in its graph. A door whose
SDD integration writes outside every door's own directory adds a line —
windsurf's `/.devin/`.

They are appended, never rewritten, and each append ends with one record line
listing what it added:

```txt
/.agents/
/.claude/
…
/openspec/
# multivac: kept out of the graph — /.agents/ /.claude/ /.codex/ /.copilot/ /.cursor/ /.gemini/ /.husky/ /.multivac/ /.opencode/ /.specify/ /openspec/
```

A line is skipped when the file already holds that directory in any spelling
(`x/`, `/x/`, `x` or `/x`), negated or not, when a record line lists it, or when
a line names a path under it. So the whole-directory opt-out is yours to write:
`!/specs/` keeps that directory in the graph, and multivac never appends it
again. A negation re-includes a whole directory only — a directory line would
override your re-include of a path under it, which is why multivac leaves such
a directory to you. The record is how a line you delete stays deleted; delete
the record's entry too and the next land appends it again. A `specs/` line an
earlier release wrote into a code repo is not multivac's to remove: it is yours
to delete. The printed `(+N)` counts lines, never the record.

**Existing repos get them at `change land`.** The first build is not the only
writer: `change land`, in the checkout that holds the change's branch, appends
the lines that root lacks before it refreshes, and commits the ignore file with
the graph. It writes the grapher's file alone — never `.gitignore` — and only
where that file is committed on the branch with no edit of yours on top, or
absent both there and in the repo's own checkout and not ignored. Anywhere else
it names the file, says why, writes nothing, and the graph lands alone:

```txt
api: .graphifyignore in /home/you/api is not committed — the graph on points-expire is built without it; commit it there the way that repo lands work
api: .graphifyignore is committed in /home/you/api but not on points-expire — the graph on points-expire is built without it; merge that commit into points-expire, or rebase points-expire onto it, then re-run land
```

An edit of yours on the committed file, and a file your own `.gitignore`
ignores, are named the same way: appending would carry your edit into
multivac's graph commit, and an ignored file cannot be committed with it.

An ignore file left uncommitted never reaches the worktree where land refreshes:
measured on this project, 1,460 nodes became 5,937 there. `repos sync`, `doors`,
`doctor` and `verify` never write the lines over a built root.

**A shrink the lines explain is rebuilt.** Over a graph whose files lie under
a new line, graphify's plain `update .` refuses to shrink it and exits 1, until
`--force`. So while the graph holds a node under a line a record lists, the
refresh at `change land` and `change close` runs the entry's rebuild,
`graphify update . --force`, in its place. It is driven by what the graph holds,
never by the append: a rebuild over lines the file already records that fails,
or is interrupted, is retried at the next land or close. When the rebuild right
after land appended leaves a node under the new lines, land restores the file
and commits the graph alone, and the next land naming that repo appends them
again — `change close` never appends, so it refreshes plainly. Once a recorded
line holds a node, the whole rebuild bypasses the shrink guard: a deletion you
have not committed goes with it, unwarned. The post-edit hook never forces:

```txt
graph graphify @ api: wrote .graphifyignore (+8) before the refresh at `change land`
graph graphify @ api: rebuilt (`graphify update . --force`) — artifact left uncommitted
```

When the rebuilt graph still holds nodes under the lines land just added, land
restores the file, commits neither, and says the next land or close rebuilds.

A grapher declared under `graphers:` gets no ignore lines.

**codegraph's lines go into `codegraph.json`.** Its ignore file sits at the
root, and multivac's lines go into its `exclude` list. codegraph indexes no
Markdown — none of its nodes came from `.specify/`, `specs/`, `.claude/`,
`.agents/` or `.multivac/` — so only the lines that change what it indexes are
written: the brain's mount, in a code repo whose brain holds code, and each
declared repo nested inside the root. Where there are none, nothing is written
and no file is created. The mount is the one that matters: a consumer of a
brain that holds code indexed 2,254 nodes, 2,247 of them the mounted brain's,
and `codegraph callers` answered with the brain's callers; with `/.brain/` in
`exclude` it indexed 7. The mount is written as git records it — `./.brain`,
`.brain/` and `./.brain/` all give `/.brain/` — and a mount outside the repo
gets no line.

```json
{
  "exclude": [
    "/.brain/"
  ]
}
```

The lines are spliced into the file's text, which is never re-serialised: every
other byte of yours stays, where re-serialising a hand-written file dropped a
duplicate key, its CRLF line ends and a number's trailing digits. A line is
never written over one that `exclude`, `include`, `includeIgnored` or
`deprioritize` already names — as `x`, `/x`, `x/`, `/x/`, `x/**` or `/x/**`,
each also with a leading `**/`, negated or not — or that names a path under
it: `exclude` wins over the other three, so an append would override a
`deprioritize` of yours. That is said:

```txt
graph codegraph @ api: /.brain/ not added to codegraph.json — its "deprioritize" names it, which is yours
```

A file that does not parse to an object with a list of strings under `exclude`
— codegraph ignores such a file too — is left exactly as it is and named, with
the lines to add by hand. JSON holds no record line, so a line you delete
without negating it comes back at the next write: `!/.brain/`, in any of the
four lists, is how you keep the mount indexed. No rebuild is forced: codegraph's
`sync` drops what a new line excludes.

A `.gitignore` line is not the route. codegraph honours one, but it is
git-wide, and a later `git submodule add` of the mount exited 128. The lines are
written where the other graphers' are — before a root's first build, so a
consumer's first index at `repos sync` already keeps the mount out, and at
`change land`, which commits `codegraph.json` alone on the change's branch
where it may write the file. The build in a change's checkout at `change apply`
writes none. The copy the first build writes in a code repo's own checkout is
yours to commit: land writes nothing beside an uncommitted one, and `doctor`
names it until you do, since a clone or worktree with the mount initialised
indexes the mount until then. A glob naming the mount in any other way — `.br*/`
— is not read, and the line is written beside it.

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
              "command": "L=.multivac/cache/graph-refresh.lock; f=$(sed -n … | head -n 1); t=$(git -C \"$(dirname \"${f:-.}\")\" rev-parse --show-toplevel 2>/dev/null); [ -n \"$t\" ] || exit 0; [ -e \"$t/graphify-out/graph.json\" ] && cd \"$t\"; PATH=\"$PATH:$PWD/node_modules/.bin\"; … mkdir \"$L\" 2>/dev/null || exit 0; { graphify update .; rmdir \"$L\"; } >/dev/null 2>&1 </dev/null & exit 0" }] }
```

The hook first reads the edited file's path from what the harness passes it.
When that file sits in a git repository holding the graph, the refresh runs
there, under that repository's lock. So an edit in a change worktree of another
repo refreshes that repo's graph, not the session's. When the file is in no
repository at all — a scratch file under `/tmp`, say — the hook exits having
run nothing: it used to fall back to the session's directory and refresh the
graph there, on every such edit. When the file's repository lacks the graph, or
the harness named no file, it still runs where the session is.

**In a brain that holds no code the hook follows, and never falls back.** It
runs only when the edited file's repository holds the graph and is not a
checkout of the brain — it has no `.multivac/config.yml` — and otherwise exits
having run nothing, so an edit of a brain file, or in the brain's own change
worktree, never builds a graph in the brain:

```sh
… t=$(git -C "$(dirname "${f:-.}")" rev-parse --show-toplevel 2>/dev/null); [ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/graphify-out/graph.json" ] && cd "$t" || exit 0; …
```

There is one such hook per grapher the code repos resolve — see [One post-edit
hook per grapher](#one-post-edit-hook-per-grapher) — each wired only where its
binary is found on PATH or in the `node_modules/.bin` of each repo resolving
it: the hook runs inside each repo, where a copy in another one is out of reach. A copy found only in a repo's `node_modules/.bin` refreshes
edits in that repo's own checkout, not in its change worktrees: git never puts
an untracked `node_modules` in a worktree, so there the hook finds no binary and
runs nothing. `doctor` names the repos where that holds; a copy on PATH reaches
every checkout. Where the binary is not reachable from each of them, that
grapher's hook is not wired and `doors` says why — naming the grapher where
another grapher's hook can still refresh your edits:

```txt
brain: notice: no post-edit graph refresh here — `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them
brain: notice: no post-edit refresh for codegraph here — `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them
```

Like the hook of a brain that holds code, it refreshes any checkout holding
the graph that an edit made from the session reaches, a repo marked
`managed: false` included. A brain that holds code and a code repo keep the
hook shown above it.

The door promises "refreshed after your edits" only for a grapher a brain's
hook is declared to run, and only where a declared harness has one. Elsewhere it
says the graph is refreshed at `change land` and `change close`, and `flow.md`
gives the same answer. Both are committed and read the declarations, never
this machine, so they read the same where `doors` could not wire the hook here:
`doors` says so when it runs, and `doctor`'s refresh path says why.

**Asking the graph is yours.** No committed file records that an agent asked
the graph before reading the tree. graphify writes only an untracked
`graphify-out/cache/last_query_stamp`, and a query that found nothing writes it
too. graphify's own Claude hook nudges toward a query and blocks no read.
`flow.md` and `doctor` say so.

Where graphify's own install covers a declared door, it writes a `## graphify`
section into that door file, with its verbs and when to use them. The multivac
door then names the commands and points to that section rather than repeating
it — except in a brain that holds no code, whose door never cites it, since the
section tells the agent to ask the graph in the session's directory. `doctor`
reports a door file where the section is missing.

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
stops.

codegraph's verbs the door prints — and the `codegraph init` and `codegraph
uninit --force` that `doctor` and the graph gate print for you — run in your
agent's environment or your shell, and the entry's `env` reaches none of them.
What they send was measured on the version the registry entry records, with
`HOME` isolated, a local recorder as the telemetry endpoint and strace, and read
from its shipped code. Where npm installed the platform bundle, `query`,
`callers`, `impact` and `node` open no socket; each appends one count per
command name and day to `~/.codegraph/telemetry-queue.jsonl`. That queue is
sent — with a machine id minted then, the version, the OS, the architecture,
Node's major version and a CI flag — by the first `init`, `uninit`, `index`,
`sync` or `upgrade` run without an opt-out once its day is past, by `codegraph
install`, and by the MCP server that install registers, at start and every six
hours. `init` and `index` also send an event at once with the languages and
coarse file-count and duration buckets, and `uninit` one of its own. Where npm
did not deliver the platform bundle, the npm shim downloads it from GitHub
Releases on any command, these verbs included, whatever `DO_NOT_TRACK` or
`CODEGRAPH_TELEMETRY` say. So, where your agent runs: `DO_NOT_TRACK=1` or
`CODEGRAPH_TELEMETRY=0` records nothing, and `CODEGRAPH_NO_DOWNLOAD=1` turns the
download off. multivac's own runs carry all three, record and send nothing, and
leave the queue as it is. The door carries no telemetry text; whether to set
these in your harness's environment is yours to decide.

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
grapher    refresh path: claude post-edit hook (installed when the binary is present) · `change apply` builds the index in each change worktree and `change land` syncs it, never committed · `change close` is the net · git hooks never refresh
```

The second is a brain that holds code on codegraph, whose index is built in each
checkout. In a brain that holds no code, it says whether the hook follows your
edits into the code repos, and why not where it does not:

```txt
grapher    refresh path: claude post-edit hook follows your edits into the code repos' checkouts (installed when the binary is present) · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh
grapher    refresh path: claude post-edit hook follows your edits into the code repos' checkouts (installed when the binary is present) · not into the change worktrees of api and web: they reach graphify only in their own node_modules/.bin, which a worktree does not hold · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh
```

Where several graphers are in play — a brain whose code repos resolve more than
one, or a brain that holds code with a sibling on another — it names each
grapher whose hook is wired, why another's is not, and graphers writing one
artifact, in the words `doors` prints:

```txt
grapher    refresh path: claude post-edit hooks follow your edits — graphify's and codegraph's (each installed when its binary is present) · `change land` commits graphify's graph on the change branch and syncs codegraph's index, which `change apply` builds in each change worktree, never committed · `change close` is the net · git hooks never refresh
grapher    refresh path: claude post-edit hook follows your edits — graphify's (installed when the binary is present) · no hook for codegraph: `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin) · `change land` commits graphify's graph on the change branch and syncs codegraph's index, which `change apply` builds in each change worktree, never committed · `change close` is the net · git hooks never refresh
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
commit. `land` names it and exits 1. A read-only repo gets no refresh and no
commit. A grapher whose artifact is built in each checkout is synced in the
checkout that holds the change's branch instead — after the same exclude step
`change apply` runs — and its index is never committed. On a detached HEAD
or another branch it is passed over, since nothing of it would be committed:

```txt
graph codegraph @ web: wrote codegraph.json (+1) before the refresh at `change land`
graph codegraph @ web: refreshed (`codegraph sync`) — local artifact, never committed
committed: graph: points-expire — codegraph keeps /.brain/ out of its index
```

The ignore file lands with the graph it shaped: where land appended the lines
that root lacked (see the ignore lines above), the same commit carries
`.graphifyignore` beside `graphify-out/graph.json`. For codegraph there is no
graph to carry it, so `codegraph.json` is committed alone, after the sync that
reads it; one git ignores there is named, with the command that shows the rule,
and nothing is written. In a brain that holds no code, land commits no brain
graph, even for a change that names `brain`.

**`change close`, the net.** A change can land edits made outside the harness,
so close still **runs** the refresh — in the brain where it holds code and in
each repo the change names that is not read-only, using the grapher that root
resolves: its own `grapher:`, the brain's own entry included, else the
ecosystem's, and none where that is `none` — and reports each scope's result:

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
it changed is part of that commit; a brain that holds no code has none to add.
For each named repo whose graph changed, close prints the commit to make there.
A change worktree whose only changes are the grapher's own outputs — a graph
the hook refreshed after land, a query's stamp, a refresh's cache — is removed;
one holding anything else is kept, and close prints the command that removes
it. The refresh module itself never runs git: the commits are made by `land`
and printed by `close`.

A declared repo that no change names is left alone by the lifecycle.
`repos sync` builds its first graph.

No grapher is declared by default. A newborn brain is two content files, and a
graph of that is noise.

### One post-edit hook per grapher

The brain's session gets one refresh hook per grapher it edits code for: the
brain's own, where the brain holds code, and a following hook for each other
grapher its writable code repos resolve. A brain that holds no code, with web on
graphify and api on codegraph, gets two, each in its own entry under the
post-edit matcher, each running only in the repos holding its artifact:

```txt
… [ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/graphify-out/graph.json" ] && cd "$t" || exit 0; … { graphify update .; rmdir "$L"; } …
… [ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/.codegraph/codegraph.db" ] && cd "$t" || exit 0; … export DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1; … { codegraph sync; rmdir "$L"; } …
```

A brain that holds code on graphify, with a sibling repo on codegraph, keeps its
own hook and adds codegraph's following one. Before, one hook ran one command:
the code-less brain above got none, and in the brain that holds code an edit in
the sibling's worktree refreshed the brain's graph and left the sibling's index
without it. A brain resolving one grapher, and every consumer, keep the one hook
they had, changed only by its exit for a file in no repository.

**Which hook is whose.** A refresh hook is multivac's by its head — the lock
path, `L=.multivac/cache/graph-refresh.lock;`, which nobody types — and a
grapher's by the artifact its test names, `[ -e "$t/<artifact>" ]`, written into
every hook form. So `doors` rewrites each grapher's own hook in place, copies
included, and never touches a command you typed, whatever grapher it runs. A
hook of multivac's naming an artifact no longer wanted, or none — one written
before hooks named their artifact — is taken over in place, inside its entry,
by a grapher still without a hook, so your matcher, timeout and sibling commands
stay; any other is removed, with only the entries it leaves empty. Two unnamed
copies, which earlier releases kept side by side, become one.

**Graphers writing one artifact get no following hook.** A hook knows its
grapher by the artifact it tests for, so two graphers declaring the same one
cannot each have a hook. The brain's own keeps its hook — and, being no
following hook, it moves into any repo holding its artifact, so an edit in the
others' repos runs the brain's grapher there. The others get none, and `doors`
says so, as `doctor`'s refresh path does in the same words — here for two
graphers you declared under `graphers:` with one artifact, the brain's own
first:

```txt
brain: notice: mygraph and depgraph both write graph/out.json, so one hook cannot tell their repos apart — mygraph is wired, and an edit in depgraph's repos runs mygraph there; `change land` and `change close` refresh depgraph
```

Where none of them is the brain's own, none is wired — a following hook for
one would run it in the others' repos too — and `change land` and
`change close` refresh them.

**A repo holding two graphers' artifacts.** A repo that resolves codegraph but
still holds a graphify graph from before passes both following hooks' tests.
Both take that repo's one lock, so an edit refreshes whichever takes it first —
8 and 12 of 20 edits, measured — and the other catches up at its next refresh.
`doctor` names such a repo, while the other grapher's hook is wired and reaches
its binary there, with the removal:

```txt
grapher    codegraph @ api: installed (local) · binary ok · fresh · also holds graphify-out/graph.json of graphify, which it does not resolve — graphify's post-edit hook refreshes it there; remove it: cd /home/you/api && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore
```

**A refresh may be running when you ask.** Each refresh runs in the background,
so an answer can be read while it runs: `codegraph callers` and `impact` read
during a sync were partial, 31 of 35 callers, in 12 of 12 trials. A
`.multivac/cache/graph-refresh.lock` directory in the checkout means a refresh
is running there; ask again once it is gone.

A hook that is not a following one — the brain's own, where it holds code, and a
consumer's — stays in the session's directory, and refreshes there, when the
edited file's repository lacks its artifact or the harness names no file. So a
brain that holds code still refreshes its own graph on an edit in a sibling
repo of another grapher, in the background, beside that sibling's own hook.

## A declared grapher obliges something

Declaring a grapher used to be closer to a wish than a decision: the tool
ran where it could, every failure was a notice that kept going, and a change
could close with four declared repos ungraphed without a word. The SDD adapter
had already been gated at both ends; this one had no gate anywhere.

Now `change close` refuses while a declared root on disk that multivac may
write in has no graph — the brain among them only where it holds code — see
[the graph gate](../commands/#the-graph-gate). The
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
committed is refused. The brain is judged only where it holds code: a graph
an earlier release left in a brain that holds none is neither refused nor
staged.

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
