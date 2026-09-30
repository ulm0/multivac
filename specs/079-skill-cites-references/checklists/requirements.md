# Specification Quality Checklist: The skill carries what no command prints, and no page keeps a sentence the tool contradicts

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

- The product is a CLI and a skill pack whose readers are agents and operators: the
  pack's files, the doors, the commands and the lines they print, the root documents, the
  constitution and the site pages ARE the user-facing surface, so naming them is scope,
  not implementation. No source file, function or test helper is named in the spec; those
  are the plan's. Byte counts are the measure of the saving an agent pays, so they are
  the success criteria's unit, as in the house's earlier specs.
- Validation ran twice. Iteration 1 found three defects, fixed in place: SC-006 promised
  "12 brain" doors where FR-018 lists nine brain configurations (now "at least 9 brain doors
  and 4 consumer doors"); FR-018 named "per-repo graphers" where FR-019 renders both the
  per-repo-only and the mixed shape (now both); SC-001 carried only an absolute ceiling,
  which the merged tree's larger baseline could make trivially true (now also "at most 40%
  of the same session measured on the merged tree"). Iteration 2 passed every item.
- **Every figure is re-measured.** The spec quotes 62d4588 figures as the design measured
  them; FR-010 and FR-020 require the pack and each family to be re-derived on the tree
  where changes #5–#8 merged, and every SC is stated relative to that tree or as a ceiling
  the prototype already met.
- **The design's ids map** to the spec's in research.md R0: design FR-001–FR-009 →
  FR-001–FR-012 (FR-010 is the merged-tree derivation), FR-010–FR-016 → FR-013–FR-019,
  FR-017–FR-022 → FR-020–FR-028, FR-023–FR-028 → FR-029–FR-034, FR-029–FR-035 →
  FR-035–FR-041, the law FR-042–FR-044; design SC-001–SC-009 → SC-001–SC-016 with the
  critic's additions placed in their stories.
- **The orchestrator's decisions are in the spec, not as markers.** The hand-offs to #6, #7
  and #8 are owned there; graph-answers-where-asked's family was not handed off and is
  fixed here (FR-023); this change is the backstop for every family (FR-020); the
  constitution's Principle III is change-file-cites' amendment, verified here (FR-022); the
  version level is #7's and enactment the human's; no body byte-ceiling test (Assumptions).
- Every one of the completeness critic's 11 gaps is folded in:
  1. the door test never rendered a brain==code door (no `isBrain`), nor an empty brain, and
     checked no fixture's shape — FR-018 (the fixtures, a marker per fixture, the empty brain
     and the code-less per-repo shapes), SC-006, research.md R6;
  2. the row and §8 said "the one harness that loads a skill", unmeasured and contradicted
     by graphify's per-harness skill installs — FR-042 ("multivac projects its skill only
     into the `claude` target"), FR-034 ("multivac installs it only for Claude Code"),
     Assumptions, research.md R2 and R12;
  3. brains without a `claude` target are told to load a skill multivac never writes —
     Edge Cases, Assumptions (the `skill-reaches-every-harness` follow-up), FR-034 (nothing
     contradicts the session-zero text), research.md R2 and R14;
  4. two copies of "`close` commits it" survived — FR-026, US3 acceptance 4, research.md R8
     (the A9 family and its leg);
  5. the configuration page's "runs automatically" at the wrong points — FR-040;
  6. "on every commit" unqualified in four places and flow.md's "`verify` refuses a commit
     whose anchors are broken" — FR-027 (the constitution's Compliance line with #7's PATCH
     where #7 took it, else its own), US3 acceptance 2, SC-011, Assumptions (flow.md's line
     handed to `doctor-names-every-gate`), research.md R8 and R10;
  7. DESIGN's "under the managed-block rule where the target format allows" — FR-034
     ("`doors` mirrors the skill directory");
  8. the pack cites MV-150 and MV-151 with no fallback where an owner's feature did not
     land — FR-010 (keep only what the merged tree ships), Edge Cases, research.md R7;
  9. the row text assumed MV-152 owns every family — FR-042 (only the families MV-152 pins,
     the owner row named for the rest), SC-010, research.md R12;
  10. three pack sentences were unconditional where the tool is not — FR-013 ("in the
      worktree `change apply` printed"), FR-015 ("or names no grapher", "only where a grapher
      is declared"), US2 acceptances 2 and 3;
  11. the two test legs were never dry-run — FR-043 (each leg dry-run on the tree it lands
      on), research.md R11.
- The spec quotes retired phrases, but `specs/` lies outside every family's glob, and no
  file an active `absent` leg covers is written by this step.
