# Specification Quality Checklist: The site shows what is published

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

**US1 and US2 are in tension on purpose, and the spec would be wrong without
both.** The obvious answer to "the site advertises an unpublished version" is to
deploy only from releases. The operator ruled that out with a reason the spec
had to absorb: site-only corrections would then wait for a release nobody needs
to cut. Writing US1 alone would have produced a specification whose natural
implementation the operator had already rejected.

**FR-002 is the requirement that does the work.** The first draft said the
advertised version must equal the published one — a property to be checked. It
is now that the repository must not *state* it: what is not written cannot
drift, and the guarantee stops depending on a test that somebody has to keep
honest. SC-001 measures the absence rather than the agreement.

**FR-005 was added after reading the deployment order.** The pipeline runs its
deploy stage before its publish stage, so the natural way to give releases a
fresh badge would have deployed the site *before* the registry accepted the
package — reintroducing the same lie, one minute long instead of forever. A
requirement that only said "the badge equals the published version" would have
been satisfiable by an implementation that briefly published a falsehood.

**FR-007 exists because a fresh fork has no releases.** Rendering an empty gap
or crashing are both worse than saying so.
