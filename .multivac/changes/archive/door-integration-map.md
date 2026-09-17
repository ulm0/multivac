---
slug: door-integration-map
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-75
    - MV-128
  adds:
    - MV-130
  retires: []
claims:
  - id: MV-130
    statement: An SDD's own init installs the integration each declared door uses, from a door-to-integration map measured on a named version of the vendor, never forcing an integration the vendor marks unsafe beside another and naming every door it has no integration for; opsx carries its measured init.
---

# The SDD's own init installs the integration each declared door uses

The spec-kit init was `--integration claude` whatever `doors:` said, and opsx had no init recorded at all. Measured 2026-09-16 on spec-kit 1.0.7 and openspec 1.13.0; see `specs/055-door-integration-map/`.
