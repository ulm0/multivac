# Feature Specification: Every declared repo can be checked cloned and set up, offline

**Feature Branch**: `057-repos-check` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 8 of the 2026-09-14 plan, change 9: validate that the declared repos are cloned and initialized.

## Context: what was measured

Measured 2026-09-16 on multivac 0.13.0 in a scratch ecosystem that declares a plain directory (`a: ../notrepo`) and a repo with no commit (`b: ../unborn`):
- `multivac repos check` exits 2 with `unknown subcommand "check"`.
- `multivac repos` prints both as `present`.
- `doctor` prints `repos 3/3 present`.
- Nothing says whether a declared repo is the repo it claims to be, or whether its declared tools are set up and committed.
- `doctor` calls a 0-byte project document "present". Only an unfilled template is caught.

## User Scenarios & Testing

### US1 - One offline command answers "is every declared repo cloned and set up" (P1)
1. **Every root good.** Given every root is cloned, its declared SDD installed with its state file in HEAD, its project document written, and its shared graph in HEAD, `repos check` exits 0 with one line per root.
2. **One root fails.** Given a root that is absent, not a repo, inside another repo, has no commit, or whose remotes do not include the declared url, the command exits 1 and the line names the state and the fix.
3. **Tool not set up.** Given a cloned root whose SDD or graph is not installed, or whose shared artifact is not in HEAD, or whose project document is missing, empty or the template, the command exits 1 and names each.
4. **Not managed.** Given `managed: false`, only the clone is checked.
5. **Invalid config.** Given an invalid config, the command exits 2.
6. **Offline.** No vendor binary is needed: the command runs with no vendor on `PATH`.

### US2 - The lifecycle refuses a named repo that is present but is not the declared clone (P2)
1. **Refused before anything moves.** Given a change naming a repo whose directory exists but is not a clone of it, `change plan` and `change apply` refuse before anything moves, naming the state.

### US3 - doctor never calls an empty project document present (P2)

## Requirements
- **FR-001:** `cloneState` decides clone state in one place: the path exists, it is the git toplevel of that path, HEAD resolves, and, when a url is declared, one remote matches it after normalization. brain==code counts as cloned by definition.
- **FR-002:** `projectDocVerdict` returns missing, empty, template or written. `doctor` and `repos check` both use it.
- **FR-003:** `repos check` runs no vendor command and makes no network call.
- **FR-004:** `plan` and `apply` refuse, before writing, a named repo that is present and not cloned.

## Assumptions
- Freshness of the graph is not checked here. Existence and HEAD are.
- `repos` and `doctor` keep their current lines and exit codes. Sharing clone state with them is left for the final docs and polish pass.
