# Implementation Plan: The site speaks to users

**Branch**: `the-site-speaks-to-users` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

The site names no law ID after this change. The work, in order:

- **The law moves first** (Principle III):
  - Principle I is amended, so the constitution goes to 3.0.0 (R1).
  - MV-111 gets one note (R2).
  - MV-126 replaces its RESERVED row, with 3 legs (R3).
- **Then the pages**, 16 files under `site/content/` (14 carry IDs, 2 only a
  link):
  - 71 trailing citations are deleted.
  - 25 sentences are rewritten so they keep their behaviour without the ID.
  - 15 headings are cleaned, and 4 links follow them (R6).
  - 9 code lines take `…` or an `INV-` ID (R5).
  - 1 HTML comment and the dead `[MV-90](#)` link are fixed.

The measured baseline is in R0. No leg is expected to break (R4).

## Technical Context

**Language/Version**: Markdown (Hugo content), the anchor dialect

**Primary Dependencies**: none added

**Testing**:
- `verify --strict` and the full `node:test` suite.
- A Hugo build into the scratch `public/`, never `site/public`, checked for
  IDs and heading ids.
- A bite run with MV-126 active in a scratch clone.

**Project Type**: single project; documents and law only

**Constraints**:
- MV-84: no version string on a page, so "the version measured" gets no number.
- MV-111 and MV-118, MV-120 … MV-125: no retired phrase is re-spelled by a
  rewrite.
- MV-31: heading counts stay 9, 11 and 8.
- MV-81: MV-126 stays `proposed`.
- No ` | ` inside a statement cell. The literal `Amended 2026-09-14 by MV-126`
  appears exactly once, in MV-111.

**Scale/Scope**: 16 content files, `.specify/memory/constitution.md` and
`.multivac/invariants.md` (2 rows, 3 legs)

## Constitution Check

*Checked against 2.0.2. Re-checked against 3.0.0 once Phase 2 lands.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Does removing IDs leave a rule uncited? | Under 2.0.2 this conflicts with "MUST be cited by its ID". It is resolved by amending Principle I in this same change and before any page moves, as Governance requires (R1). Under 3.0.0: PASS, because the site binds nothing and every rule keeps its row and legs |
| II — Never claims more than it checked | Does a rewrite or a quote overclaim? | PASS: a quote is elided, never reworded (R5), MV-126 states its ceilings (R3), and SC-007 is a fidelity pass |
| III — Law before code | Does the law move first? | PASS: Phase 2 comes before Phase 3 |
| IV — Deterministic, offline, small | Any dependency or network? | PASS: none |
| V — An invented integration is a lie | Any adapter touched? | PASS: none |

Complexity Tracking: no violations beyond the one Principle I amendment, which
is the change itself.

## Project Structure

```text
specs/051-the-site-speaks-to-users/   spec.md plan.md research.md tasks.md checklists/
.specify/memory/constitution.md       Principle I, Sync Impact Report, footer 3.0.0
.multivac/invariants.md               MV-111 note; MV-126 row + 3 legs
site/content/_index.md                HTML comment
site/content/docs/concepts/           composition, distribution, invariants, the-change, claims-and-anchors (link)
site/content/docs/guide/              getting-started, install, session-zero, writing-anchors, running-changes (link)
site/content/docs/reference/          commands, configuration, graphers-and-sdd, hooks, integrations
```

`claims-and-anchors.md` and `running-changes.md` carry no ID, only one link
each to fix.
