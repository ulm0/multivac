---
slug: site-docs-second-audit
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-156
  retires: []
claims:
  - MV-156
---

# The pages say what the code does, second audit

A second audit of the site against the built 0.15.0 binary, 2026-10-05, found the pages still claiming more than the code does, and quoting output it does not print. This includes a sentence MV-155 itself wrote. The why, the design and the tasks are in `specs/085-site-docs-second-audit/`.
