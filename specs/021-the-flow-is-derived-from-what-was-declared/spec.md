# Feature Specification: One page saying what is automatic, what is a gate, and what is yours

**Feature Branch**: `the-flow-is-derived-from-what-was-declared`

**Created**: 2026-08-18

**Status**: Draft

**Input**: A newly initialised brain has no single place saying what multivac enforces for you versus what is yours. The law is ninety rows and the ritual is empty, so the reasonable conclusion from reading a fresh repo is that nothing is enforced — which is false, and the tool's fault.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader can see what their declarations oblige (Priority: P1)

An operator declares a specification tool and a code-graph tool. Both now oblige
things — steps that are refused without their artifact, work the tool does
unasked, and steps no tool can check.

Those obligations are spread across a ninety-row law table, an adapter registry
the operator never reads, and command output that scrolls past. There is no page
that answers "what did I just sign up for".

**Why this priority**: it is the whole feature, and it is why a fresh brain
reads as unenforced.

**Independent Test**: declare a tool, project the doors, and confirm the page
sorts its obligations into what happens unasked, what refuses, and what is the
operator's.

**Acceptance Scenarios**:

1. **Given** a declared specification tool, **When** the doors are projected,
   **Then** a page exists sorting that tool's obligations into three named
   groups: what happens unasked, what refuses, and what no tool can check.
2. **Given** a step that refuses, **When** the page names it, **Then** it names
   the command that refuses and the artifact it refuses without.
3. **Given** a step no tool can check, **When** the page names it, **Then** it
   carries the reason nothing can prove it ran, in the adapter's own words.
4. **Given** no adapters declared, **When** the doors are projected, **Then**
   the page still exists and names what the tool does regardless.

---

### User Story 2 - The page is derived and says so (Priority: P1)

The page must never become a second law table: something authoritative-looking
that drifts from what the code does.

**Why this priority**: an unanchored page that reads like law is worse than no
page, and it is a failure the tool would be committing against itself.

**Independent Test**: change a declaration, re-project, and confirm the page
changed to match without anyone editing it.

**Acceptance Scenarios**:

1. **Given** an existing page, **When** a declaration changes and the doors are
   re-projected, **Then** the page changes to match, without an operator editing
   it.
2. **Given** a page with an operator's own writing outside the managed part,
   **When** it is regenerated, **Then** that writing survives.
3. **Given** any page, **When** it is read, **Then** it says it is generated,
   names what regenerates it, and points at the law as the thing that binds.
4. **Given** any page, **When** it names an obligation, **Then** it cites a
   command and an artifact, and never an invariant identifier.

---

### Edge Cases

- The brain declares no adapters at all: the page names the lifecycle's own
  obligations and the ritual, and says the adapter groups are empty because
  nothing is declared.
- An adapter is declared but unverified: it appears as declared-but-unknown with
  the fields to declare, never with guessed behaviour.
- The page is deleted: the next projection writes it again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Projecting the doors MUST write a page sorting this ecosystem's
  obligations into three named groups: what happens unasked, what refuses, and
  what no tool can check.
- **FR-002**: Every refusing obligation MUST name the command that refuses and
  the artifact it refuses without.
- **FR-003**: Every uncheckable obligation MUST carry the reason nothing can
  prove it ran, in the adapter's own words rather than a paraphrase.
- **FR-004**: The page MUST be rendered from the declarations and the adapter
  registry alone.
- **FR-005**: The page MUST NOT cite an invariant identifier. Identifiers are
  allocated per brain, so a generated citation would name a different rule — or
  none — in every other ecosystem.
- **FR-006**: The page MUST state that it is generated, name what regenerates
  it, and point at the law as the thing that binds.
- **FR-007**: Regenerating MUST preserve anything an operator wrote outside the
  managed part.
- **FR-008**: An ecosystem with no adapters MUST still get a page.
- **FR-009**: An unverified adapter MUST appear as declared-but-unknown, never
  with guessed behaviour.
- **FR-010**: Writing the page MUST reach no network.
- **FR-011**: The law row MUST land in the same change with anchors that
  resolve, and MUST state that this page binds nothing.

### Key Entities

- **Obligation**: one thing this ecosystem's declarations require, carrying
  which group it belongs to, the command involved, and either the artifact that
  proves it or the reason none can.
- **The page**: a derived document, regenerated whole, with the operator's own
  writing outside the managed part.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the page alone, a reader can say which obligations the tool
  performs, which it refuses without, and which are theirs.
- **SC-002**: The page contains no invariant identifier.
- **SC-003**: Changing a declaration and re-projecting changes the page, with no
  hand editing.
- **SC-004**: An operator's own writing survives regeneration.

## Assumptions

- Derived, never authored. The ritual is the operator's and is never
  overwritten; this page is the tool's and is rewritten whole. Keeping that line
  sharp is what stops it becoming a second law.
- It binds nothing. The law binds; this page describes what the law and the
  adapters already do, for a reader who has not read ninety rows.
- Citing commands and artifacts rather than identifiers is not a stylistic
  choice: identifiers are allocated from each brain's own table, so a generated
  identifier would be wrong everywhere except the brain it was written in.
