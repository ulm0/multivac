# Implementation Plan: A paraphrase ages silently

**Branch**: `a-paraphrase-ages-silently` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/035-a-paraphrase-ages-silently/spec.md`

## Summary

The project names this failure on its own philosophy page and commits it once
per amendment: the rule moves at its anchored row and nowhere else. Six copies
of one retired sentence, five rows whose sentences the code no longer honours,
a projected skill teaching three things that are not true, and a first-run
experience whose refusal uses the wrong word.

The approach: correct each restatement, retire each clause with the corpus's own
WITHDRAWN convention, rewrite the skill from the code, and then make the class
self-detecting — MV-111 requires an amendment that retires a sentence to ship a
tombstone on the retired phrase.

## Technical Context

**Language/Version**: TypeScript 5.6 for the two code edits; the rest is prose
under law

**Primary Dependencies**: none added

**Storage**: none

**Testing**: `node:test`; the skill mirror test (MV-72) and the corpus's own
`verify`

**Target Platform**: the law, the docs, the projected skill, and `init`'s report

**Project Type**: single project

**Constraints**: a retired phrase may still be quoted inside a recorded
amendment — the tombstone must not make history unwritable

**Scale/Scope**: `.multivac/invariants.md`, `.specify/memory/constitution.md`,
`CONTRIBUTING.md`, three site pages, `DESIGN.md`, two skill references, one
test header, `src/commands/init.ts`, `src/change/reserve.ts`

## Constitution Check

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Anchored | PASS — MV-111 is the row that makes the class checkable |
| II — The tool's own failure mode | Reports success it did not check? | PASS — five rows stop doing exactly that |
| III — Law moves before code | Row first, constitution amended in place with a version bump | PASS |
| IV — Deterministic, offline, small | No dependency | PASS |
| V — An invented integration is a lie | — | PASS |
| Engineering: tests ship with behaviour | Two code edits pinned; the prose is pinned by anchors | PASS |
| Engineering: English everywhere | — | PASS |

Post-design re-check: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/035-a-paraphrase-ages-silently/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/retirement.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md          # MV-111; MV-01, MV-31, MV-68, MV-82, MV-84, MV-85, MV-86 amended
.specify/memory/constitution.md  # Principle IV, version bump, Sync Impact Report
CONTRIBUTING.md, DESIGN.md
site/content/docs/…              # configuration.md, commands.md, install.md, getting-started.md
skills/multivac/references/…     # change.md, interview.md — and the .claude mirror
src/commands/init.ts             # the closing report names the commit
src/change/reserve.ts            # "untracked or modified", not "uncommitted edits"
```

**Structure Decision**: single project. No file added under `src/`.

## Complexity Tracking

No Constitution Check violation.
