# Implementation Plan: One resolver per root

**Branch**: `one-resolver-per-root` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

Twelve functions in nine source files decide for themselves which `sdd:` or
`grapher:` applies, and they disagree (research R1). One function decides it
now:

- **The resolver**: `adapterFor(cfg, root, kind)` in `src/adapters/detect.ts`
  takes the repo's own value first and the ecosystem's otherwise. The brain
  reads the declared entry whose path is the brain, and `none` is no adapter
  for both kinds. A pure sibling, `adaptersByRoot`, groups declared roots for
  the renderers.
- **The gate**: `sddGate` runs once per adapter over the present roots that
  resolve to it, and passes only when every adapter passes (R3). An adapter
  that only uncloned repos resolve refuses, naming them. The printed
  steps and flow.md render every resolved adapter, and name the roots when
  roots differ (R4).
- **`none`**: it never reaches `grapherSpec` or `sddSpec`. `doctor` reports a
  `none` grapher root as out of scope, and `graphers.none` is refused (R2).
- **The brain**: its own entry decides its graph, gate, refresh and door (R4).
- **`init --grapher`**: checked before `mkdir`, against the verified graphers
  plus `graphers:` in a readable config already there, and exits 2 otherwise
  (R5). `policy()` and `detect()` go (R6).

MV-122 states the rule, with seven legs dry-run at `5479c62` (R8). MV-50,
MV-56, MV-59, MV-87, MV-90 and MV-114 each get a note (R7).

## Technical Context

**Language/Version**: TypeScript (Node ≥ 20), Markdown, and the anchor dialect (POSIX ERE, per line)

**Primary Dependencies**: none added (MV-02 stays at three)

**Storage**: tracked files only (Project Structure)

**Testing**:
- `node:test`. Behaviour lands in the new `test/change/per-root.test.ts`, whose
  stubs sit on a PATH it builds (`<bin>:/usr/bin:/bin`, as coexist.test.ts:53
  does).
- The resolver, config, init and ritual assertions go in their existing files.
- No global-only assertion is edited (SC-004).
- `verify --strict` for the legs, and a bite run in a scratch clone (R10).

**Target Platform**: the CLI and the documentation site

**Project Type**: single project (CLI)

**Performance Goals**: `verify` stays sub-second. The legs add one glob of about 160 files and one over `src/**`.

**Constraints**:
- FR-011: with only top-level adapters, every surface's output is
  byte-identical, so the one-group path must be today's path.
- Roots are unchanged: runs, gates and `doctor` act on present roots, and
  doors, flow.md and steps render declared roots.
- These legs must keep holding (R5, R8):
  - MV-114 `unknown --\$\{key\}` absent, and MV-69 `grapherNames\.join` unique.
  - MV-87 `out of scope, not a gap` unique in doctor.ts.
  - MV-98 `ritualSeed\(declared \?\? f\)` unique.
  - MV-56's gate strings.
- Out of scope: binary lookup, `managed: false`, DESIGN's "notice, feature off,
  exit 0", and narrowing roots to the repos a change names. MV-122 stays
  `proposed` (MV-81).

**Scale/Scope**: 13 source, 6 test and 4 doc files are edited, and 1 test file is new. 7 law rows are touched (6 notes, 1 stated), with 7 legs added and 3 moved.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is every new rule anchored and every retired sentence legged? | PASS: MV-122 gets seven legs and a count on its six notes. The four retired sentences and five retired helper names get `absent` legs, and the three moved legs follow their expressions |
| II — Never claims more than it checked | Does anything outrun its check? | PASS: MV-114's false ceiling is WITHDRAWN. MV-122 names three ceilings: the read leg sees only dotted reads through five names; every in-scope adapter must hold proof until scope narrows; an unreadable config skips the name check |
| III — Law changes before code | Does the row move first? | PASS: Phase 2 writes MV-122, its legs and the notes before any source edit |
| IV — Deterministic, offline, small | Any dependency, network or host reliance? | PASS: no dependency. The resolver is pure, `verify`, `doctor` and `doors` run no new subprocess, and new tests build their PATH |
| V — An invented integration is a lie | Does any surface derive an adapter from a name? | PASS: `none` never reaches `grapherSpec` and cannot be declared. An unverified name keeps MV-59's notice |
| Governance | Is the constitution touched? | PASS: not touched |
| Engineering — tests ship with behaviour | Does every behaviour change fail first? | PASS: each phase in tasks.md opens with its tests |

Post-design re-check: PASS. No violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/047-one-resolver-per-root/
├── spec.md
├── plan.md        # this file
├── research.md    # measured readers, decisions, notes, leg dry-runs
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md                       # MV-122 row + 7 legs; notes on MV-50/56/59/87/90/114; legs :658, :659, :706 moved
src/adapters/detect.ts                        # adapterFor, adaptersByRoot, NO_ADAPTER; sddFor, NO_SDD, policy, detect gone; sddRoots via adapterFor
src/adapters/sdd.ts                           # sddGate per adapter group (:298-558), refusing a group with no present root; sddInstructions (:565-596)
src/adapters/refresh.ts                       # graphScopes via adapterFor (:150-158); graphGate silence check (:231)
src/adapters/tracked.ts                       # silence check (:54)
src/doors/brain.ts                            # grapherLines/sddLines take the resolved name; renderBrainDoor resolves the brain
src/doors/consumer.ts                         # adapterFor(config, repoKey, …) (:51-55)
src/doors/flow.ts                             # per-adapter rows, roots named when they differ (:53-101)
src/commands/doors.ts                         # projectInto grapher per root (:293, :324-326)
src/commands/doctor.ts                        # grapher out-of-scope line through the SDD line's helper (:196-201, :276-290)
src/commands/init.ts                          # --grapher vocabulary check before mkdir; comment :88-94
src/lib/config.ts                             # readConfig split from loadConfig; graphers.none refused; comment :242
src/lib/ritual.ts                             # spec candidate via adaptersByRoot (:39)
src/types.ts                                  # RepoEntry.sdd comment cites adapterFor
test/change/per-root.test.ts                  # NEW: US1–US3 on a constructed PATH
test/doctor/adapters.test.ts                  # resolver unit tests; policy/detect tests deleted
test/lib/config.test.ts                       # graphers.none refused
test/init/init.test.ts                        # --grapher typo, declared name, none, legacy brain
test/change/ritual.test.ts                    # spec candidate follows resolution
test/doors/ecosystem.test.ts                  # opted-out door has no SDD block (:118-130)
test/change/grapher-gate.test.ts              # grapher: none prints no "not verified" at close (:152-177)
DESIGN.md                                     # :1211 opt-out names both kinds and the brain entry; :1242 MV-56's copy of the gate's roots
site/content/docs/reference/commands.md       # :88 flag row; :691-692 doctor rows; init refusal
site/content/docs/reference/configuration.md  # none for both kinds; graphers.none; brain entry
site/content/docs/reference/graphers-and-sdd.md # :232 resolution; the gate judges each adapter in its roots
.multivac/changes/one-resolver-per-root.md    # declaration + claim (already written)
```

**Structure Decision**: single project. The one new test file exists because
sdd-gates.test.ts puts the host PATH behind its stubs (sdd-gates.test.ts:114).

## Complexity Tracking

No Constitution Check violation.
