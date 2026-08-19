---
slug: a-proof-names-one-feature
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - MV-113
  retires: []
claims: []
---

# A proof names one feature

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan a-proof-names-one-feature`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours.
