# Feature Specification: The site shows what is published

**Feature Branch**: `the-site-shows-what-is-published`

**Created**: 2026-08-17

**Status**: Draft

**Input**: "Today whatever merges to main deploys to the site. Sometimes the site says 0.4.0 when the last published package is 0.3.0. I will not deploy only on a tag — sometimes there are site-only corrections — but the version shown must reflect the real published one."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The reader who trusts the number (Priority: P1)

Somebody lands on the site, reads the version it advertises, and runs the
install command. They get a different version — or, if a release was abandoned
after the bump merged, a version that does not exist and never will.

After this change the number on the site is the last version actually
published, and it cannot be anything else, because nothing in the repository
states it.

**Why this priority**: the number is the first factual claim the site makes and
the easiest to check. A reader who catches it wrong has been taught that the
documentation is not checked — on the site of a tool that sells checking.

**Independent Test**: compare the version the site shows against the version the
registry serves, at any moment in the release sequence.

**Acceptance Scenarios**:

1. **Given** a version bump merged to the default branch but not yet released,
   **When** the site is viewed, **Then** it shows the previously published
   version, not the bumped one.
2. **Given** a release that is tagged but whose publish failed, **When** the
   site is viewed, **Then** it does not show the failed version.
3. **Given** a completed release, **When** the site is viewed, **Then** it shows
   that version.

---

### User Story 2 - The maintainer fixing only the site (Priority: P1)

Somebody corrects a documentation page. It reaches readers on merge, without a
release being cut for it, and without the version on the page moving.

**Why this priority**: equal to US1 and in tension with it — the obvious fix for
US1 is to deploy only from tags, and that would hold documentation corrections
hostage to a release nobody needs. Both must hold at once.

**Independent Test**: merge a documentation-only change; it is live, and the
advertised version is unchanged.

**Acceptance Scenarios**:

1. **Given** a documentation-only merge, **When** the deployment runs, **Then**
   the change is live and the version shown does not move.
2. **Given** a release, **When** it completes, **Then** the version shown moves
   without waiting for an unrelated merge.

---

### Edge Cases

- **No release has ever been made.** No tag exists, so there is nothing to
  render. It must degrade to something honest rather than an empty gap or a
  crash.
- **A local or preview build** has no release context. It must build and say so.
- **The deployment platform's clone may not carry tags.** A shallow clone is the
  default in most CI; a version derived from tags must ensure they are there
  rather than silently rendering the fallback.
- **A tagged release whose publish fails.** The site must not advertise it.
- **The prose could reintroduce a version.** A page that hardcodes one would be
  back where this started, and nothing about deriving the badge prevents it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The version the site advertises MUST be the last version actually
  published, at every point in the release sequence.
- **FR-002**: The repository MUST NOT state that version anywhere in the site's
  content. What is not written cannot drift.
- **FR-003**: Documentation-only changes MUST reach readers without a release,
  and MUST NOT move the advertised version.
- **FR-004**: A release MUST move the advertised version without waiting for a
  later unrelated change.
- **FR-005**: The site MUST NOT be published ahead of the artifact it describes:
  where a release both publishes and deploys, the deployment follows the publish
  and does not run if it fails.
- **FR-006**: The derivation MUST be offline and deterministic — no request to a
  registry, and the same inputs give the same page.
- **FR-007**: With no release to name, the site MUST render something that
  states that plainly rather than a number.
- **FR-008**: The rule MUST be law, and the absence of version literals in the
  site's content MUST be enforced by the verification the project already runs.

### Key Entities

- **Published version**: the last release that reached the registry.
- **Advertised version**: what the site shows a reader.
- **Declared version**: what the manifest says at HEAD — which may be ahead of
  published, and is precisely what must stop being advertised.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Searching the site's content for a version literal returns
  nothing, and this is checked on every commit rather than by inspection.
- **SC-002**: A build with a release context renders that version; a build
  without one renders the honest fallback. Both demonstrated.
- **SC-003**: In the window between a version bump merging and its release
  completing, the site shows the previous version. Demonstrated by building at
  that state.
- **SC-004**: The deployment of a release cannot precede its publication —
  demonstrated by the ordering, not asserted.
- **SC-005**: A documentation-only merge deploys, and the advertised version is
  byte-identical before and after.
- **SC-006**: No request leaves the machine to determine the version.

## Assumptions

- A release is identified by a tag, and the project already refuses to publish
  under a tag that disagrees with the manifest — so the tag is the published
  version by construction, without asking the registry.
- The window between a tag's publication succeeding and the site deploying is
  within the same pipeline and is not addressed further; the failure this
  change removes is measured in hours or forever, not in seconds.
- Install instructions already tell readers `@latest`, which needs no version
  and stays correct without maintenance. Only the badge states a number.
