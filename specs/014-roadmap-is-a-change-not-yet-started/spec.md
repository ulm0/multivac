# Feature Specification: A roadmap item is a change that has not started yet

**Feature Branch**: `roadmap-is-a-change-not-yet-started`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "A roadmap is the list of things an ecosystem intends to do. multivac already keeps that list — `.multivac/changes/*.md` — but every entry is born `status: open`, which reserves an invariant id and counts against the next release. Add one state in front of the lifecycle so an intention can be written down without starting it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Write an intention down without starting it (Priority: P1)

An operator knows the ecosystem should eventually do a thing. They do not want
to start it today: no branch, no worktree, no invariant id spent, nothing that
makes the next release wait. They want it recorded where the tool will show it
back to them, next to everything else that is already in flight.

They record it with one command, and later ask the tool what is on the list.
The list is grouped by how near the horizon is, and it says how many changes
are actually in flight, so nobody reads a roadmap and mistakes intention for
progress.

**Why this priority**: This is the whole feature standing alone. With only this
story shipped, an ecosystem has a roadmap that lives in the same directory,
same schema and same git history as the work it will become. Everything else
here improves what happens when an item graduates.

**Independent Test**: Record three intentions, ask for the list, confirm all
three appear under their horizons and that no branch, worktree or invariant id
was created for any of them.

**Acceptance Scenarios**:

1. **Given** a brain with no roadmap, **When** the operator records an
   intention with a slug and a title, **Then** a change file for that slug
   exists in the changes directory carrying the planned state, and no branch,
   worktree or invariant id was created.
2. **Given** three recorded intentions on different horizons, **When** the
   operator asks for the roadmap, **Then** all three are listed grouped by
   horizon, nearest first, in a stable order within each group.
3. **Given** a roadmap with items and two changes in flight, **When** the
   operator asks for the roadmap, **Then** the output states how many changes
   are currently open, distinctly from the planned items.
4. **Given** a brain with no planned items, **When** the operator asks for the
   roadmap, **Then** the output says the roadmap is empty rather than printing
   nothing.
5. **Given** a slug that already has a change file in any state, **When** the
   operator tries to record an intention under that slug, **Then** it is
   refused and the refusal names the state the existing file is in.

---

### User Story 2 - Start a recorded intention without duplicating it (Priority: P2)

Months later the intention becomes work. The operator starts it with the same
command they would use for work that was never on the roadmap. The tool
recognises the slug, promotes the file that is already there, and the prose
written when the idea was young survives into the change that implements it —
one document, one history.

Starting is also the moment the invariant id is reserved: not before, because
an id spent on an intention that never happens is an id nobody can reuse.

**Why this priority**: Without this, the roadmap becomes a second list. The
operator would record intentions in one file and start work in another, and the
two would disagree within a week — which is exactly the failure this feature
exists to prevent.

**Independent Test**: Record an intention, edit its body by hand, start it, and
confirm exactly one file exists for that slug, that it is now open, that the
hand-written body is byte-identical, and that an id was reserved at that moment
and not earlier.

**Acceptance Scenarios**:

1. **Given** a planned change whose body was edited by hand, **When** the
   operator starts that slug, **Then** the file is promoted to open, its body
   is unchanged byte for byte, and no second file exists for the slug.
2. **Given** a planned change, **When** the operator starts it, **Then** an
   invariant id is reserved at that moment and recorded in the change's
   declared additions.
3. **Given** a slug with no planned change, **When** the operator starts it,
   **Then** the behaviour is exactly what it is today — the roadmap is never a
   precondition for starting work.
4. **Given** a planned change, **When** the operator runs any later lifecycle
   step on it, **Then** the step refuses and names starting it as the step that
   comes first.

---

### User Story 3 - A roadmap never delays a release (Priority: P3)

The operator has a long roadmap and wants to publish. Nothing on the roadmap
may stand between them and the release, no matter how many items it holds or
how long they have sat there.

**Why this priority**: This property is what makes the roadmap safe to use at
all. If planned items counted as work in flight, the first item recorded would
block every release for as long as the roadmap is not empty — that is, forever
— and operators would learn to keep the roadmap empty, which is the same as not
having one.

**Independent Test**: Record several intentions, leave zero changes open, and
confirm the strict verification pass and the release-blocking check both pass.

**Acceptance Scenarios**:

1. **Given** a brain with several planned changes and no open change, **When**
   the strict verification pass runs, **Then** it does not report any change as
   unclosed and does not fail on the roadmap's account.
2. **Given** a brain with several planned changes, **When** any command runs,
   **Then** no command refuses an operation on the grounds that its subject was
   not on the roadmap first.

---

### Edge Cases

- An intention is recorded under a slug that already exists as a planned, open
  or archived change: refused, naming the existing state.
- A planned change carries an unknown horizon value: refused when read, naming
  the accepted values, rather than silently sorted into a default bucket.
- A planned change carries claims or repos the operator wrote by hand: they
  round-trip unchanged; the tool owns formatting, not content.
- The changes directory holds only archived changes: the roadmap says it is
  empty, and separately reports zero open.
- A planned change is started, and starting fails partway: the file is either
  planned as before or open with its id reserved, never a state where an id was
  reserved and the file still reads planned.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A change file MUST accept a planned state in addition to the open
  and archived states it accepts today, and MUST refuse any other value.
- **FR-002**: The system MUST provide a command that records an intention from
  a slug and a title, producing a planned change file and nothing else — no
  branch, no worktree, no invariant id.
- **FR-003**: A planned change file MUST carry a horizon of now, next or later.
  When the recording command is given no horizon, it MUST default to later, so
  nothing becomes urgent by accident.
- **FR-004**: The system MUST provide a command that lists planned changes
  grouped by horizon in the order now, next, later, and in a stable, repeatable
  order within each group.
- **FR-005**: The roadmap listing MUST state how many changes are currently
  open, separately and distinguishably from the planned items, so intention is
  never read as progress.
- **FR-006**: The roadmap listing MUST say plainly that the roadmap is empty
  when no planned change exists, rather than printing nothing.
- **FR-007**: Starting a change whose slug already has a planned file MUST
  promote that file — set it to open, preserve its body byte for byte, preserve
  any hand-written frontmatter values — and MUST NOT create a second file.
- **FR-008**: Starting a change whose slug has no planned file MUST behave
  exactly as it does today.
- **FR-009**: An invariant id MUST be reserved when a change starts, and MUST
  NOT be reserved when an intention is recorded.
- **FR-010**: Recording an intention under a slug that already has a change
  file in any state MUST be refused, and the refusal MUST name the state the
  existing file is in.
- **FR-011**: A planned change MUST NOT be counted as an unclosed change by any
  check that refuses a release or a landing on account of unclosed work.
- **FR-012**: Every lifecycle step after starting MUST refuse a planned change
  and MUST name starting it as the step that comes first.
- **FR-013**: No command may refuse an operation on the grounds that its subject
  was not recorded on the roadmap first.
- **FR-014**: An unknown horizon value MUST be refused when the file is read,
  naming the accepted values.
- **FR-015**: The roadmap commands MUST make no network calls and MUST spawn no
  foreign tool.
- **FR-016**: The law row governing this behaviour MUST land in the same change
  as the behaviour, with anchors that resolve against the code rather than
  against prose describing the code.

### Key Entities

- **Change file**: the single document for a unit of ecosystem work, from
  intention through to archive. Gains one state in front of the ones it has,
  and one field naming its horizon. Its identity is its slug, which is unique
  across every state.
- **Horizon**: how near an intention is — now, next or later. It is the entire
  ordering model: no dates, no estimates, no priority numbers, no dependencies
  between items.
- **Roadmap listing**: a read-only view over the planned change files, plus a
  count of the changes actually in flight. It holds nothing of its own.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can record an intention in a single command, and that
  command creates exactly one file and changes nothing else in the repository.
- **SC-002**: Starting a recorded intention leaves exactly one file for that
  slug, with its prose byte-identical to what was written when it was recorded.
- **SC-003**: With any number of planned items and no open change, the strict
  verification pass reports zero unclosed changes.
- **SC-004**: No refusal anywhere in the tool cites absence from the roadmap as
  its reason.
- **SC-005**: The roadmap commands complete without network access, and the
  verification pass stays within its existing sub-second budget.

## Assumptions

- The word **planned** is reused deliberately. A repo inside a change is
  already called planned when it is declared but not branched; a change is
  planned when it is declared but not started. Same meaning at two scopes, so a
  second word would suggest a difference that does not exist.
- Ordering within a horizon is alphabetical by slug. Any other order would
  encode a priority the model deliberately does not have.
- Recording an intention commits, the same way starting a change commits today.
  The brain's artifacts are written by the tool and land in git as the tool
  writes them.
- Projection to an issue tracker — issues, boards, labels, a tracker adapter —
  is out of scope here and lands as its own change. This feature must be
  complete and useful with no tracker configured, ever.
- Dates, estimates, dependencies between items, priority numbers and burndown
  are out of scope permanently, not deferred.
- No report shames a change that shipped without appearing on the roadmap
  first; the roadmap earns its place by being useful, not by keeping score.
