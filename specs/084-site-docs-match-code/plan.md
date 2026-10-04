# Implementation Plan: site-docs-match-code

## Summary
- **Docs, five files and the home page.** `commands.md`, `configuration.md`, `hooks.md`, `philosophy.md` (one sentence) and `_index.md` are edited, finding by finding, so each statement says what the cited `src/` line does. Nothing else under `site/` changes; nothing under `src/`.
- **Order.** Read each cited `src/` line before editing its doc line — the audit's line numbers are a map, the code is the source. Where the audit and the code disagree, the code wins and the finding is dropped, noted in the change body.
- **Law.** MV-155 states the rule and carries `absent` legs over `site/content/**` for the dead phrasings (FR-002). It is filed `proposed`; the human enacts.
- **No test file.** The rule is checked by anchors on the pages themselves; a test that re-greps the same pages would pin nothing the legs do not.

## Technical Context
- **Language/Version**: Markdown, Hugo (Hextra) site under `site/`; code checked against is TypeScript at `c049518`.
- **Testing**: `verify --strict`, `verify --strict --range <main>..HEAD --branch site-docs-match-code`, `pnpm test`, Hugo build.
- **Constraints**: pages name no law ID and bind nothing (Constitution I) — the change cites MV-155 in the brain, never on a page; English only.

## Constitution Check
- **I.** MV-155 is cited by ID in the brain (change file, row, anchors); the site pages explain in plain words and name no ID.
- **II.** The corrections remove claims the tool did not check: exit 0 in every degraded state, every command refuses undeclared arguments, config exit 1 only in `doors` and `doctor`, anchor mode alone gating.
- **III.** MV-155's row is written before the page edits; the row is `proposed`, a human enacts it.
- **IV.** No network, no code change; `verify` speed untouched.
- **V.** `integrations.md` is not touched: its eight entries matched `src/` in the audit.

## Phases
1. **MV-155 first.** Write the row's rule and the `absent` legs; `verify` goes red on the five dead phrasings, which proves the legs bite.
2. **Corrections (US1, US2).** `commands.md` 831, 1093, 1211, 1269-1272, 1324, 1785, 1892-1894, 43-45; `configuration.md` 583; `hooks.md` 372-376; `_index.md` 102-103; `philosophy.md` 129.
3. **Omissions (US3).** `commands.md` 386-392, 187-200, 994-1005, 1214/1263, 1367-1410, 1628-1636, 1814-1817, 926-940, plus a short note on the stderr version/`requires:` notice.
4. **Gate.** `verify --strict`, range verify, `pnpm test`, Hugo build; `commands.md`'s `count=9` leg (MV-31) still holds — no new `## ` command heading is added.

## Risks
- The audit's findings are a subagent's report; any one may be wrong. Phase 2 and 3 read the cited line first, and a finding the code does not bear out is dropped.
- A new `###` under `commands.md` could trip MV-31's `count=` legs; sections added stay below the heading levels those legs count.
