# Specification Quality Checklist: One resolver per root

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-14
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

- The product here is the tool's own surfaces: config keys, printed lines,
  doors, flow.md, law rows and legs. Config keys, command names and `none` are
  the facts under specification, not implementation choices. Specs 042, 044
  and 046 treat them the same way. The function that resolves is named in the
  change file, and the spec asks only that there be one.
- Three decisions are taken rather than left open, each stated with its
  ceiling. In a mixed ecosystem every adapter in scope must pass (FR-005,
  Assumptions). `init --grapher` is judged against the registry plus a
  readable config already at the target, before anything is created (FR-012).
  `none` is refused as an init flag value (US4, scenario 4).
- Out of scope, and not contradicted: narrowing proof to the repos a change
  names, binary lookup, `managed: false`, and init's other refusals that still
  follow `git init`.
