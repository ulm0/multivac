---
title: Commands
weight: 1
---

One binary, two names: `multivac` and `mvac`. Ten commands.

```txt
$ mvac --help
multivac <command> [args]

commands:
  init       scaffold the brain: everything multivac owns under .multivac/
  seed       deterministic boundary inventory -> .multivac/seed-report.md
  verify     check anchors against the declared repos (deterministic, offline)
  count      dry-run an anchor leg: match count + per-file breakdown, verify's own matcher
  doors      project doors + install git hooks into the brain and declared repos
  doctor     what is declared, what was found, what is degraded, how to fix it
  repos      list declared repos; `repos sync [--shallow]` clones the missing, fetches the rest; `repos check` verifies them offline
  change     new/plan/apply/land/close — the ecosystem change lifecycle
  roadmap    the changes that have not started yet — list them, record one
  help       help <topic|command> — `help anchor` prints the anchor grammar on one screen
```

**Arguments are parsed by [citty](https://github.com/unjs/citty), and refused
by multivac.** Each command but `roadmap` and `help` declares what it takes
once, as data; citty parses that declaration and the refusal below reads the
same one, so adding a flag is one edit. `roadmap` hands the refusal its own
surface, and `help` reads only its first argument. The refusal is not
delegated: measured, citty parses an undeclared flag into a key nobody
declared and hands it over, which is precisely the silence the refusal exists
to end — so the check runs first, and the parser never sees an argument the
command did not declare. `--help` stays this tool's own; citty's generated
usage is not used.

`--help` / `-h` prints the block above and exits 0. `--version` / `-v` prints
the version and exits 0, but only as the first argument: after a command it is
refused as an unknown flag (after `help`, as an unknown topic). Running `mvac`
with no arguments prints the same usage and exits **2**.

**`--help` is an answer, never an action.** On any subcommand, `--help` or
`-h` anywhere in the arguments is answered by the dispatcher **before the
command runs**: usage on stdout, exit 0, no side effect on the tree.
`mvac seed --help` prints what seed would do; it never writes a seed report.

**The LLM boundary:** no command here calls a model, and none needs an API
key. `verify`, `doctor` and `doors` never touch the network. Other commands do
reach it, and say so: `repos sync` fetches, `roadmap sync` writes issues to the
declared tracker through its CLI, `change plan` and
`change apply` clone a repo the change names that is absent and has a `url` (one
declared `managed: false` is refused first), and `init`,
`repos sync` and `change new`, `plan`, `apply` and `close` (but not `close
--abandon`) run the SDD tool's own scaffold where the declared tool has never
run, which may use the network or send telemetry — see [SDD adapters](../sdd).
`seed` and the interview only draft what a human then enacts; the drafting
agent is yours, not multivac's.

## `init [dir] [--provider a,b] [--sdd name] [--quiet]`

Scaffolds the brain in `dir` (default `.`).

```txt
$ ls
src
$ mvac init . --provider claude,cursor
  ╭───────────────╮
  │  ●   ●   ○    │   multivac
  │  ○   ◍   ●    │   brain-driven development
  ╰───────────────╯

init: git init — the brain is git-native
init: wrote .multivac/config.yml — brain==code (repos: brain: .); add sibling repos there
init: wrote AGENTS.md — the door; your agent reads it first
init: wrote .multivac/invariants.md — the law table, zero rows
init: wrote .multivac/ritual.md — candidates, all commented; uncomment what your team owes each other
init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit
brain: door + hooks updated
brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
brain: brain==code — the brain door is this repo's door

init: done — the brain is scaffolded and empty. Session zero fills it:
init:   before step 0, declare every repo this brain governs under `repos:` in .multivac/config.yml — once committed, the config changes only inside a change
init:   0. commit what was just written: git add -- .claude .multivac AGENTS.md CLAUDE.md && git commit -m "multivac init"
init:   1. load the multivac skill in your agent — it carries both protocols
init:   2. `multivac repos sync` — clones every declared repo and installs its declared tools
init:   3. discovery, for code that exists — `multivac seed` inventories it, then draft proposed claims from it ← this repo holds code
init:      interview, for code that does not — the law comes from a human, claim by claim
init:   4. a human enacts each row in .multivac/invariants.md, then `multivac doors` and `multivac verify`
```

On a terminal the report is dim and the `init: done` line is acid — the
scaffolding lines are a receipt, the call to action is the only thing you
have to act on. Piped output and `NO_COLOR` get the same text with no ANSI.

The numbered lines are session zero, in order, and they name paths and
commands for the working directory: after `init some/dir`, `cd` there first.
`repos:` comes before the first commit, because a config modified after it
needs an open change. Both flows are printed, and the one that fits this
directory is marked: a brain that
holds code means discovery, an empty one means the interview. A new brain
for code that lives in other repos is empty, so the mark is a hint, not a
choice. The
step that writes the brain's project document appears when the declared SDD
gates one; no code repo is asked for its own. Both protocols
live in the skill; `init` points at them and restates neither.

**Whether the brain holds code is decided once.** `init` asks before it writes
anything: in a git repository, whether git lists any file outside `.multivac/`,
tracked or untracked and not ignored; outside one, whether anything but
`.multivac` and `.git` is there. Above, `src/app.ts` did, so the config
declares `brain: .` and the brain's own code lands through changes like any
repo's. A repo holding only a README, a LICENSE or a `.gitignore` counts as
code too. A kept config is not asked again: its brain holds code when a `repos:`
entry is the brain. In an empty directory the config declares no repo, and the
`config.yml` line says so:

```txt
init: wrote .multivac/config.yml — declare your repos under repos:
```

| flag | takes | effect |
| --- | --- | --- |
| `--provider a,b` | comma-separated door names, not validated | appended to `doors:` when `init` writes the config (`agents` is always included) |
| `--sdd name` | `opsx` \| `speckit` | written as `sdd:` in the config, and the tool's own init runs in the brain |
| `--quiet` | — | no `init:` report, no banner; refusals still go to stderr. The `doors` run that `--provider` starts and an SDD scaffold still print |

**Declared at init, installed at init.** With `--sdd`, or with a config that
already declares one, `init` finishes by running the tool's own init in the
brain, the same way `change` does.
A tool that is already installed there is not run again. For spec-kit, the run
that installs it also writes multivac's skeleton templates, as
[the scaffold](../sdd#the-scaffold-declaring-a-tool-that-has-never-run-here)
describes.

A tool `init` is about to run and cannot find is refused **before anything is
written**, `git init` included, with exit 1 and where to get it:

```txt
init refused — speckit: `specify` found on neither PATH nor brain's node_modules/.bin — install speckit: uv tool install specify-cli (https://github.com/github/spec-kit)
  init runs the declared tools' own init in the brain, and nothing was written: install them and re-run, or leave the flag off and declare the tool later
```

Nothing is required for a tool `init` would not run: one already installed,
or an SDD under `sdd_auto: false`.

**Step 0 commits what `init` wrote, and only that.** It lists the paths this
run created or changed, leaving out the tools' per-checkout outputs, so
uncommitted work of your own is never part of the "multivac init" commit. Two
edges: the `.gitignore` negations below are written before the first snapshot,
so step 0 never lists `.gitignore`; and a run that changes nothing prints
`nothing — everything init writes is already committed`, committed or not.

The banner is the mark: lit lamps are verified claims, unlit ones unanchored,
the acid one the claim in flight. The pattern is a fixed drawing, never a
reading — `init` runs before there is anything to verify. `init` is the only
command that prints it; `verify`, `doctor`, `doors` and `change` run inside
git and harness hooks, where it would be noise. It is skipped when stdout is
not a terminal, and `NO_COLOR` keeps the drawing while dropping the colour
(`#` lit, `.` unlit, `*` in flight).

Both `--flag value` and `--flag=value` work, and parse to the same value.
A flag with no value, or an unknown flag, is refused:

```txt
init: unknown flag --providers — known: --provider <a,b>, --sdd <name>, --quiet
```

An `--sdd` name nothing can honour is refused too, exit 2, before anything is
created: it is checked against the registry. `none` is not a name there —
leaving the flag out declares no SDD:

```txt
init: unknown --sdd nope — known: opsx, speckit
```

`--provider` names are not checked. An unknown one is written into `doors:` and
the projection that follows prints `brain: notice: unknown door target "nope"`
with the known targets; the exit is 0.

A valued flag whose value is missing — or whose value is itself a flag — is
refused too, rather than binding the next token or an empty string:

```txt
--repo needs a value — verify takes [dir], --strict, --check, --worktree, --repo <key>, --range <base>..<head>, --branch <name>, --quiet
```

The equals form is for long names only. A short alias is not split by the
parser, so `-r=api` would bind the value `"=api"`; it is refused as an unknown
flag rather than accepted as a form that does not work.

**Flags configure AND project.** On a first run, `--provider claude` writes
`claude` into `doors:` and projects it in the same run — the door, the skill,
the harness hooks. It used to stop at the config and end by telling you to load
a skill it had not installed. `mvac doors` re-runs that projection after you
edit `doors:` or `sdd:` by hand.

`agents` is not a `--provider` target. [agents.md](https://agents.md/) is the
open format every other door projects *from*, not a tool anyone could install,
and `AGENTS.md` is written unconditionally; naming it is accepted, adds nothing
to `doors:`, and still starts the `doors` run.

**The door `init` writes is the door `doors` writes** — one rendering,
built from the config, so it already names the declared SDD and its flow,
and the repos in the ecosystem. Running `mvac doors` straight after
`init --provider …` changes nothing, because `init` ran it — except for harness
settings the SDD's scaffold rewrote after the door was projected, which that
run merges over; after a plain `init` it writes `.multivac/flow.md`, which
`init` does not. It used to rewrite
the whole managed block, because `init` carried a second copy of the door that
had fallen behind the first.

What `init` itself writes, completely:

```txt
AGENTS.md                    the door — managed block only, never clobbered
.multivac/invariants.md      the law table, zero rows
.multivac/changes/           one file per ecosystem change (empty, .gitkeep)
.multivac/config.yml         the registry: repos, doors, adapters
.multivac/ritual.md          the closing ceremony, candidates all commented
.multivac/hooks/pre-commit   runs `mvac verify` on every commit
.multivac/hooks/pre-push     same, on push
.multivac/hooks/pre-merge-commit  same, on a local merge
.multivac/.gitignore         ignores .multivac/cache/ and .multivac/worktrees/
.multivac/projected.yml      the version that projected the doors, so drift can be told
.multivac/cache/             gitignored
```

plus `git init` when the directory is not already a repo root,
`core.hooksPath` pointed at `.multivac/hooks`, and the `.gitignore` negations
below when the repo's own ignore would hide a brain path. Where the repo
already sets its own `core.hooksPath` or has `.husky/`, the shims go into that
directory instead and `core.hooksPath` is left alone (*Existing hooks*, below).
`--provider` adds what `doors` projects — `.multivac/flow.md`, each door's
files, the skill and the harness hooks — and a declared SDD adds its own tool's
files.

Two things `init` checks before writing, because a green init that shipped
nothing is the failure mode it exists to prevent:

- **`git check-ignore` on the seven files a brain stands on:** `AGENTS.md`, the
  config, the law table, the ritual, `changes/.gitkeep` and the pre-commit and
  pre-push hooks; nothing else is asked about. A repo-level ignore that would
  swallow one (a `.gitignore` opening with `.*` swallows all of `.multivac/`)
  gets explicit negations appended under a marker comment — idempotently,
  printed line by line, then re-checked:

  ```txt
  init: this repo's .gitignore would ignore .multivac/config.yml, … — an invisible brain commits nothing
  init: appended to .gitignore: !.multivac/  !.multivac/**
  init: re-checked — every brain path is visible to git
  ```

- **Existing hooks.** A repo that already runs `.git/hooks/<name>`, a foreign
  `core.hooksPath`, `.husky/`, `lefthook.yml` or `.pre-commit-config.yaml`
  never gets silently disarmed: init chains the existing gate (it runs first,
  its exit code wins), or installs alongside into the repo's own hook dir,
  or refuses with the exact line to add — and says which strategy it used.
  See [Hooks](../hooks/).

  ```txt
  init: hooks in .multivac/hooks (core.hooksPath) — chained: .git/hooks/pre-commit runs first, its exit code wins, then verify
  ```

Without adapter flags, `init` probes for what is already on disk and writes
**commented proposals**, never enabled keys:

```yaml
doors: [agents]
# detected claude, cursor, gemini artifacts — to project the door there, use:
# doors: [agents, claude, cursor, gemini]
```

Re-running is safe and idempotent: an existing config is kept, an existing
`AGENTS.md` keeps everything outside the managed block, the hooks are
rewritten.

```txt
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
```

### Re-running it

Safe, and narrow in what it will do. Nothing is appended twice and nothing is
destroyed:

| what | on a re-run |
| --- | --- |
| `.multivac/config.yml` | **kept, never rewritten** — edit it directly, then `multivac doors` |
| `AGENTS.md` | the managed block is refreshed; your own content is untouched |
| `.multivac/invariants.md` | kept |
| `.multivac/ritual.md` | kept |
| `.multivac/.gitignore`, `changes/.gitkeep` | kept |
| an older brain layout | migrated, never clobbered |
| git hooks | reinstalled, never displacing the repo's own gates |

**An `--sdd` that disagrees with the config is refused**, because the config is
authoritative once it exists:

```txt
init refused — .multivac/config.yml already declares sdd: speckit and --sdd says opsx
  the config is authoritative on a re-run; a flag cannot change it, and init will not write a door that disagrees with it
  change it in .multivac/config.yml then run `multivac doors`, or drop --sdd
```

That refusal writes no brain file, though a `git init` of a directory that was
not yet a repo has already run. Before it existed, the config was kept and
the flag still won the door — so the door instructed the agent to follow a tool
the law did not declare, and nothing said so.

An `--sdd` that **agrees** is accepted and reported as redundant. One naming an
adapter the config declares none of is reported with how to make it stick,
never refused — nothing disagrees, and the config is only ever edited by hand.
`--provider` gets no such line: on a kept config it is not written, and the
`doors` run it starts projects only the doors the config already declares, so
add a door by editing `doors:` and running `multivac doors`.

**The door names what the config declares, and nothing else.** That
includes the case just above: an `--sdd` the config does not answer is reported
and does not reach the door, so `init` and `doors` never name different tools in
the same repo. They used to — `init --sdd speckit` on a config declaring no `sdd:`
wrote a door gating through speckit while reporting the flag as not in the
config, and the next `mvac doors`, reading the config alone, deleted the block
again:

```txt
$ mvac init --sdd speckit .
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
init:   --sdd speckit is not in it: add `sdd: speckit` there, then `multivac doors`
$ grep -c 'Features gate through' AGENTS.md
0
```

To make a flag stick, put the key in `.multivac/config.yml` and run
`multivac doors` — the two steps the report names.

## `seed [dir]`

```txt
$ mvac seed
seed: wrote .multivac/seed-report.md — 1 repo(s) inventoried, 1 skipped
seed: next — take the open questions to a maintainer, then draft proposed claims (see the multivac skill)
```

The deterministic half of session zero: an inventory of where each declared,
present repo's architecture lives, written to `.multivac/seed-report.md`.
Categories are pattern data, not code — policy gates (semgrep, pre-commit,
eslint/biome/ruff, CODEOWNERS), workspace / build graph (pnpm-workspace,
turbo, go.work, `.sln`/`.csproj`), deploy manifests (kubernetes, helm,
kustomize, skaffold), decisions / intent (ADRs, AGENTS.md, CONTRIBUTING),
models / schema, migrations, runtime config and the rest. Test fixtures,
`examples/` and vendored trees are excluded; each category lists at most 25
files plus a count. No LLM, no interpretation. Repos not on disk are listed
under a `skipped` section with the sync command; `seed` never clones.

The brain also gets a `### setup` section: whether the SDD's project document
is written, with the command that writes it. The document is the brain's, so it
is reported once — in the brain's own entry when the brain is also a code repo,
or in a `## brain` section of its own when it holds no code — and never for a
code repo. `seed` reads the vendor's files for this and never
runs a vendor.

Once a declared repo is on disk, the report carries three **open questions** —
debt or intent, law or taste, which authority wins — instantiated against the
gates, prose, deploy stacks and written project documents it found, then a
short `## next`. They are the interview's input: a maintainer answers them
before any proposed row becomes law. With no declared repo on disk there are
none, though `seed` still prints its line telling you to take them to a
maintainer.

Nothing it writes is law — the report says so in its own header. Your agent
reads it and drafts `proposed` rows. See
[Session zero](../../guide/session-zero).

## `verify [dir] [--strict] [--check] [--worktree] [--repo <key>] [--range <base>..<head> --branch <name>] [--quiet]`

The core. Checks every anchor in the brain against the declared repos.
Deterministic, offline, sub-second by design. `dir` defaults to `.` and may be
any directory of a checkout: the run reads the checkout that holds it — see
[Where a run roots](#where-a-run-roots).

```txt
$ mvac verify
4 claims · 4 anchored (100%)
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  read      web: origin/main @ 9f8e7d6 — the channel, as published (last fetch 2h ago) (this checkout is parked on wip/redesign @ 4d5e6f7, not read)
  read      docs: not on disk — nothing read; run `multivac repos sync`
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates

  ok          3
  unevaluated   1
  unevaluated INV-04 [present] .multivac/invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it
  enact     no row enacted in this commit — 3 staged paths, no row reached active

0 blocking broken · exit 0
```

Two of those lines are printed by **every** run, whatever the claims say — on
a quiet run as clauses of its one line. A `read` line per repo names the ref or
branch and its sha, so what was read is never inferred. And one `enact` line asks whether a row is enacted alone in the
commit being composed: a row reaching `active` beside the code it anchors is
refused, a row enacted alone is named, and when nothing is staged the line says
the question could not be asked rather than implying an answer.

```txt
  enact     INV-07 → active, alone in this commit — the row is reviewable on its own
  enact     not answered — nothing staged, so no commit is being composed; … reads the index against HEAD
```

Beside it, and from the same read, a `law` line asks the opposite question,
whether the commit removes law, because the law's death is gated the way its
birth is. A row that was law at HEAD, `active` or `retired`, and is gone from
the index refuses the commit, and so does an index that removes the law file.
Retiring a row is not death — it is the sanctioned way for a rule to stop
applying, and the retired row stays as its record — and a `proposed` row
disappearing is a reservation being given back, which `change close --abandon`
does by design. Neither is refused.

```txt
  law       REFUSED INV-07 was law and is gone · blocking — a row stops applying by being RETIRED, in the open, not by being deleted: set its state to retired and leave the row where a reader can find it
  law       REFUSED .multivac/invariants.md is removed by this commit · blocking — a brain with no law verifies nothing and says so in green. Restore it: git restore --staged --worktree -- .multivac/invariants.md
```

Four lines — `enact`, `config`, `law` and, outside a `--range`, `code` — read the
index the commit is being composed in, not the one on disk. The two differ:
measured on git 2.55, `git commit -a` composes in `.git/index.lock` and a
pathspec commit in `.git/next-index-NNN.lock`, so a check reading `.git/index`
answers about a commit nobody is making.

| flag | effect |
| --- | --- |
| `--strict` | every `broken` or `vacuous` leg of a row that is neither `proposed` nor `drift` exits 1, whatever its anchor mode, not just the blocking modes; a finished change that was not closed refuses the run; and where a consumer checkout reads the brain through its mount, the `code` line and the mounted brain's SDD refusal gate too. `strict_pre_push` arms it on the pre-push shim, which passes no `--range` and stages nothing itself, so there the `code` line judges only whatever happens to be staged at that moment. |
| `--check` | never writes: a `moved` leg is reported instead of self-healed. |
| `--worktree` | read every declared repo's **working tree** instead of its channel ref — local state across the whole ecosystem, on purpose. In a consumer checkout it is ignored with a warning: that run already reads the working tree. |
| `--repo <key>` | scope to one declared repo. **Only meaningful from a consumer repo** — from a brain it is ignored with a warning. |
| `--quiet` | one line when nothing is off; the whole report otherwise — see below. `MULTIVAC_QUIET=1` asks the same. |
| `--range <base>..<head>` and `--branch <name>` | the CI reader: judge the non-merge commits in the range, so a commit made with `--no-verify` is still caught. They go together: one without the other, or a range that is not `<base>..<head>`, exits 2. |

### `--quiet`: one line when nothing is off

A quiet run prints **one line** when every line of the report has a quiet
form, and the whole report, byte for byte, the moment anything is off:

```txt
$ mvac verify --quiet
0 blocking broken · exit 0 · 12 claims · 12 anchored (100%) · read api origin/main @ 1a2b3c4 (last fetch 2h ago), brain main @ abc1234 (working tree) · enact not answered (nothing staged)
```

The summary leads, so a reader or a script that looks for `<n> blocking broken
· exit <n>` at a line start finds it where the full report puts it. Then the
header, `unanchored: <ids>` when a claim has no anchor, each plain read with the
same ref or branch, sha and fetch age, the `enact` answer with its reason, and
`code → <slug>` when the commit's code lands in an open change. Last comes
`<keys> ignored (delete from .multivac/config.yml)` when the config still holds
a key an earlier release read. A consumer's line carries `brain at <dir>` and
`enact not answered (decided in the brain)`.

A read that is not plain — fell back, `--worktree`, off channel, parked, never
fetched here, behind its own channel, mid-merge, not on disk — prints its full
`read` line beneath the one line, and so does a `stale` pin that does not gate.
Everything else that is off prints the whole report, both streams in the order
they were written: a leg or count line other than `ok`, a finished change, a
gating stale pin, a staged law, an enactment or a refusal, any `config` line
but the dropped-key note, a mounted SDD refusal, the law's death, the pending and drift summaries, a `code`
line other than a clean landing, an open change file that does not parse, an
anchor naming no row, any warning, and a non-zero exit. The exit code is the
same either way.

Quiet is asked for, never inferred: `--quiet`; `MULTIVAC_QUIET=1` in the
environment, which the git hooks `doors` writes export, so a clean commit says
one line; or the harness's session-start hook (see
[hooks](../hooks#harness-hooks--the-early-ceiling)). A plain `mvac verify` stays
loud: read the `read` lines before you read the verdicts.

### What each run reads

**The brain verifies the ecosystem as published; a consumer verifies what it
is about to commit.** Two contexts, two scopes:

| run | what it reads | why |
| --- | --- | --- |
| **brain-scoped** (run anywhere in the brain's checkout) | each declared repo at its **channel ref** — `channel:` on the entry, else the global, else `origin/main` | the brain's law is about the state everyone shares. A teammate mid-task on a WIP branch in a sibling repo is not a violation |
| the **brain's own repo**, in the same run | its **working tree** | this is where the author is working, and the brain's law must gate the brain's own commit |
| **consumer-scoped** (run anywhere in a code repo's checkout, the brain mounted in it) | its **working tree** | that is the content about to be committed *there* |

Before this, every repo was read as a working tree, from everywhere. A
sibling parked on a branch turned the brain's law red for a reason that had
nothing to do with the ecosystem — and a gate that cries wolf gets stepped
over with `--no-verify`, which is the enforcement floor lost to a tool being
wrong.

**Every run says which bytes it read.** One `read` line per repo naming the
ref or the branch and its short sha — on a quiet run a plain read is a clause
of its one line, with the same ref, sha and age, and any other prints its
line in full; a checkout parked off its channel is named as such, so an
off-channel repo is legible rather than a silent premise behind a mysterious
verdict.

**A channel ref is a local snapshot, so its age is on the line.** `verify` never
touches the network: `origin/main` is whatever the last `mvac repos sync`
fetched, and a fix merged upstream an hour ago is simply not there yet. Without
the age, that reads as a red in the ecosystem instead of a stale ref on this
machine.

The brain's own repo gets the mirror of the same honesty. It is read as a
working tree on purpose — but a brain **behind** its own channel judges a
current ecosystem with an out-of-date law, which looks identical to a broken
ecosystem:

```txt
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates; 2 behind its own channel origin/main @ def5678 — an out-of-date law judges a current ecosystem
```

*Behind*, never merely *different*: working on a feature branch is off-channel
by construction, and a line that fires on every run stops being read.

A channel ref that cannot be resolved — no remote, or never fetched — falls
back to the working tree **and says so**. The meaning never changes in
silence:

```txt
  read      api: working tree on main @ 1a2b3c4 — channel origin/main does not resolve here (no remote, or never fetched) — FELL BACK to the working tree
```

`--worktree` asks for the old behaviour on purpose — local state across every
declared repo, for when that is genuinely the question:

```txt
$ mvac verify --worktree
  read      api: working tree on wip/refactor @ 4d5e6f7 — --worktree: local state, not the channel; OFF channel origin/main @ 1a2b3c4
```

Which branch each repo is parked on, and whether that is its channel, is also
a `doctor` line — see [`doctor`](#doctor---strict) below.

Per-leg states:

| state | meaning |
| --- | --- |
| `ok` | the leg holds |
| `moved` | a `present` leg with zero in-glob matches whose pattern turns up in exactly one other file of the include's own kind — the same trailing extension, never inside `.multivac/`: the glob is rewritten in place. A file of another kind — prose quoting the pattern — is never a target, and is named only when no file of the right kind has the pattern |
| `broken` | the leg's requirement fails where it was told to look |
| `vacuous` | the glob matched zero tracked files — the claim was passing by describing nothing |
| `unevaluated` | the leg's repo is declared but not on disk — counted, never red |
| `pending` | the claim is listed by an open `changes/<slug>.md`: it fails, and that change is holding it — never gating, never self-healed |
| `parse` | the anchor line does not parse |

Parse diagnostics print **above** the summary — the percentage never reads as
a headline over its own cause. And the summary names its rows: unanchored
claim ids are listed, not only counted:

```txt
$ mvac verify
5 claims · 3 anchored (60%)
  unanchored: INV-02, INV-05
```

### `drift`: a recorded finding that does not gate

A law-table row whose state column says `drift` records a **real,
not-yet-fixable finding**: its legs evaluate and report — the red stays
visible, and the summary names the ids — but they never gate, in any mode,
`--strict` included. Writing down a true finding must not make the repo
un-committable through the pre-commit hook; `drift` is the honest middle
between deleting the claim and living with a red exit.

```txt
  broken    INV-09 [absent] .multivac/invariants.md:31 · forbidden pattern at brain:docs/CONTRIBUTING.md:12 — delete it, or retire/amend the claim first · drift row — recorded finding, never blocks

0 blocking broken · exit 0
  drift: INV-09 — recorded finding, tracked in the law table, not gating; fix the code or retire the row to clear it
```

Every other row state keeps the exit matrix unchanged. Fix the code (the legs
turn `ok`, the summary line disappears) or retire the row; flip the state back
to `active` to make it gate again.

The message is the product, not the exit code:

```txt
  broken    INV-03 [absent] .multivac/invariants.md:10 · forbidden pattern at api:src/legacy.ts:1 — delete it, or retire/amend the claim first · blocking
  vacuous   INV-05 [present] .multivac/invariants.md:14 · glob matched no tracked files and /async[[:space:]]+function/ found nowhere — fix the glob or retire the claim · reported only — "present" is not in blocking: and this run is not --strict
  parse     .multivac/invariants.md:16 — \s is not POSIX ERE — use [[:space:]]
```

A glob that matches nothing tracked, but *would* match a file sitting on
disk, is not a bad glob — it is a file nobody added. In a working tree
`verify` says which, and never rewrites the glob for it:

```txt
  vacuous   INV-06 [present] .multivac/invariants.md:9 · file exists but is untracked — `git add src/loyalty.ts` · reported only — "present" is not in blocking: and this run is not --strict
```

A sibling read at its channel ref has no untracked side, so there the line
only says to fix the glob, as `INV-05` does above.

A claim an open change declares is held pending: it does not gate, and the
summary says who is holding it — exit 0 is the grace, silence is not:

```txt
0 blocking broken · exit 0
  1 claim held pending by open change points-expire — not gating; close or delete the change to unmask them
```

**A finished change is not a pending one.** That grace is for work not yet
written, so it ends where that stops being true: a change declaring at least
one claim, whose **every** declared claim resolves and whose **every**
declared repo is recorded `landed`, is finished — nothing is left but `close`,
and until somebody runs it every claim it holds stays unenforced. `--strict`
refuses the run and names the slug:

```txt
  finished  points-expire — every declared claim resolves and every declared repo is landed (3 claims whose failure this run would not gate); finished, not pending — close it: multivac change close points-expire · blocking

1 blocking broken · exit 1 · 1 finished change unclosed
```

When `close` would still refuse the change on what its claims cite — a claim
whose row states no rule yet, a claim anchored only in its change file — the
line never sends you to it: it names the first line close refuses on, and how
many more, before the command. The counts and the exit are the same:

```txt
  finished  points-expire — every declared claim resolves and every declared repo is landed (1 claim whose failure this run would not gate); finished, not pending — close refuses until: INV-02: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md — then: multivac change close points-expire · blocking
```

The line reads this checkout only: a brain behind its channel is named on the
read line, and the pull is `land`'s and `close`'s to say.

A default run prints the same line, ending `· reported only — this run is not
--strict`, and exits 0: a pre-commit hook is not
where you are told to go run another command. A change declaring no claims is
never finished — a universal over nothing is true of a change scaffolded
seconds ago — and a consumer-scoped run, `--repo` or not, reaches no verdict
at all, because it read a subset of the legs.

### Code lands in a change

When an SDD governs a declared repo and `sdd_auto` is on, code reaches that repo only
through the branch of an open change that declares it. "Code" is every path
outside what multivac, a door or an SDD own: `.multivac/**`, the door files,
the whole `.claude/` and `.cursor/` directories, the install directory of every
known SDD (`.specify/` and `openspec/`, project document included),
`.gitignore`, `.gitmodules`, the mount and `.husky/`, the directories a known
SDD's init writes for the doors the brain declares (`.agents/`, `.gemini/`,
`.opencode/`, `.devin/`, `.github/prompts/`, `.github/skills/`), the vendor's
own entries by name (`openspec-*`, `.openspec-*`, `opsx`, `opsx-*`) one or two
levels below any of those directories, declared or not, or below `.codex/` —
and every path the code-graph tools an earlier release set up wrote there, so
removing them commits on any branch. All of that holds in every repo. Spec-kit's
`specs/`, where its step artifacts go, is exempt only in a brain that declares
spec-kit: in a code repo it is code.

`verify` asks at three moments:

- **Commit.** The staged paths, against the checked-out branch.
- **Local merge.** The shim `pre-merge-commit` runs the same verify, and the
  branch is the ref being merged: git has not written `MERGE_HEAD` inside that
  hook, so it is read from the `merge <ref>` git exports as `GIT_REFLOG_ACTION`.
- **CI.** `--range <base>..<head> --branch <name>` judges the non-merge commits
  in the range, so a commit made with `--no-verify` is still caught.

```txt
  code      2 code paths (src/points.ts, src/expire.ts) lands in open change points-expire
  code      1 code path (src/points.ts) on main, which is no open change declaring api — start a change (`multivac change new <slug>`, then `change apply`) and commit on its branch · blocking
```

A `close-<slug>` branch is read where the change it archives is still open.
In a range, a branch that closed its own change is read from the archive: the
change is archived at the head and not at the base, so it was open inside the
range.
A consumer checkout reads the brain through its mount, which can lag the
change: there a branch that is no open change is refused only under `--strict`,
while a branch whose open change does not declare the repo is refused in any
run. A consumer's change worktree reads the brain itself, so its `code` line
gates as in a brain checkout. A range whose base is not in the clone is not
answered, and refuses under `--strict`.

The merge request job that makes this binding, for GitLab:

```yaml
verify-mr:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  variables:
    GIT_DEPTH: 0
  script:
    - mvac verify --strict --range "$CI_MERGE_REQUEST_DIFF_BASE_SHA..$CI_COMMIT_SHA" --branch "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME"
```

It binds only when the pipeline is required to pass and nobody can push to
the default branch. Those are forge settings, and `doctor` says so, because
they cannot be read from disk. The check proves the code went through a
change's branch. It never proves the change is about that code.

`--no-sdd` on `plan`, `apply` or `close` is recorded in the change file as
`sdd_skipped`, and `close` prints it.

### The exit matrix

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (by default `absent`, `count`, `each`) | **1** | **1** |
| broken or vacuous leg in a non-blocking mode (by default `present`, `unique`) | reported, **0** | **1** |
| `moved` — self-healed | **0** | **0** |
| `unevaluated` — repo not on disk | **0** | **0** |
| a leg belonging to a `proposed` row | **0** | **0** |
| a leg belonging to a `drift` row — recorded finding | **0** | **0** |
| a claim an open change declares (`pending`) | **0** | **0** |
| a **finished** change — every declared claim resolves, every declared repo landed | reported, **0** | **1** |
| anchor parse error, on any row — a `proposed` one included | **1** | **1** |
| `enact` refused — a row reaching `active` beside the code it anchors | **1** | **1** |
| `law` refused — the law file removed, or a row that was `active` or `retired` deleted | **1** | **1** |
| `config` edited with no change open (brain-scoped run) | **1** | **1** |
| `code` on a branch that is no open change declaring the repo, in a brain checkout or a consumer's change worktree | **1** | **1** |
| `code` on a branch whose open change does not declare the repo, in a consumer checkout | **1** | **1** |
| `code` on a branch that is no open change in the mounted brain, in a consumer checkout | **0** | **1** |
| a mounted brain's SDD refusal, in a consumer checkout | **0** | **1** |
| stale pin, `staleness: report` | **0** | **0** |
| stale pin, `staleness: block`, behind by a counted number of commits (brain-scoped run) | **1** | **1** |
| config invalid or missing | **2** | **2** |

The anchor mode decides whether a *leg* gates. The `enact`, `law`, `config`
and `code` lines gate whatever the modes say: the first three gate only in a
brain-scoped run, and `code` only where `sdd_auto` is on and an SDD governs the
repo, which in a brain checkout means the brain is itself a declared repo. The
blocking set is the `blocking:` key, default `[absent, count, each]`. Widening
it is allowed; dropping `absent` is refused.

### Self-healing

A `present` leg whose glob no longer matches, but whose content is found in
exactly one other file of the same kind — the include's own trailing
extension, never inside `.multivac/` — is a rename, not a broken claim. A file
of another kind is never a target; it is named only when no file of the right
kind has the content. `verify` rewrites the glob:

```txt
$ mvac verify --check
  moved     INV-01 [present] .multivac/invariants.md:6 · match moved to src/loyalty.ts — rerun without --check to rewrite the glob

$ mvac verify
  moved     INV-01 [present] .multivac/invariants.md:6 · glob rewritten to src/loyalty.ts — review the diff
```

The anchor line in `invariants.md` now reads `api:src/loyalty.ts`.
Review it like any other diff.

### Where a run roots

`verify` answers for the checkout that holds the directory it is asked from —
`[dir]`, or the working directory — and resolves that root before it reads any
config. From any directory of a checkout the verdict and the report are the
root's. In order:

1. **A brain** — the nearest `.multivac/config.yml` from the directory up to
   its git toplevel. A brain's subdirectory, a brain change worktree and a
   consumer's mount are all brains, judged brain-scoped with every brain gate.
2. **A consumer's change worktree** — a toplevel at
   `<brain>/.multivac/worktrees/<slug>/<key>` (below).
3. **A consumer through its mount** — the nearest directory below the
   toplevel whose child brain names it by its own `mount:` (a monorepo
   subproject holding its own `.brain`); else the toplevel's mount, `.brain`
   outright or a single child brain; else the one `.gitmodules` path below the
   first level whose brain names it (`mount: docs/brain`); else the directory's
   own child brain.
4. **A stale pin**, at the directory and then at the toplevel; then **a door**
   with no brain in reach (below).

The toplevel is asked with git's ambient repository pointers (`GIT_DIR`,
`GIT_INDEX_FILE` and their kin) dropped, so an inherited `GIT_DIR` never
answers for another repository. A report printed
away from its root names the root in one line after its header, because the
paths and commands in it are relative to that root. A symlinked path to the
root is the root:

```txt
$ cd src && mvac verify
12 claims · 12 anchored (100%)
  root      /home/you/brain (asked from src)
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates
…
```

A brain change worktree reads each sibling in the change's own worktree for
it, `<brain>/.multivac/worktrees/<slug>/<key>`, when that exists — found by key,
whatever path the brain declares — else where the main checkout reads it. A
sibling missing both ways says `` run `multivac repos sync` in <main checkout> ``,
never in the worktree. Inside a consumer's mount a missing sibling names the
host once and never advises `repos sync`, which typed there would clone the
ecosystem into the consumer:

```txt
  read      web: not on disk beside this mount — nothing read; verify in /home/you/api for its verdict, or from a brain checkout
```

Where nothing governs the directory, nothing is walked and no advice names
another directory; each of these exits 2:

```txt
/home/you/work is in no git repository — nothing was verified; the brain at /home/you/work/brain verifies from there
/home/you/notes is inside /home/you, which no brain governs — nothing was verified
/home/you/api/vendor/lib is a submodule of /home/you/api, which multivac verifies from there — nothing was verified here
git rev-parse --show-toplevel failed in /home/you/api: fatal: detected dubious ownership in repository at '/home/you/api'
```

The commands that do not root themselves — `seed`, `change` and `repos` —
refuse a missing `.multivac/config.yml` below a brain by naming the brain whose
checkout holds the directory, rather than advising an `init` that would create
a second brain inside it:

```txt
$ cd src && mvac change new points-expire "Points expire"
no .multivac/config.yml in /home/you/brain/src — it is inside the brain at /home/you/brain; run this there
```

### From a consumer repo

`verify` run anywhere in a code repo's checkout, with no `.multivac/config.yml`
between the directory and the toplevel, finds the brain mounted in it — `.brain`
wins outright — and scopes to that repo's anchors plus `*` anchors; from a
subdirectory the report adds its `root` line:

```txt
$ cd ../api && mvac verify
scoped to repo "api" · brain at /home/you/api/.brain
3 of 4 brain claims anchor into "api"
  read      api: working tree on wip/refactor @ 4d5e6f7 — this checkout, the content about to be committed here

  ok          3
  enact     not answered — .multivac/invariants.md is not in this checkout's index; … is decided in the brain

0 blocking broken · exit 0
```

A mounted brain whose config the brain itself would refuse — an SDD declaration
that resolves in no root, see [`sdd`](../configuration#sdd) — does not stop
this run. The mount can lag its brain, and the config is its owner's to fix, so
`verify` prints the refusal as one line and blocks on it only under `--strict`;
`count` prints the same line and counts:

```txt
  sdd       repos.web.sdd: opsx — REFUSED: the SDD lives in the brain alone, … — in the mounted brain's config; its owner fixes it
```

The repo key is resolved by matching the entry's path, its `url` against
`origin`, or the directory basename. Ambiguity is an error that says what to
pass; `--repo <key>` overrides it. Consumer mode never rewrites a moved
glob — the mount is usually a pinned submodule, so the heal belongs in the
brain checkout.

```txt
$ mvac verify --repo nope
--repo "nope" is not declared in the brain's config — declared: api, payments
```

A change worktree is found from its path first. `change apply` puts a
sibling repo's worktree at `<brain>/.multivac/worktrees/<slug>/<key>`, and the
brain mount inside it is a submodule nobody initialised. So in that checkout,
from any directory of it, `verify` takes the brain, the change and the key from
the path of its toplevel, and reads the brain itself, which does not lag the
way a pin can:

```txt
$ cd ~/eco/brain/.multivac/worktrees/points-expire/api && mvac verify
scoped to repo "api" · brain at /home/you/eco/brain (the change worktree for points-expire)
```

A mount that is present but is **not** a brain — an empty `.brain`/`.knowledge`
whose submodule was never initialised, or a pin that predates the brain's
`.multivac/` migration — is a stale pin, not a repo that needs `init`. `verify`
says so, and never advises `init` (which would scaffold a second brain beside
the mount). It exits **2**, an environment error: the hook that runs `verify`
refuses the commit until the submodule is updated or the pin fixed. Only those
two names are recognised, because the brain's own `mount:` lives in the config
the stale mount cannot supply: under another name the run answers as if there
were no mount, `init` hint included.

```txt
$ cd ../api && mvac verify
.knowledge is mounted but is not a multivac brain — its pin predates the brain, or points at the wrong commit. Update the submodule (git submodule update --remote .knowledge) or fix the pin.
```

A repo with no mount in reach at all splits two ways.

**If multivac put hooks there** — `doors` did, and the brain was never mounted —
there is no law to check the commit against. `verify` says nothing was checked,
names the fix, and exits **0**, so the repo's commits are not locked by hooks
that cannot work:

```txt
$ cd ../api && mvac verify
/home/you/api was NOT verified — it carries a multivac door but no brain is mounted here. Nothing in this checkout was checked against any law. Fix: run `multivac repos sync` in the brain, then commit the mount here.
```

This is the same thing the hooks already do on a machine where multivac is not
installed: warn loudly, let the commit through. It is recognised by the header
line in the hook script multivac wrote, so a hook of your own in
`.multivac/hooks/` does not count.

**Otherwise** — a repo multivac never touched — its toplevel gets the
`run multivac init .` hint, and exit 2; a directory below it is told that no
brain governs it, and a submodule of a governed repository is told which one
verifies it (see [Where a run roots](#where-a-run-roots)).

### Pin staleness

If a `channel` is declared, a brain-scoped `verify` compares each consumer's
brain-mount gitlink against it — offline, from refs already in the brain
checkout. A consumer-scoped run never does:

```txt
  stale     api: pin 12 behind origin/main · last fetch 3d ago — git -C ../api submodule update --remote .brain
```

With `staleness: block` the same line gains `blocking (staleness: block);`
and exits 1. Offline never guesses and never gates: a channel ref that does not
resolve locally prints nothing under the default `report`, and under `block`
one `stale?` line that only reports. A pin whose commit the brain checkout
does not have prints as `pin ? behind` and never gates either; a pin **ahead**
of the channel, in a commit the checkout does have, is not stale.

## `count '<repo>:<glob> [!<glob> ...] /<regex>/[i] [each|each!]' [dir]`

The ratchet dry-run: evaluates one anchor leg — same grammar, same POSIX-ERE
dialect, same picomatch globs, **the same parser and matcher verify runs**,
never a reimplementation — and prints the per-file breakdown plus the total a
`count=N` leg would see. Hand `git grep` counts differ from the real matcher
(dialect, glob set, per-statement SQL), so pin what `count` says, not what
grep said.

```txt
$ mvac count 'api:db/migrations/*.sql /balance/'
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  db/migrations/0001.sql  1
  db/migrations/0002.sql  1
2 matches in 2 tracked files — a ratchet pins count=2
for a rule that must hold in every file, use `each`; to forbid a pattern everywhere, `each!` — see `mvac help anchor`
```

Same bytes, too, not only the same parser: `count` resolves the repos it reads
through the function `verify` uses, so a sibling is read at its channel ref and
the brain at its working tree, and it prints the same `read` line per
repo. It roots the same way too, from any directory of a checkout: in a
consumer, or a consumer's change worktree, its own key is read as the
checkout's working tree, in the sentence `verify` prints there, and a repo
with a door but no brain in reach has nothing to count against, exit 2. It used to build its own handles with no ref — so it read working
trees while the gate read channels, and a number pinned from it could disagree
with the number that gates, with nothing on screen to explain the gap.

Dry-run only: writes nothing, exits 0 even at zero matches. A malformed spec,
a PCRE shorthand, an unknown repo key, or a repo that is declared but not on
disk (the answer names `repos sync`) is exit 2. Quote the
spec — it is one argument. `*` as the repo key counts across every declared
repo plus the brain, each file prefixed with its repo key.

The `count=N` summary ends with one line pointing you at the universal it
cannot express: a rule that must hold in every file is `each`, and forbidding
a pattern everywhere is `each!` (`see mvac help anchor`). `count=N` is a
deletion ratchet — it catches removal of an existing match, never a **new**
file that omits the pattern — so a "no file may contain X" or "every file
must contain X" property belongs in `each`/`each!`, not a pinned count.

```txt
$ mvac count 'api:k8s/*.yaml /limits:/'
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  k8s/api.yaml  1
  k8s/db.yaml  1
2 matches in 2 tracked files — a ratchet pins count=2
for a rule that must hold in every file, use `each`; to forbid a pattern everywhere, `each!` — see `mvac help anchor`
```

With a trailing `each` or `each!` the leg is the per-file universal, and the
breakdown changes to match: **every** file the glob matches is listed —
including the zero-match files the universal would fail on — and the summary
names the failing side (`3 of 5 tracked files match — each would fail on 2
files (the ones without a match)`; for `each!`, the ones **with** a match).
There is no ratchet line: `each` has no count to pin. Any other trailing mode
parses and is ignored: `count` tells `each` from the rest and nothing else.

## `doors`

Takes one flag, `--adopt`, and REFUSES anything else with exit 2: nothing after
`doors` is ignored.

| flag | effect |
| --- | --- |
| `--adopt` | re-project **and** record the version that did it in `.multivac/projected.yml`, which is what clears the notice that the binary and the projections have drifted. Bare `doors` re-projects and leaves the record alone, on purpose: people run `doors` after editing `doors:` or `sdd:`, and restamping there would make the notice vanish for a reason unrelated to the upgrade. |

```txt
$ mvac doors
brain: door + hooks updated
brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
api: door + hooks updated
api: notice: CLAUDE.md exists as a regular file — merge it into AGENTS.md and remove it to get the symlink
payments: notice: not found at ../payments — run `multivac repos sync` to clone it
ledger: not managed, read-only — nothing projected …
mounts     api: no brain mount at .brain — unverified there until `multivac repos sync`
```

Run from a subdirectory, `doors` projects the brain that holds it and says so
first, `root: <brain> (asked from <dir>)`.

For the brain and each declared repo on disk: writes the managed block in
`AGENTS.md`, projects each declared door target, installs the skill and harness
hook config where the target declares them, and writes the git hook shims with
`core.hooksPath` pointed at them — or, where the repo already has a hook
directory of its own, into that directory with `core.hooksPath` left alone.

A read-only repo — declared `managed: false`, or a shallow clone — gets none of
it, and one line says so. A door or hooks projected there before it became
read-only are left in place. Repos not on disk are reported and skipped, exit 0.
`doors` writes working trees — never commits, never clones. An invalid config
exits **1** here (not 2).

**It takes back what an earlier release wrote, and only that.** A post-edit
hook that refreshed a code graph, which an earlier multivac wrote into a
`.claude/settings.json`, is removed — that hook alone, and an entry it leaves
empty, never a hook it did not write — and so is the brain's generated
relations file, which nothing reads any more. Each is said once, and a second
run says neither:

```txt
brain: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph
brain: <relations file> removed — multivac no longer renders it; commit the removal
```

`doors --adopt` also prints `brain: adopted <version> — recorded in
.multivac/projected.yml`.

Commit the removal. What a vendor's own install wrote — its output directory,
skills, door section and hooks — stays until you remove it: `doctor` names it
with the removal, and the door warns where its skills or hooks still send an
agent to a graph nothing refreshes.

The hooks it installs read the law through the brain mount, and `doors` never
makes that mount — it does not touch the network. The `mounts` line names every
repo that was given hooks but has no mount for them to read; run
`multivac repos sync` to fix them. Per-target detail:
[Agent integrations](../integrations).

### `.multivac/flow.md` — what your declarations oblige

`doors` writes a page sorting this ecosystem's obligations into three groups:

- **Automatic** — multivac does it, you do not ask
- **Gate** — multivac refuses without it
- **Yours** — nobody can check these

Every row is *rendered* from the adapter registry and your config — the same
data the gates read — so it cannot describe behaviour the tool does not have. A
gate row leads with the command that refuses and names the artifact; an
unprovable step carries the adapter's own reason verbatim, because a paraphrase
would age beside its source.

**It cites no invariant identifier.** Ids are allocated from each brain's own
table, so one generated here would name a different rule, or none, in any other
ecosystem.

It is **derived**: rewritten whole on every projection, through the managed
block, so anything you write outside the markers survives. The ritual is the
opposite — authored, and never overwritten.

**It binds nothing**, and says so in its own header. The law binds; this
describes what the law and your declared adapters already do, for a reader who
has not read the table.

## `doctor [--strict]`

Read-only diagnosis. Never mutates, never clones. From a subdirectory it
reports the brain that holds it and names it first, `root      <brain> (asked
from <dir>)`; from a brain change worktree each sibling is the one the change's
own worktree or the main checkout holds, and a missing one's clone advice names
the main checkout.

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: AGENTS.md ok (read natively)
repos      2/3 cloned · brain: brain==code (this repo) · payments missing → `multivac repos sync` (git clone git@example.com:acme/payments.git ../payments)
branches   brain: on main @ abc1234 — brain==code, verify reads this working tree; 2 behind its own channel origin/main @ def5678 → git -C . pull · api: on wip/refactor @ 4d5e6f7 — OFF channel origin/main @ 1a2b3c4; verify reads the channel, not this tree · payments: not cloned
pins       api: no brain mount at .brain — run `multivac repos sync` to add it · payments: not cloned
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac on PATH)
enact      who enacts is not a fact on disk — multivac never fabricates git identity …, so an agent commits as the person … UNGATEABLE by design …, not an oversight; enforcement is the forge's merge button
law        118 anchors parse
untracked  nothing build-critical untracked
```

| line | reports |
| --- | --- |
| `doors` | one entry per declared target: file present, symlink correct, managed block present |
| `sdd` | the brain's SDD, which runs nowhere else: the tool's state — installed, missing, partial or unevaluable, with the reason, read from its own state file — binary, whether `sdd_auto` is on. When a code repo is declared and `sdd_auto` is on, one line names the repos whose code it governs and those exempt by `sdd: none`. A writable code repo still holding an install of any known SDD from an earlier release gets a `leftover` line — its state file, whether `HEAD` tracks it, and the removal — and never fails `doctor`. In an OpenSpec brain, the command bodies an earlier init left there are named on one line after the install line, with the `git rm -r` that removes the tracked ones and the untracked ones to delete, and never fail `doctor` (see [Command bodies an earlier init left](../sdd#command-bodies-an-earlier-init-left)). An enabled spec-kit preset that multivac's skeleton templates outrank is named, with the override to delete. Then: one `flow —` line per step of its own flow, each with the artifact that proves it (or why nothing can), one `gates —` line naming which lifecycle commands refuse and on what — or `not gated` under `sdd_auto: false` — and `project law @ brain:` for its project-level document — missing with the command that writes it, or present with its date against the law's newest row (STALE when the law moved and it did not). **Omitted entirely when the brain resolves no `sdd`**: a code repo's own install of a tool the brain declares nowhere is that team's, not a leftover |
| `config` | a config that does not load, with exit 1 (below); and, in a config an earlier release wrote, the code-graph keys it still declares — they load and are ignored — with how to delete them, a change open. That line never fails `doctor` |
| `leftover` | what an earlier release's code-graph setup left, in each root multivac may write in: the brain's generated relations file and each post-edit refresh hook it wrote into a `.claude/settings.json`, both of which `doors` removes; and each vendor install it finds there — its output directory, tracked, untracked or local, its ignore file, the platforms its skills and hooks were installed into, and a pre-install backup copy — with the vendor's own uninstall per platform, the paths to delete and the lines to drop from `.gitignore`, then commit. Read from files alone: it runs no vendor, never fails `doctor`, and says nothing of a read-only repo |
| `repos` | how many are present, the clone command for each that is not, and `<key>: not managed, read-only` or `<key>: shallow, read-only` for each repo multivac may not write in |
| `branches` | the branch each repo is parked on and its sha, and whether that **is** its channel — `= channel …`, `OFF channel … @ <sha>` (verify reads the channel, not that tree), or a channel that does not resolve there at all (verify falls back to the working tree). The brain==code entry says how far **behind** its own channel it is, if it is — an out-of-date law judging a current ecosystem is the one staleness the channel read cannot catch. The line that explains a `verify` result at a glance |
| `pins` | the brain mount in each consumer, and how far behind its channel it is. A mount that is staged and not yet committed says so, instead of calling itself missing. A read-only repo reads `<key>: not managed, read-only — no mount expected` (or `shallow`), since every fix there is a write |
| `hooks` | `core.hooksPath`, the commit and push shims, coexistence with the repo's own hooks (chained / alongside / not wired), and whether anything can actually run them |
| `forge` | printed when an SDD is declared and `sdd_auto` is on: code lands in a change only where the forge requires the merge request pipeline to run `verify --strict --range … --branch …` and nobody can push to the default branch. Ungateable from disk — multivac cannot read either setting |
| `layout` | printed alone, with exit 1, when the brain still has the layout from before `.multivac/`; `init` moves it |
| `enact` | printed on every run, and it reports an **absence**: who enacts a row is not a fact on disk. multivac never fabricates a git identity, and a hook runs with the caller's permissions, so a gate installed here is one the same process can skip. Ungateable by design rather than missing — the enforcement is the forge's merge button, held by an account the agent does not have. The half that IS checked — enactment landing in its own commit — is `verify`'s `enact` line, read from the index |
| `untracked` | brain paths a `.gitignore` swallows (WARNING — the law cannot ship), then untracked, non-ignored files that look build-critical |

**Installed is not enforcing.** The shims exit 0 when nothing on the machine
can run multivac, so `doctor` says which runner it found — or that there is
none:

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · INACTIVE — no runnable multivac, the shims verify nothing → install multivac (npm i -g multivac), or build it here (pnpm install && pnpm run build)
```

A file that a `package.json` script names, a config file at a repo root, or a
path an anchor's include glob covers — untracked and not ignored — builds
here and breaks on a fresh clone. `doctor` names them and never gates on
them:

```txt
untracked  WARNING 2 build-critical files untracked — git add or ignore: tsconfig.json (brain, root config), src/loyalty.ts (api, anchor glob)
```

Worse than untracked is **ignored**: a brain path a `.gitignore` swallows can
never ship, while `git add` stays silent. That is a WARNING with the fix:

```txt
untracked  WARNING 6 brain paths IGNORED by .gitignore — .multivac/config.yml, … — the law cannot ship; fix: run `multivac init .` (appends !.multivac/ negations to .gitignore) · nothing build-critical untracked
```

Bare `doctor` exits 0 in every degraded state above except an old `layout`; its
only other exit 1 is a config or law that does not load — detection of a
disarmed gate depends on a human reading the report.

**`doctor --strict` turns that report into an assertion.** It adds one
condition and otherwise prints the same thing.
It exits 1 when the enforcement gate is disarmed — a commit or push shim
missing, `core.hooksPath` not multivac's with no shim chained alongside, or no
runnable multivac so the shims no-op. Those two shims are all it reads: a
missing `pre-merge-commit` shim, the one that runs `verify` on a local merge,
leaves it green. Run it where a machine is being set up, or from
a session-start hook — it fails the moment the floor is down instead of
staying quiet while nothing is enforced:

```txt
$ git config --unset core.hooksPath && mvac doctor --strict; echo $?
…
hooks      core.hooksPath unset → git config core.hooksPath .multivac/hooks · pre-commit installed · pre-push installed · active (mvac on PATH)
…
strict     FAIL — the enforcement gate is not armed; a commit here is not verified (see hooks above)
1
```

Invalid config/law stays exit 1 under both — the `law` line names the anchors
that do not parse, and bare `doctor` exits 1 for them:

```txt
$ mvac doctor; echo $?
…
law        invalid — 1 anchor do not parse: .multivac/invariants.md:5 — missing or malformed /regex/ — <!-- @anchor <CLAIM-ID> <repo>:<glob> …
…
1
```

Bare `doctor` never gates on a disarmed gate — it only describes it.

## `repos` / `repos sync [--shallow]`

```txt
$ mvac repos
api          cloned   ../api
payments     missing  ../payments  (git@example.com:acme/payments.git)
ledger       cloned   ../ledger — not managed, read-only
scratch      invalid  ../scratch — ../scratch exists but is not a git repository
```

Each repo is `cloned` only when its path is its own git repository with a
commit, and, where a `url` is declared, a remote matching it. A plain
directory, a directory inside another repository, a repository with no commit
and a clone of another remote are `invalid`, with what is wrong. `repos check`,
`doctor` and `change` count the same way.

A repo declared `managed: false`, or whose clone is shallow, is marked
read-only: multivac reads, verifies and fetches it, and never writes there.

`repos` and `repos list` are the same thing. `repos sync` clones every
declared-but-missing repo that has a `url`, and fetches every path already on
disk, an `invalid` one included, which it never clones over:

```txt
$ mvac repos sync
api: present at ../api — fetched
api: brain mounted at .brain
payments: cloned git@example.com:acme/payments.git -> ../payments
payments: mounted the brain at .brain — staged in ../payments, commit it there (multivac does not commit in your repos)
```

The fetch is what keeps `verify` honest: a brain-scoped run reads each sibling
at its channel ref, and that ref is a **local** remote-tracking snapshot —
`verify` never touches the network, so it is only as fresh as the last
`repos sync`. The `stale?` line, printed under `staleness: block` when the
channel ref is unknown locally, names this command because `sync` is what
fetches it. A pin that is
behind the channel names `git submodule update --remote` instead: `repos sync`
fetches and never moves a pin, so only the submodule update clears that line.

`--shallow` adds `--depth 1` — fine for verify-only machines, not enough for
`change`, which needs to branch. A shallow clone is read-only until
`git fetch --unshallow`: nothing is scaffolded, built or projected there, no
gate judges it, and a change naming it is refused. The clone line says so:

```txt
payments: cloned git@example.com:acme/payments.git -> ../payments (shallow) — read-only: multivac will not write there
```

A clone that fails is named, never retried silently, and exits 1:

```txt
payments: auth failed cloning git@example.com:acme/payments.git — fix your ssh key/token for this host, then re-run `multivac repos sync` (no retry was attempted)
```

A *fetch* that fails reports and never gates — offline, say, still leaves a
usable if older ref, and `verify`'s `read` line carries its age. The line gives
git's own first `fatal:` line after `could not fetch:` (its last line of
stderr when it printed no `fatal:`), says the channel ref stays as last fetched, and names the `git -C <path> fetch` that retries it.

### `repos check`

Answers one question for every declared repo, offline and with no vendor tool
installed: is it the clone the config declares and, where multivac may write,
is it set up?

```txt
$ mvac repos check
brain     ok   cloned · speckit installed and committed · .specify/memory/constitution.md written
api       ok   cloned; leftover speckit install (tracked)
payments  FAIL absent at ../payments → `multivac repos sync`
ledger    ok   cloned — not managed, read-only: its tools are not checked
```

A repo passes when its path exists, is a git repository of its own (not a
folder inside another one), has a commit, and has a remote matching its `url:`
if it declares one. Where multivac may write, the brain also needs:

- the declared SDD installed and its state file committed,
- its project document written (not missing, empty or still the template).

The SDD is the brain's alone, so a code repo is never asked for it. Where the
brain declares one, a code repo that still holds an install from an earlier
release gets `; leftover <tool> install` on its line, tracked or not, and
passes or fails exactly as it would without it; `doctor` names the removal.

A repo you do not own is checked for its clone alone. Exit 0 when every repo
passes, 1 when one does not, 2 for an invalid config.

In CI, `multivac repos sync --shallow && multivac repos check` needs no vendor
tool once the brain's SDD install is committed: a shallow clone is read-only, so
only its clone is checked.

`change plan` and `change apply` refuse a repo they name whose directory is
there but is not that clone, before anything is cloned, branched or bumped.

### The brain's SDD

`repos sync` also installs the declared SDD in the brain: the tool's own init,
where it has never run there. The SDD reaches no code repo — its specs are
written in the brain — and a brain where it is installed runs nothing, which is
why `repos sync --shallow` on a CI machine needs no vendor tool once the install
is committed. Under `sdd_auto: false` it installs nothing and says nothing of
the SDD, so `repos check` keeps failing on the missing install until you run the
tool's own init in the brain yourself.

A tool it would run and cannot find is named with where to get it, and the run
exits 1.

What the tool writes is left in the brain's working tree, uncommitted.

### The brain mount

`repos sync` also makes sure every repo it finds on disk has the brain mounted,
because the hooks `doors` installs there read the law through that mount. It is
a reconciliation, not a one-off setup step: a repo you declare today and a repo
you declared months ago get the same check on every run, and whatever is out of
line gets fixed.

```txt
$ mvac repos sync
api: present at ../api — fetched
api: brain mounted at .brain
payments: cloned git@example.com:acme/payments.git -> ../payments
payments: mounted the brain at .brain — staged in ../payments, commit it there (multivac does not commit in your repos)
web: present at ../web — fetched
web: filled the empty brain mount at .brain
```

| what it finds | what it does |
| --- | --- |
| no gitlink at `mount` | adds the brain as a submodule from [`brain_url`](../configuration/#brain_url). A directory that is already a clone of the brain is adopted, with no download |
| a gitlink, but the directory is empty | fills it (`git submodule update --init`) — what a consumer cloned without `--recurse-submodules` looks like |
| a gitlink whose directory has files but is not a brain | nothing; reports it. That is a pin older than the brain, or one someone moved, and updating it is your call |
| a gitlink staged and not committed | nothing; tells you to commit it |
| a gitlink whose recorded url is not `brain_url` | nothing; reports the difference and the `git submodule set-url` that would change it. A consumer may point at a fork on purpose |
| a read-only repo | nothing; says no mount is expected there |
| the brain itself | nothing |

**It never commits.** The mount is left staged in each consumer, for whoever
owns that repo to review and commit.

**It needs `brain_url`.** Without it no mount is made, and the missing key is
named once. multivac does not take the brain's own `origin` instead — see
[`brain_url`](../configuration/#brain_url) for why.

A mount git refuses is reported by cause, the other repos still sync, and the
run exits 1:

```txt
web: could not mount the brain at .brain — fatal: '.brain' already exists and is not a valid git repo
```

An unknown subcommand exits 2:

```txt
unknown subcommand "pull" — usage: multivac repos [sync [--shallow] | check]
```

## `roadmap [add <slug> "<title>"] [--horizon now|next|later] | sync`

The changes that have not started yet. With no arguments it lists them; with
`add` it records one.

```txt
$ mvac roadmap
roadmap: 2 planned
  now
    tracker-projects-the-roadmap — Issues and boards from the change files
  later
    ci-checks-every-repo — One CI job per declared repo
in flight: 1 open change — points-expire
```

Horizons print in the order `now`, `next`, `later`, nearest first. Slugs are
ordered by codepoint within a horizon — never by locale, which would make the
listing's order a property of the machine that printed it. A horizon holding
nothing is omitted rather than printed empty. The `in flight:` line counts open
changes separately, so intention is never read as progress. From a subdirectory
it lists the brain that holds it, after one line naming it: `root: <brain>
(asked from <dir>)`.

An empty roadmap says so, and names the command that fills it:

```txt
roadmap: empty — record an intention with `multivac roadmap add <slug> "<title>"`
in flight: no open change
```

A change file that will not parse is skipped by the listing rather than
crashing it: a broken change file is `change`'s diagnostic to raise, and a
roadmap that will not print because one entry is malformed is worse than one
line short.

### `add <slug> "<title>" [--horizon now|next|later]`

Writes `.multivac/changes/<slug>.md` in the `planned` state and commits it.
If git refuses the commit, `add` prints `could not commit the bookkeeping`
with the command to run by hand, leaves the file staged, and still exits **0**.
It reserves no invariant id, creates no branch and creates no worktree — the
id is allocated when the change starts, because one spent on work that never
happens is a hole in the law table no later change can fill.

```txt
$ mvac roadmap add tracker-projects-the-roadmap "Issues and boards from the change files"
committed: roadmap: tracker-projects-the-roadmap planned (later)
recorded .multivac/changes/tracker-projects-the-roadmap.md — planned, horizon later
  no invariant id is reserved until it starts: multivac change new tracker-projects-the-roadmap
```

`--horizon` defaults to `later`, so nothing becomes urgent by omission. It
applies to `add` only: the listing refuses it, and `sync` ignores a known
value.

Refusals name the state found and the command that moves forward. The first
three exit **1**; an unknown horizon exits **2**, and so does `--horizon` on a
listing, which shows every horizon:

```txt
<slug> is already planned — see it with `multivac roadmap`, or start it with `multivac change new <slug>`
<slug> is already open — it started; nothing to record
<slug> is already archived at .multivac/changes/archive/<slug>.md — this change is closed; start a new one with a new slug, or read it there
roadmap: unknown horizon "someday" — use now, next, later
roadmap: --horizon applies to `roadmap add` — the listing shows every horizon
```

`roadmap sync` projects the roadmap to the declared `tracker`. With none
declared it prints `sync: no tracker declared` and the keys to add, and exits
**0**; a tracker multivac has not verified exits **1**.

A brain whose SDD takes a narrower slug refuses the rest with exit **2**,
recording nothing — for OpenSpec, where the printed line also names the
release it was measured on:

```txt
roadmap add: `Fix_Auth`: the brain's SDD takes no such slug — openspec … `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`
```

### `sync`

Projects the change files to the declared tracker. **One way, always**: the
change files are the source, and nothing the tracker says ever reaches them.
A title edited by hand is put back by the next sync, and an issue closed by
hand stays closed — sync never reopens one.

```txt
sync gitlab: 3 changes to project
  planned  tracker-projects-the-roadmap → #41 created
  open     the-consumer-door-carries-the-ecosystem → #42 up to date
  archived the-gate-runs-what-you-built → #40 closed
recorded 1 issue number in .multivac/changes/ — commit them: the number is the identity
```

The **number** recorded in the change file is the identity. It survives a title
edit — which is what breaks the alternative of searching the tracker for a
matching title — and it is a number rather than a link because the project comes
from the repo's remote.

It only ever adds a label, `multivac::planned` or `multivac::open` by the
change's state, and removes none: labels a team set by hand survive, and so
does a status the change has since moved past. One wiped triage is enough to
have a projection turned off permanently.

An absent `glab` or `gh` **refuses**: a projection that cannot run must not
report success. A create the tool fails — not signed in, no remote — is said on
that change's line, `could not be created; nothing recorded`, and the run still
exits **0**. A recorded number whose issue is gone is reported, never silently
re-created.

One issue per change. Story-level issues are the stated intent and are not built
yet — they need a second reader of the SDD tool's task list.

### The roadmap is never a gate

No command refuses an operation because its subject was not recorded first.
There is no flag to require it and no configuration key to turn it on:
requiring a plan is unverifiable intent, the same category the ritual belongs
to, and the law carries an `absent` leg over `src/`, so the refusal cannot be
introduced without `verify` failing.

Starting a planned change is [`change new`](#new), which promotes the file that
is already there. Every later step refuses one that has not started, after any
SDD gate it runs first — with an SDD declared, `plan` and `apply` refuse for
the missing artifact before they reach this line:

```txt
<slug> is planned, not started — start it first: multivac change new <slug>
```

## `change <sub> <slug> [args]`

```txt
$ mvac change
multivac change <sub> <slug> [args]
  new "<title>"          scaffold .multivac/changes/<slug>.md + reserve the next invariant id (one commit)
  new <slug> "<title>"   same, with an explicit slug
  plan <slug>            resolve repos, landing graph, reserve declared ids, claims
  apply <slug>           worktree per repo (greenfield repos get created)
  land <slug>            landing-order report; --landed <repo> records a merge
  close <slug>           verify claims, archive the change, print .multivac/ritual.md
flags: --no-sdd (skip the SDD steps AND their gates), --landed <repo> (land only),
       --abandon (close only: drop a change that landed nothing, give its id back)
```

Exactly three flags, all listed above. `change` reads the same shared refusal
every other command reads, so an unknown flag, a single-dash token and a surplus
positional all exit 2:

```txt
change: unknown flag "--force" — change takes <sub> <slug> ["<title>"], --no-sdd, --landed <repo>, --abandon
change: unexpected argument "api" — change takes <sub> <slug> ["<title>"], --no-sdd, --landed <repo>, --abandon
```

The second line is `change land <slug> api`, meaning `--landed api`. It used to
exit **0** having recorded nothing.

A slug starts with a letter or digit and goes on with letters, digits, dots,
dashes or underscores. `change new "points expire"` derives `points-expire`. A brain whose SDD takes a narrower slug refuses the
rest before anything is written, whatever `sdd_auto` and `--no-sdd` say, since
the change outlives both — `change new` with exit 1, `roadmap add` with exit 2.
OpenSpec takes lowercase letters and digits in runs joined by single hyphens,
and reserves `archive`; the printed line names the openspec release it was
measured on where this page writes `…`, since the site's pages carry no version
string:

```txt
`Fix_Auth`: the brain's SDD takes no such slug — openspec … `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`; `multivac change new "<title>"` derives one
```

### `new`

On a slug that `roadmap add` already recorded, `new` promotes that file instead
of writing a second one and prints `promoted … — planned since it was recorded,
now open`; the title is ignored. On a slug already archived it refuses and
exits **1**.

```txt
$ mvac change new "points expire"
committed: change open: points-expire — reserves INV-02
created .multivac/changes/points-expire.md — declare repos, landing_order, invariants, claims
reserved INV-02 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [INV-02]                           # the rows close verifies; each states its rule
```

A claim is its row's ID: the row states the rule, and the change file cites
it. A legacy `{ id, statement }` claim still parses and is written back
unchanged; nothing creates one.

Refuses to overwrite an existing change file (exit 1). It also takes the next
free invariant ID out of the law table and writes it straight back as a
`proposed` row naming this change — never pick an ID by hand. A `proposed` row
never gates `verify`, and `close` releases the reservation if the change never
used it — used meaning the rule was stated in place of the scaffolded RESERVED
text, or an anchor names the ID. Then, if the brain declares an `sdd` and
`sdd_auto` is on, it says where the change's reasoning goes, prints the SDD
steps bound to the `new` point — each with the artifact it will be checked for
— and, once after the last, the instruction to run them through:

```txt
sdd speckit: the why, the design and the tasks go into its files — the change body keeps what it held while planned, or one sentence, and `change close` cites the directory; do not cite it yourself
sdd speckit: run /speckit.specify in your agent to write the spec for points-expire — … [proof: specs/<n>-points-expire/spec.md — `change plan` refuses without it]
sdd speckit: run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers [ungateable: …]
sdd speckit: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

Before it writes anything, `new` refuses, with exit 1, when that SDD's own
init would have to run in the brain and the tool cannot be found: every step it
prints needs that tool. It names where to get the tool, and `--no-sdd` skips it
for one run.

`plan`, `apply` and `close` **refuse** while those
artifacts are missing; see
[SDD tools](/docs/reference/sdd/#the-gate-what-the-tool-really-produces).

The scaffolded declaration and the reserved row land as **one commit on the
current branch** (message `change open: <slug> — reserves <ID>`, or
`change promoted: <slug> — reserves <ID>` for a planned one): the shared tree
stays clean, pulls are never blocked on lifecycle edits, and a concurrent `new`
reads the committed table. A tree already dirty at the two bookkeeping paths is
refused with the exact command that unblocks it:

```txt
cannot open points-expire — bookkeeping paths are untracked or modified: .multivac/invariants.md
  commit them first: git -C /home/you/brain add -- .multivac/invariants.md && git commit
  then re-run: multivac change new points-expire "points expire"
```

#### A brain behind its channel

`new` and `apply` report any declared repo whose pin is behind its channel,
ahead of the work they do. `apply` runs its SDD gate first, and a refusal there
ends the run before the report:

```txt
brain pins behind their channel — refresh before deciding against the law:
  stale     api: pin 3 behind origin/main · last fetch 6d ago — git -C ../api submodule update --remote .brain
```

It **reports and never refuses**. Offline, a pin behind its channel means
somebody landed work *or* nobody fetched, and those are indistinguishable from
here; refusing on the second reading would fail an ordinary morning.
`staleness: block` still makes [`verify`](#verify-dir---strict---check---worktree---repo-key---range-basehead---branch-name---quiet)
exit 1 exactly where it always did.

The read is offline, so it says what was last fetched, never what exists
remotely — which is why a `stale` line carries the fetch age, and why a channel
ref that does not resolve locally is never guessed at: it prints nothing under
the default `report`, and one `stale?` line that only reports under `block`.

It runs before the bookkeeping commit, so the pin it names is the one you
arrived with rather than one the command just created.

### `plan`

Resolves what the change declared: which repos exist, what gets cloned, what
gets created greenfield, the landing graph, and which invariants and claims
are still missing.

```txt
$ mvac change plan points-expire
api: /home/you/api
payments: missing at /home/you/payments, no url — greenfield; `change apply points-expire` creates it
landing order:
  stage 1: api
  stage 2: payments
invariant INV-01: active
invariant INV-07: reserved — proposed row in .multivac/invariants.md; state the rule before close
claim INV-07: no anchor — add <!-- @anchor INV-07 <repo>:<glob> /<regex>/ --> before close
```

A change declaring no repos exits 1. A repo not declared in the config is
named and exits 1. `plan` **does** clone a repo the change names that is
missing and has a `url`; one declared `managed: false` is refused first, and
nothing is cloned.

What `close` will refuse on the declaration itself is said here, where it is
cheapest to fix, and gates nothing — a claim of no row, of a short row, of a
retired row the change does not retire, of a row the change neither adds,
touches nor retires, or of a row another change reserved. A legacy claim
statement is named as a restatement, and kept:

```txt
claim NOPE-1: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim — close refuses this
claim INV-03: its statement: restates the row — kept as written; a claim is its ID, and the row states the rule (…)
```

A row that states no rule yet is the ordinary state of a change at `plan`, and
a retiring row is retired later: `close` asks those, `plan` does not.

A change may name `brain`. Where no `repos:` entry is the brain, it holds no
code, and `plan` names it as the brain:

```txt
brain: /home/you/brain (the brain)
```

Where an entry is the brain, the line reads `(brain==code)` and the brain's
code lands through the change like any repo's.

With an SDD declared in the brain, `plan` also gates on the `new` point's
artifacts, then prints the `plan` point's steps. For spec-kit it first points
`.specify/feature.json` at this slug's directory — the tool keeps one pointer
per checkout, and two open changes would otherwise plan into each other's — and
says so when it named another. For a change that names a code repo it says
where the code goes — said of the steps printed at `plan`, which run in the
brain checkout before `apply` carries the slug's directory:

```txt
sdd speckit: .specify/feature.json named specs/002-beta; it names specs/001-points-expire now
sdd speckit: its steps run from the brain checkout, which holds no code of this change — tasks name code paths under .multivac/worktrees/<slug>/<repo>/, and code is written only there
```

### `apply`

```txt
$ mvac change apply points-expire
committed: change apply: points-expire — status branched
payments: created /home/you/payments — git init, door written, first commit
api: branched points-expire from main 58383ca — local main is ahead of origin/main
api: worktree /home/you/brain/.multivac/worktrees/points-expire/api
payments: branched points-expire from main 3105b42 — no origin/main known locally
payments: worktree /home/you/brain/.multivac/worktrees/points-expire/payments
work here — one checkout per repo, nobody else's tree moves:
  api: /home/you/brain/.multivac/worktrees/points-expire/api
  payments: /home/you/brain/.multivac/worktrees/points-expire/payments
then commit on branch points-expire and run `multivac change land points-expire`
```

One **worktree** per declared repo, at
`<brain>/.multivac/worktrees/<slug>/<repo>` — gitignored, and printed because
that is where the work happens. The shared checkout never moves: another agent
may be running another change in the same repo, and a working tree switched
under them puts their edits on your branch. `close` removes the worktrees.

The branch under it is based on the **newer of the default branch and
its remote-tracking ref** — decided offline, by ancestry, from refs git
already has; the sha and the reason are printed because a silent base is a
guess you cannot audit. Which branch is the default is what git already
knows: `origin/HEAD`, then `init.defaultBranch`, then `main`, then `master`,
and only with none of them `HEAD` — which says whose branch it is building on:

```txt
api: branched points-expire from HEAD 0d41a9c — no default branch found — branching from the checked-out branch somebodys-work; its commits come along
```

A repo with nothing on disk is cloned when it has a `url` and created
greenfield when it has none — `git init`, consumer door, first commit. Each repo's
status is bumped to `branched` in the change file. Then the SDD `apply` step.

Where git cannot make a worktree — an older git, a branch already checked out
elsewhere, an `add` that fails for any reason — apply says so and branches in
place instead:

```txt
api: no worktree available — branching in place
```

The change's bookkeeping — the declaration file, the reserved row, the status
bump — is **committed before any branch is made** (`committed: change apply:
<slug> — status branched`), so every checkout apply hands back inherits it
from the base; nothing rides across a switch uncommitted. Where apply
branches in place, anything **else** uncommitted in that tree is refused by
name, with the command that parks it:

```txt
api: cannot branch points-expire — /home/you/api carries uncommitted work: notes.md
  apply will not switch it to points-expire under another change
  commit it, or park it: git -C /home/you/api stash push -- notes.md
  then re-run: multivac change apply points-expire
```

The change's SDD files are carried onto its branch when it has one to carry
them to. Only the brain holds SDD files, so that is a change naming the brain's
own entry — a brain that is its own code repo. Before the bump, `apply` selects
the uncommitted files under the SDD's shared paths and under this change's
artifact directories. It refuses a tracked, modified one or an ignored one by
name. After the worktree exists, it copies the rest in, commits them there, and
removes them from the checkout:

```txt
brain: carried 3 speckit files onto points-expire and committed them there
```

For spec-kit it writes the worktree's own `.specify/feature.json`; where the
directory stayed in the checkout — a brain with no code — it points the
checkout's instead, and says so when it named another. The gates of `plan`,
`apply` and `close` look for the SDD's artifacts in the brain checkout, then in
the change's worktree named after the brain's own entry — except a step printed
at `land`, which runs after the merge, so its proof is read in the brain
checkout alone and one found only in the worktree is refused by name. In a
brain with no code, the spec directory stays in the checkout until `close`
commits it. OpenSpec's apply step runs where `openspec/changes/<slug>/` now is,
which its printed line says.

An existing branch is reused, not a failure:

```txt
api: branch points-expire already exists — switched to it, reusing
```

#### What can be worked at once

When the ready stage holds more than one repo, `apply` says so:

```txt
these two are one stage: no ordering between them, and one checkout each — work them at once
  never the same file twice at once (a lost update), and never the law: ids are reserved one at a time and stages serialise there
```

Nothing is inferred: repos in one stage of `landing_order` are your own
statement that they have no ordering dependency, and the checkouts above are the
isolation that makes concurrent edits safe. Later stages are not named — they
are blocked by an earlier one.

The boundaries ride with the line every time, because they are its useful half.
It is printed and never checked: no artifact proves an agent ran two things at
once.

### `land`

Reports the landing graph and records merges. `--landed <repo>` marks one
repo landed — refused if its stage is still blocked by an earlier one.

For a ready repo `land` prints the push and the merge request, and commits
nothing on the change branch: what lands is what you committed there.

```txt
$ mvac change land points-expire
stage 1 [ready] api:branched
  api: git -C /home/you/api push -u origin points-expire
  api: open MR points-expire -> main (state the landing order in the description)
  api: once merged: multivac change land points-expire --landed api
stage 2 [blocked] payments:branched
  waiting on an earlier stage — do not push yet
```

```txt
$ mvac change land points-expire --landed api
api: recorded as landed — points-expire is merged into main 330cc3b
committed: change land: points-expire — api landed
stage 1 [landed] api:landed
stage 2 [ready] payments:branched
  payments: git -C /home/you/payments push -u origin points-expire
  payments: open MR points-expire -> main (state the landing order in the description)
  payments: once merged: multivac change land points-expire --landed payments
```

`land` prints commands; it never pushes and never opens a merge request.
`land --landed <repo>` is the one form that writes: it records the statement in
the change file and commits that as `change land: <slug> — <repo> landed`.

**`--landed` records what you tell it, and says what it could check.** The
evidence is local and offline: the change branch contained in the default
branch, which has moved past it. A squash, or a merge that only happened on
the remote, leaves no local trace — so the absence is reported, never a
refusal:

```txt
api: recorded as landed — no local merge commit to confirm it (points-expire is not contained in main here); normal for an MR merged on the remote, or squashed
```

**Landing is also read from the channel**, which the squash cannot destroy.
`land` evaluates the change's declared claims against the brain's channel ref:
if they resolve against what `origin` published, the work is published,
however it got there. That verdict is per **change**, not per repo — one
evaluation against one ref, and a `*` leg belongs to no single repo — so it
prints under its own `channel:` label, never behind the repo key `--landed`
names:

```txt
$ mvac change land points-expire
channel: every declared claim resolves at origin/main 330cc3b (last fetch 2h ago) — the work is published there, however it got in — record it: multivac change land points-expire --landed <repo>
```

The read **offers** the conclusion; it never writes the record. A channel ref
is only as true as the last fetch, so the negative says both things it can mean,
and published content proves publication rather than authorship:

```txt
channel: not every declared claim resolves at origin/main 330cc3b (never fetched here) — not landed, or not fetched: `multivac repos sync`, then re-read
```

A channel that does not resolve at all says that too, rather than going quiet:

```txt
channel: origin/main does not resolve here (no remote, or never fetched) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read
```

Recording the last repo arms `verify --strict`, and `land` says so — CI runs
that gate on the channel, so a change left open turns main red:

```txt
every repo is now landed — once every declared claim resolves, `verify --strict` refuses points-expire as unclosed …, here and in CI, until: multivac change close points-expire
```

At that moment it also says what `close` would refuse on what the claims cite
— one line each, after the armed line — and the last line names them instead
of a bare `change close`. A row the brain's channel already states and this
checkout lacks is named as a pull, never as a second statement:

```txt
  close refuses until: INV-02: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md
all stages landed — fix the line close refuses on above, then: multivac change close points-expire
```

```txt
  close refuses until: INV-02: its row states no rule here, but origin/main states it (2 commit(s) this checkout lacks) — pull, then re-run close
```

With nothing to refuse, the last line stays
`` all stages landed — run `multivac change close points-expire` ``. The
brain's channel is its own `repos:` entry's `channel:`, else the global
`channel:`, else `origin/main` — the ref the `channel:` line, the pull and
`verify`'s read line all read.

A repo with no `origin` is told to land locally instead of to push:

```txt
  payments: no origin remote — land locally: git -C /home/you/payments switch main && git merge --no-ff points-expire
```

### `close`

The gate. Refuses a change that declared no repos, or that names one the config
does not — the same two refusals `plan` and `apply` make, because a door that
is weaker than the two before it is not a gate:

```txt
$ mvac change close points-expire
.multivac/changes/points-expire.md declares no repos — declare them, then re-run close
  repos: { <key>: { status: landed } }   # every repo this change touched
  or give the reservation back: multivac change close points-expire --abandon
```

Refuses while any repo is unlanded:

```txt
$ mvac change close points-expire
api: branched — land every stage first (multivac change land points-expire)
payments: branched — land every stage first (multivac change land points-expire)
```

Then re-verifies **only the claims this change declared**, and refuses if any
is not green:

```txt
INV-07: no anchors evaluated — add an anchor for the claim, then re-run close
claims are not green — close refused; fix the red claims, then re-run close
```

**And refuses a claim that cites nothing.** A claim is its row's ID, so the row
is the only place its rule is written. Before anything is written, staged,
archived or released, `close` checks what each claim cites and names, per
claim, the first of: no row; a row short of its six columns; a retired row the
change does not retire; a row under `invariants.retires` not yet retired; a row
the change neither adds, touches nor retires; a row another change reserved
and has not stated; a row that states no rule yet; a claim anchored only in the
change file it archives. It also refuses a row under `adds` already in the law,
and a proposed row the change owns that an anchor names and no claim cites.

The red claims and the citation lines come in one run. The orphan line — a
claim anchored only in the change file — is checked only once every claim is
green, so it can take a second `close` to show. A claim of no row is named
once, by its citation line, and never evaluated against anchors:

```txt
INV-07: no anchors evaluated — add an anchor for the claim, then re-run close
INV-05: ok
claims are not green — close refused; fix the red claims, then re-run close
NOPE-99: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim
INV-05: claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under invariants.touches if this change amends that row
claims do not cite the law this change makes — close refused; fix the lines above, then re-run close
```

A row the brain's channel already states — merged on the forge, fetched, not
pulled — is named as a pull, never as a second statement; the channel is read
offline, and only on such a refusal:

```txt
INV-01: its row states no rule here, but origin/main states it (2 commit(s) this checkout lacks) — pull, then re-run close
```

A rule the change states and nothing anchors still enters the law — coverage
below one hundred percent is supported — and `close` says so without refusing:

```txt
INV-02: enters the law stated but unanchored — nothing verifies it; claim and anchor it to have close verify it
```

A legacy claim that still carries its `statement:` is told to move it into the
row when the row states nothing yet. `verify`'s finished line, the last `land`
and `plan` say what this gate will refuse before you get here.

Green: with an SDD declared, `close` prints no step to run — OpenSpec's
`archive` is printed at `land` — only the gate's own lines and
`sdd <tool>: close — this tool has no agent-run close step; nothing to run`.
It refuses until OpenSpec's archive exists and, for either tool, while the task
list it reads (OpenSpec's archived `tasks.md`, spec-kit's own) still has an
unchecked `- [ ]`. The change file moves to `.multivac/changes/archive/`, the
worktrees are removed, and the ritual is printed — its lines in file order,
indented, without its headings, comments or blank lines. The sample declares no
SDD, so it shows none of those lines.

```txt
$ mvac change close points-expire
INV-07: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C /home/you/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Archive the points-expire change" (no origin remote — the direct commit is the landing)
api: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/api)
payments: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/payments)

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

A worktree is removed when it holds nothing uncommitted; one that does is kept,
with the command that removes it.

#### `--abandon`

The other ending. `change new` reserves an invariant id before anything is
declared, so a change you drop before it touches a repo can never satisfy the
gates above — and `close` is the only thing that gives a reservation back.
Without a door, an abandoned change leaks its id forever, or you write a false
`status: landed` to get through:

```txt
$ mvac change close points-expire --abandon
INV-07
abandoned -> .multivac/changes/archive/points-expire.md — nothing was verified; nothing landed
commit it: git -C /home/you/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Abandon the points-expire change"
```

Nothing is verified, on purpose: an abandoned change made no claims to verify.
A change that *did* declare claims is refused — drop them first, or close it
properly. So is a change whose own proposed row states a rule: abandoning it
would enter that rule as a proposal nobody verified. A row still reading
RESERVED is what `--abandon` gives back, and never refuses:

```txt
INV-07: states a rule this abandoned change never verified — delete the row from .multivac/invariants.md (a proposed row may be removed), or close the change properly
```

The printed commit — closing or abandoning — is **scoped to the closing
change's paths**: the archived file, the old change path, the law table, and
what the declared SDD wrote in the brain for this slug, whatever `sdd_auto` and
`--no-sdd` say: the spec, the plan, the task list, an archived proposal,
deletions included, and each main spec an archive merged into that carries the
merge — one that does not, such as after an archive made without merging, is
named dirty and not staged. Every gate in the lifecycle demanded one of those
files, so leaving them untracked would be asking for proof and then dropping
it; the switches skip steps and gates, never what was already written. A dirty
file of the tool's that this change did not write — a project document, the
tool's own config — is named on its own line and never staged. The printed
commit is never `add -A`, which in a shared checkout would sweep another
change's files into this archive commit.

Before the archive is written, the change body gains one line citing the
slug's directory — the first one found in the brain checkout, then in the
change's worktree — unless the body already names it. Nothing else in the body
is written:

```txt
Specified in `specs/001-points-expire/` (speckit).
```

With the automation on and no `--no-sdd`, a close that finds no directory says
it cited nothing.

Where the commit `close` prints lands depends on where the brain is standing,
and the wording says which case you are in:

- on a working branch: `archived — commit this on <branch> (it lands through
  that branch's MR): git -C <brain> add -- <paths> && git commit -m "..."`
- on the trunk of a brain **with** a remote, nothing lands directly — the
  recipe is branch + MR:

  ```txt
  archived — commit this on a branch; nothing lands on main directly:
    git -C /home/you/brain switch -c close-points-expire && git add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Archive the points-expire change" && git push -u origin close-points-expire
    then open MR close-points-expire -> main
  ```

- a solo brain with **no** origin remote is told the direct commit IS the
  landing (the sample above) — there is no MR to open.

`--abandon` has no such cases: it always prints the plain `commit it:` line,
and says `ALREADY LANDED: <repos> — that work stays landed` where its sample
says `nothing landed` if a repo had already landed.

The archive is a rename in the working tree like any other edit, so `close`
names the commit that stores it rather than leaving it to be noticed later.

A change with no claims says so and archives:
`no claims declared — nothing to verify`. An empty or absent ritual prints
nothing. Full walkthrough: [Running changes](../../guide/running-changes).

## `help [topic|command]`

The on-ramp. `mvac help anchor` prints the anchor grammar on one screen — the
line format, the POSIX-ERE-only dialect with the `\s`/`\d`/`\w`/`\b`
replacements, per-line matching (per-statement for `.sql`), `count=N` as a
deletion ratchet across the whole glob, `each`/`each!` as the per-file
universal that names its failing files, the one-include-glob rule (braces for
alternatives), repo-qualified exclusions, and where anchors may live. `mvac
help <command>` prints that command's usage; bare `mvac help` lists the topics
and the commands.

## Exit codes

| code | meaning |
| --- | --- |
| **0** | ok — including these degraded states: unevaluated repos, absent adapters, missing repos in `verify` and the `repos` listing, unsupported door targets, non-blocking broken legs. Not every degraded state: a brain mount that is not a brain exits 2 (below) |
| **1** | a check failed or a gate refused: blocking leg broken/vacuous, anchor parse error, stale pin under `staleness: block` (brain-scoped run), `close` before every repo landed, a claim not green, a clone that failed, `repos check` finding a repo absent or not set up, `repos sync` unable to find a declared SDD tool, invalid config **in `doors`, `doctor` and `init`**, a disarmed enforcement gate under **`doctor --strict`**. The other lines `verify` refuses on are in [the exit matrix](#the-exit-matrix) |
| **2** | usage or environment: no command, unknown command, **an argument most commands do not declare** — a flag or a positional — unknown subcommand, missing or invalid `.multivac/config.yml` (except in `doors`, `doctor` and `init`, which exit 1, in the `roadmap` listing, which reads none, and in `roadmap add`, which goes on without it), a mount that is not a brain. The refusal names the argument and states what the command takes, and comes before the command does anything. |

Most commands take what they declare and refuse the rest. `mvac doctor --sttrict`
used to run the report without the assertion and exit 0; `mvac doctor /other/repo`
used to report on the working directory, because `doctor` declares no directory
and the argument was discarded. Both refuse now. What each command declares is
its `--help`, and that is the list the refusal is measured against.

Four things are accepted and do nothing. `mvac help` ignores arguments after
its topic, so `mvac help anchor junk` prints the grammar and exits 0. On
`change`, `--landed <repo>` is read only by `land` and `--abandon` only by
`close`: `--landed` and `--abandon` are declared flags, so another subcommand
accepts them and ignores them. On `repos`, `--shallow` is read only by `sync`.
On `roadmap`, `--horizon` is read only by `add`: the listing refuses it, and
`sync` ignores a known value. An unknown value is refused on every subcommand.

```txt
$ mvac doctor --sttrict
doctor: unknown flag "--sttrict" — doctor takes --strict
```

```txt
$ mvac frobnicate
unknown command "frobnicate" — run `multivac --help` for the list
```

```txt
$ mvac verify --loud
unknown flag "--loud" — verify takes [dir], --strict, --check, --worktree, --repo <key>, --range <base>..<head>, --branch <name>, --quiet
```

```txt
$ mvac verify
no .multivac/config.yml in /home/you/somewhere — run `multivac init .` to create it
```

Below a brain, the same refusal names it instead; below a repository no brain
governs, `verify` says so. Outside any repository it says so only when a brain
sits in a child directory, and otherwise gives the advice above — see
[Where a run roots](#where-a-run-roots):

```txt
$ mvac change new points-expire "Points expire"
no .multivac/config.yml in /home/you/brain/src — it is inside the brain at /home/you/brain; run this there
$ mvac verify
/home/you/notes is inside /home/you, which no brain governs — nothing was verified
```
