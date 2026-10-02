# Implementation Plan: multivac keeps no code graph

**Branch**: `081-drop-graphers` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/081-drop-graphers/spec.md`

## Summary

Every grapher path goes from the tool: four modules whole (`src/adapters/refresh.ts`,
`src/adapters/tracked.ts`, `src/doors/ecosystem.ts`, `src/lib/json-splice.ts`) and the grapher
half of 23 more — the registry's entries and fields, the config types, `init --grapher`, the
equip of a grapher and its harness installs, the door and flow lines, the refresh hook, the
apply index and `info/exclude` line, land's graph commit, close's two graph gates and refresh,
`--no-grapher`, `doctor`'s and `repos check`'s graph facts, the code gate's registry read, and
every writer and reader of `.multivac/ecosystem.json`. What an earlier release left is named in
one new module, `src/lib/dropped.ts`: the four config keys the loader records and ignores (one
line in `verify` and `doctor`), the preamble that marks the refresh hooks multivac wrote (`doors`
removes those, and `.multivac/ecosystem.json`), and, as data, the files graphify 0.9.29 and
codegraph 1.6.0 installs wrote (`doctor` prints their removal, the door warns where their skills
remain, the code gate lets them go). Nothing in it runs a vendor or deletes a file. The law
changes first: MV-153 is written, fourteen rows retire with tombstones, thirty-four get a dated
note, each leg lands with the commit that greens it, so the pre-commit gate (the worktree's own
build, MV-92) and main's 0.15.0 `mvac verify` pass every commit; the change claims MV-153 and the
34 rows it amends, so `change close` verifies all 35. Documents, site and skill follow; this repository's own graphify setup goes in the last
commit. Research, measurements and the full law plan: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules compiled to `dist/` and `dist-test/`; Markdown for the law, the skill, the root documents and the site

**Primary Dependencies**: none new (MV-02: `yaml`, `picomatch`, `citty`); the vendors are only measured, never called by the new code

**Storage**: files — `.multivac/config.yml` (read), `.claude/settings.json` (merged by `doors`), `.multivac/ecosystem.json` (removed by `doors`), the law in `.multivac/invariants.md`

**Testing**: `node --test "dist-test/**/*.test.js"` (node:test); legs dry-run with `node dist/cli.js count`; `node dist/cli.js verify --strict --check`; scratch walks with the real vendors for the upgrade path (quickstart.md W2, W3)

**Target Platform**: the `multivac` CLI in a brain and its code repos; Claude Code sessions reading the doors and the skill

**Project Type**: single CLI package, brain==code

**Performance Goals**: one hook per edit where there were two; `change apply` on an old codegraph config as fast as with none; doors 747–2,276 bytes shorter where a grapher was declared

**Constraints**: every commit on the branch passes the pre-commit gate — the shim runs the worktree's own `dist/cli.js` (MV-92), so 0.15.0's code until the source commit and the new build after — and main's 0.15.0 `mvac verify` over the same tree (blocking legs of active and retired rows green at each commit, so tombstones and moved blocking legs land with their edits); no file deleted that multivac did not write; no vendor run by `doctor` or `doors`; renderers stay filesystem-free (MV-93); the two skill copies byte-identical (MV-72); site pages name no law ID and no version (MV-126, MV-84); the setup removal is the last commit and no Edit or Write tool runs after it (research.md R9); no Sync Impact Report (MV-146's leg)

**Scale/Scope**: 28 source files (4 deleted, 1 added, 23 edited; −3,594 lines net in the prototype); 96 test files (11 deleted, 32 edited plus two helpers, 2 created; 171 tests deleted, 11 added); the law (MV-153, 14 retirements, 34 notes, 60 legs removed, 71 added); 25 documents; the twelve setup items of this repository that the change removes (research.md R1.4)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. A Claim Nobody Checks Decays** — MV-153 pins the absence of every dropped name with
`absent` legs over the source (but the record), the registry, the types, the door renderers, the
lifecycle flags, this repository's setup, the skill, the root documents, the constitution and
the site; the upgrade behaviour with `unique`/`each` legs and six test titles; its own
retirements and notes with `count` legs. Each retired row carries a tombstone. Each amended row's
legs follow the code they read.

**II. The Tool Never Claims More Than It Checked** — MV-153 states its ceilings: one mark for
our hooks, two vendors at two measured versions, the `info/exclude` line left, a worktree kept at
close, lost reach, line-local legs. `doctor` prints removals it measured and runs none. The door
line appears only where a vendor's install is found. Every figure in the row is measured, and
the three prototype figures are re-measured before they bind.

**III. The Law Changes Before The Code** — MV-153's row, the fourteen leads and the thirty-four
notes are written in the first phase, before any source edit; each leg moves in the commit that
changes its line.

**IV. Deterministic, Offline, Small** — `verify`, `doctor` and `doors` gain no network and run
no vendor; `doctor`'s leftover probe is `existsSync`-style reads and one `git ls-files`; no
dependency is added and four modules are removed.

**V. An Invented Integration Is A Lie** — the registry loses its grapher entries, and with them
every vendor fact multivac stated about a graph; the leftover table keeps only what #5 and #6
measured on the two vendors, as data, for naming leftovers, never for dispatch. Principle V's
list of kinds shrinks to "harness or SDD tool" (PATCH, research.md R12).

**Engineering constraints** — tests ship with behaviour (eleven added, R10); "everything
multivac creates lives under `.multivac/`" is closer to true: the writers of `.graphifyignore`,
`codegraph.json`, the `.gitignore` lines and `info/exclude` go; the tarball loses four modules.

**Gate**: passes. Re-checked after Phase 1: passes (the data model adds one in-memory field,
`Config.dropped`, and persists nothing new; the contract's lines exist only where their condition
holds).

## Project Structure

### Documentation (this feature)

```text
specs/081-drop-graphers/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli-output.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md              # MV-153, 14 retirements, 34 notes FIRST; legs with the edits that green them
.multivac/changes/drop-graphers.md   # the declaration (frontmatter) and the M-records (body)
.specify/memory/constitution.md      # Principle V, 3.0.3
src/lib/dropped.ts                   # NEW: keys, hook mark, ecosystem path, leftover table, lines
src/adapters/{refresh,tracked}.ts    # DELETED
src/doors/ecosystem.ts               # DELETED
src/lib/json-splice.ts               # DELETED
src/adapters/{registry,detect,equip}.ts
src/doors/{brain,consumer,flow,settings,link}.ts
src/commands/{change,doctor,doors,init,verify,repos,seed}.ts
src/lib/{code-in-change,repo-state,config}.ts, src/types.ts
src/lib/{init-state,ritual,out}.ts, src/adapters/tracker.ts   # one comment each
test/**                              # research.md R10: 11 files deleted, 32 edited, test/verify/dropped.test.ts and test/invariants/no-graph.test.ts created
test/helpers/{fixture,recorded}.ts   # grapher options and recorded outputs go
skills/multivac/{SKILL.md,references/change.md,references/discovery.md}
.claude/skills/multivac/**           # re-projected by `node dist/cli.js doors`, never hand-edited
README.md DESIGN.md CONTRIBUTING.md CHANGELOG.md package.json .github/ISSUE_TEMPLATE/{bug,integration}.md
site/content/docs/reference/graphers-and-sdd.md → sdd.md, and 15 more pages (research.md R11)
AGENTS.md (CLAUDE.md → AGENTS.md), .claude/CLAUDE.md, .claude/settings.json, .claude/skills/graphify/**,
.agents/skills/graphify/**, .graphifyignore, .gitignore, .multivac/config.yml, .multivac/flow.md,
.multivac/ecosystem.json, graphify-out/graph.json        # this repository's setup: the LAST commit
```

**Structure Decision**: one new module holds everything the tool still knows about graphers —
the record of what was dropped — so every other source file can be pinned free of the words
(MV-153 legs 1–6), and the record itself is pinned to write, delete and spawn nothing (leg 20).
The leftover probe lives with the record and is called by `doctor` (named), `init` and `doors`
(the door line), keeping the renderers pure. The settings merge keeps its module and loses its
refresh half; `removeRefreshes` replaces `ensureRefreshes`. Tests that only asserted a graph go
whole; mixed files lose those tests; two new files hold the tests no existing file fits.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| A new module that names the vendors after they are dropped | the upgrade needs their measured file layout to name leftovers, and the code gate needs their paths to let the removal through | deleting every mention leaves equipped brains with no way to learn what to remove, and makes their removal commits code (MV-137) |
| Keeping four config keys in the loader's known lists | an old config must load (decision 2) | refusing them breaks every equipped brain on upgrade; migrating the file writes an invariant file outside a change (MV-97) |
| A door line beyond the literal decision | graphify's own hook-guard keeps sending agents to a graph nothing refreshes; only the door reaches the agent | `doctor` alone reaches the human, not the session (research.md R16 item 2) |
| Moving the reference page | the page's name says "graphers" | keeping the path keeps a word the site otherwise drops; cost: ten moved legs (R11, R16 item 1) |
| Phasing legs commit by commit instead of one law commit | the pre-commit gate (either build) evaluates retired rows' `absent` legs and every blocking leg | one law commit first is refused by its own tombstones (each red until its code goes) |
