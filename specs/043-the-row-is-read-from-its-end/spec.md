# Feature Specification: The row is read from its end

**Feature Branch**: `the-row-is-read-from-its-end`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "A law row's state must be read from the end of the row. The body is prose that quotes shell, so a pipe in it moves every column after it and the gates that read a state go blind."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A row with a pipe in it is still gated at birth (Priority: P1)

A maintainer enacts a batch of rows — `proposed` to `active` — and the
enactment check names them so the commit is reviewable. Two of the rows are
missing from that list, and nothing says so. They are the two whose body
quotes a shell pipe.

**Why this priority**: enactment is the one act the tool calls human, and
MV-81's check is the only thing that makes it reviewable. A report that names
twelve of fourteen and looks complete is this project's own failure mode, in
the gate written to prevent it.

**Independent Test**: stage a law file in which a row whose body contains `|`
moves to `active`, and confirm the check names it.

**Acceptance Scenarios**:

1. **Given** a row whose body contains one or more `|`, **When** it reaches
   `active` in a commit, **Then** the enactment check names it exactly as it
   names a row without one.
2. **Given** the same row unchanged, **When** any commit is made, **Then**
   nothing is falsely reported as enacted.

---

### User Story 2 - Such a row cannot be deleted in silence (Priority: P1)

MV-107 refuses a commit that removes a row which is `active` or `retired` at
HEAD. A row whose state parses as prose is neither, so it can be deleted and
the commit lands green.

**Why this priority**: it is the hole MV-107 closed, reopened for any row whose
author quoted a command. Deletion is unrecoverable at the gate: once the row is
gone nothing looks again.

**Acceptance Scenarios**:

1. **Given** an `active` row whose body contains `|`, **When** a commit removes
   it, **Then** the commit is refused, naming the row.
2. **Given** the same row moved to `retired`, **When** a commit removes it,
   **Then** it is refused as well.

---

### User Story 3 - Gating and retirement read the state they were given (Priority: P2)

`legGates` exempts `proposed` and `drift`; the evaluation filter gives a
`retired` row only its tombstone legs. Both read the same mis-parsed state, so
a mis-parsed `proposed` row gates as if enacted and a mis-parsed `retired` row
evaluates every leg it ever had.

**Why this priority**: it is the same defect, and it costs false refusals
rather than silent passes — second for that reason, and included because
fixing the parser fixes all three at once.

**Acceptance Scenarios**:

1. **Given** a `proposed` row whose body contains `|`, **When** one of its legs
   is broken, **Then** it is informational, not blocking.
2. **Given** a `retired` row whose body contains `|`, **When** verify runs,
   **Then** only its `absent` tombstone legs are evaluated.

---

### Edge Cases

- A row with fewer cells than the table declares — a hand-written row missing
  its link — must not be read as though its date were its state.
- A line that starts with `|` and is not a law row at all (a table inside a
  change file, a table in the site) still yields nothing: the id column already
  decides that, and it is the FIRST cell, which no body pipe can move.
- A body containing an escaped `\|`: markdown's escape for a literal pipe. It
  still splits, and counting from the end still lands on the right cell.
- A row whose LINK cell contains a pipe: impossible in markdown link syntax,
  and stated here so the assumption is on the record rather than implied.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A claim row's lifecycle state MUST be read from a position
  counted from the END of the row.
- **FR-002**: The claim id MUST keep being read as the first cell, which no
  body pipe can move.
- **FR-003**: A row that does not carry the full set of trailing cells MUST
  yield an empty state rather than a cell belonging to another column.
- **FR-004**: Every consumer of a row state — the enactment check, the death
  check, the gating predicate and the retirement filter — MUST read the one
  parser, and no second parser may be introduced.
- **FR-005**: No new runtime dependency, no new file under `src/`.

### Key Entities

- **Law row**: `| id | body | spec state | lifecycle state | date | link |`,
  where only the body can contain a `|`.
- **Lifecycle state**: `proposed`, `active`, `retired` — the value four cells
  from the end.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every row in this brain parses to the state its author wrote,
  measured by comparing the parse against the rendered table.
- **SC-002**: A row whose body contains `|` reaching `active` is named by the
  enactment check.
- **SC-003**: Deleting such a row when it is `active` or `retired` is refused.
- **SC-004**: A `proposed` row with a pipe does not gate.
- **SC-005**: The existing suite passes.

## Assumptions

- The table's trailing columns are fixed and always present: this is what
  `change new` writes and what every row in the corpus carries.
- A date and a markdown link cannot contain an unescaped `|`; the body can and
  routinely does, because this brain documents a command-line tool.
- Widening the parser to understand escaped pipes is not the fix and is not
  attempted: the row's shape already says where its state is.
