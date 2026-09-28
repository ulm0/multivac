---
slug: opsx-through-its-cli
status: open
horizon: now
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-51
    - MV-56
    - MV-63
    - MV-75
    - MV-95
    - MV-121
    - MV-124
    - MV-130
    - MV-133
    - MV-144
    - MV-146
  adds:
    - MV-147
  retires: []
claims:
  - id: MV-147
    statement: opsx runs through its own CLI. Its printed steps are openspec's terminal verbs, the scaffold installs no command body, the questions the bodies asked ride on the printed lines, the archive is printed without a flag and its confirmation goes to the human with the tool's own preview and answers, a land step's proof is read in the brain checkout alone, close stages a merged main spec only when it carries the merge, and change new refuses a slug the SDD refuses.
---

# opsx: the agent runs openspec's own CLI, not the command bodies

With openspec declared, the agent drives the flow through openspec's own terminal verbs instead of loading ~58 KB of command bodies that orchestrate the same CLI.
