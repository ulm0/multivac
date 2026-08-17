# Implementation Plan: The site has a voice

**Branch**: `the-site-has-a-voice` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-the-site-has-a-voice/spec.md`

## Summary

The site gets two typefaces, both stored in this repository and served from its
own origin, and the **width axis is what separates them**: human language is set
wide, machine output is set narrow. Nothing about the palette, the content or
the navigation changes.

- **Archivo** (variable, weight 100–900 × width 62–125%) carries human language:
  display, headings, prose, chrome. Headings widen as they climb the hierarchy.
- **Martian Mono** (variable, weight 100–800 × width 75–112.5%) carries machine
  output: code blocks, inline code, table headers, eyebrows and states. Set at
  its narrow end, because a readout has a slot to fit.

Both are SIL OFL 1.1, both ship as one variable WOFF2 each (Latin subset:
88 KB + 38 KB), both licences ship beside them. The rule that keeps this true —
no third-party font host anywhere in the site's sources — becomes law row MV-83,
anchored, so a later regression is refused by the same `verify` the pre-commit
hook already runs.

## Technical Context

**Language/Version**: CSS (custom properties + `@font-face`), Hugo templates
(Go html/template). No JavaScript is added.

**Primary Dependencies**: Hugo (extended) with Hextra v0.12.3 as a Hugo module.
No new dependency. The law pins **two** runtime dependencies for the CLI
(`yaml`, `picomatch`); this feature is site-only and adds none.

**Storage**: Two WOFF2 files and two licence files, tracked in git under
`site/static/fonts/`.

**Testing**: `node:test`, no frameworks, run by `pnpm test` — the project's only
test runner. Plus `mvac verify --strict` for MV-83 itself.

**Target Platform**: Current browsers with variable-font and WOFF2 support.
Rendering is judged on the dark ground only; there is no second theme.

**Project Type**: Static documentation site inside the tool's own repository.

**Performance Goals**: Two font files, 126 KB total, both preloaded. No layout
shift beyond a normal reading tolerance during load — the fallback chain is
metric-adjacent, not arbitrary. `verify` stays sub-second: the new legs read
text files only, and the binary font directory is excluded from the scan by the
leg itself.

**Constraints**: `--primary-hue: 76deg` and the dark-only, no-toggle decision
are fixed (MV-33, FR-007). The AA contrast fix already in `custom.css` must keep
holding (FR-008). No page text may change (FR-011). English everywhere.

**Scale/Scope**: One site, 20 content pages, one stylesheet, one new template
partial, four new tracked files.

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 — see below.*

| Principle | How this plan satisfies it |
| --- | --- |
| **I. A claim nobody checks decays** | The self-hosting rule is not left as a comment in a stylesheet. It becomes MV-83 with anchors: one `absent` leg over the site's sources for the font-host addresses, and `present` legs on the `@font-face` sources and on the tracked files. The change file and the plan cite MV-01 and MV-33 by ID, never by paraphrase. |
| **II. The tool never claims more than it checked** | The row states the ceiling rather than gesturing at it. An `absent` leg over text sources catches the addresses it names; it does **not** prove the built page makes no third-party request, because nothing on disk can prove that — the theme could grow a remote reference tomorrow, and the built `public/` tree is not tracked. That limit is written into the row, and the browser check that does answer it is a step in `quickstart.md` and in the ritual, not a claimed gate. Likewise: the two-voice assignment (FR-001, FR-002, FR-009) is a design property no regex decides, so **no leg claims it** — it is verified by eye against `quickstart.md`, and the row says so. |
| **III. The law changes before the code** | MV-83 is already reserved as `proposed` by `change new`. It is stated in the same change as the CSS, and `change close` re-runs verify scoped to it. The row stays `proposed` at close; only a human enacts it. |
| **IV. Deterministic, offline, small** | The build reaches no network at page load — that is the entire point of the feature. The *authoring* step that fetched the two WOFF2 files ran once, by hand, and its result is committed; no build step fetches anything. `verify` stays sub-second: the new legs are regexes over already-enumerated text files, and the font directory is excluded so no binary is scanned. No runtime dependency is added. |
| **V. An invented integration is a lie** | No adapter is touched. The licence claim (FR-005) is not asserted from the font's name — the OFL 1.1 text of each project is fetched from its own upstream repository and committed verbatim, and the copyright line of each is preserved as its author wrote it. |

**Verdict: no violations.** The Complexity Tracking table below stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/007-the-site-has-a-voice/
├── plan.md              # This file
├── research.md          # Phase 0: the two decisions, measured
├── data-model.md        # Phase 1: voices, surfaces, files
├── quickstart.md        # Phase 1: how to see it and how to break it
├── contracts/
│   └── css-tokens.md    # Phase 1: the token names the site exposes
├── checklists/
│   └── requirements.md  # from /speckit-specify
└── tasks.md             # /speckit-tasks — not created here
```

### Source Code (repository root)

```text
site/
├── static/
│   └── fonts/                        # NEW — served from the site's own origin
│       ├── archivo-latin.woff2       #   variable: wght 100..900, wdth 62..125
│       ├── martian-mono-latin.woff2  #   variable: wght 100..800, wdth 75..112.5
│       ├── OFL-Archivo.txt           #   SIL OFL 1.1, upstream verbatim
│       └── OFL-MartianMono.txt       #   SIL OFL 1.1, upstream verbatim
├── assets/
│   └── css/
│       └── custom.css                # EXTENDED — @font-face, tokens, surfaces
└── layouts/
    └── _partials/
        └── custom/
            └── head-end.html         # NEW — preload both faces

.multivac/
└── invariants.md                     # EXTENDED — MV-83 row + its legs

test/
└── invariants/
    └── site-fonts.test.ts            # NEW — what an anchor cannot say
```

**Structure Decision**: the site is a Hugo site inside the tool's repository,
built from `site/` with Hextra imported as a Hugo module. This feature adds one
static directory, extends the one existing stylesheet, and adds the theme's own
documented head hook as the repository's **first** `layouts/` override. The
theme is not forked and no theme file is copied.

**Why `static/fonts/` and not `assets/fonts/`.** Hextra concatenates
`assets/css/custom.css` into `css/compiled/main.css` in production, but serves it
at its own path in development (`site/layouts/_partials/head.html` in the module,
lines 31–45). A relative `url()` inside `custom.css` therefore resolves against
two different directories in the two modes, and the fonts would 404 in one of
them. `static/` gives one absolute path, `/fonts/…`, that is correct in both.
The cost is no fingerprinting on the font files, which is acceptable: font files
are immutable in practice and change only when this change's successor changes
them.

## Complexity Tracking

> No Constitution Check violation. Table intentionally empty.
