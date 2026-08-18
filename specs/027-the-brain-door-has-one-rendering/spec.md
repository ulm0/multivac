# Feature Specification: The brain door has one rendering

**Feature Branch**: `the-brain-door-has-one-rendering`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "`init` and `doors` write different brain doors. The copy inside `init` has drifted: it never mentions the graph."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The door a fresh brain gets is the door the tool maintains (Priority: P1)

Someone scaffolds a brain and hands the repository to an agent. The agent reads
the door and is never told that a code graph exists, or which repos the
ecosystem holds — because the door written by scaffolding is a second, older
copy of the door the projection command maintains.

**Why this priority**: it is the first file read, in the state where the reader
knows least. Everything the door omits there is omitted at the moment it is
most needed.

**Independent Test**: scaffold a brain, read the door, and confirm it names the
declared code-graph tool and its query verbs.

**Acceptance Scenarios**:

1. **Given** a brain scaffolded with a code-graph tool declared, **When** the
   door is read, **Then** it names that tool and how to ask it.
2. **Given** a brain with sibling repositories declared, **When** the door is
   read after scaffolding, **Then** it lists them.
3. **Given** a brain with no law rows yet, **When** the door is read, **Then**
   it says the brain is empty and names the skill that fills it, as it does
   today.

---

### User Story 2 - Scaffolding and projection write the same bytes (Priority: P1)

An operator scaffolds, then runs the projection command, changing nothing in
between. The door does not move.

**Why this priority**: it is the property that keeps the first story true a year
from now. Two renderings of one document drift; the only durable fix is that
there is one.

**Independent Test**: scaffold, snapshot the door, project, compare.

**Acceptance Scenarios**:

1. **Given** any declared configuration, **When** scaffolding is followed by
   projection with nothing edited between them, **Then** the door is
   byte-identical.
2. **Given** the same, **When** projection is run twice more, **Then** the door
   still does not move.

---

### Edge Cases

- A brain scaffolded with no adapters and no sibling repos: the door carries the
  law pointers and the empty-brain line, and nothing else. No empty sections.
- A configuration that will not load: scaffolding already refuses to invent
  declarations, so the door names nothing rather than guessing.
- User content outside the managed block is untouched, exactly as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: There MUST be exactly one rendering of the brain door in the
  codebase, and both scaffolding and projection MUST use it.
- **FR-002**: Scaffolding followed by projection, with nothing edited in
  between, MUST leave the door byte-identical.
- **FR-003**: The door written by scaffolding MUST name the declared code-graph
  tool and the declared spec-driven tool, on the same terms as the projected
  door.
- **FR-004**: The managed-block boundary and everything outside it MUST behave
  exactly as it does today.
- **FR-005**: MV-101's rule — the door names an adapter only where the
  configuration declares one — MUST remain true, and its anchors MUST follow the
  code that makes it true.
- **FR-006**: The law row governing this MUST land in the same change; MV-101
  MUST be amended in place rather than contradicted.

### Key Entities

- **The brain door**: one document, describing this brain to whoever opens it.
  Its content is derived from the configuration and the law table, never
  authored twice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every declared configuration, the door after scaffolding and
  the door after projection are byte-identical.
- **SC-002**: An agent handed a freshly scaffolded brain learns from the door
  alone that a graph exists and how to ask it, when one is declared.
- **SC-003**: A change to the brain door's wording is made in exactly one place.

## Assumptions

- The projected rendering is the correct one: it is the maintained one, it is
  what every other door in the ecosystem is projected from, and it is what the
  law's own rows describe. The scaffolding copy is the one that fell behind.
- Scaffolding may read the configuration it has just written; that read is what
  keeps MV-101 true rather than a second expression of the same rule.
