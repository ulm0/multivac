---
slug: the-site-tells-the-whole-story
status: open
repos:
  self:
    status: branched
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-29
    - MV-30
    - MV-31
  retires: []
claims:
  - id: MV-29
    statement: The site names no flag the binary does not accept. `doors` takes no
      flags at all — `--no-symlink` was documentation-only and never parsed — so
      the string appears nowhere in the site or the source.
  - id: MV-30
    statement: "Hextra's layout shortcodes emit wrapper HTML, so the site sets
      `markup.goldmark.renderer.unsafe: true`; without it the hero and the
      feature grid are stripped to bare text and the landing renders unstyled."
  - id: MV-31
    statement: "The reference section documents the whole surface: one heading per
      shipped command, one per configuration key the loader reads, and one per
      harness entry in the registry — including the entries marked unsupported."
---

# The site tells the whole story

Two defects, one cause: nobody read the site against the built binary.

**The landing rendered wrong.** Hextra's `hextra/hero-headline`,
`hextra/hero-button` and `hextra/feature-card` shortcodes emit `div`s and
`a`s. Goldmark drops raw HTML unless `markup.goldmark.renderer.unsafe` is on,
so every wrapper was stripped and the page fell back to a wall of paragraphs.
One config key, and then a landing rebuilt on the structure Hextra's own docs
use: hero, feature grid, an honest status line.

**The docs described a tool that does not exist.** `doors --no-symlink` was
documented twice and parsed nowhere — `doors` ignores its argv entirely.
`verify --repo` shipped and was documented nowhere. There was no page for the
configuration keys, no page for the harness registry, no page for the
enforcement ladder, and no page saying why any of this exists.

So the site grows a reference section written against the binary — every
output block pasted from a real run, every flag read out of the parser that
consumes it — plus a philosophy page for the question the tool actually
answers: a paraphrase ages silently, a citation can be verified.
