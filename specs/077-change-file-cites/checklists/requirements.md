# Specification Quality Checklist: The change file cites, never restates

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-29
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

- The product is a CLI whose users are operators and agents: multivac's commands, flags,
  printed lines, the change file's frontmatter keys and the law's paths ARE the
  user-facing surface, so naming them is scope, not implementation. No multivac source
  file, function or language construct is named; those are the plan's. Row IDs are named
  because the law is the product's own record.
- Validation ran twice. Iteration 1 failed nothing on the checklist but found four defects,
  fixed in place: FR-003 listed only the five `change` commands as writers, while
  `roadmap sync` also rewrites a change file to record its issue number and would drop a
  stray claim key silently (found in planning, `roadmap sync`'s write-back after its parse);
  FR-014 printed the retiring case at plan, where an unretired row is the ordinary state of
  a retiring change; SC-018's counts were the design's (220 and 146) and are re-measured on
  the planning head (221 and 147); the flow.md line said "adds or touches" while FR-007
  accepts a claim of a row the change retires. Iteration 2 passed every item.
- Every one of the completeness critic's 11 gaps is folded in:
  1 (the claim-key refusal hid the change from the new binary's own readers) FR-003,
  US1-AS4, SC-004 and the stray-key edge case; 2 (land before pull said "state it") FR-009,
  FR-013, US3-AS3, SC-007, and the edge case that `verify`'s finished line reads this
  checkout only, recorded as a ceiling rather than a second channel read at the print site
  `verify-rooted-and-quiet` rebases on; 3 (the orphan check and the other close gates went
  unannounced) FR-007's last case, FR-010, FR-012, SC-013, and the ceiling that the SDD,
  graph and tracked-graph gates are not announced; 4 (every copy of "ended consistent")
  FR-018, US5-AS2, US5-AS3, SC-019; 5 (an active row under `adds` told to leave the law)
  FR-008, US2-AS7, SC-014; 6 (stale notes on #4 and the worktree hook) Assumptions, the
  legacy-form rule keyed to every build that reads the brain's change files and #4's case
  moot; 7 (the `requires:` floor before the version bump) FR-020, US6-AS2, SC-020;
  8 (the pull ignored the brain entry's own channel) FR-015, US2-AS5, SC-007; 9 (retiring
  lost close's tombstone check) FR-007's third and fourth cases, US2-AS6, SC-015, and
  FR-018's retire sentences; 10 (textual neighbours) plan.md, Composition; 11 (prototype
  defects) tasks.md, a plan concern with no spec surface.
- The design's human questions are taken at their defaults and recorded as Assumptions:
  enactment is the human's; the release number and floor are the release change's; this
  brain keeps `statement:` in its own change files until its dist is rebuilt from the
  merged change; the archived `everything-multivac-owns.md` is not edited (a ceiling);
  #4's case is moot.
- Two SCs carry the design's historical measurements (SC-002 re-measured on the planning
  head, SC-010 from the investigators' archive walk); both are outcomes an operator can
  re-run from research.md's commands.
