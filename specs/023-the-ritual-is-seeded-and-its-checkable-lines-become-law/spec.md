# Feature Specification: A seeded ritual, and a line that a check can make true belongs in the check

**Feature Branch**: `the-ritual-is-seeded-and-its-checkable-lines-become-law`

**Created**: 2026-08-18

**Status**: Draft

**Input**: `init` writes the ritual as a bare comment, so a fresh brain gets a blank ceremony and the operator concludes nothing is enforced. And this repo's own ritual holds four lines of which none is checked, several of which could be.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A fresh brain gets a ritual worth reading (Priority: P1)

An operator initialises a brain. The ritual file arrives holding a comment
explaining what belongs there and nothing else. Facing a blank page, most people
write nothing, and the closing step then prints nothing forever.

They should find candidate lines — drawn from what they just declared —
**commented out**, so nothing is asserted on their behalf and the blank page is
gone.

**Why this priority**: it is the difference between a feature people use and one
they never start.

**Independent Test**: initialise with a declared specification tool and confirm
the ritual carries commented candidates, and that the closing step still prints
nothing until one is uncommented.

**Acceptance Scenarios**:

1. **Given** a brain initialised with declared adapters, **When** the ritual is
   written, **Then** it carries candidate lines relevant to those declarations,
   every one commented out.
2. **Given** that ritual untouched, **When** a change closes, **Then** nothing
   is printed: a commented line is not a ceremony anyone agreed to.
3. **Given** an operator uncommenting one, **When** a change closes, **Then**
   that line prints.
4. **Given** an existing ritual, **When** the tool runs again, **Then** it is
   never overwritten — the ritual is authored, and authored files are the
   operator's.
5. **Given** a declared tool whose work is automatic, **When** the ritual is
   seeded, **Then** it contributes no candidate: an automated step is not a
   ceremony.

---

### User Story 2 - A line a check can make true moves into the check (Priority: P2)

This repository's own ritual holds four lines. None is verified. Some of them
could be — and a line that a check could make true is not "the ceremony no tool
can check", it is debt wearing that phrase as a costume.

**Why this priority**: the ritual's credibility depends on everything left in it
being genuinely uncheckable. A poster of things that could have been enforced
teaches readers to skim it.

**Independent Test**: read the ritual after this change and confirm every
remaining line is one no check could decide.

**Acceptance Scenarios**:

1. **Given** the repository's ritual, **When** it is read after this change,
   **Then** every remaining line is one that no check could decide.
2. **Given** a line whose obligation is already enforced elsewhere, **When** the
   ritual is read, **Then** it is gone from the ritual and the enforcement is
   named where it lives.
3. **Given** a line whose obligation is prompted by a template on disk, **When**
   the law is read, **Then** the anchor covers what the template actually
   prompts rather than half of it.

---

### Edge Cases

- No adapters declared: the seeded ritual carries only the candidates that are
  true of any ecosystem.
- The operator deletes every seeded line: the closing step prints nothing, which
  is correct and always was.
- A seeded line is edited rather than uncommented: it prints as edited. The file
  is theirs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A newly written ritual MUST carry candidate lines, every one
  commented out.
- **FR-002**: Candidates MUST be drawn from what the ecosystem declares.
- **FR-003**: A declaration whose work is automatic MUST contribute no
  candidate.
- **FR-004**: A commented candidate MUST NOT print at close.
- **FR-005**: An existing ritual MUST NOT be overwritten, ever.
- **FR-006**: Every line remaining in this repository's own ritual MUST be one
  no check could decide.
- **FR-007**: A ritual obligation already enforced elsewhere MUST be removed
  from the ritual, with the enforcement named where it lives.
- **FR-008**: Where an obligation is prompted by a template on disk, the law's
  anchor MUST cover what that template prompts rather than part of it.
- **FR-009**: The law row MUST land in the same change with anchors that
  resolve, and MUST state plainly which obligations were moved and which were
  left.

### Key Entities

- **The ritual**: authored by the operator, printed at close, checked by
  nothing.
- **A candidate**: a commented suggestion, true of this ecosystem's
  declarations, that an operator may adopt by uncommenting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A freshly initialised brain has a ritual with more than a comment
  in it.
- **SC-002**: A freshly initialised brain still prints nothing at close.
- **SC-003**: Every line in this repository's ritual after this change is one no
  check could decide.
- **SC-004**: No existing ritual is modified by any command.

## Assumptions

- Seeded lines are commented because an unadopted ceremony is not a ceremony.
  The idiom already exists in the configuration this tool writes, where detected
  adapters are suggested and not enabled.
- Authored files are never overwritten; derived files always are. The ritual is
  authored. That line is what keeps the tool from writing obligations on an
  operator's behalf.
- Not every checkable line becomes a check in this change. One of them needs a
  mechanism this change does not build, and shipping the check without the
  mechanism would refuse correct work.
