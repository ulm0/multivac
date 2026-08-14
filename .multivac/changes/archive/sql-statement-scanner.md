---
slug: sql-statement-scanner
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-23
  retires: []
claims:
  - id: MV-23
    statement: "SQL statement splitting only breaks on a semicolon at depth zero: single-quoted literals (with '' escapes), dollar-quoted bodies ($$ or $tag$) and line/block comments carry their semicolons without splitting the statement."
---

# SQL statements survive quotes and dollar bodies

The normalizer's quote scan was declared naive in its own `ponytail:` comment:
`''` escapes read as two adjacent strings and dollar-quoting was not handled at
all, so the first `;` inside a `$$ ... $$` function body split one statement
into two. Both halves normalize to something no `absent` tombstone or `count=N`
ratchet was written against — the exact per-statement escape statement
normalization exists to close.

Replacing the quote branch with a small depth-zero scanner: single-quoted
literals consume `''` as an escape rather than resyncing on parity, dollar
quotes are matched by tag, comments are skipped, and `;` splits only outside all
three. Anchors: `src/anchor/normalize.ts` for the scanner,
`test/anchor/normalize.test.ts` for the function body that stays whole.
