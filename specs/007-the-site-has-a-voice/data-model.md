# Data model: The site has a voice

Phase 1. There is no runtime data here — the entities are CSS tokens, files on
disk, and the mapping between them.

## Voice

Two, and only two. Each is one variable face plus a fallback chain, exposed as a
custom property so no surface rule names a family directly.

| Voice | Token | Face | Axes used | Fallback chain |
| --- | --- | --- | --- | --- |
| human | `--font-human` | Archivo | `wght` 100–900, `wdth` 62–125 | `ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif` |
| machine | `--font-machine` | Martian Mono | `wght` 100–800, `wdth` 75–112.5 | `ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace` |

The fallback chains are system faces so nothing is fetched when a WOFF2 fails.
Both are chosen for metric adjacency to their primary, not alphabetically: the
substitution when a font fails to load must not reflow the page (FR-006).

## Width scale

The axis that carries the human/machine distinction (research D1). One scale,
applied through tokens so a surface rule never writes a bare percentage.

| Token | Value | Applied to |
| --- | --- | --- |
| `--wdth-display` | `112%` | `h1`, hero headline |
| `--wdth-heading` | `105%` | `h2` |
| `--wdth-body` | `100%` | body prose, `h3`–`h6`, chrome |
| `--wdth-machine` | `85%` | code blocks, inline code, machine labels |

Rule: **human widens as it climbs, machine sits narrow.** Nothing else uses the
width axis, so the reader learns one thing.

## Surface → voice

Every text surface named in FR-002, assigned once. A surface not listed here
inherits from `body`, which is `--font-human`.

| Surface | Voice | Notes |
| --- | --- | --- |
| hero headline, `h1` | human | `--wdth-display`, heaviest weight |
| `h2` | human | `--wdth-heading` |
| `h3`–`h6` | human | `--wdth-body` |
| body prose, lists, blockquotes | human | `--wdth-body` |
| navbar, sidebar, TOC, breadcrumbs, footer | human | `--wdth-body` |
| search field and results | human | matches the chrome it sits in |
| code blocks (`pre > code`) | machine | `--wdth-machine`, `overflow-x: auto` |
| inline code (`:not(pre) > code`) | machine | `--wdth-machine`, size step down |
| `kbd`, `samp` | machine | same treatment as inline code |
| table headers | machine | this is where the law table's columns live |
| table body cells | human | the statements in them are prose |
| hero badge (the version) | machine | it is a value read off the package |

Table headers are the one place the split is asserted rather than obvious: a
`| ID | statement | authority | state | date | source |` header is the shape of
the record, and the cells under it are sentences. Header machine, cells human.

## Tracked file

| Path | Kind | Licence |
| --- | --- | --- |
| `site/static/fonts/archivo-latin.woff2` | variable WOFF2, Latin subset, 88 KB | `OFL-Archivo.txt` |
| `site/static/fonts/martian-mono-latin.woff2` | variable WOFF2, Latin subset, 38 KB | `OFL-MartianMono.txt` |
| `site/static/fonts/OFL-Archivo.txt` | SIL OFL 1.1, upstream verbatim | — |
| `site/static/fonts/OFL-MartianMono.txt` | SIL OFL 1.1, upstream verbatim | — |

Invariant across this table, pinned by `test/invariants/site-fonts.test.ts`
rather than by an anchor (research D5): **every font file has a licence file
beside it, and every `@font-face` source resolves to a tracked path.**

Latin subset only. The pages are English; other ranges resolve through the
fallback chain (spec Assumptions).
