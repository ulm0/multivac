# Contract — the law row

A data row of `.multivac/invariants.md` is

```txt
| <id> | <statement> | <authority> | <state> | <date> | <source> |
```

- The **id** is the first cell. Nothing in the row can move it.
- The **statement** is prose about a command-line tool. It may contain `|`,
  and does: `||`, `2>&1 |`, code spans. Everything between the id and the four
  trailing columns is statement.
- **authority**, **state**, **date** and **source** are the last four columns,
  counted from the end. None of them can contain a `|`: a date has no place
  for one and a markdown link has no syntax for one.

One parser reads this. A second parser of the same table is how the two
eventually disagree about what a row's state is — the reason this contract is
written down rather than implied.
