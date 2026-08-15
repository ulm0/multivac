---
slug: the-gate-names-its-room
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-56
    - MV-57
  adds: []
  retires: []
claims:
  - id: MV-56
    statement: The SDD gate says where it looked and where it found it — every root by the name the config gave it.
  - id: MV-57
    statement: init carries the sdd's project-level document into the door it writes, not only doors.
---

# The gate names its room

Two small lies found by driving both SDD adapters end to end against the real
`openspec` and `specify` binaries, 2026-08-15.

**The gate searched rooms it never named.** `sddRoots` has always looked in the
brain and in every declared repo present on disk — a change whose specs live in
the code repo would otherwise be refused for an artifact sitting right there.
But the refusal only ever said `specs/*<slug>*/spec.md is missing`, and the pass
only ever said `specs/001-dark-mode/spec.md ok`. In an ecosystem of six neither
line says which checkout was meant, so the agent writes the spec into whichever
one it happens to be standing in and the gate refuses again. The roots now carry
the key the config gave them: the refusal ends `— looked in brain, api, web`, and
the pass reads `sdd speckit: api: specs/001-dark-mode/spec.md ok`.

**MV-57 claimed `init` carried the constitution instruction. It did not.**
`multivac init --sdd speckit` wrote the empty-brain door, which mentions no SDD
at all; the project-law line only appeared after somebody ran `multivac doors`,
a separate command nothing prompts. An agent that read the door `init` wrote saw
no constitution, and spec-kit ships `.specify/memory/constitution.md` as an
unfilled template, so nothing else would tell it either. The project-law lines
are now one function, `projectLawLines`, and both doors render it.

Neither change touches what gates: the constitution stays reported, never gated,
and no new artifact became gateable.
