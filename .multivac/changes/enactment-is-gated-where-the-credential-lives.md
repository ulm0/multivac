---
slug: enactment-is-gated-where-the-credential-lives
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-81
  retires: []
claims:
  - id: MV-81
    statement: "Who enacts a row is not a fact on disk, so the tool says so instead of pretending to check it, and enforces the one half it can: a state change to active lands in its own commit, never beside the code it anchors — decided from the index against HEAD, so it answers only inside a commit and says so when it cannot."
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

## What the check can reach, and when

`verify` reads **tracked files**. A tracked file shows a state; it never shows a
state *change*, so "in the same commit" is not a question verify can answer as
it stands. The evidence that does answer it is the **index against HEAD**, and
the index is populated exactly while a commit is being composed — which is the
pre-commit run, where verify already lives.

So the check answers inside a commit and nowhere else, and it says which of the
two it is on every run:

- **not answered** — nothing staged, no HEAD yet, or a consumer checkout whose
  index has no law file, each with its reason;
- **no row enacted** — the question was asked and came back clean;
- **enacted alone** — a row reached `active` with none of its anchored code
  beside it;
- **REFUSED** — the row and its code arrived together; the line names the rows,
  the files, and the `git restore --staged` that clears it.

Rejected: comparing the working tree's law against the channel ref (MV-53),
which would answer on any run. It answers a *different* question — "has this
branch enacted a row since it forked" — true for every commit after the enacting
one, so the refusal would follow the branch around until a merge, and the
verdict would depend on how recently anyone fetched.

Cost: one `git diff --cached` in the ordinary case; three more calls only when
the law file is among the staged paths.

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
