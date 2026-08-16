---
slug: ls-files-counts-each-file-once
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-71
  retires: []
claims:
  - id: MV-71
    statement: Enumeration yields each tracked file exactly once, and a tree mid-merge is named on the read line.
---

# ls-files counts each file once

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan ls-files-counts-each-file-once`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive. Values round-trip unchanged; the body,
below the closing ---, is yours.

Found by an operator, not by a test: a homepage edit of two lines came back
with `MV-30 count=2 pinned, found 6` and `MV-43 unique, found 3`. Both files
were correct — `hextra/feature-grid` really appears twice, the anchor-mode list
really appears once. The repo was mid-merge, and `git ls-files` prints one line
per index stage for a conflicted path, so every match was counted three times.
6 = 2x3, 3 = 1x3.

What makes this worse than a wrong number is the sentence attached to it:

    revert the new occurrence, or ratchet to count=6

Followed, that writes 6 into the law for a claim whose true count is 2 — and
the merge that caused it disappears, leaving a corrupted ratchet nobody can
explain later. A miscount that arrives with confident advice is worse than a
crash, because a crash gets investigated.

`lsFiles` now passes `--deduplicate` (git's own answer, there since 2.31) with
a `Set` behind it for older git. And because a verdict taken mid-merge is about
a tree nobody will commit, every `read` line now names the unresolved paths:

    read  brain: working tree on … — the brain's own repo, the commit this run
          gates · 1 path(s) MID-MERGE (site/content/_index.md) — resolve the
          merge before trusting any verdict here

The regression test builds a real conflict with git rather than mocking one,
and asserts both halves: `git ls-files -u` reports three stages, `lsFiles`
reports one file.

## And the ignore rule that let a symlink through

CI caught what the local run could not:

    [ENOTDIR] ENOTDIR: not a directory, mkdir '/builds/ulm0/multivac/node_modules'

This branch was built in a git worktree, and the worktree got a `node_modules`
**symlink** into the main checkout so the build would not have to install
again. `git add -A` committed the symlink, and CI cannot create the real
directory on top of it.

`.gitignore` had `node_modules/` — with the trailing slash, which matches
**directories only**. A symlink of that name is not a directory, so the rule
that exists precisely to stop this never fired. Both spellings are there now,
and two legs pin it: nothing tracked at `node_modules`, and the slashless line
present in `.gitignore`.

The shortcut is not worth repeating either: a worktree installs its own
dependencies. pnpm's store makes that nearly free, and it is the difference
between a build that is like CI's and one that only looks like it.
