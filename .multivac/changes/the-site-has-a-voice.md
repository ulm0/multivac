---
slug: the-site-has-a-voice
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-83
  retires: []
claims:
  - id: MV-83
    statement: The site serves its own type. No typeface is fetched from a third party at page load.
---

# The site sets its own type: one human face, one machine face

The site is stock Hextra with a hue override — 43 lines of CSS, no layouts, no
type declarations. Every word on it, argument and machine output alike, is set
in whatever the theme's stack resolves to on the reader's machine. The product's
own texture is machine output: anchor grammar, `verify` lines, a law table, CLI
transcripts. The site quotes that material constantly and gives it no voice of
its own.

Two families, self-hosted, and the width axis is what separates them:

- **Archivo** (variable, weight + width) carries human language — display,
  headings, prose, chrome. Headings widen as they climb, the way a panel's
  master label is the widest stamp on it.
- **Martian Mono** (variable, weight + width) carries machine output — code,
  inline code, states, table headers, eyebrows. Narrow, because a readout has
  a slot to fit.

Human is wide, machine is tight. One axis carries the whole distinction.

## Why the fonts are ours

`verify` takes no network (MV-01). A documentation site that fetches its type
from a CDN contradicts the product on its own front page, and it hands every
reader's address to a third party who was never named. The files are tracked in
this repo and served from it — which is also the only reason the type survives
an offline read or a locked-down network.

MV-83 pins that: the `@font-face` sources are repo-local, and no third-party
font host appears anywhere under `site/`.
