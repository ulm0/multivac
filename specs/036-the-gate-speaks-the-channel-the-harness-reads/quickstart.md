# Quickstart — proving the gate reaches the agent

## Before

```sh
T=$(mktemp -d)
printf '#!/bin/sh\necho "MV-01 broken"\necho "a warning" >&2\nexit 1\n' > "$T/mvac"
chmod +x "$T/mvac"

PATH="$T:/usr/bin:/bin" sh -c 'mvac verify'; echo "exit $?"
# exit 1, findings on stdout — Claude Code returns neither to the model
```

## After

```sh
PATH="$T:/usr/bin:/bin" sh -c 'mvac verify 2>&1 || true'   >/tmp/o 2>/tmp/e; echo "session exit $?"
PATH="$T:/usr/bin:/bin" sh -c 'mvac verify >&2 || exit 2'  >/tmp/o 2>/tmp/e; echo "edit exit $?"
# session: exit 0, everything on stdout   → carried into context
# edit:    exit 2, everything on stderr   → returned to the model to answer
```

And with the stub removed from PATH entirely, the edit form still exits 2: a
gate whose binary has gone refuses rather than waving through.

## The upgrade

```sh
# a brain with the legacy entry
node dist/cli.js doors
git diff .claude/settings.json     # one entry per event, rewritten in place
node dist/cli.js doors
git diff .claude/settings.json     # empty — idempotent
```

## The suite

```sh
pnpm test
```
