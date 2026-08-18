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
  repos      list declared repos; `repos sync [--shallow]` clones the missing, fetches the rest
  change     new/plan/apply/land/close — the ecosystem change lifecycle
  roadmap    the changes that have not started yet — list them, record one
  help       help <topic|command> — `help anchor` prints the anchor grammar on one screen
```

**Arguments are parsed by [citty](https://github.com/unjs/citty), and refused
by multivac.** Each command declares what it takes once, as data; citty parses
that declaration and the refusal below reads the same one, so adding a flag is
one edit. The refusal is not delegated: measured, citty parses an undeclared
flag into a key nobody declared and hands it over, which is precisely the
silence MV-85 exists to end — so the check runs first, and the parser never
sees an argument the command did not declare. `--help` stays this tool's own
(MV-69); citty's generated usage is not used.

Two global flags: `--help` / `-h` prints the block above and exits 0;
`--version` / `-v` prints the version and exits 0. Running `mvac` with no
arguments prints the same usage and exits **2**.

**`--help` is an answer, never an action.** On any subcommand, `--help` or
`-h` anywhere in the arguments is answered by the dispatcher **before the
command runs**: usage on stdout, exit 0, no side effect on the tree.
`mvac seed --help` prints what seed would do; it never writes a seed report.

**The LLM boundary:** every command here is deterministic. No model call, no
API key, and `verify`, `doctor` and `doors` never touch the network. `seed`
and the interview only draft what a human then enacts; the drafting agent is
yours, not multivac's.

## `init [dir] [--provider a,b] [--sdd name] [--grapher name] [--quiet]`

Scaffolds the brain in `dir` (default `.`).

```txt
$ mvac init . --provider claude,cursor --grapher graphify
  ╭───────────────╮
  │  ●   ●   ○    │   multivac
  │  ○   ◍   ●    │   brain-driven development
  ╰───────────────╯

init: git init — the brain is git-native
init: wrote .multivac/config.yml — declare your repos under repos:
init: wrote AGENTS.md — the door; your agent reads it first
init: wrote .multivac/invariants.md — the law table, zero rows
init: wrote .multivac/ritual.md — empty; what you write there, `change close` prints
init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit
brain: door + hooks updated

init: done — the brain is scaffolded and empty. Session zero fills it:
init:   1. load the multivac skill in your agent — it carries both protocols
init:   2. interview — no code here yet, so the law comes from a human, claim by claim
init:   3. a human enacts each row in .multivac/invariants.md, then `multivac verify`
```

On a terminal the report is dim and the `init: done` line is acid — the
scaffolding lines are a receipt, the call to action is the only thing you
have to act on. Piped output and `NO_COLOR` get the same text with no ANSI.

The last three lines are the call to action, and step 2 is decided, not
asked: run `init` where tracked source already exists and step 2 reads
`discovery — multivac seed inventories this code, then draft proposed claims
from it` instead. Code to read means discovery; an empty repo means
the law has to come out of a human. Both protocols live in the skill —
`init` points at them and restates neither.

| flag | takes | effect |
| --- | --- | --- |
| `--provider a,b` | comma-separated registry names | appended to `doors:` in the config (`agents` is always included) |
| `--sdd name` | `opsx` \| `speckit` | written as `sdd:` in the config |
| `--grapher name` | any tool name | written as `grapher:` in the config |
| `--quiet` | — | no report, no banner; refusals still go to stderr |

The banner is the mark: lit lamps are verified claims, unlit ones unanchored,
the acid one the claim in flight. The pattern is a fixed drawing, never a
reading — `init` runs before there is anything to verify. `init` is the only
command that prints it; `verify`, `doctor`, `doors` and `change` run inside
git and harness hooks, where it would be noise. It is skipped when stdout is
not a terminal, and `NO_COLOR` keeps the drawing while dropping the colour
(`#` lit, `.` unlit, `*` in flight).

Both `--flag value` and `--flag=value` work, and parse to the same value
(MV-105). A flag with no value, or an unknown flag, is refused:

```txt
init: unknown flag --providers — known: --provider <a,b>, --sdd <name>, --grapher <name>, --quiet
```

A valued flag whose value is missing — or whose value is itself a flag — is
refused too, rather than binding the next token or an empty string:

```txt
--repo needs a value — verify takes [dir], --strict, --check, --worktree, --repo <key>
```

The equals form is for long names only. A short alias is not split by the
parser, so `-r=api` would bind the value `"=api"`; it is refused as an unknown
flag rather than accepted as a form that does not work.

**Flags configure AND project.** `--provider claude` writes `claude` into
`doors:` and projects it in the same run — the door, the skill, the harness
hooks. It used to stop at the config and end by telling you to load a skill it
had not installed. `mvac doors` re-runs that projection after you edit
`doors:` or `grapher:` by hand.

`agents` is never a `--provider` value. [agents.md](https://agents.md/) is the
open format every other door projects *from*, not a tool anyone could install,
and `AGENTS.md` is written unconditionally.

**The door `init` writes is the door `doors` writes** (MV-102) — one rendering,
built from the config, so it already names the declared grapher and its query
verbs, the declared SDD and its flow, and the repos in the ecosystem. Running
`mvac doors` straight after `init` changes nothing. It used to rewrite the whole
managed block, because `init` carried a second copy of the door that had never
learned about the graph.

Side effects, completely:

```txt
AGENTS.md                    the door — managed block only, never clobbered
.multivac/invariants.md      the law table, zero rows
.multivac/changes/           one file per ecosystem change (empty, .gitkeep)
.multivac/config.yml         the registry: repos, doors, adapters
.multivac/ritual.md          the closing ceremony, empty
.multivac/hooks/pre-commit   runs `mvac verify` on every commit
.multivac/hooks/pre-push     same, on push
.multivac/.gitignore         ignores .multivac/cache/ and .multivac/worktrees/
.multivac/cache/             gitignored
```

plus `git init` when the directory is not already a repo root, and
`core.hooksPath` pointed at `.multivac/hooks`.

Two things `init` checks before writing, because a green init that shipped
nothing is the failure mode it exists to prevent:

- **`git check-ignore` on every path it writes.** A repo-level ignore that
  would swallow one (a `.gitignore` opening with `.*` swallows all of
  `.multivac/`) gets explicit negations appended under a marker comment —
  idempotently, printed line by line, then re-checked:

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

### Re-running it (MV-91)

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

**A flag that disagrees with the config is refused**, because the config is
authoritative once it exists:

```txt
init refused — .multivac/config.yml already declares sdd: speckit and --sdd says opsx
  the config is authoritative on a re-run; a flag cannot change it, and init will not write a door that disagrees with it
  change it in .multivac/config.yml then run `multivac doors`, or drop --sdd
```

Nothing is written by that refusal. Before it existed, the config was kept and
the flag still won the door — so the door instructed the agent to follow a tool
the law did not declare, and nothing said so.

A flag that **agrees** is accepted and reported as redundant. A flag naming an
adapter the config declares none of is reported with how to make it stick,
never refused — nothing disagrees, and the config is only ever edited by hand.

**The door names what the config declares, and nothing else** (MV-101). That
includes the case just above: a flag the config does not answer is reported and
does not reach the door, so `init` and `doors` never name different tools in the
same repo. They used to — `init --sdd speckit` on a config declaring no `sdd:`
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

The report ends with three **open questions** — debt or intent, law or
taste, which authority wins — instantiated against the gates, prose and
deploy stacks it found. They are the interview's input: a maintainer answers
them before any proposed row becomes law.

Nothing it writes is law — the report says so in its own header. Your agent
reads it and drafts `proposed` rows. See
[Session zero](../../guide/session-zero).

## `verify [dir] [--strict] [--check] [--worktree] [--repo <key>]`

The core. Checks every anchor in the brain against the declared repos.
Deterministic, offline, sub-second by design. `dir` defaults to `.`.

```txt
$ mvac verify
4 claims · 4 anchored (100%)
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  read      web: origin/main @ 9f8e7d6 — the channel, as published (last fetch 2h ago) (this checkout is parked on wip/redesign @ 4d5e6f7, not read)
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates

  ok          3
  unevaluated   1
  unevaluated INV-04 [present] .multivac/invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it
  enact     no row enacted in this commit — 3 staged paths, no row reached active

0 blocking broken · exit 0
```

Two of those lines are printed by **every** run, whatever the claims say. A
`read` line per repo names the ref or branch and its sha, so what was read is
never inferred. And one `enact` line answers MV-81's question about the commit
being composed: a row reaching `active` beside the code it anchors is refused,
a row enacted alone is named, and when nothing is staged the line says the
question could not be asked rather than implying an answer.

```txt
  enact     MV-91 → active, alone in this commit — the row is reviewable on its own
  enact     not answered — nothing staged, so no commit is being composed; MV-81's check reads the index against HEAD
```

| flag | effect |
| --- | --- |
| `--strict` | broken `present`/`unique` legs join the gating set and exit 1 too, not just the tombstones. Armed on the pre-push shim by `strict_pre_push`. |
| `--check` | never writes: a `moved` leg is reported instead of self-healed. |
| `--worktree` | read every declared repo's **working tree** instead of its channel ref — local state across the whole ecosystem, on purpose. |
| `--repo <key>` | scope to one declared repo. **Only meaningful from a consumer repo** — from a brain it is ignored with a warning. |

### What each run reads (MV-53)

**The brain verifies the ecosystem as published; a consumer verifies what it
is about to commit.** Two contexts, two scopes:

| run | what it reads | why |
| --- | --- | --- |
| **brain-scoped** (cwd is the brain) | each declared repo at its **channel ref** — `channel:` on the entry, else the global, else `origin/main` | the brain's law is about the state everyone shares. A teammate mid-task on a WIP branch in a sibling repo is not a violation |
| the **brain's own repo**, in the same run | its **working tree** | this is where the author is working, and the brain's law must gate the brain's own commit |
| **consumer-scoped** (cwd is a code repo with the brain mounted) | its **working tree** | that is the content about to be committed *there* |

Before this, every repo was read as a working tree, from everywhere. A
sibling parked on a branch turned the brain's law red for a reason that had
nothing to do with the ecosystem — and a gate that cries wolf gets stepped
over with `--no-verify`, which is the enforcement floor lost to a tool being
wrong.

**Every run says which bytes it read.** One `read` line per repo naming the
ref or the branch and its short sha; a checkout parked off its channel is
named as such, so an off-channel repo is legible rather than a silent premise
behind a mysterious verdict.

**A channel ref is a local snapshot, so its age is on the line** (MV-54).
`verify` never touches the network: `origin/main` is whatever the last
`mvac repos sync` fetched, and a fix merged upstream an hour ago is simply not
there yet. Without the age, that reads as a red in the ecosystem instead of a
stale ref on this machine.

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
a `doctor` line — see [`doctor`](#doctor) below.

Per-leg states:

| state | meaning |
| --- | --- |
| `ok` | the leg holds |
| `moved` | a `present` leg with zero in-glob matches and exactly one match elsewhere: the glob is rewritten in place |
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
  broken    INV-09 [absent] .multivac/invariants.md:31 · forbidden pattern at docs/CONTRIBUTING.md:12 — delete it, or retire/amend the claim first · drift row — recorded finding, never blocks

0 blocking broken · exit 0
  drift: INV-09 — recorded finding, tracked in the law table, not gating; fix the code or retire the row to clear it
```

Every other row state keeps the exit matrix unchanged. Fix the code (the legs
turn `ok`, the summary line disappears) or retire the row; flip the state back
to `active` to make it gate again.

The message is the product, not the exit code:

```txt
broken    INV-03 [absent] .multivac/invariants.md:10 · forbidden pattern at api:src/legacy.ts:1 — delete it, or retire/amend the claim first
vacuous   INV-05 [present] .multivac/invariants.md:14 · glob matched no tracked files and /async[[:space:]]+function/ found nowhere — fix the glob or retire the claim
parse     .multivac/invariants.md:16 — \s is not POSIX ERE — use [[:space:]]
```

A glob that matches nothing tracked, but *would* match a file sitting on
disk, is not a bad glob — it is a file nobody added. `verify` says which, and
never rewrites the glob for it:

```txt
vacuous   INV-06 [present] .multivac/invariants.md:9 · file exists but is untracked — `git add src/loyalty.ts` · reported only — "present" is not in blocking: and this run is not --strict
```

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

The default policy prints the same line and exits 0: a pre-commit hook is not
where you are told to go run another command. A change declaring no claims is
never finished — a universal over nothing is true of a change scaffolded
seconds ago — and a `--repo`-scoped run reaches no verdict at all, because it
read a subset of the legs.

### The exit matrix

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (`absent`, `count`, `each`) | **1** | **1** |
| broken `present` / `unique` | reported, **0** | **1** |
| `moved` — self-healed | **0** | **0** |
| `unevaluated` — repo not on disk | **0** | **0** |
| a leg belonging to a `proposed` row | **0** | **0** |
| a leg belonging to a `drift` row — recorded finding | **0** | **0** |
| a claim an open change declares (`pending`) | **0** | **0** |
| a **finished** change — every declared claim resolves, every declared repo landed | reported, **0** | **1** |
| anchor parse error | **1** | **1** |
| stale pin, `staleness: report` | **0** | **0** |
| stale pin, `staleness: block` | **1** | **1** |
| config invalid or missing | **2** | **2** |

The blocking set is the `blocking:` key, default `[absent, count, each]`.
Widening it is allowed; dropping `absent` is refused.

### Self-healing

A `present` leg whose glob no longer matches, but whose content is found in
exactly one other file, is a rename — not a broken claim. `verify` rewrites
the glob:

```txt
$ mvac verify --check
  moved     INV-01 [present] .multivac/invariants.md:6 · match moved to src/loyalty.ts — rerun without --check to rewrite the glob

$ mvac verify
  moved     INV-01 [present] .multivac/invariants.md:6 · glob rewritten to src/loyalty.ts — review the diff
```

The anchor line in `invariants.md` now reads `api:src/loyalty.ts`.
Review it like any other diff.

### From a consumer repo

`verify` run in a repo with no `.multivac/config.yml` looks for a mounted
brain in a direct child directory — `.brain` wins outright — and scopes to
that repo's anchors plus `*` anchors:

```txt
$ cd ../api && mvac verify
scoped to repo "api" · brain at /home/you/api/.brain
4 claims · 3 anchored (75%)
  read      api: working tree on wip/refactor @ 4d5e6f7 — this checkout, the content about to be committed here

  ok          3

0 blocking broken · exit 0
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

A mount that is present but is **not** a brain — an empty `.brain`/`.knowledge`
whose submodule was never initialised, or a pin that predates the brain's
`.multivac/` migration — is a stale pin, not a repo that needs `init`. `verify`
says so, and never advises `init` (which would scaffold a second brain beside
the mount):

```txt
$ cd ../api && mvac verify
.knowledge is mounted but is not a multivac brain — its pin predates the brain, or points at the wrong commit. Update the submodule (git submodule update --remote .knowledge) or fix the pin.
```

Only a repo with no mount in reach at all gets the `run multivac init .` hint.

### Pin staleness

If a `channel` is declared, `verify` compares each consumer's brain-mount
gitlink against it — offline, from refs already in the brain checkout:

```txt
  stale     api: pin 12 behind origin/main · last fetch 3d ago — run `multivac repos sync`
```

With `staleness: block` the same line gains `blocking (staleness: block);`
and exits 1. A channel ref that does not resolve locally reports either way:
offline never guesses and never gates. A pin **ahead** of the channel is not
stale.

## `count '<repo>:<glob> [!<glob> ...] /<regex>/[i]' [dir]`

The ratchet dry-run: evaluates one anchor leg — same grammar, same POSIX-ERE
dialect, same picomatch globs, **the same parser and matcher verify runs**,
never a reimplementation — and prints the per-file breakdown plus the total a
`count=N` leg would see. Hand `git grep` counts differ from the real matcher
(dialect, glob set, per-statement SQL), so pin what `count` says, not what
grep said.

```txt
$ mvac count 'api:db/migrations/*.sql /balance/'
  db/migrations/0001.sql  1
  db/migrations/0002.sql  1
2 matches in 2 tracked files — a ratchet pins count=2
```

Dry-run only: writes nothing, exits 0 even at zero matches. A malformed spec,
a PCRE shorthand, or an unknown repo key is a usage answer, exit 2. Quote the
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
There is no ratchet line: `each` has no count to pin.

## `doors`

Takes **no flags.** Anything after `doors` is ignored.

```txt
$ mvac doors
brain: door + hooks updated
api: door + hooks updated
api: notice: CLAUDE.md exists as a regular file — merge it into AGENTS.md and remove it to get the symlink
payments: notice: not found at ../payments — run `multivac repos sync` to clone it
```

For the brain and every declared repo present on disk: writes the managed
block in `AGENTS.md`, projects each declared door target, installs the skill
and harness hook config where the target declares them, and writes the git
hook shims plus `core.hooksPath`.

Repos not on disk are reported and skipped, exit 0. `doors` writes working
trees — never commits, never clones. An invalid config exits **1** here (not
2). Per-target detail: [Agent integrations](../integrations).

### `.multivac/flow.md` — what your declarations oblige (MV-96)

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

Read-only diagnosis. Never mutates, never clones.

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: .cursor/rules/multivac.mdc ok
grapher    graphify @ brain: artifact missing → run `graphify update .` there
grapher    graphify @ api: artifact missing → run `graphify update .` there
repos      1/2 present · payments missing → `multivac repos sync` (git clone git@example.com:acme/payments.git ../payments)
branches   brain: on main @ abc1234 — brain==code, verify reads this working tree; 2 behind its own channel origin/main @ def5678 → git -C . pull · api: on wip/refactor @ 4d5e6f7 — OFF channel origin/main @ 1a2b3c4; verify reads the channel, not this tree · payments: not cloned
pins       api: no brain mount at .brain — add the brain as a gitlink (git submodule add <brain-url> .brain) · payments: not cloned
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac on PATH)
enact      who enacts is not a fact on disk — multivac never fabricates git identity (MV-04), so an agent commits as the person … UNGATEABLE by design (MV-81), not an oversight; enforcement is the forge's merge button
untracked  nothing build-critical untracked
```

| line | reports |
| --- | --- |
| `doors` | one entry per declared target: file present, symlink correct, managed block present |
| `sdd` | one line per scope (brain + each present repo, the same shape `grapher` uses): artifact, binary, whether `sdd_auto` is on — a repo with `sdd: none` says it is out of scope rather than lacking anything. Then, once per tool: one `flow —` line per step of its own flow, each with the artifact that proves it (or why nothing can), one `gates —` line naming which lifecycle commands refuse and on what, and `project law @ <scope>:` per scope for its project-level document — missing with the command that writes it, or present with its date against the law's newest row (STALE when the law moved and it did not). **Omitted entirely when no `sdd` is declared anywhere** |
| `grapher` | one line per scope (brain + each present repo): artifact, binary, freshness. Then one `refresh path:` line naming what actually keeps the graph current — the harness post-edit hook where one is installed, `change close` as the net, and that the git hooks never refresh |
| `repos` | how many are present, and the clone command for each that is not |
| `branches` | the branch each repo is parked on and its sha, and whether that **is** its channel — `= channel …`, `OFF channel … @ <sha>` (verify reads the channel, not that tree), or a channel that does not resolve there at all (verify falls back to the working tree). The brain==code entry says how far **behind** its own channel it is, if it is — an out-of-date law judging a current ecosystem is the one staleness the channel read cannot catch. The line that explains a `verify` result at a glance |
| `pins` | the brain mount in each consumer, and how far behind its channel it is |
| `hooks` | `core.hooksPath`, both shims, coexistence with the repo's own hooks (chained / alongside / not wired), and whether anything can actually run them |
| `enact` | printed on every run, and it reports an **absence**: who enacts a row is not a fact on disk. multivac never fabricates a git identity (MV-04), and a hook runs with the caller's permissions, so a gate installed here is one the same process can skip. Ungateable by design (MV-81) rather than missing — the enforcement is the forge's merge button, held by an account the agent does not have. The half that IS checked — enactment landing in its own commit — is `verify`'s `enact` line, read from the index |
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

Bare `doctor` exits 0 in every degraded state above; its only exit 1 is a
config or law that does not load — detection of a disarmed gate depends on a
human reading the report.

**`doctor --strict` turns that report into an assertion.** It adds one
condition and otherwise prints the same thing.
It exits 1 when the enforcement gate is disarmed — the shim missing,
`core.hooksPath` not multivac's with no shim chained alongside, or no runnable
multivac so the shim no-ops. Run it where a machine is being set up, or from
a session-start hook — it fails the moment the floor is down instead of
staying quiet while nothing is enforced:

```txt
$ git config --unset core.hooksPath && mvac doctor --strict; echo $?
hooks      core.hooksPath unset → git config core.hooksPath .multivac/hooks · pre-commit installed · pre-push installed · active (mvac)
strict     FAIL — the enforcement gate is not armed; a commit here is not verified (see hooks above)
1
```

Invalid config/law stays exit 1 under both. Bare `doctor` never gates on a
disarmed gate — it only describes it.

## `repos` / `repos sync [--shallow]`

```txt
$ mvac repos
api          present  ../api
payments     missing  ../payments  (git@example.com:acme/payments.git)
```

`repos` and `repos list` are the same thing. `repos sync` clones every
declared-but-missing repo that has a `url`, and fetches every repo already on
disk:

```txt
$ mvac repos sync
api: present at ../api — fetched
payments: cloned git@example.com:acme/payments.git -> ../payments
```

The fetch is what keeps `verify` honest: a brain-scoped run reads each sibling
at its channel ref, and that ref is a **local** remote-tracking snapshot —
`verify` never touches the network, so it is only as fresh as the last
`repos sync`. Every staleness line in `verify` names this command for exactly
that reason.

`--shallow` adds `--depth 1` — fine for verify-only machines, not enough for
`change`, which needs to branch. A clone that fails is named, never retried
silently, and exits 1:

```txt
payments: auth failed cloning git@example.com:acme/payments.git — fix your ssh key/token for this host, then re-run `multivac repos sync` (no retry was attempted)
```

A *fetch* that fails reports and never gates — offline, or a repo with no
remote, still leaves a usable if older ref, and `verify`'s `read` line carries
its age:

```txt
api: present at ../api — could not fetch: Could not resolve host: example.com; its channel ref stays as last fetched (`git -C ../api fetch`)
```

An unknown subcommand exits 2:

```txt
unknown subcommand "pull" — usage: multivac repos [sync [--shallow]]
```

## `roadmap [add <slug> "<title>"] [--horizon now|next|later]`

The changes that have not started yet. With no arguments it lists them; with
`add` it records one.

```txt
$ mvac roadmap
roadmap: 2 planned
  now
    tracker-projects-the-roadmap — Issues and boards from the change files
  later
    the-graph-builds-itself-everywhere — First build per declared root
in flight: 1 open change — points-expire
```

Horizons print in the order `now`, `next`, `later`, nearest first. Slugs are
ordered by codepoint within a horizon — never by locale, which would make the
listing's order a property of the machine that printed it. A horizon holding
nothing is omitted rather than printed empty. The `in flight:` line counts open
changes separately, so intention is never read as progress.

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
applies to `add` only; the listing always shows every horizon.

Refusals name the state found and the command that moves forward:

```txt
mvac: <slug> is already planned — see it with `multivac roadmap`, or start it with `multivac change new <slug>`
mvac: <slug> is already open — it started; nothing to record
mvac: <slug> is already archived at .multivac/changes/archive/<slug>.md — this change is closed; start a new one with a new slug, or read it there
mvac: unknown horizon "someday" — use now, next, later
```

### `sync` (MV-99)

Projects the change files to the declared tracker. **One way, always**: the
change files are the source, and nothing the tracker says ever reaches them.
Closing an issue by hand closes nothing — the next sync restores it.

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

It writes only labels in its own namespace and never removes one it does not
own: one wiped triage is enough to have a projection turned off permanently.

An absent `glab` or `gh` **refuses**: a projection that cannot run must not
report success. A recorded number whose issue is gone is reported, never
silently re-created.

One issue per change. Story-level issues are the stated intent and are not built
yet — they need a second reader of the SDD tool's task list.

### The roadmap is never a gate

No command refuses an operation because its subject was not recorded first.
There is no flag to require it and no configuration key to turn it on:
requiring a plan is unverifiable intent, the same category the ritual belongs
to, and MV-89 carries an `absent` leg over `src/` so the refusal cannot be
introduced without the law failing.

Starting a planned change is [`change new`](#new), which promotes the file that
is already there. Every later step refuses one that has not started:

```txt
mvac: <slug> is planned, not started — start it first: multivac change new <slug>
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
flags: --no-sdd (skip the SDD steps AND their gates), --no-grapher (close only:
       skip the graph gate), --landed <repo> (land only),
       --abandon (close only: drop a change that landed nothing, give its id back)
```

Exactly four flags, all listed above. `change` reads the same shared refusal
every other command reads (MV-105), so an unknown flag, a single-dash token and
a surplus positional all exit 2:

```txt
change: unknown flag "--force" — change takes <sub> <slug> ["<title>"], --no-sdd, --no-grapher, --landed <repo>, --abandon
change: unexpected argument "api" — change takes <sub> <slug> ["<title>"], --no-sdd, --no-grapher, --landed <repo>, --abandon
```

The second line is `change land <slug> api`, meaning `--landed api`. It used to
exit **0** having recorded nothing.

A slug must be letters, digits, dots or dashes. `change new "points expire"`
derives `points-expire`.

### `new`

```txt
$ mvac change new "points expire"
committed: change open: points-expire — reserves INV-02
created .multivac/changes/points-expire.md — declare repos, landing_order, invariants, claims
reserved INV-02 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [{ id: INV-02, statement: "..." }]  # what close verifies
```

Refuses to overwrite an existing change file (exit 1). It also takes the next
free invariant ID out of the law table and writes it straight back as a
`proposed` row naming this change — never pick an ID by hand. A `proposed` row
never gates `verify`, and `close` releases the reservation if the change never
used it — used meaning the rule was stated in place of the scaffolded RESERVED
text, or an anchor names the ID. Then prints the SDD steps bound to the `new`
point — with the artifact each will be checked for — if an `sdd` is declared
and `sdd_auto` is on. `plan`, `apply` and `close` **refuse** while those
artifacts are missing; see
[Graphers and SDD](/docs/reference/graphers-and-sdd/#the-gate-what-the-tool-really-produces).

The scaffolded declaration and the reserved row land as **one commit on the
current branch** (message `change open: <slug> — reserves <ID>`): the shared
tree stays clean, pulls are never blocked on lifecycle edits, and a concurrent
`new` reads the committed table. A tree already dirty at the two bookkeeping
paths is refused with the exact command that unblocks it:

```txt
cannot open points-expire — bookkeeping paths carry uncommitted edits: .multivac/invariants.md
  commit them first: git -C /home/you/brain add -- .multivac/invariants.md && git commit
  then re-run: multivac change new points-expire "points expire"
```

#### A brain behind its channel (MV-94)

`new` and `apply` report any declared repo whose pin is behind its channel,
before anything else happens:

```txt
brain pins behind their channel — refresh before deciding against the law:
  stale     api: pin 3 behind origin/main (last fetch 6d ago) — `git -C ../acme-api submodule update --remote .knowledge`
```

It **reports and never refuses**. Offline, a pin behind its channel means
somebody landed work *or* nobody fetched, and those are indistinguishable from
here; refusing on the second reading would fail an ordinary morning.
`staleness: block` still makes [`verify`](#verify-dir---strict---check---worktree---repo-key)
exit 1 exactly where it always did.

The read is offline, so it says what was last fetched, never what exists
remotely — which is why every line carries the fetch age, and why a channel ref
that does not resolve locally is reported as uncomparable rather than guessed.

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
named and exits 1. `plan` **does** clone a declared-with-url repo that is
missing.

### `apply`

```txt
$ mvac change apply points-expire
committed: change apply: points-expire — status branched
api: branched points-expire from main 58383ca — local main is ahead of origin/main
api: worktree /home/you/brain/.multivac/worktrees/points-expire/api
payments: created /home/you/payments — git init, door written, first commit
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

A repo with a `url` and nothing on disk is cloned; a repo with neither is
created greenfield — `git init`, consumer door, first commit. Each repo's
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
from the base; nothing rides across a switch uncommitted. Anything **else**
uncommitted in a tree apply would switch is refused by name, with the command
that parks it:

```txt
api: cannot branch points-expire — uncommitted work would be overwritten: notes.md
  commit it, or park it: git -C /home/you/api stash push -- notes.md
  then re-run: multivac change apply points-expire
```

An existing branch is reused, not a failure:

```txt
api: branch points-expire already exists — switched to it, reusing
```

#### What can be worked at once (MV-95)

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
stage 1 [landed] api:landed
stage 2 [ready] payments:branched
  payments: git -C /home/you/payments push -u origin points-expire
  payments: open MR points-expire -> main (state the landing order in the description)
  payments: once merged: multivac change land points-expire --landed payments
```

`land` prints commands; it never pushes and never opens a merge request.

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
is only as true as the last fetch (MV-54), so the negative says both things it
can mean, and published content proves publication rather than authorship:

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
every repo is now landed — once every declared claim resolves, `verify --strict` refuses points-expire as unclosed (MV-80), here and in CI, until: multivac change close points-expire
```

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

Green: the SDD `archive` step runs, the change file moves to
`.multivac/changes/archive/`, the worktrees are removed, and the ritual is
printed verbatim.

```txt
$ mvac change close points-expire
INV-07: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C /home/you/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md && git commit -m "Archive the points-expire change" (no origin remote — the direct commit is the landing)
api: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/api)
payments: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/payments)
graph graphify @ brain: refreshed (`graphify update .`) — artifact left uncommitted

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

#### The graph gate (MV-90)

A declared grapher must have left a graph in every declared, present root, or
`close` refuses:

```txt
graph: `change close points-expire` refused — 2 roots have no graph
  api: no graphify-out/graph.json — `graphify update .` there
  web: no graphify-out/graph.json — `graphify update .` there
  or skip the gate without losing the tool: `--no-grapher` for one run, `grapher_auto: false` in .multivac/config.yml for good
```

Every offending root is named in one message: you never close repeatedly to
discover the rest of the list. The gate runs the build-where-missing pass
first, so the first close in a fresh ecosystem builds rather than refuses.

A root whose grapher binary is not on PATH also refuses, naming the binary and
the install hint — a gate that cannot be evaluated refuses rather than passes.
A root with `grapher: none`, an ecosystem with no grapher, and an UNVERIFIED
adapter are all out of scope: nothing is required of a tool whose artifact path
would have to be guessed.

**It asks existence, never freshness.** A stale graph passes, deliberately:
currency would have to be defined, and every definition is wrong on a fresh
clone where every file is newer than the artifact.

**And the graph must be in the repository, not just on disk** (MV-103). A second
refusal follows the first: a root whose artifact exists but is untracked — or is
matched by an ignore rule — keeps its graph out of every clone, while the door
there still points at one. The message names each root, the path and the command;
multivac never runs it, because the refresh module is kept out of git entirely
(MV-50).

```txt
graph: `change close points-expire` refused — 2 roots keep their graph out of the repository
  api: graphify-out/graph.json is untracked — `git -C ../api add graphify-out/graph.json`
  web: graphify-out/graph.json is ignored by .gitignore — remove the rule, then `git -C ../web add graphify-out/graph.json`
```

`--no-grapher` skips it for one run and says so. `--abandon` is exempt — an
abandoned change made no claims and landed nothing, so demanding an artifact
from it would punish dropping work.

The refresh that follows now covers **every declared, present repo**, not only
the repos this change named. A repo moved by another change, a merge or a sync
was previously left describing a tree that was gone.

#### `--abandon`

The other ending. `change new` reserves an invariant id before anything is
declared, so a change you drop before it touches a repo can never satisfy the
gates above — and `close` is the only thing that gives a reservation back.
Without a door, an abandoned change leaks its id forever, or you write a false
`status: landed` to get through:

```txt
$ mvac change close points-expire --abandon
INV-07
abandoned -> .multivac/changes/archive/points-expire.md — nothing was verified, nothing landed
```

Nothing is verified, on purpose: an abandoned change made no claims to verify.
A change that *did* declare claims is refused — drop them first, or close it
properly.

The printed commit is **scoped to the closing change's paths** — the archived
file, the old change path, and the law table when a reservation was released —
never `add -A`, which in a shared checkout would sweep another change's files
into this archive commit. Where the commit lands depends on where the brain is
standing, and the wording says which case you are in:

- on a working branch: `archived — commit this on <branch> (it lands through
  that branch's MR): git -C <brain> add -- <paths> && git commit -m "..."`
- on the trunk of a brain **with** a remote, nothing lands directly — the
  recipe is branch + MR:

  ```txt
  archived — commit this on a branch; nothing lands on main directly:
    git -C /home/you/brain switch -c close-points-expire && git add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md && git commit -m "Archive the points-expire change" && git push -u origin close-points-expire
    then open MR close-points-expire -> main
  ```

- a solo brain with **no** origin remote is told the direct commit IS the
  landing (the sample above) — there is no MR to open.

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
help <command>` prints that command's usage; bare `mvac help` lists topics.

## Exit codes

| code | meaning |
| --- | --- |
| **0** | ok — including every degraded state: unevaluated repos, absent adapters, missing repos, unsupported door targets, non-blocking broken legs |
| **1** | a check failed or a gate refused: blocking leg broken/vacuous, anchor parse error, stale pin under `staleness: block`, `close` before every repo landed, a claim not green, a clone that failed, invalid config **in `doors` and `doctor`**, a disarmed enforcement gate under **`doctor --strict`** |
| **2** | usage or environment: no command, unknown command, **any argument a command does not declare** — a flag or a positional — unknown subcommand, missing or invalid `.multivac/config.yml`. The refusal names the argument and states what the command takes, and comes before the command does anything (MV-85). |

A command takes what it declares and refuses the rest. `mvac doctor --sttrict`
used to run the report without the assertion and exit 0; `mvac doctor /other/repo`
used to report on the working directory, because `doctor` declares no directory
and the argument was discarded. Both refuse now. What each command declares is
its `--help` (MV-69), and that is the list the refusal is measured against.

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
unknown flag "--loud" — verify takes [dir], --strict, --check, --worktree, --repo <key>
```

```txt
$ mvac verify
no .multivac/config.yml in /home/you/somewhere — run `multivac init .` to create it
```
