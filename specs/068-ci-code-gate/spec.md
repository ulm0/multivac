# Feature Specification: The merge request pipeline judges a request's code against its change

**Feature Branch**: `068-ci-code-gate` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: MV-137 made `verify --strict --range` the reader that binds, and this repository's pipeline does not run it.

## Context: what was measured

1. **Nothing in the pipeline asks the question.** `.gitlab-ci.yml` runs `test`, `selfverify`, `publish` and `pages`. None of them runs `verify --range`, so a commit made with `--no-verify` reaches main unjudged.
2. **The reader refuses a branch that closed its own change.** The flow multivac uses for a release, and for any change landed through one merge request, is open, code, land and close, all on the same branch (`release-0-14-0`, !140). At the head of that branch the change file is archived, so `--range … --branch release-0-14-0` finds no open change there and refuses. The job would have refused !140.

## User Scenarios & Testing

### US1 - A branch that closed its change passes (P1)
1. **Given** a range whose head holds `.multivac/changes/archive/<slug>.md`, and whose base does not, **when** `verify --strict --range base..head --branch <slug>` runs, **then** the code is judged against that change as it was while open.
2. **Given** a change already archived at the base, **then** the range is refused. A closed change admits no new code.

### US2 - The pipeline runs the reader (P1)
1. **Given** a merge request pipeline, **then** the job `change-gate` runs with the whole history: `verify --strict --range "$CI_MERGE_REQUEST_DIFF_BASE_SHA..$CI_COMMIT_SHA" --branch "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME"`.
2. It does not run on a tag or on a branch push.

## Requirements
- **FR-001:** The archive reading lives in `code-in-change.ts`, and only for the brain's own range.
- **FR-002:** The job lives in `.gitlab-ci.yml`, in stage `test`.
- **FR-003:** `.gitignore` and every harness directory the tools install into are not code. Measured with 0.14.0 installed: a fresh brain's step 0 commit was refused over `.gitignore` and `.agents/`.
