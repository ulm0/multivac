# Implementation Plan: repos-check
- **`src/lib/git.ts`:** exports `normUrl`, moved here from `verify.ts`.
- **`src/lib/repo-state.ts`:** new, with `cloneState` and `projectDocVerdict`.
- **`src/commands/repos.ts`:** gains `reposCheck` and the `check` subcommand.
- **`src/commands/doctor.ts`:** the project-law line uses `projectDocVerdict`.
- **`src/commands/change.ts`:** gains `refuseUncloned`, called beside `refuseReadOnly` in plan and apply.

## Constitution Check
- **II.** Each failing root names its state and the fix.
- **III.** New row MV-132.
- **IV.** `repos check` reads the filesystem and runs git only.
- **V.** No registry change.
