# Phase 0 — Research: The row is read from its end

Measured against this brain, 119 rows, and the three parsers that read them.

## Measurement 1 — how many rows are wrong, and which

Splitting each row on `|` gives 8 cells when the body has none. Two rows give
more:

| row | cells | `cells[4]` reads | actually |
| --- | ---: | --- | --- |
| MV-108 | 9 | `specified` (the authority column) | `proposed` |
| MV-112 | 12 | `` true` → exit 0, everything on stdout; `` | `proposed` |

Counting from the right over all 119: 104 `active`, 15 `proposed`, 0 `retired`,
0 `drift`, and every id matches. Two rows in 119 today — and the number only
goes up, because the body is prose about a command-line tool and amendments
quote what the tool prints.

**Decision**: count the trailing cells from the END of the row. The id stays
the FIRST cell, which no body pipe can move.

**Rationale**: the row's shape already says where its state is. A date and a
markdown link cannot contain an unescaped `|`; the body can and does. Teaching
the parser to honour `\|` escapes would be a markdown parser, and it would
still be wrong for the unescaped pipes already in the file.

**Alternatives considered**: escape the pipes in the two offending rows
(rejected — it fixes today's corpus and leaves the parser waiting for the next
author); split with a limit (rejected — the same arithmetic from the same end);
require the body to avoid `|` (rejected — a rule that the prose may not quote
the tool is a rule about the wrong thing).

## Measurement 2 — there are THREE parsers, not one

`src/anchor/parse.ts`'s own docstring says the parse lives in one place because
*a second parser of the law table is how the two would eventually disagree
about what a row's state is*. There are two others:

- `lawRows` in `src/change/reserve.ts:32-49` — the same left-counted mistake in
  four cells rather than one: `statement: cells[2]`, `state: cells[4]`,
  `date: cells[5]`, `source: cells[6]`.
- `countActiveInvariants` in `src/doors/brain.ts:17-23` — reads the header,
  finds `state` at index 4, then indexes the DATA row at 4. The header has no
  body, so the index is right for a row that has none and wrong for a row that
  does.

**Decision**: one parser, returning all six cells, and the other two deleted.

**Rationale**: this is what the docstring already claims and what the fix
otherwise has to be applied to three times. It is also a net deletion.

## Measurement 3 — what a mis-parsed state costs, per consumer

- **MV-81's enactment gate** (`verify.ts:456`) keeps rows `active` now and not
  `active` at HEAD. A garbage state is never `active`, so the row reaches
  `active` unnamed. Found this way: enacting MV-105 … MV-118 named twelve of
  fourteen.
- **MV-107's death gate** (`verify.ts:387-394`) refuses removing a row that is
  `active` or `retired` at HEAD. A garbage state is neither, so the row is
  deletable in silence.
- **`legGates`** (`verify.ts:813`) exempts `proposed` and `drift` only, so a
  mis-parsed `proposed` row is NOT exempt and its broken legs go on to the
  blocking-mode test. Today that is one leg in seventeen — MV-108's `count=2`
  — because `unique` and `present` are not in the default blocking set; the
  other sixteen are one `strict_pre_push: true` away.
- **The retirement filter** (`verify.ts:876`) gives a `retired` row only its
  `absent` tombstones. A mis-parsed one evaluates every leg it ever had. Latent
  — the table holds no retired row today — and it is the shape MV-107 made the
  sanctioned exit, so it is the expected future.
- **`change plan`'s id-collision refusal** (`reserve.ts:174`) fires only when
  `existing.state === 'proposed'`. A garbage state fails that test, so a second
  change declaring the same id is waved through with the mangled prose printed
  as the "state" — `say`, not `warn`, exit 0. The argument the tool promises to
  have at declare time happens in a merge conflict instead.

## Measurement 4 — why no test caught it

`test/anchor/parse.test.ts:164` pins a row whose body contains no `|`, so
`cells[4]` and the fourth-from-last cell are the same cell and the test cannot
tell the two arithmetics apart. Every law table in `test/helpers/fixture.ts`
and every fixture in the suite is six clean columns. The corpus that exercises
the defect is the real law file, which no test parses.

**Decision**: the new tests use a row whose body contains `|` — and one with
`||` — because that is the input that separates the two readings.

## Constitution and law

- **MV-81** — enactment is reviewable because the check names the rows. This
  restores that for a row whose author quoted a pipe.
- **MV-107** — the law's death is gated. Same.
- **Principle II** — the tool's own failure mode is reporting success it did
  not check. A gate naming twelve of fourteen and looking complete is exactly
  that, in the gate written against it.
