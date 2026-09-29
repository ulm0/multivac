---
slug: verify-rooted-and-quiet
status: open
horizon: later
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-53
    - MV-112
    - MV-127
    - MV-138
    - MV-150
  adds:
    - MV-151
  retires: []
claims:
  - MV-151
---

# verify finds its root and speaks only when something is off

verify read whatever directory it was run from and printed its full report on every clean run, including after every edit an agent made.
