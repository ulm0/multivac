---
slug: ci-code-gate
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-142
  retires: []
claims:
  - id: MV-142
    statement: this repository's merge request pipeline runs verify --strict over the request's range against its source branch, and that reader accepts a change closed on the same branch.
---

# The merge request pipeline judges a request's code against its change

MV-137's binding reader ran nowhere, and it would have refused a branch that closed its own change. See `specs/068-ci-code-gate/`.
