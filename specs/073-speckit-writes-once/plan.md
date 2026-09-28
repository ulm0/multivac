# Implementation Plan: The SDD lives in the brain and writes once

**Branch**: `073-speckit-writes-once` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/073-speckit-writes-once/spec.md`

## Summary

The SDD stops cascading: `adapterFor` resolves it for the brain root alone, and a second
resolver, `sddGoverning`, keeps the code gate on in every code repo through the brain's
SDD unless the repo says `none`. A config that names an SDD running nowhere is refused
at load, except where a consumer reads a mounted brain, which reports. `close` lands the
brain's slug directories whatever the flags say, including an openspec archive's merged
main specs and moved-from directory, and appends one line citing the directory to the
change body. spec-kit's feature pointer follows the change being planned or applied. A
fresh spec-kit scaffold writes skeleton templates where spec-kit resolves first. The
revisit says to commit no Sync Impact Report, each point prints the run-the-chain
instruction once, and the brain door drops the ungateable reasons it repeated. Research
and measurements: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/`

**Primary Dependencies**: picomatch, yaml, citty. No new dependency (MV-02)

**Storage**: files; git through src/lib/git.ts only (MV-03)

**Testing**: `node --test "dist-test/**/*.test.js"`, node:test with `test/helpers/`; vendor binaries stubbed through the existing `vendors` helper

**Target Platform**: developer machines and CI

**Project Type**: single CLI package, brain==code

**Performance Goals**: `verify` stays sub-second: the added work is one config check at load and one picomatch set per repo

**Constraints**: `verify`, `doctor` and `doors` run no vendor and write no skeleton (MV-01, MV-124); never overwrite a file multivac did not write (MV-108); never stage what the run did not write (MV-46); planned bodies byte for byte (MV-89); legs of rows NOT touched stay green (MV-125's `count=6`, MV-133's `count=2`, MV-122's `=== NO_ADAPTER` in config.ts)

**Scale/Scope**: two SDDs, one new row, twenty amendment notes, about twenty source files, about twenty test files, the site's reference and guide pages that describe the SDD

## Constitution Check

**I. A Claim Nobody Checks Decays** — MV-146 anchors each mechanism with a `unique` or
`count` leg, the retired phrases with `absent` legs, and each story with a test-title
leg. Every row whose sentence becomes false gets a dated note (twenty), counted by one
leg.

**II. The Tool Never Claims More Than It Checked** — the skeleton's floor is the lowest
version measured (0.9.4), not the one read from tagged sources that cannot be installed;
the leftover is reported, never failed; the ungateable steps keep their reasons in the
lifecycle, doctor and flow.md; the "nothing cited" line never asserts a change has no
record.

**III. The Law Changes Before The Code** — MV-146's row and the twenty notes are written
first, in this change.

**IV. Deterministic, Offline, Small** — no new dependency; the config check is pure; the
skeleton is written only by the scaffold, which already runs from `change` and never
from `verify`, `doctor` or `doors`.

**V. An Invented Integration Is A Lie** — the override precedence, the init's
preservation of the directory, the pointer's file and key, openspec's merge target and
the report's wording are each measured with the real binary, versions named.

**Gate**: passes.

## Project Structure

### Documentation (this feature)

```
specs/073-speckit-writes-once/
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

```
.multivac/invariants.md        # MV-146 + twenty notes + legs — FIRST
src/adapters/detect.ts         # ownDecl, adapterFor guard, sddGoverning, sddDeclarationRefusal, sddRoots.key
src/lib/config.ts              # loadConfig calls the refusal; sddDeclaration option; cfg.sddRefusal
src/commands/verify.ts         # consumer mount loads (runVerify + evaluateCore) report; the sdd line
src/commands/count.ts          # consumer mount load reports
src/lib/code-in-change.ts      # sddGoverning switch; nonCodeGlobs(cfg, repoKey): step tops brain-only, every known SDD's vendor state everywhere
src/adapters/registry.ts       # pointer, skeleton, merges, revisit text, types
src/adapters/skeletons.ts      # NEW — three skeleton bodies
src/adapters/sdd.ts            # slugHits by key, stray search helper, writeSkeleton, runScaffold lines, instruction once
src/change/carry.ts            # pointFeature, closeOwnedDirs
src/change/cite.ts             # NEW — citeSpec, citeLine
src/change/file.ts             # scaffold ownership sentence
src/commands/change.ts         # sddPathsToLand without flags; landSdd; plan/apply pointer + code-location line; new cite line; abandon
src/doors/brain.ts             # step endings; projectLawLines(sddAuto) without lawPrefix
src/doors/consumer.ts          # one governing line; mount-prefixed law line
src/doors/flow.ts              # no SDD suffix; brain wording; sdd_auto:false
src/doors/ecosystem.ts         # sddGoverning per repo node
src/commands/doctor.ts         # brain-only SDD lines; governs; leftovers; preset; gates under sdd_auto:false; skeleton in missing line
src/commands/repos.ts          # repos check: brain-only SDD checks; leftover fact
src/commands/seed.ts           # the brain's project document
src/commands/init.ts           # step 4 wording
.specify/memory/constitution.md, .specify/templates/overrides/*  # this brain
test/**                        # see tasks.md
CHANGELOG.md, DESIGN.md, README.md, site/content/docs/**, skills/multivac/**  # the surfaces that would lie
```

**Structure Decision**: two new modules. `skeletons.ts` keeps three multi-line bodies out
of the registry's data table; `cite.ts` keeps the body-writing rule in one file whose
legs can prove it prints no continue instruction. Everything else is in place.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Two SDD resolvers (`adapterFor` and `sddGoverning`) | "where the SDD runs" and "whose rules govern this code" diverge for every code repo | one resolver either cascades the install (the cost removed) or switches the code gate off (measured: exit 1 → 0) |
| Twenty amendment notes | every row that says the SDD reaches every root states a sentence this change makes false | leaving any would be a row contradicting code, the drift MV-111 exists to stop |
| Per-root SDD code paths kept though unreachable | MV-125's `count=6` and `each` legs sit on them | deleting them saves no byte an agent reads and would move a row this change does not otherwise touch |
