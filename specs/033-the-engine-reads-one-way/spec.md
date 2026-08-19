# Feature Specification: The engine reads one way

**Feature Branch**: `the-engine-reads-one-way`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "The dialect gate must refuse what it cannot honour, and every reader of a file must read it the same way."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A mistyped class is refused, not compiled (Priority: P1)

An author writes `<!-- @anchor MV-99 api:src/** /PIN[:digit:]/ absent -->`,
meaning "no PIN followed by a digit anywhere". They forgot the outer bracket.
The anchor parses clean, evaluates green, and stays green while real violations
sit in the glob.

**Why this priority**: it is a false green in a blocking mode, produced by the
gate whose entire purpose is catching dialect mistakes at write time. Nothing
downstream can notice, because the pattern is valid — it simply means something
else.

**Independent Test**: compile `PIN[:digit:]` and confirm it is refused with the
fix; compile `PIN[[:digit:]]` and confirm it still works.

**Acceptance Scenarios**:

1. **Given** `[:digit:]` outside a bracket expression, **When** the anchor is
   parsed, **Then** it is refused with grep's own wording — the class syntax is
   `[[:digit:]]`, not `[:digit:]`.
2. **Given** `[[:digit:]]`, **When** the anchor is parsed, **Then** it compiles
   and matches as it does today.
3. **Given** a construct that is not POSIX ERE — a lookahead, a lazy
   quantifier, a backreference, or an escape with no ERE meaning — **When** the
   anchor is parsed, **Then** it is refused, naming what is wrong.

---

### User Story 2 - A CRLF line is a line (Priority: P1)

A repo checked out on Windows, or any file with CRLF endings, is verified. Every
`$`-anchored leg and every exact-line leg silently never matches, because each
line carries a trailing `\r` the pattern was never written for.

**Why this priority**: it is a silent false verdict on ordinary files, in both
directions — a `present` leg reads broken, an `absent` leg reads green.

**Independent Test**: run the same anchor over LF and CRLF copies of one file
and confirm the verdict is identical.

**Acceptance Scenarios**:

1. **Given** a CRLF file, **When** a `$`-anchored leg is evaluated, **Then** it
   matches exactly as it does on the LF copy.
2. **Given** a CRLF file, **When** any leg is evaluated, **Then** the reported
   line numbers are the same as on the LF copy.

---

### User Story 3 - `count` reads what `verify` reads, and says so (Priority: P1)

An author pins `count=N` from what `count` printed. `verify` computes a
different number, because `count` read the sibling repo's working tree while
`verify` read its channel ref. Nothing on screen explains the difference.

**Why this priority**: `count` exists to produce a number that goes into the
law. A number produced from different bytes than the gate uses is a number that
gates wrongly, and the tool's own advice is to ratchet from it.

**Independent Test**: with a sibling repo whose working tree differs from its
channel, confirm `count` and `verify` agree, and that `count` names what it read.

**Acceptance Scenarios**:

1. **Given** a sibling repo parked off its channel, **When** `count` runs,
   **Then** its number is the one `verify` computes.
2. **Given** any run, **When** `count` prints, **Then** it names what it read
   per repo, the way `verify` does.
3. **Given** the brain itself, **When** `count` runs, **Then** it reads the
   working tree — the commit being composed — exactly as `verify` does.

---

### Edge Cases

- A lone `\r` with no `\n`: an old-Mac line ending. Not split; treated as text,
  the same as today, and out of scope for this change.
- `[[:digit:]]` inside a larger bracket expression, e.g. `[[:digit:]x]`: valid,
  and must stay valid.
- An escaped `\[` followed by `:name:]`: the bracket is a literal, so the class
  is not one — refused, with the same message.
- A repo not on disk: `count` says so and exits, as today.
- `count` over `*`: one line per real directory, aliases collapsed, as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A `[:name:]` that is not immediately wrapped in a bracket
  expression MUST be refused, naming the correct syntax.
- **FR-002**: A construct with no POSIX ERE meaning — `(?`, a lazy quantifier,
  a backreference, or an alphabetic escape that carries no hint — MUST be
  refused, naming what is wrong.
- **FR-003**: `[[:name:]]` and every dialect form in use today MUST keep
  compiling unchanged.
- **FR-004**: Line splitting MUST treat `\r\n` as one line ending, so a CRLF
  file yields the same verdicts and the same line numbers as its LF twin.
- **FR-005**: `count` MUST resolve the repos it reads through the same function
  `verify` uses, and MUST read each at the same ref.
- **FR-006**: `count` MUST print what it read, per repo, in the same shape
  `verify` prints.
- **FR-007**: No new runtime dependency, and no second copy of a decision that
  already exists in one place.

### Key Entities

- **Dialect gate**: the write-time check that an anchor's regex means here what
  it would mean to git grep.
- **Line**: the unit a non-SQL leg matches against.
- **Repo source**: which bytes a repo is judged on, and the sentence that says
  so (MV-53).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `PIN[:digit:]` is refused; `PIN[[:digit:]]` still matches `PIN4`.
- **SC-002**: Every anchor in this brain's own law still compiles — 100% of the
  corpus, checked by the suite that already walks it.
- **SC-003**: The same anchor over LF and CRLF copies of one file produces
  identical verdicts and line numbers.
- **SC-004**: `count` and `verify` report the same number for the same leg when
  a sibling is parked off its channel.
- **SC-005**: `count`'s output names what it read.
- **SC-006**: The existing suite passes, with any test asserting the old
  behaviour updated rather than deleted.

## Assumptions

- The corpus uses none of the constructs being refused: measured — zero `(?`,
  zero lazy quantifiers, zero backreferences and zero bare `[:class:]` across
  every anchor in this brain.
- A consumer whose anchor uses one of them was already getting a different
  answer from git grep than from multivac, so a refusal at write time is a
  correction rather than a regression.
- Symlink divergence and the self-heal fence are separate defects, named in the
  change file as out of scope so they are not read as fixed.
