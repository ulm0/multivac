---
slug: change-file-cites
status: open
horizon: next
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-15
    - MV-45
    - MV-80
    - MV-117
  adds:
    - MV-150
  retires: []
claims:
  - id: MV-150
    statement: The change file cites, never restates. A claim is its row's ID; a legacy statement round-trips and is never created; close refuses a claim of no row, an undeclared, retired or unstated row and an added row that is anchored but unclaimed, printing every refusal in one run, and every surface that says close says what close refuses.
---

# The change file cites, never restates

Nothing read a claim's statement, yet every change restated its row there and most of those restatements had drifted from the row they cite.
