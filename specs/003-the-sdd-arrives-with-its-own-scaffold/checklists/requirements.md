# Specification Quality Checklist: The SDD arrives with its own scaffold

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

Validation ran twice, item by item, against the drafted text.

**Iteration 1 — three failures, all fixed:**

- *No implementation details.* The draft used this project's own internal noun
  for its central repository ("the brain") in an edge case and in an assumption.
  It is jargon to anyone outside this repository and it named a location rather
  than a behaviour. Both rewritten as "the repository the lifecycle is anchored
  in". The concrete names — the flag, the configuration key, the adapter field —
  live in the change file and the law row, which is where they belong.
- *Requirements testable and unambiguous.* The draft's failure requirement said
  a failed setup "must not break the lifecycle", which is not testable. Split
  into FR-010 (report the tool's own error text, repeat the command, do not
  throw) and FR-011 (an exit-zero run that produced nothing is a failure, not a
  success) — the second is the case a naive implementation reports green.
- *Edge cases identified.* Two were missing and both decide behaviour rather
  than decorate it: concurrent lifecycle commands both finding the artifact
  absent, and a partial artifact from an interrupted first run. Added, with the
  answer stated in each — the vendor's own command arbitrates the race, and
  presence is the whole signal.

**Iteration 2 — all items pass.**

One deliberate asymmetry, stated rather than marked as a clarification: FR-002
forbids recording an unverified setup command, and the Assumptions say plainly
that only one of the two supported tools has one. That leaves the other tool
permanently on the FR-008 path until somebody verifies its setup by running it.
That is the intended outcome under this project's existing rule against derived
contracts, not a gap in the specification.

Also deliberately unspecified: which lifecycle points count as "the points that
refuse without an artifact" (FR-006). The requirement pins the ordering — setup
before refusal — and leaves the call-site choice to planning, because it depends
on where those refusals are already evaluated in one place.
