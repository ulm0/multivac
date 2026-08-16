# Specification Quality Checklist: doors prunes what it projects

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

One review pass ran over the draft. It produced two edits and one accepted
finding; this section lists what actually changed, not a reconstructed history
of the drafting itself.

**Fixed:**

- *Success criteria are measurable.* SC-005 read "stays in the same order of
  magnitude", which no one can fail. Restated as what the pass actually adds —
  one extra listing of a directory under a hundred files per target, no network,
  no subprocess, no model call.
- *Scope is clearly bounded.* Nothing in the draft forbade the obvious wrong
  shape: a separate cleanup command, or a confirmation prompt. Both would satisfy
  every other requirement and leave the defect in place for anyone who does not
  run the extra step. Added FR-010 — same run, same command, no new flag.

**Accepted with the reason, not fixed:**

- *No implementation details.* FR-005 speaks of a harness entry's *kind* rather
  than its name. That is this project's own vocabulary (MV-28: adapters are data,
  dispatch is on kind), and restating it in neutral words would make the
  requirement vaguer, not more accessible. Recorded as a deliberate use of domain
  language rather than silently left in place.

**Checked and already right in the draft** (listed so the ticks above are not
taken on trust): the missing-source case, which is the one way a removal pass
could empty a user's directory on the strength of a packaging bug, is both an
edge case and FR-004; the type-conflict case — a file where the source has a
directory of that name, and the reverse — is an edge case, because the existing
copy fails on it rather than resolving it; and every user story carries an
independent test that can be run without the other two.

**Not validated here**: whether the ownership decision in User Story 3 is the
*right* one. The checklist can confirm the decision is stated, justified and
testable — it is, in Story 3, FR-007 and the second assumption — but whether a
user's file inside a tool-owned directory should die is a judgement call, and
this feature's answer is open to being argued with rather than proven.
