---
slug: the-gate-reads-the-commit-it-gates
status: open
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-106
    - MV-107
  retires: []
claims:
  - id: MV-106
    statement: A check that reads the index reads the index the commit is being composed in. The ambient git pointers are dropped for every repo except the one the hook is running for, where dropping them answers about a different set of files than the one being committed.
  - id: MV-107
    statement: "The law's death is gated the way its birth is: a row that was active and is gone, or a law file removed entirely, refuses the commit and names what to do instead."
---

# The gate reads the commit it gates

Two gates read the index — MV-81's enactment check and MV-97's config check —
and both read the wrong one under the most common way to commit.

`cleanEnv()` drops `GIT_INDEX_FILE` for every git call, and it is right to:
git's own environment overrides `-C`, so a hook running in the brain would read
every sibling repo through the brain's index and report the whole ecosystem as
untracked. But the brain itself is not a sibling. Measured on git 2.x:

| commit form | ambient index | index on disk |
| --- | --- | --- |
| `git commit` | same | same |
| `git commit -a` | `a.txt b.txt` | `b.txt` |
| `git commit -- one.txt` | `one.txt` | `one.txt two.txt` |

So `git commit -a` — the form most people type — composes a commit containing
files the gate never sees, and a pathspec commit shows the gate files the
commit does not contain. One direction is a silent bypass, the other a false
refusal. Once such a commit lands, no later run flags it: both checks are about
the commit being composed, and that moment has passed.

The second half is the asymmetry the audit named. `verify` gates the config
file's death (MV-97) and a row's birth (MV-81), and gates nothing about the
law's own death: `git rm .multivac/invariants.md && git commit` prints
`0 claims · 0 anchored`, exit 0. Deleting the single row whose tombstone blocks
you does the same, quietly. The machinery to close it is the one MV-97 already
shipped — the index against HEAD, in the function that already reads both.
