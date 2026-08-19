# Quickstart — proving the gate reads the commit it gates

## Prerequisites

```sh
corepack pnpm install && pnpm run build
```

## Before the change

```sh
T=$(mktemp -d) && cd "$T" && git init -q .
node /path/to/multivac/dist/cli.js init --quiet .
git add -A && git commit -qm base            # hooks are installed by init

# 1. commit -a walks past the enactment gate
#    (stage a row reaching active beside the code it anchors, then:)
git commit -am "row and code together"       # lands today; must be refused after

# 2. the law can be deleted
git rm -q .multivac/invariants.md && git commit -qm "gone"
echo "exit $?"                                # 0 today; must be non-zero after
```

## After the change

Both commits are refused, and the message names what to do:

```txt
enact     REFUSED MV-99 beside src/thing.ts · blocking — enactment lands in its own commit …
law       REFUSED MV-99 was active and is gone · blocking — a row stops applying by being retired, not deleted …
```

## The measurement that must not regress

The reason the ambient pointers are dropped at all: a hook in the brain must
not read a sibling repo through the brain's index.

```sh
# with an ecosystem fixture (test/helpers/fixture.ts builds one):
#   commit in the brain, and confirm each sibling still reports its own state
pnpm test -- --test-name-pattern 'sibling'
```

## The suite

```sh
pnpm test
```

`test/verify/enact.test.ts` and `test/verify/config-gate.test.ts` carry the
hook-level cases. A test that calls the check directly would pass while the
defect survived, because the defect lives in the environment a hook runs under.
