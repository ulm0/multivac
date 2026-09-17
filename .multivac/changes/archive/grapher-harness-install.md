---
slug: grapher-harness-install
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-129
  adds:
    - MV-131
  retires: []
claims:
  - id: MV-131
    statement: A declared grapher's own project install runs in every writable root for each declared door it has a measured platform for, a door without one is named, a hook the install writes never names one machine's path to the binary, and doctor names a missing install without running it.
---

# The grapher's own project install runs for each declared door

graphify 0.9.29 has a project install per harness and nothing ran it; the hooks it writes name the binary by this machine's absolute path. Measured 2026-09-16; see `specs/056-grapher-harness-install/`.
