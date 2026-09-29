# Implementation Plan: The graph the agent asks is one that answers

**Branch**: `075-graph-answers-where-asked` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/075-graph-answers-where-asked/spec.md`

## Summary

Four pieces of one row, MV-148, landed law first. **Where asked**: the registry records how
each grapher's verbs are pointed at another checkout (`askAt`: graphify `--graph
{checkout}/graphify-out/graph.json`, codegraph `-p {checkout}`); `askedGraphers` answers which
graphers an agent in the brain asks; `whereLines` renders them in a code-less brain's door and
for a brain==code brain's siblings, with a line added to the brain==code door naming its
worktrees' form; `change apply` prints, under each workspace, the flag that reaches its graph,
else the base's, else that there is none (`graphPointer`); every pointer says its answers'
paths are relative to the checkout it names; `change close` force-removes a worktree holding
only the grapher's outputs. **Followed**: in a code-less brain the post-edit hook is
follow-only — it runs in the edited file's checkout when that checkout holds the artifact and
is no checkout of the brain — wired with `brainRefreshGrapher`, the one grapher the writable
code repos resolve, only where the binary is reachable from each of them. **No code, no
graph**: `adapterFor(cfg, 'brain', 'grapher')` resolves nothing in a brain no repos entry
declares as code, so nothing builds, refreshes, installs, gates or lands a graph there; `init`
counts untracked source as code; `init`, `doctor` and `change plan` say the brain holds no
code; a kept install is found by `leftoverGraphs`, its removal printed by `doctor` (gemini
first), stated by `repos check` and named in the door `init` and `doors` both write; every
known grapher's paths are not code. **Kept out**: `graphIgnoreLines` derives a root's ignore
lines from its non-code set, anchored `/<dir>/`, under a `# multivac:` record; they are written
before the first build and, at `change land`, in the checkout holding the branch, committed with
the graph; `holdsIgnored` makes the refresh run the entry's `rebuild` while the graph holds a
node under a recorded line. The stories run in dependency order (US1 where asked, US2 followed,
US3 no code, US4 kept out), so the resolver change lands where the surfaces that keep a
code-less brain's lines true already exist (critic gap 1). Research and measurements:
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/` | **Primary Dependencies**: picomatch, yaml, citty — no new dependency (MV-02) | **Storage**: files; git through src/lib/git.ts only (MV-03)
**Testing**: `node --test "dist-test/**/*.test.js"` (node:test, `test/helpers/`), graphers stubbed per test on a PATH the test builds; the real graphify 0.9.29 only in `test/change/graphify-real.test.ts`, skipped when it is not on PATH, and in quickstart.md | **Target Platform**: developer machines and CI; the post-edit hook is POSIX `sh` as today | **Project Type**: single CLI package, brain==code
**Performance Goals**: `verify` unchanged (no new read on its path); `doors` gains one offline leftover probe of the brain (file reads and one `git ls-files`); `holdsIgnored` parses the graph once per refresh at land and close (1.8 MB here after the rebuild) | **Constraints**: `verify`, `doctor` and `doors` run no vendor and write no ignore line (MV-129, MV-131, Principle IV); refresh.ts still runs no git (MV-50/MV-52 `absent` leg) and reads no HEAD (MV-103 `absent` leg); the brain==code and consumer hooks keep their bytes (492 B, codegraph 558 B); the consumer door is byte-identical (MV-90); legs of rows NOT touched stay green — MV-61's `ASK IT BEFORE READING THE TREE RAW` and `has NO query command` unique, MV-102's `renderBrainDoor\(cfg, countActiveInvariants` unique, MV-125's `count=6` skips, MV-52's `missingRequired\(spec, dir\)` unique, MV-124's installed-skip unique, MV-12's `/brain==code/` | **Scale/Scope**: one new row, sixteen amendment notes, four registry fields, about fifteen source files, about twenty-five test files (four new), nine documentation files

No NEEDS CLARIFICATION remains: every unknown the design carried was measured (research.md
R1–R15) or taken at the spec's stated default (spec Assumptions).

**Base and line numbers.** The design cites `file:line` on `main` at **92c4c08**. `opsx-through-its-cli`
(#4, MV-147) was merged and archived (bfe9728) before this change was promoted (49591e7,
MV-148 reserved) and declared (e5d034f); #4 touched `src/adapters/{registry,sdd,detect}.ts`,
`src/change/carry.ts`, `src/commands/{change,doctor,roadmap}.ts`, `src/doors/flow.ts`,
`src/lib/{code-in-change,repo-state}.ts` and the doors' rendered files. **Every `file:line` in
these artifacts is re-anchored on the branch head at apply time (T001)**; tasks name functions
first and lines second, and none depends on #4's line numbers. The design's "today" leg counts
were re-run on e5d034f and hold (research.md R17).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. A Claim Nobody Checks Decays** — MV-148 anchors each mechanism with a `unique` leg (the
brain guard, `askedGraphers`, `brainRefreshGrapher`, `whereLines` and its head sentence,
`graphPointer`, the hook's brain-checkout test, `askAt` ×2, `rebuild`, `uninstall`,
`uninstallFirst`, `remove`, `graphIgnoreLines`, `holdsIgnored`, the record, land's ignore write
and its `.gitignore` exclusion, the forced worktree removal, `leftoverGraphs`, doctor's fact
line, init's untracked read, plan's line, the two flow rows), an `each` leg on the paths clause
and on the leftover probe in `init` and `doors`, `absent` legs on the fixed ignore list, on
`writeIgnores` in `doors`/`doctor`/`verify`/`repos` and on `--force` in the hook, seven test-title
legs, two site legs and `count=16` on the dated notes (research.md R17). Every leg an amended row
loses is moved by the task that makes it false (MV-128, MV-140 ×2).

**II. The Tool Never Claims More Than It Checked** — no byte saving is claimed for asking the
graph against a narrowed grep (2.1–2.6× more, stated); the base pointer says "without this
branch's edits"; a local index is never pointed at a change's worktree, where codegraph answers
silently from the index above; "refreshed after your edits" is said only for the grapher the
wired hook runs (FR-014), and the hook is wired only where its binary is reachable from every
repo it follows into (FR-012); a kept install is reported with its removal, never failed and
never refreshed; `doctor`'s ignore fact says land rebuilds only if the graph holds nodes under
the lines; the rebuild bypasses the vendor's shrink guard only where recorded lines explain the
shrink; the door no longer says a graph holds "code only" where root documents stay in it
(critic gap 13).

**III. The Law Changes Before The Code** — MV-148's row and the sixteen notes are the first
tasks (T002–T004); the row was reserved by `change new` (49591e7) and `change.invariants`
declares exactly the sixteen touched rows (e5d034f); filed `proposed`, only a human enacts it.

**IV. Deterministic, Offline, Small** — no new dependency; `leftoverGraphs`, `askedGraphers`,
`brainRefreshGrapher`, `graphIgnoreLines` and `whereLines` are offline (file reads and git
through its argument vector); `doors`, `doctor`, `verify` and `repos` never write an ignore line
(an `absent` leg); the vendor runs only where it already ran — the refresh at land and close,
with the entry's `env` and lock — plus its recorded `rebuild` in that same runner; the
`graphify-real` test is skipped, never failed, where graphify is not on the host (tests do not
depend on host configuration).

**V. An Invented Integration Is A Lie** — `askAt`, `rebuild`, `harness.uninstall`, the
gemini-first order and `remove` are each measured with the real binary and name its version in
a registry comment (graphify 0.9.29, codegraph 1.6.0); the new behaviour dispatches on the
entry's fields (`artifactKind`, `askAt`, `rebuild`, `graphignoreFile`, `harness.uninstall`, a
platform's `uninstallFirst`, `remove`), never on a grapher's or platform's name; codegraph's
"no ignore file was verified" comment is replaced by the mechanism measured on 1.6.0, and it
gets no lines until one is (`codegraph-worktrees-and-verbs`).

**Gate**: passes.

**Re-checked after Phase 1 design** (data-model.md, contracts/, quickstart.md): passes. Three
choices go beyond the design, each recorded in research.md: the gemini-first order is data on
the platform entry (`uninstallFirst: true`), not a name in code (Principle V); `change land`
writes the grapher's ignore file alone, never `.gitignore` (critic gap 5); the derived lines
leave out every known grapher's own output directory (critic gap 2). None moves an active row's
statement beyond the sixteen notes.

## Project Structure

### Documentation (this feature)

```text
specs/075-graph-answers-where-asked/
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
.multivac/invariants.md          # MV-148 row + sixteen dated notes + legs — FIRST
.multivac/changes/graph-answers-where-asked.md  # body: the quickstart record (frontmatter declared, e5d034f)
src/adapters/registry.ts         # AdapterSpec: askAt, rebuild, remove, harness.uninstall, platform uninstallFirst; graphignore removed (US4); graphify and codegraph entries, measurement comments
src/adapters/detect.ts           # brainHoldsCode, askedGraphers, brainRefreshGrapher; the brain guard in adapterFor (US3); the :86-93 comment
src/lib/code-in-change.ts        # nonCodeGlobs: every known grapher and every graphers: entry (US3); graphIgnoreLines (US4)
src/adapters/refresh.ts          # IGNORE_RECORD; writeIgnores(lines, opts) exported, skip rules, returns boolean; ensureGraphs passes graphIgnoreLines; runHarnessInstalls passes []; holdsIgnored; refreshGraph picks rebuild; comments
src/lib/repo-state.ts            # leftoverGraphs + LeftoverGraph, beside leftoverSdds and #4's leftoverBodies
src/doors/settings.ts            # refreshHookCmd(…, follow?) and installHookConfig's pass-through
src/commands/doors.ts            # projectInto(follow, reach roots); the brain projection through brainRefreshGrapher; the two notices; leftoverGraphs for the door
src/doors/brain.ts               # ASK stem constant; freshness helper; whereLines; renderBrainDoor(config, n, leftovers); the brain==code line; the leftover line
src/doors/ecosystem.ts           # ecosystemGraphLines for the brain through askedGraphers
src/doors/flow.ts                # declared roots; the gate row's `who`; the declared-no-code-root row; the refresh row through brainRefreshGrapher
src/commands/change.ts           # cmdPlan (the brain) + line; graphPointer + its call in cmdApply; commitGraph's ignore step; removeWorktrees' forced removal; comments
src/commands/doctor.ts           # grapherLines: fact line, leftover lines, ignore facts, refresh path
src/commands/repos.ts            # reposCheck: the brain's leftover fact
src/commands/init.ts             # holdsFiles; toolsInitWouldRun; the init line; the door render passes leftovers
test/**                          # see tasks.md (four new files: change/codeless-brain, change/graph-where, doors/where, change/graphify-real)
.graphifyignore, graphify-out/graph.json   # this brain: the record + derived lines, one forced rebuild (instance edit)
CHANGELOG.md, DESIGN.md, README.md, site/content/docs/{reference/{graphers-and-sdd,commands,configuration}.md,guide/{running-changes,getting-started}.md,concepts/composition.md}, skills/multivac/{SKILL.md,references/change.md}   # the surfaces that would lie
AGENTS.md, CLAUDE.md, .multivac/flow.md, .multivac/ecosystem.json, .claude/skills/multivac/**   # re-rendered by `multivac doors`, never hand-edited
```

**Structure Decision**: no new source module. The three resolvers sit in detect.ts beside
`adapterFor` and `adaptersByRoot`, reading the top level only through `ownDecl`, so MV-122's
dotted leg and #3's bracket leg stay at 0; `graphIgnoreLines` sits beside `nonCodeGlobs`,
whose top-level directories it is; `leftoverGraphs` beside `leftoverSdds` and `leftoverBodies`,
the same report-never-fail pattern; `graphPointer` and the land ignore step in change.ts,
because the ignore file's HEAD read must stay out of refresh.ts (MV-103's `absent` leg);
`whereLines` in brain.ts beside `grapherLines`, sharing its `ASK` stem, its freshness helper and
its no-query line so each literal a leg reads is spelled once.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Two graph renderings in the brain door (`grapherLines` kept, `whereLines` added) | the consumer door and a brain==code door must stay byte for byte (MV-90, SC-007, SC-019), while a code-less brain and a brain==code brain's siblings need a pointer form | one rendering either changes every consumer's door or drops the flag that reaches a code repo's graph |
| A follow form of the post-edit hook beside today's | a code-less brain must follow edits into code repos and never refresh a kept install; the other hooks' bytes are pinned by MV-52 and MV-140 legs | one form everywhere either rewrites every brain's and consumer's hook or, with today's fallthrough, rebuilds a graph in a brain that holds no code |
| Sixteen amendment notes | each of these rows states a sentence this change makes false ("the brain" as a grapher root, the static ignore list, what land commits, what `doctor` offers) | leaving any is a row contradicting code, the drift MV-111 exists to stop |
| `change land` writes into other teams' code repos (the ignore file and a forced rebuild) | the retrofit of existing repos is where most of the saving is (research.md R15); it runs only on the change's branch, where the team reviews it | `doctor`-only printing leaves every existing repo's graph polluted (the design's §10 alternative; the default is yes) |
| Stories run B, C, A, D rather than the design's A, B, C, D | the resolver change alone turned 25 tests red, four of which only the door, flow.md, ecosystem and hook surfaces turn green (critic gap 1) | landing the guard first leaves a code-less brain's door silent and its suite red until two later stories land |
