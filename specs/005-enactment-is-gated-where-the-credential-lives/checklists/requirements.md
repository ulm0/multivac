# Specification Quality Checklist: enactment is gated where the credential lives

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

- *No implementation details.* An Edge Cases bullet said "run from a consuming
  repository rather than the brain". "Brain" is this project's internal name for
  the repository that holds the law; a reader who does not already know the
  product cannot evaluate the case. Restated as "rather than from the repository
  that holds the law", which is the same case in words that stand alone.
- *Requirements are testable and unambiguous.* FR-010 read "the whole check MUST
  cost no version-control call at all when the common case applies beyond the
  one that lists what is staged" — a sentence with two readings and no way to
  measure either. Restated as "In the ordinary case — a commit that does not
  touch the law file — the check MUST cost exactly one query of what is staged
  and nothing more", which is a number a test can count.

**Iteration 2 — clean.** Re-read every box against the amended text.

**Checks actually run, and their results:**

- `grep -c "NEEDS CLARIFICATION" spec.md` → **0**.
- Grepped the spec for tool, language and interface names that would be
  implementation leaks (`git`, `TypeScript`, `node`, `picomatch`, `verify`,
  `doctor`, `--cached`, `index`) → **0 matches**. The commands are referred to
  by role ("the verification", "the diagnostic command"), which is how the
  earlier specs in this repository read.
- Walked all twelve functional requirements against the acceptance scenarios.
  FR-001 and FR-011 are covered by Story 2 scenario 1; FR-002 by Story 2
  scenario 2; FR-003 by Story 2 scenario 3; FR-004 by Story 1 scenarios 1 and 4;
  FR-005 by Story 1 scenario 1 and the reversal in scenario 5; FR-006 and FR-007
  by the Edge Cases entries for the law file and for pointers naming other
  repositories, and measured by SC-002; FR-008 by Story 1 scenarios 2 and 3 and
  Story 3 scenarios 1 and 2; FR-009 by the Edge Cases entry for unstaged working
  copy edits; FR-010 by SC-005; FR-012 by Story 3 scenario 3 and SC-003. No
  requirement is left without a scenario or a success criterion.
- Walked the six success criteria for a measurable quantity. Each carries one:
  a result value (SC-001, SC-002), a line count (SC-003, SC-004), a wall-clock
  bound and a call count (SC-005), an occurrence count (SC-006). None names a
  command, a flag or a file format.
- Checked that the declined proposal is recorded as an assumption rather than as
  an open question, so a later reader finds a decision and not a gap. It is the
  last bullet of Assumptions and is marked as not part of this feature.
- Checked the scope boundary in both directions: the spec states what is **not**
  claimed (a person who chooses to bypass local checks) in the Edge Cases list,
  in Assumptions, and in FR-011, so the law text this feature produces cannot
  quietly grow the claim.
