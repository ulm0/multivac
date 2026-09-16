---
slug: equip-on-sync-and-lifecycle
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-75
    - MV-87
    - MV-128
  adds:
    - MV-129
  retires: []
claims:
  - id: MV-129
    statement: Every command that sets a repo up equips it. repos sync runs the declared SDD's recorded init and the grapher's first build in every declared, writable repo on disk, change plan and change apply do so again after they clone or create a repo, and change new and repos sync name a tool they would run and cannot find, change new refusing before it writes.
---

# Every command that sets a repo up equips it

MV-128 made `init` install what it declares in the brain. The siblings still
wait: measured 2026-09-16 on 0.13.0, `repos sync` exits 0 and leaves a declared
repo with no SDD and no graph; `change new` with `specify` off PATH commits the
change first and says the tool cannot run after; and `plan`/`apply` equip
before their clone loop, so a repo they clone or create waits for the next
command.

Spec, plan and tasks: `specs/054-equip-on-sync-and-lifecycle/`.
