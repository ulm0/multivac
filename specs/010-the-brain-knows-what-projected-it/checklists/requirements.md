# Specification Quality Checklist: A brain knows what projected it

**Created**: 2026-08-17 · **Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Notes

Three things were settled by the operator before drafting, and the spec must not
quietly re-open them.

- **Nothing refuses.** The first sketch had the tool refuse below a declared
  floor, reasoning that a gate which cannot be trusted should not report. The
  operator chose warn-loudly-and-constantly instead. FR-007 states it, SC-002
  measures it across every command and both severities, and no user story has a
  refusal in it. This also matches the existing posture: the hook shim exits 0
  with a loud warning when no binary is runnable at all.

- **The record moves only under an explicit act**, which is a sharper rule than
  the first design. That draft had the re-projection command restamp — so
  running it for an unrelated reason would have silenced the notice **without
  the upgrade having been taken**. Quiet, and looking resolved. US3 exists for
  this alone, and SC-003 measures both halves: without the act the record is
  byte-identical and the notice persists.

- **Two files, not one.** The floor is human-authored and the record is
  machine-written, and the second must never round-trip the first: the seeded
  config is full of hand-written comments a naive YAML rewrite would destroy.
  FR-003 says the tool must not write the floor.

One requirement was rewritten during validation. **FR-011** was absent, and
without it every brain in existence — none of which has a record — would have
produced the loudest notice on first run after upgrading. An absent record is an
absence, not version zero. It is now a requirement and SC-005 measures it.
