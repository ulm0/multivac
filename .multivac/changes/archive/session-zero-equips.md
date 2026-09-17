---
slug: session-zero-equips
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-136
  retires: []
claims:
  - id: MV-136
    statement: init prints session zero whole — repos before the first commit, sync, both flows with the fitting one marked, the project document, then law, doors and verify — seed reports each repo's graph and project document, and the skill runs sync, seed, project document, law and doors in that order.
---

# Session zero equips every repo before it drafts law

`init` printed one flow picked from the brain's own files and never asked for `repos:`, and the protocol drafted law over repos nobody had cloned or equipped. See `specs/061-session-zero-equips/`.
