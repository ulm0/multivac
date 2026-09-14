# Implementation Plan: Managed repos

**Branch**: `managed-repos` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

multivac writes into every declared repo on disk and cannot be told that one is
not its own. After this change:

- `repos.<key>.managed` is a boolean that defaults to true. On the brain,
  `managed: false` is refused (R3).
- `readOnly(cfg, root, dir)` in `src/adapters/detect.ts` is the one answer:
  not managed, shallow, or nothing. The shallow question goes through
  `src/lib/git.ts` with the ambient environment dropped (R1, R2).
- `sddRoots` and `graphScopes` carry the answer:
  - the scaffold, the build, the refresh and the three gates skip a read-only
    root;
  - `doors` projects nothing there;
  - `doctor` and `repos` report it;
  - `repos sync --shallow` says the clone is read-only (R4).
- `change plan` and `change apply` refuse a change that names a read-only repo
  before anything moves (R5).

MV-125 states the rule with fourteen legs (R7, R8). Six rows get notes (R6).

## Technical Context

**Language/Version**: TypeScript (Node ≥ 20), Markdown, and the anchor dialect (POSIX ERE, per line)

**Primary Dependencies**: none added (MV-02 stays at three)

**Storage**: tracked files only (Project Structure)

**Testing**: `node:test`, with stubs on a built PATH and a `file://` depth-1 clone as the shallow sibling (R2). `verify --strict` checks the legs, then a bite run

**Target Platform**: the CLI and the documentation site

**Project Type**: single project (CLI)

**Performance Goals**: no spawn for the brain or for `managed: false`. One `git rev-parse` per present sibling per enumeration, 4.2 ms each (R1)

**Constraints**:
- FR-010: without a read-only sibling, every output, exit and write is
  byte-identical, so flow.ts is untouched.
- MV-87's `out of scope, not a gap` stays unique, and MV-50's `never spawns
  git` stays. MV-125 stays `proposed` (MV-81).

**Scale/Scope**: 11 source, 7 test and 9 doc files are edited, and 1 test file is new. 7 law rows are touched (6 notes, 1 stated), with 14 legs added.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is every new rule anchored and every retired sentence legged? | PASS: 14 legs, including `each` on the seven surface files, a count on the five write and gate skips, and `absent` on other readers and the 19 retired spellings |
| II — Never claims more than it checked | Does anything outrun its check? | PASS: MV-125 states its ceilings (R8), and the copies that overstate reach change |
| III — Law changes before code | Does the row move first? | PASS: Phase 2 writes MV-125, its legs and the notes before any source edit |
| IV — Deterministic, offline, small | Any dependency, network or host reliance? | PASS: no dependency, and the read is local. Tests build PATH and clone `file://` |
| V — An invented integration is a lie | Does any surface name what it did not verify? | PASS: git's flag was measured on 2.55.0 (R2) |
| Governance | Is the constitution touched? | PASS: not touched |
| Engineering — tests ship with behaviour | Does every behaviour change fail first? | PASS: each phase in tasks.md opens with its tests |

Post-design re-check: PASS. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/050-managed-repos/
├── spec.md
├── plan.md
├── research.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md                          # MV-125 + 14 legs; notes MV-50/56/87/90/103/122
src/types.ts                                     # RepoEntry.managed (:42)
src/lib/config.ts                                # :222 :227 :238-250; brain refusal :395-409
src/lib/git.ts                                   # isShallow beside inHead (:327)
src/adapters/detect.ts                           # :1-4; readOnly after :65; SddRoot :20-30; sddRoots :86-102
src/adapters/refresh.ts                          # :1-3; GraphScope :149-170; ensureGraphs :173-189; graphGate :205 :261-266
src/adapters/tracked.ts                          # :24 :57-59
src/adapters/sdd.ts                              # :240; sddGate :325-333; judgeSdd :378-386
src/commands/change.ts                           # refuseReadOnly (:127); :658 :736; close refresh :1095-1105
src/commands/doctor.ts                           # :63-64 :204-208 :257-262 :289-295 :349-370; pinsLine :438
src/commands/doors.ts                            # :1-3 :318-336 :359-362
src/commands/repos.ts                            # :35-39 :84 :112
test/change/managed-repos.test.ts                # NEW: US1–US5, US6 AS2
test/lib/config.test.ts                          # FR-001, FR-002
test/lib/git-env.test.ts                         # isShallow ignores GIT_DIR
test/repos/sync.test.ts                          # :86-104
test/change/{grapher-gate,grapher-refresh,sdd-gates}.test.ts  # :1, :241, :881 comments (MV-111)
test/helpers/fixture.ts                          # shallowClone: a file:// depth-1 clone (R2)
DESIGN.md                                        # :876-877 :1043 :1208 :1222 :1256
site/content/docs/reference/configuration.md     # ### `repos.<key>.managed` after :259; :429-452
site/content/docs/reference/commands.md          # :644-652 :763-806 :1232 :1277
site/content/docs/reference/graphers-and-sdd.md  # :334 :441 :495 :558
site/content/docs/reference/hooks.md             # :54
site/content/docs/reference/integrations.md      # :9-10
site/content/docs/guide/session-zero.md          # :128-130
skills/multivac/references/change.md             # :140 :154 (and the .claude/skills copy)
.multivac/changes/managed-repos.md               # declaration + claim (written)
```

**Structure Decision**: single project, no new source file (R1).

## Complexity Tracking

No Constitution Check violation.
