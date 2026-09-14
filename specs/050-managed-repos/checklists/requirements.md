# Specification Quality Checklist: Managed repos

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

- The product here is the tool's own surfaces: a config key, printed lines,
  exit codes, the writes it makes or skips, and law rows and legs. The
  specified facts are `repos.<key>.managed`, git's
  `--is-shallow-repository` answer and `git fetch --unshallow` as a fix, and
  they are not implementation choices. Specs 046 to 049 treat facts the same
  way. The spec asks for one function deciding scope and names no module.
- The user has already decided `managed: false` over reusing `none`, shallow
  detection as a runtime fact, and reporting such repos without failing them
  (decision D6). Five further decisions are taken here, each with its ceiling:
  - The scaffold, the build and the refresh are silent for a read-only root,
    as MV-87 has it for `none`. `doors`, `doctor` and `repos` say it, and a
    gate that would otherwise refuse says it in one line (FR-005, FR-006).
  - A change naming a read-only repo is refused at plan and apply, before
    anything is written (FR-007).
  - The brain is never read-only: `managed: false` there is refused, and its
    own shallow checkout stays in scope (FR-002, FR-003).
  - Cloning and fetching count as reading, so `repos sync` is unchanged apart
    from its wording (FR-009).
  - Renderings stay declaration-only, so flow.md and the doors' lists still
    name a read-only repo as declared (Edge Cases).
- Out of scope, and not contradicted: `repos check` and a clone's other
  states, scoping builds and gates to the repos a change names, running inits
  from `init` or `repos sync`, committing vendor files, and removing
  projections already written.
