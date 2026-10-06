# Feature Specification: The site is published in Spanish and English

**Feature Branch**: `086-site-in-spanish` | **Created**: 2026-10-06 | **Status**: Draft

**Input**: The human asked, on 2026-10-06, for the documentation site to be published in Spanish (Latin America, es-419) and English (US, en-US), with English the default. The constitution says "English everywhere — code, comments, docs, the site, commit messages, change files. No exceptions."; the human's request is the principle that moves it, for the site only. Docs and site configuration change; no `src/` change.

## User Scenarios & Testing

### US1 - A Spanish reader reads every page in Spanish (P1)
1. **Given** a reader whose browser prefers Spanish or who opens `/es/`, **when** they browse, **then** every page of the site exists in Spanish with the same structure: same sections in the same order, same commands, flags, file names and quoted output, same links between pages.
2. **Given** the navigation, **when** the reader looks for another language, **then** a switcher offers English and Español from any page and lands on the same page in the other language.
3. **Given** a page quoted in a search result or a pasted link, **when** a scraper reads it, **then** the Spanish page carries its own description, card, `og:locale` and `hreflang` alternates, and the sitemap lists both languages.

### US2 - English stays the default and nothing English moves (P1)
1. **Given** the existing URLs, **when** the site is published, **then** every English page keeps its address (`/docs/...`) and the English text does not change; Spanish lives under `/es/`.
2. **Given** `CHANGELOG.md`, **when** the Spanish site mounts it, **then** it appears there untranslated, as the record of releases it is, and says so nowhere it would need editing the changelog.

### US3 - The two languages cannot drift apart silently (P1)
1. **Given** a page added, removed or restructured in one language, **when** the suite runs, **then** a test fails until the other language matches: a Spanish twin exists for every English page and the reverse, the fenced blocks are byte-identical in the same order, the headings match in level, count and anchor id, the shortcodes match in sequence, the front matter keys match with the same `weight`, both carry a `description`, and the twin uses the same law ids, links and inline code.
2. **Given** a heading in Spanish, **when** another page links to it, **then** the link works in both languages because the Spanish heading keeps the English heading's id.

## Requirements
- **FR-001:** Every page under `site/content/` except the mounted changelog has a Spanish twin `<name>.es.md`, written in neutral Latin American Spanish, second person singular (tú), consistently using the glossary in `glossary.md`.
- **FR-002:** Fenced code blocks, inline code, commands, flags, config keys, file names and quoted tool output are identical in both languages; only prose, headings, table cells of prose, link text, `title` and `description` are translated.
- **FR-003:** `hugo.yaml` declares `en` (default, at `/`) and `es` (at `/es/`); the menu, footer, search, `og:locale`, JSON-LD `inLanguage` and card alt text follow the page's language; `hreflang` alternates and `x-default` are emitted.
- **FR-004:** A Spanish twin names exactly the law ids its English page names, and uses the same links and the same inline code: translating adds none (Constitution I).
- **FR-005:** The constitution's language constraint is amended in place (version bumped, MINOR) to carve out the site; `CONTRIBUTING.md` and `DESIGN.md` are brought into line. No `src/` change.
- **FR-006:** MV-157 states the rule on its row, with legs on `hugo.yaml` and the parity test; the row is `proposed`, a human enacts it.

## Success Criteria
- **SC-001:** `verify --strict`, `verify --strict --range <main>..HEAD --branch site-in-spanish` exit 0; the suite passes (parity test included); the Hugo build passes with no broken internal link or anchor in either language.
- **SC-002:** A bilingual reviewer that did not write a page's translation finds no meaning error, untranslated prose or glossary breach left on it.
- **SC-003:** The deployed site serves `/` in English and `/es/` in Spanish, the switcher links both ways, and the English pages answer exactly what they did before.

## Assumptions
- Spanish uses "tú"; no voseo and no "vosotros". Coined multivac terms follow `glossary.md`.
- The mounted changelog stays English on the Spanish site; translating a release record is a separate decision.
- The site deploys on a push to the default branch while the package version is tagged (MV-154), so merging publishes it.
- Spanish for a command's own output is not attempted: the binary prints English and the pages quote it.
