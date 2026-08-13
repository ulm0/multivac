---
slug: prover-defects
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-12
    - MV-13
    - MV-14
    - MV-20
    - MV-23
  adds: []
  retires: []
claims:
  - id: MV-12
    statement: Two repo keys that name one tree on disk — through `.`, `..` or a symlink — are one evaluation target, so a `*` leg counts it once and no `unique` or `count` anchor doubles.
  - id: MV-13
    statement: "`change apply` finds the default branch before falling back to HEAD: `origin/HEAD`, then `init.defaultBranch`, then main, then master — so a checkout whose trunk is named anything else never bases a change branch on the branch that happens to be checked out."
  - id: MV-14
    statement: The repo-local runner counts only when its dependencies are installed too, so a built-but-uninstalled checkout reports INACTIVE and exits 0 instead of blocking every commit with a module-resolution stack trace.
  - id: MV-20
    statement: The verify summary line counts the same predicate the per-leg `· blocking` markers do, and it names the claims an open change is masking, so no run can print "0 blocking broken · exit 1".
  - id: MV-23
    statement: A `$` that follows an identifier character opens no dollar-quoted body, so `a$b$c` does not swallow the rest of the file into one statement.
---

# Five defects the prover found

Adversarial pass over the DOGFOOD-01 backlog diffs. Each item below is a live
repro, not a review opinion; each fix is the smallest one that closes it.

**MV-12 · two keys, one tree.** `isBrain` compares `resolve()`d strings and the
`*` target dedupe compares `dir` strings, so a repo entry reaching the brain (or
any repo reaching another) through a symlink is a second target over the same
files. `*:src/**.js /TOKEN/ unique` then reports `found 2 (alias:src/a.js:1,
brain:src/a.js:1)` — the same line, twice — and doctor tells you to submodule
the repo into itself. Both comparisons go through `realpathSync`.

**MV-13 · the HEAD fallback.** `branchBase` knows two trunk names. In a repo
whose default branch is anything else, it falls through to HEAD: run `change
apply` while another change's branch is checked out and the new branch is
started on top of that change's commits. The candidate list starts from what
git already knows offline — `origin/HEAD`'s target and `init.defaultBranch` —
before main and master.

**MV-14 · dist without node_modules.** The shim's repo-local rung tests only
that `dist/cli.js` is a file. With dependencies missing, `exec node` crashes
with `ERR_MODULE_NOT_FOUND` and exits 1: every commit in the repo is blocked by
a stack trace, which is the one thing MV-14 says the shim never does. Both
rungs that need a repo-local install now check for `node_modules` too.

**MV-20 · the summary contradicted the markers.** The footer printed
`blockingBroken`, counted with `strict=false`, while the per-leg markers and the
exit code read the `gating` set. A `--strict` run over a broken `unique` leg
printed `0 blocking broken · exit 1`; the symlink repro above printed `1` under
two `· blocking` lines. The footer reads `gating` now, and it also names the
claims an open change is holding pending — see below.

**MV-23 · dollar-quote false open.** `a$b$c` reads `$b$` as an opening dollar
tag, finds no close, and swallows the rest of the file into one statement — two
occurrences of a pattern merge into one match and a `unique` anchor goes green
on code that has two. Postgres opens a dollar quote only when the `$` does not
follow an identifier character; so does the scanner now.

## Not fixed here: pendency has no expiry

An open `changes/<slug>.md` that merely lists a claim id makes that claim
`pending` — reported, never gating, `--strict` included (MV-17). Nothing bounds
that in time or in scope. A change file with `repos: {}` and one hand-typed
claim id turns a live, already-red regression green:

    pending   X-01 [unique] invariants.md:6 · declared by open change stale-thing
    0 blocking broken · exit 0

The change file is committed, so an abandoned one masks that claim forever, and
the mask covers claims the change only *touches* — law that was green before the
change existed and whose failure is a regression by any reading. This change
makes the mask visible in the summary line instead of only in the body of the
report. Bounding it is a law change (MV-17) and belongs to its own change: the
tightest rule that keeps declare-first working is that only a claim in the
change's `invariants.adds` — law with no code yet — may pend.
