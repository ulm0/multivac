---
slug: site-docs-match-code
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-155
  retires: []
claims:
  - MV-155
---

# The reference docs say what the code does

The audit of 2026-10-03 found the reference pages claiming more than the code does, and quoting output it does not print. The why, the design and the tasks are in `specs/084-site-docs-match-code/`.

Findings from the audit that the code did not bear out, dropped: `_index.md` and `philosophy.md` say "enforcement degrades, it never locks you out" of a machine **without the binary**, which is true as scoped (the shim exits 0 when nothing can run multivac); and `change abandon`'s final commit line is already described in the closing paragraph of `commands.md`. The stale-mount exit 2 is documented, not changed.
