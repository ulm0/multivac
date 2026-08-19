# Phase 1 — Data model: The projection survives its environment

## Hooks directory

| Context | Resolved from | `hooks/` present |
| --- | --- | --- |
| ordinary checkout | `--git-common-dir` (= `--git-dir`) | yes |
| linked worktree | `--git-common-dir` | yes — `--git-dir` had none |

## Declared refresh command

| Runner | Before | After |
| --- | --- | --- |
| harness post-edit hook | embedded raw in a shell line | unchanged |
| `refreshGraph` (close, ensure) | `split(' ')` as argv | run through a shell |

## Managed block

| File state | Before | After |
| --- | --- | --- |
| no markers | block appended | unchanged |
| one pair | contents replaced | unchanged |
| one marker only | refused, naming the file | unchanged |
| **two pairs** | first updated, second left | **refused, naming the file** |
| a throw at any call site | **the whole run stops** | that file's notice; the run continues |

## `doctor`'s hook verdict

| Our shim | Before | After |
| --- | --- | --- |
| absent | not installed | unchanged |
| present, runs multivac | installed, armed | unchanged |
| present, gutted to `exit 0` | **installed, armed** | not armed |
