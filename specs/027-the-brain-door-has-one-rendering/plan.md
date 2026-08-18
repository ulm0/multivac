# Implementation Plan: The brain door has one rendering

**Branch**: `the-brain-door-has-one-rendering` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

`init` carries `DOOR_BODY`, a hand-written copy of the brain door, and appends
its own SDD lines. `doors` calls `renderBrainDoor`, which builds the same
document from the config. The copy drifted where it hurts most: the door a
fresh brain gets never mentions the graph, and never lists the ecosystem — the
two things `renderBrainDoor` gained after it was written.

The change is a deletion. `init` renders through `renderBrainDoor`.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: unchanged.
**Testing**: `node:test`. `pnpm test` builds then runs `dist-test`.
**Target Platform**: CLI, macOS and Linux.
**Project Type**: single project.
**Performance Goals**: unchanged — one config read `init` already performs.
**Constraints**: MV-101 must stay true and stay anchored; the managed block is untouched.
**Scale/Scope**: one deletion, one call, one law row plus one amendment.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-102 anchors the single call site and the byte-equality test; MV-101's anchors move onto the surviving code. |
| II — The tool never claims more than it checked | PASS | The door stops describing an ecosystem the reader cannot see and starts naming the graph it is told to ask. |
| III — The law changes before the code | PASS | MV-102 filed proposed; MV-101 amended in place, dated. |
| IV — Deterministic, offline, small | PASS | Deletion plus one call; no new read, no new dependency. |
| V — An invented integration is a lie | PASS | Every line the door gains comes from a declaration; nothing is guessed. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/commands/init.ts       # DOOR_BODY deleted; renderBrainDoor called
test/init/reinit.test.ts   # the two commands write the same bytes
test/init/init.test.ts     # the scaffolded door names the declared grapher
.multivac/invariants.md    # MV-102 stated, MV-101 amended and re-anchored
```

**Structure Decision**: no new module and no new helper — the function that
renders this document already exists and is already the one every other door is
projected from. The change is that `init` stops having an opinion.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [data-model.md](./data-model.md) — the document, part by part, and who reads what.
- [contracts/cli-output.md](./contracts/cli-output.md) — no line moves; the file does.
- [quickstart.md](./quickstart.md) — the four scenarios.
