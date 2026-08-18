# Implementation Plan: The gate runs the code in this tree, not a copy of it

**Branch**: `the-gate-runs-what-you-built` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

Two edits, both small, both about the same thing: a check must run the code in
the tree it is checking.

The hook shim's runner order is inverted — it tries `mvac` on PATH first and the
repository's own build last. Reversing it is three moved blocks. The build does
not clear its output, so `tsc` leaves compiled tests whose sources are gone;
clearing the two output directories first is one script hook.

The second gets a real test rather than a string assertion about a script: the
suite checks that every compiled test in the output has a source in the tree.
That is the property, and it fails whether the cause is a missing clean, a
renamed file, or something nobody has thought of yet.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM). The shim is POSIX `sh`.
**Primary Dependencies**: `yaml`, `picomatch`. None added — FR-006 rules out reaching for a rimraf.
**Storage**: none.
**Testing**: `node:test`.
**Target Platform**: CLI, macOS and Linux; the clean must not assume a shell built-in.
**Project Type**: single project.
**Performance Goals**: a full rebuild each time, measured in seconds. An incremental build that can run a deleted test is not a saving.
**Constraints**: the shim must never block a commit when nothing runnable exists; the repository's own gates still run first and still win.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-92 anchors the runner order and the clean, and the stale-output property is a test rather than a comment. |
| II — The tool never claims more than it checked | PASS | This is that principle turned on the tool's own gate: a suite that runs a deleted test is a green nobody earned, and a hook running a different binary is a check about somewhere else. |
| III — The law changes before the code | PASS | MV-92 reserved and filed proposed. |
| IV — Deterministic, offline, small | PASS | No dependency, no network, no subprocess beyond what the shim already exec's. |
| V — An invented integration is a lie | PASS | No adapter touched. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/hooks/install.ts     # the shim text: runner order reversed, comment restated
package.json             # prebuild clears dist and dist-test
test/hooks/runner.test.ts   # NEW — order, fallthrough, and no orphan compiled test
site/content/docs/reference/hooks.md   # the documented order
```

**Structure Decision**: the shim is a string in `src/hooks/install.ts`; there is
no second place it lives. The clean is a `package.json` script hook rather than
a build tool change, because the projects are plain `tsc` invocations and adding
a build tool to delete two directories is the third dependency in disguise.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the shim's order and its one report.
- [quickstart.md](./quickstart.md) — both defects reproduced, then confirmed fixed.
