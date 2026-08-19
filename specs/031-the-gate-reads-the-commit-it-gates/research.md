# Phase 0 — Research: The gate reads the commit it gates

Measured on this machine, git 2.x, with a real `pre-commit` hook printing both
readings of the same commit. Nothing here is recalled.

## Measurement 1 — the ambient index is not the index on disk

A scratch repo with `a.txt` tracked and modified, `b.txt` staged:

| commit form | `GIT_INDEX_FILE` | with ambient | without ambient |
| --- | --- | --- | --- |
| `git commit` | `.git/index` | `c.txt` | `c.txt` |
| `git commit -a` | `.git/index.lock` | `a.txt b.txt` | `b.txt` |
| `git commit -- one.txt` | `.git/next-index-NNN.lock` | `one.txt` | `one.txt two.txt` |

**Decision**: the ambient `GIT_INDEX_FILE` is the only correct answer for the
repository the hook is running in.

**Rationale**: the two gates ask "what is this commit composed of". Under `-a`
the on-disk index answers about a different, smaller set — the silent-bypass
direction. Under a pathspec commit it answers about a larger set — the
false-refusal direction. Only the ambient index is the commit.

**Alternatives considered**: read the working tree instead (rejected, and the
existing docstring says why: it would refuse a commit for an edit deliberately
left unstaged, and miss a staged edit since reverted); parse `git status
--porcelain` (rejected — same question, more parsing, still the wrong index);
have the hook shim pass the paths in (rejected — `verify` is also run by hand,
and a check that only works from the shim is a check that stops working the
moment somebody runs the command).

## Measurement 2 — keeping only `GIT_INDEX_FILE` is enough, and is safe

With `GIT_DIR`, `GIT_WORK_TREE` and `GIT_PREFIX` still dropped and only
`GIT_INDEX_FILE` restored, `git -C <repo> diff --cached --name-only` reads the
ambient index and reports the commit's paths.

**Decision**: restore only `GIT_INDEX_FILE`, and only for the ambient repo.

**Rationale**: `GIT_DIR` is the pointer that makes `-C` meaningless, which is
the whole reason `cleanEnv` exists (its docstring: a hook in the brain would
read every sibling repo through the brain's index and report the ecosystem as
untracked). Restoring the index pointer alone keeps `-C` authoritative about
WHICH repo, while the index says WHICH COMMIT.

**Alternatives considered**: restore the whole ambient environment for the
ambient repo (rejected — wider than the problem, and `GIT_PREFIX` would change
how relative paths resolve).

## Measurement 3 — deciding "is this the ambient repo"

`GIT_DIR` may be relative (`.git`), and the brain may be reached through a
symlink or a `..` path. Comparing strings would answer wrongly in both
directions.

**Decision**: resolve both sides to an absolute git directory and compare with
the existing `samePath` helper — the same one MV-12 uses to decide that two
keys naming one tree are one repo.

**Rationale**: it is the comparison this codebase already made law. Reusing it
means one notion of identity rather than two.

**Alternatives considered**: `git rev-parse --absolute-git-dir` run under the
ambient environment (rejected — an extra subprocess per call on the hot path
of a sub-second gate); comparing inode numbers (rejected — no cross-platform
guarantee, and `samePath` already exists).

## Measurement 4 — what the law's death looks like today

In this brain, on a scratch clone:

```txt
$ git rm .multivac/invariants.md && git commit -m "gone"
0 claims · 0 anchored
0 blocking broken · exit 0        # the commit lands
```

The same holds for deleting a single `active` row: nothing compares the law
against its previous self except `enactmentLine`, which asks only about rows
that REACHED active, never about rows that left.

**Decision**: extend the existing HEAD-vs-index read rather than adding a
second reader.

**Rationale**: `enactmentLine` already loads both blobs and parses both sides.
The rows that vanished are one `filter` away from the rows that arrived, and
MV-81's own docstring — "two copies is how two answers appear" — argues against
a second reader.

**Alternatives considered**: a standalone `deathLine` beside `configLine`
(rejected — it would re-read the same two blobs); gating in `change close`
instead (rejected — deletion does not need the lifecycle to happen, which is
exactly the hole).

## Constitution and law

- **MV-81** — enactment lands alone. Unchanged; it simply starts seeing the
  commits it always meant to.
- **MV-97** — the config's death is gated. This change gives the law file the
  same treatment, and reuses the mechanism rather than copying it.
- **MV-12** — spelling is not identity. `samePath` is the comparison.
- **Constitution IV** — deterministic, offline, sub-second: one extra resolution
  per process, no network, no dependency.
