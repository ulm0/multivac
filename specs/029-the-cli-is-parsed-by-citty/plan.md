# Implementation Plan: The CLI is parsed by citty

**Branch**: `the-cli-is-parsed-by-citty` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

Ten commands hand-roll their argument loops, and each states its surface twice —
once for the refusal, once in the loop that parses it. citty takes the parsing.
It does not take the refusal, because it does not perform one: measured, it
accepts undeclared flags and extra positionals in silence, which is MV-85's
defect. `undeclared()` runs first and reads the same declaration citty parses.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: `yaml`, `picomatch`, and now `citty` — 0.2.2, zero dependencies of its own, one package.
**Storage**: unchanged.
**Testing**: `node:test`. The existing suite is the acceptance criterion and is not edited.
**Target Platform**: CLI, macOS and Linux.
**Project Type**: single project.
**Performance Goals**: unchanged.
**Constraints**: MV-85's refusal, wording and exit 2 stay; MV-69's usage stays hand-written; the tarball allowlist stays.
**Scale/Scope**: one declaration per command, one derivation helper, ten loops deleted.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-104 anchors the declaration, the derivation and the order. |
| II — The tool never claims more than it checked | PASS | The refusal keeps running before the parser, so nothing is dropped in silence. |
| III — The law changes before the code | PASS | MV-104 filed proposed; MV-02 and MV-85 amended in place, dated. |
| IV — Deterministic, offline, small | PASS | citty is offline, deterministic, zero-dependency. "Small" is now three packages, and the constitution is amended to say so rather than being quietly outgrown. |
| V — An invented integration is a lie | PASS | Nothing is derived from a name; the declaration is data the command wrote. |

**Constitution amendment**: Engineering Constraints said "Two runtime
dependencies, yaml and picomatch, with an invariant pinning the number". It
becomes three, named, with the same invariant pinning it. `CONSTITUTION_VERSION`
bumps MAJOR: a constraint is redefined, not clarified.

**Post-design re-check**: unchanged.

## Project Structure

```text
src/lib/args.ts          # surfaceFrom(ArgsDef) — one declaration, two readers
src/commands/*.ts        # each declares ARGS; the loops go
package.json             # citty
.specify/memory/constitution.md
.multivac/invariants.md  # MV-104 stated, MV-02 and MV-85 amended
test/cli/args.test.ts    # the derivation, and the order
```

**Structure Decision**: no dispatcher rewrite. `--help` and command lookup are
already a lookup over a list, which is the part a framework would take over and
the part MV-69 keeps.

## Phase 0 — Research

See [research.md](./research.md) — including the probe that decided D1.

## Phase 1 — Design

- [data-model.md](./data-model.md) — the declaration, its two readers, the order.
- [contracts/cli-output.md](./contracts/cli-output.md) — nothing changes.
- [quickstart.md](./quickstart.md) — four scenarios.
