---
slug: consumer-verify
status: archived
repos:
  self:
    status: landed
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-09
  retires: []
claims:
  - id: MV-09
    statement: Running verify in a repo without .multivac/config.yml resolves the
      brain through the mount directory, scopes evaluation to that repo's
      anchors plus * anchors, and exits per the same matrix.
---

# verify runs from a consumer repo

The gap: `verify` inside a consumer repo — a code repo with the brain mounted
at `.brain/` (or the configured mount) — exits 2 because there is no
`.multivac/config.yml` there. Layer-1 enforcement wants verify to work from
every repo that commits.

The fix: when the cwd has no config, look for a mounted brain (a directory
that itself has `.multivac/config.yml`, `.brain` preferred), resolve which
registry key the cwd corresponds to (path/url/basename match, `--repo` as the
explicit override), and evaluate only that repo's anchors plus `*` anchors
scoped to it. Same exit matrix. Consumer mode never rewrites moved globs —
the mount is usually a pinned submodule; the heal belongs in the brain
checkout.
