# Quickstart: prove the record matches the release

## In the change worktree, after the edits

```sh
node dist/cli.js verify --strict           # 120 claims, 0 blocking broken, exit 0
node dist/cli.js count 'brain:{*.md,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md /(look for|try) `?mvac`?( on `?PATH`?)? first|`?mvac`? on `?PATH`?,? (then )?`?npx --no-install/'   # 0 matches (4 in 3 files before)
pnpm test                                   # full suite green (MV-78, MV-72 tests included)
```

Read the 0.10.0 entry and find each ID:

```sh
for n in $(seq 105 119); do grep -q "(MV-$n[,)]" CHANGELOG.md || echo "missing MV-$n"; done   # prints nothing
grep -n "MV-72" CHANGELOG.md                # one line, in 0.2.0
```

Constitution:

```sh
grep -n '^\*\*Version\*\*' .specify/memory/constitution.md       # 2.0.2
grep -m1 -n '^Version change' .specify/memory/constitution.md    # 2.0.1 → 2.0.2
```

## The bite run (scratch copy only)

While the change is open MV-120 is `proposed`: a green leg reads ok and a broken one reads pending, never blocking. To see them bite:

1. `git clone` the branch into a scratch directory, and symlink `node_modules`.
2. Set MV-120's state to `active` and move the change file aside.
3. `verify` must exit 0.
4. Revert one fix at a time and run `verify` after each; it must exit 1 with the named leg:
   - the four doc copies → leg 1 (`[absent]`, 4 matches in 3 files);
   - MV-14's lead → leg 2;
   - one amendment note → leg 3 (`count=2 pinned, found 1`);
   - the footer set to 2.0.0 or 2.0.1 → leg 4.

## Enactment (not part of this change)

A human flips MV-120 from `proposed` to `active`, staged alone: `enact MV-120 → active, alone in this commit`.
