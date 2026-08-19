---
slug: the-row-is-read-from-its-end
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-119
  retires: []
claims:
  - id: MV-119
    statement: "A law row's state is read from the END of the row, never by counting cells from the front: the body is prose that quotes shell, so a `|` in it moves every column after it and the gates that read a state go blind in silence."
---

# The row is read from its end

Found while enacting MV-105 … MV-118: `verify` named twelve of the fourteen
rows that reached `active` in that commit. The two it could not see were the
two whose body contains a `|`.

`parseClaimRows` splits the row on `|` and reads `cells[1]` as the id and
`cells[4]` as the lifecycle state. The law table is

```txt
| MV-NN | <prose body> | <spec state> | <lifecycle state> | <date> | <link> |
```

and the body is prose about a command-line tool, so it quotes `||`, `2>&1 |`
and code spans. Every such row shifts the columns after it. Measured over the
119 rows in this brain today: two are wrong, MV-108 reading `specified` and
MV-112 reading `` true` → exit 0, everything on stdout; ``.

What that costs, in the three places a state is read:

- **MV-81's enactment gate is blind to the row.** `enacted` keeps rows whose
  state is `active` now and was not `active` at HEAD. A row whose state parses
  as prose is never `active`, so it can reach `active` without the one gate
  that exists to make enactment reviewable ever naming it.
- **MV-107's death gate lets the row be deleted.** `lawDeath` refuses removing
  a row that is `active` or `retired` at HEAD. A mis-parsed row is neither, so
  it is deletable in silence — the exact hole MV-107 closed, reopened for any
  row whose author used a pipe.
- **`legGates` and the retirement filter read it too.** Only `proposed` and
  `drift` are exempt from gating, so a mis-parsed `proposed` row gates as if
  enacted; and a `retired` row evaluates only its tombstone legs, so a
  mis-parsed one evaluates every leg it ever had.

The fix is the shape of the table, not a wider parser: the last four cells of
a row are always `<spec state> <lifecycle state> <date> <link>`, and neither a
date nor a markdown link can contain a `|`. Count from the end.
