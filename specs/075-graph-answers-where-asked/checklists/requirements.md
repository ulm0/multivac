# Specification Quality Checklist: The graph the agent asks is one that answers

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

- The product is a CLI whose users are operators and agents, and the graphers it drives are
  CLIs too: multivac's commands, flags, file paths and printed lines, and the grapher verbs
  and flags it prints (`--graph`, `-p`, `graphify update . --force`, `codegraph uninit
  --force`), ARE the user-facing surface, so naming them is scope, not implementation. No
  multivac source file, function or language construct is named; those are the plan's.
- Validation ran twice. Iteration 1 failed nothing on the checklist but found three
  defects, fixed in place: the apply base lines said "paths relative to <abs>" and would not
  have carried FR-008's clause, so every flag-naming line now says "paths in its answers are
  relative to"; the door's freshness for a grapher the brain's hook does not run was
  unspecified for flow.md (now FR-014); the zero-repo door was unspecified about its verbs
  (now FR-004: none listed; the ecosystem verbs of FR-006 stay). Iteration 2 passed every
  item.
- **Story order.** The design's US-A (no code, no graph) is US3 here, after US-B (US1) and
  US-C (US2): the resolver change alone turned 25 tests red, and four of them go green only
  with the door, flow.md, ecosystem-verb and hook surfaces of a code-less brain (critic
  gap 1). All three are P1; the order is the dependency order, and plan.md and tasks.md say so.
- **The design's FR/SC ids map** to the spec's in research.md R0.
- Every one of the completeness critic's 13 gaps is folded in:
  1. tests §6.2 missed, and the guard's companions — FR-016 lands in US3 after FR-003,
     FR-004, FR-006 (US1) and FR-012 (US2), with FR-025 in the same phase; SC-025; tasks
     T027–T043 name each red test with the fixture it moves to;
  2. stale ignore-line count — FR-026 (every known grapher's own output directory left out),
     SC-024 (the record and 12 lines);
  3. `init`/`doors` door drift over a kept install — FR-022, SC-018;
  4. the MV-140 freshness leg and MV-61's `ASK` literal — FR-014 (one answer), research.md
     R17 spelling rules (one stem constant, one ternary), SC-025;
  5. `.gitignore` written at land and never staged — FR-028 (the grapher's ignore file
     alone), acceptance US4-8, SC-023;
  6. savings populations left out (default `[agents]` doors; brains a hosting provider
     created) — Assumptions (third bullet), research.md R15;
  7. docs that would be false — FR-034 (running-changes, getting-started, README,
     composition added to the design's list);
  8. the shared head line sending codegraph to a worktree — FR-003 (the flag `change apply`
     printed, never the worktree), SC-002;
  9. "the derived lines do not change when a door is added" — Edge Cases (windsurf's
     `/.devin/`), Assumptions (fifth bullet), research.md R11;
  10. the follow hook wired where it cannot run — FR-012 (binary on PATH or in each repo),
      SC-011; its repo scope — Edge Cases (a ceiling), Assumptions (sixth bullet);
  11. edge configurations — FR-002 ("writable" defined), FR-004 (unverified; none
      resolving), FR-014 and FR-025 (flow.md's refresh row through the same answer);
  12. new text tripping existing `absent` legs — FR-034, SC-025, research.md R17;
  13. the measurement record — FR-005 (no "code only"), SC-024 (12 lines, no `/.brain/` in
      the brain), Edge Cases (root documents stay in the graph).
- The design's §10 questions are taken at its defaults and recorded as Assumptions, not
  markers; the operator can re-grade any of them before planning.
