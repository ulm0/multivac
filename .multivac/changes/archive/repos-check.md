---
slug: repos-check
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-132
  retires: []
claims:
  - id: MV-132
    statement: multivac repos check answers, offline and with no vendor on PATH, whether every declared repo is cloned as declared and, where multivac may write, whether its declared tools are installed with their shared artifacts in HEAD and its project document written; one function decides clone state, and plan and apply refuse a named repo that is present but not that clone.
---

# Every declared repo can be checked cloned and set up, offline

Measured 2026-09-16 on 0.13.0: `repos check` does not exist, and `repos` and `doctor` call a plain directory and an unborn repo present. See `specs/057-repos-check/`.
