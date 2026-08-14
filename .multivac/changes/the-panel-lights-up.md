---
slug: the-panel-lights-up
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-33
  retires: []
claims:
  - id: MV-33
    statement: "The identity is the console panel: the mark ships in the site's static assets and is wired as the favicon and the navbar logo, and the terminal banner is reachable from `init` alone — no other command imports it, it is suppressed by --quiet and off a TTY, NO_COLOR drops the colour and keeps the banner, and the lamp pattern is a fixed drawing, never a live reading."
---

# The panel lights up

The mark is a console panel. Lit lamps are verified claims, unlit ones are
unanchored, the amber one is the claim in flight — the whole product in one
drawing, and the only picture multivac needs.

Three assets ship under `site/static/`: `mark.svg` (six lamps, `currentColor`),
`favicon.svg` (four lamps, thicker stroke, its own `prefers-color-scheme` block
because a favicon inherits nothing) and `lockup.svg` (mark, wordmark, tagline).
Hextra picks the favicon up by name and takes the navbar logo from
`params.navbar.logo`. The navbar renders two `<img>` tags, one per theme, and an
`<img>` is an isolated document where `currentColor` falls back to black — so
the dark slot gets `mark-dark.svg`, the same drawing with its `color` pinned to
the light ink.

`init` prints the panel as a terminal banner. Only `init`: `verify`, `doctor`,
`doors` and `change` run inside hooks and in CI, where a banner is noise and
verify has a sub-second budget. `--quiet` silences it along with the rest of
init's report, a pipe silences it, and `NO_COLOR` keeps it while dropping the
colour, falling back to `# . *`.

The lamp pattern is fixed. `init` runs before there is anything to verify, so a
banner that pretended to measure the brain would be exactly the kind of lie this
tool exists to prevent. It is the logo, not a report.
