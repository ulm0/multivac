# Specification Quality Checklist: The docs say what ships

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

Three things were revised during validation rather than passed as written.

- **The first draft was "bump the version and update the docs."** That is a task
  list, not a specification: it names the edits and says nothing about what must
  be true afterwards, so nothing could fail it. It is now three user stories with
  the reader at the centre of each — the person installing, the person upgrading,
  and the person cutting the next release.

- **FR-005 nearly forbade something honest.** "No page states a version number"
  would refuse the changelog's own headings, the Node engine requirement, the
  pinned dependency versions, and any concept page recounting what 0.1.1 shipped.
  The requirement now forbids only a version stated *as the project's current
  version and unchecked*, and FR-006 protects the historical case explicitly.
  The edge-case list names the badge, the changelog and the mounted file, because
  each needs a deliberate answer rather than a regex that happens to miss them.

- **SC-005 was "documentation is accurate."** Nobody can fail that. It is now a
  count: what the audit confirms false and what this change fixes are reported,
  and they are equal. Deferring a confirmed finding is a visible failure rather
  than a quiet one.

One boundary that `/speckit-plan` must not soften: SC-003 requires the refusal
to be **demonstrated in both directions**. A leg that has only ever been seen
green has not been tested — that is how the install page came to claim `1.0.0`
under a law table that already had 83 rows in it.
