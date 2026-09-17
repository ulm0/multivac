---
slug: graph-owned-and-committed
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-134
  retires: []
claims:
  - id: MV-134
    statement: change land refreshes and commits the shared graph on the change branch of each ready repo it may write in, the lifecycle builds, installs, judges and refreshes graphs only in the brain and the repos the change names, and change close leaves no refreshed graph out of a printed commit.
---

# The graph is committed on the change branch, for the repos the change names

Every close from 052 to 058 in this repo left `graphify-out/graph.json` modified and needed a hand-made graph commit, and the lifecycle's graph work reached declared repos no change named. See `specs/059-graph-owned-and-committed/`.
