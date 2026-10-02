---
slug: release-badge-moves-at-tag
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-77
  adds:
    - MV-154
  retires: []
claims:
  - MV-77
---

# The badge moves when the tag lands

v0.15.0 published, yet the site kept advertising 0.14.1: GitHub Pages keys a deployment by its commit, and the release commit had already deployed from its push to main, before its tag existed.
