# Feature Specification: A pasted link renders as itself

**Feature Branch**: `the-site-can-be-shared`

**Created**: 2026-08-18

**Status**: Draft

**Input**: Pasting the site's URL into a social network produced a bare link — no image, no summary, nothing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A pasted link becomes a card (Priority: P1)

Somebody pastes the site's address into a place that unfurls links. They get a
bare URL, because the page offers no image and an empty description — and a
scraper that finds no image does not fall back to a favicon.

**Why this priority**: it is the difference between a link people click and a
link people scroll past, and it costs one declaration.

**Independent Test**: build the site and confirm every page carries an image and
a non-empty description in its head.

**Acceptance Scenarios**:

1. **Given** any page of the built site, **When** its head is read, **Then** it
   carries a card image at an absolute address.
2. **Given** any page, **When** its head is read, **Then** its description is
   non-empty.
3. **Given** a page that declares its own description, **When** its head is
   read, **Then** that description is used rather than a fallback.
4. **Given** any page, **When** its head is read, **Then** the card is declared
   in the large format, because there is an image to show.

---

### One card image, committed rather than generated (Priority: P1)

The image is drawn once and committed.

**Why this priority**: generating it at build time would make a rasteriser a
build dependency, and this project counts its dependencies out loud.

**Independent Test**: confirm the image is a tracked raster of the right
dimensions, and that nothing in the build produces it.

**Acceptance Scenarios**:

1. **Given** the repository, **When** the image is inspected, **Then** it is a
   tracked raster of the dimensions link scrapers expect.
2. **Given** the build, **When** it runs, **Then** it neither draws nor converts
   the image.
3. **Given** the image, **When** it is inspected, **Then** it carries no text
   rendered from a font, so no machine's font choices are baked into it.

---

### Search engines can enumerate the site (Priority: P2)

The site has a sitemap and nothing points at it.

**Why this priority**: cheap, and the sitemap already exists.

**Acceptance Scenarios**:

1. **Given** the built site, **When** the crawler file is requested, **Then** it
   exists and names the sitemap.

---

### Edge Cases

- A page with no description of its own: the site's own description is used, so
  no page is ever card-less.
- The image is missing at build time: the build fails loudly rather than
  emitting a card pointing at nothing.
- A page declaring its own image: that one is used.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every page MUST carry a card image at an absolute address.
- **FR-002**: Every page MUST carry a non-empty description.
- **FR-003**: A page's own description MUST take precedence over any fallback.
- **FR-004**: The card MUST be declared in the large format.
- **FR-005**: The image MUST be tracked in the repository, not produced by the
  build.
- **FR-006**: The image MUST carry no text rendered from a font.
- **FR-007**: The image MUST be the dimensions link scrapers expect.
- **FR-008**: A crawler file MUST exist and name the sitemap.
- **FR-009**: The law row MUST land in the same change with anchors that
  resolve, and MUST state what it does not check.

### Key Entities

- **The card image**: one committed raster, the mark on the site's ground.
- **The description**: authored per page, with the site's own as the fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No page of the built site lacks an image or a description.
- **SC-002**: The card is the large format everywhere.
- **SC-003**: The build produces the site without drawing or converting any
  image.
- **SC-004**: The crawler file names the sitemap.

## Assumptions

- The card is wordless on purpose. The lockup renders its wordmark with a system
  font stack, so rasterising it would bake in whichever fonts the drawing
  machine had — the same "differs by machine" this project refuses elsewhere.
  The title and description travel as text beside the image, where they can be
  read and corrected.
- Committed rather than generated: a rasteriser is not a build dependency this
  project has, and acquiring one to draw a logo would be a dependency arriving
  through a side door.
- What this cannot check is whether any particular network renders the card.
  That is their scraper's decision, and the row says so.
- The check reads the declarations rather than a built site, because the test
  environment has no site builder. The built head is walked in the quickstart
  and is visible on the deployed page; what the check owns is that everything a
  card needs is declared.
