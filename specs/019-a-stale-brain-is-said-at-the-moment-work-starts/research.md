# Research: A stale mount is said when work starts

## D1 — Report, never refuse

**Decision**: both steps report; neither refuses.

**Rationale**: offline, a pin behind its channel has two indistinguishable
causes — somebody landed work, or nobody fetched. Refusing on the second is a
gate that fires on a normal morning, and a gate that fires on a normal morning
is a gate people learn to skip. The configuration already offers blocking, and
it is enforced in the verifier where it always has been; adding a second refusal
would mean two places to be wrong about one question.

**Alternatives considered**: refusing at `apply` but not at `new` — rejected as
a rule with no principle behind it: both are the start of work. Refusing when
the configuration blocks — rejected as duplication; the verifier already does
exactly that, and runs on every commit.

## D2 — The one computation, exported rather than copied

**Decision**: export `stalenessLines` and call it.

**Rationale**: it is the same question with the same answer, and MV-90 has just
finished paying for the alternative — `change close` kept its own copy of a
scope list and the two disagreed by design. One computation means one place to
be right.

## D3 — Two moments, and no others

**Decision**: `change new` and `change apply`.

**Rationale**: those are the two commands that mean "I am starting". `plan`
resolves what is already declared, `land` and `close` are endings. Printing the
same lines at every step would make them wallpaper.

## D4 — The report carries what it cannot know

**Decision**: keep the verifier's existing wording, including the last-fetch age
and the uncomparable case.

**Rationale**: those clauses exist because the read is offline. A line saying "3
behind" without saying "last fetch 6d ago" invites a reader to trust a number
that describes their own laptop rather than the ecosystem.
