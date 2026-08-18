# Implementation Plan: One page saying what is automatic, what is a gate, and what is yours

**Branch**: `the-flow-is-derived-from-what-was-declared` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

`doors` writes `.multivac/flow.md`, a managed block sorting this ecosystem's
obligations into three groups. Every row is rendered from the adapter registry
and the config — the same data the doors already render from — so the page
cannot describe behaviour the tool does not have.

It cites commands and artifacts and never an invariant identifier. That is the
correction the review forced: identifiers are allocated from each brain's own
table, and `init` writes a table with zero rows, so a generated identifier would
be wrong in every ecosystem except the one it was written in.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: `.multivac/flow.md`, generated.
**Testing**: `node:test`.
**Target Platform**: CLI.
**Project Type**: single project.
**Performance Goals**: unchanged — string assembly over parsed config.
**Constraints**: offline. Derived, never authored. Binds nothing.
**Scale/Scope**: one page.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-96 anchors the renderer and the write, and an `absent` leg keeps identifiers out of the generated text. |
| II | PASS | The page carries each unprovable step's reason **in the adapter's own words**, and says outright that it binds nothing and the law does. |
| III | PASS | MV-96 reserved and proposed. |
| IV | PASS | No network, no dependency; rendered from data already loaded. |
| V | PASS | Every row comes from a registry entry or a declaration. An unverified adapter is named as unknown with the fields to declare. |

**Post-design re-check**: unchanged. The one risk the review named — this page
becoming an unanchored second law table — is contained by rendering every row
from registry data and by refusing identifiers outright.

## Project Structure

```text
src/doors/flow.ts        # NEW — renderFlow(config)
src/commands/doors.ts    # writes .multivac/flow.md through the managed block
src/lib/config.ts        # FLOW_PATH
test/doors/flow.test.ts  # NEW
site/content/docs/reference/commands.md
```

**Structure Decision**: a new file beside `brain.ts` and `consumer.ts`, because
it is a third rendering of the same declarations and belongs with the other two.
The write goes through `applyManagedBlock`, which already preserves an
operator's own writing.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the page.
- [quickstart.md](./quickstart.md) — declare, project, read; change, re-project, diff.
