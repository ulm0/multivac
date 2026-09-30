# Implementation Plan: opsx runs through its own CLI

**Branch**: `074-opsx-through-its-cli` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/074-opsx-through-its-cli/spec.md`

## Summary

opsx's four steps become openspec's own terminal verbs, `<slug>` interpolated: `new
change --json` in the brain checkout, then the text `status` / `instructions --json` loop
through `tasks.md`, `instructions apply --json` before the first task and after the last,
and `archive <slug> --json` after the merge, in the brain checkout. Each `run` names the
human's question on that step; a new optional `SddStep.guide` carries the rest of what
openspec 1.13.2's command bodies told the agent, and only the lifecycle and the refusals
print it. The scaffold becomes `openspec init --tools none --no-animation .`, so no command
body is installed; the integration map stays as the measured record the code gate reads,
and `doctor` names the bodies an earlier init left, with a `git rm -r` the code gate
accepts. The archive is printed with no flag: `archive_confirmation_required` goes to the
human with `openspec show <slug> --json --deltas-only`, and the answers are the tool's own.
A land step is proved in the brain checkout alone; `close` stages a merged main spec only
when it carries the merge (LF, trailing whitespace and blank-line runs normalised, tracked or untracked);
`change new` and `roadmap add` refuse a slug openspec refuses; the apply gate prints
openspec's "Archive would refuse" as a note; the note discloses by version what the
agent's own calls send and write. MV-147 is added and twelve rows amended, law first (MV-142's note added at review).
Research and measurements: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/` | **Primary Dependencies**: picomatch, yaml, citty — no new dependency (MV-02) | **Storage**: files; git through src/lib/git.ts only (MV-03)
**Testing**: `node --test "dist-test/**/*.test.js"` (node:test, `test/helpers/`), vendor binaries stubbed through `vendorPath` and per-test stubs; the real openspec 1.13.2 only in quickstart.md | **Target Platform**: developer machines and CI, POSIX and win32 shells (no printed command needs a POSIX redirection or an env prefix) | **Project Type**: single CLI package, brain==code
**Performance Goals**: `verify` stays sub-second: the code gate gains registry-derived globs only, no filesystem walk; `doctor` gains two `git ls-files` reads in the brain | **Constraints**: multivac spawns only the validator and the scaffold (MV-51); `verify`, `doctor` and `doors` run no vendor (MV-75, Principle IV); legs of rows NOT touched stay green (MV-133's `count=2` on `slugHits`, MV-130's `scaffoldCommands(sc, cfg.doors)` `count=2`, MV-144's `dirs: ['.agents']` `count=3`, MV-95's `run the chain through without asking to continue` unique in sdd.ts, MV-121's and MV-124's retired-phrase `absent` legs); a speckit brain's door, flow.md, `doctor` and lifecycle output byte-identical | **Scale/Scope**: one SDD entry rewritten, four new registry fields, one new row, twelve amendment notes (MV-142's added at review), about ten source files, about sixteen test files, the site's SDD reference and the pages that repeat it

No NEEDS CLARIFICATION remains: every unknown the design carried was measured (research.md
R1–R13) or taken at the spec's stated default (spec Assumptions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. A Claim Nobody Checks Decays** — MV-147 anchors each mechanism with a `unique` or
`count` leg (the four registry fields, the four runs' question clauses, the scaffold's
record comment, the guide printers, the worktree-only refusal, the validator note,
`carriesMerge` and its call, the flow.md verb, `leftoverBodies` and its call, the slug
refusal), an `absent` leg on any flag in a `run`, an `absent` leg on the retired phrases at
every copy (28 matches in 10 files today, through picomatch; 0 after), test-title legs per story, a site leg,
and a `count=12` on the dated notes (MV-142's added at review). Every leg an amended row loses is moved in the same
change (research.md R15).

**II. The Tool Never Claims More Than It Checked** — whether the agent asked a question,
ticked only what it built, or added a flag unasked is ungateable and is stated so on the
`guide` field and in the row; a land proof found only in a worktree is refused by name,
never passed; the validator note refuses nothing and says what openspec said; a leftover
is reported, never failed, and its printed removal is one that works as printed (`git rm
-r` only for what git tracks); the note discloses what the agent's own calls send and
write rather than claiming the entry's `env` covers them. Only the validator and the
scaffold are spawned — pinned by a logging-stub test over a whole change.

**III. The Law Changes Before The Code** — MV-147's row and the notes (eleven, then MV-142's at review) are the first
task (T002–T004); the row is filed `proposed`, the ID was allocated by `change new`
(f171b86), and only a human enacts it.

**IV. Deterministic, Offline, Small** — no new dependency; `nonCodeGlobs` stays pure
(globs read off the registry); `doctor` adds git reads only, through the argument vector;
no vendor version probe from `doctor` (MV-51); nothing new reaches the network.

**V. An Invented Integration Is A Lie** — every vendor fact is measured with the real
binary and names its version: the verbs (`openspec --help` 1.13.2), the archive codes
(1.5.0–1.13.2), the preview, the slug grammar, the body names (all eight integrations on
1.13.2, codex on 1.7.0 through 1.13.0), the validator's INFO issue, the network and HOME
writes (1.4.1–1.13.2). The new behaviour dispatches on the entry's fields (`guide`,
`validateNotes`, `slug`, `scaffold.bodies`), never on the name `opsx`, and the entry
discloses the network of the calls it prints.

**Gate**: passes. **Re-checked after Phase 1 design** (data-model.md, contracts/,
quickstart.md): passes — the one design choice beyond the design document, reading the
bodies openspec's inits write as not code under every integration directory and `.codex/`
(research.md R9), adds registry-derived globs to an existing pure function and moves no
active row's statement.

## Project Structure

### Documentation (this feature)

```text
specs/074-opsx-through-its-cli/
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
.multivac/invariants.md        # MV-147 row + twelve dated notes (MV-142's at review) + legs — FIRST
.multivac/changes/opsx-through-its-cli.md  # body: the quickstart record (frontmatter already declared, 6e2a265)
src/adapters/registry.ts       # SddStep.guide, SddStep.validateNotes, SddScaffold.bodies, AdapterSpec.slug; the opsx entry: runs, guides, vendor citations, scaffold run, integrations record comment, bodies, validateNotes, unfinished.why, slug, note, refresh fact; the false doc comments; the codegraph entry's note says its `env` never reaches the `codegraph query` a door prints (MV-121's note covers what every entry prints; measuring what that query sends stays codegraph-worktrees-and-verbs')
src/adapters/sdd.ts            # header; runScaffold doc; scaffoldCommands placeholder-free return; toolVerdict notes; judgeSdd guide on refusals, land worktree-only refusal, ledger skip, validator note; stepLines guide line; sddSlugWhy
src/adapters/detect.ts         # bodyGlobs(scaffold) — the one derivation doctor and the code gate share
src/change/carry.ts            # carriesMerge; closeOwnedDirs returns { dirs, uncarried }
src/commands/change.ts         # runSdd comment; the :891 comment; cmdNew slug refusal; sddPathsToLand names uncarried targets dirty
src/commands/roadmap.ts        # roadmap add loads the config and refuses a slug the brain's SDD refuses
src/doors/flow.ts              # the ungateable verb: first backticked command of a required binary
src/lib/repo-state.ts          # leftoverBodies(dir, spec): its collapse prefixes derived from the entry's bodies.names, no vendor name written there
src/commands/doctor.ts         # the leftover-bodies line after the brain's install line
src/lib/code-in-change.ts      # nonCodeGlobs adds bodyGlobs for every known SDD scaffold
test/**                        # see tasks.md
CHANGELOG.md, DESIGN.md, site/content/docs/{reference/{graphers-and-sdd,configuration,commands}.md,guide/running-changes.md,concepts/composition.md}, skills/multivac/references/change.md  # the surfaces that would lie
AGENTS.md, CLAUDE.md, .multivac/flow.md, .multivac/ecosystem.json, .claude/skills/multivac/**  # re-rendered by `multivac doors`, never hand-edited
```

**Structure Decision**: no new module. The four fields go on the registry types they
qualify; `bodyGlobs` sits in detect.ts beside `artifactHit` because both the code gate
(code-in-change.ts) and `doctor` (repo-state.ts) already import that module; `carriesMerge`
sits beside `closeOwnedDirs`, its only caller; `sddSlugWhy` sits in sdd.ts beside
`withSlug`, so `change new` and `roadmap add` read one rule. `src/doors/brain.ts` needs no
code change: printing `run` alone there is pinned by a test.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Two texts per step (`run` and `guide`) printed on different surfaces | the door is read every session and must stay small (646 → 1,220 B), while the vendor's questions and failure codes are needed only at the step's point | one text everywhere either puts ~1.7 KB of guide into every session or drops questions MV-95 needs carried |
| The integration map kept though the scaffold installs no integration | the code gate reads its `dirs` (MV-144), and existing brains hold what those inits wrote | emptying it makes removing a leftover, or `openspec update`, judged as code, and breaks MV-144's `count=3` |
| The code gate reads openspec's body entries under every integration directory and `.codex/`, declared door or not | `doctor` names bodies a door no longer declared, or openspec 1.7.0's codex, left; their removal must pass the code gate (FR-019) | exempting those directories whole makes `.github/prompts/**` and `.codex/**` not code in every brain; scanning declared doors only misses `.codex/` |
| The slug grammar checked in two commands | a planned slug `roadmap add` records is promoted by `change new` (MV-89), so accepting it there opens a change whose first step fails | checking only in `change new` records roadmap items that can never start |
