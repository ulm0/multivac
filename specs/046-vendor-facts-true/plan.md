# Implementation Plan: Vendor facts are true

**Branch**: `vendor-facts-true` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

## Summary

Five vendor facts in the registry, its copies and three law rows are false, and
a fourth row cites MV-01 for one of them. Each
one moves to what a named version did or what that version's own source says:

- **The scaffold's reason**: 14 live copies in code, docs and tests, plus MV-51
  and MV-75, say the init "reaches the network" or "downloads templates". The
  replacement reason is true: the init writes the vendor's files into the tree,
  and on specify 1.0.6 a re-run reverts files someone edited. Who runs it does
  not change. MV-87 gets a note scoping its MV-01 citation.
- **MV-61's example**: `graphify --help` 0.9.29 lists `query`. The row gets a
  note, and the registry comment, the note and the site page move with it. The
  present leg on the false phrase goes.
- **Network disclosure (Principle V)**: the opsx note names PostHog telemetry on
  every command and the npm check on `update`. The codegraph note adds
  `CODEGRAPH_TELEMETRY=0`, the shim's GitHub Releases fallback with
  `CODEGRAPH_NO_DOWNLOAD=1`, the MCP server's update check with
  `CODEGRAPH_NO_UPDATE_CHECK`, and 1.6.0's never-collected list.
- **Two stale notes**: the five-verb OpenSpec CLI (registry and site callout),
  and "leaves `.claude/settings.json` alone".

MV-121 states the rule. It carries four `absent` legs, one per retired phrase,
and a count on its four amendment notes. Every leg was dry-run with
`multivac count` against `8401c9a` (research R5).

## Technical Context

**Language/Version**: TypeScript (Node ≥ 20), Markdown, and the anchor dialect (POSIX ERE, per line)

**Primary Dependencies**: none added (MV-02 stays at three)

**Storage**: tracked files only (Project Structure)

**Testing**:
- `node:test`: `test/doctor/doctor.test.ts` (the printed clause) and
  `test/doctor/adapters.test.ts` (both disclosures) are changed first and fail
  first.
- `verify --strict` for the legs.
- A bite run in a scratch copy with MV-121 `active`.

**Target Platform**: the CLI and the documentation site

**Project Type**: single project (CLI)

**Performance Goals**: `verify` stays sub-second. The legs add one wide glob of about 160 files, read four times, and one single-file count.

**Constraints**:
- Who runs the scaffold is unchanged. MV-75's `absent` leg over `verify`,
  `doctor` and `doors` stays.
- No opt-out is applied, and no `env` field is added. That is change 4.
- No leg reads history (specs, archived changes, `CHANGELOG.md`, `docs/`) or the
  law file's notes.
- MV-62's `unique` legs mean `TELEMETRY IS ON BY DEFAULT` and
  `codegraph telemetry off` each appear exactly once in `registry.ts`.
- MV-121 stays `proposed` (MV-81).

**Scale/Scope**: 9 files edited plus the change file. 5 law rows are touched (4 amended, 1 stated), with 5 legs added and 1 removed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I — A claim nobody checks decays | Is every corrected sentence anchored or cited by ID? | PASS: the four retired phrases get `absent` legs, the four notes get a count, and the new notes cite MV-121 |
| II — Never claims more than it checked | Does any fact outrun its measurement? | PASS: each fact names its version (specify 1.0.6/0.16.5/0.9.4, openspec 1.13.0, graphify 0.9.29, codegraph 1.6.0). MV-121 names its ceilings: nothing re-measures on upgrade, and legs catch only these phrases |
| III — Law changes before code | Does the row move first? | PASS: Phase 2 writes MV-121, its legs and the MV-51, MV-61 and MV-75 notes before any copy is edited |
| IV — Deterministic, offline, small | Any dependency, network or host reliance? | PASS: none added. Tests keep stub binaries on a constructed PATH, and the fixtures stop naming a download |
| V — An invented integration is a lie | Does every entry disclose the network of the commands multivac runs from it? | PASS: this change closes the existing breach for opsx and codegraph. Opt-outs are spelled as in the vendors' source (research R3) |
| Governance | Is the constitution touched? | PASS: not touched |
| Engineering — tests ship with behaviour | Is the one behaviour change pinned? | PASS: the doctor clause assertion moves first, and the disclosure assertions are added first |

Post-design re-check: PASS. No violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/046-vendor-facts-true/
├── spec.md
├── plan.md        # this file
├── research.md    # measured facts, replacement wording, leg shapes
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.multivac/invariants.md                          # MV-51, MV-61, MV-75, MV-87 notes; MV-61 leg :443 removed; MV-121 row + 5 legs
src/adapters/registry.ts                         # scaffold field doc :276; opsx note :433; speckit comment :446-451 + note :452; graphify comment :584-588 + note :604; codegraph note :625
src/adapters/sdd.ts                              # runScaffold doc :224-225; comment :256
src/commands/doctor.ts                           # comment :218-220; printed clause :225
test/doctor/doctor.test.ts                       # doc :126; assertion :142
test/doctor/adapters.test.ts                     # codegraph test :159 extended; opsx disclosure test added
test/change/sdd-gates.test.ts                    # comments :85-86, :693, :865; fixtures :717/:721, :888/:897, :972
site/content/docs/reference/graphers-and-sdd.md  # :117-119, :335-336 callout, :375-376, :381 transcript
site/content/docs/reference/configuration.md     # :463 transcript
.multivac/changes/vendor-facts-true.md           # declaration + claim (already written)
```

**Structure Decision**: single project. No file is added under `src/`. The only runtime change is the text of one `doctor` clause.

## Complexity Tracking

No Constitution Check violation.
