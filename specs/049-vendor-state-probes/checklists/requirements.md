# Specification Quality Checklist: Vendor state probes

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-14
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

- The product here is the tool's own surfaces: registry fields, the four
  states, printed lines, the HEAD read, the environment a vendor run gets, and
  law rows and legs. State file paths, `integration_state_schema`, `env`
  variable names and `.codegraph/codegraph.db` are the facts being specified,
  not implementation choices. Specs 046 to 048 treat them the same way. The
  spec asks for one probe and names no function or module.
- Four decisions are taken rather than left open, each with its ceiling:
  - A partial SDD root is warned, never re-initialised, because spec-kit 1.0.6
    reverts edited files on a re-run. A partial graph is rebuilt, because it is
    derived from the tree (FR-005, FR-006).
  - The tracked gate reads HEAD, not the integrated ref of a landing branch
    (FR-010, Assumptions).
  - A declared opt-out wins over an inherited value in runs multivac spawns
    (FR-012, Edge Cases).
  - The post-edit hook carries the opt-outs in this change, because MV-62 was
    written for that hook (FR-012).
- `shared`, `local`, `ignore` and the graph-ignore lines are declared and
  pinned, and nothing reads them yet (FR-011). The equip change reads them.
- Out of scope, and not contradicted: writing ignore files, running inits from
  `init` or `repos sync`, committing shared paths, the door-to-integration map,
  harness files an integration or a grapher's project install writes,
  `codegraph init -y`, `CODEGRAPH_DIR`, scoping to the repos a change names,
  `managed: false`, `repos check` and the project document's state.
