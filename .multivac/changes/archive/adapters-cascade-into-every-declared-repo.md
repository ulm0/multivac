---
slug: adapters-cascade-into-every-declared-repo
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-75
    - MV-76
  adds:
    - MV-87
  retires: []
claims:
  - id: MV-87
    statement: A declared adapter is evaluated, acted on and reported PER ROOT — the brain plus every declared repo present on disk — and one root's artifact never answers for another's.
---

# adapters cascade into every declared repo

Spec: `specs/013-adapters-cascade-into-every-declared-repo/spec.md`.

Measured in a real ecosystem (a brain governing five sibling repos) before it
was written down. Three findings, one shape:

1. `runScaffold` returns as soon as ANY root has the SDD artifact, so a single
   repo somebody initialized by hand suppresses scaffolding for every other
   root — the brain included. Declaring the tool made nothing happen anywhere.
2. Even when it runs it scaffolds `roots[0]` only. The sibling repos are the
   operator's to init, a policy that lives in a code comment and in no row.
3. `doctor`'s SDD pass collapses every root into one boolean, so it prints
   `artifact ok` over five unequipped repos — and the project-document gate
   reads the same way, so one repo's constitution satisfies MV-76 for the whole
   ecosystem. The grapher pass already reports per scope and is the shape the
   SDD pass should have had.

Separately: the graph is only ever built for repos a change touched, so a repo
must be worked on before it can be navigated — backwards for an agent that
needs the graph in order to work on it.

MV-75 is touched because its "runs it when the scaffold is missing" never said
missing WHERE, and the implementation answered "in the brain, unless anyone
else has it". MV-76 is touched because its gate must ask per root, and only of
roots where the tool is actually installed.
