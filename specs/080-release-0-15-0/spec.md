# Feature Specification: Release 0.15.0

**Feature Branch**: `080-release-0-15-0` | **Created**: 2026-09-30 | **Status**: Draft

**Input**: The Unreleased changelog carries the adapter-first token-savings plan since 0.14.1: MV-143, MV-144 and MV-146 through MV-152. Ship them as 0.15.0.

## User Scenarios & Testing

### US1 - The changelog says what 0.15.0 changes (P1)
1. **Given** the Unreleased section, **when** a user reads the changelog, **then** that section is the `## 0.15.0 — 2026-09-30` entry, word for word, with its "read before upgrading" lead kept (MV-78, MV-120).

### US2 - The package is 0.15.0 (P1)
1. `package.json` reads `0.15.0`, so the tag the human pushes after the merge matches the manifest (MV-68).

## Requirements
- **FR-001:** Rename `## Unreleased` to `## 0.15.0 — 2026-09-30`; change no entry.
- **FR-002:** Bump `package.json` to 0.15.0.
- **FR-003:** Leave `.multivac/projected.yml` alone: `mvac doors --adopt` brings this brain to 0.15.0 deliberately, after the release (MV-86), and no `requires:` floor is written — a human writes it.

## Success Criteria
- **SC-001:** The suite passes and `verify --strict` exits 0, and `verify --strict --range <main>..HEAD --branch release-0-15-0` exits 0 with the change archived at the head (MV-142).
