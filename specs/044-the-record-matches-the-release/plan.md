# Implementation Plan: The record matches the release

**Branch**: `the-record-matches-the-release` | **Date**: 2026-09-13 | **Spec**: [spec.md](spec.md)

## Summary

Four records are behind what happened, and no code is wrong:

- The 0.10.0 changelog entry names none of the fifteen rows it shipped.
- MV-14 states the runner order that MV-92 inverted, and four copies of that sentence exist.
- MV-111 still calls a defect unfixed after MV-112 fixed it.
- The constitution's footer is one version behind its own report.

Each record moves in the shape the repository already uses:

- **Changelog**: house bullets, each naming its ID.
- **Law rows**: inline "Amended … by MV-120" notes. Retired clauses stay visible (WITHDRAWN) rather than deleted.
- **Constitution**: its own amendment procedure, a PATCH plus a prepended report.

MV-120 states the rule and adds MV-111's device, an `absent` leg on each retired phrase, so none of those sentences can come back quietly. Every leg was dry-run in a scratch clone before this plan was written.

## Technical Context

**Language/Version**: Markdown and the law table's anchor dialect (POSIX ERE, per-line matching); no TypeScript changes

**Primary Dependencies**: none added

**Storage**: tracked files — `CHANGELOG.md`, `.multivac/invariants.md`,
`.specify/memory/constitution.md`, `DESIGN.md`, `site/content/docs/guide/install.md`,
`site/content/docs/reference/hooks.md`

**Testing**:
- `verify --strict` for the legs.
- `node:test` full suite, which also re-checks MV-78's changelog tests and MV-72's skill-copy test.
- A scratch-clone "bite" run: MV-120 set to `active` and each fix reverted.

**Target Platform**: the repository itself, plus the documentation site that mounts `CHANGELOG.md` (MV-78)

**Project Type**: single project (CLI); this change touches documents only

**Performance Goals**: `verify` stays sub-second. The four legs add one wide glob (~50 files) and three single-file reads.

**Constraints**:
- No product code.
- MV-120 stays `proposed` (MV-81: enactment is a separate human commit).
- No leg may match history: archived changes, specs, or the 0.8.0 changelog entry.
- The literal landing date appears in four places and has to move together if the landing day slips.

**Scale/Scope**: 6 files edited plus the change file, 3 law rows (2 amended, 1 added), 4 legs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is every corrected sentence anchored or cited by ID? | PASS — MV-14 now cites MV-92 instead of restating it, docs cite MV-92/MV-108, and MV-120's legs forbid each retired phrase |
| II — Never claims more than it checked | Does anything say it is guarded when it is not? | PASS — MV-120 names three ceilings: future releases are unguarded, `touches` stays a declaration, and the footer leg forbids stale values, not the relation |
| III — Law changes before code | Does the row move first? | PASS — there is no code; the rows and their copies move in one change |
| IV — Deterministic, offline, small | Any dependency or network? | PASS — none |
| V — An invented integration is a lie | Does any integration claim change? | PASS — no registry entry touched |
| Governance — amendment procedure | Is the constitution edited in place without bump and report? | PASS — 2.0.2 PATCH, prepended report, matching footer |
| Engineering — tests ship with behaviour | Is behaviour pinned? | PASS — no behaviour changes; the records are pinned by legs, and MV-78/MV-72 tests re-run |

Post-design re-check: PASS. There are no violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/044-the-record-matches-the-release/
├── plan.md              # This file
├── research.md          # Phase 0: decisions (2.0.2 vs 2.0.1, MV-72, leg shapes, notes)
├── data-model.md        # Phase 1: the four records and their legs
├── quickstart.md        # Phase 1: how to prove it, including the bite run
├── contracts/
│   └── legs.md          # the four MV-120 legs and what each forbids
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
CHANGELOG.md                              # 0.10.0 entry rewritten; 0.2.0 names MV-72
.multivac/invariants.md                   # MV-14 amended; MV-111 amended; MV-120 stated + legs
.specify/memory/constitution.md           # 2.0.2 PATCH report + footer
DESIGN.md                                 # runner order (MV-92, MV-108)
site/content/docs/guide/install.md        # runner order, two places
site/content/docs/reference/hooks.md      # cites "Which multivac runs" on the same page
.multivac/changes/the-record-matches-the-release.md   # declaration + claim
```

**Structure Decision**: single project. No file is added or changed under `src/` or `test/`.

## Complexity Tracking

No Constitution Check violation.
