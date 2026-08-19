---
slug: the-ceremony-loses-nothing
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - MV-117
  retires: []
claims: []
---

# The ceremony loses nothing

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan the-ceremony-loses-nothing`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours.
