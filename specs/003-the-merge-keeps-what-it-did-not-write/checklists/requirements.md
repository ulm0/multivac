# Specification Quality Checklist: The merge keeps what it did not write

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-16
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

- *No implementation details.* The first Edge Cases bullet quoted a literal
  command line, `mvac verify --strict`, to name the case being excluded. That is
  the binary's own surface, not the behaviour. Restated as "the project's check
  command followed by a flag of the user's", which is what the rule actually
  says and is checkable without knowing the binary's name.
- *Scope is clearly bounded.* The draft left open whether the merge should also
  correct a matcher it finds wrong on its own entry. It now says explicitly, in
  FR-005 and again under Assumptions, that a matcher is written once and never
  rewritten, and that installations keep the matcher they have if the project's
  default ever changes. Without that sentence FR-004 and FR-005 could both be
  satisfied by code that still rewrote a matcher on some paths.

**Iteration 2 — one open question resolved, no failures:**

- The migration question the change file raised — remove a duplicate the tool
  recognises, or report it — was still unanswered after iteration 1, which would
  have left a `[NEEDS CLARIFICATION]` marker. It is answered in User Story 3,
  FR-008, FR-009 and the last Assumption: **report, never delete**. The reason is
  recorded rather than asserted: silently deleting a hook entry is the defect
  being fixed, and once the old code overwrote a foreign entry the survivor is
  byte-identical to the project's own, so nothing on disk can tell "leftover of a
  bug" from "a second hook the user wants on a different matcher". A count the
  tool can prove is reported; a judgement it cannot make is left to a person.

**Deliberately not checked here**: the "written for non-technical stakeholders"
box is checked in the sense this project uses it — the reader is someone who
configures an agent harness, so event names and matchers are their vocabulary,
not implementation detail. The binary name, flag spellings and file paths are
kept out.
