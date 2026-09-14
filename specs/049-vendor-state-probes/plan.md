# Implementation Plan: Vendor state probes

**Branch**: `vendor-state-probes` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

Seven surfaces decide a vendor is initialised because a path is there. The
tracked gate reads the index, and no vendor run carries the opt-outs the
registry names (research R1, R4, R5, R7). After this change:

- `initState(spec, dir)` in the new `src/lib/init-state.ts` is the one probe.
  It reads files only, and it answers installed, missing, partial or
  unevaluable, with a reason (R1).
- Each entry declares `state`, `shared`, `local`, `ignore` and `env`. A grapher
  also declares `artifactKind`, and graphify declares `graphignore` (R2, R3).
- All seven surfaces ask the probe. `artifactPresent`, `heldArtifact` and
  `SddScaffold.artifact` go (R2, R4).
- The tracked gate asks `inHead` for shared artifacts only. codegraph's artifact
  becomes `.codegraph/codegraph.db`, which is local (R5, R6).
- Every vendor run spreads `spec.env`, and the post-edit hook exports it (R7).

MV-124 states the rule with twenty-one legs: fifteen dry-run at `1b3ad92`,
and six added after review on the skips, the probe's `expect` and doors' `env`
(R10). Eight rows get notes, and six legs move (R9, R10).

## Technical Context

**Language/Version**: TypeScript (Node ≥ 20), Markdown, and the anchor dialect (POSIX ERE, per line)

**Primary Dependencies**: none added (MV-02 stays at three)

**Storage**: tracked files only (Project Structure)

**Testing**: `node:test`.
- `test/lib/init-state.test.ts` runs every shipped adapter's four layouts, an
  unreadable state file and a declared grapher, with PATH empty.
- `test/change/vendor-state.test.ts` runs the five measured cases across
  `change new`, `change apply`, `change close`, `doctor` and `doors`, with
  stubs on a PATH it builds that record their runs and environment.
- `verify --strict` checks the legs, and a bite run follows (R12).

**Target Platform**: the CLI and the documentation site

**Project Type**: single project (CLI)

**Performance Goals**: one `lstat` and `stat` per state file, and one read and `JSON.parse` for a JSON check. This brain's 4.47 MB `graph.json` parses in 27 ms (R1)

**Constraints**:
- MV-01: `verify`, `doctor` and `doors` spawn no vendor tool, and the probe
  spawns nothing.
- Exit codes are unchanged, except two new refusals: a staged-only graph, and a
  graph still partial after the build.
- No command writes an ignore file, commits a shared path or runs a new init
  (US6 AS5).
- Out of scope: the change file's list, and the door's sentence about
  committing a shared graph (R6). MV-124 stays `proposed` (MV-81).

**Scale/Scope**: 12 source, 10 test and 6 doc files are edited, and 1 source and 2 test files are new. 9 law rows are touched (8 notes, 1 stated), with 21 legs added and 6 moved.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is every new rule anchored and every retired sentence legged? | PASS: 21 legs, including `absent` on the old probes, the index read and the retired phrases, and `unique` on each skip that keeps a partial root from being re-initialised. The 6 legs naming replaced expressions move |
| II — Never claims more than it checked | Does anything outrun its check? | PASS: MV-121's "never claims multivac applies one" is withdrawn for declared `env`. MV-124 names its ceilings: pre-0.16.4 spec-kit, codegraph and OpenSpec layouts reproduced by stubs, `CODEGRAPH_DIR`, a parseable non-graph, HEAD rather than the integrated ref, and spelling-only legs |
| III — Law changes before code | Does the row move first? | PASS: Phase 2 writes MV-124, its legs, the notes and the moved legs before any source edit |
| IV — Deterministic, offline, small | Any dependency, network or host reliance? | PASS: no dependency, the probe reads files only, `doctor` adds one local `git cat-file`, and every touched test builds its PATH |
| V — An invented integration is a lie | Does any surface name what it did not verify? | PASS: each state file is one a named version writes (R1, R2). codegraph declares no graph-ignore lines because none was verified |
| Governance | Is the constitution touched? | PASS: not touched |
| Engineering — tests ship with behaviour | Does every behaviour change fail first? | PASS: each phase in tasks.md opens with its tests |

Post-design re-check: PASS. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/049-vendor-state-probes/
├── spec.md
├── plan.md
├── research.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md                         # MV-124 + 21 legs; notes on MV-52/62/75/87/90/103/113/121; legs :671 :811 :812 :814 :815 :891 moved
src/lib/init-state.ts                           # NEW: initState, InitState, stateLabel
src/adapters/registry.ts                        # StateProbe; state/shared/local/ignore/graphignore/artifactKind/env (:236-299); SddScaffold.artifact gone (:205-206, :455); entries :384 :446 :592 :624; declared base :671-682; notes :443 :643
src/adapters/detect.ts                          # artifactPresent gone (:18-27)
src/adapters/sdd.ts                             # toolVerdict env (:164); runScaffold (:229-283); project-document roots (:542-545)
src/adapters/refresh.ts                         # refreshGraph (:92, :120-123); ensureGraphs (:170-185); graphGate (:258-273)
src/adapters/tracked.ts                         # heldArtifact gone (:23-29); gate (:60-74) shared + installed + inHead
src/lib/git.ts                                  # isTracked (:317-328) becomes inHead
src/commands/doctor.ts                          # sddLines (:216-231); grapherLines (:296-324)
src/commands/doors.ts                           # installHookConfig passes env (:155-167, :244)
src/doors/settings.ts                           # refreshHookCmd(refresh, env) (:84-90); merge opts (:239, :276)
src/doors/flow.ts                               # :73 renders stateLabel(spec)
src/doors/brain.ts                              # :72-76 a local artifact's door says never commit it
src/commands/change.ts                          # comments: ensureGraphs' probe (:119), the tracked gate (:990-992)
test/lib/init-state.test.ts                     # NEW: US1
test/change/vendor-state.test.ts                # NEW: US2–US5 across new, apply, close, doctor, doors
test/helpers/recorded.ts                        # SPECKIT_INTEGRATION_JSON (this brain's 0.16.4 file)
test/doctor/adapters.test.ts                    # registry values (US5 AS1, US6); :188-201 declared grapher via initState
test/change/sdd-gates.test.ts                   # stub writes integration.json (:104-106); :885-916 web partial
test/doctor/doctor.test.ts                      # :103 :140 :148-151 :240-253 :303 :310
test/change/grapher-tracked.test.ts             # staged-only refused; :86-99 :120-121 :138 :187-215
test/change/per-root.test.ts                    # :317 :321 :332 :354
test/change/grapher-gate.test.ts                # :77 comment says committed
test/change/binary-lookup.test.ts               # :58 stub overwrites graph.json
test/change/ledger.test.ts                      # :69 :89 installed fixtures
test/doors/settings.test.ts                     # hook exports env; no env, same bytes
DESIGN.md                                       # :1287-1288
site/content/docs/reference/graphers-and-sdd.md # :30-41 :103-112 :188 :196-206 :313-340 :354-355 :383-433
site/content/docs/reference/commands.md         # :686-687 :1254-1267
site/content/docs/reference/configuration.md    # :141 :483-484
skills/multivac/references/change.md            # :142-146 (and the identical .claude/skills copy)
.multivac/changes/vendor-state-probes.md        # declaration + claim (written)
```

**Structure Decision**: single project. The probe is its own file so that one
`absent` leg can hold it to reading files (R1).

## Complexity Tracking

No Constitution Check violation.
