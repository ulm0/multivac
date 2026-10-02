---
slug: drop-graphers
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - MV-153
  retires: []
claims: []
---

# multivac keeps no code graph

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan drop-graphers`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [<ID>] — the rows close verifies; each row states its own rule

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours: with an SDD declared, `change close` only
appends the line citing its directory.
