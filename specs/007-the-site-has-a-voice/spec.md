# Feature Specification: The site has a voice

**Feature Branch**: `the-site-has-a-voice`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Give the documentation site its own typography, self-hosted, and make 'no third-party font host' a checkable rule."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader tells argument from output (Priority: P1)

Someone reading the concepts pages moves between two kinds of material in the
same paragraph: an argument written for them, and a literal string the tool
prints or parses — an anchor line, a `verify` state, a law row ID, a command.
Today both are set in whatever face the reader's machine happens to resolve,
so the transition is carried by a background tint and nothing else. After this
change the two kinds of material are set in two different faces, and the
reader can see which one they are looking at before they read a word of it.

**Why this priority**: it is the whole point. The site's subject is machine
output; a site that cannot show the difference between quoting the machine and
speaking to the reader is failing at its only job. Everything else here exists
to make this possible.

**Independent Test**: open any concepts page and confirm that prose, inline
code, code blocks and table cells are visibly distinct in face, not only in
colour or background.

**Acceptance Scenarios**:

1. **Given** a page whose prose contains inline code, **When** the reader looks
   at a sentence containing both, **Then** the two are set in different
   typefaces, and the distinction survives with colour removed.
2. **Given** the anchor grammar line on the claims-and-anchors page — 86
   characters, the one line a reader must take in whole to learn the grammar —
   **When** the page is viewed at the site's normal content width on a
   1280px-wide viewport, **Then** it fits its container without scrolling.
3. **Given** a machine line longer than that — the site quotes 767 lines inside
   code blocks and the longest is 310 characters — **When** the page is viewed
   at any width, **Then** the line scrolls inside its own container and the page
   body does not widen.
4. **Given** any page, **When** headings, body prose, code, tables and the site
   chrome are inspected, **Then** each has been assigned a voice by this
   feature rather than inheriting the theme's default stack.

---

### User Story 2 - A reader on a locked-down network gets the same page (Priority: P1)

Someone opens the site from a network that blocks third-party hosts, or with
an extension that blocks them, or offline from a local build. They get the same
typography as everyone else, because nothing was requested from anywhere but
the site's own origin.

**Why this priority**: equal to P1 above, and inseparable from it. A face that
arrives from a font host is a face that sometimes does not arrive; and the
product this site documents refuses to make network calls in the commands that
gate work (MV-01). A documentation site that phones a CDN for its type
contradicts the thing it is documenting on its own front page, and discloses
every reader's address to a party the reader never chose.

**Independent Test**: load any page with all non-origin requests blocked and
confirm the rendered type is unchanged; separately, inspect the network log and
confirm every font request has the site's own origin.

**Acceptance Scenarios**:

1. **Given** a built site, **When** a page is loaded with every request to a
   host other than the site's own origin blocked, **Then** the page renders in
   the intended faces.
2. **Given** the site's sources, **When** they are searched for the address of
   any third-party font host, **Then** none is found.
3. **Given** the shipped font files, **When** their licence is inspected,
   **Then** each is redistributable and its licence text is shipped beside it.

---

### User Story 3 - A maintainer cannot reintroduce the dependency by accident (Priority: P2)

Someone later adds a component, a partial or a stylesheet that pulls a face
from a font host — the ordinary way this regresses, since every snippet on the
web ships with that line in it. The tool refuses, names the row, and names the
file.

**Why this priority**: the rule is worth little if it holds only as long as
nobody forgets it. But it is P2 because the first violation is a regression of
something already delivered, not a gap in the delivery.

**Independent Test**: add a third-party font host address to a file under the
site directory, run the verification the project already runs on every commit,
and confirm it refuses and names the file.

**Acceptance Scenarios**:

1. **Given** a site source file containing a third-party font host address,
   **When** the project's verification runs, **Then** it reports a broken claim,
   names the row and names the file.
2. **Given** the site as delivered by this feature, **When** the same
   verification runs, **Then** the claim resolves.

---

### Edge Cases

- **A face fails to load or is not yet parsed.** Text MUST remain readable and
  laid out during and after the failure: every declared voice carries a fallback
  chain, and the fallback is chosen so that the substitution does not reflow the
  page beyond a normal reading tolerance.
- **A reader has asked for less motion or a specific text size.** Nothing in
  this feature may pin a size that prevents the browser's own text scaling, and
  nothing here introduces motion.
- **A glyph is missing from a chosen face** — a currency symbol, a dash, a
  character outside Latin. The fallback chain resolves it; the page does not
  render a missing-glyph box.
- **The reader's viewport is narrow.** Long machine lines — the anchor grammar,
  a law row — must scroll inside their own container rather than widening the
  page body.
- **Someone quotes a font host address as an example in prose**, rather than
  using one. The rule as written treats the address as a failure wherever it
  appears in the site's sources; the site's prose therefore must not contain
  one, and there is no exemption. If a future page needs to name one, that is a
  law change, not a workaround.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST declare two distinct typefaces: one carrying human
  language and one carrying machine output.
- **FR-002**: Every text surface MUST be assigned one of the two voices
  deliberately. The assignment MUST cover, at minimum: display and headings,
  body prose, code blocks, inline code, table headers and cells, and the site
  chrome (navigation, sidebar, breadcrumbs, footer, search field).
- **FR-003**: All font files the site uses MUST be served from the site's own
  origin, stored in this repository.
- **FR-004**: No address of a third-party font host may appear anywhere in the
  site's sources.
- **FR-005**: Every shipped font file MUST carry a licence permitting
  redistribution, and that licence's text MUST be shipped in the repository
  alongside the files.
- **FR-006**: Each declared voice MUST specify a fallback chain of faces that
  are present on common systems, so that a font that fails to load leaves the
  page readable.
- **FR-007**: The palette MUST be unchanged: the accent hue pinned by MV-33 and
  the single-ground, no-toggle decision both stand. This feature MUST NOT
  introduce a light theme or a theme toggle.
- **FR-008**: The contrast fix already in the site's stylesheet MUST keep
  holding — text on any surface filled with the accent stays at or above the
  WCAG AA ratio for its size.
- **FR-009**: The distinction between the two voices MUST NOT depend on colour
  alone: it MUST survive a greyscale rendering.
- **FR-010**: FR-003 and FR-004 MUST be stated as a law row (MV-83) and anchored
  to the sources that make them true, so that a later violation is refused by
  the same verification the project runs on every commit.
- **FR-011**: The content of the pages MUST NOT change. No page text, heading,
  navigation entry or menu order is edited by this feature.

### Key Entities

- **Voice**: a named role in the design — *human* or *machine* — with one
  primary face, a fallback chain, and a set of surfaces it is assigned to.
- **Font file**: a redistributable file stored in this repository and served
  from the site's own origin, with a licence file beside it.
- **Surface**: a class of text on the page (heading, prose, code block, inline
  code, table cell, chrome) that is assigned exactly one voice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can tell prose from quoted machine output by face alone,
  with colour and background removed — confirmed on a greyscale rendering of a
  concepts page.
- **SC-002**: Loading any page with every non-origin request blocked produces
  the same rendered type as loading it normally. Zero font requests leave the
  site's own origin.
- **SC-003**: Searching the site's sources for any third-party font host address
  returns nothing, and this is checked automatically on every commit rather than
  by inspection.
- **SC-004**: The anchor grammar line — 86 characters — fits its container at the
  site's normal content width on a 1280px viewport without scrolling. The site's
  767 code-block lines run to 310 characters at their longest; anything past the
  fitting width scrolls inside its own container and never widens the page body.
  Both halves are checked, because only the second is achievable for every line
  and only the first is what a reader learning the grammar needs.
- **SC-005**: Every shipped font file has a redistributable licence whose text
  is present in the repository.
- **SC-006**: Page text remains readable throughout font loading; a fallback
  substitution shifts layout by no more than a normal reading tolerance.
- **SC-007**: No page's text content differs from before the change.

## Assumptions

- The reader is on a current browser that supports the modern web font format
  and variable fonts; no legacy format is shipped as a second copy.
- Latin text only. The pages are written in English, so shipping only the Latin
  ranges of each face is sufficient; other ranges resolve through the fallback
  chain.
- "Third-party font host" means any host other than the site's own origin that
  serves typefaces — the well-known ones by name, and the pattern generally.
  The rule is stated so it catches the common ones by their addresses rather
  than attempting to enumerate every host that could ever serve a font.
- The dark ground is fixed. Type choices are judged on that ground only, since
  there is no second theme to judge them on.
- Search, navigation and the landing page's existing components keep working;
  this feature restyles them and does not replace them.
- The site's build already compiles a project stylesheet into the theme's
  output. This feature adds to that stylesheet and, where a face must be
  declared before first paint, to the theme's documented head hook — it does not
  fork the theme.
