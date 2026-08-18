# Research: A pasted link renders as itself

## D1 — No image is the whole failure

**Decision**: declare a site-wide card image.

**Rationale**: measured on the deployed site — `og:image` appears zero times on
any page. A scraper that finds no image does not fall back to a favicon or a
logo in the page; it renders a bare link, which is exactly what was seen. The
empty description made the card worse, but the missing image is why there was no
card at all.

The theme reads a site parameter for this and emits nothing without it. Nothing
was broken; nothing had been declared.

## D2 — The card format follows from the image

**Decision**: do not set the card format by hand.

**Rationale**: the theme ships no card partial, so Hugo's own runs, and it picks
the large format when an image exists. Setting it by hand would be a second
place stating the same thing, and the day they disagree the hand-written one
wins for the wrong reason.

## D3 — Committed, not generated

**Decision**: the image is a tracked file.

**Rationale**: generating it at build time needs a rasteriser, which this
project does not have and should not acquire to draw a logo — the third
dependency arriving through a side door. A 25 kB PNG in the repository is
smaller than the problem it would create.

## D4 — Wordless on purpose

**Decision**: the card carries the mark and no text.

**Rationale**: the lockup renders its wordmark through a system font stack, so
rasterising it would bake in whichever fonts the drawing machine happened to
have — the same "differs by machine" this project refuses everywhere else. The
site's own faces ship as woff2, which no rasteriser here reads without a
converter and a compression library, and installing both to draw a logo is D3
again.

The title and description travel beside the image as text, where a reader can
read them and an author can correct them.

## D5 — Descriptions are authored, never derived

**Decision**: a description per page, with the site's own as the fallback.

**Rationale**: the theme derives a missing description from the page's summary,
which on the home page produced whitespace, and on a documentation page produces
whatever prose happens to come first — a sentence written to open a section, not
to describe a page. A description that nobody wrote is a description nobody
checked.

## D6 — The crawler file names the sitemap

**Decision**: enable it.

**Rationale**: the sitemap already exists and returns 200; the crawler file
returns 404, so nothing points at it. One switch.
