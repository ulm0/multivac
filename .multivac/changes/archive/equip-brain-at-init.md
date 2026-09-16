---
slug: equip-brain-at-init
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-51
    - MV-75
    - MV-91
  adds:
    - MV-128
  retires: []
claims:
  - id: MV-128
    statement: init equips the brain it scaffolds. It runs the declared SDD's recorded init and the declared grapher's first build in the brain, through the same self-limiting functions the change lifecycle uses, and a tool it would run and cannot find refuses init with exit 1 before anything is written. Step zero commits exactly the paths init wrote, minus vendor-local ones, never with git add -A.
---

# init equips the brain it scaffolds

`init --sdd speckit --grapher graphify` wrote both names into the config and the
door and installed neither. Measured 2026-09-16 on 0.12.0: in a fresh repo it
exits 0 and creates no `.specify/` and no `graphify-out/`, with the vendors on
PATH or without them. The functions that would do it — `runScaffold` and
`ensureGraphs` — exist, never throw, and are called only by `change`. A missing
binary surfaced at the first `change new`, after the brain existed. And step
zero told a brain==code repo to `git add -A`, sweeping the user's uncommitted
work into the "multivac init" commit.

Spec, plan and tasks: `specs/053-equip-brain-at-init/`.
