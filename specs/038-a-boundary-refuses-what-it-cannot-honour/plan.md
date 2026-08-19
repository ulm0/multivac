# Implementation Plan: A boundary refuses what it cannot honour

**Branch**: `a-boundary-refuses-what-it-cannot-honour` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

## Summary

Four inputs the shared flag guard never reaches. `init` reads a broken config
as no config and re-projects from nothing; `loadConfig` accepts keys it does
not know; the `requires:` floor is invisible behind a comment; and an adapter
name is written to disk without being checked. Each is refused by name, and
`init` loses two of its three config loads.

## Technical Context

**Language/Version**: TypeScript 5.6, Node >= 24, ESM

**Primary Dependencies**: none added

**Storage**: `.multivac/config.yml`

**Testing**: `node:test` — `test/init/`, `test/lib/`, `test/cli/`

**Target Platform**: `init`, and every command that loads a config

**Project Type**: single project

**Constraints**: a refusal exits 2 and writes nothing; `loadConfig`'s existing
callers keep their failure mode; no dependency

**Scale/Scope**: `src/commands/init.ts`, `src/lib/config.ts`,
`src/lib/version.ts`, and their tests

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-114 pins each refusal and its test |
| II — The tool's own failure mode | Reports success it did not check? | PASS — it ends four |
| III — Law moves before code | Row first | PASS |
| IV — Deterministic, offline, small | No dependency | PASS — and `init` gets smaller by two loads |
| V — An invented integration is a lie | Adapter names come from the registry | PASS — the check reads the registry rather than a typed list |
| Engineering: tests ship with behaviour | Pinned | PASS |

## Project Structure

```text
src/commands/init.ts    # one load, absent vs broken, the adapter-name check
src/lib/config.ts       # a stray key is refused by name
src/lib/version.ts      # the floor survives a trailing comment
test/init/, test/lib/   # each refusal asserted
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
