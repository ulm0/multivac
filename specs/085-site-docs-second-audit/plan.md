# Implementation Plan: site-docs-second-audit

## Summary
- **Docs, twenty-odd pages.** The 138 rows of `findings.md` fall on `commands.md` (49), `sdd.md` and `configuration.md` (14 each), `hooks.md` (10), `integrations.md`, `the-change.md` and `claims-and-anchors.md` (6 each), the guide pages, `distribution.md`, `adoption.md`, `philosophy.md`, `brain-driven-development.md`, `invariants.md`, the two `_index.md` pages and the landing page. Each page is edited finding by finding so each statement says what the cited `src/` line does. Nothing under `src/` changes.
- **Order.** Read each cited `src/` line before editing its page line — the audit's line numbers are a map, the code is the source. Where the audit and the code disagree, the code wins and the finding is dropped, noted in the change body.
- **Law.** MV-156 states the rule and carries `absent` legs over `site/content/**` for ten dead phrasings (FR-002). It is filed `proposed`; the human enacts.
- **No test file.** The rule is checked by anchors on the pages themselves; a test that re-greps the same pages would pin nothing the legs do not.

## Technical Context
- **Language/Version**: Markdown, Hugo (Hextra) site under `site/`; code checked against is TypeScript at `1b13c4a`.
- **Testing**: `verify --strict`, `verify --strict --range <main>..HEAD --branch site-docs-second-audit`, `pnpm test`, Hugo build.
- **Constraints**: pages name no law ID and bind nothing (Constitution I); English only; `CHANGELOG.md` is history — released entries are not rewritten.

## Constitution Check
- **I.** MV-156 and MV-81 are cited by ID in the brain (change file, row, anchors, this spec); the site pages explain in plain words and name no ID.
- **II.** The corrections remove claims the tool did not check: anchor mode as the only gate, `strict` refusing work in flight, a mechanical human/agent split, a preview before `init`, `check-ignore` on every path.
- **III.** MV-156's row and legs are written before the page edits and `verify` reports each forbidden pattern at its page and line, which proves the legs bite; the row is `proposed`, a human enacts it.
- **IV.** No network, no code change; `verify` speed untouched.
- **V.** Nothing is added to the product; the pages shrink or stay the same size where a claim is dropped.

## Phases
1. **MV-156 first.** The rule and the `absent` legs are on the row; ten forbidden patterns are reported before any page moves.
2. **Corrections.** One writer per file, a file at a time: `commands.md` in three passes by line range, one pass each for the rest. Each writer reads the finding's cited `src/` lines, edits, and lists what it changed, what it dropped and why, and any behaviour it documented that reads as a defect.
3. **Check.** A second agent per file, which did not write the edit, re-reads every corrected statement against `src/` and runs the binary where it can; a statement it cannot confirm goes back to a writer.
4. **Gate.** `verify --strict`, range verify, `pnpm test`, Hugo build; `commands.md`'s `count=9` leg (MV-31) still holds — no new `## ` command heading is added.

## Risks
- The audit's findings are subagent reports; any one may be wrong. Writers read the cited line first, and a finding the code does not bear out is dropped.
- Two writers on one file lose edits; one writer per file, and `commands.md` passes run in sequence.
- A page fixed to match a code defect documents the defect; those go to the roadmap in the change body, not into this change.
