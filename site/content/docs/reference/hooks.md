---
title: Hooks
weight: 5
---

Enforcement is a ladder, not a switch. Each rung catches the lie at a
different moment, and the rungs are deliberately unequal in reach and in
strictness.

| rung | reach | when it fires | policy |
| --- | --- | --- | --- |
| **git hooks** | **universal** — every repo `doors` touches, every harness, no harness at all | `pre-commit`, `pre-push` | default (`--strict` on push, optionally) |
| **harness hooks** | only harnesses that have them — today, `claude` | session start, after every edit | default |
| **CI** | wherever you configure it | on push / MR | `--strict` |

The floor is universal and late. The ceiling is narrow and early. Neither
replaces the other: the harness hook catches a lying brain **before** the
agent conceives code on top of it, and the git hook catches everyone else —
a human typing `git commit`, a script, an agent in a harness with no hook
support.

## Git hooks — the universal floor

`init` installs them in the brain. `doors` installs them in the brain **and
in every declared repo that is present on disk**, regardless of which harness
targets you declared:

```txt
$ mvac doors
brain: door + hooks updated
api: door + hooks updated
payments: notice: not found at ../payments — run `multivac repos sync` to clone it
```

Two files, both this shim:

```sh
#!/bin/sh
# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.
# Chains the repo's own .git/hooks hook first; its exit code wins.
# Runner order: mvac on PATH, npx --no-install, repo-local build. No runnable
# multivac never blocks a commit: it warns loudly and exits 0.
case $0 in */*) hookdir=${0%/*} ;; *) hookdir=. ;; esac
root=$(CDPATH= cd -- "$hookdir/../.." && pwd) || exit 0
prev=$(git rev-parse --git-dir 2>/dev/null)/hooks/pre-commit
if [ -x "$prev" ]; then
  "$prev" "$@" || exit $?
elif [ -f "$root/.pre-commit-config.yaml" ]; then
  # fresh clone: `pre-commit install` refuses while core.hooksPath is
  # set, so run the config directly — the gate arms in every order.
  if command -v pre-commit >/dev/null 2>&1; then
    pre-commit run --hook-stage pre-commit || exit $?
  else
    echo "multivac: .pre-commit-config.yaml present but pre-commit is not installed — the project's gate did NOT run. Fix: install pre-commit (pipx install pre-commit, or brew install pre-commit)" >&2
  fi
fi
if command -v mvac >/dev/null 2>&1; then
  exec mvac verify
fi
if [ -f "$root/node_modules/multivac/package.json" ] && command -v npx >/dev/null 2>&1; then
  exec npx --no-install multivac verify
fi
if [ -f "$root/dist/cli.js" ] && [ -d "$root/node_modules" ] && command -v node >/dev/null 2>&1; then
  exec node "$root/dist/cli.js" verify
fi
echo "multivac: hooks INACTIVE — no runnable multivac, nothing was verified. Fix: install multivac (npm i -g multivac), or build it here (pnpm install && pnpm run build)" >&2
exit 0
```

The `prev` block is the chain: a repo that already had a `.git/hooks/pre-commit`
— a pre-commit framework install, a lefthook install, a hand-written gate —
keeps it. The pre-existing hook runs **first**, and when it fails, its exit
code is the hook's exit code; verify never runs. The chain resolves at run
time, so a manager that installs into `.git/hooks/` *after* multivac is
picked up without re-running `init`.

The `elif` is the other order — the common one. A fresh clone of a repo that
uses the pre-commit framework has `.pre-commit-config.yaml` but **no**
`.git/hooks/pre-commit` yet, and `pre-commit install` refuses to write one
while `core.hooksPath` is set. So when the config exists and the hook does
not, the shim runs the config directly — `pre-commit run --hook-stage
pre-commit` (`pre-push` in the push shim) — and its exit code wins, exactly
as if the hook were installed. The chain arms in every order. With the
config present but no `pre-commit` binary on `PATH`, the shim warns loudly
on stderr and never blocks — the same posture it takes for a missing
multivac runner — and `init` and `doctor` both name the state:

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · .pre-commit-config.yaml with no .git/hooks/pre-commit — the shim runs `pre-commit run --hook-stage <stage>` directly (`pre-commit install` refuses while core.hooksPath is set) · active (mvac)
```

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · WARNING .pre-commit-config.yaml present, no .git/hooks/pre-commit and no pre-commit binary — the project's gate cannot run → install pre-commit (pipx install pre-commit, or brew install pre-commit) · active (mvac)
```

Husky and lefthook do not have this trap: `.husky/` means multivac installs
alongside and leaves `core.hooksPath` for husky's own `prepare` to claim, so
both gates arm in either order; a `lefthook.yml` chains through
`.git/hooks/` the moment `lefthook install` writes there.

| hook | runs | when `strict_pre_push: true` |
| --- | --- | --- |
| `.multivac/hooks/pre-commit` | `mvac verify` | unchanged — commits stay permissive |
| `.multivac/hooks/pre-push` | `mvac verify` | `mvac verify --strict` |

### Why they live in `.multivac/hooks/`

Not `.git/hooks/`. multivac writes the shims into a **versioned** directory
and points git at it:

```sh
git config core.hooksPath .multivac/hooks
```

`.git/hooks/` is not cloned, so hooks installed there are a per-machine setup
step somebody always forgets. `.multivac/hooks/` is committed like any other
file: it travels with the clone, and the only per-machine state is the one
`core.hooksPath` line, which `doctor` checks.

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac)
```

```txt
hooks      core.hooksPath unset → git config core.hooksPath .multivac/hooks · pre-commit installed · pre-push installed · active (node dist/cli.js)
```

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-commit chains .git/hooks/pre-commit (runs first, its exit code wins) · pre-push installed · active (mvac)
```

### A repo that already has hooks

Taking `core.hooksPath` over a project's existing gate would silently disarm
it — the failure measurement 2 caught on saleor, where the pre-commit
framework (ruff, mypy, semgrep) stopped running and nothing said so. So
before touching anything, `init` detects `.git/hooks/<name>`, a foreign
`core.hooksPath`, `.husky/`, `lefthook.yml` and `.pre-commit-config.yaml`,
picks one of three strategies, and says which one it used:

| shape found | strategy | what happens |
| --- | --- | --- |
| nothing | **fresh** | shims in `.multivac/hooks/`, `core.hooksPath` set to it |
| `.git/hooks/<name>`, `.pre-commit-config.yaml`, `lefthook.yml` | **chained** | same shims; each runs the repo's own `.git/hooks` hook first, its exit code wins — and a `.pre-commit-config.yaml` with no hook installed runs via `pre-commit run` |
| `core.hooksPath` set elsewhere, or `.husky/` | **alongside** | never repoint — the shim is written INTO that directory where the name is free |

Where a foreign hook name is taken and does not run multivac, `init` refuses
that hook and prints the exact line to add:

```txt
init: .githooks/pre-commit exists and does not run multivac — NOT touched; append this line to .githooks/pre-commit: mvac verify || exit 1
```

`doctor` reports the coexistence state — and never advises repointing a
hooksPath the repo owns:

```txt
hooks      core.hooksPath is .githooks (this repo's own gate — multivac installs alongside, never repoints) · WARNING .githooks/pre-commit does not run multivac → append: mvac verify || exit 1 · pre-push runs multivac (.githooks/pre-push)
```

### Installed is not enforcing

The shim never blocks a commit for want of a runner. It tries three, in
order — `mvac` on `PATH`, `npx --no-install multivac` when the package is in
`node_modules`, and a repo-local `dist/cli.js` that has `node_modules` beside
it — and with none of them it prints one warning to stderr and exits 0.

That is deliberate and it is the difference between a guard people keep and a
guard people delete. Enforcement **degrades**; it does not lock out. The cost
is that a machine with no runner gets no checking at all, which is what CI is
for — and why `doctor` names the runner it found, or says `INACTIVE`.

Repo-local counts only when it can actually run: a `dist/` with no
`node_modules` beside it is not a runner, because node exits 1 on its first
bare import and that exit would block the commit.

## Harness hooks — the early ceiling

The `claude` registry entry is the only one that currently carries a hook
config. `doors` merges these entries into `.claude/settings.json`, preserving
every key and entry it does not own:

| event | matcher | command |
| --- | --- | --- |
| `SessionStart` | — | `mvac verify` |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `mvac verify` |

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "mvac verify" } ] }
    ],
    "PostToolUse": [
      {
        "hooks": [ { "type": "command", "command": "mvac verify" } ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ]
  }
}
```

`SessionStart` is the earliest useful moment: the agent is about to read the
brain, and this tells it whether the brain is currently true. `PostToolUse`
re-checks after every write, so a change that breaks a claim surfaces in the
same turn that made it, not three files later.

The merge is idempotent — re-running `doors` does not duplicate entries — and
defensive. A settings file that is not valid JSON is left alone and reported:

```txt
brain: notice: .claude/settings.json is not valid JSON — fix it, then rerun `multivac doors`
```

## What blocks and what informs

Every rung runs the same `verify`, so the policy is the same everywhere:
**which anchor mode broke** decides whether the exit code gates.

| leg outcome | default (hooks) | `--strict` (push with `strict_pre_push`, CI) |
| --- | --- | --- |
| broken/vacuous `absent` — a tombstone | **blocks** | blocks |
| broken/vacuous `count` | **blocks** | blocks |
| broken/vacuous `each` / `each!` — a universal | **blocks** | blocks |
| broken `present` / `unique` | informs, exit 0 | **blocks** |
| `moved` — self-healed rename | informs, exit 0 | informs, exit 0 |
| `unevaluated` — repo not on disk | informs, exit 0 | informs, exit 0 |
| a row in the `proposed` state | informs, exit 0 | informs, exit 0 |
| anchor parse error | **blocks** | blocks |

The blocking set is the `blocking:` key, default `[absent, count, each]`. You
can widen it; you cannot drop `absent`. See
[Configuration](../configuration#blocking).

The asymmetry is the whole design. A mid-refactor commit that moved a file
should not die on a presence check — that is noise, and a guard that produces
noise gets disabled within a week. Calling a mechanism that was deleted
should die immediately — that is damage, and it is exactly what nobody
notices by hand.

## Recommended ladder

```yaml
# .multivac/config.yml
blocking: [absent, count, each]   # the default: tombstones and universals gate, renames do not
strict_pre_push: true       # pushes gate like CI, commits stay permissive
```

and in CI:

```sh
mvac verify --strict --check
```

`--check` makes CI report a `moved` leg instead of rewriting the glob — the
propose-in-CI half of the pattern. The rewrite belongs in the working tree
where a human can read the diff, not in a pipeline that has nowhere to commit
it.

## Nothing here commits

`doors` and `init` write working trees. They never `git add`, never commit,
never push, and never clone. Whatever they changed is a diff you review, in
the brain and in every consumer repo they reached.
