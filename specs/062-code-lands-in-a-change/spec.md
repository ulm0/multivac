# Feature Specification: Code lands inside a started change

**Feature Branch**: `062-code-lands-in-a-change` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 14 of the 2026-09-14 plan (R7a, R7b's skip record, decision D13 b+c; clusters C05, C06, C40).

## Context: what was measured

1. **Code can bypass the SDD.** With `sdd: speckit` and `sdd_auto: true` declared, a commit that changes code on `main` or on any branch passes `verify`. No check asks whether a change was started. MV-97 asks only about the config, and accepts any open change.
2. **A merge is not checked.** `git merge` runs `pre-merge-commit`, and multivac installs no shim for it.
3. **CI has nothing to run.** `verify` has no way to judge a range of commits. A `--no-verify` commit is therefore never caught.
4. **A skipped SDD leaves no trace.** `--no-sdd` at `plan`, `apply` or `close` is not recorded in the change.
5. **Nothing says what the forge must do.** Enforcement depends on protecting the default branch and requiring the MR pipeline. multivac cannot read either setting from disk.

## User Scenarios & Testing

### US1 - Commit-time check (P1)
1. **Given** an SDD declared with automation on for the repo, and staged code paths, **when** the branch is `<slug>` of an open change that declares the repo, **then** verify passes and names the change.
2. **Given** `main`, or a branch that matches no open change, **then** the brain checkout refuses. A consumer checkout refuses only under `--strict`, because its mounted brain can lag.
3. **Given** an open change that does not declare this repo, **then** it refuses.
4. **Given** a `close-<slug>` branch, **then** the change is read from HEAD, where it is still open.
5. **Given** only non-code paths (`.multivac/**`, doors, SDD and grapher artifacts, hook directories), **then** the check is silent.
6. **Given** no SDD, or `sdd_auto: false`, **then** the check is silent.

### US2 - Merge-time check (P1)
1. **Given** a merge whose `MERGE_HEAD` is the tip of an open change's branch that declares the repo, **then** it passes. `pre-merge-commit` runs the same verify.

### US3 - CI range (P1)
1. **Given** `--range <base>..<head> --branch <name>`, **then** verify judges the code paths of the non-merge commits in the range against the branch.
2. **Given** a base that is not in the clone, **then** it is not answered and refuses under `--strict`.

### US4 - Records and the forge (P2)
1. **Given** `--no-sdd` on `plan`, `apply` or `close`, **then** the change file records the point under `sdd_skipped`, and `close` prints it.
2. `doctor` prints that enforcement needs a protected default branch and a required MR pipeline, and that this cannot be read from disk.

## Requirements
- **FR-001:** One module, `src/lib/code-in-change.ts`, decides the line for all three readers.
- **FR-002:** The non-code set is derived from the registry.
- **FR-003:** `pre-merge-commit` joins `HOOK_NAMES`.
- **FR-004:** The switch is the repo's resolved SDD plus `sdd_auto`. There is no new key.
