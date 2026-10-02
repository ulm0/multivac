# Feature Specification: The badge moves when the tag lands

**Feature Branch**: `083-release-badge-moves-at-tag` | **Created**: 2026-10-02 | **Status**: Draft

**Input**: v0.15.0 was tagged and published at 20:07 on 2026-10-02, and its `pages` job built the site with `HUGO_PARAMS_RELEASE=0.15.0` and reported success in four seconds — yet https://multivac.ulm0.com/ kept `v0.14.1`, `last-modified` 20:04, the build of the push to main of the same commit `a18ad42`. `actions/deploy-pages` sends `GITHUB_SHA` as the Pages build version and takes no input to change it (v5.0.1 `src/internal/context.js`); GitHub Pages returned the deployment that commit already had. The GitLab-era pipeline replaced the site on every run, so MV-77's "a release moves the badge at once" held there and stopped holding in the port to GitHub Actions (MV-145).

## User Scenarios & Testing

### US1 - A release moves the badge when its tag lands (P1)
1. **Given** a merge to main whose `package.json` version has no tag yet, **when** its pipeline runs, **then** `pages` builds and deploys nothing and says the tag's run will.
2. **Given** the tag `v<version>` pushed on that commit, **when** its pipeline runs and `publish` succeeds, **then** `pages` deploys that commit for the first time, and the badge reads `<version>`.

### US2 - Site-only corrections still reach readers (P1)
1. **Given** a push to main whose `package.json` version is already tagged, **when** its pipeline runs, **then** `pages` deploys as before (MV-77's two-branch rule).

## Requirements
- **FR-001:** The `pages` job's first step after checkout decides whether to deploy: on a tag, always; on the default branch, only when `refs/tags/v<package.json version>` exists. Every later step runs only when it decided to deploy, and the step says why when it does not.
- **FR-002:** `needs: [publish]`, the `needs.publish.result` check and the two-branch `if:` stay as they are (MV-77's tests).
- **FR-003:** MV-77 carries a dated note naming the GitHub Pages fact, the rule, and the trade-off: between a bump's merge and its tag, site-only corrections wait for the tag.
- **FR-004:** A test reads the workflow and fails when a default-branch deploy of an untagged version is possible.

## Success Criteria
- **SC-001:** The suite passes; `verify --strict` and `verify --strict --range <main>..HEAD --branch release-badge-moves-at-tag` exit 0; MV-77 and MV-145's legs hold.
- **SC-002:** After this merges, its push to main (package.json 0.15.0, tag v0.15.0 present) deploys a new commit and the badge reads `v0.15.0`.
