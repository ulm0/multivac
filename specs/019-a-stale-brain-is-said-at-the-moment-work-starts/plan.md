# Implementation Plan: A stale mount is said when work starts

**Branch**: `a-stale-brain-is-said-at-the-moment-work-starts` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

`stalenessLines` already computes this, offline, and the verifier already prints
it. Export it and call it from the two moments work starts. That is the change.

The design question is report-or-refuse, and the answer is report: offline, a
pin behind its channel may mean somebody landed work or may mean nobody fetched,
and refusing on the second reading fails an ordinary morning. Blocking stays
where an operator already opts into it.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: `yaml`, `picomatch`. None added.
**Storage**: none.
**Testing**: `node:test`.
**Target Platform**: CLI.
**Project Type**: single project.
**Performance Goals**: one gitlink read and one rev-parse per declared repo, all local.
**Constraints**: offline. The report says what was last fetched, never what exists remotely, and the row says so.
**Scale/Scope**: a brain plus a handful of declared repos.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-94 anchors the two call sites and the export. |
| II | PASS | The report states its own limit — an unresolvable channel is reported as uncomparable, and every line carries how long ago this machine fetched. |
| III | PASS | MV-94 reserved and proposed. |
| IV | PASS | No network, no dependency; the computation is the one already used in the sub-second verify path. |
| V | PASS | No adapter touched. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/commands/verify.ts   # stalenessLines exported
src/commands/change.ts   # cmdNew and cmdApply report it
test/change/staleness-at-start.test.ts   # NEW
site/content/docs/reference/commands.md  # what new and apply now report
```

**Structure Decision**: the computation stays in `verify.ts`, where it lives
beside the other offline reads. Moving it would touch more files than exporting
it, and a second implementation is the thing being avoided.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the lines, and their silence.
- [quickstart.md](./quickstart.md) — a pin driven behind, then caught up.
