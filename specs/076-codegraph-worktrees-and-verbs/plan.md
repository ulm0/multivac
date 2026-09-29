# Implementation Plan: codegraph answers for the checkout it is asked in

**Branch**: `076-codegraph-worktrees-and-verbs` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/076-codegraph-worktrees-and-verbs/spec.md`

## Summary

Four pieces of one row, MV-149, landed law first, on top of graph-answers-where-asked (#5,
MV-148), whose surfaces this change extends. **Indexed**: `change apply` builds or syncs a local
grapher's index in each checkout it hands out (`indexWorktree`, through `refreshGraph`, with the
entry's `env` and MV-58's lock), after appending the entry's `ignore` lines git would list to the
repository's common `info/exclude` (`excludeLocalOutputs`); the grapher runner closes the
child's stdin; `change land` runs the same exclude step, #5's ignore step for the grapher's own
file and the sync in the branch checkout, committing no index; #5's `graphPointer` prints
`its index: -p <checkout> — <freshness>` wherever the index is installed; #5's brain==code line
and `whereLines` group line flip, conditionally. **Followed**: a refresh hook is a grapher's by
the artifact its toplevel test names (`refreshKey`); the settings merge keeps one hook per wanted
grapher (`ensureRefreshes`, sharing `rewrite` with `ensureEvent`); `brainRefreshGraphers`
replaces #5's `brainRefreshGrapher`; `hookRefreshes` is the one predicate the door, the pointer,
flow.md and `doctor` ask; `doctor` names a repo holding a foreign grapher's artifact. **Kept
out**: codegraph declares `codegraph.json` as its ignore file, `exclude` as the list and four
human lists; `graphIgnoreLines` gives it only the structural lines, the mount through
`mountDir`; `spliceJsonList` inserts into the text and never re-serialises; land commits
`codegraph.json` alone. **Asked**: codegraph records four measured verbs, each naming what it
misses; the list header claims no saving over grep; a brain==code sibling group says "the verbs
above"; the entry's note discloses, by version, what the agent's own codegraph calls write and
send, replacing #4's sentence. The stories run in dependency order (US1 indexed, US2 followed,
US3 kept out, US4 asked), so the mount is out of a consumer's index before its door lists the
verbs. Research and measurements: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/` | **Primary Dependencies**: picomatch, yaml, citty — no new dependency (MV-02) | **Storage**: files; git through src/lib/git.ts only (MV-03); a code repo's common `info/exclude`; a consumer's `codegraph.json`
**Testing**: `node --test "dist-test/**/*.test.js"` (node:test, `test/helpers/`), graphers stubbed per test through `vendorPath` on a PATH the test builds, each stub logging argv, cwd and the four opt-out variables; the real codegraph 1.6.0 only in `test/change/codegraph-real.test.ts`, skipped where it is not on PATH (CI installs none — local-only), spawned with `HOME` in a temp directory and the opt-outs, and in quickstart.md | **Target Platform**: developer machines and CI; the post-edit hooks are POSIX `sh` as today; git 2.43 (no `--path-format` needed) | **Project Type**: single CLI package, brain==code
**Performance Goals**: `verify` unchanged (no new read on its path); `change apply` gains one synchronous build per named codegraph repo — 1.1–7.0 s by size, twice on a repo's first apply — and 0.29–0.81 s on a re-apply or at land; `doors` unchanged in cost; each extra follow hook costs ~8–15 ms per edit against the 1.45–1.51 s `verify` gate already there | **Constraints**: refresh.ts still runs no git (MV-50/MV-52 `absent` leg) and reads no HEAD (MV-103 `absent` leg): the `check-ignore` and `--git-common-dir` reads, the `info/exclude` write and the `codegraph.json` HEAD read live in change.ts and doctor.ts; `spliceJsonList` is pure; single-grapher `settings.json` and every pinned hook command (#5's 492/558/540/606 B) byte-identical; this repository's door byte-identical; legs of rows NOT touched stay green — MV-62's `TELEMETRY IS ON BY DEFAULT` and `codegraph telemetry off` unique, MV-115's `execFileP\('sh', \['-c', run\]`, MV-123's `localBin\(dir\)\]` and `found on neither PATH nor` unique, MV-125's `count=6` and `await refuseReadOnly\(` `count=2`, MV-132's offline `absent` leg in repo-state.ts, MV-137's legs | **Scale/Scope**: one new row, ten amendment notes, two registry fields, one new module (`src/lib/json-splice.ts`), about twelve source files, about sixteen test files (one new: `test/change/codegraph-real.test.ts`), nine documentation files

No NEEDS CLARIFICATION remains: every unknown the design carried was measured (research.md
R1–R21) or taken at the spec's stated default (spec Assumptions, research.md R27).

**Base and line numbers.** The design cites `file:line` on `main` at **92c4c08**; these artifacts
were drafted on main at **62d4588** (#3 and #4 merged, #5 promoted and branched but not yet
implemented). graph-answers-where-asked (#5, MV-148) **lands before this change** and rewrites
most of the files it touches: registry.ts, detect.ts, refresh.ts, code-in-change.ts,
repo-state.ts, settings.ts, doors.ts, brain.ts, ecosystem.ts, flow.ts, change.ts, doctor.ts,
repos.ts, init.ts, and `test/change/graph-where.test.ts`, `test/doors/where.test.ts`,
`test/change/codeless-brain.test.ts`, `test/change/graphify-real.test.ts` are new there. **Every
`file:line` in these artifacts is re-anchored at apply time on the tree with #5 merged (T001)**;
tasks name functions first and lines second, and none depends on a line number. Where #5's
artifacts and this change's design disagreed on a #5 name or string, #5's artifacts won
(research.md R0): the brain==code codegraph line keeps #5's first sentence (no "code only"); a
follow hook is wired by #5's "PATH or each writable code repo" rule, per grapher; land's ignore
step is #5's `gitignore: false` call; `writeIgnores` is #5's `(name, spec, dir, scope, lines,
opts?)` returning whether it appended. MV-149 is allocated by `change new` after #5 closes
(MV-26); if another change allocates first, T001 substitutes the ID everywhere.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. A Claim Nobody Checks Decays** — MV-149 anchors each mechanism with a `unique` leg (apply's
build and its call, the common-dir read, the closed stdin, `refreshKey`, `ensureRefreshes`,
`rewrite`, `hookRefreshes`, codegraph's `graphignoreFile`, `graphignoreJson` and
`graphignoreScope`, `spliceJsonList`, `mountDir`, the queue path and the download clause of the
note, the pointer's freshness, the door's `codegraph init` sentence, doctor's foreign-artifact
line), `count` legs on the exclude step's two calls, the doors' fallback clause (2) and the four
verb runs, `absent` legs on re-serialising, on the retired claims at every copy (10 lines in 6
files today, 0 after) and on the superseded telemetry sentences (2 today, 0 after), seven
test-title legs, two site legs and `count=10` on the dated notes (research.md R23). Every leg an
amended row loses is moved by the task that makes it false (MV-124, MV-140, MV-148).

**II. The Tool Never Claims More Than It Checked** — `its index: -p <checkout>` is printed only
where the index is installed, and its freshness only as the one predicate says; the doors
condition every worktree-index sentence on "where `apply` printed no such line"; the verb list
claims no saving over grep (refuted, 311/318) and each answer names what its verb misses
(`callers` counts what it lists, aliased imports, same-named symbols, `node -f` spelling);
`impact` is called a lower bound; the note discloses what the agent's printed calls send rather
than implying the entry's `env` covers them; a missing binary is named once, never silently; the
two-artifact race is a ceiling with its numbers and `doctor` names it; a malformed
`codegraph.json` is left and named, never rewritten.

**III. The Law Changes Before The Code** — MV-149's row and the ten notes are the first tasks
(T002–T004); the ID is allocated by `change new` (MV-26), `change.invariants` declares exactly the
ten touched rows; filed `proposed`, only a human enacts it.

**IV. Deterministic, Offline, Small** — no new dependency; `spliceJsonList`, `mountDir`,
`brainRefreshGraphers`, `hookRefreshes` and `refreshKey` are pure; `verify`, `doctor` and `doors`
run no vendor and write no ignore line (#5's `absent` leg); `doctor`'s new facts read files and one
`git` HEAD read through the argument vector; the vendor runs only where it already ran — the
lifecycle's refresh, now in the change's checkouts at apply and land — with the entry's `env`,
lock and closed stdin; the real-vendor test is skipped, never failed, where codegraph is absent,
and isolates `HOME` so it does not depend on or write the host's configuration.

**V. An Invented Integration Is A Lie** — every vendor fact is measured with the real binary and
names its version in a registry comment (codegraph 1.6.0: the layout, the prompt, the four verbs
and what each misses, `codegraph.json`'s lists and precedence, the telemetry queue, flushes and the
shim's download); the new behaviour dispatches on the entry's fields (`artifactKind`, `ignore`,
`graphignoreFile`, `graphignoreJson`, `graphignoreScope`, `artifacts[0]` as the hook's key,
`askAt`, `rebuild`), never on a grapher's name; no JSON record key is invented in `codegraph.json`,
which defines none; the entry discloses the network its printed commands reach.

**Gate**: passes.

**Re-checked after Phase 1 design** (data-model.md, contracts/, quickstart.md): passes. Five
choices go beyond the design, each recorded in research.md: the exclude step asks git of each
ignore line itself, not of the database path (critic gap 2, R4); a lookup miss in a worktree is
printed once where `equip` did not print it (critic gap 10, R6); `hookRefreshes` is one predicate
introduced before the resolver changes, so US1 and US2 each land green (R10); `leftoverGraphs`
takes a key to be asked per code repo (R0, R11); an ignored `codegraph.json` at land is a
warning, not a refusal of land, since no index waits on it (R16). None moves an active row's
statement beyond the ten notes.

## Project Structure

### Documentation (this feature)

```text
specs/076-codegraph-worktrees-and-verbs/
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
.multivac/invariants.md          # MV-149 row + ten dated notes + legs — FIRST
.multivac/changes/codegraph-worktrees-and-verbs.md  # frontmatter declared before apply; body: the quickstart record
src/adapters/registry.ts         # AdapterSpec.graphignoreJson, .graphignoreScope; codegraph: the three fields, four verbs + measurement comment, the layout and codegraph.json comments, the disclosure replacing #4's sentence; GrapherQuery doc
src/lib/json-splice.ts           # NEW: spliceJsonList, namedBy — pure
src/lib/code-in-change.ts        # mountDir; #5's graphIgnoreLines honours graphignoreScope and uses mountDir
src/adapters/refresh.ts          # runDeclared closes stdin; #5's writeIgnores JSON branch; readIgnoreLines; #5's holdsIgnored gated on rebuild
src/adapters/detect.ts           # brainRefreshGraphers replaces #5's brainRefreshGrapher; hookRefreshes
src/doors/settings.ts            # ARTIFACT_TEST, refreshKey, RefreshHook, rewrite, ensureRefreshes, the opts list; header and ownsRefresh docs
src/commands/doors.ts            # refreshHookOf; installHookConfig and projectInto take the list; the brain projection; #5's mixed notice out, the shared-artifact notice in
src/doors/brain.ts               # the list header; #5's brain==code codegraph line; #5's whereLines: local group line, <checkout>, freshness through hookRefreshes, the dedup line
src/doors/flow.ts                # the refresh row through hookRefreshes; the local-artifact wording
src/commands/change.ts           # excludeLocalOutputs, indexWorktree and its call in cmdApply; #5's graphPointer local row; commitGraph's local branch (exclude, #5's ignore step, sync, the alone commit, the ignored-file warning)
src/commands/doctor.ts           # refresh path per grapher and per artifact kind; the foreign-artifact fact; the codegraph.json facts
src/lib/repo-state.ts            # #5's leftoverGraphs: per-root key; an ignore file counts only beside its artifact or state directory
test/**                          # see tasks.md (one new file: test/change/codegraph-real.test.ts)
site/content/docs/{reference/{graphers-and-sdd,hooks,commands,configuration}.md,guide/running-changes.md,concepts/composition.md}, skills/multivac/{SKILL.md,references/change.md}, DESIGN.md, CHANGELOG.md   # the surfaces that would lie
AGENTS.md, CLAUDE.md, .multivac/flow.md, .multivac/ecosystem.json, .claude/skills/multivac/**   # re-rendered by `multivac doors`, never hand-edited; this brain's bytes do not change
```

**Structure Decision**: one new module, `src/lib/json-splice.ts`, because the splice is a pure
text transform with its own invariant (output minus span equals input) and its own `absent` leg on
serialising, and neither refresh.ts (which must stay git-free) nor code-in-change.ts (derivations)
is its home. Everything else extends the file that owns the concept: the git reads and the
`info/exclude` write sit in change.ts beside #5's land ignore step, so refresh.ts keeps MV-50's and
MV-103's `absent` legs; the resolver and the predicate in detect.ts beside `askedGraphers`, reading
the top level only through `ownDecl`; the merge in settings.ts beside `ownsRefresh`, sharing one
`rewrite` so MV-74's `unique` legs keep one spelling; `mountDir` beside `nonCodeGlobs`, whose mount
glob can reuse it later.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| A write under `.git/` (the common `info/exclude`) | a worktree index must never be listed by git in any checkout: `git add -A` would stage codegraph's `.codegraph/.gitignore`, and close would keep the worktree | #5's forced removal alone leaves the `git add -A` window; a `.gitignore` edit is a tracked file on the branch; the per-worktree exclude is not read by git 2.43 |
| Two freshness wordings for one grapher (door: "refreshed at `change land` and `change close`"; pointer: "as of this apply, refreshed again at `change land`") | the pointer speaks of an index apply just built; the door of the index in general | one wording is false of one of them |
| A second mode of `writeIgnores` (JSON splice) beside #5's text append | codegraph reads `codegraph.json`, a JSON object; `.gitignore` is git-wide and breaks a re-mount (exit 128) | re-serialising drops a human's bytes; a `.gitignore` line is the route measured to break `git submodule add` |
| A per-grapher settings merge replacing "one refresh hook" | a mixed brain and a brain==code brain with a sibling on another grapher need each grapher's refresh, and the hook bytes #5 pins must not grow | a mutual-exclusion guard in each hook runs neither in a repo holding both; one hook per brain leaves mixed brains unrefreshed (#5's state) |
| Ten amendment notes | each row states a sentence this change makes false (one hook, no worktree index, no codegraph ignore lines, the one-verb registry, the disclosure owed by MV-147's note) | leaving any is a row contradicting code, the drift MV-111 exists to stop |
| Stories ordered W, H, K, V with K raised to P1 | the verbs are printed to consumers only once the mount is out of their index (ver-X V M2); H refreshes the indexes W builds | the design's W, V, H, K order ships four verbs that answer with the mounted brain's code until the last story lands |
