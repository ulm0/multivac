# Research: Issues from the change files, one way

## D1 — The vendor's command-line tool, never a client of our own

**Decision**: shell out to the tracker's own tool.

**Rationale**: it already solves authentication, tokens, hosts and enterprise
installs. Writing a client here would add a dependency to do the same job worse,
against the two-dependency invariant, and would put credential handling in a
tool whose whole claim is that it holds none.

## D2 — The number is the identity, and it lives in the change file

**Decision**: record `issue: <n>` in the frontmatter.

**Rationale**: identity has to survive a title edit, so it cannot be the title;
it has to be readable without the network, so it cannot be a lookup. The number
is both. Not a link: the project comes from the repository's remote, so a link
carries a derivable half that would have to be parsed back out on every run —
and would go stale the day the repository moves.

The alternative — deriving identity by searching the tracker for a matching
title — is what the specification tool's own issue command does, and it breaks
the moment somebody edits a title.

## D3 — One way, and the row says it

**Decision**: nothing the tracker says ever changes a change file.

**Rationale**: a projection that reads back is a second source, and two sources
drift — which is the failure the roadmap exists to end, moved one layer out.
Closing an issue by hand therefore closes nothing; the next projection restores
it, because the change file said so.

## D4 — Only our own labels

**Decision**: write labels in one namespace and leave every other label alone.

**Rationale**: teams label for their own reasons, and a projection that
reconciles the whole set erases that on every run. One wiped triage is enough to
have the projection turned off permanently, and then the drift it prevented
comes straight back.

## D5 — An absent binary refuses

**Decision**: refuse, naming the binary and the install line.

**Rationale**: a projection that cannot run must not report success — the same
rule the graph gate follows, and Principle II in one sentence.

## D6 — One issue per change, for now

**Decision**: the change is the unit here; stories are recorded as the next
step.

**Rationale**: a story-level projection means a second reader of the
specification tool's task list — a file that today has exactly one consumer, in
the tool that writes it. Reading somebody else's artifact from a second place is
a coupling worth its own change, and everything this one builds is what story
issues would need underneath them anyway.
