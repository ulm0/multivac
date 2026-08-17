# Feature Specification: The rows say what they check

**Feature Branch**: `the-rows-say-what-they-check`

**Created**: 2026-08-17

**Status**: Draft

**Input**: "Work all the items of the audit."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The reader who trusts a row (Priority: P1)

Someone reads the law to learn what the tool guarantees. A row ends with an
emphatic clause — "`add -A` appears nowhere in the lifecycle" — and they believe
it, because the row is `active` and the verification is green.

It is not true. And the leg meant to hold it matches a comment saying the
opposite of what the code does, so the greenness proves nothing.

**Why this priority**: the whole product is the claim that a checked rule is
worth more than a remembered one. A row whose evidence points at a sentence
about the code, rather than at the code, is the failure mode this project sells
itself against — committed in its own law table.

**Independent Test**: for each corrected row, break the behaviour it claims and
watch the verification refuse. Under the old legs, one of them stays green.

**Acceptance Scenarios**:

1. **Given** the corrected law, **When** a lifecycle command is made to sweep a
   tree it did not create, **Then** verification refuses and names the row.
2. **Given** the corrected law, **When** every row that the audit found
   overstating is read against its code, **Then** each states only what its
   evidence supports.
3. **Given** a row whose claim the code failed to meet, **When** the correction
   is made, **Then** the **code** moved to the row wherever the row stated the
   better behaviour.

---

### User Story 2 - The contributor sent the wrong way (Priority: P2)

Someone wants to add a harness. The contributing guide tells them: if you cannot
verify the format, mark it unsupported with the reason. They do, and open a
merge request the law rejects — because that kind was deliberately removed.

**Why this priority**: it costs an outsider real work and reads as the project
not knowing its own mind. P2 rather than P1 because it misleads one contributor
at a time, where US1 misleads every reader of the law.

**Independent Test**: read the contributing guide against the row it must agree
with; no instruction contradicts it.

**Acceptance Scenarios**:

1. **Given** the guide, **When** it is read beside the row governing adapter
   entries, **Then** neither instructs what the other forbids.
2. **Given** the design document, **When** it describes how matching works,
   **Then** it names the mechanism that exists.

---

### Edge Cases

- **A row that is right and the code that is wrong.** The correction direction
  is not free: relaxing the row to describe the drift is forbidden, so each
  finding must be classified before it is fixed.
- **A ceiling versus a lie.** Some rows are true but claim more precision than
  their mechanism has. Rewriting those as failures would be as inaccurate as
  leaving them; they need their limit stated, not their claim withdrawn.
- **A finding that is not one.** The audit examined nine claims. One is
  accurate, and recording it as cleared matters as much as recording the eight —
  otherwise the next reader re-raises it.
- **A leg that cannot see the code it is about.** Fixing the prose without
  fixing the anchor leaves the row green for the wrong reason.
- **A correction that itself over-claims.** The replacement wording must be
  measured against the code, not against what the code ought to do.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every claim the audit confirmed MUST be corrected in this change.
  None may be deferred without its reason recorded.
- **FR-002**: Where a row states the better behaviour and the code fails it, the
  **code** MUST move. A row MUST NOT be relaxed to describe its own drift.
- **FR-003**: Where a row claims more precision than its mechanism has, the row
  MUST state that limit rather than withdraw the claim.
- **FR-004**: Where a row describes something that no longer exists, the dead
  clause MUST be withdrawn with a dated note, not silently deleted.
- **FR-005**: Any leg found to match something other than the code it is about
  MUST be re-pointed at the code, and MUST be shown to fail when that code
  changes.
- **FR-006**: Documents that instruct a reader to do what the law forbids MUST
  be corrected to agree with the law by ID.
- **FR-007**: Documents describing mechanisms that do not exist MUST be
  corrected to the mechanism that does.
- **FR-008**: The claim the audit **cleared** MUST be recorded as examined and
  accurate.
- **FR-009**: No behaviour a user depends on may change except where a row
  already promised the corrected behaviour.

### Key Entities

- **Overstating claim**: a row asserting more than its code does or its evidence
  proves.
- **Blind leg**: an anchor that resolves against text other than the code its
  row is about.
- **Correction direction**: for each finding, whether the row moves or the code
  does — decided before the fix, never during it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each corrected row is read against its code and states only what
  the code does. Counted: findings confirmed equals findings fixed.
- **SC-002**: Every re-pointed leg is demonstrated failing when the behaviour it
  covers is reverted. A leg seen only green has not been tested.
- **SC-003**: The two code corrections are covered by tests that fail without
  them.
- **SC-004**: Searching the contributing guide and the design document for the
  corrected statements returns the corrected text and no residue of the old.
- **SC-005**: The cleared claim is recorded with the evidence that cleared it.
- **SC-006**: `verify --strict` and the full test suite pass, and no row's state
  changes as a side effect of this work.

## Assumptions

- The audit's findings are hypotheses until verified here. Each was re-checked
  against the current code before being accepted; one was rejected.
- `add -A` inside a repository multivac has just created, holding one file it
  just wrote, is materially harmless. It is corrected because the row says
  *nowhere* and a claim that is nearly true is the kind that decays.
- `--abandon` requiring zero claims makes an anchor naming its reserved ID
  unlikely, not impossible. The condition the row states is cheap to apply on
  both paths, and applying it is cheaper than arguing it is unnecessary.
