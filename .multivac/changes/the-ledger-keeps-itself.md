---
slug: the-ledger-keeps-itself
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-13
    - MV-26
  adds:
    - MV-46
  retires: []
claims:
  - id: MV-46
    statement: The lifecycle commits its own bookkeeping — nothing it writes is left floating in the shared checkout.
---

# The ledger keeps itself

The change's bookkeeping — the reserved law row and the declaration file's
status — used to live as UNCOMMITTED edits in the shared brain checkout while
the work happened in a worktree. Concurrent changes trampled each other, pulls
were blocked, and a reservation row evaporated and was restored by hand
(dominant friction theme of the last two dogfood runs).

The fix, at the root:

1. `change new` commits its bookkeeping: declaration + reserved row, one
   commit on the current branch (`change open: <slug> — reserves <ID>`).
   A dirty tree at those two paths is refused with the exact command.
2. `apply` commits the status bump before branching, so every worktree
   inherits the declaration, the reservation and the post-bump status from
   the branch base. The manual carry is deleted.
3. `close` scopes every printed command to the closing slug's paths and
   prints the branch+MR variant when the brain has an origin and sits on the
   default branch; the direct commit is named appropriate only for a solo
   brain with no remote.
4. The scaffold teaches: a commented `repos:` example naming the status
   enum, and `new` prints the three edits the author must make.
5. `count` learns each-mode: zero-match files listed, mode-aware summary.
6. The anchor-grammar shadow copy in test/skill.test.ts is replaced by the
   parser itself; the mode vocabulary gets a source-of-truth checklist in
   config.ts.
