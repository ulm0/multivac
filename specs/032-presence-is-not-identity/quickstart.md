# Quickstart — proving presence is not identity

## Prerequisites

```sh
corepack pnpm install && pnpm run build
```

## The five defects, before

```sh
T=$(mktemp -d) && cd "$T" && git init -q .
node /path/to/multivac/dist/cli.js init --provider copilot --quiet .

# 1. the stub door eats a user file
echo "my own guidance" > .github/copilot-instructions.md
node /path/to/multivac/dist/cli.js doors
cat .github/copilot-instructions.md          # the guidance is gone

# 2. any dist/cli.js is run as multivac
mkdir -p dist node_modules && echo 'require("fs").writeFileSync("EXECUTED","")' > dist/cli.js
git add -A && git commit -qm x && ls EXECUTED   # it ran

# 3. a comment arms the report
printf '#!/bin/sh\n# TODO: wire up multivac\n' > .git/hooks/pre-commit
node /path/to/multivac/dist/cli.js doctor --strict   # says the hook runs multivac
```

## After

1. the guidance survives, with the managed block added
2. `EXECUTED` is never created — the rung is skipped because `package.json` does
   not name multivac
3. `doctor` says the hook does NOT run multivac, and prints the line to append
4. `strict_pre_push` reaches an already-installed shim
5. `init .` twice leaves the strict shim strict and the version record untouched

## The suite

```sh
pnpm test
```
