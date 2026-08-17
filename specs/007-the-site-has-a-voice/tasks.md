---

description: "Task list for the-site-has-a-voice"
---

# Tasks: The site has a voice

**Input**: Design documents from `/specs/007-the-site-has-a-voice/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/css-tokens.md](./contracts/css-tokens.md),
[quickstart.md](./quickstart.md)

**Tests**: yes. The project's constitution requires tests to ship with
behaviour, and research D5 names the two cross-file facts an anchor is the wrong
shape for.

## Format: `[ID] [P?] [Story] Description`

- **[P]** — can run in parallel; different files, no dependency
- **[Story]** — US1 (two voices), US2 (nothing leaves the origin), US3 (the rule
  holds later)

## Path conventions

Single repository. The site is `site/`, the law is `.multivac/invariants.md`,
tests are `test/invariants/`.

---

## Phase 1: Setup

**Purpose**: put the files on disk before anything references them.

- [X] T001 Create `site/static/fonts/`.
- [X] T002 [P] Add `site/static/fonts/archivo-latin.woff2` — Archivo variable,
      Latin subset, `wght` 100–900 × `wdth` 62–125.
- [X] T003 [P] Add `site/static/fonts/martian-mono-latin.woff2` — Martian Mono
      variable, Latin subset, `wght` 100–800 × `wdth` 75–112.5.
- [X] T004 [P] Add `site/static/fonts/OFL-Archivo.txt` — SIL OFL 1.1, upstream
      verbatim, its copyright line preserved.
- [X] T005 [P] Add `site/static/fonts/OFL-MartianMono.txt` — same, from its own
      upstream.
- [X] T006 Confirm all four are tracked and that nothing in `.gitignore`
      excludes `*.woff2`. A font the build serves but git does not carry is the
      failure this whole feature is about.

**Checkpoint**: `git ls-files site/static/fonts` lists four paths.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: the tokens and the `@font-face` declarations. Nothing below can be
written until the names exist.

- [X] T007 In `site/assets/css/custom.css`, add both `@font-face` blocks exactly
      as specified in `contracts/css-tokens.md` — `url('/fonts/…')` absolute,
      `font-weight` and `font-stretch` ranges declared, `font-display: swap`.
      Do not touch the existing `--primary-*` block (MV-33) or the AA contrast
      rule (FR-008).
- [X] T008 Add the six tokens to `:root`: `--font-human`, `--font-machine`,
      `--wdth-display`, `--wdth-heading`, `--wdth-body`, `--wdth-machine`.
      Values per `contracts/css-tokens.md`.
- [X] T009 Create `site/layouts/_partials/custom/head-end.html` — the
      repository's first `layouts/` override — preloading both WOFF2 as
      `as="font" type="font/woff2" crossorigin`. Nothing else goes in this file.

**Checkpoint**: `hugo server` starts, both fonts appear in the Network tab
served from the origin, no page yet uses them.

---

## Phase 3: US1 — a reader tells argument from output (P1)

**Goal**: every surface in `data-model.md` assigned its voice.

**Independent test**: greyscale a concepts page; prose and machine material are
still distinguishable (SC-001).

- [X] T010 [US1] `body` → `--font-human` at `--wdth-body`. Set the type scale
      and line-height for long-form reading. No `px` font sizes on text
      surfaces.
- [X] T011 [US1] Headings: `h1` and the hero headline at `--wdth-display`, `h2`
      at `--wdth-heading`, `h3`–`h6` at `--wdth-body`. Weight steps chosen so the
      hierarchy reads without relying on size alone.
- [X] T012 [US1] Code blocks (`pre > code`) → `--font-machine` at
      `--wdth-machine`, `0.8125rem`, `overflow-x: auto` preserved.
- [X] T013 [US1] Inline code (`:not(pre) > code`), `kbd`, `samp` →
      `--font-machine` at `--wdth-machine`, `0.875em` so it sits on the prose
      baseline without towering over it.
- [X] T014 [US1] Tables: header cells → `--font-machine`; body cells →
      `--font-human`. This is the law table's shape and it is the one assignment
      a reader may find surprising, so it is deliberate (data-model).
- [X] T015 [US1] Chrome: navbar, sidebar, TOC, breadcrumbs, footer, search field
      and results → `--font-human` at `--wdth-body`.
- [X] T016 [US1] Hero badge (the version) → `--font-machine`. It is a value read
      off `package.json` (MV-77), not a phrase.
- [X] T017 [US1] Verify SC-004 in the browser at 1280px: the 86-character anchor
      grammar line fits; the 310-character `doors` transcript scrolls inside its
      block and `body.scrollWidth === documentElement.clientWidth`. If it fails,
      apply research D3's levers in order — width to 80%, then `0.78125rem` —
      and record which was needed.
- [X] T018 [US1] Verify SC-001 by eye on `concepts/claims-and-anchors` and
      `reference/commands` under `filter: grayscale(1)`.
- [X] T019 [US1] Verify SC-006: throttle to Slow 3G, confirm the fallback
      substitution does not visibly reflow paragraphs.

**Checkpoint**: US1 is deliverable on its own — the site has its voice even if
nothing below ships.

---

## Phase 4: US2 — nothing leaves the origin (P1)

**Goal**: prove the self-hosting, and license it properly.

**Independent test**: load with all non-origin requests blocked; type unchanged
(SC-002).

- [X] T020 [US2] Write `test/invariants/site-fonts.test.ts` (`node:test`, no
      framework): (a) every `@font-face` `src` in `custom.css` resolves to a path
      that `git ls-files` reports under `site/static/`; (b) every `*.woff2` under
      `site/static/fonts/` has a licence file beside it whose text contains
      `SIL OPEN FONT LICENSE Version 1.1`. Both are cross-file, which is why they
      are a test and not an anchor (research D5).
- [X] T021 [US2] Confirm both modes: `hugo server` and
      `hugo --environment production`. Grep the production bundle for both
      `url('/fonts/…')` literals, per `quickstart.md`.
- [X] T022 [US2] Verify SC-002 in devtools: Font filter shows only origin
      requests; then block non-origin and confirm the page still renders in both
      faces.

**Checkpoint**: `pnpm test` green, the production bundle carries both sources.

---

## Phase 5: US3 — the rule holds later (P2)

**Goal**: MV-83, stated and anchored, so the regression is refused rather than
noticed.

- [X] T023 [US3] Write the MV-83 row in `.multivac/invariants.md`, replacing the
      `RESERVED` placeholder. It must state the rule, the reason (MV-01: the
      product refuses network in its gating commands; a site that fetches its
      type from a CDN contradicts that on its own front page, and discloses the
      reader's address to a party they never chose), **and its ceiling** — that
      the legs read this repository's sources and cannot see what the built page
      requests, nor judge whether the result reads as two voices. State `MV-33`
      and `MV-78` by ID where they are relied on. Leave the row `proposed`.
- [X] T024 [US3] Add the `absent` leg over
      `brain:{site/**,CHANGELOG.md} !site/static/fonts/**` for the known
      third-party font-host addresses. `CHANGELOG.md` is included because
      `site/hugo.yaml` mounts it as a page (MV-78); the font directory is
      excluded because scanning two compressed binaries as text on every
      pre-commit buys nothing (research D5).
- [X] T025 [US3] Add the `present` legs: the `url('/fonts/…')` literal in
      `custom.css`, and the preload in `head-end.html`.
- [X] T026 [US3] Prove the leg bites, both places, per `quickstart.md`: insert a
      font-host address into `head-end.html`, run `verify --strict`, expect exit
      1 with MV-83 and the filename; revert. Repeat in `CHANGELOG.md`. **A leg
      that has not been seen to fail has not been tested.**

**Checkpoint**: `mvac verify --strict` green; deliberately broken, it refuses and
names the file.

---

## Phase 6: Polish and close

- [~] T027 **Withdrawn, not skipped.** MV-78's rule is that a *released* version
      with no entry is a failure, and nothing is released here: the CLI is
      unchanged, `package.json` stays at 0.2.0, and `CHANGELOG.md` says in its
      own header that it is written "for the people who install multivac". A
      stylesheet on the documentation site changes nothing they installed. The
      entry belongs to whichever release next ships, folded in there rather than
      parked as an `Unreleased` block nobody is gated on remembering to move.
- [X] T028 Run the full gate: `pnpm test` and `node dist/cli.js verify --strict`.
- [X] T029 Verify SC-007: `git diff --stat main -- site/content CHANGELOG.md`
      shows only the changelog entry. No page text changed (FR-011).
- [ ] T030 `change close the-site-has-a-voice`, then walk the printed ritual.
      MV-83 stays `proposed` — only a human enacts a row (Principle III).

---

## Dependencies

```
Phase 1 (T001–T006)
  └─> Phase 2 (T007–T009)
        ├─> Phase 3 US1 (T010–T019)
        ├─> Phase 4 US2 (T020–T022)   [P] with US1 after T009
        └─> Phase 5 US3 (T023–T026)   needs T007 for the present legs
              └─> Phase 6 (T027–T030)
```

US1 and US2 are independent after T009 and can run in parallel. US3's `present`
legs depend on T007 having written the literals they match; its `absent` leg
depends on nothing.

## Parallel opportunities

- T002–T005 — four separate files.
- T010–T016 — separate rule blocks in one file; parallel only if edited by
  distinct hands, otherwise sequential is simpler than merging.
- T020 (test) and T017–T019 (browser checks) — different surfaces entirely.

## Notes

- **Never `--no-verify`.** If the hook refuses, the brain and the site disagree
  and that is the finding.
- The `--primary-*` block and the AA contrast rule in `custom.css` are inputs to
  this work, not material for it (FR-007, FR-008). MV-33 pins the first.
- Friction here is a finding, not a workaround: if Hextra's markup makes a
  surface unassignable without forking the theme, that becomes a written line,
  not a `!important`.

---

## What the run recorded

**T017 — SC-004 took three attempts, and the plan's estimate was wrong twice.**

- The plan measured "the longest line" as the anchor grammar at ~85 characters.
  Counting every code-block line on the site gave p50 55, p90 126, **max 310**.
  SC-004 was rewritten before implementing rather than after failing it.
- The count itself was bytes, not characters: the line is **86 characters in 88
  bytes** — the ellipsis is one character in three. Corrected in spec, research,
  quickstart, checklist and the stylesheet comment.
- First render at `0.8125rem` (13px) × 85% put the text at 716px in a 640px
  slot — the estimate had used the block's `clientWidth` (672px) and missed its
  own 16px padding on each side. Research D3's levers were applied in the
  documented order, but only the size one: **width stayed at 85%**, because the
  contract forbids a fifth value on the width scale and bending it here would
  have made the axis stop meaning anything. Size went 13px → 12px (660px, still
  20px over) → **0.7rem / 11.2px (616px in 640px)**.
- 11.2px is not small for this face. Measured x-heights at their rendered sizes:
  Martian Mono 11.2px ≈ **6.7px**, SF Mono 13px ≈ 5.83px, Menlo 13px ≈ 7.11px.
  The machine voice reads larger than a conventional mono a step and a half
  above it, which is why the number looks wrong and the page does not.
- D2's documented fallback — a second monospace for blocks — was **not** needed
  and stays available. The binding constraint turned out to be the 640px column,
  not the face: 86 characters in 640px is 7.4px per character, which no mono
  clears at 13px.

**T026 — the leg was seen to fail before it was believed.** A font-host address
was inserted into `head-end.html`, into `CHANGELOG.md` (outside `site/`, mounted
in by MV-78) and into `custom.css`; the leg matched 1 in each and returned to 0
matches in 43 tracked files once reverted.

**T020 — the test was mutated four ways**, and each mutation failed the named
test and only that one: a typo'd font filename, a third-party `src`, a deleted
licence file, and a licence file replaced by something that is not the OFL text
(which is what a rate-limited fetch actually returns).

**T021/T022 — the built tree was grepped too, and it is not a gate.** A
production build was rendered and searched: both `@font-face` sources survive
the concatenation and minification into `css/compiled/main.css`, both preloads
are in the HTML, all four files are copied to `/fonts/`, and no third-party font
host appears in any built `.html` or `.css`. That last one is a stronger
statement than MV-83's legs make — and it stays a manual step, because `public/`
is not tracked and a check nobody runs on every commit is not a gate. The row
says so rather than borrowing the credit.
