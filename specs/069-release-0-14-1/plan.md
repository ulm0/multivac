# Implementation Plan: release-0-14-1

## Summary
- **CHANGELOG.** Add a Fixed entry, with an upgrade note for CI that runs `verify --range`.
- **`package.json`.** Set the version to 0.14.1.
- **Lifecycle.** Run the whole change on branch `release-0-14-1`, stacked on `enact-mv142`. Tag after the merge.

## Constitution Check
- **I.** No new row. The reserved id is released at close.
