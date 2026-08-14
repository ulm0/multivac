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
# Missing mvac never blocks a commit: enforcement degrades, it does not lock out.
command -v mvac >/dev/null 2>&1 || exit 0
exec mvac verify
```

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
hooks      core.hooksPath ok · pre-commit ok · pre-push ok
```

```txt
hooks      core.hooksPath unset → git config core.hooksPath .multivac/hooks · pre-commit ok · pre-push ok
```

```txt
hooks      core.hooksPath is .githooks, expected .multivac/hooks → git config core.hooksPath .multivac/hooks · pre-commit missing → run `multivac init .` to rewrite the shims · pre-push ok
```

### `command -v mvac || exit 0` is the point

The first real line of the shim is a bail-out. A machine without `mvac` on
`PATH` commits normally — no error, no prompt, no half-broken repo for the
one teammate who has not built the tool yet.

That is deliberate and it is the difference between a guard people keep and a
guard people delete. Enforcement **degrades**; it does not lock out. The cost
is that an uninstalled machine gets no checking at all, which is what CI is
for.

The shim calls `mvac`, not `multivac`. If you expose only the long name, the
hooks find nothing and exit 0 silently — see [Install](../../guide/install).

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
| broken `present` / `unique` | informs, exit 0 | **blocks** |
| `moved` — self-healed rename | informs, exit 0 | informs, exit 0 |
| `unevaluated` — repo not on disk | informs, exit 0 | informs, exit 0 |
| a row in the `proposed` state | informs, exit 0 | informs, exit 0 |
| anchor parse error | **blocks** | blocks |

The blocking set is the `blocking:` key, default `[absent, count]`. You can
widen it; you cannot drop `absent`. See
[Configuration](../configuration#blocking).

The asymmetry is the whole design. A mid-refactor commit that moved a file
should not die on a presence check — that is noise, and a guard that produces
noise gets disabled within a week. Calling a mechanism that was deleted
should die immediately — that is damage, and it is exactly what nobody
notices by hand.

## Recommended ladder

```yaml
# .multivac/config.yml
blocking: [absent, count]   # the default: tombstones gate, renames do not
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
