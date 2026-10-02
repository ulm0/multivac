---
slug: release-badge-moves-at-tag
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-77
  adds:
    - MV-154
  retires: []
claims:
  - MV-154
  - MV-77
---

# The badge moves when the tag lands

v0.15.0 published, yet the site kept advertising 0.14.1: GitHub Pages keys a deployment by its commit, and the release commit had already deployed from its push to main, before its tag existed.

Specified in `specs/083-release-badge-moves-at-tag/` (speckit).
