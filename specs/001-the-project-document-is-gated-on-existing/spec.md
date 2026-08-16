# Feature Specification: The project document is gated on existing

**Feature Branch**: `001-the-project-document-is-gated-on-existing`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Gate the SDD's project-level document on its existence, never on its content."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The missing document stops the work that depends on it (Priority: P1)

A maintainer adopts a spec-driven development tool in their project. The tool
defines a project-level document — its statement of principles — that every
later planning step is supposed to be checked against. The maintainer never
writes it. Today every command runs green and the omission is discovered, if
ever, by a human reading a report nobody was required to read. After this
feature, the first command that would depend on that document refuses, names the
document, and names the exact command that writes it.

**Why this priority**: This is the whole defect. Everything else in this feature
is a qualification on it. Shipped alone it closes the hole.

**Independent Test**: In a project that declares a spec-driven tool and has no
project document, run the planning command. It must refuse, and the refusal must
contain the document's path and the command that creates it.

**Acceptance Scenarios**:

1. **Given** a project declaring a tool whose project document is absent,
   **When** the maintainer runs the planning command,
   **Then** it refuses, names the document path it looked for, names the repo it
   looked in, and names the command that writes the document.
2. **Given** the same project after the document has been written,
   **When** the maintainer runs the planning command again,
   **Then** it proceeds, and the refusal does not reappear.
3. **Given** a project whose declared tool defines no project document at all,
   **When** the maintainer runs the planning command,
   **Then** nothing about this feature applies and the command behaves exactly as
   it did before.

---

### User Story 2 - A document nobody has written yet does not count as written (Priority: P2)

The tool that defines the document also ships a blank version of it as part of
its own setup. A project can therefore contain the document, at the right path,
having had no thought put into it. Checking only that the file exists accepts
that state and reports success for a project with no principles at all.

**Why this priority**: Without it, User Story 1 is satisfied by the setup step
that runs before anyone has decided anything — the gate would be green on every
freshly initialized project, which is exactly the population it exists to catch.

**Independent Test**: In a project where the document is the untouched file the
tool's own setup produced, run the planning command. It must refuse with the same
clarity as if the file were absent.

**Acceptance Scenarios**:

1. **Given** a project whose document is byte-for-byte the blank version the
   tool ships, **When** the planning command runs, **Then** it refuses and says
   the document is still the untouched one, distinguishing this from absence.
2. **Given** a project whose document differs from the blank version by any
   amount, **When** the planning command runs, **Then** it proceeds — the
   feature never judges how much was written or whether it is any good.
3. **Given** a project whose document is empty, **When** the planning command
   runs, **Then** it refuses, because an empty document is the weakest possible
   evidence that anyone wrote one.

---

### User Story 3 - Nothing else starts refusing (Priority: P3)

A maintainer with an established project must not find that a routine command
they ran yesterday now blocks for a reason unrelated to what they are doing.

**Why this priority**: Protects the change from being worse than the defect. A
gate that fires on the wrong condition gets switched off wholesale, taking the
useful part with it.

**Independent Test**: Exercise the surrounding behaviours — an out-of-date
document, the documented escape hatches, and the other lifecycle commands — and
confirm none of them changed.

**Acceptance Scenarios**:

1. **Given** a project whose document exists but is older than the project's most
   recently changed rule, **When** any command runs, **Then** the age is
   reported exactly as before and nothing refuses. Age is not evidence the
   principles need revisiting.
2. **Given** a project with an absent document, **When** the maintainer uses the
   documented one-run escape or turns the tool's automation off in configuration,
   **Then** the command proceeds, exactly as those switches already do for every
   other check of this kind.
3. **Given** a project with an absent document, **When** any lifecycle command
   other than planning runs, **Then** it is unaffected by this feature.
4. **Given** a project reporting on its own health, **When** the maintainer runs
   the report, **Then** it says what it said before — the report is the place
   this information already lived and its wording does not change.

---

### Edge Cases

- The document is absent **and** the per-feature artifact the planning command
  already required is absent: both are true, and the maintainer must be able to
  learn both without fixing one to discover the other.
- The blank version the document is compared against cannot be located — the
  tool's setup files were deleted or moved. The check cannot conclude "this is
  the untouched one", and must not conclude "this is written" either.
- The document is a directory, a broken symlink, or unreadable. None of these is
  a written document, and none should surface as an unhandled crash.
- The project declares a tool that is not installed. The maintainer is already
  told that separately; this feature must not turn one problem into two
  confusing ones.
- More than one project document is declared by a single tool. Each is judged on
  its own and the refusal names the one that failed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The planning command MUST refuse while a declared project-level
  document is absent.
- **FR-002**: The planning command MUST refuse while a declared project-level
  document is still the untouched version the tool's own setup produced, or is
  empty. Whether "untouched" is recognized by unreplaced fill-in tokens, by
  whole-file equality with the blank version, or by both, is a design decision —
  the requirement is that a document nobody has written is not accepted.
- **FR-003**: Every refusal MUST name the document's path, the repository it was
  looked for in, and the exact command a maintainer runs to produce it.
- **FR-004**: A refusal for an untouched document MUST be distinguishable, in its
  wording, from a refusal for an absent one.
- **FR-005**: The feature MUST NOT assess the document's content, length,
  structure, or quality in any way beyond FR-002.
- **FR-006**: The document's age relative to the project's rules MUST remain a
  report and MUST NOT cause any refusal.
- **FR-007**: The existing one-run escape and the configuration switch that
  disable the tool's other automated checks MUST disable this one identically.
- **FR-008**: A declared tool that defines no project-level document MUST be
  entirely unaffected.
- **FR-009**: No lifecycle command other than planning MUST change behaviour.
- **FR-010**: The health report's existing wording about the document MUST NOT
  change.
- **FR-011**: When the blank version cannot be located for comparison, the
  feature MUST NOT treat the document as written on that basis alone.

### Key Entities

- **Project-level document**: the statement of principles a spec-driven tool
  defines once per project, distinct from the per-feature artifacts that already
  gate. Identified by a path the tool declares.
- **Blank version**: the state the document is in when the tool's own setup
  produced it and nobody has written anything — recognizable by the fill-in
  tokens the tool asks the author to replace, by equality with the file the
  setup copied from, or by both. The only content-shaped comparison this
  feature makes.
- **Declaration**: the per-tool statement of which document exists, where, and
  which command writes it. Data supplied per tool, never inferred from its name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a project that declares a spec-driven tool and has no project
  document, 100% of planning attempts stop, versus 0% before this feature.
- **SC-002**: A maintainer who hits the refusal can fix it using only the text of
  the refusal, without opening documentation or source — the path and the
  command are both present in the message.
- **SC-003**: Zero projects that already have a written document experience a new
  refusal; the full existing verification suite passes unchanged.
- **SC-004**: A freshly set-up project, where the tool produced the blank
  document and nobody has edited it, is refused rather than accepted — the case
  that a bare existence check would have passed.
- **SC-005**: Each of the three outcomes — absent, untouched, written — is
  demonstrated by its own automated test, so the distinction cannot regress
  silently.

## Assumptions

- The tool-by-tool declaration of the document, its blank version, and its
  authoring command already exists in this project's adapter data and does not
  need to be invented; this feature acts on it rather than defining it.
- The whole-file comparison used to recognize an untouched artifact already
  exists for the per-feature artifacts and is reused rather than reimplemented.
- Planning is the right and only place to refuse: it is the first lifecycle point
  at which the document's absence changes the outcome of the work.
- The health report already distinguishes absent, untouched and out-of-date, so
  no new detection is required — only the decision to act on it.
- Writing the document remains a human-or-agent authoring task. Nothing in this
  feature attempts to generate it, and its content is never judged.
