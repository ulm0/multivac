# Phase 1 — Data model: The ledger keeps itself

## SDD artifact glob

| Declared | Matches | After |
| --- | --- | --- |
| `specs/*<slug>*/spec.md` | any directory CONTAINING the slug | — |
| `specs/*-<slug>/spec.md` | a directory ENDING in `-<slug>` | this |

The separator is part of the pattern, so `expire` is not satisfied by
`030-points-expire`.

## Slug availability

| State | Today | After |
| --- | --- | --- |
| no change, no archive | opens | unchanged |
| open change with that slug | refused | unchanged |
| **archived change with that slug** | **opens, and close overwrites it** | **refused, naming the archive** |

## Bookkeeping, per lifecycle step

| Step | Writes | Commits today | Commits after |
| --- | --- | --- | --- |
| `new` | change file, law row | yes | unchanged |
| `plan` | change file, law rows | yes | unchanged |
| `apply` | change file | yes | unchanged |
| `land --landed` | change file | **no** | yes |
| `close` | archive, law links | prints a command | prints it **including the law path** |
| `close --abandon` | archive, law row | prints a command | same, and the record says what landed |

## Tracker entry

| Field | gitlab | github |
| --- | --- | --- |
| `binary` | `glab` | `gh` |
| `edit` | `issue update` | `issue edit` |
| **`labelFlag`** | **`--label`** | **`--add-label`** |
| `close` | `issue close` | `issue close` |

A vendor whose label flag is not documented gets no entry, rather than a
guessed one.
