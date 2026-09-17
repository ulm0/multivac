---
slug: ecosystem-graph
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-139
  retires: []
claims:
  - id: MV-139
    statement: the brain keeps .multivac/ecosystem.json, a deterministic node-link graph of its own declarations — repos, law rows without their text, anchors and changes — written by doors and every brain bookkeeping commit, carried in the close recipe, reported by verify when stale, and named by the doors.
---

# The brain keeps its ecosystem's governance graph

The relationships between repos, law rows, anchors and changes were derivable offline and rendered nowhere. See `specs/064-ecosystem-graph/`.
