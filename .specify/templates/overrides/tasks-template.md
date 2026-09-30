---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

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
