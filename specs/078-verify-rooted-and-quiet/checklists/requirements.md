# Specification Quality Checklist: A run reads the checkout that holds where it was asked, and says one line when nothing is off

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

- The product is a CLI whose users are operators and agents, and the harness it serves
  speaks to it through an environment variable and a JSON payload: multivac's commands,
  flags, printed lines, the files it reads and writes (`.multivac/config.yml`, `.gitmodules`,
  `.claude/settings.json`, the git shims) and the harness's own field names
  (`CLAUDE_PROJECT_DIR`, `hook_event_name`, `tool_input.file_path`, `cwd`) ARE the
  user-facing surface, so naming them is scope, not implementation. No multivac source
  file, function or language construct is named; those are the plan's. Directory names
  such as `src/commands` appear only as places a run is asked from.
- Validation ran twice. Iteration 1 found three defects, fixed in place: SC-036 named a
  source function as its count pattern (now "a pattern one file holds once"), and SC-029 a
  source file as the edited file (now "a file there") — both "no implementation details";
  US7's second acceptance scenario and SC-035 described a mount with an older record where
  the design measured one with no record (now "no version record and no floor"). Iteration 2
  passed every item.
- **Story order.** US1–US3 are P1 and independent of one another; US4 extends US1's
  resolution with the answers for no root; US5 precedes US6 because a session start is
  quiet only through US5's line; US7 reads the notice from US1's root; US8 roots the other
  commands through US1 and US2. plan.md and tasks.md follow the same order.
- **The design's FR and SC ids map** to the spec's in research.md R0: design FR-R1…FR-C2 →
  FR-001…FR-037 in order, the law and the words FR-038–FR-039; design SC-R1…SC-C4 → the
  spec's SCs in story order, with the critic's additions (SC-012, SC-027, SC-032, SC-040,
  SC-041) placed in their stories and the law's outcome last (SC-042).
- Every one of the completeness critic's 7 gaps is folded in:
  1. the second prototype read a brain change worktree's siblings from the main checkout, ignoring
     the change's own sibling worktrees under the default layout, a
     false green under `--worktree` — FR-008 (the change's own worktree for the key first,
     so the key-named layout is covered too), US2 acceptance 3, SC-012, research.md R5;
  2. the shim comment carried a row ID, which MV-126's site leg would catch once hooks.md
     copies the shim — FR-027 (no law ID, no version, neither MV-52 word), FR-039 (the
     listing copies the three lines exactly), SC-042, research.md R11 and R16 (an `absent`
     leg on IDs in the shims);
  3. the suite went red with `MULTIVAC_QUIET=1` exported — FR-032 (every test that spawns
     the CLI or a hook that runs it removes both switches), SC-041, research.md R14;
  4. the "13 commits × 187 B ≈ 2.4 KB" saving was never run — SC-027 (the per-commit replay:
     6 of 13 agent commits fold, about 1,033 B), research.md R15, which states that printing
     a staged law in full is what caps it;
  5. doc passages missing from the docs list — FR-039 (the scope table's "cwd is …"
     wording, the `init .` hint sentence, the `count` section), research.md R16 (an `absent`
     leg on the scope table's wording);
  6. `doctor` and `doors` compared paths by string — FR-037 ("compared by real path"),
     US8 acceptance 4, SC-040;
  7. a forwarded hook starts in `$HOME`, and the follow verified nested fixture brains —
     FR-028 (`cwd` in the contract), FR-030 (the session's directory from the payload; the
     follow takes a brain only when it is its own git toplevel), US6 acceptances 4 and 6,
     SC-030, SC-032, edge cases, research.md R8.
- One inconsistency inside the design is resolved, not carried: its FR-U3 clause "; the brain at
  <child> verifies from there" below an ungoverned toplevel, and SC-U1 quoting it, were measured
  on the first prototype; the second added the last-resort rule that answers such a directory as
  its child brain's consumer first, so the clause became unreachable there. FR-016 and SC-016
  follow the second prototype's order, re-measured with its build (research.md R7); FR-014 keeps
  the clause outside a work tree, where it is reached.
- change-file-cites' two hand-offs are decided in the spec: its quiet rule counts an
  unparsable open change file as "off" and makes nothing about it harder (FR-024, SC-025);
  MV-86 in a consumer is taken here with its reason (US7, FR-033–FR-035, Assumptions).
- The design's §10 questions are taken at its defaults and recorded as Assumptions, not
  markers; the operator can re-grade any of them before planning.
- No file an active `absent` leg covers is touched by this step; the spec quotes the
  retired phrases, but `specs/` lies outside every such leg's glob.
