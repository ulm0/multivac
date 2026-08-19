# Quickstart — proving the refusal reads the whole token

## Prerequisites

```sh
corepack pnpm install
pnpm run build
```

## The three defects, before the change

Run these against the current build to see what is being fixed.

```sh
T=$(mktemp -d) && git -C "$T" init -q

# 1. The published regression: a declared flag, refused as unknown.
node dist/cli.js init --provider=claude --quiet "$T"   ; echo "exit $?"
# expected today: exit 2, "unknown flag --provider=claude"

# 2. The gate that reports it checked: --repo eats --strict.
node dist/cli.js verify --repo --strict               ; echo "exit $?"
# expected today: a NON-strict verify, no refusal

# 3. The command that mutates, ignoring an argument.
node dist/cli.js change land some-slug api            ; echo "exit $?"
# expected today: exit 0, nothing recorded
```

## After the change

```sh
pnpm run build

node dist/cli.js init --provider=claude --quiet "$T"  ; echo "exit $?"
# expected: exit 0, and grep claude "$T/.multivac/config.yml" finds it

node dist/cli.js verify --repo --strict               ; echo "exit $?"
# expected: exit 2, naming --repo as needing a value

node dist/cli.js change land some-slug api            ; echo "exit $?"
# expected: exit 2, naming "api" as unexpected, with the change file untouched
```

## The regression check that matters

Both written forms of every valued flag must parse to the same value. The suite
proves it by walking the command registry rather than a list somebody typed:

```sh
pnpm test
```

Watch for `test/cli/unknown-args.test.ts` and `test/cli/args.test.ts`. The seam
the previous change missed is one input asked of **both** readers — the guard
and the parser — rather than each reader asked about a different input.

## Net deletion

FR-007 is checkable from the diff:

```sh
git diff --stat main -- src/
# expected: more lines deleted than added under src/
```
