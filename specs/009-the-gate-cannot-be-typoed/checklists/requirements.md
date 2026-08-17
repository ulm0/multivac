# Specification Quality Checklist: The gate cannot be typoed

**Purpose**: Validate specification completeness and quality before planning
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
- [x] Success criteria are technology-agnostic
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

Two revisions during validation.

- **The first draft was about flags only**, because that is how the defect was
  reported. Reading `doctor`'s declared usage against its code showed the same
  lie in another shape: it declares no directory and calls `doctorReport(cwd)`,
  so `mvac doctor /other/repo` answers about the working directory. FR-001 now
  says *argument*, and US2 exists. Fixing flags alone would have left half of it.

- **FR-003 nearly said "exit 2".** That is an implementation constant, and
  writing it into the spec would have let the requirement be satisfied by
  editing the reference table instead of the code. It now says: the code the
  reference already documents — which makes the direction of the fix part of
  the requirement, and is why SC-006 says the table is *made true*, not edited.

One boundary `/speckit-plan` must not soften: FR-004. A command that refuses
after writing has still written. `init`, `doors` and `seed` all write, so the
check has to be the first thing each does, and SC-005 is measured rather than
assumed.
