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

## Amend

An invariant is **never relaxed in code** — it is changed in the law first.
A change declares "amends INV-xx", updates the row (dated) in that change,
and the code follows in the same change. `change close` checks law and code
ended up consistent.

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
