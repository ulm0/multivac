# Implementation Plan: Issues from the change files, one way

**Branch**: `the-roadmap-projects-to-a-declared-tracker` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

A third adapter kind, built the way the other two are: an entry per tracker
carrying the vendor's own commands, a root-level declaration, and a command that
runs it. `roadmap sync` is the only thing in the tool that reaches a tracker.

The identity is the issue number, written into the change file's frontmatter.
That is what makes a second run update instead of duplicate, and it is why the
number rather than a link: the project comes from the repository's remote, so a
link would have to be parsed back into a number on every run.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: `yaml`, `picomatch`. None added — the vendor's CLI does the talking, which already solves authentication.
**Storage**: `issue:` in the change file's frontmatter.
**Testing**: `node:test`, with the tracker's command stubbed on PATH.
**Target Platform**: CLI.
**Project Type**: single project.
**Performance Goals**: one subprocess per change that needs one.
**Constraints**: never from `verify`, `doctor` or `doors` — this reaches the network, and those three may not.
**Scale/Scope**: tens of changes.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-99 anchors the adapter entries, the sync, the recorded identity and the label namespace, plus an `absent` leg keeping it out of the offline commands. |
| II | PASS | An absent binary refuses rather than reporting success, and a recorded number whose issue is gone is reported rather than silently re-created. |
| III | PASS | MV-99 reserved and proposed. |
| IV | PASS | The offline three are untouched, and the `absent` leg is what keeps them that way. |
| V | PASS | Each entry carries the vendor's documented commands. A tracker with no entry is UNVERIFIED and gets none guessed. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/adapters/tracker.ts   # NEW — the entries and the runner
src/commands/roadmap.ts   # the `sync` subcommand
src/change/file.ts        # `issue?: number` on the change file
src/types.ts, src/lib/config.ts   # `tracker:`
test/change/tracker.test.ts   # NEW, with a stubbed CLI
site/content/docs/reference/{commands,configuration}.md
```

**Structure Decision**: a file of its own beside `sdd.ts` and `refresh.ts`,
because it is the third adapter and belongs where the other two are. The command
lives in `roadmap.ts` because that is what it projects.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the command's output and refusals.
- [quickstart.md](./quickstart.md) — declare, sync, sync again, close.
