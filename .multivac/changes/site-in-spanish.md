---
slug: site-in-spanish
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-78
  adds:
    - MV-157
  retires: []
claims:
  - MV-157
  - MV-78
---

# The site is published in Spanish and English

The site is published in English (en-US, the default) and Spanish (es-419), each page twice and kept in step by a test. The human asked for it on 2026-10-06, which moves the constitution's "English everywhere, no exceptions" for the site only; the constitution is amended in this change. The why, the design and the tasks are in `specs/086-site-in-spanish/`.
