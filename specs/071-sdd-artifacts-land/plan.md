# Implementation Plan: What the SDD writes in the brain lands with the change

**Branch**: `071-sdd-artifacts-land` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/071-sdd-artifacts-land/spec.md`

## Summary

Three corrections where the lifecycle hands work back to the operator without
saying so. `change close` prints a commit that leaves the SDD's own artifacts
untracked, so the proof every gate demanded never reaches the branch: it now
stages every path the brain's status reports under the directories the closing
slug owns, deletions included, and names a dirty file the run did not write
instead of staging it. `change apply` equips a repo it just cloned or created
after it has already carried that repo's artifacts out of the checkout: the clone
pass, the equip pass and the branch-and-carry pass become three steps in that
order. And the directories a declared SDD's integrations install into are
derived from the integrations themselves, measured per version, so a brain that
declares openspec and no grapher is no longer refused its own first commit.

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/`

**Primary Dependencies**: picomatch, yaml, citty. No new dependency (MV-02)

**Storage**: files; git is the only state, read through src/lib/git.ts

**Testing**: `node --test "dist-test/**/*.test.js"`, node:test with `test/helpers/fixture.ts`

**Target Platform**: developer machines and CI

**Project Type**: single CLI package, brain==code

**Performance Goals**: one extra `git status` per close. `verify` is untouched, so its sub-second budget is not in play

**Constraints**: never stage what the run did not write (MV-46); no network (MV-01); git only through the wrapper in src/lib/git.ts; `--no-sdd` and `sdd_auto: false` must behave exactly as today

**Scale/Scope**: two adapters, fourteen integration entries, one close path and one apply path

## Constitution Check

**I. A Claim Nobody Checks Decays** — MV-144 anchors the status read, the shared
directory derivation, the apply order and the integration directories; each has a
test. The integration table is data, so a leg counts its entries.

**II. The Tool Never Claims More Than It Checked** — every `dirs` value was
measured, one fresh repo per integration, versions named in research.md R5. Two
of them contradict the obvious guess (`codex` writes `.agents/`, openspec's
`windsurf` writes `.devin/`), which is exactly why they are measured and not
derived from the key.

**III. The Law Changes Before The Code** — MV-144's row and MV-142's amended
wording are written in this change, before the code.

**IV. Deterministic, Offline, Small** — no new dependency, no new command, no
network. The status read is the one git call added; the directory derivation is
`planCarry`'s own, extracted rather than duplicated.

**V. An Invented Integration Is A Lie** — the integration directories are a
measurement recorded in the registry, with the tool version. A vendor that moves
them is a re-measurement, and the row says so.

**Gate**: passes.

## Project Structure

### Documentation (this feature)

```
specs/071-sdd-artifacts-land/
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
src/
├── adapters/registry.ts     # integrations gain measured `dirs`
├── change/carry.ts          # slugArtifactDirs extracted and exported
├── commands/change.ts       # close stages the slug's SDD paths; apply reorders
└── lib/code-in-change.ts    # integration dirs join the non-code set

test/
├── change/                  # close pathspec, apply order
└── verify/                  # the code gate over integration directories

.multivac/invariants.md      # MV-144 added; MV-142 amended
```

**Structure Decision**: no new module. The one extraction, `slugArtifactDirs`,
stays in src/change/carry.ts, where the logic already lives and where the carry
keeps using it.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| A per-integration directory list in the registry | two integrations write into a directory their key does not name | deriving `.${key}` is wrong for `codex` and for openspec's `windsurf`, and a wrong non-code set either refuses a legitimate commit or lets code through |
