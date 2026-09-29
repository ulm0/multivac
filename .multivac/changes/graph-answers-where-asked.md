---
slug: graph-answers-where-asked
status: open
horizon: now
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-25
    - MV-50
    - MV-52
    - MV-90
    - MV-103
    - MV-122
    - MV-124
    - MV-128
    - MV-129
    - MV-131
    - MV-132
    - MV-134
    - MV-137
    - MV-139
    - MV-140
    - MV-143
  adds:
    - MV-148
  retires: []
claims:
  - id: MV-148
    statement: The graph the agent asks is one that answers. A brain that holds no code resolves no grapher and keeps no code graph, keeping an existing install until a human removes it; the brain door and change apply say where each code repo's graph is asked from the brain; the brain's post-edit refresh follows edits into the code repos and never into a checkout of the brain; and the grapher's ignore lines are the root's non-code directories, written before the first build and at land, and committed with the graph.
---

# The graph the agent asks is one that answers

A code-less brain built a code graph of its own law and specs, while nothing told an agent in the brain where the code repos' graphs are asked from.
