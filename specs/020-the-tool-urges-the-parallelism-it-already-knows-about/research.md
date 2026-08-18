# Research: The tool urges the parallelism it already knows about

## D1 — The signal is the stage, and it is already declared

**Decision**: name the repositories in the first ready stage.

**Rationale**: `landing_order` is the operator's own statement that repositories
inside one stage have no ordering dependency on each other — that is what
putting them in the same stage MEANS. Nothing has to be inferred, and nothing
new is computed. Later stages are not named because they are blocked by an
earlier one, which is the same declaration read the other way.

**Alternatives considered**: reading the SDD task list's parallel markers —
rejected for this change: those live in a file the tool does not own, they are
per-task rather than per-repo, and acting on them means a second reader of an
artifact that already has one consumer. Worth its own change if it is ever
worth doing.

## D2 — The boundaries are stated every time

**Decision**: every parallel message carries "not the same file" and "not the
law".

**Rationale**: the useful half of this message is the boundary. Without it the
line reads as "go faster", and the two failures it invites are real and quiet:
two writers to one file is a lost update, and the law is a single table whose
ids are allocated one at a time, so concurrent changes serialise there by design
— which is exactly the collision MV-26 exists to prevent.

## D3 — Print-only, and the row says why

**Decision**: neither half is gated.

**Rationale**: no artifact proves an agent ran two things at once, and none
proves it did not stop to ask permission. A gate on either would be reading
something it cannot see. This is MV-27's reason, and the registry already states
the same limit in the same words for the SDD steps it cannot prove ran — those
`ungateable:` clauses are the precedent and the wording to match.

## D4 — Continue by default; the opt-out goes on the same line

**Decision**: the step instruction says to run the chain to completion, and
names the opt-out beside it.

**Rationale**: the lifecycle already refuses to advance without each step's
artifact, so the sequence was never a choice — asking permission between steps
costs six confirmations per feature and decides nothing. Putting the opt-out on
the same line is the difference between a tool that assumes and a tool that
decides for you.

Stopping is for a genuine question — an unresolved clarification the tool itself
flags — which is a different thing from asking whether to proceed. The
instruction says so, because an agent that cannot tell them apart will either
never stop or always stop.

## D5 — The clause is built where every step clause is built

**Decision**: in the shared instruction builder, not per adapter.

**Rationale**: a new adapter should inherit it. Writing it into each adapter's
entry would make it data that has to be repeated, and the registry's rule is
that an entry carries what the vendor documents — not how this tool likes to
phrase encouragement.
