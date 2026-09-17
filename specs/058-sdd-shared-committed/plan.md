# Implementation Plan: sdd-shared-committed

## Summary

New `src/change/carry.ts` with two functions:
- `planCarry(repoDir, cfg, key, slug)` → `{ paths, refusals }`:
  - reads `git status --porcelain -z --untracked-files=all`;
  - keeps untracked or modified paths matching the SDD's `shared` globs (minus `local`, unless a path is itself a literal `shared` entry) and paths under this slug's resolved step-artifact directories;
  - refuses modified tracked paths;
  - refuses ignored files found on disk under the shared roots (`git check-ignore`).
- `doCarry(repoDir, wt, slug, paths, featureDir?)`:
  - copies the paths into the worktree, runs `git add --` on them and commits on the branch;
  - removes the originals;
  - writes `.specify/feature.json` in the worktree when a feature directory is known.

`cmdApply` calls `planCarry` for every writable repo before the bookkeeping commit, and `doCarry` after `ensureWorkspace`.

## Constitution Check
- **I.** New row, MV-133.
- **II.** Refusals name the file.
- **IV.** git and the filesystem only.
- **V.** The globs come from the registry.
