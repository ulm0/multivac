# Feature Specification: Issues from the change files, one way

**Feature Branch**: `the-roadmap-projects-to-a-declared-tracker`

**Created**: 2026-08-18

**Status**: Draft

**Input**: A roadmap lives in the change files. People who are not in this repository — and tools that are not this one — read a tracker. The two should agree without becoming two sources.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The roadmap appears in the tracker (Priority: P1)

An ecosystem keeps its roadmap and its work as change files. Everyone who does
not open the repository — and every board, filter and notification anyone
relies on — lives in an issue tracker.

Today those are two lists maintained by hand, which is the failure the roadmap
was built to end, moved one layer out.

**Why this priority**: it is the feature. Without it the roadmap is legible only
to people already inside the repo.

**Independent Test**: declare a tracker, record two intentions, run the
projection, and confirm two issues exist and their numbers are recorded in the
change files.

**Acceptance Scenarios**:

1. **Given** a declared tracker and change files with no issue recorded, **When**
   the projection runs, **Then** an issue is created for each and its number is
   written into that change file.
2. **Given** a change whose issue number is already recorded, **When** the
   projection runs again, **Then** no second issue is created.
3. **Given** a change whose title or state has moved, **When** the projection
   runs, **Then** the existing issue is updated rather than replaced.
4. **Given** no tracker declared, **When** the projection runs, **Then** it says
   so and does nothing.

---

### User Story 2 - One way, always (Priority: P1)

A projection that reads back becomes a second source, and two sources drift.

**Why this priority**: it is the property that makes the whole thing safe. Get
it wrong and the change files stop being authoritative.

**Independent Test**: close an issue in the tracker by hand, run the projection,
and confirm the change file is unchanged and the issue is restored to what the
file says.

**Acceptance Scenarios**:

1. **Given** an issue edited or closed in the tracker, **When** the projection
   runs, **Then** the change file is unchanged.
2. **Given** the same, **When** the projection runs, **Then** the issue is
   brought back to what the change file says.
3. **Given** an archived change, **When** the projection runs, **Then** its
   issue is closed.

---

### User Story 3 - It touches only its own labels (Priority: P2)

Teams label issues for their own reasons. A projection that reconciles the whole
label set erases that on every run.

**Why this priority**: one wiped triage is enough to have the projection turned
off permanently.

**Independent Test**: add a label by hand, run the projection, and confirm it
survives.

**Acceptance Scenarios**:

1. **Given** an issue carrying labels a person added, **When** the projection
   runs, **Then** those labels are untouched.
2. **Given** a change whose state moved, **When** the projection runs, **Then**
   only the labels in the tool's own namespace change.

---

### Edge Cases

- The tracker's command-line tool is not installed: refused, naming the binary
  and how to install it — a projection that cannot run must not report success.
- The change file records a number for an issue that no longer exists: reported,
  and no second issue is created silently.
- An archived change with no recorded number: nothing to close, nothing to say.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The projection MUST create one issue per change that has none, in
  the brain's own project.
- **FR-002**: It MUST record the issue's number in the change file, and MUST use
  that number as the identity on later runs.
- **FR-003**: It MUST NOT create a second issue for a change that has one.
- **FR-004**: It MUST update an existing issue rather than replace it.
- **FR-005**: It MUST NOT read the tracker as a source: no tracker state may
  change a change file.
- **FR-006**: It MUST close the issue of an archived change.
- **FR-007**: It MUST write only labels in its own namespace and MUST leave
  every other label untouched.
- **FR-008**: It MUST refuse when the declared tool is not installed, naming the
  binary and how to install it.
- **FR-009**: It MUST NOT run from any command required to work offline.
- **FR-010**: An undeclared tracker MUST produce a plain statement and no
  action.
- **FR-011**: The law row MUST land in the same change with anchors that
  resolve, and MUST state that the change files are the source and the tracker
  is a projection.

### Key Entities

- **The declared tracker**: which tracker this ecosystem projects to, or none.
- **The issue number**: the identity, recorded in the change file. Not a URL —
  the project is derivable from the repository's remote; the number is not.
- **The tool's label namespace**: the labels it owns and the only ones it writes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running the projection twice leaves the same number of issues.
- **SC-002**: No tracker edit ever changes a change file.
- **SC-003**: A label added by a person survives every projection.
- **SC-004**: No offline command gains a network call.

## Assumptions

- Identity is the number, not a link. The project comes from the repository's
  remote; the number does not, and a recorded link would have to be parsed back
  into a number on every run.
- The vendor's own command-line tool does the talking. It already solves
  authentication, and writing a client here would add a dependency to do worse.
- Issues live in the brain's project, because that is where the change files
  live and an issue is their projection.
- One issue per change. A story-level projection is the stated intent and is not
  built here: it needs a second reader of the specification tool's task list,
  which is a coupling worth its own change.
