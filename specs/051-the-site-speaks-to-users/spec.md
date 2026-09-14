# Feature Specification: The site speaks to users

**Feature Branch**: `the-site-speaks-to-users`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "The documentation site must not mention law IDs (MV-*), and ID links that go nowhere, such as `[MV-90](#)`, must go. Each sentence reads naturally without the ID and keeps the behaviour it describes. Headings stay clean, and links to their anchors are fixed. The changelog, maintainer comments and everything outside `site/` are out of scope."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader learns the behaviour, not the law's numbering (Priority: P1)

Someone using multivac reads a docs page. Today 14 of the 23 pages carry 129
IDs, which point into a table the page never links to.

**Why this priority**: an ID on the site is noise to the reader, and every one
of them is the reason for this change.

**Independent Test**: count IDs, in any case, in the tracked files under
`site/content/`. Then read each rewritten sentence against its original.

**Acceptance Scenarios**:

1. **Given** any tracked file under `site/content/`, **When** it is searched
   for an ID in any case, **Then** there are 0 matches (121 lines today, 125
   counting anchor links).
2. **Given** a sentence that carried an ID, **When** it is read after the
   change, **Then** it still states the behaviour, limit or reason it stated,
   in words, on the same page.
3. **Given** the built site, **When** its files are searched for an ID,
   **Then** only the changelog page and the feeds and search data that embed
   its text match.

---

### User Story 2 - Every link goes somewhere (Priority: P1)

15 headings carry an ID, so their anchors are spelled from one. 4 links point at
those anchors, and `[MV-90](#)` points at nothing.

**Independent Test**: build the site, then resolve each link this change
touches against the ids in its target page.

**Acceptance Scenarios**:

1. **Given** the 15 headings, **When** the site is built, **Then** each keeps its
   words without the ID, and no heading id contains an ID.
2. **Given** the 4 links to those anchors, **When** they are followed, **Then**
   each lands on the renamed heading.
3. **Given** the dead link, **When** it is read, **Then** it names the graph
   gate and links to that section of the commands reference.

---

### User Story 3 - The law says where IDs belong (Priority: P2)

Principle I says every rule MUST be cited by its ID, and MV-111 says
"everywhere else cites the ID". Both describe the site as it is today.

**Independent Test**: read Principle I, MV-111 and MV-126. Run
`verify --strict`.

**Acceptance Scenarios**:

1. **Given** the constitution, **When** it is read, **Then** Principle I scopes
   IDs to the law and the brain's own records, and says the site explains in
   plain words and binds nothing. Its version is 3.0.0, with a Sync Impact
   Report prepended.
2. **Given** MV-111, **When** it is read, **Then** it carries one
   `Amended 2026-09-14 by MV-126` note at the clause it changes.
3. **Given** MV-126, **When** it is read, **Then** it states the rule, what is
   mechanical and its ceilings in at most about 350 words, and its legs hold.
4. **Given** an ID re-added to a page, or a link to `#`, **When** MV-126 is
   active, **Then** `verify` refuses.

### Edge Cases

- **Quoted output.** An ID the tool prints about its own law becomes `…`; the
  words around it are never changed. A reader's example row takes an `INV-` ID,
  as the other examples on the site do.
- **Versions.** A rewrite must not add a version string, because MV-84 forbids
  one on the site. "MV-123 names the version measured" becomes words with no
  number in them.
- **Retired phrases.** A rewrite must not spell a phrase that the `absent` legs
  of MV-111 and MV-120 … MV-125 forbid over `site/content/**`.
- **Legs on changed lines.** MV-53 (a heading), MV-79 and MV-81 (two lines)
  match lines that lose an ID, and none of their patterns contains one. The
  phrase each one matches stays.
- **Heading collisions.** No cleaned heading duplicates another on its page
  (measured), so no anchor gains a `-1` suffix.
- **The HTML comment** in `_index.md` is stripped from the built page, but it
  is tracked under `site/content/`, so it is in scope.
- **The changelog** is mounted from `CHANGELOG.md` at build time.
  `git ls-files site/content` does not list it, so its IDs stay and no
  exemption is needed.
- **MV-31.** The command, config-key and harness headings keep their counts:
  9, 11 and 8.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No tracked file under `site/content/` MAY contain an ID, in any
  case.
- **FR-002**: Every behaviour, limit or reason that a removed ID accompanied
  MUST still be stated in words on the same page.
- **FR-003**: The 15 headings MUST keep their words without the ID. Every link
  to their old anchors MUST point at the new one, and no link MAY target `#`.
- **FR-004**: In quoted output, an ID the tool prints MUST become `…`, and a
  reader's example row MUST take an `INV-` ID. No other quoted word changes.
- **FR-005**: The changelog, `CHANGELOG.md`, `site/hugo.yaml`, `site/assets/`,
  `site/layouts/` and every file outside `site/` MUST NOT change. The exceptions
  are the records this rule needs: the constitution, `.multivac/invariants.md`,
  the change file and this spec directory.
- **FR-006**: Principle I MUST be amended as in research.md R1, with version
  3.0.0, a prepended Sync Impact Report, and a footer that states 3.0.0 and
  2026-09-14.
- **FR-007**: MV-126 MUST replace the RESERVED row as `proposed`, with the legs
  in research.md R3, and MV-111 MUST carry the note in R2 exactly once.
- **FR-008**: Every existing leg MUST still hold. A leg that breaks MUST be
  re-pinned, or retired with an amendment note on its row.
- **FR-009**: No source, test, dependency or anchor of another row changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: IDs under `site/content/` go from 129 on 121 lines (125 lines in
  any case) to 0.
- **SC-002**: Heading ids spelled from an ID in the built site go from 15 to 0,
  and the 5 links this change touches (4 anchor links and the dead one) each
  resolve to an id in their target page.
- **SC-003**: The built files that contain an ID are only the changelog page and
  the feeds and search data that embed its text.
- **SC-004**: `verify --strict` reports 0 blocking broken, MV-126 is `proposed`,
  and the full suite passes (680 today).
- **SC-005**: MV-126 is at most 350 words.
- **SC-006**: With MV-126 active in a scratch clone, re-adding `(MV-90)` to a
  page exits 1, so does adding `[x](#)`, and a control edit exits 0.
- **SC-007**: A fidelity pass over every rewritten sentence finds 0 lost
  behaviours and 0 added claims.

## Assumptions

- The user decided this. The rationale recorded is the one measured: the IDs
  link nowhere a reader can follow.
- Removing IDs from pages relaxes no rule. The site bound nothing before, and
  MV-111's copy half still reaches it through the retired-phrase legs.
- The tool's own output still prints IDs. Changing that is a separate decision.
