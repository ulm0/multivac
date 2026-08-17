# Specification Quality Checklist: core.hooksPath is read the way git reads it

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

- *No implementation details.* An Edge Cases bullet named a third-party check
  framework by name ("a pre-commit framework, with or without its binary
  installed"). Naming a vendor's tool in the spec is an implementation detail
  and it also narrows the case wrongly: the behaviour under test is "the
  arrangement is decided after the directory is resolved", which holds for every
  framework the project detects, not just the one that was named. Restated as "a
  check framework the project already detects".
- *Success criteria are technology-agnostic.* SC-002 measured the strict report
  by its process exit status. An exit status is the binary's surface, not the
  outcome; restated as "raises 0 failures", which is the same measurement
  without the interface.

**Iteration 2 — clean.** Re-read every box against the amended text.

**Checks actually run, and their results:**

- Grepped the spec for the clarification marker: 0 occurrences.
- Walked all eight functional requirements against the acceptance scenarios.
  Each of FR-001 through FR-007 is exercised by at least one scenario in Stories
  1–3 (FR-001/002 by Story 1 scenarios 1 and 3; FR-003/006 by Story 2 scenarios
  1 and 2; FR-004 by Story 3; FR-005 by Story 1 scenario 1; FR-007 by Story 2
  scenario 3 and the Edge Cases list). FR-008 is a law-and-code-land-together
  requirement whose acceptance is SC-005, which is a machine check rather than a
  user scenario — recorded here rather than papered over with a scenario nobody
  would run.
- Checked each success criterion carries a number or a count: SC-001 (2 files, 0
  directories), SC-002 (0 missing, 0 failures), SC-003 (100% of arrangements),
  SC-004 (at least 1 failing check per claim), SC-005 (suite passes, verification
  exits with the row resolving). All measurable without opening the source.

**Deliberately not claimed, and why (Principle II):**

- How a check file sitting in *another* working copy's managed directory locates
  a repository at run time. The spec's Edge Cases and Assumptions both say this
  is unmodelled. It cannot be tested here without building two linked working
  copies of a repository inside the test suite, which is host-dependent state
  the project's own constraints forbid tests from depending on.
- Directory identity through symbolic links. The spec states identity is decided
  by resolving and comparing text, not by consulting the filesystem. Anything
  stronger would need filesystem identifiers and would be a claim with no test
  behind it.
