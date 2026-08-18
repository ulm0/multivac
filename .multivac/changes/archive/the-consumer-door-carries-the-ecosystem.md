---
slug: the-consumer-door-carries-the-ecosystem
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
    - MV-93
  retires: []
claims:
  - id: MV-93
    statement: The door projected into a declared repo carries the ecosystem it belongs to — the sibling repos and the handle anchors use for the brain, the adapters that apply to that repo, and the mount refresh as the first instruction of a session rather than the second of four bullets.
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

## What the review changed before a line was written

The design was drafted and then attacked by a reader whose only job was to
refute it. No fatal, and nine corrections that would each have cost a
round trip:

- the `role:` anchor as first written could never match the code the same
  design proposed, because the parse wraps `optString` in another call —
  a broken leg on day one;
- the door clause about the SDD adapter claimed `change plan` runs the tool's
  own init, when it runs from four lifecycle points and WARNS instead of
  scaffolding on three paths. A door that overstates what the tool does is
  Principle II broken in the one file an agent reads first;
- the refresh line is the second of four bullets, not the third, and a law row
  that misdescribes what it replaces decays the day it is written;
- a single-repo ecosystem would have printed a list whose only row was "(this
  repo)";
- `brain` can never appear in a list built from `repos`, because it is an
  implicit anchor handle — so a heading promising "the keys anchors name"
  would have omitted the one key every consumer's anchors may use;
- the probe-nothing leg scanned for identifiers anywhere in the file, so it
  would have gone red the day somebody wrote "this door never calls
  `existsSync`" in a comment: MV-46's mistake inverted, failing instead of
  passing.

Recorded here because the next reader deserves the corrected design, not the
first one.
