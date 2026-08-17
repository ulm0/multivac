---
slug: the-site-has-a-voice
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - MV-82
  retires: []
claims: []
---

# The site sets its own type: one human face, one machine face

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan the-site-has-a-voice`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive. Values round-trip unchanged; the body,
below the closing ---, is yours.
