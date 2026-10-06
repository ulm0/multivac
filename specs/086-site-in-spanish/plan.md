# Implementation Plan: site-in-spanish

## Summary
- **Hugo, two languages by filename.** `site/hugo.yaml` declares `en` (default, at `/`) and `es` (at `/es/`). Each English page `x.md` gets a twin `x.es.md` beside it, so the English URLs, the anchors and the law legs that name `site/content/**` do not move. The mounted `CHANGELOG.md` is mounted a second time as `changelog.es.md` and stays English.
- **Theme and head.** Hextra v0.12.3 renders the language switcher when two languages exist and ships Spanish UI strings; `site/i18n/es.yaml` carries the footer and card-alt strings, `head-end.html` localizes `og:locale`, `og:image:alt` and `inLanguage`, and adds `hreflang` alternates with `x-default`.
- **Translation by chunks.** Agents translate chunks of each page into es-419 following `glossary.md`; a script assembles the twins and pins every Spanish heading to the English heading's id, so `#anchor` links and cards resolve in both languages.
- **One test.** `test/invariants/site-i18n.test.ts` pins the pairing: a twin for every page and the reverse, identical fenced blocks, matching headings and ids, shortcode sequence, front matter keys and `weight`, a `description` on both, the same law ids, links and inline code on a twin.
- **Law.** MV-157 states the rule with legs on `hugo.yaml` and the test; filed `proposed`. The constitution's language line is amended (3.0.3 to 3.1.0, MINOR) and `CONTRIBUTING.md` and `DESIGN.md` follow.

## Technical Context
- **Language/Version**: Hugo 0.165 (CI) / 0.167 (local), Hextra v0.12.3, TypeScript for one `node:test` file.
- **Testing**: `pnpm test`, `verify --strict`, `verify --strict --range <main>..HEAD --branch site-in-spanish`, Hugo build, a link and anchor check over both languages.
- **Constraints**: pages name no law ID (Constitution I); fonts are the site's own (MV-83); no network in `verify`; MV-100's head rules hold per language (`languageCode` unique at the top level, no top-level `locale:`).

## Constitution Check
- **I.** MV-157 and the constitution amendment are cited by ID in the brain; a Spanish twin names exactly the law ids its English page names.
- **II.** The Spanish pages claim nothing the English ones do not; the changelog stays English and the pages say the binary prints English.
- **III.** MV-157's row and legs are written before the pages; the row is `proposed`, a human enacts it. The constitution amendment is the human's request of 2026-10-06, recorded in the change and read by a human in the merge request.
- **IV.** No network and no model added to `verify`; the test reads tracked files.
- **V.** No dependency added; the site gains pages, not code.

## Phases
1. **Law and config first.** MV-157 row and legs; the constitution amendment; `hugo.yaml`, `i18n/es.yaml`, `head-end.html`; the parity test, red while no twin exists.
2. **Translate.** Chunks in parallel into the scratchpad; assemble twins and heading ids; the test goes green.
3. **Review.** One bilingual reviewer per page that did not translate it; one repair round for what it refutes.
4. **Gate.** Build both languages, link and anchor check, `pnpm test`, `verify --strict` and the range run; push, merge request, merge deploys the site.

## Risks
- Heading ids differ between languages unless pinned; the assembler pins them and the test compares them.
- A Spanish twin that drifts from its English page; the test fails until they match in structure, the reviewer judges meaning.
- `hreflang`, `og:locale` and the changelog mount are the parts Hugo does not do on its own; each has an anchor or a build check.
