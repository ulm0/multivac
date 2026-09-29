# Implementation Plan: The change file cites, never restates

**Branch**: `077-change-file-cites` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/077-change-file-cites/spec.md`

## Summary

A change file's claim becomes its row's ID. The reader accepts a bare ID, a `{ id }` map and a
legacy `{ id, statement }`; the writer writes the bare ID and gives a legacy statement back byte
for byte; the scaffold and `change new` teach `claims: [<ID>]`; `change plan` names a legacy
statement without gating. A key inside a claim other than `id` and `statement` is named by
every reader and refused by the ones that rewrite the file (the `change` commands and `roadmap
sync`), so `verify`, `roadmap`, `doors` and the code gate never lose sight of the change. One
pure predicate, `citeLines`, gives each claim its first citation defect — no row, short row,
retired row the change does not retire, row not yet retired, undeclared, reserved by another
change, unstated, anchored only in the change file — and each owned row no claim cites a line
(an `adds` row already in the law, an anchored proposed row, a stated unanchored one, which only
says). `change close` prints every refusal in one run before anything is written, naming a pull
when the brain's own channel already states the row; `--abandon` refuses a change whose own
proposed row states a rule. "Anchored" becomes the set `verify` parses. `verify`'s finished line,
`land`'s last-repo lines and `plan` read the same predicate, so nothing tells an operator to close
a change close will refuse on its citation gate. The brain's channel becomes its own entry's
`channel:` first, as MV-53 reads every other entry. Every copy of "close checks law and code ended
consistent" is corrected, the constitution by a PATCH. MV-150 is added and MV-15, MV-45, MV-80 and
MV-117 amended, law first. Research and measurements: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/` | **Primary Dependencies**: yaml, picomatch, citty — no new dependency (MV-02) | **Storage**: files; git through src/lib/git.ts only (MV-03)
**Testing**: `node --test "dist-test/**/*.test.js"` (node:test, `test/helpers/`, `makeScratchEcosystem`, `publishedBrain`); the real spec-kit 1.0.11, openspec 1.13.2, graphify 0.9.29 and codegraph 1.6.0 only in quickstart.md | **Target Platform**: developer machines and CI, POSIX and win32 | **Project Type**: single CLI package, brain==code
**Performance Goals**: `verify` stays sub-second: the finished line's refusals are computed from the rows and anchors already read, only when a change is finished; close reads anchors once instead of twice and stops reading every tracked file; the channel is read only on a refusal | **Constraints**: offline (MV-01), the channel read through `git show` of an existing ref; the legs research.md R15 lists as must-not-move stay green (MV-45's `startsWith\('RESERVED by change '\)` stays in reserve.ts alone, MV-117's `anchored ONLY in` unique in change.ts, MV-137's `'claims', 'sdd_skipped',`, MV-139's `statement` absent in ecosystem.ts, MV-146's `landSdd` `count=2`, MV-89's `assertStarted\(` `count=5`, MV-53's `channelRef`); a clean change's output byte-identical | **Scale/Scope**: one new row, four notes, seven source files, ten test files and one new one, seven prose surfaces and the changelog

No NEEDS CLARIFICATION remains: every unknown the design carried was measured (research.md
R1–R17) or taken at the spec's stated default (spec Assumptions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. A Claim Nobody Checks Decays** — this change is Principle I applied to the change file:
the rule's second copy, which nothing checked, goes, and close checks the one it cites. MV-150
anchors each mechanism with a `unique` or `count` leg (the bare read and write, the claim-key
message and its two refusing callers, the legacy notice, `citeLines` and three of its clauses,
`abandonLines`, `statedUpstream` twice, `brainChannel` and its three callers, the one anchor
collection, `citeLines` three times in change.ts and once in verify.ts), `absent` legs on the text
scan, the retired examples and every copy of the "ended consistent" sentence, test-title legs per
story, a site leg and a `count=4` on the dated notes (research.md R15). Every leg the change moves
is moved in the same task (`anchors are read before archive`, within concurrency.test.ts).

**II. The Tool Never Claims More Than It Checked** — close stops archiving claims whose rule is
written nowhere; the finished line and land stop printing an instruction close rejects; a stray
claim key is named, never dropped; a stated row nothing anchors is said, not passed in silence
(MV-20); the gates close runs before its citation gate that verify and land do not announce are
stated as a ceiling, and the finished line's not reading the channel is stated too. A clean run
says exactly what it said before.

**III. The Law Changes Before The Code** — MV-150's row and the four notes are the first tasks
(T002–T003); the row is filed `proposed`, its ID reserved by `change new` (MV-26), and only a
human enacts it (MV-81). The constitution's own Principle III sentence is corrected in this
change, as its Governance section requires of an amendment that reflects how the project works
(a PATCH, 3.0.1 → 3.0.2, no Sync Impact Report).

**IV. Deterministic, Offline, Small** — no new dependency; `citeLines` and `abandonLines` are pure;
`statedUpstream` reads a local ref with `git rev-parse`, `git show` and `git rev-list` through the
argument vector, only on a refusal; `verify` gains no IO; close's anchor read goes from a
read of every tracked file to the three directories verify parses.

**V. An Invented Integration Is A Lie** — no adapter entry changes. The walks under speckit,
opsx, graphify, codegraph and a code-less brain are run with the real binaries (quickstart.md),
and the change dispatches on no vendor name.

**Gate**: passes. **Re-checked after Phase 1 design** (data-model.md, contracts/, quickstart.md):
passes. The three choices beyond the design's own text — `roadmap sync` refusing a stray claim key
as a writer (research.md R2), a claim of a row the change retires allowed once retired (R5), and
`brainChannel` for the brain's own entry in `channelEvidence` and verify's read line as well as the
new pull (R8) — move no active row's statement: MV-53 already says the entry's `channel:` comes
first, and close verifying a retiring change's tombstone is what the skill and the guide already
promise.

## Project Structure

### Documentation (this feature)

```text
specs/077-change-file-cites/
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
.multivac/invariants.md        # MV-150 row + four dated notes (MV-15, MV-45, MV-80, MV-117) + 33 legs + 11 legs on amended rows — FIRST
.multivac/changes/change-file-cites.md  # body: the quickstart record; frontmatter declared at `change new` (claim `- id: MV-150` WITH its statement, spec Assumptions)
src/change/file.ts             # ChangeClaim.statement?; CLAIM_KEYS above KNOWN_KEYS' doc; the three claim forms; the stray-key message; claimKeys 'name' | 'refuse'; loadChange refuses; bare write; the scaffold line
src/change/reserve.ts          # stillReserved (the one RESERVED literal), unused, reservedBy; releaseUnused filters on unused; CiteKind, CiteLine, AnchorSite, DECLARATION_KINDS, citeLines, abandonLines
src/lib/config.ts              # brainChannel beside channelRef
src/commands/change.ts         # brainAnchorSites/anchoredIds replace the text scan; statedUpstream; citeText; channelEvidence reads brainChannel; new's third edit; plan's notices; land's refusal lines and final line; --abandon's refusal; close's gate block; the second anchor read goes
src/commands/verify.ts         # OpenChanges.changes; Evaluated.closeRefusals; the finished line's refusing variant; bChannel reads brainChannel
src/commands/roadmap.ts        # roadmap sync parses with claimKeys: 'refuse'
src/doors/flow.ts              # the gate line (:50)
test/**                        # see tasks.md; new test/change/cite-lines.test.ts
site/content/docs/{guide/running-changes.md,reference/commands.md,concepts/the-change.md}, skills/multivac/{SKILL.md,references/change.md}, DESIGN.md, .specify/memory/constitution.md, CHANGELOG.md  # the surfaces that would lie
.multivac/flow.md, .multivac/ecosystem.json, .claude/skills/multivac/**, AGENTS.md, CLAUDE.md  # re-rendered by `multivac doors` from the rebuilt dist, never hand-edited
```

**Structure Decision**: no new module. `citeLines` sits in reserve.ts beside `releaseUnused`,
because the gate exempts exactly what release gives back and both read `unused`; the RESERVED
literal stays in that file alone (MV-45's leg). `statedUpstream` and `citeText` sit in change.ts,
the only command that reads the channel for this, beside `channelEvidence`, which reads the same
ref. `brainChannel` sits beside `channelRef`, which it calls. `CLAIM_KEYS` sits beside `KNOWN_KEYS`.
The parse option lives on `parseChange` so each caller states whether it writes. `src/change/cite.ts`,
`closeGate`, `finishedChanges`' signature, `landSdd` and its two calls, `ecosystem.ts`, `tracker.ts`
and `code-in-change.ts` are unchanged: they read IDs or the body.

## Composition and re-anchoring

- **Every `file:line` in these artifacts is `62d4588`'s and is re-anchored at apply time.** The
  design cited `92c4c08`; #4 `opsx-through-its-cli` (MV-147) has merged since, changing
  src/commands/change.ts (`land`, `close`, `cmdNew`'s slug refusal), `roadmap add`, src/change/*,
  the registry and commands.md; #5 `graph-answers-where-asked` (MV-148) and #6
  `codegraph-worktrees-and-verbs` merge before this change is applied. T001 re-finds each line on
  the branch head, and **the design's print-site lines in change.ts and verify.ts are re-found
  there by their text**: plan's claim loop (`claim ${c.id}: no anchor`), `cmdNew`'s third edit
  (`3. claims:`), land's armed line (`refuses ${slug} as unclosed (MV-80)`) and final line (`all
  stages landed`), `--abandon`'s claims refusal (`--abandon is for a change that made none`),
  close's claims block (`claims are not green`) and orphan text (`anchored ONLY in`), the second
  anchor read before `releaseUnused`, verify's finished line (`finished, not pending`),
  `OpenChanges`, `Evaluated`, the claim-scoped literal and `bChannel`.
- **Known textual neighbours.** #5 edits land's and close's graph ignore steps, `commitGraph`,
  `removeWorktrees`, apply's pointer lines, flow.ts :58, :129-132 and :141, and commands.md's close
  example (~:1575 here, :1558 at its base), just below this change's citation block after "Then
  re-verifies" (~:1564). #6 edits apply's, land's and close's index steps. #4's merged +11-line hunk
  sits at commands.md :1225, right above the three-edits block this change rewrites (:1255). None
  is on the lines this change edits; expect a rebase near each.
- **#8 `verify-rooted-and-quiet` lands after this change** and rebases on `OpenChanges.changes`,
  `Evaluated.closeRefusals` and the finished line's refusing variant, which keep the name and shape
  the design gives them: `finished, not pending — close refuses until: <first>[ (+N more)] — then:
  multivac change close <slug>`. `brainChannel` also touches verify's `bChannel` line, a separate
  site. MV-150 keeps the sentence "MV-86's `requires:` floor makes the brain loud and does not reach
  a consumer's run." verbatim, which #8's note amends.
- **#9 `skill-cites-references`** trims the skill after this change and keeps its corrected facts.
- **Instance rule for this brain.** Until `/home/user/multivac/dist` is rebuilt from the merged
  change and every build reading the brain's change files is at least that release, this brain
  keeps `statement:` in its own change files; this change's own file declares `- id: MV-150` with
  its statement, and no in-flight change file is converted. A worktree that was built runs its own
  build in the hook's tier 1; one never built falls through to `mvac` (research.md R13).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Two readings of a stray claim key (`'name'` and `'refuse'`) | a writer that drops the key loses rule prose on disk; a reader that refuses the file hides the change from verify, roadmap, the ecosystem graph and the code gate (measured: a code commit on the change's branch refused, `roadmap` down one open change) | refusing everywhere hides the change from the gates that protect it; dropping everywhere loses the key at the next rewrite |
| Close prints the orphan case with MV-117's own text while verify and land print the `orphan` clause | MV-117's refusal is pinned (`anchored ONLY in` unique in change.ts, its test) and says more than a one-line reason; verify and land need one line per refusal | one text everywhere either breaks MV-117's leg and test or puts a four-clause sentence into the finished line |
| The channel read at close and at land, but not in verify's finished line | the pull is acted on at close and read at land, where the operator is about to write the rule twice; verify's read line already names a brain behind its channel | reading the channel in verify adds IO to every finished run and changes the print site #8 rebases on |
| `brainChannel` changes two existing call sites beside the new one | a pull at `origin/trunk` while land's channel line and verify's read line read `origin/main` is the invented-attribution MV-80 forbids | fixing only the new call leaves three surfaces reading two refs for one brain |
