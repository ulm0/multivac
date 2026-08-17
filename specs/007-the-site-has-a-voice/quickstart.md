# Quickstart: seeing it, and breaking it on purpose

Every check below is runnable. The ones a machine can decide are marked
**gated**; the ones only a person can decide are marked **by eye**, and those
are the reason MV-83 states a ceiling instead of claiming more (research D5).

## Prerequisites

```sh
pnpm install          # once
hugo version          # extended build required by Hextra
```

## Build and serve

```sh
cd site
hugo server -D
# http://localhost:1313
```

The dev server serves `custom.css` at its own path; production concatenates it
into `css/compiled/main.css`. The font paths are absolute for exactly this
reason, so both modes must be checked at least once:

```sh
cd site
hugo --environment production -d ../.tmp-public
grep -o "url('/fonts/[^']*')" ../.tmp-public/css/compiled/*.css   # both faces
rm -rf ../.tmp-public
```

Expect two lines. Zero means the stylesheet did not make it into the bundle.

---

## SC-001 — two voices, colour removed *(by eye)*

Open `/docs/concepts/claims-and-anchors/`, then in devtools apply
`filter: grayscale(1)` to `<html>`.

**Pass**: prose and quoted machine material are still tellable apart — the
machine material is narrower and monospaced, the prose wider. **Fail**: the only
remaining difference is a background tint.

Do the same on `/docs/reference/commands/`, which is the densest table on the
site: header row machine, body cells human.

## SC-002 — nothing leaves the origin *(by eye, then gated in part)*

In devtools, Network tab, filter `Font`. Reload.

**Pass**: every request's host is the site's own. **Fail**: any other host.

Then block third-party requests entirely — devtools request blocking on `*://*`
except the origin, or an offline build served from `file://`-adjacent static
hosting — and reload.

**Pass**: the page renders in Archivo and Martian Mono, unchanged.

## SC-003 — the rule is checked, not remembered *(gated)*

```sh
node dist/cli.js verify --strict     # or: mvac verify --strict
```

Now break it on purpose. Add a `<link>` to a font host in
`site/layouts/_partials/custom/head-end.html`:

```sh
printf '\n<!-- %s -->\n' "https://fonts.googleapis.com/css2?family=Inter" \
  >> site/layouts/_partials/custom/head-end.html
node dist/cli.js verify --strict ; echo "exit $?"
git checkout site/layouts/_partials/custom/head-end.html
```

**Pass**: exit 1, MV-83 reported broken, the file named. **Fail**: exit 0 — the
leg's glob does not reach that file, which is the defect this check exists to
find.

Repeat the same insertion in `CHANGELOG.md`, which is mounted into the site by
`site/hugo.yaml` (MV-78) and lives outside `site/`. It must also refuse.

## SC-004 — the grammar line fits, the transcripts scroll *(by eye)*

At a **1280px** viewport with sidebar and TOC both showing, open
`/docs/concepts/claims-and-anchors/` and find:

```
<!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> …] /<regex>/[flags] [mode] -->
```

86 characters (88 bytes — the ellipsis is three). **Pass**: it fits its block
without a horizontal scrollbar, `-->` included.

Then open `/docs/reference/integrations/` and find the `doors` transcript — 310
characters, the longest on the site. **Pass**: it scrolls *inside its own block*
and `document.body.scrollWidth === document.documentElement.clientWidth`.
**Fail**: the page itself scrolls sideways.

```js
// paste in the console on any page
document.body.scrollWidth - document.documentElement.clientWidth  // expect 0
```

## SC-005 — licences ship *(gated)*

```sh
pnpm test -- --test-name-pattern="site fonts"
```

Covers both cross-file facts an anchor cannot state: every `@font-face` source
resolves to a tracked path, and every font file has a licence file beside it.

## SC-006 — the fallback does not reflow *(by eye)*

Devtools → Network → throttle to *Slow 3G*, reload, watch the first paint.

**Pass**: text is readable in the fallback face and the line breaks do not jump
noticeably when the WOFF2 lands. **Fail**: a visible reflow of paragraphs.

## SC-007 — the content is untouched *(gated)*

```sh
git diff --stat main -- site/content ../CHANGELOG.md
```

**Pass**: empty. This feature restyles; it does not edit a page.

---

## What none of the above proves

The built page issuing no third-party request **at large** — for any host, not
just the ones MV-83 names. The `public/` tree is not tracked and the theme is a
Hugo module resolved at build time, so no check over this repository can see it.
The devtools pass under SC-002 is the answer, it is a human step, and it belongs
to the closing ritual (`.multivac/ritual.md`) rather than to any gate.
