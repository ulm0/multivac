---
title: Invariants
weight: 5
---

The law is a table of claims with a lifecycle:

    proposed → active → amended → retired

## Three birth paths, one table

- **Seeded** — `seed` proposes candidates from boundaries (a `revoke update`
  in a migration *suggests* "nobody writes balances"). Born `proposed`: not
  law until a human validates.
- **Interviewed** — the from-scratch path: the interview protocol draws the
  law out of the person's head.
- **Organic** — the main path at steady state: a decision made inside a
  change is declared an invariant at close.

## The agent proposes; the human enacts

The authority label demands it: "published" means someone with authority
answered for it, and an LLM cannot answer for it alone. New claims enter as
`proposed` rows — never blocking — and only a human flips a row to `active`.
Validation of seeded output runs in batches ordered by blast radius:
accept / correct / discard, with whatever stays unvalidated remaining marked
`proposed`.

### That rule is ungateable, and MV-81 says so

`verify` cannot check *who* enacted a row, and MV-81 declares it **ungateable
with its reason** rather than pretending. Two reasons, both properties of the
tool rather than gaps in it. multivac never fabricates git identity (MV-04): it
runs as whoever runs it, so an agent working on your machine commits under your
name and nothing in the repository tells the two apart. And a git hook executes
with the caller's permissions, so any gate installed at pre-commit is a gate the
same process can skip — a guardrail cannot live on the side of the thing it is
meant to stop.

Where it *is* enforced is the forge: the merge button, held by an account the
agent does not have. Nothing lands on `main` directly.

The half MV-81 does check is not **who** but **when**. A row that reaches
`active` in the same commit that writes the code it anchors is a rule nobody
reviewed on its own — the claim and its evidence arrive together under one hand
— so `verify` refuses that commit and names the files to unstage. It decides
this from the index against `HEAD`, which means it can only answer while a
commit is being composed; outside one it prints that it could not answer instead
of passing quietly. It is not a security boundary: nothing here stops a person
with push rights who decides to skip it.

## Amend

An invariant is **never relaxed in code** — it is changed in the law first.
A change declares "amends INV-xx", updates the row (dated) in that change,
and the code follows in the same change. Declare the amended row as one of the
change's **claims** and `change close` re-runs verify over it before it will
archive; listed only under `touches`, it is checked by the hook on every commit
rather than by `close`.

## Retire

The row is not deleted — it is marked `retired`, keeps its ID, and its
existing legs stop being evaluated. The tombstone is **authored, not
derived**: retiring writes NEW `absent` legs on that row for the dead
mechanism's identifiers — the names someone would grep for, in every surface
where they could resurface:

```markdown
| INV-19 | RETIRED — cart reservation holds stock. | specified | retired | 2026-08-13 | journal |
<!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
<!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
```

Existing legs are never flipped: inverting an enactment leg would demand the
enactment itself disappear, which is wrong in the general case. Same
primitive, new legs. In the same change, the dead mechanism's remains leave
the code and the doors — the new legs hold the change to it at close.

## IDs

**Stable, never renumbered, never reused.** History — who, when, why — is
git, not duplicated in metadata.
