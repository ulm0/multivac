# Research: One page saying what is automatic, what is a gate, and what is yours

## D1 — No invariant identifiers in generated text

**Decision**: cite commands and artifacts. Never an identifier.

**Rationale**: this killed the first design. Identifiers are allocated from each
brain's own table by the reservation code, and `init` writes a table with zero
rows — so a generated `MV-56` names a different rule, or nothing, in every
ecosystem except this one. Commands and artifacts are universal: `change plan`
refuses without `specs/*<slug>*/plan.md` wherever the tool runs.

An `absent` leg keeps it that way, because the temptation to add "(MV-56)" for
authority is exactly what a later reader will feel.

**Alternatives considered**: rendering identifiers only when the row exists in
this brain's table — rejected: it makes the page's content depend on the reading
brain in a way nobody would predict, and a page that says different things in
two ecosystems is the drift being avoided.

## D2 — Every row is registry data or config, never prose about behaviour

**Decision**: rows are built from adapter entries and declarations.

**Rationale**: the review's standing warning was that this page becomes a second,
unanchored law table that reads authoritative and drifts. A row that is
*rendered* from the same data the gate reads cannot drift from the gate; a row
that is *typed* about the gate can. Where an adapter declares why a step cannot
be proven, that text is carried verbatim — a paraphrase would age beside its
source, which is the failure the whole project exists to prevent.

## D3 — Derived, and it says so

**Decision**: a managed block, regenerated whole, with a header saying it is
generated, what regenerates it, and that the law is what binds.

**Rationale**: the sharp line between derived and authored is what stops this
page becoming law by accident. The ritual is authored and never overwritten;
this is written by the tool and rewritten every projection. Saying so in the
page removes the ambiguity for a reader who finds it first.

## D4 — It exists even with nothing declared

**Decision**: always written.

**Rationale**: the problem being solved is a fresh brain reading as unenforced.
A page that appears only once adapters are declared would be missing exactly
when it is most needed. With nothing declared it names the lifecycle's own
obligations and says the adapter groups are empty because nothing is declared —
which is itself the answer to "what did I sign up for".
