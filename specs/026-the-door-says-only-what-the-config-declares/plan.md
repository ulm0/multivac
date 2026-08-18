# Implementation Plan: The door says only what the config declares

**Branch**: `the-door-says-only-what-the-config-declares` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

`init` resolves the door's SDD as `declared?.sdd ?? f.sdd`. MV-91 justified that
ordering as belt and braces — safe because a disagreeing flag is refused above
it. That holds where the config DECLARES an adapter. Where it declares none,
`declared?.sdd` is undefined, the `??` falls through, and the flag reaches the
door in the same run that reported it as unanswered. `doors`, which reads the
config alone, removes the block on its next run.

One operator changes. The reasoning about which side wins is already law; this
closes the row it did not reach.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: `.multivac/config.yml`, never written by this path.
**Testing**: `node:test`. `pnpm test` builds then runs `dist-test`.
**Target Platform**: CLI, macOS and Linux.
**Project Type**: single project.
**Performance Goals**: unchanged.
**Constraints**: the report, the refusal and the first run are untouched.
**Scale/Scope**: one expression, one test, one law row plus one amendment.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-101 anchors the resolution and the agreement test. |
| II — The tool never claims more than it checked | PASS | The report said the flag did not take effect; after this it is true. |
| III — The law changes before the code | PASS | MV-101 filed proposed; MV-91 amended in place, dated, where its prose called the ordering belt and braces. |
| IV — Deterministic, offline, small | PASS | One expression; no new read, no new call. |
| V — An invented integration is a lie | PASS | Nothing is derived from an adapter's name; a declared string is read or it is not. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/commands/init.ts       # the resolution: config when there is a config
test/init/reinit.test.ts   # the two commands write the same door
.multivac/invariants.md    # MV-101 stated, MV-91 amended
```

**Structure Decision**: no new module. `doors` already reads the config and is
not touched — making `init` read what `doors` reads is the whole change, and a
shared helper for one expression would hide the rule rather than state it.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [data-model.md](./data-model.md) — the resolution table, one row changing.
- [contracts/cli-output.md](./contracts/cli-output.md) — nothing printed moves.
- [quickstart.md](./quickstart.md) — the two-command reproduction.
