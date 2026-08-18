# Feature Specification: The graph a declared grapher leaves is part of the repository

**Feature Branch**: `the-graph-is-part-of-the-repository`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "If a grapher is used, then the folder with the graphs must be part of the repository."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A graph that only one checkout has is refused (Priority: P1)

A maintainer declares a code-graph tool, the tool runs, and the artifact sits in
their working tree, untracked. Every gate passes. A colleague clones the
repository and has no graph — while the door in that clone tells their agent to
ask the graph before reading the tree.

Closing a change should refuse while that is true, and name the command that
ends it.

**Why this priority**: declaring a grapher is a statement about the repository.
An artifact only one machine has does not keep it, and the cost is invisible
exactly the way MV-90 describes: nothing fails, agents just quietly go back to
grepping.

**Independent Test**: build a graph, leave it untracked, close a change, and
confirm the refusal names the path and the command.

**Acceptance Scenarios**:

1. **Given** a declared, present root whose graph artifact is untracked, **When**
   a change is closed, **Then** it is refused, the root and the path are named,
   and the command that tracks it is printed.
2. **Given** the same root after that command has been run and committed,
   **When** the change is closed, **Then** the gate passes silently.
3. **Given** several roots in that state, **When** a change is closed, **Then**
   all of them are named in one refusal.

---

### User Story 2 - An ignored graph says so, because `git add` will not fix it (Priority: P2)

A repository's `.gitignore` excludes the graph directory. The author runs the
command the refusal printed, sees no error worth reading, and closes again — to
the same refusal.

**Why this priority**: it is the same gate, but the fix is different, and a
message that names the wrong fix costs more than no message.

**Independent Test**: ignore the artifact, close, and confirm the refusal says
the rule is what blocks it.

**Acceptance Scenarios**:

1. **Given** a root whose graph artifact is matched by an ignore rule, **When**
   a change is closed, **Then** the refusal says it is ignored and to remove the
   rule before tracking it.

---

### Edge Cases

- A root with no grapher applying to it, or an unverified adapter: out of scope,
  exactly as MV-90 has it. Nothing is asked of a tool whose artifact path would
  have to be guessed.
- A root whose artifact is missing entirely: that is MV-90's refusal, and it
  comes first. This gate never reports a missing graph as untracked.
- The tool's own escape hatches apply unchanged: one run skipped, or off for
  good, and a skipped gate says so out loud.
- Abandoning a change is exempt, as it is for every other close gate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Closing a change MUST refuse while a declared, present root's
  graph artifact is untracked in that root's repository.
- **FR-002**: The refusal MUST name each offending root, the artifact path, and
  the command that tracks it, all in one message.
- **FR-003**: An artifact excluded by an ignore rule MUST be reported as ignored,
  with removing the rule named as the step before tracking.
- **FR-004**: multivac MUST NOT stage or commit the artifact itself, in any
  path.
- **FR-005**: A root out of scope for the graph gate MUST stay out of scope
  here.
- **FR-006**: A missing artifact MUST be reported as missing, never as
  untracked.
- **FR-007**: The existing skip switches MUST cover this gate too, and a skipped
  gate MUST say so.
- **FR-008**: The diagnostic report MUST show the same state per root, so it can
  be seen without closing a change.
- **FR-009**: The law row governing this MUST land in the same change, and MV-90
  MUST be amended in place.

### Key Entities

- **The artifact**: the file the declared adapter names as its graph. What must
  exist (MV-90) and now also be tracked.
- **A root**: the brain plus every declared repository present on disk — the
  same search set every other adapter question uses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh clone of any repository that closed a change with a
  declared grapher has the graph.
- **SC-002**: An operator who reads a refusal knows which repository, which
  file, and which command, without opening anything.
- **SC-003**: No multivac command writes to a git index that holds the artifact.
- **SC-004**: The diagnostic report and the close gate never disagree about a
  root's state.

## Assumptions

- The obligation is the ARTIFACT the adapter declares, not every file the tool
  writes beside it. Caches, dated exports and generated HTML are excluded by the
  ignore rules the tool's own users write, and demanding them would fight the
  tool that wrote them.
- Refusing rather than staging is not a limitation to work around: MV-50 exists
  because a refresher that touches the index turns a background convenience into
  something that edits your commit. The tool says; the human commits.
- A repository that genuinely does not want the graph tracked turns the gate off
  the way it already can, and the skip is printed.
