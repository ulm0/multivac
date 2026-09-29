# Implementation Plan: A run reads the checkout that holds where it was asked, and says one line when nothing is off

**Branch**: `078-verify-rooted-and-quiet` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/078-verify-rooted-and-quiet/spec.md`

## Summary

One row, MV-151, landed law first, on top of graph-answers-where-asked (#5, MV-148),
codegraph-worktrees-and-verbs (#6, MV-149) and change-file-cites (#7, MV-150). **Rooted**: one
resolver, `resolveRoot(start)`, runs before any config is read. The brain is the nearest
`.multivac/config.yml` from the start's real path up to its git toplevel, asked through
`cleanEnv()`; otherwise MV-138's path at the toplevel, the nearest mount its brain names below
the toplevel, the toplevel's mount or a `.gitmodules` path its brain names, the start's own
child brain, MV-49's stale pin and MV-127's door, in that order; outside a work tree, below an
ungoverned toplevel and in a submodule of a governed superproject the run says where it is and
advises nothing elsewhere; any other git refusal is quoted. A full report printed away from
its root names the root in one line. **Worktree and mount**: a brain change worktree is a brain
from every directory in it and reads each sibling in the change's own worktree for its key,
else where the main checkout does (`siblingDir`, critic gap 1); a mount stays brain-scoped and
words a missing sibling with its host, never `repos sync`. **Enclosing brain**: every command's
no-config refusal names the brain that holds the directory. **Quiet**: every report line
carries a required quiet decision; plain reads fold into clauses; reads that are not plain and
non-gating stale pins print beneath the one line; anything else off, any warning, an
unparsable open change file and an anchor on no row print the whole report, both streams
replayed in order through a tap in `out.ts`. Quiet is switched on by `--quiet`,
`MULTIVAC_QUIET=1` (which the shims export under a comment naming no ID) or the session-start
payload. **Payload**: the claude door target declares its harness's hook payload, including the
session's `cwd`; `verify` reads stdin only under the marker variable, starts at the payload's
session directory, and after an edit follows into the edited file's checkout when a consumer,
a door or a brain that is its own git toplevel governs it; no settings.json string moves.
**Rooted elsewhere**: `count` uses the resolver, `doctor`, `doors` and `roadmap` take the brain
half and name the root when it differs by real path, and the dispatcher reads MV-86's notice
from the root's brain, floor only in a consumer. Research and measurements:
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/` | **Primary Dependencies**: picomatch, yaml, citty — no new dependency (MV-02) | **Storage**: files; git through src/lib/git.ts only, by argument vector (MV-03)
**Testing**: `node --test "dist-test/**/*.test.js"` (node:test, `test/helpers/`); in-process `verify.run(argv, { cwd, env, stdin })` for the payload and quiet cases, spawned `dist/cli.js` with a scrubbed environment for the shim, merge-hook and dispatcher cases; no harness in tests — the payload is a JSON string handed to `stdin`; the real Claude Code only in quickstart.md's last walk, for the human | **Target Platform**: developer machines and CI, POSIX `sh` shims; git 2.43 (`rev-parse --show-toplevel`, `--show-superproject-working-tree`) | **Project Type**: single CLI package, brain==code
**Performance Goals**: `resolveRoot` costs 3.4–7.2 ms per resolution (s2, seven locations × 10 runs) against 1.1–1.3 s per `verify` here; a rooted command resolves twice (the dispatcher's notice and the command); under the harness the payload read ends at end-of-file at once; only a pipe nobody closes, under the marker variable, costs the 2 s guard (s1: 3,249 ms in all); `count`, `doctor`, `doors` and `roadmap` gain one resolution each | **Constraints**: `src/doors/settings.ts` and `.claude/settings.json` are not edited (MV-112's five legs, MV-140's refresh leg, #5's pinned hook commands and #6's per-grapher hooks keep their bytes); the bodies of `worktreeBrain`, `findMount`, `findStaleMount`, `resolveRepoKey`, `versionNotice`, `refreshHookCmd` and `MANUAL_CHAIN_LINE` are unchanged; legs of rows NOT touched stay green — MV-146's `sddDeclaration: 'report'` `count=3` over `{verify,count}.ts`, MV-109's `await resolveSources\(brainDir, cfg, false\)`, MV-86's `if \(n\) warn\(paint\(n\)\)`, MV-52's `install.ts /graph|refresh/ absent`, MV-115's `install.ts /--git-common-dir/ count=3`, MV-09's, MV-49's and MV-53's legs (site and skill included), MV-111's `skills/**` arrow leg, MV-126's and MV-84's site legs, MV-141's retired shim phrases, MV-127's `multivac repos sync` `each` over `{doctor,doors,repos}.ts`, MV-137's merge-hook test title | **Scale/Scope**: one new row, five dated notes (four when MV-150's sentence is absent), two moved legs, about fourteen source files, three new test files, about ten extended test files and three whose spawned processes are scrubbed, seven documentation files

No NEEDS CLARIFICATION remains: every unknown the design carried was measured (research.md
R1–R15) or taken at the spec's stated default (spec Assumptions).

**Base and line numbers.** The design cites `file:line` on `main` at **62d4588** (its
predecessor #4 is cited at 92c4c08). These artifacts were drafted on 62d4588 with
graph-answers-where-asked (#5, MV-148) being implemented in its worktree,
codegraph-worktrees-and-verbs (#6, MV-149) drafted in scratch and change-file-cites (#7, MV-150)
designed. All three **land before this change** and edit files it touches:

- `src/commands/doctor.ts` — #5 (`grapherLines`: fact, leftover and ignore lines, refresh path)
  and #6 (refresh path per grapher and artifact kind, the foreign-artifact fact, the
  `codegraph.json` facts). This change edits `run`, the five sibling sites and `reposLine`'s
  missing advice — separate functions.
- `src/commands/doors.ts` — #5 (`projectInto(follow, reach roots)`, two notices) and #6
  (`refreshHookOf`, `installHookConfig(dir, hookConfig, refreshes, notices)`, the shared-artifact
  notice). This change edits `run`'s first lines only.
- `src/adapters/registry.ts` — #5 (`askAt`, `rebuild`, `remove`, graphify and codegraph
  entries) and #6 (codegraph's `graphignoreJson`, `graphignoreScope`, verbs, disclosure). This
  change adds `HookPayload` before `DoorTarget` and one `payload:` field in the claude
  target's `hookConfig` — lines neither touches.
- `src/commands/verify.ts` — #7 (`OpenChanges.changes`, `Evaluated.closeRefusals`, the
  finished line's refusing variant, "coordinate with #8"). This change rebases on #7's print
  site: `openChangeClaims` carries #7's `changes` and this change's `unparsed`, and #7's
  variant is emitted with `quiet: null`.
- `src/doors/settings.ts`, `src/adapters/refresh.ts`, `src/adapters/detect.ts`,
  `src/commands/change.ts` — #5, #6, #7 edit them; this change does not.
- Docs: #5 edits skills/multivac/SKILL.md :113-136 and DESIGN.md :1377; #6 edits
  site/content/docs/reference/hooks.md (the refresh hook paragraphs) and commands.md (`change
  apply`, `change land`, `doctor` rows); #7 edits the change reference and flow.md. This
  change edits other passages of the same files.

**Every `file:line`, every hook byte count and every byte figure of this brain's own report in
these artifacts is re-anchored and re-measured at apply time on the tree with #5–#7 merged
(T001)** — the settings.json commands as #5 and #6 leave them (#5 pins its refresh commands at
492, 558, 540 and 606 B), this brain's green report (348 B at 62d4588) and quiet line (195 B),
the root lines (49–65 B), the enclosing-brain refusal (117 B at `src`), and the row's and notes'
sizes. Tasks name functions first and lines second, and none depends on a line number. Where
#5's, #6's or #7's landed text differs from what these artifacts quote, the landed text wins
and contracts/cli-output.md is adapted in T001. MV-151 is allocated by `change new` after #7
closes (MV-26); if another ID is reserved, T001 substitutes it everywhere, the count leg on the
notes included.

**How the hook edits compose with #5's and #6's.** This change writes no settings.json string
and no refresh hook: the payload is read inside the edit gate's own `verify` process, and each
hook process the harness starts — the gate, #5's follow-only refresh hook, each of #6's
per-grapher hooks — receives its own copy of the payload on stdin (#5's hooks already read
`file_path` from it with `sed`). The new `payload` field sits on the door target's type and is
never serialised: `installHookConfig` reads `hookConfig.path` and `hookConfig.postEdit` only,
as #6 leaves it (T001 re-checks). #5's follow guard — a refresh never runs in a checkout of a
code-less brain — is the inverse of this gate's follow, which judges the law in the brain
checkout that governs the edited file; both are right for what they run. `hookRefreshes` (#6)
reads `hookConfig.postEdit` and is untouched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. A Claim Nobody Checks Decays** — MV-151 anchors each mechanism with a `unique` leg (the
resolver, its named-mount walk and unnamed fallback, the toplevel read and its refusal test,
the sibling base and the sibling lookup, the root line, the enclosing-brain refusal, the mount
wording, the payload contract, its reader, the session directory, `followable`, the required
quiet fields, the off test, the warning test, the tap, the one line, the stale-under rule, the
consumer notice, `count`'s consumer read, the shim builder's export, the test helper), `count`
legs (the resolver's five calls, the brain half's three, `doctor`'s five sibling sites,
`verify`'s two, the three root-line comparisons, `verify.ts`'s three direct prints), an `each`
leg on the regenerated shims, `absent` legs (the directory-bound lookups, `doctor`'s old
resolution, a switch in the gate strings, a row ID in the shims, four retired phrases), fifteen
test-title legs, a site leg and `count=5` on the dated notes (research.md R16). Every leg an
amended row loses is moved by the task that makes it false (MV-127, MV-138).

**II. The Tool Never Claims More Than It Checked** — a report read away from its root says
which root it judged; "nothing was verified" is printed wherever nothing was, and a git refusal
is quoted rather than read as "no repository"; quiet never hides anything that is off — a read
that is not plain, a non-gating stale pin, a warning, a staged law, an unparsable change file
and an anchor on no row all print, and the one line keeps every read's ref, sha and age; the
post-edit follow never judges a checkout it cannot tell is governed; the two harness facts are
stated as measured from the binary and a simulated payload, needing a live session (spec
Assumptions).

**III. The Law Changes Before The Code** — MV-151's row, the notes and the change file's
declaration are the first tasks (T002–T004); the ID is allocated by `change new` (MV-26); filed
`proposed`, only a human enacts it, in its own commit (MV-81).

**IV. Deterministic, Offline, Small** — no network, no model, no new dependency; git runs by
argument vector through `cleanEnv()`; the resolver walks a start's ancestors — a handful of
`existsSync` calls and at most two `git rev-parse` — never the tree, and `verify` still
enumerates through `git ls-files`; stdin is read only under a harness's own marker variable,
where the harness closes it at once; the 2 s guard is a stated ceiling for a pipe nobody closes
(Complexity Tracking). Tests no longer depend on host configuration: every test that spawns the
CLI scrubs both switches (FR-032, critic gap 3), and in-process runs take their `env` from the
test.

**V. An Invented Integration Is A Lie** — the payload contract is data on the door target,
declared only for the harness whose binary was read (Claude Code 2.1.283: the marker variable,
the event names, `tool_input.file_path`, `cwd`, the forwarded-hook note), with a registry
comment naming the version; `verify` dispatches on the declared fields, never on a harness
name; a harness whose door declares no payload keeps today's behaviour, stated as a ceiling.

**Gate**: passes.

**Re-checked after Phase 1 design** (data-model.md, contracts/, quickstart.md): passes. Five
choices go beyond the design, each recorded in research.md: a sibling is looked up in the
change's own worktree by key before the main checkout (critic gap 1, R5), which also covers a
layout whose paths are not `../<key>`; the session's directory comes from the payload's `cwd`
and the follow takes a brain only when it is its own git toplevel (critic gap 7, R8); the three
root-line comparisons use `samePath` (critic gap 6, R13); a test helper removes both switches
from every spawned environment (critic gap 3, R14); two `absent` legs are added — a row ID in
the shims and the scope table's "cwd is …" wording (critic gaps 2 and 5, R16). One inconsistency
inside the design is resolved toward its second prototype: below an ungoverned toplevel a
directory holding a child brain is that brain's consumer, as before, so the "the brain at
<child> verifies from there" clause is kept only outside a work tree (R7, re-measured with the
prototype's build). None moves an active row's statement beyond the five notes.

## Project Structure

### Documentation (this feature)

```text
specs/078-verify-rooted-and-quiet/
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
.multivac/invariants.md          # MV-151 row + five dated notes (four without MV-150's) + legs; MV-127's and MV-138's legs moved — FIRST
.multivac/changes/verify-rooted-and-quiet.md  # frontmatter: touches, adds: [MV-151], claims: [MV-151]; body: the quickstart record
src/lib/git.ts                   # ToplevelError, toplevel(dir), superproject(top) — both through cleanEnv()
src/types.ts                     # CommandContext.env?, CommandContext.stdin?; Command.rooted?
src/lib/out.ts                   # tapOutput, the warning counter, warnings(); say/warn through the tap
src/lib/config.ts                # enclosingBrain(dir); readConfig's no-config refusal names it
src/adapters/registry.ts         # HookPayload; DoorTarget.hookConfig.payload?; the claude target's payload and its measurement comment
src/anchor/evaluate.ts           # EvaluateOptions.missing — the detail of a leg on a repo not on disk
src/commands/verify.ts           # Root, resolveRoot, namedMount, declaredMount, staleError, followable, rootedBrain, siblingBase, siblingDir, mountHost, consumerSource, hookAsk; Diagnostic.quiet, RepoSource.clause/why, OpenChanges.unparsed (beside #7's changes); runVerify: session directory, follow, switch on the root, root line, emit/tap/flush, the one line; ARGS/TAKES --quiet; usage; rooted
src/lib/code-in-change.ts        # CodeLine.quiet on every return
src/commands/count.ts            # resolveRoot; the SDD mode keyed on kind; the consumer's own key through consumerSource; rooted
src/commands/doctor.ts           # rootedBrain + root line (samePath); siblingDir at five sites; the missing advice's ` in <main checkout>`; rooted
src/commands/doors.ts            # rootedBrain + root line (samePath); rooted
src/commands/roadmap.ts          # rootedBrain + root line (samePath); rooted
src/cli.ts                       # main(argv, cwd, io); cmd lookup before the notice; the notice from the root for rooted commands, floor only in a consumer; readStdin; env and stdin passed to run
src/hooks/install.ts             # shim(): two comment lines and `export MULTIVAC_QUIET=1` after the chain block
.multivac/hooks/{pre-commit,pre-merge-commit,pre-push}   # regenerated by `multivac doors`, never hand-edited
test/helpers/fixture.ts          # scrubbedEnv(): process.env without MULTIVAC_QUIET and CLAUDE_PROJECT_DIR
test/**                          # see tasks.md (new: test/verify/rooted.test.ts, test/verify/quiet.test.ts, test/cli/rooted-refusal.test.ts)
site/content/docs/reference/{commands,configuration,hooks}.md, DESIGN.md, skills/multivac/{SKILL.md,references/verify.md}, CHANGELOG.md   # the surfaces that would lie
AGENTS.md, CLAUDE.md, .multivac/flow.md, .multivac/ecosystem.json, .claude/skills/multivac/**, .claude/settings.json   # re-rendered by `multivac doors`; settings.json byte-identical
```

**Structure Decision**: no new module. The resolver and everything it answers sit in
verify.ts beside `worktreeBrain`, `findMount` and `findStaleMount`, whose bodies it calls and
never changes, because MV-09, MV-49, MV-127 and MV-138 anchor there; `count`, `doctor`,
`doors`, `roadmap` and the dispatcher import it, as `count` already imports `findMount`. The
toplevel read sits in git.ts, the only home of git (MV-03). `enclosingBrain` sits in config.ts
beside `readConfig`, whose refusal every command shares, and runs no git so that refusal stays
cheap. The tap sits in out.ts because `say` and `warn` are the only print paths every callee
uses. The payload contract sits on the door target, the entry that already declares the
harness's hook file and matcher.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| `verify` reads stdin in the binary that runs in every pre-commit hook, with a 2 s guard | the harness hands a hook its event and edited file only on stdin; the read happens only under the harness's own marker variable, where the harness closes stdin at once | a flag in the gate command adds 209 B to every red delivery (the harness quotes the command) and duplicates the gate under an older `doors`; `--edited`/`--quiet` in the command makes every binary up to 0.14.1 exit 2 on each edit (unknown flag) |
| Module-level state in out.ts (the tap and a warning counter) | warnings from callees must be held in their order and counted, so the whole report replays byte for byte under `2>&1` | "the run emitted no warning" checked on `console.error` cannot see callees; buffering only the report's own lines reorders the streams (measured 654 B case) |
| Two resolutions per rooted command (the dispatcher's notice, then the command) | MV-86's notice is emitted once, from the dispatcher (leg `if \(n\) warn\(paint\(n\)\)` unique), and must read the brain the command will read | moving the notice into each command breaks MV-86's single print site; passing the root through the context couples the dispatcher to one command's resolution and still resolves before `run` |
| The shims export a switch for every committer | quiet must reach agent commits, which run through the shims; a variable is ignored by an older binary, which prints in full | a flag in the shim locks commits under an older binary (unknown flag, exit 2), which MV-86 forbids; sniffing `CLAUDECODE` to quiet only agents is not proposed (spec Assumptions) |
| A mount is judged as a brain while the consumer around it is judged as a consumer | a commit in a mount goes to the brain's repository; judged as its host, every brain gate went away (a verifier landed `drop MV-20` through a mount) | answering the mount as its host consumer — the design's first answer, dropped as blocking |
| Five amendment notes, one conditional on #7's enacted text | MV-53's "one `read` line per repo" and MV-112's "a green run stays silent" become false, MV-150's consumer ceiling is lifted, and MV-127's and MV-138's lookups move to the toplevel with their legs | leaving any is a row contradicting code, or a leg moved with no dated word in its row — the drift MV-111 exists to stop |
