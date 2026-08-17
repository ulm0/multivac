# Specification Quality Checklist: The rows say what they check

**Created**: 2026-08-17 · **Feature**: [spec.md](../spec.md)

## Content Quality
- [x] No implementation details · [x] Focused on user value
- [x] Written for non-technical stakeholders · [x] All mandatory sections completed

## Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers · [x] Requirements testable and unambiguous
- [x] Success criteria measurable · [x] Success criteria technology-agnostic
- [x] Acceptance scenarios defined · [x] Edge cases identified
- [x] Scope bounded · [x] Dependencies and assumptions identified

## Notes

**FR-002 is the requirement that took the thinking.** The first draft said "each
overstating row is corrected to match the code", which is the natural reading of
an audit finding and is **backwards** for two of the eight. MV-45 and MV-46 both
state the behaviour the tool should have; the code is what drifted. Correcting
the rows to describe the drift would have been relaxing an invariant in code,
which the constitution forbids outright. The requirement now makes the direction
an explicit decision per finding, and FR-003 keeps the third case — a true claim
with an imprecise mechanism — from being flattened into either.

**FR-008 exists because a cleared finding is a result.** MV-10 was examined and
is accurate. Recording only the eight would leave the ninth to be re-raised by
the next reader with the same reasonable suspicion, and would quietly imply the
audit found everything it looked at.

**SC-002 is not "the tests pass".** A leg that has only ever been observed green
has not been tested — and this change exists because exactly such a leg sat in
the law table, matching a comment that said the opposite of the code. Every
re-pointed leg is demonstrated failing.
