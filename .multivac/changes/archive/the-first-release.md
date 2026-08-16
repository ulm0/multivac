---
slug: the-first-release
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-08
  adds:
    - MV-68
  retires: []
claims:
  - id: MV-08
    statement: The pnpm guard fires only inside this repo, so installing the published package with npm or npx works.
  - id: MV-68
    statement: The tarball ships dist and skills by allowlist, and releases publish by OIDC on a version tag, never a token.
---

# The first release

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan the-first-release`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive. Values round-trip unchanged; the body,
below the closing ---, is yours.
