# Research: The site has a voice

Phase 0. Five decisions, each with what was rejected and why.

---

## D1 — Two faces, and the width axis is the distinction

**Decision.** **Archivo** for human language, **Martian Mono** for machine
output. Both variable, both carrying a **width** axis as well as weight. The
design uses that axis as the carrier of the whole distinction: human language
widens as it gains importance (body at 100%, `h3` 100%, `h2` 105%, `h1` 112%),
machine output sits at the narrow end (85–90%) wherever it appears.

**Rationale.** The subject is an instrument panel — the project's own mark is
described in `site/hugo.yaml` as "the console panel — lit lamps verified, unlit
unanchored, acid in flight." Panel lettering is stamped: the master label is the
widest thing on the plate, and every readout is condensed to fit its slot. That
is not a metaphor bolted on afterwards; it is the same logic as the content,
where a law row is the widest statement and a `verify` line is a slot with a
value in it. Using one axis to carry the human/machine split means the reader
learns the rule once and it holds on every page, including in a table cell where
there is no room for any other signal.

Archivo is a text grotesque designed for both print and screen, with an
82-instance width range; it reads at length on the concepts pages and stamps at
display sizes without a second family. Martian Mono is a display-leaning
monospace with exaggerated, highly differentiated glyph shapes — which is right
here, because the machine material this site quotes is not general source code
but *grammar*: `/regex/`, `!<repo>:<glob>`, `count=2`, `-->`. Telling those
characters apart is the whole job.

**Alternatives rejected.**

- **A third family for body prose** (Public Sans was the candidate). Rejected on
  the ladder: Archivo's width axis already gives display and body two distinct
  registers, so a third file buys a distinction the reader already has and costs
  another 25 KB and another licence to track.
- **One family only** (a mono for everything, or a sans for everything). Rejected
  because FR-001 and FR-009 require the machine/human split to survive
  greyscale. One family cannot do it without leaning on colour or background.
- **Inter / Space Grotesk / JetBrains Mono.** Each is a reasonable face and each
  is the default answer — they appear on documentation sites regardless of what
  the site is about. This one is about an instrument that reports states, and
  the pair above was chosen from that, not from a shortlist of popular faces.
- **A serif for prose on a dark ground.** Rejected: the ground is fixed dark
  (MV-33), and a text serif at 16px on near-black loses its thin strokes. The
  contrast fix already in `custom.css` exists because this site's accent is
  bright; adding a low-contrast face works against the same problem.

---

## D2 — Martian Mono carries code blocks too, not only labels

**Decision.** One machine face for both roles: labels/states at width 100%, and
code blocks and inline code at width **85%** with a size step down
(`0.875em` inline, `0.8125rem` in blocks). If the measurement in D3 fails, the
fallback is a second mono for blocks — but it was not needed.

**Rationale.** The earlier direction named Martian Mono for "labels, states,
legends," leaving code blocks open. Splitting them would mean two monospaced
faces on one page, which reads as an accident rather than a decision, and the
material in the blocks is the same material as in the labels: `mvac verify`,
`--strict`, `ok`, `broken`. It is one voice; it should be one face.

Martian Mono's default advance is wide by design. Condensing it to 85% is not a
workaround — it is the axis being used for what it is for, and it is the same
gesture as the readout-fits-its-slot rule in D1.

**Alternative rejected.** A separate code mono (JetBrains Mono, Commit Mono).
Rejected on measurement, not taste: see D3. It stays the documented fallback if
a future page introduces genuinely long source listings, which today's content
does not have.

---

## D3 — The longest line the site actually quotes

**Measured, not assumed**, and the first estimate was wrong. Across the site's
767 code-block lines: p50 **55**, p90 **126**, p95 **161**, p99 **242**, max
**310**. The 310-character line is a `doors` transcript in
`reference/integrations.md`; the 300s are `doctor` output in `reference/hooks.md`.

So "the longest line fits" is not achievable at any font size, and stating it
would have been a criterion nothing could pass. What matters is narrower and
real: the **anchor grammar** line on `concepts/claims-and-anchors.md`,

```
<!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> …] /<regex>/[flags] [mode] -->
```

**86 characters** — 88 bytes, which is what a byte-counting first pass reported;
the ellipsis is one character in three bytes. The one line a reader must take in
whole to learn the grammar, rather than skim as sample output.

**Decision.** `86ch` at the chosen block size must fit Hextra's `page.width:
normal` content column at a 1280px viewport with the sidebar and table of
contents both showing. That is roughly the p75 of the distribution, so about a
quarter of code lines will scroll — which is the correct outcome for transcript
output and was already true before this change. This is SC-004 and it is checked
in the browser during implementation, before the change closes — not asserted
here.

**Consequence if it fails.** Two levers before reaching for a second face:
width to 80%, then block size to 0.78125rem. Only if both fail does D2's
fallback apply. Code blocks keep `overflow-x: auto` regardless — which is what
carries the other quarter of the lines, and what keeps a 310-character
transcript from widening the page body. That is structural, not a hope that
lines stay short.

---

## D4 — `static/fonts/`, absolute paths, no fingerprint

**Decision.** The WOFF2 files live in `site/static/fonts/` and are referenced as
`/fonts/…` — absolute, from the site root.

**Rationale.** Hextra's `layouts/_partials/head.html` concatenates
`assets/css/custom.css` into `css/compiled/main.css` under
`hugo.IsProduction`, and serves it separately otherwise. A relative `url()` in
`custom.css` resolves against a different directory in each mode, so the fonts
would load in one and 404 in the other — and the mode that breaks is production,
which is the one nobody tests locally. An absolute path is correct in both.

`baseURL` is `https://multivac.ulm0.com/` with no path prefix, so `/fonts/…` is
unambiguous.

**Alternatives rejected.**

- **`assets/fonts/` with Hugo Pipes `resources.Get` and a fingerprint**, emitting
  the `@font-face` block from a template so the hashed path is interpolated.
  Rejected: it moves font declarations out of the stylesheet into a partial for
  a cache-busting benefit that font files — which change roughly never — do not
  need. It also makes the `@font-face` sources harder to anchor, since the URL
  would no longer be a literal in any tracked file.
- **Base64 `data:` URIs inside the CSS.** Rejected: inflates the stylesheet by a
  third over the binary size, blocks first paint on the whole blob, and defeats
  `font-display: swap`.

---

## D5 — What MV-83 can and cannot check

**Decision.** MV-83 gets three legs and states its own ceiling:

1. `absent` over the site's text sources for the known font-host addresses.
   Glob: `brain:{site/**,CHANGELOG.md} !site/static/fonts/**`.
2. `present` on the `@font-face` `src` in `custom.css` resolving to a repo-local
   path.
3. `present` on the preload in the head partial pointing at the same path.

**Why `CHANGELOG.md` is in the glob.** It is not under `site/`, but
`site/hugo.yaml` mounts it as `content/docs/changelog.md` (MV-78). It is a page
of this site, so it is one of the site's sources, and a leg that stopped at the
directory boundary would leave the one mounted-in file unguarded.

**Why the font directory is excluded.** The scanner reads every tracked file the
glob matches, as text. Two WOFF2 binaries would be decoded as UTF-8 and scanned
for a regex on every `verify`, in the pre-commit hook, for a result that is
meaningless — a byte sequence inside a compressed font table is not a request the
browser will make. The exclusion is repo-relative and bites only here, since
`brain` is the only declared repo.

**The ceiling, stated in the row rather than implied.** These legs prove that the
*sources in this repository* name no third-party font host. They do **not** prove
the built page issues no third-party request: the built `public/` tree is not
tracked, the theme is a Hugo module resolved at build time and could grow a
remote reference in a version bump, and no regex over a repo can see either. The
browser check that does answer it — load a page with non-origin requests blocked,
read the network log — is a step in `quickstart.md` and belongs to the closing
ritual, which multivac prints and never checks.

**What gets no leg at all.** The two-voice assignment (FR-001, FR-002, FR-009) is
a design property. A regex can confirm that a token named `--font-machine` exists
and that `code` references it; it cannot confirm that the result reads as two
voices, and a leg that pretended to would be the exact failure Principle II
names. It is verified by eye against `quickstart.md`. The row says so instead of
claiming it.

**What a test pins instead.** `test/invariants/site-fonts.test.ts` covers the
two facts an anchor is the wrong shape for, both of them cross-file:

- every `@font-face` `src` in `custom.css` resolves to a file that is actually
  tracked at that path — an anchor can see the string, not the file behind it;
- every shipped font file has a licence file beside it — an anchor can assert one
  named pair, not "for each file, a matching one."

This is the same reason MV-72 and MV-77 are pinned by tests rather than by
anchors: no anchor compares two trees.
