# Implementation Plan: init says what it ignored

**Branch**: `init-says-what-it-ignored` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

`init` resolves each adapter as `flag ?? config`. On a first run that is right —
the flag is what wrote the config a moment earlier. On a re-run the config is
authoritative and the flag is a request the command has already decided not to
honour, so the same expression means two different things two lines apart, and
the door ends up naming a tool the law does not declare.

One resolution point, one refusal, one report. The fix is small; the reasoning
about which side wins is the whole change.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: `yaml`, `picomatch`. None added.
**Storage**: `.multivac/config.yml`, unchanged by this feature in every path.
**Testing**: `node:test`. `pnpm test` builds then runs `dist-test`.
**Target Platform**: CLI, macOS and Linux.
**Project Type**: single project.
**Performance Goals**: unchanged — one config read that already happens.
**Constraints**: a refusal must write nothing, which means the check runs before the first write, not beside the door.
**Scale/Scope**: one command, two adapter keys.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-91 anchors the refusal, the report and the config-first resolution. |
| II — The tool never claims more than it checked | PASS | The heart of it: a flag the command will not honour is refused rather than dropped. Agreement is silent because there is nothing to claim. |
| III — The law changes before the code | PASS | MV-91 filed proposed; MV-70 touched, since it is the row that made `init` project what it declares. |
| IV — Deterministic, offline, small | PASS | One extra comparison against a config already loaded. |
| V — An invented integration is a lie | PASS | No adapter data is derived; the check compares two declared strings. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/commands/init.ts     # the disagreement check, before any write; the report
test/init/reinit.test.ts # NEW — refusal, silence on agreement, first-run intact
site/content/docs/
├── reference/commands.md   # what a re-run does, key by key
└── guide/install.md        # re-running is safe, and what it will refuse
```

**Structure Decision**: the check lives in `init.ts` beside the config branch it
depends on, before the door is written. There is no second module: the whole
change is a comparison and two messages.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [data-model.md](./data-model.md) — declared vs requested, and which wins when.
- [contracts/cli-output.md](./contracts/cli-output.md) — the refusal and the report.
- [quickstart.md](./quickstart.md) — the two-run reproduction, and the fix confirmed.
