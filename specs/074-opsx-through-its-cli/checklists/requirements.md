# Specification Quality Checklist: opsx runs through its own CLI

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-28
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

- The product is a CLI whose users are operators and agents, and the vendor it drives
  is a CLI too: multivac's commands, flags, file paths and printed lines, and the
  openspec commands it prints, ARE the user-facing surface, so naming them is scope,
  not implementation. No multivac source file, function or language construct is
  named; those are the plan's. The one vendor file named (FR-017) is named as a
  citation source, as MV-121 requires.
- Validation ran twice. Iteration 1 failed nothing on the checklist but found four
  defects, fixed in place: the row's ceilings were not tied to the Edge Cases (FR-025);
  false source comments were not covered (FR-027, critic gap 10); a nested code span in
  SC-010 did not render; SC-003 stated a byte cap without the per-session trade it buys.
  Iteration 2 passed every item.
- Every one of the completeness critic's 17 gaps is folded in: 1 FR-017, FR-026;
  2 FR-001, FR-023, first edge case (`new change --json`; text `status` is the first
  trigger); 3 FR-011, US2-4, SC-008; 4 FR-023, SC-014; 5 FR-027; 6 FR-009 (the
  shell-neutral `show --json --deltas-only` preview, checked present from 1.3.0 through
  1.13.2); 7 FR-014, FR-016, FR-025; 8 FR-020, SC-012; 9 FR-021, SC-012; 10 FR-027;
  11 FR-018, SC-011; 12 FR-014, FR-023; 13 FR-022, SC-013; 14 FR-024; 15 FR-011, SC-008;
  16 edge cases (ceiling); 17 Assumptions (re-anchor in planning).
- The design's human questions are taken at their conservative defaults and recorded
  as Assumptions rather than markers; the operator can re-grade any of them before
  planning.
- No file the MV-147 retired-phrase leg covers is touched by this step; the spec spells
  none of the leg's phrases anyway.
