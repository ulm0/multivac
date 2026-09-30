# Implementation Plan: The skill carries what no command prints, and no page keeps a sentence the tool contradicts

**Branch**: `079-skill-cites-references` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/079-skill-cites-references/spec.md`

## Summary

The skill body is cut to the contract (the brain door says; the lifecycle prints; run what
they print), *Where you are*, seven rules and a table of where to read what; each reference
keeps the judgement no command prints and names the surface that prints the rest. The
pointers are made conditional where the tool is (no grapher, no SDD, a code repo behind a
consumer door). A test renders nine brain and four consumer doors through the real renderers
and fails if the pack restates any clause of theirs. The retired-sentence families are swept
over the root documents, the constitution, the site and both skill copies; the ones changes
#5–#8 own are verified and backstopped, the rest fixed here, each pinned by an `absent` leg that
lands with the edit that greens it. DESIGN.md and the composition page each gain one section
saying adapter first, fallback always. No source file changes. Because #5–#8 edit the same
files first, every figure and the pack itself are re-derived on the merged tree before any
edit. Research and measurements: [research.md](./research.md).

## Technical Context

**Language/Version**: Markdown (the skill pack, the root documents, the site), TypeScript on Node 24 for the one test file, ES modules compiled to `dist-test/`

**Primary Dependencies**: none new (MV-02); the test imports `renderBrainDoor` and `renderConsumerDoor` from src/doors/ and `parseAnchors` from src/anchor/parse.ts, as test/skill.test.ts and test/doors/doors.test.ts already do

**Storage**: files; the law in `.multivac/invariants.md`

**Testing**: `node --test "dist-test/**/*.test.js"` (node:test, no framework); test/skill.test.ts and test/invariants/skill-copy.test.ts; legs dry-run with `mvac count` / `node dist/cli.js count`; `verify --strict --check`

**Target Platform**: Claude Code sessions (the one target multivac projects the skill into); readers of the site and the root documents

**Project Type**: single CLI package, brain==code; this change edits only data it ships (the skill) and documents

**Performance Goals**: a change session loads at most 10,000 bytes of skill and at most 40% of the merged tree's (SC-001); the restatement test adds milliseconds to the suite

**Constraints**: every figure re-measured on the merged tree (T001–T009); every leg that reads skill text keeps its count (MV-38 `/questions/` at 3, the rest at 1 or 0); the two skill copies byte-identical (MV-72); site pages name no law ID (MV-126) and no version string (MV-84); a leg lands only with the edit that greens it (+2,586 B per verify otherwise); no Sync Impact Report in the constitution (MV-146); the owners' wording stands where they fixed a family

**Scale/Scope**: six skill files in two copies, one test file, the law file (one row, about 16 legs), DESIGN.md, README.md, CONTRIBUTING.md, CHANGELOG.md, the constitution (verified; two sentences at most as the backstop), twelve site pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The Constitution Check reads Principle III while change-file-cites is amending it (3.0.1 →
3.0.2): on the merged tree it says `change close` verifies the rows the change claims, which is
what this plan relies on. T001 confirms the merged text before this check is re-run.

**I. A Claim Nobody Checks Decays** — MV-152 anchors every pointer sentence it relies on with a
`unique` leg, each retired family with an `absent` leg over both skill copies, the root
documents, the constitution and the site, the restatement test by its title, and the pack
test's coverage of the verify reference. The skill keeps rule 3's cite-by-ID; site pages name
no ID. Families another row pins are named by that row, not pinned twice.

**II. The Tool Never Claims More Than It Checked** — the pack's pointers are conditional where
the surface is (no grapher, no SDD, the quiet line only where it shipped); the row states its
ceilings: verbatim-only restatement test, line-local legs, instruction nothing checks, the
saving only in the `claude` target. The harness fact is stated as measured (multivac projects
the skill only into `claude`), not as a claim about every harness.

**III. The Law Changes Before The Code** — MV-152's row is written first (T010), before any
skill or document edit; the figures it states before the edit come from the merged tree (T002),
and the after-figures are filled when measured (T054). No other row's rule changes.

**IV. Deterministic, Offline, Small** — no new dependency; the test renders doors in-process
from literal configs, with no network, no git and no host configuration; the pack shrinks.

**V. An Invented Integration Is A Lie** — no adapter entry changes; every pointer is ticked
against a line the real vendors' runs printed (quickstart.md), and the Cursor, hooks and
install sentences are rewritten from measured behaviour.

**Engineering constraints** — tests ship with behaviour: the restatement test and the
verify-reference guard are the pack's tests; the docs half is guarded by its legs, each
dry-run red on the base and green after.

**Gate**: passes. Re-checked after Phase 1: passes (the data model adds no persisted format;
the contract names only surfaces that exist on the merged tree, each with its condition).

## Project Structure

### Documentation (this feature)

```text
specs/079-skill-cites-references/
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
.multivac/invariants.md                     # MV-152's row FIRST, then its legs, each with the edit that greens it
.multivac/changes/skill-cites-references.md # declaration; the M0 record, the owners' misses, the walk
skills/multivac/SKILL.md                    # the core
skills/multivac/references/{change,verify,anchors,discovery,interview}.md
.claude/skills/multivac/**                  # re-copied by `multivac doors`, never hand-edited (MV-72)
test/skill.test.ts                          # FILES gains references/verify.md; the restatement test
.specify/memory/constitution.md             # verified; Principle III and the Compliance line only as the backstop
DESIGN.md                                   # families; hooks cell; skill paragraph; shims; install; the new subsection
README.md                                   # the adapter paragraph
CONTRIBUTING.md                             # "on every commit"
CHANGELOG.md                                # Unreleased: MV-152
site/content/docs/concepts/{composition,distribution,philosophy,the-change,brain-driven-development,invariants}.md
site/content/docs/guide/{running-changes,getting-started}.md
site/content/docs/reference/{integrations,commands,graphers-and-sdd,configuration}.md
AGENTS.md, CLAUDE.md, .multivac/flow.md, .multivac/ecosystem.json  # regenerated by `doors`, never hand-edited
graphify-out/graph.json                     # `graphify update .`, committed by `change land`
```

No file under `src/` changes: seed.ts and init.ts already name the references that stay, and
the door and flow.md lines this plan relies on are the merged tree's.

**Structure Decision**: everything in place. The restatement test joins test/skill.test.ts, the
file whose `FILES` it reads and whose legs MV-152 pins; its fixtures are literal `Config`
objects as test/doors/doors.test.ts builds them, with `isBrain: true` wherever the brain holds
code, because only `loadConfig` derives it.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| A backstop over other changes' families | MV-111 puts each copy in the change that retires it, and the owners' legs are narrower than the families (research.md R7) | trusting the hand-offs leaves unpinned alternatives ("relaxed in code…", "The half that pays for it is") and any copy an owner missed |
| Re-deriving the pack on the merged tree instead of applying the prototype | #5–#8 each edit the skill after the prototype was built | copying the prototype would drop what they added and keep what they retired |
| A test that imports the door renderers into the skill test | only rendered doors show what a session already has | a hand-listed clause set drifts with every door edit |
