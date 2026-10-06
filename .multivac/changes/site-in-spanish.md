---
slug: site-in-spanish
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - MV-157
  retires: []
claims: []
---

# The site is published in Spanish and English

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan site-in-spanish`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [<ID>] — the rows close verifies; each row states its own rule

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours: with an SDD declared, `change close` only
appends the line citing its directory.
