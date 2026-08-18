# Implementation Plan: A seeded ritual, and a line that a check can make true belongs in the check

**Branch**: `the-ritual-is-seeded-and-its-checkable-lines-become-law` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

The ritual template becomes a function of what was declared, emitting commented
candidates. Nothing else about writing it changes: it is still write-if-missing,
because it is authored.

This repository's own ritual then loses the lines that other mechanisms already
enforce, keeps the ones nothing can decide, and gains one that names where each
moved obligation went. The merge-request template's landing-order prompt gets an
anchor, because the template already asks for it and the law only covered half.

The docs gate is deliberately absent. Its reason is recorded in the change body:
it would read a diff that is empty by construction in the only state the closing
step can run in.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: `.multivac/ritual.md`, authored, write-if-missing.
**Testing**: `node:test`.
**Target Platform**: CLI.
**Project Type**: single project.
**Performance Goals**: unchanged.
**Constraints**: an existing ritual is never overwritten. A commented line never prints.
**Scale/Scope**: one template builder and one repository's own ritual.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-98 anchors the seed builder and the parse that keeps comments out of the printed checklist. |
| II | PASS | The centre: what is left in the ritual is what nothing can check, and the row says which obligations moved and which did not. |
| III | PASS | MV-98 reserved and proposed; MV-34's anchor widened in the same change. |
| IV | PASS | No network, no dependency. |
| V | PASS | Candidates are drawn from declarations, never from an adapter's name. |

**Post-design re-check**: unchanged. The one thing the review killed stays
killed.

## Project Structure

```text
src/lib/ritual.ts        # RITUAL_TEMPLATE becomes ritualSeed(config)
src/commands/init.ts     # passes the config; still write-if-missing
.multivac/ritual.md      # this repo's own, rewritten to what nothing can check
.multivac/invariants.md  # MV-98; MV-34's template anchor widened
test/change/ritual.test.ts   # extended
site/content/docs/concepts/the-change.md
```

**Structure Decision**: the seed stays in `src/lib/ritual.ts` beside the parser
that reads it back, so the two halves — what is written and what is printed —
are read together.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the seeded file and what prints.
- [quickstart.md](./quickstart.md) — initialise, close, uncomment, close.
