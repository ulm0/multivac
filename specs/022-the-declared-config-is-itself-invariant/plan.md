# Implementation Plan: A config change needs a change that declares it

**Branch**: `the-declared-config-is-itself-invariant` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

One diagnostic beside the enactment check, built the same way: read the index,
compare against the previous commit, decide. It gates.

The exemption turns out to be trivial rather than delicate, which the design was
braced for and grateful about: exactly one code path writes the configuration —
initialisation, and only when the file does not exist. So "created" is free and
"modified" is not, and there is nothing to spoof, because the rule reads what
the commit does rather than who claims to have done it.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: none added.
**Storage**: none.
**Testing**: `node:test`.
**Target Platform**: CLI, in the pre-commit hook.
**Project Type**: single project.
**Performance Goals**: two git reads, both local. It runs on every commit.
**Constraints**: offline; reads the index, never the working tree.
**Scale/Scope**: one file, one question.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-97 anchors the check and its refusal. |
| II | PASS | An unreadable index is reported unanswered rather than assumed clean, and the row states what the check cannot see: that the change is *about* the configuration, or that the edit is wise. |
| III | PASS | MV-97 reserved and proposed. |
| IV | PASS | Two local git reads, no network, no dependency. |
| V | PASS | No adapter touched. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/commands/verify.ts   # configLine(), beside enactmentLine()
test/verify/config-gate.test.ts   # NEW
site/content/docs/reference/configuration.md
```

**Structure Decision**: beside `enactmentLine`, because it is the same shape —
an index read that decides whether a commit may proceed — and a reader who has
understood one has understood the other.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [contracts/cli-output.md](./contracts/cli-output.md) — the line, in each state.
- [quickstart.md](./quickstart.md) — refuse, allow, and be born.
