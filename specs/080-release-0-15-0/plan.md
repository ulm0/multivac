# Implementation Plan: release-0-15-0

## Summary
- **CHANGELOG.** The Unreleased section becomes the 0.15.0 entry, dated 2026-09-30.
- **`package.json`.** Set the version to 0.15.0.
- **Lifecycle.** Run the whole change on branch `release-0-15-0`, stacked on the integration branch that carries changes 3–9, and open the merge request from it. The human enacts MV-143 through MV-152, pushes the tag after the merge, and adopts 0.15.0 with `mvac doors --adopt`.

## Constitution Check
- **I.** No new row. The reserved id is released at close.
- **III.** No law changes; the rows this release ships changed before their code, in their own changes.
