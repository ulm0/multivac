# Feature Specification: A change carries its SDD files onto its branch

**Feature Branch**: `058-sdd-shared-committed` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 6a of the 2026-09-14 plan, change 10. The SDD's shared files and a change's own artifacts reach the branch the work is done on, so they are committed and land by merge.

## Context: what was measured

Measured in this repository on every change from 052 to 057 (2026-09-16), with spec-kit.

1. **The change's artifacts stay behind.** `/speckit.specify`, `/speckit.plan` and `/speckit.tasks` write `specs/<n>-<slug>/` into the brain's checkout. `change apply` then creates the change worktree from the last commit, where that directory does not exist. Every change needed the directory copied into the worktree by hand.
2. **The merge then fails.** The untracked copy left behind makes `git merge` stop with `untracked working tree files would be overwritten`, so it also had to be deleted by hand.
3. **The installed SDD has the same problem.** An SDD `equip` installs leaves `.specify/**` uncommitted, and nothing puts it on any branch.
4. **spec-kit cannot find the feature in the worktree.** spec-kit resolves the current feature from `.specify/feature.json` (`read_feature_json_feature_directory` in `.specify/scripts/bash/common.sh`). That file is local to one checkout and ignored, so a new worktree has none.

## User Scenarios & Testing

### US1 - The change's SDD files are on its branch (P1)
1. **Given** `specs/<n>-<slug>/` untracked in a named repo's checkout, **when** `change apply` runs, **then** the files are committed on the change's branch in its worktree and removed from the checkout. A later merge of the branch does not stop on them.
2. **Given** SDD shared files (`.specify/**`, except local ones) untracked in the checkout, **then** the same happens to them.
3. **Given** nothing uncommitted, **then** no commit is made.

### US2 - What cannot be carried safely is refused before anything moves (P1)
1. **Given** a shared or artifact file that is tracked and modified in the checkout, **when** `change apply` runs, **then** it refuses before the status bump, naming the file.
2. **Given** a shared file that git ignores, **then** it refuses, naming the file and `git check-ignore -v` as the way to find the rule.

### US3 - spec-kit finds the feature in the worktree (P2)
1. **Given** speckit and a resolved feature directory, **when** the worktree is created, **then** its `.specify/feature.json` names that directory.

## Requirements
- **FR-001:** At `change apply`, for each named repo multivac may write in, the uncommitted files under the SDD's shared globs, and under this change's own artifact directory, are copied into the change worktree, committed there on the change branch, and removed from the checkout.
- **FR-002:** A modified tracked file or an ignored file among them is refused before the bookkeeping commit.
- **FR-003:** Local paths (`.specify/feature.json`) are never carried. The worktree gets its own `feature.json` naming the change's feature directory.
- **FR-004:** No vendor command runs, and no network is reached.

## Assumptions
- Branching in place (no worktree available) commits the files where they are, on the branch.
- openspec's per-change artifacts are `openspec/changes/<slug>/**`, handled the same way through its step artifacts.
