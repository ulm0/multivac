# Quickstart: proving both halves

## Scenario 1 — the hook runs this tree's build (SC-001)

In this repository, with a global `mvac` of a different version installed:

```bash
pnpm build
git commit --allow-empty -m "probe" 2>&1 | head -3
```

Before: the version notice named the global's version. After: no mismatch
notice, because the build in this tree is what ran.

## Scenario 2 — a repository with only a dependency (SC-001)

```bash
grep -A3 'node_modules/multivac' .multivac/hooks/pre-commit
```

The declared dependency is tried before the machine's install and after this
repository's own build.

## Scenario 3 — nothing runnable still commits (SC-004)

```bash
mv dist dist.away
PATH=/usr/bin:/bin git commit --allow-empty -m "probe" 2>&1 | tail -2
mv dist.away dist
```

Expect the INACTIVE report and a commit that succeeded.

## Scenario 4 — a deleted test cannot pass (SC-002, SC-003)

```bash
pnpm build
cp test/verify/verify.test.ts /tmp/keep.ts
rm test/verify/verify.test.ts
pnpm test 2>&1 | grep -c "verify.test" || echo "not run — correct"
cp /tmp/keep.ts test/verify/verify.test.ts
```

Before this change the deleted file's compiled output ran and passed. After it,
the output is gone with the source.

## Scenario 5 — the property is pinned, not the script

```bash
pnpm build && node --test dist-test/test/hooks/runner.test.js
```

The suite fails if any compiled test has no source in the tree, whatever the
cause.
