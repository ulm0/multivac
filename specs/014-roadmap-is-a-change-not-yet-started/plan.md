# Implementation Plan: A roadmap item is a change that has not started yet

**Branch**: `roadmap-is-a-change-not-yet-started` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-roadmap-is-a-change-not-yet-started/spec.md`

## Summary

Add one state, `planned`, in front of the change lifecycle, plus a `horizon`
field and a `roadmap` command that lists planned changes and counts the ones in
flight. Starting a change whose slug is already planned promotes that file
rather than refusing it, and the invariant id is reserved at that moment and
not before.

The state is deliberately carried by the existing change file rather than by a
new artifact: same directory, same parser, same serializer, same git history.
Most of the work is therefore subtraction — a wider union on one field, a
guard on four entry points, and one new command file — not a new subsystem.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM, NodeNext resolution)

**Primary Dependencies**: `yaml`, `picomatch` — the two the constitution pins. This feature adds none.

**Storage**: `.multivac/changes/<slug>.md` — YAML frontmatter plus a prose body, already the change file's format

**Testing**: `node:test`, no frameworks. `pnpm test` compiles to `dist-test` and runs it.

**Target Platform**: CLI, macOS and Linux, run both by hand and from a pre-commit hook

**Project Type**: single project — a CLI tool that is also its own brain

**Performance Goals**: `verify` stays sub-second (Principle IV). `roadmap` reads one directory and parses only what it lists.

**Constraints**: no network, no model, no new runtime dependency, no third subprocess. `verify` enumerates through `git ls-files` rather than walking the tree.

**Scale/Scope**: tens of change files per brain; the roadmap is read by a human at a terminal.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1.*

| Principle | Verdict | How this design satisfies it |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-89 lands in this change with anchors on the code that implements each of its three properties, including an `absent` leg for the refusal that must never exist. |
| II — The tool never claims more than it checked | PASS | `roadmap` reports; it gates nothing. The one property that cannot be machine-proven — that an operator planned before building — is deliberately not asserted anywhere. |
| III — The law changes before the code | PASS | MV-89 is already reserved and filed `proposed`; its statement lands with the behaviour, and only a human enacts it. |
| IV — Deterministic, offline, small | PASS | Local reads and writes only. No dependency added. The change to `verify` is a widened skip on a status comparison it already performs, so its cost is unchanged. |
| V — An invented integration is a lie | PASS | No adapter is added. Tracker projection is explicitly a separate change, so nothing here promises an integration it has not verified. |

**Post-design re-check**: unchanged. The design adds one command file, one field,
one widened union and one guard helper. No violation to justify, so the
Complexity Tracking section is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/014-roadmap-is-a-change-not-yet-started/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli-output.md    # Phase 1 output — the CLI's contract is its output
├── checklists/
│   └── requirements.md  # Written by /speckit.specify
└── tasks.md             # Phase 2 output, written by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── change/
│   ├── file.ts          # ChangeFile: status union gains `planned`, new `horizon`
│   │                    # field, `assertStarted` guard, `scaffoldPlanned`
│   └── reserve.ts       # untouched — reservation stays where it is
├── commands/
│   ├── roadmap.ts       # NEW — the `roadmap` command: list and add
│   ├── change.ts        # cmdNew promotes a planned file; four steps guard
│   ├── verify.ts        # the open-only skip becomes deliberate, and tested
│   └── index.ts         # registers the new command
└── types.ts             # untouched — Command already describes this shape

test/
└── change/
    └── roadmap.test.ts  # NEW — the state, the listing, promotion, non-blocking

site/content/docs/
├── concepts/the-change.md   # the lifecycle gains a state in front of open
├── guide/running-changes.md # recording an intention, and starting it later
└── reference/commands.md    # the `roadmap` command, its flags and output

.multivac/
└── invariants.md        # MV-89 statement and anchors
```

**Structure Decision**: the existing layout, unchanged. Change-file concerns
live in `src/change/`, commands in `src/commands/`, one test file per feature
under `test/`. A new command is a new file in `src/commands/` plus one line in
the registry, which is the pattern every existing command follows.

## Phase 0 — Research

See [research.md](./research.md). Six decisions, all resolved; no
NEEDS CLARIFICATION carried forward.

## Phase 1 — Design

- [data-model.md](./data-model.md) — the change file's state machine and the
  horizon field, including what each state permits.
- [contracts/cli-output.md](./contracts/cli-output.md) — the exact lines
  `roadmap`, `roadmap add` and the promoting `change new` print, and the exact
  refusals. For a CLI the output IS the interface contract.
- [quickstart.md](./quickstart.md) — the runnable scenarios that prove the
  feature, mapped to the spec's success criteria.
