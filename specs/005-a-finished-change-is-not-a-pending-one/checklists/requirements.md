# Specification Quality Checklist: A finished change is not a pending one

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-16
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

Validation ran three times.

**Iteration 1 — one failure, fixed:**

- *Success criteria are technology-agnostic.* SC-003 measured the empty-change
  case by counting occurrences of a literal word in the output. That pins the
  wording of a message rather than the outcome, and it would go green if the
  message were merely renamed. Restated as "names 0 changes as finished and
  raises 0 failures on this feature's account", which is the same measurement
  without depending on a string.

**Iteration 2 — one failure, fixed:**

- *Scope is clearly bounded* / *Requirements are testable and unambiguous.*
  Walking Story 1 against the system's existing closing step exposed a state
  the specification did not distinguish: an author's own branch, where every
  declared rule already resolves and nothing has landed. Under the definition
  as first written, the gate fired there — on every change, at the moment its
  tests went green — and the instruction it printed ("close it") is one the
  closing step refuses, because that step requires every declared repository to
  be recorded as landed. A gate whose advice the same system rejects is the
  failure this feature exists to end, so the definition gained a third
  condition and the specification gained Story 1 scenario 4, FR-005, two Edge
  Cases, the amended Key Entity, the amended SC-001 and SC-003, and a first
  Assumption stating the reason and what it costs. Requirement identifiers were
  renumbered to stay contiguous.

**Iteration 3 — clean.** Re-read every box against the amended text.

**Checks actually run, and their results:**

- Grepped the spec for the clarification marker: 0 occurrences.
- Enumerated the requirement and criterion identifiers to confirm they are
  contiguous and unique: FR-001 … FR-014, SC-001 … SC-007, no gaps, no repeats.
- Grepped the spec body for implementation names (the version control tool, the
  language, the runtime, the flag spellings, the reference name, container
  types). The only hit is the verbatim **Input** line, which quotes the request
  as given and is part of the template's header rather than the specification's
  prose.
- Walked all fourteen functional requirements against the acceptance scenarios.
  FR-001 and FR-002 are exercised by Story 1 scenarios 1 and 3; FR-003 by Story
  1 scenario 2; FR-004 by Story 2 scenarios 1 and 2; FR-005 by Story 1 scenario
  4 and the "author's own branch" edge case; FR-006 by the first two Edge
  Cases; FR-007 by Story 1 scenario 1 read together with scenario 2; FR-008 and
  FR-009 by Story 3 scenarios 1 and 3; FR-010 by Story 3 scenario 3 and the
  "recording a landing is never refused" edge case; FR-011 by Story 3 scenarios
  4 and 5; FR-012 by the "closing is never automatic" edge case. FR-013 (law
  and code land together) and FR-014 (performance and dependency constraints)
  are project-wide obligations whose acceptance is SC-007 and the Constitution
  Check in the plan — machine checks rather than user scenarios, recorded here
  rather than papered over with a scenario nobody would run.
- Checked each success criterion carries a number or a count: SC-001 (exactly
  one naming, failure then success), SC-002 (success on this account, pending
  still reported), SC-003 (0 named, 0 failures), SC-004 (100% of runs write the
  record only on the flag), SC-005 (byte-for-byte identical output), SC-006 (at
  least 1 failing named check per claimed behaviour), SC-007 (suite passes,
  strict verification exits 0). All measurable without opening the source.
- Checked that the question the change file left open is answered rather than
  deferred: the fifth Assumption decides it explicitly (the read offers, the
  human confirms) and gives three reasons. No requirement contradicts it —
  FR-010 states the same rule normatively.

**Deliberately not claimed, and why (Principle II):**

- That a change's rules resolving against published bytes proves *this change*
  is what published them. It proves the content is there. The spec says so in
  its fifth Assumption, and it is the main reason the record stays a human
  assertion; nothing in the feature tests authorship of published content,
  because nothing offline can.
- That an unresolved rule at the published reference means the work did not
  land. It equally means the reference was never fetched. FR-009 requires both
  possibilities to be stated; no test claims to tell them apart, because
  telling them apart requires the network the project's fourth principle
  forbids these commands from touching.
- A per-repository landing verdict. The spec's sixth Assumption confines the
  verdict to the change as a whole. A rule anchored across every repository
  cannot be attributed to one of them, so a per-repository number would be
  invented rather than measured.
- Any claim about how long the check takes on a large repository. The
  performance constraint in FR-014 is met by adding no new file enumeration and
  no new subprocess to the ordinary path; that is an argument from what was not
  added, and the plan records it as such rather than as a measured budget.
