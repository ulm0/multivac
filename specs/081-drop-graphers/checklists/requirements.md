# Specification Quality Checklist: multivac keeps no code graph

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-02
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

- The product is a CLI whose readers are agents and operators: the commands, their flags and
  the lines they print, the config keys, the hook commands written into a harness's settings,
  the doors, the law's rows and legs, the skill, the root documents and the site ARE the
  user-facing surface, so naming them is scope. Source files, functions and test files are the
  plan's and research's; the spec names none in its requirements. The refresh hook's preamble is
  named because it is text in the user's settings file, and the only mark `doors` removes by.
- Validation ran twice. Iteration 1 found: requirements naming registry fields, function
  signatures, deleted modules and the renderers' probe (FR-001, FR-002, FR-004, FR-012, FR-013,
  FR-020, FR-039, FR-044) — rewritten as behaviour; US2's scenario 2 promised the file's key order
  where FR-013 fixes one — aligned; "51 places" in US3 against the measured 54 rows — corrected;
  "four to seven lines" in US1, never measured — replaced by the measured byte range.
  Iteration 2 passed every item.
- **The human's four decisions are in the spec, not as markers**: drop graphers from the tool and
  this repository (US1, US4); old configs load, `verify` and `doctor` print one line, `doors`
  removes only multivac's own hooks, vendor files stay and `doctor` prints their removal (US2);
  `.multivac/ecosystem.json` goes and `doors` removes an existing one (FR-009, FR-017); the human
  runs the lifecycle (Assumptions, FR-035).
- **One addition beyond the decisions** is flagged for the human (research.md R16 item 2): the
  door's leftover line (FR-020). Dropping it removes FR-020, one test and one leg.
- **Every figure is re-measured** on the change's tree (FR-042); the spec quotes the base and
  prototype figures as the design measured them, and every SC is either relative to the base or
  a measured value with its tolerance.
- **Scope bounds**: no successor navigation aid; no vendor file removed by multivac; history
  untouched (FR-041); the site names no vendor, so the upgrade story lives in the CHANGELOG
  (research.md R16 item 4).
