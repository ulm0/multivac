# Implementation Plan: consumer-worktree-brain

## Summary
- **`verify.ts`.** Add `worktreeBrain(dir)`, a realpath check and a regex on the path segments. `runVerify` tries it first when there is no config, and sets `scope`, `brainDir` and a `lagging` flag. The flag is false here, and true for a mount. `codeInChangeLine` gets `consumer: lagging`.
- **Scope line.** It names the change worktree.

## Constitution Check
- **I.** New row MV-138.
