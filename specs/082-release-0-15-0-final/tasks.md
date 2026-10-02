# Tasks: release-0-15-0-final
- [ ] T001 change apply on the branch
- [ ] T002 Dry-run every @anchor leg that reads CHANGELOG.md and record its count
- [ ] T003 CHANGELOG: fold `## Unreleased` into `## 0.15.0 — 2026-10-02`, net of 0.14.1
- [ ] T004 `doors --adopt` with the built 0.15.0
- [ ] T005 Suites, verify --strict and verify --strict --range from main, every T002 leg at its count; commit, land, close on the branch
