# Implementation Plan: release-0-14-0

## Summary
- **`CHANGELOG.md`.** Write the 0.14.0 entry, grouped as Added and Changed. Each bullet names its row, and upgrade notes go where behaviour changes.
- **`package.json`.** Set the version to 0.14.0.
- **The rest of the flow.** The branch, change, land and close all ride the MR from `release-0-14-0`. The tag is pushed after the merge.

## Constitution Check
- **I.** No new row. The reserved id is released at close.
