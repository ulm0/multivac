---
slug: the-consumer-door-carries-the-ecosystem
status: planned
horizon: now
repos: {}
landing_order: []
invariants:
  touches: []
  adds: []
  retires: []
claims: []
---

# A door in a code repo names the ecosystem, not only the law

The door projected into each declared repo is four bullets: the law path, the
mount refresh, "the change may cross repos", and "run verify". The brain's door
lists the ecosystem and carries the adapter blocks. An operator entering
through a code repo — the normal case, because code is where work happens —
gets none of it.

The graph half landed with MV-90. What is still missing: the list of sibling
repos and what each one is, the SDD block resolved per repo, and the mount
refresh raised from bullet three to the first instruction of any session,
because a stale pin means deciding against weeks-old law.

"What each repo is" is not derivable from a path, so it needs an optional
per-repo field carrying one line of role, rendered when present and omitted
when absent — never invented (Principle V).

**From the review, before implementing.** The SDD block would instruct an agent
to run a chat command in a repo where that tool may never have been scaffolded:
the door renders from config alone and probes nothing, because MV-01 keeps it
offline. That is only honest because MV-75 and MV-87 make `change plan` run the
vendor's own init in every root lacking it — so the door must carry that clause
verbatim, and `runScaffold`'s per-root behaviour must be confirmed first. It
also warns rather than scaffolding on three paths. Get that wrong and the door
is an invented integration claiming more than was checked.
