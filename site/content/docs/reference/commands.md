---
title: Commands
weight: 1
---

One binary, two names: `multivac` and `mvac`. Nine commands.

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
  help       help <topic|command> — `help anchor` prints the anchor grammar on one screen
```

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
init: done — load the multivac skill to fill the brain (see AGENTS.md)
```

| flag | takes | effect |
| --- | --- | --- |
| `--provider a,b` | comma-separated registry names | appended to `doors:` in the config (`agents` is always included) |
| `--sdd name` | `opsx` \| `speckit` | written as `sdd:` in the config |
| `--grapher name` | any tool name | written as `grapher:` in the config |
| `--quiet` | — | no report, no banner; refusals still go to stderr |

The banner is the mark: lit lamps are verified claims, unlit ones unanchored,
the amber one the claim in flight. The pattern is a fixed drawing, never a
reading — `init` runs before there is anything to verify. `init` is the only
command that prints it; `verify`, `doctor`, `doors` and `change` run inside
git and harness hooks, where it would be noise. It is skipped when stdout is
not a terminal, and `NO_COLOR` keeps the drawing while dropping the colour
(`#` lit, `.` unlit, `*` in flight).

Both `--flag value` and `--flag=value` work. A flag with no value, or an
unknown flag, is refused:

```txt
init: unknown flag --providers — known: --provider <a,b>, --sdd <name>, --grapher <name>, --quiet
```

**Flags configure AND project.** `--provider claude` writes `claude` into
`doors:` and projects it in the same run — the door, the skill, the harness
hooks. It used to stop at the config and end by telling you to load a skill it
had not installed. `mvac doors` re-runs that projection after you edit
`doors:` or `grapher:` by hand.

`agents` is never a `--provider` value. [agents.md](https://agents.md/) is the
open format every other door projects *from*, not a tool anyone could install,
and `AGENTS.md` is written unconditionally.

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

0 blocking broken · exit 0
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
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac)
untracked  nothing build-critical untracked
```

| line | reports |
| --- | --- |
| `doors` | one entry per declared target: file present, symlink correct, managed block present |
| `sdd` | artifact, binary, whether `sdd_auto` is on; then one `flow —` line per step of the tool's own flow, each with the artifact that proves it (or why nothing can), one `gates —` line naming which lifecycle commands refuse and on what, and `project law —` for the tool's project-level document: missing with the command that writes it, or present with its date against the law's newest row (STALE when the law moved and it did not). **Omitted entirely when no `sdd` is declared** |
| `grapher` | one line per scope (brain + each present repo): artifact, binary, freshness |
| `repos` | how many are present, and the clone command for each that is not |
| `branches` | the branch each repo is parked on and its sha, and whether that **is** its channel — `= channel …`, `OFF channel … @ <sha>` (verify reads the channel, not that tree), or a channel that does not resolve there at all (verify falls back to the working tree). The brain==code entry says how far **behind** its own channel it is, if it is — an out-of-date law judging a current ecosystem is the one staleness the channel read cannot catch. The line that explains a `verify` result at a glance |
| `pins` | the brain mount in each consumer, and how far behind its channel it is |
| `hooks` | `core.hooksPath`, both shims, coexistence with the repo's own hooks (chained / alongside / not wired), and whether anything can actually run them |
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

Exactly three flags, all listed above. An unknown one exits 2:

```txt
unknown flag --force — run `multivac change` for usage
```

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
graph: refresh with `graphify update .` in the changed repos

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

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
| **2** | usage or environment: no command, unknown command, unknown flag, unknown subcommand, missing or invalid `.multivac/config.yml` |

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
