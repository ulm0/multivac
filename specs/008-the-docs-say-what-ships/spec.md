# Feature Specification: The docs say what ships

**Feature Branch**: `the-docs-say-what-ships`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Publish 0.3.0, and make sure it is reflected in the documentation too."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Someone installing the tool is told the truth about it (Priority: P1)

A person lands on the install page, runs the version check it prints, and
compares. Today the page tells them the version string is `1.0.0`, that the
package is `private: true`, and that it is unreleased — three statements, none
of which is true. The package has been public on npm through three releases and
the binary prints `0.2.0`. The page also opens by calling the project "an early
build, pre-release", which the landing page repeats.

After this change every claim a page makes about the project's release state is
one the manifest and the registry agree with.

**Why this priority**: this is the first page a stranger reads, and every one of
those sentences is wrong in the direction that costs trust — a reader who runs
the command and sees a different number learns that the docs are not checked.
For a tool whose entire pitch is that unchecked prose decays, that is the worst
page to be wrong on.

**Independent Test**: read the install page against the published package and
the manifest; no sentence about version, privacy or release state contradicts
either.

**Acceptance Scenarios**:

1. **Given** the install page's version-check block, **When** it is compared
   with what the released binary prints, **Then** they agree.
2. **Given** any page on the site, **When** it is searched for a claim that the
   project is unreleased, private, or pre-release, **Then** none is found.
3. **Given** the manifest, **When** it is read for a `private` field, **Then**
   there is none — and no page says otherwise.

---

### User Story 2 - Someone upgrading learns what will bite them (Priority: P1)

A person running 0.2.0 upgrades. One behaviour changed in a way that can turn
a leg that was passing into a leg that fails: the anchor scanner used to skip
any line that merely contained the substring `@anchor`, and now skips a line
only when it carries a complete anchor comment — the opener and its `-->`. A
repository with a source line like `const x = "user.name"; // @anchor` was
invisible to every leg; it is now scanned, so a tombstone that was silently
passing can start refusing.

They learn this from the changelog before they upgrade, not from a red gate.

**Why this priority**: it is the only change in this release that can break
somebody else's repository. A release note that omits it is the same failure as
prose that is not checked — the reader finds out from a broken gate instead.

**Independent Test**: the changelog's entry for the released version names the
behaviour, says who is affected, and says what to do about it.

**Acceptance Scenarios**:

1. **Given** the changelog, **When** it is read for the released version,
   **Then** there is an entry, dated, naming every invariant the release made
   true by ID.
2. **Given** that entry, **When** the behaviour change is read, **Then** it
   states what used to happen, what happens now, and who is affected.

---

### User Story 3 - The release cannot ship without the entry (Priority: P2)

Someone cuts the next release. The version in the manifest, the version the
site advertises and the changelog entry are all required to agree before the
tag can publish, and this is checked rather than remembered.

**Why this priority**: the machinery for this mostly exists — MV-68 pins the tag
to the manifest, MV-77 pins the site badge to the manifest, MV-78 requires an
entry for the declared version. P2 because this release exercises those rules
rather than building them. What is missing is narrower: nothing stops a page
from hardcoding a version string in its prose, which is exactly how the install
page came to say `1.0.0`.

**Independent Test**: hardcode a version number in a page's prose, run the
project's own verification, and see it refused.

**Acceptance Scenarios**:

1. **Given** a page carrying a literal version string in its prose, **When**
   the project's verification runs, **Then** it refuses and names the file.
2. **Given** the site as delivered, **When** the same verification runs,
   **Then** it passes.
3. **Given** a tag that does not equal the manifest's version, **When** the
   publish job runs, **Then** it refuses (MV-68, already in force).

---

### Edge Cases

- **A version number that is genuinely part of the content** — a changelog
  heading, a dependency's version, a Node engine requirement, a historical
  reference in a concept page ("0.1.1 shipped X"). These are facts about a
  moment, not claims about the current release, and a rule that refused them
  would refuse honest writing. The rule must distinguish them.
- **The badge on the landing page** is a literal version string by design, and
  is already pinned to the manifest by a test (MV-77). It must not be caught
  twice, and must not be exempted in a way that also exempts prose.
- **The changelog is mounted into the site** (MV-78) but lives at the repo root.
  Any rule over "the site's pages" has to decide whether it reaches that file;
  its headings are literal version strings and must stay legal.
- **A release whose only content is documentation.** Nothing forces a version
  bump for docs alone; the question of whether to cut one is a judgement, not a
  gate, and this feature does not make it one.
- **The published registry is not readable offline.** No check here may depend
  on asking npm what exists — the project's verification takes no network.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The manifest MUST declare the version being released, and the
  changelog MUST carry a dated entry for exactly that version.
- **FR-002**: The changelog entry MUST name, by ID, every invariant the release
  made true, and MUST separate what changes behaviour for an existing user from
  what does not.
- **FR-003**: The entry MUST describe the anchor-scanner change in terms of what
  used to happen, what happens now, and which repositories are affected.
- **FR-004**: Every statement on the site and in the repository's root documents
  about the project's release state MUST be true of the released version. No
  page may describe the project as unreleased, private, or pre-release while it
  is published.
- **FR-005**: No page may state a version number as the project's current
  version except where a check keeps it equal to the manifest.
- **FR-006**: A version number that is a historical fact — a changelog heading,
  a past release, a dependency or runtime requirement — MUST remain legal.
- **FR-007**: The rule in FR-005 MUST be enforced by the project's own
  verification, and MUST name the file when it refuses.
- **FR-008**: The site's advertised version MUST equal the manifest's (MV-77,
  already in force) and MUST be updated as part of this release.
- **FR-009**: Publishing MUST remain tag-driven and MUST keep refusing a tag
  that does not equal the manifest's version (MV-68, already in force). This
  feature changes nothing about how publishing works.
- **FR-010**: Any other statement in the documentation found to contradict the
  code MUST be corrected or removed in this change, not deferred.

### Key Entities

- **Release**: a version in the manifest, a dated changelog entry, a tag equal
  to that version, and the published artifact the tag produces.
- **Release-state claim**: a sentence on a page asserting something about
  whether, and as what, the project is published.
- **Pinned version string**: a literal version in a page that a check holds
  equal to the manifest — as distinct from one nobody checks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The version the released binary prints, the version the manifest
  declares, the version the site advertises and the newest changelog entry are
  the same string. Checked, not compared by hand.
- **SC-002**: Zero pages describe the project as unreleased, private, or
  pre-release.
- **SC-003**: Inserting a hardcoded current-version claim into any page makes
  the project's verification exit non-zero and name that file; removing it makes
  it pass again. Both directions demonstrated.
- **SC-004**: The changelog entry for the released version names every invariant
  the release made true, and a reader of the upgrade note can state what will
  break in their repository and why.
- **SC-005**: Every documentation statement the audit confirms false is fixed in
  this change; none is carried forward. The count found and the count fixed are
  reported, and are equal.
- **SC-006**: The publish job runs from a tag and refuses a mismatched one —
  demonstrated by the tag equalling the manifest, not by weakening the check.

## Assumptions

- The version being released is 0.3.0: one behaviour changed in a way that can
  newly refuse an existing repository, and nothing was removed. At 0.x the minor
  position is where that belongs.
- The documentation audit that feeds FR-010 is a read of the repository as it
  stands; findings it cannot substantiate against a source line or a law row are
  not findings.
- "The site" means the pages under the site's content directory plus the
  changelog file it mounts, and the repository's root documents (README,
  DESIGN, CONTRIBUTING) which are read by the same people.
- Nothing here reaches the network: the released artifact is not fetched back to
  compare, because the project's verification is offline by law.
