# Data Model: A roadmap item is a change that has not started yet

## Entity: ChangeFile

The existing entity, extended. Defined in `src/change/file.ts`, serialized as
YAML frontmatter above a prose body.

| Field | Type | Change | Notes |
|---|---|---|---|
| `slug` | string | unchanged | unique across every state, including the archive |
| `status` | `planned \| open \| archived` | **widened** | was `open \| archived` |
| `horizon` | `now \| next \| later`, optional | **new** | written only when set; meaningful while `planned` |
| `repos` | map key → `{ status }` | unchanged | may be empty while planned |
| `landing_order` | list of stages | unchanged | may be empty while planned |
| `invariants` | `{ touches, adds, retires }` | unchanged | `adds` stays empty until the change starts |
| `claims` | list of `{ id, statement }` | unchanged | empty while planned — a claim is what `change plan` produces |

### Validation rules

- `status` accepts exactly the three values; any other is an error naming all
  three, the way the two-value message names both today.
- `horizon` accepts exactly `now`, `next` or `later` when present, and its
  absence is legal in every state. An unknown value is an error naming the
  three accepted values.
- A `planned` change is exempt from no other rule. `repos`, `landing_order`,
  `invariants` and `claims` validate exactly as they do in any other state, so
  an operator who wants to sketch repos while planning may, and the file still
  parses on the day it is promoted.

### State transitions

```text
                 roadmap add
                      │
                      ▼
                  ┌────────┐   change new    ┌──────┐   change close   ┌──────────┐
                  │ planned│────────────────▶│ open │─────────────────▶│ archived │
                  └────────┘   (promotes,    └──────┘   (file moves    └──────────┘
                      │         reserves id)     ▲       to archive/)
                      │                          │
                      │                     change new
                      └── no other transition    │  (scaffolds a new file)
                                                 │
                                              (no planned file)
```

- `planned → open` is the only transition out of `planned`, and `change new` is
  the only command that performs it. Every later lifecycle step — `plan`,
  `apply`, `land`, `close` — refuses a planned change and names `change new` as
  the step that comes first.
- The transition is where the invariant id is reserved. Before it, the change
  holds no id; a planned change that is deleted costs the table nothing.
- The body is carried across the transition byte for byte. The tool owns the
  frontmatter's formatting and rewrites it on every step; it owns none of the
  prose.
- Nothing transitions back. A change that started and should not have is
  abandoned through the existing path (`change close --abandon`, which returns
  the id), not demoted to planned.

## Entity: Horizon

A closed set of three values with a defined print order: `now`, then `next`,
then `later`. It carries no dates, no estimates, no dependencies between items
and no numeric rank — that exclusion is permanent, not deferred.

Within one horizon, items are ordered alphabetically by slug. Any other order
would encode a priority the model deliberately does not have.

## Entity: Roadmap listing

A derived view, holding nothing of its own. Built by reading every
`.multivac/changes/*.md` — never `archive/`, which is closed and confers
nothing — and partitioning by status:

- planned changes, grouped by horizon and sorted by slug within each group. The
  title shown beside a slug is the body's first `#` heading — the one recorded
  with the intention — and a body without one lists the slug alone rather than
  inventing a title;
- a count of changes whose status is `open`, reported separately so intention
  is never read as progress.

A change file that will not parse is skipped by the listing rather than
crashing it, the same way `verify`'s scan skips it: a broken change file is
`change`'s diagnostic to raise, and a roadmap that cannot be read because one
entry is malformed is worse than a roadmap missing one line.
