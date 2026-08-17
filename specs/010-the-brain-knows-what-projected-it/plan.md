# Implementation Plan: A brain knows what projected it

**Branch**: `the-brain-knows-what-projected-it` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

## Summary

Two small files and one shared notice.

```yaml
# .multivac/config.yml    — human-authored; the tool never writes this field
requires: ">=0.3.0"

# .multivac/projected.yml — tool-owned; a human never edits it
version: 0.3.0
```

`init` writes the record. **`doors --adopt`** moves it, and nothing else does.
Every command reads both, compares against its own version, and prints one
coloured line with the command that closes the gap. Nothing refuses.

## Technical Context

**Language/Version**: TypeScript, Node ≥ 24.

**Primary Dependencies**: **none added.** `yaml` is already a dependency and
parses the record; the comparison is three integers.

**Testing**: `node:test`. The registry walk from `unknown-args.test.ts` is
reused — it is the shape that catches the command nobody remembered.

**Performance Goals**: one small file read per run. `verify` stays sub-second.

**Constraints**: no network (MV-01) — the comparison is the binary in hand
against two files on disk, never the registry. `verify` must not write (FR-008).
No exit code moves (FR-007). Colour follows `src/lib/out.ts`, which already
respects `NO_COLOR` and a non-TTY.

## Constitution Check

| Principle | How this plan satisfies it |
| --- | --- |
| **I. A claim nobody checks decays** | The provenance of a projection was checked by nothing at all — that is the feature. MV-86 anchors it, and the registry-walking test covers the tenth command. |
| **II. The tool never claims more than it checked** | The record says **which version projected this**, not that the projection is intact: a hand-edited door leaves it just as fresh. Provenance, not integrity, and the row says so rather than letting the stronger reading stand. The notice likewise never claims to know what changed between two versions — that is the upgrade ledger, deliberately a later change, and this row does not gesture at it as though it were here. |
| **III. The law changes before the code** | MV-86 is reserved `proposed` and stated in the same change. |
| **IV. Deterministic, offline, small** | Nothing asks npm what exists. No dependency: a semver **range** grammar is a parser, so the floor accepts only `>=X.Y.Z` — a floor gets a floor's grammar, and anything else is refused by name (MV-85's rule applied to a config field). |
| **V. An invented integration is a lie** | No adapter touched. |

**Verdict: no violations.**

## Project Structure

```text
src/lib/version.ts                      # NEW — read, compare, and phrase the notice
src/commands/init.ts                    # writes the record at creation
src/commands/doors.ts                   # --adopt moves it; bare doors does not
src/cli.ts                              # one call site: every command, one place
.multivac/projected.yml                 # NEW — this repo's own record
.multivac/config.yml                    # the floor, documented, commented out
test/cli/version-skew.test.ts           # NEW — registry walk + the write rules
```

**Structure Decision**: the notice is emitted from the dispatcher rather than
added to nine commands. Nine call sites is nine chances to forget, and the
defect that opened MV-85 was exactly that. One call in `main()` covers every
command including the tenth, and it happens before the command runs so a slow
command still prints it immediately.

## Complexity Tracking

> No Constitution Check violation. Table intentionally empty.
