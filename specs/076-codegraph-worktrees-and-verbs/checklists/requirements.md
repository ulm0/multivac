# Specification Quality Checklist: codegraph answers for the checkout it is asked in

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
  CLIs too: multivac's commands, flags, printed lines and the files it writes
  (`info/exclude`, `codegraph.json`, `.claude/settings.json`), and the codegraph verbs, flags
  and paths it prints or records (`-p <checkout>`, `codegraph uninit --force`,
  `~/.codegraph/telemetry-queue.jsonl`, `CODEGRAPH_NO_DOWNLOAD=1`), ARE the user-facing
  surface, so naming them is scope, not implementation. No multivac source file, function or
  language construct is named; those are the plan's.
- Validation ran twice. Iteration 1 failed nothing on the checklist but found four defects,
  fixed in place: FR-007 did not say what the brain's own main checkout prints (graph-answers-
  where-asked prints nothing there; now stated); FR-028's de-duplication would have told a
  door that cites graphify's section that "the verbs above" were listed when only their names
  were (now only where the lines above list them); FR-005 did not say land stays silent on a
  lookup miss, which apply already reported (now stated); SC-021 gave a match count without
  the base it was counted on. Iteration 2 passed every item.
- **Story order.** All four stories are P1 and run in dependency order: US1 (the design's W,
  indexed) builds the index; US2 (H, followed) refreshes it; US3 (K, kept out) takes the mount
  out of a consumer's index before US4 (V, asked) prints the verbs there — the design's "K
  comes first", which raises K from the design's P2. plan.md and tasks.md follow the same
  order.
- **The design's FR/SC ids map** to the spec's, and graph-answers-where-asked's names map to
  the design's, in research.md R0.
- Every one of the completeness critic's 12 gaps is folded in:
  1. land's ignore step would dirty the worktree close removes — FR-005 (the grapher's own
     file alone, never `.gitignore`, as graph-answers-where-asked's land already writes it),
     SC-002 (porcelain empty after land as well as after apply);
  2. the ignore probe tested the database path, which codegraph's own `.gitignore` un-ignores
     around — FR-003 (each ignore line asked of itself), acceptance US1-3 (a `*.db`-only
     repo), SC-002;
  3. three legs that go red on how a string is quoted — research.md R23's spelling rule (a
     quoted string, never a template literal) and tasks T021, T023;
  4. tests that break and were not listed — research.md R25, tasks T055 (`graph-navigation`
     :37 and :45), T054 (the MV-61 test's answer match), each keeping the title a leg reads;
  5. graph-answers-where-asked's predecessor opsx-through-its-cli already wrote the codegraph
     sentences this change supersedes — FR-029 (replaces, never appends), SC-022, FR-033 (both
     site sentences rewritten);
  6. the refuted one-call claim survives in paraphrases — FR-030 ("in any wording"), SC-021,
     research.md R19 (the widened `absent` regex, dry-run 10 lines in 6 files);
  7. docs that say land commits a local artifact — FR-011, FR-033;
  8. a land-time build skipped the exclude step — FR-005 (the exclude step before land's build or sync), SC-007;
  9. MV-128 contradicted without a note — FR-031 (MV-128's note carries the worktree
     exception), research.md R24;
  10. the reason for a silent skip was false in the common case — FR-002 (said once),
      acceptance US1-7, SC-005;
  11. a measurement missing — research.md R7 (the exclude line is 104 bytes plus the common
      directory's path);
  12. the real-vendor test was never run in CI and wrote the developer's telemetry queue —
      Assumptions (sixth bullet), tasks T017 (HOME isolated, the four opt-outs, local-only).
- The design's §10 questions are taken at its defaults and recorded as Assumptions, not
  markers; the operator can re-grade any of them before planning.
