# Specification Quality Checklist: The site has a voice

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

Two items were revised during validation rather than passed as written:

- **No implementation details.** The first draft named the two typefaces and
  the file format in FR-001 and FR-005. Naming a face is a design decision that
  belongs in the plan, not a requirement the spec can hold the work to — a
  different face satisfying the same requirement would have read as a violation.
  The requirements now describe the two *voices* and the licence property; which
  faces fill them is left to `/speckit-plan`. The format assumption moved to
  Assumptions, where it is stated as a property of the reader's browser.

- **Success criteria are measurable.** SC-001 first read "the site has its own
  identity," which no one can fail. It is now the greyscale test: face alone,
  colour removed.

- **SC-004 was measurably false and was rewritten.** It claimed the longest
  machine line the site quotes was the anchor grammar at "about 85 characters."
  Counting the site's 767 code-block lines gave p50 55, p90 126, p95 161, p99
  242, **max 310** — a `doors` transcript. "The longest line fits" is achievable
  at no font size, so as written it was a criterion nothing could pass. It now
  states both halves: the anchor grammar line, **86** characters (88 bytes — the
  ellipsis is three), fits without
  scrolling because a reader must take it in whole; everything past the fitting
  width scrolls inside its own container and never widens the page body. A third
  acceptance scenario was added for the second half.

Two boundaries are deliberately stated as failures rather than exceptions, and
`/speckit-plan` must not soften them: a font host address quoted as an example
in prose is still a violation (Edge Cases), and the palette rows MV-33 and the
contrast fix are constraints on this work rather than material for it
(FR-007, FR-008).
