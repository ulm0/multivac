# Implementation Plan: One binary lookup

**Branch**: `one-binary-lookup` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

Two rules find an adapter's binary, neither knows PATHEXT, and a failed vendor
command is quoted by its first three lines (research R1, R7). After this change:

- `findBinary(bin, root, env?)` in `src/adapters/detect.ts` is the one lookup:
  PATH, with PATHEXT on win32, then `<root>/node_modules/.bin`. The surfaces ask
  it through `missingRequired(spec, root)`, and `binaryPresent` goes (R1, R2).
- Each registry entry declares `required` (R3). `binaryMissing` renders the one
  missing-binary line, with the install line and `source` (R5). The speckit
  scaffold passes `--ignore-agent-tools` (R6).
- What runs is what was found. `toolVerdict` executes the found path, and the
  close refresh and the post-edit hook append the root's `node_modules/.bin`
  to PATH (R4).
- `quoteFailure(err)` in `src/lib/out.ts` quotes a failure by its cause, for
  the scaffold, the validator and the refresh (R7).
- Every call site keeps its outcome and exit code (R5). That binds this change
  only: MV-123 leaves each outcome to the row governing its call site.

MV-123 states the rule with fourteen legs, dry-run at `6833eac` (R10). Six rows
get notes (R9).

## Technical Context

**Language/Version**: TypeScript (Node ≥ 20), Markdown, and the anchor dialect (POSIX ERE, per line)

**Primary Dependencies**: none added (MV-02 stays at three)

**Storage**: tracked files only (Project Structure)

**Testing**: `node:test`. The new `test/change/binary-lookup.test.ts` runs its
cross-surface cases on a PATH it builds (`<bin>:/usr/bin:/bin`). `findBinary`
takes an explicit `env`, so win32 is tested on any host. `quoteFailure` is
tested against recorded spec-kit 1.0.6 and graphify 0.9.29 output. Four test
files lose their host PATH (R8). `verify --strict` checks the legs, and a bite
run follows (R12).

**Target Platform**: the CLI and the documentation site

**Project Type**: single project (CLI)

**Performance Goals**: one `stat` and one `access` per PATH entry per required binary, on surfaces that already probed

**Constraints**:
- FR-007: outcomes and exit codes are unchanged.
- MV-01: `verify`, `doctor` and `doors` spawn nothing new.
- `onPath` stays for MV-92's ladder, `preCommitGate` and the trackers.
- MV-75 :549, MV-115 :905 and MV-50 :294 must keep holding.
- Out of scope: `init` refusing, `--integration` following `doors:`, timeouts,
  telemetry opt-outs, and DESIGN.md:1234. MV-123 stays `proposed` (MV-81).

**Scale/Scope**: 10 source, 7 test and 5 doc files and the brain's `.claude/settings.json` are edited, and 3 test files are new. 7 law rows are touched (6 notes, 1 stated), with 14 legs added and 5 moved.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is every new rule anchored and every retired sentence legged? | PASS: 14 legs, including `absent` on the retired phrases, the old quote and non-lookup probes. The 5 legs naming replaced expressions move |
| II — Never claims more than it checked | Does anything outrun its check? | PASS: MV-50's "first stderr lines" is withdrawn. MV-123 names its ceilings: win32 never run, `.cmd` spawning, English cause words, the hook's `$PWD`, and spelling-only legs |
| III — Law changes before code | Does the row move first? | PASS: Phase 2 writes MV-123, its legs and the notes before any source edit |
| IV — Deterministic, offline, small | Any dependency, network or host reliance? | PASS: no dependency, no new subprocess on report surfaces, and every touched test builds its PATH |
| V — An invented integration is a lie | Does any surface name what it did not verify? | PASS: `source` prints only where recorded, and a declared grapher says it is declared. The flag note names 1.0.6 |
| Governance | Is the constitution touched? | PASS: not touched |
| Engineering — tests ship with behaviour | Does every behaviour change fail first? | PASS: each phase in tasks.md opens with its tests |

Post-design re-check: PASS. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/048-one-binary-lookup/
├── spec.md
├── plan.md
├── research.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md                         # MV-123 + 14 legs; notes on MV-50/52/66/75/90/115; legs :293 :295 :320 :478 :479 moved
src/adapters/detect.ts                          # findBinary, localBin, missingRequired; binaryPresent gone
src/adapters/registry.ts                        # required; binaryMissing; speckit argv + note (:445-457); :240, :683 comments
src/adapters/sdd.ts                             # toolVerdict (:150-185); runScaffold (:232-273); judgeSdd (:453-468)
src/adapters/refresh.ts                         # refreshGraph (:89-131); graphGate (:258, :268)
src/commands/doctor.ts                          # per-root lookup; binCache (:202, :284) gone
src/commands/doors.ts                           # projectInto (:187-193)
src/doors/settings.ts                           # refreshHookCmd (:62-84)
src/doors/brain.ts                              # MV-93 comment (:123-124): the lookup, not PATH alone
src/lib/out.ts                                  # quoteFailure
src/types.ts                                    # GrapherDecl.binary comment (:35)
test/helpers/recorded.ts                        # NEW: recorded vendor outputs, paths redacted
test/lib/out.test.ts                            # NEW: quoteFailure
test/change/binary-lookup.test.ts               # NEW: US1–US3 across doctor, apply, close, doors
test/doctor/adapters.test.ts                    # findBinary, required, binaryMissing (:37-49 replaced)
test/change/sdd-gates.test.ts                   # specify stub checks argv (:84-113, :887, :971); PATH :114; :431 :458 :752
test/change/grapher-refresh.test.ts             # PATH (:97-106); :136, :273
test/change/grapher-gate.test.ts                # :140
test/doctor/doctor.test.ts                      # :107, :143, :297
test/doors/doors.test.ts                        # :238-245 stub grapher instead of host node
test/doors/settings.test.ts                     # the hook reaches node_modules/.bin
DESIGN.md                                       # :1271, :1287
site/content/docs/reference/graphers-and-sdd.md # :12, :32, :90-91, :206, :250, :358-395, :503-510
site/content/docs/reference/commands.md         # :1246
skills/multivac/references/change.md            # :142, :180 (and the identical .claude/skills copy)
.multivac/changes/one-binary-lookup.md          # declaration + claim (written)
.claude/settings.json                           # the brain's own refresh hook, re-projected by `doors`
```

**Structure Decision**: single project. `test/helpers/recorded.ts` exists so
that two test files share the recordings without one importing the other.

## Complexity Tracking

No Constitution Check violation.
