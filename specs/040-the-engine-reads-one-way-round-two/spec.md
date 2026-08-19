# Feature Specification: The engine reads one way, round two

**Feature Branch**: `the-engine-reads-one-way-round-two`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "MV-109 stated two ceilings rather than closing them. Close both."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A heal never lands on prose (Priority: P1)

A `.ts` file is renamed. Its leg's pattern also appears in a documentation page
that quotes it. Self-heal finds exactly one surviving candidate — the doc — and
rewrites the glob to point law at prose.

**Why this priority**: it is the one code path that writes the law file, and it
can retarget a claim at text that merely describes it. Nothing says it
happened beyond a diff nobody was expecting.

**Independent Test**: rename a code file whose pattern also appears in a
markdown page, and confirm the heal refuses and names what it refused.

**Acceptance Scenarios**:

1. **Given** a `.ts` include and a surviving match in a `.md` file, **When**
   verify runs, **Then** it does not heal, and it names the candidate it
   refused.
2. **Given** a `.ts` include and exactly one surviving `.ts` match, **When**
   verify runs, **Then** it heals as before.
3. **Given** candidates in `.multivac/`, **When** verify runs, **Then** they
   are refused, as before.

---

### User Story 2 - A symlink is not read twice (Priority: P2)

A repo tracks a symlink. A working-tree read follows it and matches the
target's content; a ref read sees the link text and matches nothing. The same
leg gets two verdicts depending on which context asked.

**Acceptance Scenarios**:

1. **Given** a tracked symlink whose target matches a pattern, **When** either
   reader enumerates, **Then** the symlink is not listed.
2. **Given** a gitlink (a submodule entry), **When** either reader enumerates,
   **Then** it is not listed.
3. **Given** ordinary files, **When** either reader enumerates, **Then** the
   list is what it was, each path once.

---

### Edge Cases

- A path recorded at several merge stages: still listed once. The dedupe that
  `--deduplicate` provided is kept by the same mechanism that reads the mode.
- An include with no trailing extension (`LICENSE`-style): the kind fence has
  nothing to compare, so only the `.multivac/` fence applies. Measured today:
  every present-mode leg in this brain carries an extension, so this is about a
  future leg, and it is stated rather than implied.
- A brace-terminated include (`{a.md,b.md}`): the same — no single trailing
  extension, so the kind fence does not apply.
- `.d.ts` against `.ts`: suffix semantics, deliberately — a `.ts` include
  accepts a `.d.ts` candidate, because it is the same kind of file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A heal candidate MUST share the include's own trailing extension.
- **FR-002**: The `.multivac/` fence MUST stay.
- **FR-003**: When the fences empty the candidate list, the report MUST say
  what was refused rather than that the pattern was found nowhere.
- **FR-004**: An entry whose git mode is a symlink or a gitlink MUST NOT be
  enumerated by either reader.
- **FR-005**: Each path MUST still be listed once, whatever its merge stages.
- **FR-006**: The documented description of `moved` MUST match the rule, in
  every place it is written.
- **FR-007**: No new runtime dependency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A `.ts` leg does not heal onto a `.md` candidate, and the refusal
  names it.
- **SC-002**: A `.ts` leg still heals onto a single `.ts` candidate.
- **SC-003**: A tracked symlink is absent from both readers' output.
- **SC-004**: A path with three merge stages appears once.
- **SC-005**: This brain's own law still verifies with every leg green.
- **SC-006**: The suite passes.

## Assumptions

- The include's trailing extension is a usable proxy for "the same kind of
  file". Measured on this brain: 745 legs, 726 with a trailing extension, and
  all 440 present-mode legs — the only mode that heals — carry one.
- Filtering symlinks is right rather than following them in both readers:
  a ref read cannot follow a link without inventing a target that may not
  exist at that ref, and the tool's job is the bytes git recorded.
