# Contract — what proves a step

## The language

An artifact path is literal except for `<slug>` and `<n>`. `<n>` is one run of
digits and matches within a single path segment: it cannot cross `/` and it
cannot cross `-`. There is no wildcard.

## What proves, and what does not

| Slug | Directory | Proves |
| --- | --- | --- |
| `expire` | `031-expire` | yes |
| `expire` | `030-points-expire` | **no** — the token cannot swallow `030-points` |
| `points-expire` | `030-points-expire` | yes |
| `gate-b` | `001-gate-b-login` | no — unchanged since MV-110 |
| any | a directory of the right shape written by hand | yes; the artifact is the proof and carries no author |

## What a clash does

Two directories proving one step is refused, naming both and the root. It is
not resolved by sort order, by date, or by taking the shortest — a gate that
picks silently is the failure this project exists to catch.

## Invariants of the contract

1. The proof is the artifact, never a pointer to it.
2. A slug cannot forge a token: slugs are `[a-z0-9][a-z0-9._-]*`.
3. The first declared root holding any hit decides, and the refusal names it.
