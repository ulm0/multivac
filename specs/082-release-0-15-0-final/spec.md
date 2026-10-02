# Feature Specification: Release 0.15.0

**Feature Branch**: `082-release-0-15-0-final` | **Created**: 2026-10-02 | **Status**: Draft

**Input**: 0.15.0 was prepared on 2026-09-30 (release-0-15-0) but never tagged or published; npm's latest is 0.14.1. drop-graphers (MV-153) then landed under `## Unreleased`, above the 0.15.0 entry, and removed the grapher features that entry announces (MV-148, MV-149, both retired, never enacted). Ship it all as one 0.15.0.

## User Scenarios & Testing

### US1 - The 0.15.0 entry says what changed since 0.14.1 (P1)
1. **Given** a user on 0.14.1, **when** they read the 0.15.0 entry, **then** it describes the net change: graphers are gone (MV-153), and nothing in it announces a grapher feature they will never get — no per-worktree codegraph index, no `codegraph.json` or `info/exclude` writer, no graph moved or refreshed (MV-120).
2. **Given** the entry, **then** it names every row the release makes law that no earlier entry named — MV-143, MV-144, MV-146, MV-147, MV-150, MV-151, MV-152, MV-153 — and the rows it retires, MV-148 and MV-149 among them (MV-120).
3. There is no `## Unreleased` heading, and the entry is `## 0.15.0 — 2026-10-02` (MV-78).

### US2 - The brain is brought to 0.15.0 (P1)
1. `mvac doors --adopt` records `version: 0.15.0` in `.multivac/projected.yml`, and a run no longer prints that the brain was brought to 0.14.1 (MV-86).

## Requirements
- **FR-001:** Fold `## Unreleased` into the 0.15.0 entry, re-dated 2026-10-02, written against 0.14.1: drop or reword every item and lead sentence that announces a grapher behaviour MV-153 removed; keep every other item's text.
- **FR-002:** `package.json` stays 0.15.0.
- **FR-003:** Adopt with the built 0.15.0: `doors --adopt`; commit what it writes.
- **FR-004:** No `requires:` floor (MV-86: a human writes it); no row enacted (MV-81); no tag pushed — publishing is the human's.

## Success Criteria
- **SC-001:** The suite passes; `verify --strict` exits 0 and prints no version notice; `verify --strict --range <main>..HEAD --branch release-0-15-0-final` exits 0; every leg reading CHANGELOG.md keeps its count.
