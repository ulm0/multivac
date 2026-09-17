# Implementation Plan: code-lands-in-a-change

## Summary
- **`code-in-change.ts`.** `nonCodeGlobs(cfg)` and `codePaths`. `codeInChangeLine({brainDir, cfg, repoKey, repoDir, consumer, strict, range?, branch?})` resolves the paths from the index or the range, and the slug from the branch or from `MERGE_HEAD`'s branches. It reads the change from the brain's working tree, or from HEAD (or the range base) for `close-`. It returns a Diagnostic.
- **`verify.ts`.** Add `--range` and `--branch`, call the module for brain and consumer runs, and add the line to the exit.
- **`install.ts`.** Add `pre-merge-commit` to `HOOK_NAMES`.
- **`change/file.ts`.** Add `sdd_skipped?: string[]`. `change.ts` records it on `--no-sdd` at `plan`, `apply` and `close`, and prints it at `close`.
- **`doctor.ts`.** Add the forge line.
- **Site.** Add the CI recipe, and update the hooks and verify pages.

## Constitution Check
- **I.** New row MV-137, with notes on MV-89 and MV-97.
- **IV.** git and the filesystem only.
