---
slug: codegraph-worktrees-and-verbs
status: open
horizon: next
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-52
    - MV-58
    - MV-61
    - MV-74
    - MV-121
    - MV-124
    - MV-128
    - MV-134
    - MV-140
    - MV-148
  adds:
    - MV-149
  retires: []
claims:
  - id: MV-149
    statement: codegraph answers where the code is. change apply builds or syncs an index in each checkout it hands out and land syncs it on the branch; the registry records the codegraph verbs that were run, each with what it misses, and discloses by version what the agent's own calls write and send; the brain's session gets one post-edit refresh hook per grapher, and no hook refreshes anything for a file outside every repository; and a consumer's codegraph index keeps the mounted brain out through codegraph's own exclude list.
---

# codegraph: an index per worktree and the verbs that replace grep plus Read

A change's worktree had no codegraph index, so a query there answered from the index above it; the door listed one verb that loses to grep.
