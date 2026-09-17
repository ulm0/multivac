# Feature Specification: Release 0.14.1

**Feature Branch**: `069-release-0-14-1` | **Created**: 2026-09-17 | **Status**: Draft

**Input**: MV-142 was enacted in !142. It fixes two refusals in 0.14.0 that users of that version hit.

## User Scenarios & Testing

### US1 - The changelog says what 0.14.1 fixes (P1)
1. **Given** MV-142 is active, **when** a user reads the 0.14.1 entry, **then** it names MV-142 (MV-120). It says a change closed on its own branch passes `verify --range`. It says a fresh brain's first commit passes the code-in-change check.

### US2 - The package is 0.14.1 (P1)
1. `package.json` reads `0.14.1`.

## Requirements
- **FR-001:** Add a `## 0.14.1 — 2026-09-17` entry under **Fixed**, naming MV-142.
- **FR-002:** Bump `package.json` to 0.14.1.
