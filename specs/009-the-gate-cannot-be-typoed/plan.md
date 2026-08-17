# Implementation Plan: The gate cannot be typoed

**Branch**: `the-gate-cannot-be-typoed` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

## Summary

One shared refusal, used by the three commands that swallow arguments, plus a
two-line fix to the fourth that refuses with the wrong code. The five commands
that already refuse correctly are not touched. What makes the rule hold for the
tenth command is not the helper — it is a test that walks the command registry.

MV-85 states the behaviour, not the mechanism, so a command may keep its own
argv loop as long as it refuses.

## Technical Context

**Language/Version**: TypeScript, Node ≥ 24.

**Primary Dependencies**: none added. The law pins two (`yaml`, `picomatch`) and
this adds no third — an argument parser is exactly the kind of dependency that
would be reached for here and is not needed for surfaces this small.

**Testing**: `node:test`, no frameworks. The registry-walking test is the
deliverable that outlives this change.

**Target Platform**: the CLI.

**Performance Goals**: the check is a loop over `argv` — at most a handful of
strings. `verify` stays sub-second.

**Constraints**: the refusal must precede every side effect (FR-004). Exit codes
must match the documented matrix rather than the matrix being edited (SC-006).
English everywhere. Nothing lands on `main` directly.

**Scale/Scope**: one new lib file, four command files touched, one test file,
one law row.

## Constitution Check

| Principle | How this plan satisfies it |
| --- | --- |
| **I. A claim nobody checks decays** | The exit matrix in `reference/commands.md` has documented `2` for a usage error since it was written, and three commands have never done it. Prose stated the rule and nothing checked it. MV-85 anchors the behaviour and a test walks the registry, so the claim stops depending on the next author remembering. |
| **II. The tool never claims more than it checked** | This *is* that principle: `doctor --sttrict` reporting exit 0 is the tool claiming it asserted the gate was armed when it only described it. The row states the ceiling too — the check knows what a command *declares*, so a command that declares a flag and then ignores it is still lying, and no test here catches that. Named rather than implied. |
| **III. The law changes before the code** | MV-85 is reserved `proposed` by `change new` and is stated in the same change as the fix. It stays `proposed`; only a human enacts. |
| **IV. Deterministic, offline, small** | No network, no model, no new dependency, no measurable cost. The helper is ten lines and the alternative — a real argument parser — is refused on the ladder, not on taste. |
| **V. An invented integration is a lie** | No adapter touched. |

**Verdict: no violations.**

## Project Structure

```text
src/lib/args.ts                       # NEW — the one refusal
src/commands/doctor.ts                # flags [--strict], no positional
src/commands/doors.ts                 # no arguments at all
src/commands/seed.ts                  # no flags, [dir]
src/commands/init.ts                  # refuses already; returns 2 instead of throwing
test/cli/unknown-args.test.ts         # NEW — walks the registry
.multivac/invariants.md               # MV-85 + legs
site/content/docs/reference/commands.md   # the exit matrix line, now true for init
```

**Structure Decision**: `src/lib/` already holds the small shared helpers
(`out.ts`, `config.ts`, `banner.ts`); the refusal belongs beside them rather
than in a new directory. No command is restructured.

## Complexity Tracking

> No Constitution Check violation. Table intentionally empty.
