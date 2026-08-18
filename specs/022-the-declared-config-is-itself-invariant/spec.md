# Feature Specification: A config change needs a change that declares it

**Feature Branch**: `the-declared-config-is-itself-invariant`

**Created**: 2026-08-18

**Status**: Draft

**Input**: The declared configuration decides which repos exist, which adapters bind and which gates run, yet it can be edited by anyone at any time with nothing recording why.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editing the configuration goes through the lifecycle (Priority: P1)

An operator changes which repositories the ecosystem has, or which adapters
bind, or turns a gate off. Every one of those decisions is as load-bearing as a
law row — a repository dropped from the declaration stops being verified, an
adapter removed stops obliging anything — and all of them can be made in a
commit with no explanation and no review.

**Why this priority**: it is the one file where a quiet edit silently reduces
what the tool enforces, and nothing notices.

**Independent Test**: stage a modified configuration with no change open and
confirm the commit is refused, naming what to do.

**Acceptance Scenarios**:

1. **Given** a modified configuration staged and no open change, **When** the
   commit is composed, **Then** it is refused, and the refusal names both ways
   forward: open a change, or drop the edit.
2. **Given** a modified configuration staged and an open change, **When** the
   commit is composed, **Then** nothing is refused.
3. **Given** a staged commit that does not touch the configuration, **When** it
   is composed, **Then** nothing about this is said.

---

### User Story 2 - A brain can still be born (Priority: P1)

Creating a configuration is how an ecosystem starts. It cannot require a change,
because there is nowhere to put one yet.

**Why this priority**: a rule that blocks initialisation is a rule nobody can
adopt.

**Independent Test**: initialise a fresh brain and commit it, with no change and
no law, and confirm nothing is refused.

**Acceptance Scenarios**:

1. **Given** a configuration that exists in the staged commit but not in the
   previous one, **When** the commit is composed, **Then** nothing is refused —
   creating is free.
2. **Given** a repository with no previous commit at all, **When** the first
   commit is composed, **Then** nothing is refused.
3. **Given** a checkout that is not the brain, **When** a commit is composed,
   **Then** nothing about this is said: the question is not answerable there.

---

### Edge Cases

- The configuration is modified *and* an open change exists, but the change says
  nothing about the configuration: allowed. The rule ties the edit to a
  lifecycle and an eventual merge request, not to a declaration format the
  change file does not have.
- The configuration is deleted: treated as a modification, because removing the
  declaration removes everything it declared.
- The index cannot be read: reported as unanswered, never assumed clean.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A staged modification to the declared configuration MUST be
  refused while no change is open.
- **FR-002**: The refusal MUST name both ways forward: open a change, or drop
  the edit.
- **FR-003**: A staged configuration that did not exist in the previous commit
  MUST NOT be refused.
- **FR-004**: A commit that does not touch the configuration MUST produce no
  output about this.
- **FR-005**: A repository with no previous commit MUST NOT be refused.
- **FR-006**: The check MUST NOT run outside the brain.
- **FR-007**: The check MUST be offline and MUST read the index, never the
  working tree, because the index is what is about to be committed.
- **FR-008**: An unreadable index MUST be reported as unanswered rather than
  assumed clean.
- **FR-009**: The law row MUST land in the same change with anchors that
  resolve, and MUST state what the check cannot see.

### Key Entities

- **The declared configuration**: the file naming the repos, the adapters, the
  channel and the gates.
- **An open change**: any change file in the open state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No configuration modification reaches a commit without a change
  open.
- **SC-002**: Initialising a brand-new brain and committing it succeeds.
- **SC-003**: A commit untouched by the configuration produces no extra output.
- **SC-004**: The check adds no network call and stays within the verifier's
  existing budget.

## Assumptions

- Creating is free, modifying is not. A brain has to start somewhere, and the
  first configuration has nowhere to declare itself.
- Any open change satisfies it. The change file has no field for "files
  touched", and inventing one to make this rule stronger would be a schema
  change in service of a check rather than of the work. What the rule actually
  buys is that the edit lands in a branch with a merge request describing it.
- The ceiling is stated rather than implied: this proves an edit happened inside
  a lifecycle, never that the change is *about* the configuration, and never
  that the edit is wise.
