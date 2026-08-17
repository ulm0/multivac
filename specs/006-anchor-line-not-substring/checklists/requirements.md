# Specification Quality Checklist: The scan guard skips anchor lines, not every line saying @anchor

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

Validation ran twice.

**Iteration 1 — two failures, both fixed:**

- *No implementation details.* FR-003 originally named the source file that
  would hold the shared definition and the identifier it would be exported
  under. Both belong to the plan, not the specification: the requirement is that
  one definition serves both readers, and naming the file would have pinned a
  location that the plan is entitled to choose. Restated as "one definition
  consulted both where the stated law is read and where files are scanned".
- *Success criteria are measurable.* SC-002 originally read "no existing rule
  regresses", which cannot be checked without deciding what counts as a
  regression. Restated as "the strict check exits success, and every rule whose
  verdict differs is enumerated with its cause" — an exit code plus a list, both
  observable.

**Iteration 2 — one failure, fixed:**

- *Scope is clearly bounded.* The specification stated the fix but not its
  ceiling, which would have left a reviewer to discover on their own that
  forging the grammar's comment form inside source still hides a line. Added as
  an edge case and as a named assumption, because a bound nobody wrote down is
  rediscovered as a bug report.

**Deliberately not raised as a failure:**

- User Story 2 and User Story 1 pull in opposite directions, and the
  specification says so rather than pretending one dominates. That tension is
  the substance of the feature: the acceptance scenarios of both must hold
  simultaneously, and any proposal satisfying only one is incomplete. Stating it
  is precision, not ambiguity.
