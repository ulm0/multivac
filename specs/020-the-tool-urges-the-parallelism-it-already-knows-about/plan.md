# Implementation Plan: The tool urges the parallelism it already knows about

**Branch**: `the-tool-urges-the-parallelism-it-already-knows-about` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

Two printed lines and one reworded instruction. Nothing is computed that was not
already computed, and nothing is gated.

`change apply` already builds the landing plan and already hands back one
checkout per repository. It names the checkouts and stops. The first stage's
repositories are, by the declaration's own meaning, free of ordering
dependencies on each other — so they are named as workable at once, with the two
boundaries attached.

The specification instructions already print per step. They describe the step in
the third person; they now also say to keep going, with the opt-out on the same
line. The chain was never in doubt — the lifecycle refuses to advance without
each artifact — so asking permission between steps buys nothing.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: none.
**Testing**: `node:test`.
**Target Platform**: CLI.
**Project Type**: single project.
**Performance Goals**: unchanged.
**Constraints**: print-only. Neither half can be verified, and the row says so rather than pretending.
**Scale/Scope**: one command's output and one instruction builder.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-95 anchors both lines and the reworded instruction. |
| II | PASS | The centre: both halves are declared ungateable **with their reason**, the way the registry already declares the SDD steps it cannot prove ran. Neither claims to have been followed. |
| III | PASS | MV-95 reserved and proposed. |
| IV | PASS | No network, no dependency, no extra computation. |
| V | PASS | The instruction text comes from the adapter registry, as it already does. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/commands/change.ts    # apply names the stage-1 repos and the boundaries
src/adapters/sdd.ts       # the instruction says to continue, with the opt-out
test/change/urging.test.ts   # NEW
site/content/docs/reference/commands.md
skills/multivac/references/change.md
```

**Structure Decision**: the parallel line is emitted where the checkouts are
handed back, because that is where the isolation it depends on becomes true.
The continue clause is built where every other step clause is built, so a new
adapter inherits it.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — both messages, exactly.
- [quickstart.md](./quickstart.md) — a two-repo stage, a one-repo stage, and the opt-out.
