# Feature Specification: The release says what changed

**Feature Branch**: `002-the-release-says-what-changed`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Add a changelog to this project, on both surfaces, and make keeping them in step a checkable rule."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Someone deciding whether to upgrade can find out what changed (Priority: P1)

A person has an older version of the tool installed and sees that a newer one
exists. They want one page that tells them what is different, so they can decide
whether to upgrade now, later, or not at all. Today no such page exists on
either surface: the project's own decision ledger records every change in full,
but it is written for the people changing the tool, not for the people using it,
and it is organised by decision rather than by release.

**Why this priority**: This is the entire user-facing purpose. Without it, the
other stories are maintenance rules protecting something that does not exist.

**Independent Test**: From a released version number alone, a reader can find
the list of what that release contained, on both the repository and the
documentation site, without reading commit history.

**Acceptance Scenarios**:

1. **Given** a reader browsing the repository, **When** they look in the place a
   changelog conventionally lives, **Then** they find one, with an entry per
   released version, newest first, each dated.
2. **Given** a reader browsing the documentation site, **When** they look for a
   changelog, **Then** they find the same entries, readable as a page of the
   site.
3. **Given** the two most recently released versions, **When** a reader compares
   their entries, **Then** each names what changed in terms a user of the tool
   can act on, not a list of commit subjects.

---

### User Story 2 - The two surfaces cannot silently disagree (Priority: P2)

A maintainer edits the changelog in one place and forgets the other. Today
nothing would notice, and the two copies would drift until a reader found the
contradiction. One surface is the source; the other must be provably the same.

**Why this priority**: Two hand-maintained copies of one list is a defect this
project has already had to write a rule for elsewhere. Shipping the changelog
without this rule just recreates it.

**Independent Test**: Change one surface without changing the other, and the
project's own checks must fail with both surfaces named.

**Acceptance Scenarios**:

1. **Given** entries added to the source surface only, **When** the project's
   checks run, **Then** they fail and name both surfaces and the difference.
2. **Given** the site surface carrying exactly the source's entries plus only
   what the site generator needs to render a page, **When** the checks run,
   **Then** they pass — the rendering metadata is not treated as drift.
3. **Given** a maintainer who has just edited only the source, **When** they read
   the failure, **Then** it tells them what to do to bring the other into step.

---

### User Story 3 - A release with no entry is caught (Priority: P3)

A version is published and nobody wrote a line for it. The changelog exists,
both surfaces agree, and the newest release is simply absent from both — the
failure the whole feature exists to prevent, arriving in the shape that passes
every other check.

**Why this priority**: Without it, Stories 1 and 2 are satisfied by a changelog
that stopped being updated three releases ago and agrees with itself perfectly.

**Independent Test**: With the declared version absent from the changelog, the
project's checks fail and name the missing version.

**Acceptance Scenarios**:

1. **Given** the version the project declares for itself has no entry, **When**
   the checks run, **Then** they fail and name that version.
2. **Given** that version has an entry, **When** the checks run, **Then** they
   pass, regardless of how much or how little the entry says.
3. **Given** an unreleased version under development, **When** the maintainer
   adds its entry before publishing, **Then** the check is satisfied — the rule
   is that the entry exists, never that it exists only after publication.

---

### Edge Cases

- The changelog exists but has no entries at all, or only an unreleased
  placeholder. The declared version is absent, so this must fail like any other
  missing entry.
- The site surface is missing entirely while the source is present. This is the
  disagreement case at its widest and must fail, not pass by comparing nothing.
- An entry exists for the declared version but is empty. The rule deliberately
  does not judge the content of an entry, so this passes; the check is presence,
  not quality.
- A version appears in the changelog with different formatting than the manifest
  states — a leading `v`, or surrounding markup. The reader means the same
  version; the check must not fail on decoration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST carry a changelog at the location conventional
  for repositories, listing released versions newest first, each with its date.
- **FR-002**: The documentation site MUST carry the same entries as a readable
  page.
- **FR-003**: Exactly one surface MUST be the source; the other MUST be provably
  derived from it, and the project's checks MUST fail when they disagree.
- **FR-004**: The comparison MUST tolerate only what the site generator requires
  in order to render the page, and nothing else.
- **FR-005**: The project's checks MUST fail when the version the project
  declares for itself has no entry in the changelog.
- **FR-006**: A failure MUST name what disagreed, or which version was missing,
  and what to do about it.
- **FR-007**: The rule MUST NOT judge the wording, length, or quality of any
  entry.
- **FR-008**: Entries MUST NOT be generated from commit messages.
- **FR-009**: How releases are published, tagged, or versioned MUST NOT change.

### Key Entities

- **Changelog**: the ordered list of released versions and what each contained,
  written for someone using the tool rather than someone changing it.
- **Entry**: one released version's section — its number, its date, and what
  changed.
- **Surface**: a place a reader finds the changelog. There are two, and exactly
  one of them is the source.
- **Declared version**: the version the project states for itself, which every
  release is cut from and which every entry must eventually cover.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can answer "what changed between these two releases"
  from either surface alone, without reading commit history.
- **SC-002**: 100% of published versions have an entry, starting with the two
  already published.
- **SC-003**: Editing one surface and not the other fails the project's checks
  on the first run, rather than being discovered by a reader.
- **SC-004**: Publishing a version with no entry fails the project's checks.
- **SC-005**: Each of the three failure modes — surfaces disagree, declared
  version missing, source surface absent — is demonstrated by its own automated
  check, so none can regress silently.

## Assumptions

- The repository root is the conventional location a reader and their tooling
  look for a changelog; no configuration is needed to make it discoverable.
- The site generator requires per-page metadata that the plain repository file
  cannot carry, so exact byte equality of the whole files is not the right
  comparison and the rule is stated in terms of the entries instead.
- Two published versions exist and their contents are recoverable from the
  project's own decision ledger, so the changelog starts complete rather than
  starting from the next release.
- Writing entries stays an authoring task, in the same way this project already
  treats the writing of its own principles: nothing generates them, and nothing
  judges them.
- "Released" means the version the project declares for itself; whether it has
  reached a package registry is out of scope, so an entry written before
  publication satisfies the rule.
