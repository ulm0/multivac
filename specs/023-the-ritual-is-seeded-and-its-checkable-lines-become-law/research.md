# Research: A seeded ritual, and a line that a check can make true

## D1 — Candidates are commented

**Decision**: every seeded line arrives commented out.

**Rationale**: an unadopted ceremony is not a ceremony, and writing obligations
into an operator's file on their behalf is the tool deciding what their team
owes each other. The idiom already exists where `init` writes the configuration:
detected adapters are suggested, commented, and enabled by a human. Same shape,
same reason.

It also keeps the closing step honest: a fresh brain still prints nothing, which
is exactly what it did before, so nothing about the ceremony changes until
somebody means it.

## D2 — Only what nothing can check

**Decision**: seeded candidates are things no check could decide.

**Rationale**: a declared grapher contributes none — its work is automatic and a
gate already requires its artifact, so putting it in the ritual would move a
checked thing onto a poster, which is the inversion this whole change exists to
undo. What a specification tool contributes is the judgement its own registry
entry says nobody can verify.

## D3 — Move what is already enforced, name where it went

**Decision**: this repository's ritual loses the lines other mechanisms enforce,
and says where each went.

**Rationale**: the ritual's credibility rests on everything left in it being
genuinely uncheckable. Three of its four lines are enforced or superseded — the
landed half by the closing step's own refusal, the friction line by the roadmap
that now exists, and the claims-and-order half by a merge-request template that
already prompts both. Leaving them would teach readers to skim.

## D4 — The template's prompt gets its anchor

**Decision**: widen MV-34's template leg to cover the landing-order heading too.

**Rationale**: the template on disk already asks for both the claims and the
landing order; the law anchored only the claims. That is a rule half-checked,
and the cheapest possible fix is to check the other half — no new mechanism, one
leg.

## D5 — The docs gate is not built here

**Decision**: recorded, not shipped.

**Rationale**: it would have read `git diff <base>...<slug>`, and the closing
step refuses until every declared repo is recorded landed — where landed means
the branch is already an ancestor of the trunk. So the merge base is the branch
tip and the diff is empty by construction in the only state close can run in. It
would have refused every correctly landed change and passed only when the
operator's remote was stale.

There is a way — persist the fork point `apply` already prints and diff from
that — but it is a different mechanism with its own failure modes, and bolting
it onto a change about seeding a template would be shipping two things where one
was asked for. A gate that refuses correct work is worse than the poster it
replaces.
