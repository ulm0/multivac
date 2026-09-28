---
slug: ci-moves-to-github-actions
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-34
    - MV-68
    - MV-77
    - MV-111
    - MV-142
  adds:
    - MV-145
  retires:
    - MV-88
claims:
  - id: MV-145
    statement: CI runs on GitHub Actions under .github/workflows/, pinned to each action's latest released tag, and .gitlab-ci.yml plus .gitlab/ are gone
---

# ci moves to github actions

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan ci-moves-to-github-actions`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours.
