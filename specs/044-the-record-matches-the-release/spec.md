# Feature Specification: The record matches the release

**Feature Branch**: `the-record-matches-the-release`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Four records fell a release or a row behind what happened — the changelog, two law rows and the constitution's footer — and every gate stayed green over all of them. Correct them, with no product code change, and give the retired sentences MV-111's device so they cannot come back."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The changelog says what 0.10.0 shipped (Priority: P1)

A person upgrading to 0.10.0 reads its changelog entry to learn what changed.
The entry carries one bullet, the door's graphify wording (MV-50). Fifteen
rows, MV-105 … MV-119, reached `active` on 2026-08-19 and shipped in that
release on 2026-08-24; none of their IDs appears anywhere in `CHANGELOG.md`.
Some of them change what a user sees — exit codes, a refused config key, a
harness gate that now blocks an edit — and the reader is told none of it.

**Why this priority**: the changelog is the one record written for the people
who install the tool, and it is the record furthest behind.

**Independent Test**: read the 0.10.0 entry and find every one of MV-105 …
MV-119 named, each beside a description of the behaviour its row states.

**Acceptance Scenarios**:

1. **Given** the 0.10.0 entry, **When** it is read, **Then** each of MV-105 …
   MV-119 is named at least once, and each description matches what that row
   and the code at tag `v0.10.0` say — nothing invented, nothing a row does not
   state.
2. **Given** the existing MV-50 bullet, **When** the entry is rewritten, **Then**
   that bullet is kept.
3. **Given** every entry, **When** measured with one definition — a row
   `active` at a release's tag that no entry at or before that release names —
   **Then** no row is missing after the first release, which is the baseline.
   MV-72 (made law in 0.2.0) is the one older gap, and the 0.2.0 entry names it.

---

### User Story 2 - The law states the runner order the shim runs (Priority: P1)

An agent or maintainer reads MV-14 to learn which multivac a commit hook runs.
It says `mvac` on PATH first and the repository's build last — the exact
inverse of MV-92, which made the order most-specific-first on 2026-08-18, and
MV-108, which narrowed the first rung to a repository that IS multivac. The
inverted sentence was copied into `DESIGN.md`, into the install guide twice,
and into the hooks reference, whose own MV-92 section states the right order on
the same page.

**Why this priority**: a reader following the wrong order debugs the wrong
binary — exactly the version-skew confusion MV-92 was written to end.

**Independent Test**: read MV-14, `DESIGN.md`, the install guide and the hooks
reference; every statement of the order matches the shim.

**Acceptance Scenarios**:

1. **Given** MV-14, **When** it is read, **Then** it cites MV-92 for the order
   instead of stating the inverted one, and an inline amendment note records
   the retired order, why it was retired, and which row retired it.
2. **Given** the four documentation copies, **When** they are read, **Then** each
   states the order in force or cites MV-92 for it.
3. **Given** a later edit that reintroduces the PATH-first phrasing in a root
   document, a site page or a skill, **When** the law is verified, **Then** it
   reports a blocking failure naming the file.

---

### User Story 3 - The law does not call a fixed defect unfixed (Priority: P2)

MV-111 closes by recording the Claude harness gate as mute — "recorded here,
unfixed" — but MV-112 fixed it the same day, and one commit enacted both rows.
A reader of MV-111 meets a live defect that does not exist.

**Why this priority**: it misleads, but the row that fixed it is one table row
away and states the fix.

**Independent Test**: read MV-111 and find the clause marked withdrawn, with
the row that closed it named.

**Acceptance Scenarios**:

1. **Given** MV-111, **When** it is read, **Then** the "unfixed" clause is still
   visible (history is never deleted) and an inline amendment note withdraws it,
   naming MV-112 and leaving what the harness gate still does not cover to
   MV-112's own ceilings.

---

### User Story 4 - The constitution states its own version (Priority: P2)

The constitution's footer reads version 2.0.0, while its newest Sync Impact
Report records 2.0.0 → 2.0.1. The change that prepended that report never moved
the footer. The document's own amendment procedure requires every in-place edit
to bump the version and prepend a report.

**Why this priority**: the footer is the answer to "which principles am I
reading", and the document gives two answers.

**Independent Test**: read the footer and the newest report and find the same
version.

**Acceptance Scenarios**:

1. **Given** the constitution, **When** it is read, **Then** a new report records
   2.0.1 → 2.0.2 as a PATCH ("a statement of fact corrected"), and the footer
   reads 2.0.2 with Last Amended set to the day this change lands.
2. **Given** a later edit that puts the footer back to 2.0.0 or 2.0.1, **When** the
   law is verified, **Then** it reports a blocking failure.

---

### User Story 5 - The rule is law, with its limits stated (Priority: P3)

A maintainer about to cut the next release reads MV-120 and learns three
things: the rule, what enforces it mechanically, and what does not.

**Why this priority**: without the row, the four corrections are one more pass
that ages; with it, the retired sentences are guarded and the unguarded part is
named.

**Independent Test**: read MV-120, then revert each correction in a scratch
copy with the row active and confirm each leg turns red.

**Acceptance Scenarios**:

1. **Given** MV-120, **When** it is read, **Then** it states the rule in three
   halves (release entries name the rows they made law, with the first release
   as the baseline; a row changed by a later row says so at that row and its
   copies move with it; a self-versioned document states its newest recorded
   version), the measured evidence, and its ceilings.
2. **Given** MV-120 while this change is open, **When** the law is verified,
   **Then** a broken leg reports pending and blocks nothing.
3. **Given** MV-120 marked active in a scratch copy, **When** any one correction is
   reverted, **Then** the matching leg reports a blocking failure.

---

### Edge Cases

- The 0.8.0 changelog entry correctly records that the shim USED to try `mvac`
  first. It is history and must not trip the retired-order leg.
- MV-14's own amendment note quotes the retired order, so the leg that forbids
  that order cannot read the law file.
- A documentation line that names `mvac` on PATH as the LAST rung is correct and
  must not trip the leg.
- The amendment notes carry this change's landing date. If the change lands on
  another day, the date moves in every place it appears: the two notes, the
  count leg, the row's date and the constitution's Last Amended.
- MV-72 lies outside 0.10.0. Leaving it out would make MV-120's rule false on
  the day it is enacted.
- While MV-120 is `proposed`, a broken leg reads pending and blocks nothing. Proof that the
  legs bite has to come from a scratch copy with the row active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The 0.10.0 changelog entry MUST name each of MV-105 … MV-119 at
  least once, and each description MUST be faithful to its row and to the
  released behaviour.
- **FR-002**: The 0.10.0 entry MUST keep the existing MV-50 bullet and follow the
  file's house shape: `## <semver> — <date>`, grouped bullets, each naming the
  ID(s) it made true.
- **FR-003**: The 0.2.0 entry MUST name MV-72.
- **FR-004**: MV-14 MUST cite MV-92 for the runner order and MUST carry an
  inline amendment note naming this change's row, which quotes the retired
  order and gives the reason.
- **FR-005**: Every non-history copy of the inverted order MUST state the order
  in force or cite MV-92: `DESIGN.md`, the install guide (both places) and the
  hooks reference.
- **FR-006**: MV-111's "unfixed" clause MUST stay visible and MUST be withdrawn
  by an inline amendment note naming MV-112.
- **FR-007**: The constitution MUST move to 2.0.2 through its own amendment
  procedure: a prepended report, and a footer that matches it.
- **FR-008**: MV-120 MUST replace the reserved row with the stated rule, the
  evidence and the ceilings. Its authority is `specified` and its state stays
  `proposed`.
- **FR-009**: MV-120 MUST carry legs that turn a regression of each retired
  sentence into a blocking failure: the inverted order in root documents, site
  pages and skills; MV-14's old lead; the stale constitution footer. It MUST
  also carry a count leg on the two amendment notes.
- **FR-010**: No product source, test or runtime dependency changes.
- **FR-011**: No leg may match history: archived changes, specs, or the 0.8.0
  changelog entry.

### Key Entities

- **Changelog entry**: one released version's section in `CHANGELOG.md`, written
  for people who install the tool.
- **Law row**: one row of `.multivac/invariants.md`. Its amendment notes are
  inline, dated, and name the amending row.
- **Leg**: an anchor under a row. `absent` forbids a pattern; `count=N` pins how
  many lines match.
- **Sync Impact Report**: the constitution's prepended record of each amendment
  and the version it produced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 15 of 15 rows MV-105 … MV-119 are named in the 0.10.0 entry, and 0
  rows are missing from any entry after the first release.
- **SC-002**: 0 non-history copies of the inverted runner order remain; there are
  4 today.
- **SC-003**: The constitution's footer version equals its newest report's
  version.
- **SC-004**: `verify --strict` reports 0 blocking failures, and the full test
  suite passes.
- **SC-005**: With MV-120 active in a scratch copy, reverting each correction
  turns its leg red: 4 of 4.
- **SC-006**: MV-120 stays `proposed`. This change enacts nothing.

## Assumptions

- The first release shipped the table whole, so it is the baseline. Listing
  sixty-eight IDs in its entry would tell a reader nothing.
- The constitution's amendment procedure has no exception for metadata, so
  correcting the footer is itself a PATCH amendment. It is not a silent edit.
- Rows are amended inline, in the shape the table already uses: "Amended <date>
  by MV-xxx", with the WITHDRAWN convention for a retired clause. A rule is
  stated once and cited everywhere else (MV-111).
- A test tying every future release to the rows it made law is out of scope. It
  would refuse the commit that enacts a row before its release has an entry,
  which decides WHEN an entry is written: a policy, not a correction. MV-120
  names that ceiling.
- The audit's product findings (init scaffold, SDD enforcement, graph refresh
  and commit) are separate changes.
