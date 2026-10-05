# Feature Specification: The pages say what the code does, second audit

**Feature Branch**: `085-site-docs-second-audit` | **Created**: 2026-10-05 | **Status**: Draft

**Input**: A second audit of `site/content/`, `README.md` and `CHANGELOG.md` against the 0.15.0 binary built from `1b13c4a` (2026-10-05, 24 slices, 2625 claims checked) found drift that MV-155 did not reach, and one sentence MV-155 wrote that is itself wrong. Every finding is in `findings.md` (138 rows: 124 confirmed by two independent verifiers, 14 reported by a completeness critic). Docs change only; no `src/` change. Where a claim is false because the code is surprising or looks like a defect, the page says what the code does and the surprise goes to the roadmap, not into this change.

## User Scenarios & Testing

### US1 - A reader is not told a guarantee the code does not give (P1)
1. **Given** a reader looking up what gates a commit, **when** they read the hooks, claims and concepts pages, **then** no page says anchor mode alone decides it, and the list of lines that gate in a default run is the one the code uses: a mounted brain's SDD refusal gates only under `--strict` (verify.ts:593-599), and `code` outside a change gates in a default run only in a brain checkout (F-rows for `hooks.md`, `claims-and-anchors.md`, `brain-driven-development.md`).
2. **Given** `verify --strict`, **when** the reader looks up an open change, **then** the pages say strict refuses only a finished change that was not closed, never work in flight (`the-change.md`).
3. **Given** who enacts a row, **when** the reader looks it up, **then** the pages say multivac cannot tell a human's commit from an agent's, and checks only that a row does not become active in the commit that anchors it (MV-81; `philosophy.md`).
4. **Given** a `*` leg and a declared repo that is not on disk, **when** the reader looks up the verdict, **then** the pages say the repo is left out of that leg and the leg can resolve `ok`, and that `read ghost` is the only hint (`claims-and-anchors.md`).
5. **Given** the landing page and the `init` section, **when** read, **then** the commit refusal is scoped to blocking modes and `--strict`, `init` is described as checking the seven paths it checks, and step 0 is said to leave out the `.gitignore` edit `init` made (`_index.md`, `commands.md`).

### US2 - Quoted output and step sequences are what the binary does (P1)
1. **Given** every fenced output block and quoted refusal under `site/content/`, **when** compared with a run of the binary, **then** each line, order and count matches: the consumer-scoped `verify` block, the `broken` block with repo-key prefixes, the unabridged `unanchored` list, the `read` line shape (F-rows).
2. **Given** the first commands a new reader runs (`install.md`, `getting-started.md`, `session-zero.md`), **when** followed in order, **then** each prints what the page shows; no page recommends `doctor`, `verify`, `seed` or `doors` before `init` as a preview.
3. **Given** `change close`, `change plan`, `change apply` and `roadmap add`, **when** a refusal or an exit is described, **then** it is the one the code gives in the order it gives it (orphan line withheld while a claim is red; the SDD gate before the planned-change refusal; a refused `roadmap add` commit leaves the file staged).

### US3 - What the code does and the pages omit or misname is stated (P2)
1. **Given** the remaining rows of `findings.md`, **when** the reader looks each up, **then** the page states the behaviour the cited `src/` line has: exit codes, flags, defaults, file names, counts, statuses (`planned|open|archived`, never `landed`/`closed` on a change file), and the Windows symlink notice wording.

## Requirements
- **FR-001:** Every correction is checkable against the `src/` line its finding cites; the page states the behaviour, not the line. A finding the code does not bear out is dropped and named in the change body.
- **FR-002:** The statements this change removes are named by MV-156 as `absent` legs over `site/content/**`, written before any page moves, so `verify` goes red on them first (Constitution III).
- **FR-003:** No page names a law ID (Constitution I). No file outside `site/content/`, `.multivac/` and `specs/` changes; no `src/` change.
- **FR-004:** The corrections keep every existing anchor green, including MV-31's `count=` legs over `commands.md` headings and MV-155's `absent` legs.
- **FR-005:** The 0.15.0 migration notes about graphs stay as they are.

## Success Criteria
- **SC-001:** `verify --strict` and `verify --strict --range <main>..HEAD --branch site-docs-second-audit` exit 0; the suite passes; the site builds.
- **SC-002:** A fresh run of the audit's slices over the changed pages finds none of this audit's findings still true, and each corrected statement is re-checked against the code by a verifier that did not write it.

## Assumptions
- Behaviour that reads as a code defect is documented as it is and filed on the roadmap: step 0 omitting the `.gitignore` edit `init` made, `init` checking seven paths where the page says every path, `seed` listing a missing repo under `## skipped` rather than as unevaluated.
- Findings the audit's auditors listed beyond their per-slice cap were not verified; each is read against the code in the page's own pass and fixed only if true.
- The site deploys on a release tag (MV-154), so these corrections reach the live site with the next release, not with the merge.
- Line numbers are those of 2026-10-05 on `1b13c4a`.
