# Implementation Plan: The gate speaks the channel the harness reads

**Branch**: `the-gate-speaks-the-channel-the-harness-reads` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

`src/doors/settings.ts` projects one command for both harness events. The two
events read back on opposite channels, so one command cannot serve both, and
the one that is projected serves neither. Split it in two, widen the exact
ownership set so an existing brain upgrades in place, and re-project this
repository's own settings with the tool rather than by hand.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Storage**: `.claude/settings.json` in each repo with the `claude` door

**Testing**: `node:test`. `test/doors/settings.test.ts` (the merge),
`test/doors/doors.test.ts` (the projection), plus a new runnable proof that
executes the projected strings against a stub on a constructed PATH

**Target Platform**: the Claude Code harness

**Project Type**: single project

**Constraints**: exact-identity ownership (MV-74); a user's matcher and a
foreign hook are never touched; idempotent; no new CLI surface

**Scale/Scope**: one module, its two test files, two site pages, and this
repo's own projected settings

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-112, anchored to the two constants and to the runnable proof |
| II — The tool's own failure mode | Reports success it did not check? | PASS — it ends a gate that reported nothing at all |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency, no network | PASS — three strings and a predicate |
| V — An invented integration is a lie | Adapter data stays data | PASS — the registry entry keeps its shape; only the projected command changes |
| Engineering: tests ship with behaviour | Pinned, and not by reading the string | PASS — the proof runs the command |
| Engineering: no host dependency | — | PASS — the stub's PATH is constructed, never inherited |

Post-design re-check: unchanged.

## Project Structure

### Source Code (repository root)

```text
src/doors/settings.ts          # two gate commands, one widened ownership set
test/doors/settings.test.ts    # the merge, the upgrade, and the runnable channel proof
test/doors/doors.test.ts       # the projected command
site/content/docs/reference/   # hooks.md and integrations.md quote what is projected
.claude/settings.json          # re-projected by the tool, committed here
```

**Structure Decision**: single project. No file is added under `src/`.

## Complexity Tracking

No Constitution Check violation.
