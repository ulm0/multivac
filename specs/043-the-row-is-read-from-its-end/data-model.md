# Phase 1 — Data model: The row is read from its end

## The row

```txt
| MV-NN | body | authority | state | date | source |
```

Split on `|`, a row with no pipe in its body gives eight cells: an empty one,
the six columns, and an empty one. Only the body can add more.

| field | was | is |
| --- | --- | --- |
| id | `cells[1]` | `cells[1]` — unchanged, nothing can move it |
| statement | `cells[2]` | everything between the id and the last four columns |
| authority | — | 5th from the end |
| state | `cells[4]` | 4th from the end |
| date | `cells[5]` | 3rd from the end |
| source | `cells[6]` | 2nd from the end |

A row with fewer than the full set of trailing cells yields empty strings
rather than a neighbour's column.

## The parsers

| where | was | is |
| --- | --- | --- |
| `src/anchor/parse.ts` | `parseClaimRows` → `{id, state}` | the one parser → all six fields |
| `src/change/reserve.ts` | `lawRows` → `{id, statement, state, date, source}`, left-counted | deleted; calls the one parser |
| `src/doors/brain.ts` | header index into the data row | deleted; calls the one parser |

## What changes for this brain's rows

| row | state was read as | state is |
| --- | --- | --- |
| MV-108 | `specified` | `proposed` |
| MV-112 | `` true` → exit 0, everything on stdout; `` | `proposed` |
| the other 117 | correct | unchanged |
