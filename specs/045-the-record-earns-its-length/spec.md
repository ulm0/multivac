# Feature Specification: The record earns its length

**Feature Branch**: `the-record-earns-its-length`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "The previous change failed its own ritual line — *the prose earns its length, or it gets shorter*. Shorten it by deletion. No rule moves."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader gets the rule in one screen (Priority: P1)

A maintainer reads MV-120 to learn what it requires. Today the row is 821
words, most of them measurements of how the defect was found, so the rule and
its limits are buried.

**Why this priority**: a row nobody reads to the end does not bind anybody.
MV-120 was enacted without anyone reading it.

**Independent Test**: count the words in MV-120's statement, then check that
every rule half and every ceiling is still in it.

**Acceptance Scenarios**:

1. **Given** MV-120, **When** it is read, **Then** it is at most 400 words and
   still states the bold rule verbatim, the three halves including the 0.1.0
   baseline, what is mechanical, and every ceiling with its scope.
2. **Given** the cut evidence, **When** someone looks for it, **Then** it is in the
   archived change, in `specs/044`, or in git at `f057e4a`.

---

### User Story 2 - An amendment note is shorter than the rule it amends (Priority: P2)

MV-14's note (127 words) and MV-111's note (129 words) are each longer than the
rule they amend.

**Acceptance Scenarios**:

1. **Given** each note, **When** it is read, **Then** it is at most 60 words.
2. **Given** each note, **When** it is read, **Then** it keeps its history: MV-14
   quotes the retired order, and MV-111 marks its ceiling WITHDRAWN and names
   MV-112.
3. **Given** each note, **When** it is read, **Then** it still carries the literal
   `Amended 2026-09-13 by MV-120` exactly once.

---

### User Story 3 - The changelog is written for the person installing (Priority: P1)

The 0.10.0 entry is 2546 words. The 0.8.0 entry covered as many rows in 1548.

**Acceptance Scenarios**:

1. **Given** the 0.10.0 entry, **When** it is read, **Then** it is at most 1500
   words and still names MV-50, MV-85 and each of MV-105 … MV-119.
2. **Given** any remaining sentence, **When** it is checked against its row and
   the code at `v0.10.0`, **Then** it is still true, and no sentence is added
   that the previous entry did not already carry.
3. **Given** the MV-72 bullet in 0.2.0, **When** it is read, **Then** it is at
   most 40 words.

### Edge Cases

- A qualifier that limits a sentence cannot be cut, because the sentence would
  claim more than is true. Examples: "on a broken config", "consumer checkout",
  "only when case or separators differ", "Neither notice changes an exit code".
- The MV-120 statement must not contain the literal counted by its own leg 3,
  or MV-14's retired lead.
- MV-121, which `change new` reserved, is given back, because this change adds
  no law.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: MV-120's statement MUST be at most 400 words and MUST keep the bold
  rule verbatim, the three halves, what is mechanical, and every ceiling with
  its scope and qualifier.
- **FR-002**: The MV-14 and MV-111 notes MUST each be at most 60 words, keep
  their history, and carry the counted literal exactly once.
- **FR-003**: The 0.10.0 entry MUST be at most 1500 words, name every ID it
  named before, and add no claim.
- **FR-004**: The 0.2.0 MV-72 bullet MUST be at most 40 words.
- **FR-005**: No rule, anchor, product source, test or dependency changes.
- **FR-006**: MV-120's four legs MUST still hold, and MUST still fail when their
  fix is reverted.
- **FR-007**: The MV-121 reservation MUST be released.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: MV-120 goes from 821 to at most 400 words.
- **SC-002**: The two notes go from 127 and 129 to at most 60 words each.
- **SC-003**: The 0.10.0 entry goes from 2546 to at most 1500 words.
- **SC-004**: An adversarial fidelity pass finds 0 lost rules, ceilings or
  qualifiers, and 0 added claims.
- **SC-005**: `verify --strict` reports 0 blocking broken, and the full suite
  passes.
- **SC-006**: A reverted fix still fails its leg: at least 2 of 2 sampled.

## Assumptions

- Shortening prose is not an amendment of a rule. The rows keep their
  statements' rules, so no new "Amended" note is added for this change.
- Evidence belongs in the change record and the specs, not in the law row. The
  table's newer rows (MV-117 at 308 words) show that length is possible.
