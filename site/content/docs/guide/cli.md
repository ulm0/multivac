---
title: CLI reference
weight: 5
---

One binary, two names: `multivac` and `mvac`.

```txt
$ mvac --help
multivac <command> [args]

commands:
  init       scaffold the brain: content at root, machinery in .multivac/
  seed       deterministic boundary inventory -> .multivac/seed-report.md
  verify     check anchors against the declared repos (deterministic, offline)
  doors      project doors + install git hooks into the brain and declared repos
  doctor     what is declared, what was found, what is degraded, how to fix it
  repos      list declared repos; `repos sync [--shallow]` clones the missing ones
  change     new/plan/apply/land/close — the ecosystem change lifecycle
```

The LLM boundary: every command above is deterministic — no model call, no
API key, and `verify` and hooks never touch the network. `seed` and the
interview only draft what a human then enacts; the drafting agent is yours,
not multivac's.

## `init [dir] [--agent a,b] [--sdd name] [--grapher name]`

Scaffolds the brain. Side effects, completely: writes `AGENTS.md` (the
door, managed block only — never clobbers yours) and `invariants.md` (the
law table, zero rows) at the root, plus `changes/`; writes the machinery
under `.multivac/` (`config.yml`, `hooks/`, gitignored `cache/`); runs
`git init` when the directory is not a repo; points `core.hooksPath` at
`.multivac/hooks/` and writes the `pre-commit`/`pre-push` shims there.

- `--agent a,b` — door targets beyond canonical `AGENTS.md`
  (e.g. `--agent claude,cursor`). Default is `agents` alone — no
  vendor-named projection unless you add it.
- `--sdd name` — declare an SDD adapter (`opsx`, `speckit`).
- `--grapher name` — declare a grapher (`graphify`).

Flags land in `.multivac/config.yml`; they configure, they don't perform.
Without flags, `init` detects what is already present (`CLAUDE.md`,
`.cursor/`, `openspec/`, `graphify-out/`) and writes commented proposals
into the config. Re-run on an existing brain: config kept, hooks
refreshed, exit 0.

## `seed`

```txt
$ mvac seed
seed: wrote .multivac/seed-report.md — 1 repo(s) inventoried
seed: next — read the report and draft proposed claims (see the multivac skill)
```

Deterministic boundary inventory of every declared repo into
`.multivac/seed-report.md`. Writes nothing that is law; see
[Session zero](../session-zero).

## `verify [dir] [--strict] [--check]`

Checks every anchor in `invariants.md` against the declared repos.
Deterministic, offline, sub-second by design (`git ls-files` + ripgrep,
cache keyed by commit sha). `dir` defaults to the current directory and
must contain `.multivac/config.yml`.

```txt
$ mvac verify
3 claims · 3 anchored (100%)

  ok          2
  unevaluated   1
  unevaluated INV-04 [absent] invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it

0 blocking broken · exit 0
```

Per-leg states:

| state | meaning |
| --- | --- |
| `ok` | every leg holds |
| `moved` | a `present` leg with exactly one match outside its glob: glob rewritten in place, review the diff |
| `broken` | the leg's requirement fails in place |
| `vacuous` | the glob (after `!` exclusions) matches zero tracked files |
| `unevaluated` | the leg's repo is declared but not on disk — counted, not red |
| `parse` | the anchor line doesn't parse (e.g. `\s is not POSIX ERE — use [[:space:]]`) |

The message is the product, not the exit code — each failing leg says what
is wrong and what to do:

```txt
broken    INV-01 [absent] invariants.md:7 · forbidden pattern at db/migrations/002_oops.sql:1 — delete it, or retire/amend the claim first
vacuous   INV-01 [absent] invariants.md:7 · glob matched no tracked files — a rename greens this tombstone silently; fix the glob
moved     INV-01 [present] invariants.md:6 · glob rewritten to sql/migrations/001_accounts.sql — review the diff
```

The exit matrix — one answer, no second opinion:

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (`absent`, `count`) | **exit 1** | exit 1 |
| broken `present` / `unique` | reported, exit 0 | exit 1 |
| moved (self-healed) | exit 0 | exit 0 |
| unevaluated (repo not on disk) | exit 0 | exit 0 |
| anchor parse error | exit 1 | exit 1 |

- `--strict` — broken `present`/`unique` also exit 1. For CI.
- `--check` — never writes; a `moved` leg is reported instead of rewritten.
  The propose-in-CI half of the prettier pattern.

The blocking set is the `blocking:` key in config, default
`[absent, count]`. Extending it is allowed; unblocking the tombstone —
loosening below `[absent]` — is refused.

Pin staleness reports by default. With `staleness: block` in config, a pin
behind its declared channel is a blocking failure — exit 1, with the sync
command in the line. A channel ref that does not resolve locally stays a
report either way: offline never guesses and never gates.

## `doors [--no-symlink]`

```txt
$ mvac doors
brain: door + hooks updated
api: door + hooks updated
```

Projects the canonical door to every declared target and installs the
enforcement floor: in the brain and in each present consumer repo, writes
`.multivac/hooks/` and points `core.hooksPath` at it. Consumer doors state
where the brain is mounted, what binds, and that the change may cross
repos. Everything lands in managed blocks; hand-written content around
them is untouched. Absent repos are skipped and reported. `doors` writes
working trees, never commits.

`--no-symlink` — write stub files instead of symlinks (Windows without
developer mode). Projection details per target:
[Adapters](../adapters).

## `doctor`

Read-only diagnosis: what is declared, what was found, what is degraded,
how to fix it.

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: .cursor/rules/multivac.mdc ok
sdd        opsx: artifact missing (looked for openspec/specs, openspec/changes) · binary ok · workflow automated in change lifecycle (sdd_auto)
grapher    graphify @ brain: artifact ok · binary ok · fresh
grapher    graphify @ api: artifact missing → run `graphify update .` there
repos      1/2 present · payments missing → `multivac repos sync` (git clone git@example.com:acme/payments.git ../payments)
pins       api: pin 8f2a1cc — no channel ref to compare; set channel: in .multivac/config.yml
hooks      core.hooksPath ok · pre-commit ok · pre-push ok
```

Six report lines: `doors`, `sdd`, `grapher` (one per repo), `repos`,
`pins` (the brain mount in each consumer repo, and how far its pin is
behind the declared `channel:`), `hooks`. Doctor diagnoses and points at
the fix; it never mutates and never clones.

## `repos` / `repos sync [--shallow]`

```txt
$ mvac repos
api          present  ../acme-api
payments     missing  ../payments  (git@example.com:acme/payments.git)
```

`repos sync` clones every declared-but-missing repo that has a `url`:

```txt
$ mvac repos sync --shallow
api: present at ../acme-api
payments: cloned git@example.com:acme/payments.git -> ../payments (shallow)
```

`--shallow` for verify-only machines; `change` needs full clones to
branch. Cloning is additive and reversible; auth failures error clearly,
no silent retry.

## `change <sub> <slug> [args]`

```txt
$ mvac change
multivac change <sub> <slug> [args]
  new "<title>"          scaffold changes/<slug>.md, slug from title (+ SDD propose)
  new <slug> "<title>"   same, with an explicit slug
  plan <slug>            resolve repos, landing graph, invariants, claims
  apply <slug>           branch per repo (greenfield repos get created)
  land <slug>            landing-order report; --landed <repo> records a merge
  close <slug>           verify claims, archive the change
flags: --no-sdd (skip SDD steps), --landed <repo> (land only)
```

The full lifecycle with real output:
[Running changes](../running-changes).

## Exit codes

| code | meaning |
| --- | --- |
| 0 | ok — including degraded states: unevaluated repos, absent adapters, non-blocking broken legs |
| 1 | a blocking leg broke or went vacuous, an anchor failed to parse, or a lifecycle gate refused (`plan` on bad frontmatter, `close` before landed) |
| 2 | usage or environment error: unknown command/flag/subcommand, no `.multivac/config.yml` |

## Hook policies

`init` and `doors` install the same shim as `pre-commit` and `pre-push`,
in the brain and in every consumer repo `doors` reaches:

```sh
#!/bin/sh
# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.
# Missing mvac never blocks a commit: enforcement degrades, it does not lock out.
command -v mvac >/dev/null 2>&1 || exit 0
exec mvac verify
```

Policy by invoker:

- **git hooks and harness hooks** run the **default** policy — only
  blocking modes (`absent`, `count`) gate, so a mid-refactor commit never
  dies on a moved presence check.
- **`strict_pre_push: true`** in config makes `doors` install the pre-push
  shim as `verify --strict` — commits stay permissive, pushes gate like CI.
- **CI** runs `--strict --check`: everything gates, nothing is written.

Hooks live in the versioned `.multivac/hooks/` via `core.hooksPath` — they
travel with the clone, no install step. A machine without `mvac` on PATH
commits normally: enforcement degrades, it does not lock out.

Harness hooks are the read side — they catch a lying brain before the
agent conceives code on top of it. The `claude` door target (declared via
`--agent claude`, projected by `doors`) installs `.claude/settings.json`
running `mvac verify` on `SessionStart` and after edits (`PostToolUse`). Git hooks are the write side: later, but universal.
