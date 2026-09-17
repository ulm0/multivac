# Feature Specification: Release 0.14.0

**Feature Branch**: `067-release-0-14-0` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Rows MV-129 to MV-141 were enacted in !139, after 0.13.0 was tagged. They need a release.

## User Scenarios & Testing

### US1 - The changelog says what 0.14.0 changes (P1)
1. **Given** the rows that 0.14.0 makes active, **when** a user reads `CHANGELOG.md`, **then** the entry names each of those rows (MV-120).
2. The entry says what behaves differently for someone who upgrades.

### US2 - The package is 0.14.0 (P1)
1. `package.json` reads `0.14.0`.

## Requirements
- **FR-001:** Add a `## 0.14.0 — 2026-09-16` entry that names MV-129 to MV-141, with upgrade notes.
- **FR-002:** Bump `package.json` to 0.14.0. No version literal goes under `site/content` (MV-84).
- **FR-003:** The release goes through this change, because MV-137 treats `CHANGELOG.md` and `package.json` as code.
