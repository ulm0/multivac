---
slug: a-stale-brain-is-said-at-the-moment-work-starts
status: archived
horizon: now
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-94
  retires: []
claims:
  - id: MV-94
    statement: A pin behind its channel is said at the moment work starts — change new and change apply report it from the same offline read verify uses, and report is all it does, because a pin can be behind only because nobody fetched.
---

# A stale mount is said when work starts, not only when verify runs

The brain is mounted as a git submodule in each declared repo, and pin staleness
is already computed offline — the gitlink in each repo against the brain's
channel ref. The consumer door already says to refresh the mount. The mechanism
is good.

The gap is when it speaks. Staleness is reported by `verify`, defaults to
`report`, and nothing says it at the moment work begins: `change new` and
`change apply` never look at the pin. "Refresh before you start" is exactly the
instruction that needs to arrive at the start.

Reuse `stalenessLines`, which is already offline — never a second
implementation. The open question the implementer must settle and defend: report
or refuse, at each of the two steps, and how `staleness: block` interacts with
it. The default must not make an ordinary `change new` fail for somebody who has
not fetched today; a gate that fires on a normal morning is a gate people learn
to skip.
