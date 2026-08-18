# Implementation Plan: A pasted link renders as itself

**Branch**: `the-site-can-be-shared` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

Four declarations and one committed image. No template is written, because the
machinery already exists and was never given anything to render:

- the theme emits the card image from a site parameter, and emits none when
  that parameter is absent;
- Hugo's own card partial chooses the large format when an image exists and the
  small one otherwise, so the format follows from the same declaration;
- the description falls back to the site's own for the home page and to each
  page's front matter elsewhere;
- the crawler file is a one-line switch.

The image is drawn once and committed. It is the mark on the site's ground,
wordless.

## Technical Context

**Language/Version**: Hugo 0.165 extended, Hextra theme as a module.
**Primary Dependencies**: none added. Notably no rasteriser.
**Storage**: one PNG in the site's static tree.
**Testing**: `node:test` over the built output.
**Target Platform**: the published site.
**Performance Goals**: unchanged; one 25 kB image.
**Constraints**: no build-time image generation, and no font baked into the card.
**Scale/Scope**: every page.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-100 anchors the declarations and the committed image. The test reads the SOURCES, not the built output: the test job runs a node image with no site builder in it, and a test that quietly checked something weaker depending on its environment would be worse than one that says what it checks. |
| II | PASS | The row states what it cannot check: whether a given network renders the card is that scraper's decision. |
| III | PASS | MV-100 reserved and proposed; MV-77 amended for what the site now carries. |
| IV | PASS | No dependency, and the build gains no step. |
| V | PASS | No adapter involved. |

**Post-design re-check**: unchanged.

## Project Structure

```text
site/hugo.yaml          # description, images, enableRobotsTXT
site/content/_index.md  # the home page's own description
site/static/og.png      # committed, 1200x630
test/site/cards.test.ts # NEW — reads the declarations; the build is checked by the quickstart
```

**Structure Decision**: configuration rather than a custom head partial. A
partial would emit a second copy of tags the theme already emits, and two
sources for one tag is how they come to disagree — the same rule the doors
follow.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the head, after.
- [quickstart.md](./quickstart.md) — build, read the head, paste the link.
