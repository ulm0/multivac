---
slug: the-mount-explains-itself
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - MV-49
  retires: []
claims: []
---

# verify names a stale mount instead of advising init

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan the-mount-explains-itself`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive. Values round-trip unchanged; the body,
below the closing ---, is yours.
