---
slug: enactment-is-gated-where-the-credential-lives
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-81
  retires: []
claims:
  - id: MV-81
    statement: "Who enacts a row is not a fact on disk, so the tool says so instead of pretending to check it, and enforces the one half it can: a state change to active lands in its own commit, never beside the code it anchors."
---

# Enactment is gated where the credential lives

"The agent proposes; the human enacts" is the rule that governs who may change
the law. It lives in `skills/multivac/SKILL.md` and in
`site/content/docs/concepts/invariants.md` — prose in two places, **anchored in
neither**. The one rule about who is allowed to change the law is the one rule
`verify` cannot check.

That is not an oversight to correct by writing a leg. It cannot be checked, and
the evidence is this session:

```
$ git log --format="%an <%ae>" -3
Pierre Ugaz <me@ulm0.com>
Pierre <me@ulm0.com>
```

An agent flipped seven rows from `proposed` to `active` and git records the
human's name on every one. There is nothing in the repository that distinguishes
a person from an agent acting as them, and that is deliberate: MV-04 forbids
multivac from fabricating git identity. It runs as whoever runs it.

The second reason is harder. **Git hooks execute with the caller's permissions.**
Any gate multivac installs at pre-commit is a gate the same process can skip.
A guardrail cannot live on the side of the thing it is meant to stop.

## So the row says so

This is the shape the project already uses for `/speckit.analyze` and for a
clean `/speckit.converge`: a step that cannot be proven is declared **ungateable
with its reason**, and the message says so rather than faking a check. The same
answer is owed here, and it is currently missing entirely — the rule is not even
present in the law to be marked unprovable.

Where it IS enforced is the forge: the merge button, held by an account the
agent does not have. That held all through this session — nine merge requests
opened by an agent, every one merged by a person.

## The half that is checkable

Not who, but **when**. A row that goes `proposed → active` in the same commit
that writes the code it anchors is a rule nobody reviewed on its own: the claim
and its evidence arrive together, authored by the same hand, and the reviewer
sees a diff where the new rule is drowned in the change that motivated it.

Enactment lands in its own commit. That is mechanical, local, and refusable —
the same shape MV-46 already uses to keep the lifecycle's bookkeeping scoped to
its own paths.

## Considered and declined

A `CODEOWNERS` entry covering `.multivac/invariants.md` — which would make the
forge require a named human's approval on any merge request touching the law —
was proposed and **declined by the brain's owner**. It is recorded here rather
than dropped silently, so a later reader finds a decision instead of a gap. No
reason is stated because none was given to state.

## Not claimed

Nothing here stops a person with push rights who decides to skip it, and the row
must not imply otherwise. What it addresses is the ordinary path and the
unsupervised agent — and the second one is the real case, because the agent does
not hold the button.
