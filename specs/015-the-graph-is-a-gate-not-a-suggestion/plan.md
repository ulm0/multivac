# Implementation Plan: A declared grapher leaves a graph, or close refuses

**Branch**: `the-graph-is-a-gate-not-a-suggestion` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-the-graph-is-a-gate-not-a-suggestion/spec.md`

## Summary

Give the grapher the gate the SDD adapter has had since MV-56: `change close`
refuses while a declared, present root has no graph, and refuses when the
declared tool cannot be run at all. Two escape hatches in the SDD adapter's own
words — `--no-grapher` for one run, `grapher_auto: false` for good.

The second half is a deletion. `cmdClose` hand-rolls a scope list from the
repos the change touched, duplicating `graphScopes(brain, cfg)`, which already
enumerates the brain plus every declared, present repo. Replacing the local
list with the shared one makes the refresh reach everywhere, which is what
FR-014 asks for and what a graph an agent is told to trust requires.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM, NodeNext resolution)

**Primary Dependencies**: `yaml`, `picomatch` — the two the constitution pins. This feature adds none.

**Storage**: `.multivac/config.yml` for the declaration and the new automation switch; the graph artifact stays wherever the adapter declares it, uncommitted.

**Testing**: `node:test`, no frameworks. `pnpm test` compiles to `dist-test` and runs it.

**Target Platform**: CLI, macOS and Linux.

**Project Type**: single project — a CLI tool that is also its own brain.

**Performance Goals**: the gate costs one `stat` per root. The refresh it precedes is a local parse per root with no model call and no network.

**Constraints**: `verify`, `doctor` and `doors` stay offline and spawn no foreign tool — the gate lives in the change lifecycle only. No new runtime dependency. Nothing derived from an adapter's name.

**Scale/Scope**: an ecosystem of a brain plus a handful of declared repos.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1.*

| Principle | Verdict | How this design satisfies it |
|---|---|---|
| I — A claim nobody checks decays | PASS | MV-90 lands with anchors on the gate, the switches and the shared enumeration; MV-87 is amended in place to record that reaching every root is now required rather than attempted. |
| II — The tool never claims more than it checked | PASS | The heart of the feature. A gate that cannot be evaluated — binary absent — refuses instead of passing. An unverified adapter is reported with the fields to declare and gated on nothing, because requiring an artifact from a guessed command would be requiring something the tool never verified. The gate asks existence only, and the row says so, so it cannot be read as a freshness claim. |
| III — The law changes before the code | PASS | MV-90 is reserved and filed `proposed`; MV-87's amendment is dated and lands in this same change. |
| IV — Deterministic, offline, small | PASS | The gate runs in `close` alone. `verify`, `doctor` and `doors` are untouched, and MV-90 carries an `absent` leg over those three so it stays that way. No dependency added. |
| V — An invented integration is a lie | PASS | The gate reads the adapter's declared artifact, run command, binary and install hint from the registry entry or the operator's declaration. Nothing is derived from the tool's name, and an unverified name is reported rather than assumed. |

**Post-design re-check**: unchanged. One new function, one new config key mirroring an existing one, one flag, and a deletion.

## Project Structure

### Documentation (this feature)

```text
specs/015-the-graph-is-a-gate-not-a-suggestion/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli-output.md    # Phase 1 output — the CLI's contract is its output
├── checklists/
│   └── requirements.md  # Written by /speckit.specify
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── refresh.ts       # NEW graphGate(); graphScopes/ensureGraphs unchanged
│   └── registry.ts      # optional `ask:` on a grapher entry — its documented query verbs
├── doors/
│   └── brain.ts         # projectGraphLines(), beside projectLawLines()
├── commands/
│   ├── change.ts        # close calls the gate; its hand-rolled scope list is deleted
│   └── init.ts          # the door gains the grapher block when one is declared
├── lib/
│   └── config.ts        # grapher_auto, parsed the way sdd_auto already is
└── types.ts             # grapherAuto on Config

test/
└── change/
    └── grapher-gate.test.ts   # NEW — refusal, evaluability, out of scope, switches

site/content/docs/
├── reference/commands.md       # close's new refusal and --no-grapher
├── reference/configuration.md  # grapher_auto
└── reference/graphers-and-sdd.md  # the adapter now obliges something
```

**Structure Decision**: the existing layout. The gate lives beside the runner it
gates in `src/adapters/refresh.ts`, exactly as `sddGate` lives beside the SDD
runner in `src/adapters/sdd.ts`, so the two adapters stay symmetrical for a
reader who has learned one of them.

## Phase 0 — Research

See [research.md](./research.md). Five decisions, all resolved.

## Phase 1 — Design

- [data-model.md](./data-model.md) — the per-root verdict and which verdicts refuse.
- [contracts/cli-output.md](./contracts/cli-output.md) — the exact refusal, the skip notice and the surface.
- [quickstart.md](./quickstart.md) — runnable scenarios mapped to the success criteria.
