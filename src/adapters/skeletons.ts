// MV-146. The skeleton templates spec-kit resolves before its own. Measured on
// 1.0.11: every resolver it ships (resolve-template.sh, common.sh, the python
// presets module) reads .specify/templates/overrides/<name>.md first, and its
// specify, plan and tasks steps read 18,004 bytes of template per change with
// the core ones, 4,188 with these. Each body keeps every H2 heading the step
// bodies fill by name (research R6); the registry lists them under `keeps`, so
// a heading dropped here fails a test instead of a spec.
//
// Served verbatim: the vendor substitutes nothing into an override, so no body
// names a command (`__SPECKIT_COMMAND_<NAME>__` in a core template becomes the
// integration's own spelling, and a skeleton sits on no integration). Frozen at
// the version measured (MV-121): the scaffold writes these once, and nothing
// re-reads the core templates when spec-kit upgrades.
//
// This brain's own .specify/templates/overrides/ holds these bytes; a test
// compares them.

/** .specify/templates/overrides/spec-template.md */
export const SPEC_SKELETON = `# Feature Specification: [FEATURE NAME]

**Feature Branch**: \`[###-feature-name]\` | **Created**: [DATE] | **Status**: Draft
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!-- Stories ordered by priority (P1 = MVP); each one independently testable and deliverable on its own. -->

### User Story 1 - [Brief Title] (Priority: P1)

[The journey in plain language]

**Why this priority**: [value]

**Independent Test**: [how it is tested on its own]

**Acceptance Scenarios**:

1. **Given** [state], **When** [action], **Then** [outcome]

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- [boundary condition or error scenario]

## Requirements *(mandatory)*

### Functional Requirements

<!-- Each testable. An open question is written inline as [NEEDS CLARIFICATION: question], at most 3 in the spec. -->

- **FR-001**: System MUST [testable capability]

### Key Entities *(include if feature involves data)*

- **[Entity]**: [what it represents, key attributes, no implementation]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [measurable, technology-agnostic outcome]

## Assumptions

- [default chosen where the description was silent]
`;

/** .specify/templates/overrides/plan-template.md */
export const PLAN_SKELETON = `# Implementation Plan: [FEATURE]

**Branch**: \`[###-feature-name]\` | **Date**: [DATE] | **Spec**: [link]

## Summary

[Primary requirement + technical approach from research]

## Technical Context

<!-- Replace each value; mark an unknown NEEDS CLARIFICATION. -->

**Language/Version**: [ ] | **Primary Dependencies**: [ ] | **Storage**: [ or N/A]
**Testing**: [ ] | **Target Platform**: [ ] | **Project Type**: [ ]
**Performance Goals**: [ ] | **Constraints**: [ ] | **Scale/Scope**: [ ]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

\`\`\`text
specs/[###-feature]/  plan.md research.md data-model.md quickstart.md contracts/ tasks.md
\`\`\`

### Source Code (repository root)

\`\`\`text
[the real paths this feature creates or edits]
\`\`\`

**Structure Decision**: [the layout chosen, referencing the directories above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
`;

/** .specify/templates/overrides/tasks-template.md */
export const TASKS_SKELETON = `---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from \`/specs/[###-feature-name]/\`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: \`[ID] [P?] [Story] Description\`

<!-- SAMPLE lines only: replace every one, one phase per user story in priority order. Tests only if the spec asks for them. -->

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [description with exact file path]

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T002 [description with exact file path]

**Checkpoint**: Foundation ready - user story implementation can now begin

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [what this story delivers]

**Independent Test**: [how to verify this story works on its own]

- [ ] T003 [P] [US1] [description with exact file path]

**Checkpoint**: User Story 1 is functional and testable on its own

## Phase N: Polish & Cross-Cutting Concerns

- [ ] TXXX [description with exact file path]

## Dependencies & Execution Order

[Phase order, story dependencies, what runs in parallel]

## Parallel Example: User Story 1

[Tasks marked [P] that can be launched together]

## Implementation Strategy

[MVP first (User Story 1), then incremental delivery]
`;
