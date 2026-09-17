---
slug: code-lands-in-a-change
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-137
  retires: []
claims:
  - id: MV-137
    statement: where a repo resolves an SDD with automation on, verify refuses a commit, a merge or a CI range that changes code outside the branch of an open change declaring that repo; a skipped SDD is recorded in the change; doctor states the forge settings enforcement needs.
---

# Code lands inside a started change

With an SDD declared, code could still be committed on main, merged locally, or pushed with `--no-verify`, and nothing asked whether a change was started. See `specs/062-code-lands-in-a-change/`.
