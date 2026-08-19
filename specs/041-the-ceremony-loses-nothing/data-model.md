# Phase 1 — Data model: The ceremony loses nothing

## A claim at close

| Where its anchors live | Before | After |
| --- | --- | --- |
| in code, or anywhere outside the change file | verified, archived | unchanged |
| **only inside the change file being archived** | **verified, archived, then unanchored forever** | refused, naming the claim |
| nowhere | already refused | unchanged |

## The archive write

| Destination | Before | After |
| --- | --- | --- |
| absent | written | written |
| **exists** | **overwritten** | refused, naming the file |

## Row state, at the index-vs-HEAD read

| At HEAD | In the index | Verdict |
| --- | --- | --- |
| `active` | absent | refused (MV-107) |
| **`retired`** | absent | **refused** — the record of what a rule used to be |
| `proposed` | absent | allowed — a reservation given back |
| `active` | `retired` | allowed — the sanctioned exit |

## A frontmatter key

| Key | Before | After |
| --- | --- | --- |
| known | round-trips | round-trips |
| unknown | dropped in silence | dropped, and named where it is dropped |
