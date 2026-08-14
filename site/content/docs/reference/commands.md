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
  repos      list declared repos; `repos sync [--shallow]` clones the missing ones
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

## `init [dir] [--agent a,b] [--sdd name] [--grapher name] [--quiet]`

Scaffolds the brain in `dir` (default `.`).

```txt
$ mvac init . --agent claude,cursor --grapher graphify
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
| `--agent a,b` | comma-separated registry names | appended to `doors:` in the config (`agents` is always included) |
| `--sdd name` | `opsx` \| `speckit` | written as `sdd:` in the config |
| `--grapher name` | any tool name | written as `grapher:` in the config |
| `--quiet` | — | no report, no banner; refusals still go to stderr |

The banner is the mark: lit lamps are verified claims, unlit ones unanchored,
the amber one the claim in flight. The pattern is a fixed drawing, never a
reading — `init` runs before there is anything to verify. `init` is the only
command that prints it; `verify`, `doctor`, `doors` and `change` run inside
hooks and in CI, where it would be noise. It is skipped when stdout is not a
terminal, and `NO_COLOR` keeps the drawing while dropping the colour (`#` lit,
`.` unlit, `*` in flight).

Both `--flag value` and `--flag=value` work. A flag with no value, or an
unknown flag, is refused:

```txt
init: unknown flag --agents — known: --agent <a,b>, --sdd <name>, --grapher <name>, --quiet
```

**Flags configure; they do not perform.** `--agent claude` writes `claude`
into `doors:`; it is `mvac doors` that projects the file.

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

## `verify [dir] [--strict] [--check] [--repo <key>]`

The core. Checks every anchor in the brain against the declared repos.
Deterministic, offline, sub-second by design. `dir` defaults to `.`.

```txt
$ mvac verify
4 claims · 4 anchored (100%)

  ok          3
  unevaluated   1
  unevaluated INV-04 [present] .multivac/invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it

0 blocking broken · exit 0
```

| flag | effect |
| --- | --- |
| `--strict` | broken `present`/`unique` legs also exit 1. The CI policy. |
| `--check` | never writes: a `moved` leg is reported instead of self-healed. |
| `--repo <key>` | scope to one declared repo. **Only meaningful from a consumer repo** — from a brain it is ignored with a warning. |

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

### The exit matrix

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (`absent`, `count`) | **1** | **1** |
| broken `present` / `unique` | reported, **0** | **1** |
| `moved` — self-healed | **0** | **0** |
| `unevaluated` — repo not on disk | **0** | **0** |
| a leg belonging to a `proposed` row | **0** | **0** |
| a leg belonging to a `drift` row — recorded finding | **0** | **0** |
| a claim an open change declares (`pending`) | **0** | **0** |
| anchor parse error | **1** | **1** |
| stale pin, `staleness: report` | **0** | **0** |
| stale pin, `staleness: block` | **1** | **1** |
| config invalid or missing | **2** | **2** |

The blocking set is the `blocking:` key, default `[absent, count]`. Widening
it is allowed; dropping `absent` is refused.

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

## `doctor`

Read-only diagnosis. Never mutates, never clones.

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: .cursor/rules/multivac.mdc ok
grapher    graphify @ brain: artifact missing → run `graphify update .` there
grapher    graphify @ api: artifact missing → run `graphify update .` there
repos      1/2 present · payments missing → `multivac repos sync` (git clone git@example.com:acme/payments.git ../payments)
pins       api: no brain mount at .brain — add the brain as a gitlink (git submodule add <brain-url> .brain) · payments: not cloned
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac)
untracked  nothing build-critical untracked
```

| line | reports |
| --- | --- |
| `doors` | one entry per declared target: file present, symlink correct, managed block present |
| `sdd` | artifact, binary, and whether the workflow is automated — **omitted entirely when no `sdd` is declared** |
| `grapher` | one line per scope (brain + each present repo): artifact, binary, freshness |
| `repos` | how many are present, and the clone command for each that is not |
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

Exit 0 in every degraded state above. The **only** exit 1 is a config that
does not load.

## `repos` / `repos sync [--shallow]`

```txt
$ mvac repos
api          present  ../api
payments     missing  ../payments  (git@example.com:acme/payments.git)
```

`repos` and `repos list` are the same thing. `repos sync` clones every
declared-but-missing repo that has a `url`:

```txt
$ mvac repos sync
api: present at ../api
payments: cloned git@example.com:acme/payments.git -> ../payments
```

`--shallow` adds `--depth 1` — fine for verify-only machines, not enough for
`change`, which needs to branch. Failures are named, never retried silently,
and exit 1:

```txt
payments: auth failed cloning git@example.com:acme/payments.git — fix your ssh key/token for this host, then re-run `multivac repos sync` (no retry was attempted)
```

An unknown subcommand exits 2:

```txt
unknown subcommand "pull" — usage: multivac repos [sync [--shallow]]
```

## `change <sub> <slug> [args]`

```txt
$ mvac change
multivac change <sub> <slug> [args]
  new "<title>"          scaffold .multivac/changes/<slug>.md + reserve the next invariant id
  new <slug> "<title>"   same, with an explicit slug
  plan <slug>            resolve repos, landing graph, reserve declared ids, claims
  apply <slug>           worktree per repo (greenfield repos get created)
  land <slug>            landing-order report; --landed <repo> records a merge
  close <slug>           verify claims, archive the change, print .multivac/ritual.md
flags: --no-sdd (skip SDD steps), --landed <repo> (land only)
```

Exactly two flags, both listed above. An unknown one exits 2:

```txt
unknown flag --force — run `multivac change` for usage
```

A slug must be letters, digits, dots or dashes. `change new "points expire"`
derives `points-expire`.

### `new`

```txt
$ mvac change new "points expire"
created .multivac/changes/points-expire.md — declare repos, landing_order, invariants, claims
reserved INV-02 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
```

Refuses to overwrite an existing change file (exit 1). It also takes the next
free invariant ID out of the law table and writes it straight back as a
`proposed` row naming this change — never pick an ID by hand. A `proposed` row
never gates `verify`, and `close` releases the reservation if the change never
used it. Then runs the SDD `propose` step, if one is declared and `sdd_auto` is
on.

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

The change's own declaration file rides into whichever checkout apply hands
back — `apply` wrote it, so it is never a reason to abort. Anything **else**
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
api: recorded as landed — recording without evidence: points-expire is not contained in main here (a squash or a remote-only merge looks like this too)
```

A repo with no `origin` is told to land locally instead of to push:

```txt
  payments: no origin remote — land locally: git -C /home/you/payments switch main && git merge --no-ff points-expire
```

### `close`

The gate. Refuses while any repo is unlanded:

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
archived — commit this: git -C /home/you/brain add -A .multivac/changes && git commit -m "Archive the points-expire change"
api: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/api)
payments: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/payments)
graph: refresh with `graphify update .` in the changed repos

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

The archive is a rename in the working tree like any other edit, so `close`
names the commit that stores it rather than leaving it to be noticed later.

A change with no claims says so and archives:
`no claims declared — nothing to verify`. An empty or absent ritual prints
nothing. Full walkthrough: [Running changes](../../guide/running-changes).

## `help [topic|command]`

The on-ramp. `mvac help anchor` prints the anchor grammar on one screen — the
line format, the POSIX-ERE-only dialect with the `\s`/`\d`/`\w`/`\b`
replacements, per-line matching (per-statement for `.sql`), `count=N` as a
deletion ratchet across the whole glob, the one-include-glob rule (braces for
alternatives), repo-qualified exclusions, and where anchors may live. `mvac
help <command>` prints that command's usage; bare `mvac help` lists topics.

## Exit codes

| code | meaning |
| --- | --- |
| **0** | ok — including every degraded state: unevaluated repos, absent adapters, missing repos, unsupported door targets, non-blocking broken legs |
| **1** | a check failed or a gate refused: blocking leg broken/vacuous, anchor parse error, stale pin under `staleness: block`, `close` before every repo landed, a claim not green, a clone that failed, invalid config **in `doors` and `doctor`** |
| **2** | usage or environment: no command, unknown command, unknown flag, unknown subcommand, missing or invalid `.multivac/config.yml` |

```txt
$ mvac frobnicate
unknown command "frobnicate" — run `multivac --help` for the list
```

```txt
$ mvac verify --loud
unknown flag "--loud" — verify takes [dir], --strict, --check, --repo <key>
```

```txt
$ mvac verify
no .multivac/config.yml in /home/you/somewhere — run `multivac init .` to create it
```
