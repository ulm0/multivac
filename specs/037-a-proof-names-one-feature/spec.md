# Feature Specification: A proof names one feature

**Feature Branch**: `a-proof-names-one-feature`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "An SDD proof must name exactly one feature. The separator narrowed the match; it did not end it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A tail is not a match (Priority: P1)

An author opens `expire`. `specs/030-points-expire/` exists from a change
closed months ago. `change plan expire` finds it, calls the SDD step proven,
and moves on — the spec for this change was never written.

**Why this priority**: it is the SDD integration's flagship gate, satisfied by
another feature's artifact. MV-110 claimed this was closed and it was not, so
a law row is currently citable and wrong.

**Independent Test**: plant a directory whose name ends in `-<slug>` after a
longer prefix and confirm the gate still refuses.

**Acceptance Scenarios**:

1. **Given** `specs/030-points-expire/spec.md` and no directory whose name is
   digits then `-expire`, **When** `change plan expire` runs, **Then** it
   refuses and names the artifact it wants.
2. **Given** `specs/031-expire/spec.md`, **When** `change plan expire` runs,
   **Then** it proceeds.
3. **Given** openspec's dated archive `2026-08-19-<slug>`, **When** its gate
   runs, **Then** it still resolves.

---

### User Story 2 - Two directories are a refusal, not a coin toss (Priority: P1)

Two directories both prove one step. The probe took the first in sorted
`readdir` order, so an older foreign directory shadowed the right one and
nothing said which had been read.

**Why this priority**: silently choosing is the failure mode this project is
built against — a gate that reports it checked, having checked the wrong
thing.

**Acceptance Scenarios**:

1. **Given** two directories proving one step in one root, **When** the gate
   runs, **Then** it refuses naming both and the root they collide in.
2. **Given** exactly one, **When** the gate runs, **Then** it proceeds as
   before.
3. **Given** the ledger gate, **When** two books prove one step, **Then** it
   refuses on the same terms.

---

### Edge Cases

- A slug that is a tail of another slug (`expire` inside `points-expire`): the
  reason this change exists; the token cannot cross the separator.
- A literal `*` in an artifact path: matches a literal star now. No adapter
  declares one; the change is that the language no longer has a wildcard.
- A slug containing `<` or `>`: impossible — `change` validates the slug
  against `[a-z0-9][a-z0-9._-]*`, so a slug cannot forge the token.
- One token-carrying segment per path, the same rule the single `*` had.
- A directory of the right shape written by hand, outside the SDD tool: still
  proves the step. The artifact IS the proof and carries no author.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The artifact language MUST have no wildcard that can cross a path
  segment's separator.
- **FR-002**: `<n>` MUST mean one run of digits, defined in exactly one place.
- **FR-003**: A slug that is the tail of another slug MUST NOT be proved by the
  longer directory.
- **FR-004**: The resolver MUST return every hit, not the first in sort order.
- **FR-005**: Both gate loops MUST refuse when more than one directory proves
  one step, naming them and the root.
- **FR-006**: openspec's dated archive MUST keep resolving.
- **FR-007**: MV-110's row MUST stop stating an open ceiling it no longer has.
- **FR-008**: No new runtime dependency.

### Key Entities

- **Artifact path**: what an SDD step leaves behind, declared as data in the
  registry.
- **Token**: `<n>`, the one piece of the path that is not literal.
- **Root**: a declared repo the SDD tool may live in; the first holding any hit
  decides.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `specs/030-points-expire/` does not prove slug `expire`.
- **SC-002**: `specs/031-expire/` does prove it.
- **SC-003**: openspec's `2026-08-19-<slug>` archive still resolves.
- **SC-004**: Two matching directories produce a refusal naming both.
- **SC-005**: No `*` remains in any declared artifact path.
- **SC-006**: The suite passes, with every assertion that quoted the old glob
  updated rather than deleted.

## Assumptions

- spec-kit numbers its feature directory and openspec dates its archive. Both
  are the vendors' own layouts, and both are digit runs separated by `-`.
- `<n>` matching any digit run rather than a valid date is enough: the
  structure is what kills cross-matching, not date semantics.
- The first declared root holding any hit decides — a single hit wins there,
  several refuse there, and a later root is never consulted. That is the same
  root that decided under the old first-hit code.
