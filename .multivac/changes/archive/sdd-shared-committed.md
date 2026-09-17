---
slug: sdd-shared-committed
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-133
  retires: []
claims:
  - id: MV-133
    statement: change apply carries the SDD's uncommitted shared files and the change's own artifact directory from each writable named repo's checkout onto the change branch, commits them there and removes them from the checkout, refusing before it writes any modified tracked or ignored file among them, and gives the worktree its own spec-kit feature pointer.
---

# A change carries its SDD files onto its branch

Every change from 052 to 057 in this repo needed `specs/<n>-<slug>/` copied into its worktree by hand and deleted from the checkout before the merge would run. See `specs/058-sdd-shared-committed/`.
