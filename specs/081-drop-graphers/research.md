# Research: multivac keeps no code graph

Measured 2026-10-02 on `41e52c5` (main, release 0.15.0; the change opened at `f156896`, which
adds only the change file, the reserved MV-153 row and a re-rendered `.multivac/ecosystem.json`),
in scratch with `HOME` and `GIT_CONFIG_GLOBAL` isolated, `TMPDIR` in the scratch directory, and
the real vendors: graphify 0.9.29, codegraph 1.6.0 (`CODEGRAPH_TELEMETRY=0 DO_NOT_TRACK=1
CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1`), spec-kit 1.0.11, openspec 1.13.2
(`OPENSPEC_TELEMETRY=0`). `mvac` is `/home/user/multivac/dist/cli.js`, 0.15.0 (`BASE` below).

A **prototype** was built in a clone (`$S/clone`, branch `proto`, `$S` the session scratch
directory): every grapher module and call removed from `src/`, the record of what was dropped
added as `src/lib/dropped.ts`, this repository's own graphify setup removed, and the whole law
of research.md R14 applied to `.multivac/invariants.md`. Its build is `PROTO`
(`node $S/clone/dist/cli.js`). Docs, skills and tests were not prototyped: their legs are
dry-run against the base and stated green by construction of the tasks that edit them.
**Nothing here is copied forward as a result**: every figure is re-measured by tasks.md Phase 1
and the last phase, and the code is re-derived in the change's worktree from the plan, not
from the prototype.

Commands are quoted as run; `$S` is
`/tmp/claude-0/-home-user-multivac/2009d32c-ec8a-53c2-87bc-5b2df689ff4a/scratchpad/dg`.

## R0. The decisions this design takes as given, and how they map

| Decision (the human's) | Where it lands |
| --- | --- |
| 1. Drop graphers from the tool: no `grapher:`/`graphers:` config, no registry entry, no install or equip, no door line, verb or refresh hook, no hook-guard handling, no land graph commit, no close graph gate (`--no-grapher` goes), no per-worktree index, no `codegraph.json`/`.graphifyignore` writer, no `info/exclude` line, no `--graph`/`its index:` lines, no telemetry disclosure | FR-001–FR-012, US1, R1, R13 |
| 1. Drop graphify from this repo: `graphify-out/`, `.graphifyignore`, the `## graphify` section, `.claude/CLAUDE.md`'s line, both projected graphify skills, the PreToolUse hook-guard and the PostToolUse refresh hook, the `.gitignore` lines, `grapher: graphify` — inventoried, with what else turned up | FR-031–FR-035, US4, R1.4, R9 |
| 2. An old config loads; `verify` and `doctor` print ONE line; `doors` removes only the hooks multivac wrote, by its own mark; vendor files stay and `doctor` prints their removal (#5's precedent); never delete a file multivac did not write | FR-013–FR-022, US2, R2, R3, R5 |
| 3. Drop `.multivac/ecosystem.json`: its renderer, every line and leg naming it; an existing one is removed by `doors` (multivac wrote it); nothing else reads it | FR-009, FR-017, FR-018, R4 |
| 4. The work runs as change `drop-graphers` on its own branch; the human runs every lifecycle command | plan.md, tasks.md (no task runs `change …`) |

## R1. Inventory

### R1.1 Source

`git grep -c -i -E 'graphify|codegraph|grapher|ecosystem\.json|ecosystem graph|graph\.json|graph gate|\bgraph\b' -- src`
names 28 of 53 source files: four graph modules that go whole, 23 that carry a part, and
`src/seed/inventory.ts`, whose "build graph" is a seed category and stays.

| File (base) | Lines | What goes |
| --- | --- | --- |
| src/adapters/refresh.ts | 689 | whole: `refreshGraph` (:112), the lock (:44), `graphScopes`, the ignore writer `writeIgnores`, `holdsIgnored`, `installHarness` (:255), `ensureGraphs` (:363), `graphGate` (:424) |
| src/adapters/tracked.ts | 90 | whole: `graphTrackedGate` |
| src/doors/ecosystem.ts | 147 | whole: `renderEcosystem`, `writeEcosystem`, `ecosystemGraphLines` |
| src/lib/json-splice.ts | 226 | whole: `spliceJsonList`, imported by refresh.ts alone (`grep -rn "json-splice" src`) |
| src/adapters/registry.ts | 1,472 → 988 | `GrapherQuery` (:367), the grapher-only `AdapterSpec` fields (`graphignoreFile`, `graphignoreJson`, `graphignoreScope`, `codeOnly`, `remove`, `harness`, `artifactKind`, `rebuild`, `queries`, `askAt`), `kind: 'grapher'`, `automation: 'grapher-refresh'`, `knownGraphers` (graphify, codegraph), `grapherNames` (:1394), `grapherSpec` (:1409), `unverifiedGrapher` (:1459), the claude hook `shape` naming the refresh |
| src/adapters/detect.ts | 621 → 376 | the grapher kind in `ownDecl`/`adapterFor`/`adaptersByRoot` (:76, :108, :198), `askedGraphers` (:229) through `brainHooks` (:405), `Detected.grapher` and its probe |
| src/adapters/equip.ts | 99 → 65 | the grapher half of `toolsToRun`, `missingTools`' `{ sdd, grapher }`, `ensureGraphs` and `installHarness` in `equip` |
| src/doors/brain.ts | 441 → 143 | `sectionDoors` (:86), `ASK`, `freshness`, `noQueryLine`, `grapherLines` (:126), `whereLines` (:253), `holdsCodeLine`, `brainGraphLines`, `leftoverLine` (:386), the ecosystem line |
| src/doors/consumer.ts | 90 → 89 | the graph block and the ecosystem line |
| src/doors/flow.ts | 203 → 131 | three rows (automatic, gate, yours) and the helpers they used |
| src/doors/settings.ts | 423 → 256 | `GRAPH_LOCK` (:59), `refreshHookCmd` (:102), `refreshKey` (:178), `RefreshHook`, `ensureRefreshes` (:265); the merge keeps the gate and removes hooks of ours |
| src/doors/link.ts | 71 → 48 | `hasGrapherSection` and the comment about the vendor writing first |
| src/commands/change.ts | 2,122 → 1,655 | the ecosystem write in `commitBookkeeping` (:94), `sharedGraph` (:469), `commitGraph` (:494), `landIgnores` (:585), `grapherOutputs` (:787) and the graph branches of `removeWorktrees` (:797), `graphPointer` (:1321), `excludeLocalOutputs` (:1414), `indexWorktree` (:1452), both close gates and the close refresh, `--no-grapher` |
| src/commands/doctor.ts | 1,287 → 880 (with the new leftover lines) | `outOfScope` (:93), `graphStale` (:388), `removalOf` (:409), `foreignFacts` (:428), `leftoverGraphLine` (:458), `grapherLines` (:491), `ignoreFacts` (:612), `jsonIgnoreFacts` (:644), `refreshPath` (:700) |
| src/commands/doors.ts | 505 → 389 | `refreshHookOf` (:160), the refresh wiring of `installHookConfig` (:166) and `projectInto`, `noRefreshNotice` (:324), the clash notices, the ecosystem write |
| src/commands/init.ts | 853 → 775 | `--grapher`, `grapherRefusal`, the grapher in `toolsInitWouldRun`, the detection comment, `writeEcosystem`, the code-less grapher line, the grapher spec in step zero |
| src/commands/verify.ts | 1,783 → 1,774 | the ecosystem staleness line (:1645–:1656) |
| src/commands/repos.ts | 401 → 382 | the graph facts of `repos check`, the code-less leftover fact, `missingTools`' grapher |
| src/commands/seed.ts | 217 → 210 | `- graph <name>: …` in the setup section |
| src/lib/code-in-change.ts | 325 → 234 | the grapher paths in `nonCodeGlobs`, `graphIgnoreLines` (:170), `mountDir` (:204) |
| src/lib/repo-state.ts | 374 → 268 | `LeftoverGraph`, `leftoverNoun`, `leftoverGraphs` (:206) |
| src/lib/config.ts | 510 → 460 | `grapherDecl`, the `grapher`/`grapher_auto`/`graphers`/`repos.<key>.grapher` parse and the `graphers.none` refusal, `ECOSYSTEM_PATH` |
| src/types.ts | 212 → 186 | `GrapherDecl`, `RepoEntry.grapher`, `Config.grapher`, `grapherAuto`, `graphers` |
| src/lib/init-state.ts, ritual.ts, out.ts, adapters/tracker.ts | — | one comment each |

`src/seed/inventory.ts` ("workspace / build graph", `*.graphql`) and the change command's
"landing graph" are not about a code graph and stay.

Added: `src/lib/dropped.ts`, 261 lines — the record of what was dropped (R2, R3, R5).

**Prototype figure** (`git diff --cached --stat base -- src` in `$S/clone`): 28 files,
+515 −4,109; `git ls-files src | xargs cat | wc -l` 19,665 → 16,071 (−3,594, −18.3%); 53 → 50
files (four deleted, one added). The change's own figure is measured by tasks.md's last phase.

### R1.2 Tests

`node --test "dist-test/**/*.test.js"` at base: **987 tests, 984 pass, 3 skipped** (unreadable-file
cases skipped as root), 96 s wall, in 96 test files. A block splitter over the test files
(`$S/tblocks.py`: each `test(` to the next) found 235 tests whose body or title names a graph
term; R10 maps each to delete, change or keep. Eleven files are wholly about graphers: 90 tests,
3,846 lines. Per-test deletions in mixed files: 81 tests, 2,502 lines. Planned: **171 deleted,
72 changed, 11 added → 827**.

### R1.3 Documents

`git grep -c` of the graph words over the documents (counts at base):

| File | Mentions | Fate |
| --- | --- | --- |
| site/content/docs/reference/graphers-and-sdd.md | 335 | renamed `sdd.md`, "SDD tools"; lines 110–1145 (`## Graphers` to `## And it is part of the repository`) deleted; the intro, *Artifact ≠ binary*, *The three-state policy* and *Detection at init* rewritten for the SDD alone; an `aliases:` line keeps the old URL |
| site/content/docs/reference/commands.md | 125 | init, doors (the `.multivac/ecosystem.json` subsection), doctor, repos check/sync, change new/plan/apply/land/close (the graph gate subsection), the roadmap sample |
| site/content/docs/reference/configuration.md | 53 | the sample config, `### grapher`, `### grapher_auto`, `### graphers`, the read-only sample's grapher line, the mount's graph paragraph |
| DESIGN.md | 50 | the CLI sample, the config sample, "No native code graph, ever", *The door*'s link-before-vendor item, *Adapter first, fallback always* (heading kept, MV-152), *Artifact ≠ binary*, *One registry*, *Every adapter question is asked per root* |
| site/content/docs/guide/running-changes.md | 29 | apply, land and close samples and prose; the roadmap sample |
| site/content/docs/concepts/composition.md | 20 | the table row, *Adapter first, fallback always* bullets (heading kept, MV-152), *Not competing*, *Why a grapher helps* (deleted), *Neither is required* |
| site/content/docs/guide/getting-started.md | 9 | init sample, detection, door sample, `repos sync` comment |
| site/content/docs/reference/hooks.md | 7 | *What "preserving" means here*: the refresh hook (MV-74's legs on this page keep their phrases) |
| skills/multivac/references/change.md | 10 | the land sentence, the graph-gate paragraph, `## The graph — it follows YOUR edits` |
| skills/multivac/SKILL.md | 6 | "which grapher and SDD bind", the graph paragraph |
| README.md | 6 | the adapter paragraph |
| site/content/docs/guide/session-zero.md | 4 | sync and the `### setup` sample |
| skills/multivac/references/discovery.md | 3 | §0 Sync |
| site/content/docs/concepts/philosophy.md | 3 | the map layer row and its paragraph |
| site/content/docs/reference/_index.md | 2 | the card and the summary |
| site/content/docs/concepts/adoption.md | 2 | "code graphers" in *Next* (the "workspace graph" is seed's) |
| CONTRIBUTING.md | 2 | `## Adding a harness, a grapher or an SDD tool` ("landing graph" stays) |
| .github/ISSUE_TEMPLATE/integration.md, bug.md | 2, 1 | the tool kinds |
| site/content/docs/reference/integrations.md, concepts/the-change.md, concepts/distribution.md, docs/_index.md | 1 each | one sentence each |
| package.json | 1 | the `knowledge-graph` keyword |
| .specify/memory/constitution.md | 1 | Principle V's list of adapter kinds (R12) |
| docs/audit-2026-08-18.md | 4 | **kept**: a dated audit, history like CHANGELOG |
| CHANGELOG.md | 129 | **kept**, plus an Unreleased entry (R11) |
| specs/**, .multivac/changes/archive/** | — | **kept**: history |

### R1.4 This repository's own setup

| Item | Tracked | Written by | Removed by |
| --- | --- | --- | --- |
| `graphify-out/graph.json` (2,198,534 B) | yes | graphify, committed by `change land` | `git rm` in the change (last commit, R9) |
| `graphify-out/` cache, dated copies, `graph.html`, `GRAPH_REPORT.md`, `manifest.json` (≈ 25 MB on main's disk) | no (ignored) | graphify | the human, in main, after the merge: they turn untracked once the `.gitignore` lines go |
| `.graphifyignore` (284 B) | yes | multivac (`# multivac: kept out of the graph` record) | `git rm` in the change |
| `.gitignore`: the 3-line comment, `graphify-out/cache/`, the dated-copy line, `graphify-out/graph.html`, `graphify-out/*`, `!graphify-out/graph.json`, `*.graphify-bak` | yes | multivac and a human | edited in the change (no `*.graphify-bak` file exists here: `find . -name '*.graphify-bak'` → none) |
| `AGENTS.md` `## graphify` section (773 B), reached through the `CLAUDE.md` symlink | yes | graphify's `claude` platform | `graphify uninstall --project --platform claude` in the change's worktree |
| `.claude/CLAUDE.md` (226 B) | yes | graphify's `claude` platform | the same uninstall |
| `.claude/skills/graphify/**` (10 files) | yes | graphify `claude` | the same uninstall |
| `.agents/skills/graphify/**` (10 files; `/.agents/` itself is in `.graphifyignore`) | yes | graphify `agents` | `graphify uninstall --project --platform agents` |
| `.claude/settings.json` PreToolUse `graphify hook-guard search` / `read` | yes | graphify `claude` | the claude uninstall, which leaves `"PreToolUse": []` and drops the file's final newline (measured in `$S/clone`); the empty list is deleted by hand, then `doors` rewrites the file |
| `.claude/settings.json` PostToolUse refresh hook `L=.multivac/cache/graph-refresh.lock; …` | yes | multivac | `multivac doors` (the new build), by its preamble |
| `.multivac/config.yml` `grapher: graphify` | yes | a human | deleted in the change (config edit, change open: MV-97) |
| `.multivac/ecosystem.json` (461,364 B) | yes | multivac | `multivac doors` (the new build) |
| `.multivac/flow.md`'s three graph rows | yes | multivac | `multivac doors` re-renders it |
| `.multivac/cache/graph-refresh.lock` | no | the hook | nothing: under the ignored cache, gone with the hook |
| `claude/brain/` (an empty directory at the root) | no | unknown | not this change's: untracked, empty, nothing graph about it |

Found beyond the human's list: `.agents/skills/graphify/**` (graphify's `agents` platform),
`.claude/settings.json`'s trailing newline and empty `PreToolUse` list after the vendor's own
uninstall, the dated-copy and cache lines of `.gitignore`, the 25 MB of ignored outputs in main's
checkout, `package.json`'s `knowledge-graph` keyword, the two issue templates, and
`.multivac/flow.md`'s rows.

## R2. An old config loads, and is told once

At base `loadConfig` reads `grapher`, `grapher_auto` (refusing a non-boolean), `graphers.<name>`
(refusing unknown keys and `graphers.none`) and `repos.<key>.grapher`
(src/lib/config.ts:244, :262, :290–:310, :393–:394, :433–:459). Measured on base with
`grapher_auto: maybe` in a scratch brain: `.multivac/config.yml: "grapher_auto" must be true or false`,
every command exit 1/2.

**Decision.** The four keys stay in the known lists so the loader never refuses them, and their
values are never read or validated: a key a release ignores cannot be wrong. `Config.dropped`
records the ones found, top-level in the fixed order `grapher`, `grapher_auto`, `graphers`, then
each `repos.<key>.grapher` in config order. The key names live in `src/lib/dropped.ts`
(`DROPPED_KEYS`, `DROPPED_REPO_KEY`), so `src/lib/config.ts` names no grapher word and MV-153's
legs read one file for the vocabulary. Prototype: the same config loads; `verify`, `verify
--quiet` and `doctor` print contracts/cli-output.md §1 (`$S/w-gf-proto.txt`).

- **Where it prints.** `verify` in the brain checkout only (`!scope`, as the ecosystem line was):
  a consumer's verify reads the brain through the mount, and the owner fixes the brain's config
  (MV-146's precedent for `sddRefusal`). `doctor` always (it runs in the brain). Not `doors`,
  not `count`, not the lifecycle: the human asked for two surfaces.
- **Reported, never gating.** It never changes an exit code. On a quiet run it is one clause
  of the one line, not "off" (MV-151's fold), exactly as the ecosystem staleness clause was.
- **How to remove it.** The config is invariant (MV-97): deleting the key needs an open change,
  measured: committing the edit with no change open printed `config    .multivac/config.yml is
  modified and no change is open … · blocking`, exit 1. So the line names the change.
- Considered and rejected: refusing the keys (breaks every old brain on upgrade), migrating the
  file (a write to an invariant file outside a change), printing in every command (noise on
  every session start through the `SessionStart` hook — it already prints there through
  `verify`).

## R3. Hooks: what multivac wrote, and how it is taken back

At base `mergeClaudeSettings` (src/doors/settings.ts) identifies the refresh hook by its head
`L=.multivac/cache/graph-refresh.lock;` (`REFRESH_HEAD`, `ownsRefresh`) and already removes every
hook of ours when no grapher is wanted (`ensureRefreshes` with an empty list — MV-74's "Dropping
the grapher removes every refresh hook and only the entries thereby left empty").

**Decision.** Keep that one mark, `OUR_REFRESH_HEAD`, in `src/lib/dropped.ts`; `settings.ts`
keeps `ourHooks`, `drop`, the gate's `ensureEvent` and `duplicateNotice`, and replaces
`ensureRefreshes` with `removeRefreshes`, which drops every hook whose command starts with the
mark, and its entry only when that leaves it empty; the merge returns how many it removed, and
`doors` prints one notice per settings file that lost one (contracts §3). Nothing else is ours:
graphify's `hook-guard` commands, a human's `graphify update .`, and a hook a human edited past
the preamble are never touched (a substring is not identity, MV-74).

Measured (`$S/w-gf-proto.txt`, `$S/w-cg-proto.txt`): an old graphify brain's settings went from
`PostToolUse: [verify gate, refresh]`, `PreToolUse: [hook-guard search, hook-guard read]` to
`PostToolUse: [verify gate]` with both vendor hooks untouched; an old codegraph ecosystem's brain
and `web` each lost one hook. Only `.claude/settings.json` is a hook config (`hookConfig` is
declared by the `claude` target alone: `grep -n 'hookConfig' src -r`); graphify's own
`.codex/hooks.json` and `.gemini/settings.json` hooks are vendor files (R5).

`doctor` names the hooks of ours still present per root (`ourRefreshHooks`, a read), so a
brain that upgraded and has not run `doors` is told.

**The pre-commit shims** never carried a refresh: MV-52's leg
`brain:src/hooks/install.ts /graph|refresh/ absent` holds at 0 before and after.

## R4. `.multivac/ecosystem.json`

**Writers at base**: `doors` (src/commands/doors.ts:424), `init` (src/commands/init.ts:711),
`commitBookkeeping` on every brain bookkeeping commit (src/commands/change.ts:94–105), `land`'s
`commitGraph` in a brain checkout (:556), `close` before its archive commit (:1958).
**Readers**: `verify`'s staleness line (src/commands/verify.ts:1651) and the doors' line telling
agents to ask it with graphify. Nothing else: `git grep -n -i 'ecosystem\.json\|ECOSYSTEM_PATH'
-- src` lists only these. The file at base is 461,364 bytes, 18,187 lines.

**Decision.** All writers, the reader and the door lines go. `doors` removes an existing file
(multivac wrote it; it is under `.multivac/`), prints `brain: .multivac/ecosystem.json removed —
multivac no longer renders it; commit the removal`, and says nothing where there is none.
`doctor` names one still present. `init` neither writes nor removes it (it calls `doors` only
with `--provider`; a re-init on an old brain gets the removal from the next `doors`). The close
archive pathspec and the bookkeeping commit drop it: a brain that upgraded mid-change commits the
deletion itself (contracts §3). Measured with `PROTO doors` on an old brain: the file is gone and
`git status` shows ` D .multivac/ecosystem.json`.

What the file answered, and its replacement, is R8.

## R5. What the vendors left: `doctor` names it, the door warns, the code gate lets it go

Leaving vendor files in place is the human's decision (#5's precedent: MV-148's kept install).
What #5 built for it — `leftoverGraphs`, `leftoverGraphLine`, the door's kept-install line,
the non-code paths — read the registry entries this change deletes. The measured facts they
used move, as data, to `src/lib/dropped.ts`'s `LEFTOVER_VENDORS`:

| Vendor | Output dir | Kind | Ignore file | `.gitignore` lines an earlier multivac wrote | Platforms (probe) | Removal |
| --- | --- | --- | --- | --- | --- | --- |
| graphify 0.9.29 | `graphify-out` | shared | `.graphifyignore` | `graphify-out/*`, `!graphify-out/graph.json`, `*.graphify-bak` | gemini (first, hooks), agents, claude (hooks; also `.claude/CLAUDE.md`), cursor, codex, opencode (+ plugin and `opencode.json`), copilot — each `.<dir>/skills/graphify/SKILL.md` but cursor's `.cursor/rules/graphify.mdc` | `graphify uninstall --project --platform <key>` per platform found, `uninstallFirst` leading (MV-148, measured); then `git rm` and `rm -rf` of `graphify-out` and `.graphifyignore` |
| codegraph 1.6.0 | `.codegraph` | local | `codegraph.json` (only beside `.codegraph/`: alone it is the human's, MV-149) | `.codegraph/` | none recorded (MV-131's ceiling) | `rm -rf .codegraph` — the directory is git-ignored; codegraph's own `uninit --force` would send an `uninstall` event without its opt-outs (MV-149's note), so no vendor runs |

- **`doctor`** prints one `leftover` line per vendor per root it may write in (the brain and
  every declared repo on disk that is not read-only — the roots `sddRoots` lists; MV-151's
  `absent` leg forbids `resolve(brain, e.path)` in doctor.ts, which the prototype first used
  and the verify run caught), plus one line for `.multivac/ecosystem.json` and one per settings
  file still holding hooks of ours (contracts §2). Never run, never gating: exit code unchanged.
  A `*.graphify-bak` copy beside a hook file is the human's own pre-install copy (MV-148): it is
  named and kept, and the `*.graphify-bak` `.gitignore` line is kept while it exists — measured,
  dropping that line surfaced `.claude/settings.json.graphify-bak` as untracked.
- **The door** (brain and consumer) carries one line where a vendor's own skill (and hooks) are
  found beside it — only there, because only there does something still send the agent to a
  graph nothing refreshes. A graph directory with no install beside it (codegraph's index, a
  graphify graph without skills) gets no door line: `doctor` names it. The probe is the
  callers' (`init` and `doors` pass `leftoverVendors`), so the renderers stay filesystem-free
  (MV-93's leg `src/doors/consumer.ts /(existsSync|readFileSync|readdir|statSync)\(/ absent`).
- **Not code.** `nonCodeGlobs` adds every path in the table by name (`leftoverGlobs`), in every
  repo, so the removal commits on any branch (MV-137 as #5 amended it for a kept install).
  Measured: the old graphify brain's removal commit, made with a change open for the config edit,
  passed the hooks; with no SDD there the code gate was not armed — the speckit ecosystem's
  removal was a working-tree delete of ignored and untracked files.
- **Not removed by multivac**: `graphify-out/`, `.graphifyignore`, `codegraph.json`, `.codegraph/`,
  the vendor's skills, door sections and hooks, the `.gitignore` lines (no mark of ours) and the
  `.codegraph/` line an earlier apply appended to `.git/info/exclude` (never committed; it hides
  a directory nothing builds; a ceiling, R15).

Walk (`$S/w-gf-remove.txt`): following the printed recipe left `doctor` printing the config
line alone; with the change open the commit passed; `verify --quiet` printed one line.

## R6. What survives the retired rows

Most retired text is graph-only. Three behaviours outlive it:

| Behaviour | Was pinned by | After |
| --- | --- | --- |
| `init` decides a brain holds code from tracked AND untracked files (`holdsFiles`, `untrackedFiles`), and writes `brain: .` | MV-148 (`src/commands/init.ts /await untrackedFiles\(dir\)/ unique`, test "untracked source makes the brain code") | stated in MV-153's rule, with the same `unique` leg |
| `doors` removes multivac's refresh hooks and only the entries they leave empty | MV-52, MV-74 | MV-74 (as amended) and MV-153 |
| the git shims carry no graph or refresh call | MV-52's `absent` leg | the same leg, still evaluated on the retired row |

`brainHoldsCode` stays in src/adapters/detect.ts (init's flows, `change plan`'s brain line);
nothing about a graph depends on it any more.

## R7. What it saves, measured

Base is `41e52c5` with `BASE`; after is the prototype with `PROTO`. Door bytes are UTF-8 bytes
of the managed block body as rendered (`$S/doorm/render.mjs`: `loadConfig` on a scratch
`.multivac/config.yml`, then `renderBrainDoor(cfg, 10)` and `renderConsumerDoor(cfg, 'web')`
from each build's `dist/`), unless a file is named.

**This brain's door, loaded by every session.** `wc -c AGENTS.md .claude/CLAUDE.md` at base:
4,445 + 226. The managed block is 3,672 bytes, graphify's own `## graphify` section 773; the
four multivac lines about a graph (the ecosystem line and the three grapher lines) are 1,034.
After (`$S/clone`, graphify's uninstall, `PROTO doors`): `AGENTS.md` 2,638, no
`.claude/CLAUDE.md`. **A Claude Code session here loads 4,671 → 2,638 bytes (−2,033, −43.5%).**
The `graphify` skill's description, 357 bytes, also leaves every session's skill listing; its
`SKILL.md`, 40,495 bytes, loads whenever an agent triggers it (its description asks for "any
question about a codebase").

**Doors per grapher** (`for g in none graphify codegraph; … node render.mjs <dist> <dir>`; each
brain declares `doors: [agents, claude]`, `sdd: speckit`, code repos `web` and `api`):

| Door | none | graphify | codegraph | after (any) |
| --- | --- | --- | --- | --- |
| consumer (`web`) | 1,310 | 1,884 | 2,293 | 1,137 |
| brain holding code (`brain: .`) | 2,811 | 4,594 | 4,921 | 2,645 |
| code-less brain | 2,745 | 3,887 | 4,171 | 2,579 |

With no grapher the saving is the ecosystem line alone (166–173 bytes); with one, 747–1,156 on a
consumer door (−39.6% to −50.4%) and 1,308–2,276 on a brain door (−33.7% to −46.3%).

**Hooks** (this brain's `.claude/settings.json`; the same in any brain whose claude target got
graphify's install):

| Event | Before | After |
| --- | --- | --- |
| each Edit/Write/MultiEdit | 2 hooks: the verify gate, the refresh | 1: the verify gate |
| each Bash/Grep | 1: `graphify hook-guard search` | 0 |
| each Read/Glob | 1: `graphify hook-guard read` | 0 |

Per edit, the refresh hook returned in 18, 18 and 25 ms (`echo "$P" | sh -c "$HOOK"` with an
Edit payload naming a file in `$S/basewt`, timed with `date +%s%N`), then ran `graphify update .`
in the background: 5.80, 5.90 and 6.01 s wall, 8.21–8.75 s of CPU, 191 MB peak RSS on this
repository (938 tracked files; `python3` with `resource.getrusage(RUSAGE_CHILDREN)` around
`graphify update .` after a one-line edit, three runs), coalesced by the lock. Per search or
read, `graphify hook-guard search|read` took 70–82 ms (five and three runs) and handed the agent
190 bytes (search) or 402 bytes (read) of `additionalContext` ("MANDATORY: graphify-out/graph.json
exists. You MUST run `graphify query …`"). The verify gate is unchanged.

A side effect measured while designing: the refresh hook follows the edited file's toplevel, so
writing a file into any checkout holding `graphify-out/graph.json` — this design's own scratch
clone included — rebuilt that checkout's graph in the background and left `graph.json` modified
there.

**`change apply`** on a brain holding code (53 TypeScript files copied from `src/`, no SDD, one
repo; `$S/apply-time.sh`, three runs each, wall time of `mvac change apply t1`):

| Build | Config | ms |
| --- | --- | --- |
| BASE | `grapher: codegraph` | 1,771, 2,018, 1,629 |
| BASE | none | 637, 521, 532 |
| PROTO | old `grapher: codegraph` | 425, 590, 493 |
| PROTO | none | 796, 592, 606 |

codegraph's per-worktree `codegraph init` cost 1.0–1.4 s per checkout; after the change an old
codegraph config applies as fast as no grapher.

**The package** (`npm pack --dry-run --json`): 62 files, 288,664 bytes packed, 905,793 unpacked
→ 59 files, 230,151 and 716,813 (−20.3%, −20.9%) — `dist/adapters/refresh.js`,
`dist/adapters/tracked.js`, `dist/doors/ecosystem.js` and `dist/lib/json-splice.js` gone,
`dist/lib/dropped.js` added; the skill edits (R11) take ≈ 1.4 KB more.

**Code and tests**: 19,665 → 16,071 source lines (−18.3%, R1.1); 987 → 827 tests planned (R10),
27,397 test lines minus 3,846 (eleven files) and 2,502 (81 tests in mixed files), plus the
additions.

**Committed artifacts this brain stops rewriting**: `graphify-out/graph.json` 2,198,534 bytes
(re-committed at every `land` and `close`), `.multivac/ecosystem.json` 461,364 bytes (re-committed
by every bookkeeping commit), and 169,341 bytes of graphify skills in 20 files.

**The law grows**: `.multivac/invariants.md` 507,249 → 525,815 bytes (+18,566: MV-153's 4.8 KB row
and 30 legs, 34 notes, 14 retirement leads, 14 tombstones), measured on the prototype after
`$S/law/apply.py`.

## R8. What it loses, measured

An agent loses three things a graph gave in one call. Measured on `$S/basewt` (base, with a
`codegraph init` built for the measurement and deleted after):

| Question | With the graph | Without | 
| --- | --- | --- |
| who calls `refreshGraph` | `codegraph callers refreshGraph`: 5 callers, 300 B, 252 ms | `git grep -n -E '\brefreshGraph\(' -- src`: 5 lines, 520 B |
| what changing `refreshGraph` reaches | `codegraph impact refreshGraph`: **12 symbols in 3 files**, 464 B, 258 ms | one grep per level: 5 direct callers, then a grep for each of `ensureGraphs`, `commitGraph`, `indexWorktree`, `cmdClose`, then their callers |
| what changing `loadConfig` reaches | `codegraph impact loadConfig`: 170 lines, 3,695 B, 247 ms | `git grep … 'loadConfig('`: 20 direct lines, 1,870 B; the transitive set by hand |
| how `refreshGraph()` reaches `cmdClose()` | `graphify path "refreshGraph()" "cmdClose()"`: 1 hop, 74 B, 294 ms | a grep of `cmdClose`'s body |
| an open question about the code | `graphify query "where is the grapher adapter registry and refresh hook"`: 2.0 s, "672 nodes found", 77 shown in ~2,000 tokens | greps chosen by the agent |
| a row's anchors and the changes touching it | `graphify explain "MV-137" --graph .multivac/ecosystem.json`: 1,073 B, 221 ms | `grep -o -E '@anchor MV-137 brain:[^ ]+' .multivac/invariants.md` (377 B) and `grep -l -E '^ +- MV-137$' .multivac/changes/*.md .multivac/changes/archive/*.md` (155 B, 3 files) |

Stated plainly: **transitive reach (`impact`) and multi-hop paths are lost**; an agent rebuilds
them one grep per level, and for a wide symbol that is many calls. One-hop questions and the
law's relations cost the same or fewer bytes by grep. Earlier measurements on this repository
found asking graphify cost 2.1 to 2.6 times a narrowed grep (MV-148) and `codegraph query` printed
more than a narrowed definition grep for 311 of 318 functions (MV-149). Nothing in the doors
replaces the lost reach, and no door tells the agent how to grep: it reads the tree.

## R9. This repository's own setup, in an order that never breaks a hook

What runs while the change is worked on (measured from main's `.claude/settings.json` and
`.multivac/hooks/`):

- **The session's harness hooks are main's.** Claude Code reads `.claude/settings.json` from the
  session's project directory, `/home/user/multivac`; editing the worktree's copy changes nothing
  for the running session. Until the merge, every edit runs main's verify gate (rooted at the
  edited file's checkout, MV-151) and main's refresh hook; every search and read runs graphify's
  hook-guard and gets its "MANDATORY" context — ignore it.
- **The refresh hook follows the edited file only while its toplevel holds the graph.** Its
  non-follow form is `[ -n "$t" ] || exit 0; [ -e "$t/graphify-out/graph.json" ] && cd "$t"; …
  graphify update .`: in a worktree that still holds `graphify-out/graph.json` it rebuilds that
  worktree's copy (harmless, never staged); in one that does not, it does NOT `cd` and rebuilds
  the session directory's — **main's** tracked `graphify-out/graph.json`, leaving main dirty and
  the post-merge pull refused. So `graphify-out/graph.json` is removed from the worktree **in the
  last commit**, and no file is edited with an Edit or Write tool after it (a `sed` or `git rm`
  run through Bash fires no PostToolUse hook).
- **The git shims run main's binary.** `core.hooksPath` is `.multivac/hooks` in the common
  config; the pre-commit shim runs `mvac` first (MV-92's ladder), and `mvac` on PATH is main's
  `dist/cli.js`, 0.15.0. Every commit on the change branch is gated by the OLD verify over the
  worktree's law: blocking modes (`absent`, `count`, `each`) of active and retired rows must hold
  at every commit, and a tombstone added before its code is deleted blocks the commit. So each
  tombstone and each moved `count`/`each` leg lands **in the commit that greens it**; MV-153's
  legs are informational while it is proposed. CI runs `verify --strict` on the pull request with
  the new build: every leg green there.
- **The config gate.** Deleting `grapher: graphify` from `.multivac/config.yml` is a config edit;
  with `drop-graphers` open on its branch the gate reads `declared by open change drop-graphers`.
- **The code gate.** This brain holds code under spec-kit with `sdd_auto` on: every src, test,
  doc and setup edit is code or not by MV-137, and lands on the change's branch in its worktree
  either way.

Order (tasks.md phases): (1) the law's text — MV-153's row, the fourteen retirement leads and
states, the thirty-four notes, the constitution — no leg yet; (2) the source, with the legs each
deletion greens or breaks, in one commit per compile unit; (3) the old-brain path and its tests;
(4) the documents, skill and site, each with its legs; (5) **last**, this repository's graphify
setup: `graphify uninstall --project --platform claude` and `--platform agents` in the worktree,
the empty `PreToolUse` list deleted by hand, `.graphifyignore` and the `.gitignore` lines removed,
`grapher: graphify` deleted, `node dist/cli.js doors` (the new build: removes the refresh hook and
`.multivac/ecosystem.json`, re-renders `AGENTS.md`, `.multivac/flow.md` and the skill copy),
`git rm graphify-out/graph.json`, MV-153's setup leg attached, one commit; (6) measurements into
MV-153's slots. After the merge, the human pulls main and runs `rm -rf graphify-out` there
(≈ 25 MB of outputs that the removed `.gitignore` lines no longer hide), then starts a new
session so the harness reads the new settings.

Two consequences for the phases before and after the last commit. The skill edit (4) is
re-projected by the new build's `node dist/cli.js doors` in the worktree, which also takes the
refresh hook out of the worktree's own settings, removes its `.multivac/ecosystem.json` and
re-renders `AGENTS.md` and `.multivac/flow.md`: that phase stages the two skill trees alone, and
the rest waits, uncommitted, for (5) — the session's hooks are main's, so nothing changes for
it. Every edit after (5) — MV-153's measured slots, the change body — goes through Bash (`sed`,
a short script), never the Edit or Write tools.

### R9.1 The lifecycle around it, run with main's 0.15.0

The human runs every lifecycle command, with `mvac` = main's `dist/cli.js` until the merge.

- **`change apply`** (0.15.0) on this graphify brain prints its `its graph:` pointer and builds
  nothing in the worktree (graphify is shared; the per-worktree index is codegraph's): harmless.
- **`change land drop-graphers` must not run on 0.15.0.** Its `commitGraph`
  (src/commands/change.ts:494, called at :1711 for each ready repo) reads main's config, still
  `grapher: graphify`, rebuilds graphify in the worktree, writes `.multivac/ecosystem.json` there
  (:556) and commits both back onto the branch (`graph: drop-graphers — refreshed on the change
  branch`, :559), undoing the last commit. Two safe ways: run the first `land` with the change's
  own build (`node .multivac/worktrees/drop-graphers/brain/dist/cli.js change land
  drop-graphers`, from main), which commits nothing about a graph; or skip it, push and open the
  merge request by hand, and after the merge record it with `mvac change land drop-graphers
  --landed brain` — `--landed` marks the repo landed before the stage loop, so `commitGraph` is
  never reached — on the rebuilt main, so its bookkeeping commit renders no ecosystem graph
  either (0.15.0's `commitBookkeeping` writes one, :104).
- **`change close` after the merge, on the rebuilt main.** 0.15.0's close runs the graph gate
  (:1823), the tracked gate (:1831) and the refresh (:1951), and renders
  `.multivac/ecosystem.json` into the archive commit (:1958). After the merge and `corepack pnpm
  run build` in main, `mvac` is the new build: none of that runs.
- **Merge conflicts.** Every bookkeeping commit main makes while the change is open rewrites
  `.multivac/ecosystem.json`, and a land or close of another change commits
  `graphify-out/graph.json`; the branch deletes both, so the merge can report modify/delete on
  them. Each resolves by deletion (`git rm`).
- **Main's working tree.** Every Edit or Write in main — a change-file body, say — rebuilds main's
  tracked `graphify-out/graph.json` through main's refresh hook. Restore it (`git checkout --
  graphify-out/graph.json`) before pulling the merge, or the pull refuses.
- **The other open change.** `ci-moves-to-github-actions` is still `open` (merged in `da4c4e6`,
  never closed). Closed on 0.15.0 before this merge, its archive commit carries a refreshed
  `graph.json` and `ecosystem.json` (then the modify/delete above); closed after, on the new
  build, it carries neither. The rows it declares (MV-34, MV-68, MV-77, MV-88, MV-111, MV-142,
  MV-145) overlap none this change amends or retires.

## R10. Tests

**Deleted whole** (11 files, 90 tests, 3,846 lines): test/change/codegraph-real.test.ts (3),
graphify-real.test.ts (1), graph-where.test.ts (6), grapher-gate.test.ts (13),
grapher-refresh.test.ts (23), grapher-tracked.test.ts (14), harness-install.test.ts (11),
codeless-brain.test.ts (3); test/doors/ecosystem-graph.test.ts (3), graph-navigation.test.ts (10),
where.test.ts (3). Every test in them asserts a graph, an ignore file, a refresh, a harness
install, a graph gate or the ecosystem graph.

**Mixed files** — delete (D), change body (C), change title and body (T), keep (K). Titles shown
as at base; `:<line>` is the test's line.

| File | D | C/T |
| --- | --- | --- |
| test/change/binary-lookup.test.ts | :202 speckit and codegraph name the vendor; :239 a declared grapher that is missing; :258 a copy in api's node_modules/.bin | C :157 every surface agrees; C :175 found nowhere |
| test/change/brain-only.test.ts | :331 ecosystem.json code nodes carry the SDD | — |
| test/change/change.test.ts | — | T :46 → "new scaffolds the change file (unknown SDD = refused, 2)" |
| test/change/equip-lifecycle.test.ts | :118 plan equips a repo it clones, and apply a repo it creates | T :65 → "repos sync installs the SDD in the brain — MV-129"; C :83; C :92; C :153 (MV-144's leg reads its title) |
| test/change/ledger.test.ts | — | C :460 (MV-117's leg) |
| test/change/managed-repos.test.ts | :190 close refreshes and judges no graph; :221 the tracked gate skips a read-only sibling | C :174; C :204; T :235 → "a sibling with no managed key and a full clone is projected as before, and gets no SDD"; C :256 |
| test/change/per-root.test.ts | :184 grapher: none is out of scope; :268 the brain's own grapher wins; :311 a brain entry grapher | C :134; C :233 |
| test/change/refusal.test.ts | — | C :58 (uses `--no-grapher`; use `--no-sdd`) |
| test/change/ritual.test.ts | :113 a declared grapher contributes no candidate | — |
| test/change/vendor-state.test.ts | :153, :177, :199, :208, :258, :317, :366, :383, :396, :408 (graph probes, codegraph.json splice) | — (4 SDD tests kept) |
| test/cli/help.test.ts | — | C :75 (MV-69's leg); C :94 |
| test/doctor/adapters.test.ts | :183, :197, :216, :224, :236, :261, :289, :352, :462, :480, :576, :628, :644, :790, :809 | C :140; C :166; C :320; C :371; C :427; T :498 → "the brain root reads the declared entry whose path is the brain"; T :512 → "`none` is no SDD, at repo and at top level"; T :537 → "an empty sdd reads as unset"; C :549; C :689; C :825 |
| test/doctor/doctor.test.ts | :615, :712, :754, :826, :898, :941, :1075, :1135, :1214, :1306 | C :38; C :197 (MV-57's leg); T :565 → "doctor: symlink door ok"; T :1319 → "a codegraph.json with no index beside it is never named" |
| test/doors/doors.test.ts | :393 grapher declared + present; :570; :668 | C :223; C :278; C :314 (MV-147's leg); C :362; T :549 → "doors writes no refresh hook, whatever the config declares"; C :819 |
| test/doors/flow.test.ts | :70; :198; :229 | C :49; C :170; C :179 |
| test/doors/link.test.ts | :54 the vendor section is asked of the canonical door | T :25 → "a dangling link is left alone" |
| test/doors/settings.test.ts | :168, :262, :287, :344, :389, :412, :441, :463, :486, :502 | C :118 (MV-74's leg: rewrite with the gate hook); T :184 → "doors removes the refresh hooks an earlier multivac wrote, and nothing it did not write — MV-153" (MV-153's leg); T :376 → "a refresh command a human typed is never a hook of ours"; C :517 (MV-151's leg) |
| test/init/equip.test.ts | :119; :189; :222 | T :44 → "declared at init, installed at init: spec-kit scaffolded — MV-128"; C :87; C :104 (MV-153's survivor); C :152; C :231 (MV-142's leg) |
| test/init/init.test.ts | :367 (MV-102's leg, dropped); :509; :535; :577 (MV-141's leg, dropped) | C :280; C :471; T :499 → "--grapher is an unknown flag, refused before anything is written"; T :525 → "`none` is not a name --sdd can take" |
| test/init/reinit.test.ts | :76 two disagreements produce one refusal | C :116; C :161 (MV-102's leg); C :217 (MV-101's leg) |
| test/lib/config.test.ts | :44 a grapher declared under the name `none` | T :27 → "a stray under a repo entry is refused too — MV-114" |
| test/lib/init-state.test.ts | :78; :88; :104 | — |
| test/lib/out.test.ts | — | T :21 → "a Python traceback is quoted by its closing exception, and nothing of the frames"; K :64 |
| test/repos/brain-first-class.test.ts | — | C :86 |
| test/repos/check.test.ts | :126 a code-less brain with no graph | C :40; C :76; C :99 |
| test/repos/mount.test.ts | :271 keeps the mount out of its codegraph index | C :247 |
| test/seed/seed.test.ts | — | T :283 → "seed reports the brain's project document, and no graph" (MV-136's leg moves) |
| test/verify/code-in-change.test.ts | :253; :290; :324; :354 | T :207 → "what init and the SDD write for a harness is not code; .github workflows are — MV-142"; T :216 → "every path an earlier release's graphers wrote is not code, in every repo — MV-153"; C :432 |
| test/verify/quiet.test.ts | — | C :89 (the ecosystem clause leaves the one line) |
| test/verify/rooted.test.ts | — | C :416 (MV-151's leg) |
| test/skill.test.ts | — | C: the restatement matrix becomes 7 brain + 4 consumer shapes (FR-039); its leg title is kept |
| test/helpers/fixture.ts, recorded.ts | — | C: drop the grapher options and recorded grapher outputs |

**Added** (11): test/lib/config.test.ts "a config declaring a dropped grapher key loads, and the
key is recorded — MV-153"; new test/verify/dropped.test.ts "verify names the dropped keys in one
line, and a quiet run in one clause — MV-153" and "a consumer's verify says nothing of the
brain's dropped keys — MV-153"; test/doors/doors.test.ts "doors removes the ecosystem graph an
earlier release rendered, and says so once — MV-153" and "a door names a vendor's install left
beside it, and nothing where none is — MV-153"; test/doctor/doctor.test.ts "doctor names what an
earlier release's graphers left, with its removal, and runs nothing — MV-153"; new
test/invariants/no-graph.test.ts "no adapter is a grapher and no door renders a graph line,
whatever an old config declares — MV-153" and "the package ships no module that builds,
refreshes or renders a graph — MV-153"; test/doctor/doctor.test.ts "a leftover in a read-only
repo is not named — MV-153"; test/change/lifecycle-polish.test.ts "close's archive
commit names no graph and no ecosystem graph — MV-153"; test/change/refusal.test.ts
"--no-grapher is an unknown flag — MV-153"; the settings rewrite of :184 counts as changed.

Every test-title leg on a row that is not retired keeps its title (MV-57 :197, MV-69 :75, MV-74
:118, MV-101 :217, MV-102 :161, MV-117 :460, MV-142 :231, MV-144 :153, MV-151 rooted :416 and
settings :517) or moves with a renamed title (MV-136 :283) or is dropped with its test (MV-87's
grapher-refresh :1042, MV-102's init :367, MV-141's init :577, MV-143's harness-install :115).
Retired rows' test legs are history and stop being evaluated, so their deleted tests need no
edit to the law.

## R11. Documents, the skill and the CHANGELOG

Site pages name no law ID and no version (MV-126, MV-84); every site edit is dry-run against
both legs and MV-153's two site legs. Changes #5 (graph-answers-where-asked), #6
(codegraph-worktrees-and-verbs) and #9 (skill-cites-references) wrote the largest sections:

| Section | Written by | Fate |
| --- | --- | --- |
| graphers-and-sdd.md `### A brain that holds no code`, `### Where to ask the graph` | #5 | deleted with `## Graphers` |
| graphers-and-sdd.md `### A change's own codegraph index`, `### One post-edit hook per grapher` | #6 | deleted with `## Graphers` |
| commands.md apply's `its graph:`/`its index:` lines and codegraph subsection; land's graph and `codegraph.json` paragraphs; close's refresh and graph-gate subsection | #5, #6 | deleted; land and close say what they print now |
| running-changes.md apply/land/close graph samples | #5, #6 | deleted from the samples and prose |
| composition.md and DESIGN.md `Adapter first, fallback always` | #9 | **headings kept** (MV-152's `unique` legs); the grapher bullets go, the SDD's stay |
| skill: the graph paragraph (SKILL.md :66–:73, 580 B with its blank line), change.md's graph gate (:60–:62) and `## The graph` (:71–:78), 712 B, the land sentence, discovery §0's grapher clause | #5, #6, #9 | removed from skills/multivac; `.claude/skills/multivac/**` re-projected by `doors` (MV-72) |

Per page: graphers-and-sdd.md → sdd.md as in R1.3; reference/_index.md's card (`link="sdd"`,
title "SDD tools", subtitle without the graph); commands.md: init (usage, sample, the graph and
code-less paragraphs, the `--grapher` row and refusal, `doors:` or `grapher:`), doors (the
`### .multivac/ecosystem.json` subsection; add the removal and hook lines), doctor (the `grapher`
row and samples; add `config` and `leftover`, without a vendor name), repos check/sync, change
(usage flags, the unknown-flag samples, new, plan's code-less line, apply, land, close, the graph
gate), roadmap's sample slug; configuration.md: the sample config, `### grapher`,
`### grapher_auto`, `### graphers`, the read-only sample line, the mount paragraph, and one
sentence saying an earlier release's code-graph keys load and are ignored, which `verify` and
`doctor` name; hooks.md's *What "preserving" means here* (keeping MV-74's "owns only the hook it
wrote" and "the gate has to cover what it gates"); running-changes.md; composition.md (the table
row, *Not competing*, *Why a grapher helps* deleted, *Neither is required*); getting-started.md;
session-zero.md; philosophy.md's map row; adoption.md's *Next*; integrations.md :44;
the-change.md :174; distribution.md :28; docs/_index.md :61. README's adapter paragraph,
DESIGN's sections of R1.3 (a dated `### No code graph (2026-10-02)` subsection replaces "No
native code graph, ever"'s paragraph, naming no vendor), CONTRIBUTING's heading, both issue
templates, `package.json`'s keyword.

**The site page's URL.** `git mv site/content/docs/reference/graphers-and-sdd.md
site/content/docs/reference/sdd.md` with `aliases: ["/docs/reference/graphers-and-sdd/"]` in its
front matter, so published links keep working; every link to it in site/content moves. The alias
line is the site's one sanctioned mention of the word, pinned `count=1`. Its cost is eight legs
on seven otherwise untouched rows (R14). Keeping the path instead costs no law edit and keeps
"graphers" in the URL: a decision for the human (R16).

**Words the site no longer carries**: a vendor's name, `ecosystem.json`, and "grapher" outside
the alias. The upgrade story — which keys are ignored, what `doors` takes back, what `doctor`
names — is told with names in the CHANGELOG, which the site mounts but which lives at the root.

**CHANGELOG** (Unreleased), the draft:

```markdown
## Unreleased

multivac keeps no code graph. A brain that declares `grapher:` still loads, and `doors` takes
back what multivac itself wrote, but nothing builds, refreshes, gates, commits or names a graph
any more, and graphify's or codegraph's files stay until you remove them. Read the first item
before upgrading.

**Changed — read before upgrading**

- **Graphers are gone (MV-153).** multivac no longer declares, installs, builds, refreshes,
  gates, commits or names a code graph, and no longer renders `.multivac/ecosystem.json`.
  - **An old config loads.** `grapher`, `grapher_auto`, `graphers` and `repos.<key>.grapher` are
    read only to say they are ignored: `verify` and `doctor` print one line naming them, whatever
    they hold. Deleting them is a config edit, so it needs an open change (MV-97).
  - **`init --grapher` and `change close --no-grapher` are unknown flags**, refused with exit 2.
  - **`doors` takes back what multivac wrote**: every post-edit refresh hook it put in
    `.claude/settings.json` (and nothing else there), and `.multivac/ecosystem.json`. Commit the
    removal.
  - **What the vendors wrote stays until you remove it.** `doctor` names, per repo it may write
    in, graphify's `graphify-out/`, `.graphifyignore`, skills, door section and hooks, and
    codegraph's `.codegraph/` and `codegraph.json`, each with the vendor's own removal; and the
    door warns, where graphify's skill or hooks remain, that its graph is no longer refreshed.
    Those paths are not code, so the removal commits on any branch. graphify's `hook-guard` keeps
    telling agents to ask a graph that only goes staler until you run its uninstall.
  - **Doors are shorter**: 747–1,156 bytes on a consumer door, 1,308–2,276 on a brain door, and
    each edit runs one hook where it ran two.
  - **What you lose**: one-call transitive reach (`codegraph impact`, `graphify path`); one-hop
    questions cost the same or less by grep.
- Fourteen rows retired — twelve that were law and two never enacted: MV-50, MV-52, MV-58, MV-59,
  MV-61, MV-62, MV-90, MV-103, MV-131, MV-134, MV-139, MV-140, MV-148 and MV-149 (the last two
  proposed). Thirty-four rows amended.
```

The byte figures in the entry are the prototype's; tasks.md's last measurement phase replaces them
with the change's own.

## R12. The constitution

`grep -n -i 'graph' .specify/memory/constitution.md` → one line, Principle V: "Adapters are data,
not code: one entry per harness, grapher or SDD tool, and the dispatch is on the entry's kind,
never on its name." The Compliance line, the Engineering constraints and the Workflow name no
graph. **Amendment**: "one entry per harness or SDD tool". The principle's rule — entries are data,
dispatch on kind, nothing derived from a name, UNVERIFIED rather than guessed, network disclosed —
is unchanged; only the inventory of kinds it lists shrinks with the tool. Neither removed nor
redefined (MAJOR), nothing added (MINOR): **PATCH, 3.0.2 → 3.0.3**, `Last Amended: 2026-10-02`,
no Sync Impact Report (MV-146's leg `brain:.specify/memory/constitution.md /Sync Impact/ absent`),
MV-120's leg on the version line holds.


## R13. The legs

Every leg is POSIX ERE (skills/multivac/references/anchors.md: `\b` is not ERE, so the one
word boundary used is `(^|[^[:alnum:]_.])`), and every one was dry-run with the tool itself:
`sh $S/dry.sh <legs> <dir> <cli>`, which strips the mode and runs `<cli> count '<glob> /<re>/'`
in `<dir>` — base with main's build in `$S/basewt` (a worktree of `41e52c5`,
`node /home/user/multivac/dist/cli.js`), the prototype with `PROTO` in `$S/clone`.

### R13.1 MV-153's thirty legs

| # | Leg | Base (`41e52c5`) | Prototype | Greened by |
| --- | --- | --- | --- | --- |
| 1 | `brain:src/** !brain:src/lib/dropped.ts /graphify\|codegraph/i absent` | 156 in 53 | 0 in 49 | T030 (US1) |
| 2 | `brain:src/adapters/registry.ts /grapher/i absent` | 59 in 1 | 0 in 1 | T030 (US1) |
| 3 | `brain:src/types.ts /grapher\??:\|graphers:\|grapherAuto\|GrapherDecl/ absent` | 6 in 1 | 0 in 1 | T030 (US1) |
| 4 | `brain:src/** !brain:src/lib/dropped.ts /ecosystem\.json\|graph-refresh\.lock/ absent` | 5 in 53 | 0 in 49 | T030 (US1) |
| 5 | `brain:src/doors/{brain,consumer,flow}.ts /graph/i absent` | 103 in 3 | 0 in 3 | T030 (US1) |
| 6 | `brain:src/commands/{change,init}.ts /--no-grapher\|--grapher\|grapher_auto/ absent` | 14 in 2 | 0 in 2 | T030 (US1) |
| 7 | `brain:{AGENTS.md,.gitignore,.multivac/config.yml,.multivac/flow.md,.claude/**,.agents/**} /graphify\|codegraph\|grapher\|hook-guard/i absent` | 631 in 42 | 10 in 21 | T064 (US4, last commit) |
| 8 | `brain:skills/** /graphify\|codegraph\|grapher\|ecosystem\.json\|--graph/i absent` | 11 in 6 | 11 in 6 | T057 (US5 skill) |
| 9 | `brain:{README.md,DESIGN.md,CONTRIBUTING.md,.specify/memory/constitution.md,.github/ISSUE_TEMPLATE/*.md,package.json} /graphify\|codegraph\|grapher\|ecosystem\.json\|knowledge-graph/i absent` | 47 in 7 | 47 in 7 | T055 (US5 root documents) |
| 10 | `brain:site/content/** /graphify\|codegraph\|ecosystem\.json/i absent` | 268 in 23 | 268 in 23 | T054 (US5 site) |
| 11 | `brain:site/content/** /grapher/i count=1` | 214 in 23 | 214 in 23 | T054 (US5 site) |
| 12 | `brain:src/lib/config.ts /\.\.\.DROPPED_KEYS/ unique` | 0 in 1 | 1 in 1 | T030 (US1) |
| 13 | `brain:src/lib/config.ts /dropped\.push\(/ unique` | 0 in 1 | 1 in 1 | T030 (US1) |
| 14 | `brain:src/lib/dropped.ts /ignored — multivac keeps no code graph; / unique` | vacuous (file absent) | 1 in 1 | T015 (the record) |
| 15 | `brain:src/commands/{verify,doctor}.ts /droppedKeysLine\(/ each` | 0 of 2 files | 2 of 2 files | T046 (US2) |
| 16 | `brain:src/doors/settings.ts /c\.startsWith\(OUR_REFRESH_HEAD\)/ unique` | 0 in 1 | 1 in 1 | T046 (US2) |
| 17 | `brain:src/doors/settings.ts /^function removeRefreshes\(/ unique` | 0 in 1 | 1 in 1 | T046 (US2) |
| 18 | `brain:src/commands/doors.ts /await rm\(join\(brainDir, ECOSYSTEM_JSON\)\)/ unique` | 0 in 1 | 1 in 1 | T046 (US2) |
| 19 | `brain:src/commands/doctor.ts /leftoverLine\(/ unique` | 0 in 1 | 1 in 1 | T046 (US2) |
| 20 | `brain:src/lib/dropped.ts /(^\|[^[:alnum:]_.])(rm\|unlink\|rmdir\|writeFile\|appendFile)\(\|execFile\|spawn/ absent` | vacuous (file absent) | 0 in 1 | T015 (the record, from its birth) |
| 21 | `brain:src/lib/code-in-change.ts /for \(const g of leftoverGlobs\(\)\)/ unique` | 0 in 1 | 1 in 1 | T046 (US2) |
| 22 | `brain:src/commands/init.ts /await untrackedFiles\(dir\)/ unique` | 1 in 1 | 1 in 1 | T030 (held at base; from MV-148) |
| 23 | `brain:.multivac/invariants.md /RETIRED 2026-10-02 by MV-153/ count=14` | 0 in 1 | 14 in 1 | T012 (the law) |
| 24 | `brain:.multivac/invariants.md /Amended 2026-10-02 by MV-153/ count=34` | 0 in 1 | 34 in 1 | T012 (the law) |
| 25 | `brain:test/lib/config.test.ts /a config declaring a dropped grapher key loads, and the key is recorded/ unique` | 0 in 1 | 0 in 1 | T048 (US2 test) |
| 26 | `brain:test/verify/dropped.test.ts /verify names the dropped keys in one line, and a quiet run in one clause/ unique` | vacuous (file absent) | vacuous (file absent) | T048 (US2 test) |
| 27 | `brain:test/doors/settings.test.ts /doors removes the refresh hooks an earlier multivac wrote, and nothing it did not write/ unique` | 0 in 1 | 0 in 1 | T048 (US2 test) |
| 28 | `brain:test/doors/doors.test.ts /doors removes the ecosystem graph an earlier release rendered/ unique` | 0 in 1 | 0 in 1 | T048 (US2 test) |
| 29 | `brain:test/doctor/doctor.test.ts /doctor names what an earlier release's graphers left, with its removal, and runs nothing/ unique` | 0 in 1 | 0 in 1 | T048 (US2 test) |
| 30 | `brain:test/invariants/no-graph.test.ts /no adapter is a grapher and no door renders a graph line, whatever an old config declares/ unique` | vacuous (file absent) | vacuous (file absent) | T038 (US1 test) |

- Leg 7's ten matches left on the prototype are the projected skill copy
  (`.claude/skills/multivac/SKILL.md` 3, `references/change.md` 5, `references/discovery.md` 2):
  the skill task re-projects them away, the setup task the other 621 (graphify's two skill trees
  under `.claude/` and `.agents/` hold most of them).
- Legs 8–11 read files the prototype did not edit; the tasks of US5 green them, each with its
  edit. Leg 11 pins the alias line `aliases: ["/docs/reference/graphers-and-sdd/"]`, the site's
  one sanctioned mention (R11).
- Leg 22 is MV-148's `untrackedFiles` leg, held at base and carried to MV-153 because MV-148
  retires and the behaviour stays (R6).
- Legs 23 and 24 count this change's own law: `count` skips `@anchor` comment lines (MV-82),
  so neither counts itself.
- Legs 25–30 read the titles of the tests R10 adds; each lands with its test.
- Modes: `each` where two commands must both print the line (15); `count=1` for the alias (11);
  `unique` where one site carries the mechanism; `absent` for every name that must not come back.
  The legs land with the edit that greens each (FR-027): a red proposed leg blocks nothing but
  prints on every verify.

### R13.2 The fourteen tombstones and the `absent` legs kept on retired rows

Dry-run as above (`$S/tombs.txt`), base → prototype:

| Row | Leg | Base | Prototype |
| --- | --- | --- | --- |
| MV-50 | `brain:src/** /refreshGraph\|ensureGraphs/ absent` | 19 | 0 |
| MV-52 | `brain:src/** /refreshHookCmd\|ensureRefreshes\|refreshKey/ absent` | 13 | 0 |
| MV-58 | `brain:src/** /GRAPH_LOCK\|takeLock/ absent` | 7 | 0 |
| MV-59 | `brain:src/** /grapherSpec\|unverifiedGrapher\|knownGraphers\|grapherNames/ absent` | 80 | 0 |
| MV-61 | `brain:{src/**,AGENTS.md} /GrapherQuery\|grapherLines\|ASK IT BEFORE READING THE TREE RAW/ absent` | 16 | 0 |
| MV-62 | `brain:src/** /TELEMETRY IS ON BY DEFAULT\|telemetry-queue/ absent` | 1 | 0 |
| MV-90 | `brain:src/** /graphGate\|grapherAuto\|'no-grapher'/ absent` | 12 | 0 |
| MV-103 | `brain:src/** /graphTrackedGate\|chore: commit the graph/ absent` | 4 | 0 |
| MV-131 | `brain:src/** /installHarness\|runHarnessInstalls\|bareBinary/ absent` | 9 | 0 |
| MV-134 | `brain:src/** /commitGraph\|landIgnores\|sharedGraph/ absent` | 9 | 0 |
| MV-139 | `brain:src/** /renderEcosystem\|writeEcosystem\|ecosystemGraphLines/ absent` | 18 | 0 |
| MV-140 | `brain:src/** /sectionDoors\|hasGrapherSection\|navigation: ungateable/ absent` | 12 | 0 |
| MV-148 | `brain:src/** /askedGraphers\|brainRefreshGraphers\|whereLines\|graphPointer\|holdsIgnored\|graphIgnoreLines\|leftoverGraphs/ absent` | 59 | 0 |
| MV-149 | `brain:src/** /indexWorktree\|excludeLocalOutputs\|hookRefreshes\|spliceJsonList\|graphignoreJson/ absent` | 34 | 0 |

Every tombstone is red at base, so each lands in the commit that deletes the last name it
pins: main's pre-commit gate evaluates a retired row's `absent` legs and blocks on them. MV-61's
names "ASK IT BEFORE READING THE TREE RAW" in `AGENTS.md` too, the door line graphify-era
releases wrote, so it lands with the setup commit (R9), not with the source.

The `absent` legs kept on retired rows hold at 0 before and after: MV-52
`brain:src/hooks/install.ts /graph|refresh/` (:320), MV-90 (:716), MV-131 (:1090), MV-148
(:1357, :1372, :1376), MV-149 (:1423–:1426) — six of them dry-run here (`$S/tombs.txt` lines
15–20), each 0 on both trees. The five dropped (MV-50 :296, MV-52 :326, MV-103 :822, MV-139
:1173, MV-149 :1417) read `src/adapters/refresh.ts`, `src/doors/ecosystem.ts` or
`src/lib/json-splice.ts` alone: a vacuous `absent` leg blocks every run, so each goes in the
commit that deletes its file.

### R13.3 The legs that move or go

`git diff base -- .multivac/invariants.md` on the prototype: 60 anchor lines removed, 71 added.
Removed: 27 moved (old form), 28 dropped from amended rows, 5 `absent` legs over deleted files
on retired rows. Added: the 27 moved (new form), MV-153's 30 and the 14 tombstones. Each is
listed with its row in R14.2 and R14.3. The fifteen moved legs that read `src/` (`$S/moves.txt`),
base → prototype:

| Row | New leg | Base | Prototype |
| --- | --- | --- | --- |
| MV-87 | `brain:src/commands/change.ts /await equip\(brain, cfg, noSdd\)/ count=4` | 0 | 4 |
| MV-123 | `brain:src/adapters/registry.ts /required: \['/ count=2` | 4 | 2 |
| MV-123 | `brain:src/{adapters/sdd,commands/doctor}.ts /binaryMissing\(/ each` | 2 of 2 | 2 of 2 |
| MV-123 | `brain:src/adapters/sdd.ts /quoteFailure\(err\)/ unique` | 1 | 1 |
| MV-123 | `brain:src/adapters/sdd.ts /filter\(Boolean\)\.slice\(0, 3\)\|^[[:space:]]*\.slice\(0, 3\)$/ absent` | 0 | 0 |
| MV-124 | `brain:src/{adapters/sdd,commands/doctor}.ts /initState\(/ each` | 2 of 2 | 2 of 2 |
| MV-124 | `brain:src/adapters/registry.ts /env: \{ DO_NOT_TRACK: '1'/ count=1` | 2 | 1 |
| MV-124 | `brain:src/adapters/sdd.ts /\.\.\.spec\.env/ unique` | 1 | 1 |
| MV-125 | `brain:src/lib/config.ts /'channel', DROPPED_REPO_KEY, 'managed', 'path', 'role', 'sdd', 'url'/ unique` | 0 | 1 |
| MV-125 | `brain:src/{adapters/sdd,commands/doctor,commands/doors,commands/repos,commands/change}.ts /readOnly/ each` | 5 of 5 | 5 of 5 |
| MV-125 | `brain:src/{adapters/sdd,commands/change}.ts /(s\|root)\.readOnly\) continue;\|s\.name && !s\.readOnly\)/ count=1` | 2 | 1 |
| MV-129 | `brain:src/commands/change.ts /await missingTools\(brain, cfg, !noSdd\)/ unique` | 0 | 1 |
| MV-129 | `brain:src/commands/repos.ts /await missingTools\(ctx\.cwd, cfg, true\)/ unique` | 0 | 1 |
| MV-69 | `brain:src/commands/init.ts /spec-driven-development adapter — \$\{sddNames\.join/ unique` | 1 | 1 |
| MV-129 | `brain:src/commands/change.ts /MV-129: the gate above equipped what was on disk/ count=2` (kept, re-checked) | 2 | 2 |

A moved `count`, `each` or `unique` leg that is red at base (0 → 1, 4 → 2, 2 → 1) blocks main's
pre-commit until its code changes, so it moves in the commit that changes its line, never before.
The other twelve moved legs follow the page `graphers-and-sdd.md` → `sdd.md` (ten) and two
sentences the docs rewrite (MV-129's `repos sync` sentence, MV-136's seed test title).

### R13.4 Legs on files this change rewrites, which every rewrite keeps

`$S/legscan.py` lists every non-`absent` leg of a row that stays evaluated, over the files the
documents tasks edit, with the base line it matches. The ones a careless rewrite would break:

| File | Leg (row) | What must stay |
| --- | --- | --- |
| site/content/docs/reference/commands.md | MV-31 `/^## \`(init\|seed\|verify\|count\|doors\|doctor\|repos\|change\|help)/ count=9` | the `## \`init …\`` heading keeps its head when `[--grapher name]` leaves it |
| same | MV-42 `/drift/` | the `--adopt` row (:914) keeps "drifted"; its "`doors:` or `grapher:`" becomes "`doors:` or `sdd:`" (leg 11) |
| same | MV-129 (moved) | "`repos sync` also installs the declared SDD in the brain" |
| same | MV-132 `^### \`repos check\`$`, MV-150 :1869 (close's citation sample), MV-151, MV-137, MV-142, MV-80, MV-138, MV-45 | headings and samples outside the graph paragraphs |
| site/content/docs/reference/configuration.md | MV-31 `count=10` (moved), MV-53 :446, MV-125 `### \`repos.<key>.managed\``, MV-127 `### \`brain_url\``, MV-43 :391 | the ten headings left once `### \`grapher\`` goes |
| site/content/docs/reference/hooks.md | MV-74 "owns only the hook it wrote", "the gate has to cover what it gates" | both sentences, in *What "preserving" means here* |
| site/content/docs/reference/sdd.md (moved page) | MV-51 ×2, MV-55, MV-56, MV-57, MV-128, MV-130, MV-135, MV-146, MV-147 | every line they match sits at :1181 or later at base, after the deleted range :110–:1145 |
| site/content/docs/concepts/composition.md, DESIGN.md | MV-152 `## Adapter first, fallback always` and its dated DESIGN heading | the headings; only the grapher bullets go |
| site/content/docs/guide/running-changes.md | MV-133 `### The SDD files ride onto the branch` | the heading |
| site/content/docs/guide/session-zero.md | MV-136 `^### 0\. Sync$`, MV-118 :204 | the heading and the output sentence |
| README.md | MV-141 "refuses code that reaches a repo outside a change" | the sentence, when the adapter paragraph loses its graph clause |
| skills/multivac/SKILL.md | MV-72, MV-89, MV-136, MV-141, MV-152 ×3, MV-53 | rule headings, "run what they print", "**Where you are.** …", "`close` verifies only the rows the change claims" |
| skills/multivac/references/discovery.md | MV-152 "clones every declared repo and equips it", MV-136 ×2, MV-38 ×3 | §0's sentence, losing ", each repo's grapher" |
| skills/multivac/references/change.md | MV-51, MV-57, MV-89, MV-141 | the SDD flow heading, the `doctor` sentence, the carry sentence |
| .claude/settings.json | MV-112 `mvac verify >&2 \|\| exit 2` unique | the gate hook, which `doors` keeps |
| .github/ISSUE_TEMPLATE/bug.md | MV-34 `## \`multivac doctor\`` | the heading |
| package.json | MV-02, MV-08, MV-22, MV-68, MV-92, MV-104 | only the `keywords` entry changes |

No kept leg reads a line that names a graph in those files except leg 11's targets and the
three rows above (MV-31's init heading, MV-42's `--adopt` row, MV-129's sentence). The test
legs are R10's.

### R13.5 `verify --strict --check` on the prototype

After the source, the setup removal and the whole law of R14
(`node dist/cli.js verify --strict --check` in `$S/clone`), 4 broken and 5 vacuous blocking,
plus MV-153's own: every red is a file this design did not prototype — the moved page (MV-51 ×2,
MV-57, MV-128, MV-130, MV-135 vacuous or reading the old page; MV-146, MV-147 informational),
MV-136's renamed seed test title, MV-153's skill, root-document and site legs (8–11) and its six
test titles. No source leg of any row is red; every tombstone is 0.

## R14. The law

Counted with `$S/cnt.py` over `.multivac/invariants.md` at `f156896`, MV-153 aside: the vendor
and mechanism words (`graphify|codegraph|grapher|graph gate|refresh hook|ecosystem\.json|ecosystem graph`,
case-insensitive, in a row's statement or its legs) name **50 rows and 97 legs**; adding
`\bgraph\b`, `graph\.json`, `hook-guard` and `--graph` names **54 rows and 116 legs**. (The
human's estimate was 39 rows and 86 legs.) Every one of the 54 is in R14.1. Of them, eight are
`proposed`, never enacted — MV-143 to MV-152 but MV-145 and MV-151 — and the rest `active`.

### R14.1 Every row that names a graph, and what happens to it

**14 retired** (12 active, 2 proposed: MV-148 and MV-149), **34 amended** (28 active, 6 proposed;
seven of them only follow the moved page), **6 untouched**. "Legs" is the row's leg count at
`f156896`, in brackets those naming a graph word; "moved" and "dropped" are R14.3's.

| Row | State | Legs (naming a graph term) | Disposition | Legs after |
| --- | --- | --- | --- | --- |
| MV-01 | active | 6 (0) | untouched — "the import graph" (module imports), not a code graph | unchanged |
| MV-25 | active | 4 (0) | **amend** | unchanged; 4 untouched |
| MV-31 | active | 6 (1) | **amend** | 1 moved; 5 untouched |
| MV-38 | active | 8 (0) | untouched — "workspace/build graph" is a seed category | unchanged |
| MV-50 | active | 11 (6) | **retire** | 10 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 1 dropped; +1 tombstone |
| MV-51 | active | 13 (2) | **amend** (page move only) | 2 moved; 11 untouched |
| MV-52 | active | 15 (5) | **retire** | 13 non-`absent` kept as history, unevaluated; `absent`: 1 kept, 1 dropped; +1 tombstone |
| MV-55 | active | 12 (1) | **amend** (page move only) | 1 moved; 11 untouched |
| MV-56 | active | 20 (1) | **amend** (page move only) | 1 moved; 19 untouched |
| MV-57 | active | 13 (1) | **amend** (page move only) | 1 moved; 12 untouched |
| MV-58 | active | 7 (3) | **retire** | 7 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 0 dropped; +1 tombstone |
| MV-59 | active | 13 (10) | **retire** | 13 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 0 dropped; +1 tombstone |
| MV-61 | active | 10 (7) | **retire** | 10 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 0 dropped; +1 tombstone |
| MV-62 | active | 3 (2) | **retire** | 3 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 0 dropped; +1 tombstone |
| MV-69 | active | 4 (1) | **amend** | 1 moved; 3 untouched |
| MV-74 | active | 16 (0) | **amend** | unchanged; 16 untouched |
| MV-77 | active | 5 (0) | untouched — "job graph" of the deploy workflow | unchanged |
| MV-80 | active | 20 (0) | **amend** | unchanged; 20 untouched |
| MV-86 | active | 8 (0) | untouched — "after editing `doors:` or `grapher:`" is the reason given for a design, true as history | unchanged |
| MV-87 | active | 16 (1) | **amend** | 1 moved, 5 dropped; 10 untouched |
| MV-90 | active | 11 (6) | **retire** | 10 non-`absent` kept as history, unevaluated; `absent`: 1 kept, 0 dropped; +1 tombstone |
| MV-93 | active | 8 (0) | **amend** | unchanged; 8 untouched |
| MV-97 | active | 5 (0) | untouched — "what the grapher was before MV-90" is history | unchanged |
| MV-98 | active | 4 (0) | **amend** | unchanged; 4 untouched |
| MV-102 | active | 5 (1) | **amend** | 1 dropped; 4 untouched |
| MV-103 | active | 9 (3) | **retire** | 8 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 1 dropped; +1 tombstone |
| MV-114 | active | 8 (0) | **amend** | unchanged; 8 untouched |
| MV-115 | active | 8 (0) | **amend** | 1 dropped; 7 untouched |
| MV-121 | active | 5 (1) | **amend** | unchanged; 5 untouched |
| MV-122 | active | 8 (4) | **amend** | 2 dropped; 6 untouched |
| MV-123 | active | 14 (0) | **amend** | 4 moved, 2 dropped; 8 untouched |
| MV-124 | active | 21 (2) | **amend** | 3 moved, 8 dropped; 10 untouched |
| MV-125 | active | 14 (1) | **amend** | 3 moved; 11 untouched |
| MV-128 | active | 8 (2) | **amend** | 1 moved, 2 dropped; 5 untouched |
| MV-129 | active | 9 (3) | **amend** | 3 moved; 6 untouched |
| MV-130 | active | 11 (1) | **amend** (page move only) | 1 moved; 10 untouched |
| MV-131 | active | 11 (4) | **retire** | 10 non-`absent` kept as history, unevaluated; `absent`: 1 kept, 0 dropped; +1 tombstone |
| MV-132 | active | 8 (0) | **amend** | unchanged; 8 untouched |
| MV-134 | active | 9 (3) | **retire** | 9 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 0 dropped; +1 tombstone |
| MV-135 | active | 11 (1) | **amend** (page move only) | 1 moved; 10 untouched |
| MV-136 | active | 13 (1) | **amend** | 1 moved; 12 untouched |
| MV-137 | active | 15 (0) | **amend** | unchanged; 15 untouched |
| MV-139 | active | 10 (2) | **retire** | 9 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 1 dropped; +1 tombstone |
| MV-140 | active | 12 (2) | **retire** | 12 non-`absent` kept as history, unevaluated; `absent`: 0 kept, 0 dropped; +1 tombstone |
| MV-141 | active | 13 (1) | **amend** | 2 dropped; 11 untouched |
| MV-142 | active | 11 (0) | untouched — "a brain declaring openspec and no grapher was refused" is the measured incident | unchanged |
| MV-143 | proposed | 11 (0) | **amend** | 5 dropped; 6 untouched |
| MV-144 | proposed | 9 (0) | **amend** | unchanged; 9 untouched |
| MV-146 | proposed | 49 (1) | **amend** | 1 moved; 48 untouched |
| MV-147 | proposed | 50 (1) | **amend** (page move only) | 1 moved; 49 untouched |
| MV-148 | proposed | 49 (19) | **retire** (never enacted) | 46 non-`absent` kept as history, unevaluated; `absent`: 3 kept, 0 dropped; +1 tombstone |
| MV-149 | proposed | 39 (15) | **retire** (never enacted) | 34 non-`absent` kept as history, unevaluated; `absent`: 4 kept, 1 dropped; +1 tombstone |
| MV-150 | proposed | 33 (0) | **amend** | unchanged; 33 untouched |
| MV-152 | proposed | 16 (1) | **amend** | unchanged; 16 untouched |

Why the six stay: each names a graph in another sense, or states history that stays true.
MV-01 means the module import graph; MV-38's "workspace/build graph" is a `seed` category;
MV-77's "job graph" is the deploy workflow's; MV-86 gives "people run `doors` after editing
`doors:` or `grapher:`" as the reason restamping was wrong — true of the releases it describes;
MV-97 says what the grapher *was* before MV-90; MV-142 records the incident that a brain
declaring openspec and no grapher was refused its first commit. None has a leg on a deleted
file or a deleted name.

**Proposed against active.** A proposed row never blocks (src/commands/verify.ts:1153), so the
two proposed retirements and the six proposed notes change what the human enacts, not what any
commit is refused over. Retiring MV-148 and MV-149 before they are enacted keeps the record of
what #5 and #6 measured (their statements stay, under the lead) and says plainly that they never
bound. Their kept `absent` legs, like every retired row's, are still evaluated — and block.


### R14.2 The fourteen retirements

Each row's statement gets a lead, its state becomes `retired`, and its authority, date and source are kept. Its legs other than `absent` stay as history and stop being evaluated (verify evaluates a retired row's `absent` legs only, src/commands/verify.ts:1218–:1220); an existing `absent` leg over a file this change deletes goes, since a vacuous `absent` leg blocks every run; every other `absent` leg stays; one new `absent` leg pins the dead mechanism's names in `src/**` (skills/multivac/references/change.md, *Retiring an invariant*, steps 2–4).

| Row | State | Lead, written before "Original claim, kept for history: " | `absent` dropped | `absent` kept | New tombstone |
| --- | --- | --- | --- | --- | --- |
| MV-50 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. Its `absent` leg over `src/adapters/refresh.ts` goes with that file; the new `absent` legs pin the dead names. | :296 | — | `brain:src/** /refreshGraph\|ensureGraphs/ absent` |
| MV-52 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. Its `absent` leg over `src/adapters/refresh.ts` goes with that file; the new `absent` legs pin the dead names. | :326 | :320 | `brain:src/** /refreshHookCmd\|ensureRefreshes\|refreshKey/ absent` |
| MV-58 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | — | `brain:src/** /GRAPH_LOCK\|takeLock/ absent` |
| MV-59 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | — | `brain:src/** /grapherSpec\|unverifiedGrapher\|knownGraphers\|grapherNames/ absent` |
| MV-61 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | — | `brain:{src/**,AGENTS.md} /GrapherQuery\|grapherLines\|ASK IT BEFORE READING THE TREE RAW/ absent` |
| MV-62 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | — | `brain:src/** /TELEMETRY IS ON BY DEFAULT\|telemetry-queue/ absent` |
| MV-90 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | :716 | `brain:src/** /graphGate\|grapherAuto\|'no-grapher'/ absent` |
| MV-103 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. Its `absent` leg over `src/adapters/refresh.ts` goes with that file; the new `absent` legs pin the dead names. | :822 | — | `brain:src/** /graphTrackedGate\|chore: commit the graph/ absent` |
| MV-131 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | :1090 | `brain:src/** /installHarness\|runHarnessInstalls\|bareBinary/ absent` |
| MV-134 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | — | `brain:src/** /commitGraph\|landIgnores\|sharedGraph/ absent` |
| MV-139 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. Its `absent` leg over `src/doors/ecosystem.ts` goes with that file; the new `absent` legs pin the dead names. | :1173 | — | `brain:src/** /renderEcosystem\|writeEcosystem\|ecosystemGraphLines/ absent` |
| MV-140 | active | RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph. | — | — | `brain:src/** /sectionDoors\|hasGrapherSection\|navigation: ungateable/ absent` |
| MV-148 | proposed | RETIRED 2026-10-02 by MV-153, never enacted — multivac keeps no code graph. | — | :1357, :1372, :1376 | `brain:src/** /askedGraphers\|brainRefreshGraphers\|whereLines\|graphPointer\|holdsIgnored\|graphIgnoreLines\|leftoverGraphs/ absent` |
| MV-149 | proposed | RETIRED 2026-10-02 by MV-153, never enacted — multivac keeps no code graph. Its `absent` leg over `src/adapters/refresh.ts` and `src/lib/json-splice.ts` goes with those files; the new `absent` legs pin the dead names. | :1417 | :1423, :1424, :1425, :1426 | `brain:src/** /indexWorktree\|excludeLocalOutputs\|hookRefreshes\|spliceJsonList\|graphignoreJson/ absent` |

`:<n>` is the leg's line in `.multivac/invariants.md` at `f156896` (the same as at `41e52c5` for every row above MV-153).

### R14.3 The thirty-four notes, and the legs that move or go with them

Each note is appended at the END of its row's statement, after every earlier amendment, as `**Amended 2026-10-02 by MV-153**: <text>`. Quoted sentences are the row's own words, checked against `$S/amend-src.txt` (the row's sentences that name a graph, extracted with a sentence splitter).

- **MV-25** (active): MV-148's note is WITHDRAWN: `change apply` prints nothing under a workspace about "what reaches that checkout's graph", since multivac keeps none.
- **MV-31** (active): `grapher` leaves the list of keys the configuration leg checks, ten now: the loader reads `grapher`, `grapher_auto`, `graphers` and `repos.<key>.grapher` only to say they are ignored (MV-153), and the reference documents none of them.
  - :157 `` brain:site/content/docs/reference/configuration.md /^### `(doors|sdd|sdd_auto|grapher|authorities|blocking|staleness|strict_pre_push|channel|mount|repos)`$/ count=11 `` → `` brain:site/content/docs/reference/configuration.md /^### `(doors|sdd|sdd_auto|authorities|blocking|staleness|strict_pre_push|channel|mount|repos)`$/ count=10 ``
- **MV-51** (active): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :317 `brain:site/content/docs/reference/graphers-and-sdd.md /steps are \*\*commands the agent runs\*\*/ unique` → `brain:site/content/docs/reference/sdd.md /steps are \*\*commands the agent runs\*\*/ unique`
  - :318 `brain:site/content/docs/reference/graphers-and-sdd.md /has no agent-run close step/` → `brain:site/content/docs/reference/sdd.md /has no agent-run close step/`
- **MV-55** (active): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :379 `brain:site/content/docs/reference/graphers-and-sdd.md /Each tool's own flow, not a fixed triple/` → `brain:site/content/docs/reference/sdd.md /Each tool's own flow, not a fixed triple/`
- **MV-56** (active): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :400 `brain:site/content/docs/reference/graphers-and-sdd.md /The gate: what the tool really produces/` → `brain:site/content/docs/reference/sdd.md /The gate: what the tool really produces/`
- **MV-57** (active): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :414 `brain:site/content/docs/reference/graphers-and-sdd.md /The project-level document/` → `brain:site/content/docs/reference/sdd.md /The project-level document/`
- **MV-69** (active): `init` takes no `--grapher`, so "`--provider`, `--sdd` and `--grapher` list what the tool actually ships" holds of `--provider` and `--sdd`; the leg on `grapherNames` moves to `sddNames`.
  - :507 `brain:src/commands/init.ts /grapherNames\.join/ unique` → `brain:src/commands/init.ts /spec-driven-development adapter — \$\{sddNames\.join/ unique`
- **MV-74** (active): multivac writes no refresh hook. "The refresh carries no such requirement: it is the agent's aid, not a gate, and rides wherever its hook sits" and, in MV-149's note, "so the merge keeps one hook per wanted grapher" and "An update rewrites each grapher's own hooks, copies included" are WITHDRAWN. A refresh hook an earlier release wrote is still recognised by its lock preamble, and `doors` removes every one, each with only the entries thereby left empty, whatever the config declares.
- **MV-80** (active): close runs no graph gate: "The SDD and graph gates `close` runs first" reads "The SDD gates `close` runs first".
- **MV-87** (active): the grapher half is WITHDRAWN — "and the grapher's first build reaches every declared, present repo rather than only the repos a change happened to touch", MV-90's note, MV-121's citation of the grapher's first build, "`none` is a token for `grapher:` as well as `sdd:`", "`doctor` reports a root that resolves no grapher, while another root resolves one, as out of scope, not a gap" and MV-148's note: multivac builds and reports no graph. The SDD half stands as MV-146 left it. Its legs on the graph build, doctor's out-of-scope line and the build test go; the `equip` count follows the call that lost its repo list.
  - :672 `brain:src/commands/doctor.ts /out of scope, not a gap/ unique` → **dropped**
  - :675 `brain:src/adapters/refresh.ts /export async function ensureGraphs/ unique` → **dropped**
  - :676 `brain:src/adapters/refresh.ts /const first = st\.state !== 'installed'/ unique` → **dropped**
  - :677 `brain:src/commands/change.ts /await equip\(brain, cfg, noSdd, / count=4` → `brain:src/commands/change.ts /await equip\(brain, cfg, noSdd\)/ count=4`
  - :678 `brain:src/adapters/equip.ts /await ensureGraphs\(brain, cfg, only\);/ unique` → **dropped**
  - :679 `brain:test/change/grapher-refresh.test.ts /repos sync builds a declared repo no change names/` → **dropped**
- **MV-93** (active): no door carries a graph block: "which is the shape MV-90 set with the graph block", "The grapher block is unchanged" and MV-148's note are WITHDRAWN. A door names a vendor's install an earlier release left beside it from its callers' probe (`leftoverVendors`, in `init` and `doors`), never from the renderer.
- **MV-98** (active): "A declared grapher contributes none: its work is automatic and MV-90 already requires its artifact" is WITHDRAWN: multivac declares no grapher.
- **MV-102** (active): the door names no grapher, so the leg on "the scaffolded door names the declared grapher" goes with that test; one rendering, the bytes `doors` writes, stands.
  - :812 `brain:test/init/init.test.ts /the scaffolded door names the declared grapher/` → **dropped**
- **MV-114** (active): `graphers:` is not read: "and `graphers.<name>`" leaves the stray-key refusal, since the grapher keys load and are ignored whatever they hold (MV-153). "`--grapher` is checked against the registry only …" and MV-122's note on it are WITHDRAWN: `init` takes no `--grapher`, and the shared guard refuses it as an unknown flag, exit 2.
- **MV-115** (active): "A declared refresh meant two things" is WITHDRAWN with the refresh, and with it the first-word ceiling and MV-123's note on it: multivac runs no grapher command. Its leg on the shell runner goes; the other three places stand.
  - :912 `brain:src/adapters/refresh.ts /execFileP\('sh', \['-c', run\]/ unique` → **dropped**
- **MV-121** (active): the registry has no codegraph entry: "The codegraph entry now says its `env` does not reach the `codegraph query` a door prints" and MV-149's note are WITHDRAWN, and "(a validator, a scaffold, a grapher's refresh)" reads "(a validator, a scaffold)".
- **MV-122** (active): `grapher` is no kind any more. "and `none` is a token for both kinds" holds of `sdd:`; "`graphers.none` is refused at load", "`init --grapher` takes a verified grapher or one under `graphers:` in a readable config already at the target, else exits 2 before creating anything", "which an empty `grapher:` still does" and MV-148's note are WITHDRAWN: the grapher keys load and are ignored, and `--grapher` is an unknown flag. Its legs on the init refusal and the `graphers.none` check go; the `absent` legs stay.
  - :976 `brain:src/commands/init.ts /unknown --grapher \$\{/ unique` → **dropped**
  - :977 `brain:src/lib/config.ts /=== NO_ADAPTER/ unique` → **dropped**
- **MV-123** (active): `findBinary` is the lookup for an SDD binary: "the build and refresh at close, the graph gate, `doors`' hook wiring" leave the surfaces that ask `missingRequired`, and "A declared grapher without `binary:` is looked up by its first word (MV-115)" is WITHDRAWN. The `required` count is two, and the legs drop `src/adapters/refresh.ts` and the hook's PATH line.
  - :983 `brain:src/adapters/registry.ts /required: \['/ count=4` → `brain:src/adapters/registry.ts /required: \['/ count=2`
  - :986 `brain:src/{adapters/sdd,adapters/refresh,commands/doctor}.ts /binaryMissing\(/ each` → `brain:src/{adapters/sdd,commands/doctor}.ts /binaryMissing\(/ each`
  - :988 `brain:src/adapters/{sdd,refresh}.ts /quoteFailure\(err\)/ each` → `brain:src/adapters/sdd.ts /quoteFailure\(err\)/ unique`
  - :989 `brain:src/adapters/{sdd,refresh}.ts /filter\(Boolean\)\.slice\(0, 3\)|^[[:space:]]*\.slice\(0, 3\)$/ absent` → `brain:src/adapters/sdd.ts /filter\(Boolean\)\.slice\(0, 3\)|^[[:space:]]*\.slice\(0, 3\)$/ absent`
  - :990 `brain:src/doors/settings.ts /PATH="\$PATH:\$PWD\/node_modules\/\.bin";/ unique` → **dropped**
  - :991 `brain:src/adapters/refresh.ts /localBin\(dir\)\]/ unique` → **dropped**
- **MV-124** (active): the probe answers for the SDDs alone: "graphify by a `graphify-out/graph.json` that parses, codegraph by `.codegraph/codegraph.db`, a declared grapher by its artifact", "A grapher root not installed gets the build, an installed one the refresh, an unevaluable one neither, and the graph gate refuses every root not installed", "a grapher its `artifactKind`", the tracked gate's HEAD read for a shared artifact and MV-148's and MV-149's notes are WITHDRAWN: multivac probes, builds and exports nothing for a grapher. Its legs on the deleted runners, codegraph's entry and the hook's export go, and the `env` count is one.
  - :997 `brain:src/{adapters/sdd,adapters/refresh,adapters/tracked,commands/doctor}.ts /initState\(/ each` → `brain:src/{adapters/sdd,commands/doctor}.ts /initState\(/ each`
  - :1001 `brain:src/adapters/registry.ts /artifacts: \['\.codegraph\/codegraph\.db'\]/ unique` → **dropped**
  - :1002 `brain:src/adapters/registry.ts /artifactKind: 'local'/ unique` → **dropped**
  - :1003 `brain:src/adapters/tracked.ts /artifactKind === 'local'/ unique` → **dropped**
  - :1005 `brain:src/adapters/registry.ts /env: \{ DO_NOT_TRACK: '1'/ count=2` → `brain:src/adapters/registry.ts /env: \{ DO_NOT_TRACK: '1'/ count=1`
  - :1006 `brain:src/adapters/{sdd,refresh}.ts /\.\.\.spec\.env/ each` → `brain:src/adapters/sdd.ts /\.\.\.spec\.env/ unique`
  - :1007 `` brain:src/doors/settings.ts /`export \$\{exported\}; `/ unique `` → **dropped**
  - :1012 `brain:src/adapters/refresh.ts /\.state === 'installed'\) continue; \/\/ already built here/ unique` → **dropped**
  - :1013 `brain:src/adapters/refresh.ts /build and refresh skipped — / unique` → **dropped**
  - :1014 `brain:src/adapters/tracked.ts /\.state !== 'installed'\) continue; \/\/ MV-90's refusal/ unique` → **dropped**
  - :1015 `brain:src/commands/doors.ts /env: spec\.env \?\? \{\}, artifact: spec\.artifacts\[0\]/ unique` → **dropped**
- **MV-125** (active): multivac builds, refreshes, gates, installs and hooks no graph: "or reads it from `sddRoots` and `graphScopes`" reads "or reads it from `sddRoots`", and "the build and the refresh at close run nothing there and print nothing", "the graph and tracked gates never judge it", MV-131's note and MV-148's note are WITHDRAWN. `doctor` names no leftover in a read-only root. The repo-entry key list keeps `grapher` only so an old config loads; the legs drop the deleted files and recount the skips.
  - :1018 `brain:src/lib/config.ts /'channel', 'grapher', 'managed', 'path', 'role', 'sdd', 'url'/ unique` → `brain:src/lib/config.ts /'channel', DROPPED_REPO_KEY, 'managed', 'path', 'role', 'sdd', 'url'/ unique`
  - :1023 `brain:src/{adapters/sdd,adapters/refresh,adapters/tracked,commands/doctor,commands/doors,commands/repos,commands/change}.ts /readOnly/ each` → `brain:src/{adapters/sdd,commands/doctor,commands/doors,commands/repos,commands/change}.ts /readOnly/ each`
  - :1026 `brain:src/{adapters/refresh,adapters/sdd,adapters/tracked,commands/change}.ts /(s|root)\.readOnly\) continue;|s\.name && !s\.readOnly\)/ count=6` → `brain:src/{adapters/sdd,commands/change}.ts /(s|root)\.readOnly\) continue;|s\.name && !s\.readOnly\)/ count=1`
- **MV-128** (active): init equips the SDD alone: "and then `ensureGraphs`", "and the grapher's first build", "Before a graph's first build, the grapher's ignore lines are appended where missing …" and MV-148's and MV-149's notes are WITHDRAWN — multivac writes no `.graphifyignore`, `codegraph.json`, `.gitignore` line or `info/exclude` line for a grapher. The page its leg reads is `sdd.md`; its legs on the ignore writer go.
  - :1055 `brain:src/adapters/refresh.ts /await writeIgnores\(s\.name, spec, s\.dir, s\.scope, / unique` → **dropped**
  - :1056 `brain:src/adapters/registry.ts /graphignoreFile: '\.graphifyignore'/ unique` → **dropped**
  - :1059 `` brain:site/content/docs/reference/graphers-and-sdd.md /`init`, `change new`, `change plan`, `change apply` and `change close` run it/ unique `` → `` brain:site/content/docs/reference/sdd.md /`init`, `change new`, `change plan`, `change apply` and `change close` run it/ unique ``
- **MV-129** (active): `equip` runs `runScaffold` alone and `toolsToRun` names SDDs alone: "then `ensureGraphs`", "a known grapher whose probe says anything but installed", "A missing grapher at `change new` stays a notice, because no step it prints needs one and `change close` refuses a missing graph (MV-90)", MV-131's note and MV-148's note are WITHDRAWN. The legs follow `missingTools`' new signature and the page's new sentence.
  - :1064 `brain:src/commands/change.ts /await missingTools\(brain, cfg, \{ sdd: !noSdd, grapher: false \}\)/ unique` → `brain:src/commands/change.ts /await missingTools\(brain, cfg, !noSdd\)/ unique`
  - :1065 `brain:src/commands/repos.ts /await missingTools\(ctx\.cwd, cfg, \{ sdd: true, grapher: true \}\)/ unique` → `brain:src/commands/repos.ts /await missingTools\(ctx\.cwd, cfg, true\)/ unique`
  - :1069 `` brain:site/content/docs/reference/commands.md /`repos sync` also installs the declared SDD in the brain and the grapher in every repo/ unique `` → `` brain:site/content/docs/reference/commands.md /`repos sync` also installs the declared SDD in the brain/ unique ``
- **MV-130** (active): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :1081 `` brain:site/content/docs/reference/graphers-and-sdd.md /\| `cursor` \| `cursor-agent` \| `cursor` \|/ unique `` → `` brain:site/content/docs/reference/sdd.md /\| `cursor` \| `cursor-agent` \| `cursor` \|/ unique ``
- **MV-132** (active): "or its declared graph not built or, shared, not in HEAD", "An unverified grapher is named, not checked" and MV-148's note are WITHDRAWN: `repos check` asks nothing of a graph, and `doctor` alone names what an earlier release's graphers left.
- **MV-135** (active): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :1133 `brain:site/content/docs/reference/graphers-and-sdd.md /^A written constitution may keep the template's HTML comments/ unique` → `brain:site/content/docs/reference/sdd.md /^A written constitution may keep the template's HTML comments/ unique`
- **MV-136** (active): `seed`'s setup section names no graph: "its declared graph's state and" is WITHDRAWN. Its test leg follows the renamed test.
  - :1146 `brain:test/seed/seed.test.ts /reports each repo..s graph and the brain..s project document/ unique` → `brain:test/seed/seed.test.ts /seed reports the brain's project document, and no graph/ unique`
- **MV-137** (active): the code gate reads no grapher from the registry: "the SDD's and grapher's shared, local and artifact paths" reads "the SDD's", "or install probe" leaves the harness-directory sentence, and in MV-148's note every known or declared grapher's paths become every path graphify 0.9.29's and codegraph 1.6.0's installs wrote, by name (MV-153), so removing what an earlier release left is free in any repo; "are also the grapher's ignore lines" is WITHDRAWN.
- **MV-141** (active): "the graph committed at land" and "the ecosystem graph" leave what the documentation and the skill describe, and "`init` writes the ecosystem graph" is WITHDRAWN: multivac commits no graph and renders no `.multivac/ecosystem.json`. Its leg on that write and its test go.
  - :1203 `brain:src/commands/init.ts /await writeEcosystem\(dir, cfg\)/ unique` → **dropped**
  - :1208 `brain:test/init/init.test.ts /init writes the ecosystem graph the door it writes names/ unique` → **dropped**
- **MV-143** (proposed): multivac runs no vendor's harness install: the rule's first half — "`installHarness` links every declared door whose target kind is `symlink` in each writable root before it runs the vendor", the recorded landing place of each platform's section, `sectionDoors`, the door citing that section, `doctor` offering an install and the `redundant` skip — and MV-148's note are WITHDRAWN; a door names a vendor's install only as a leftover (MV-153). The retired-target removal and the consumer door's law path stand. Its legs on the install, the section rule and the install test go.
  - :1223 `brain:src/adapters/refresh.ts /linkDoor\(s\.dir, t\.door\)/ unique` → **dropped**
  - :1224 `brain:src/doors/brain.ts /export function sectionDoors\(/ unique` → **dropped**
  - :1225 `brain:src/adapters/registry.ts /section: 'canonical'(, files: \[[^[]*\])? \}/ count=2` → **dropped**
  - :1229 `brain:src/adapters/refresh.ts /already carries the/ unique` → **dropped**
  - :1232 `brain:test/change/harness-install.test.ts /the door is linked before the vendor writes there/ unique` → **dropped**
- **MV-144** (proposed): the ceiling "With graphify declared, `land`'s fast-forward merge still aborts over an untracked `graph.json`; that is named, not fixed here" is WITHDRAWN: no graph is built or committed, and the archive commit carries neither a shared graph nor the ecosystem graph.
- **MV-146** (proposed): in "`seed`, flow.md, `ecosystem.json` and `init`'s printed step", `ecosystem.json` is WITHDRAWN: multivac renders it no more. The page its leg reads is `sdd.md`.
  - :1299 `brain:site/content/docs/reference/graphers-and-sdd.md /^### The SDD lives in the brain$/ unique` → `brain:site/content/docs/reference/sdd.md /^### The SDD lives in the brain$/ unique`
- **MV-147** (proposed): the reference page `graphers-and-sdd.md` is `sdd.md` now that it names no grapher; the leg reading it follows, and the rule it checks is unchanged.
  - :1350 `brain:site/content/docs/reference/graphers-and-sdd.md /^### The question openspec asks at archive$/ unique` → `brain:site/content/docs/reference/sdd.md /^### The question openspec asks at archive$/ unique`
- **MV-150** (proposed): close runs no graph gate: "The SDD, graph and tracked-graph gates `close` runs before its citation gate" reads "The SDD gates `close` runs before its citation gate".
- **MV-152** (proposed): the skill names no grapher: "says when that surface prints nothing: a grapher with no verbs, no grapher, no SDD" reads "says when that surface prints nothing: no SDD", and "a graph answers what reaches what for the checkout asked, and is not a byte saving" is WITHDRAWN with every copy it rewrote, which this change removes. The restatement test renders seven brain and four consumer doors.

### R14.4 MV-153

In the house style of MV-146 to MV-152: the measured facts first, then **The rule.**, **What is
mechanical**, **Ceilings.** It replaces the reserved row at `f156896` in place (`| MV-153 |
RESERVED … |`). The three figures in ⟨ ⟩ are the prototype's and are re-measured on the change's
tree by tasks.md's last phase; every other figure is a base measurement (R7, R8) and stands.

```markdown
| MV-153 | **multivac keeps no code graph: it declares, installs, builds, refreshes, gates, commits, renders and names none, and a brain an earlier release equipped still loads, is told once what is ignored, and gets back only what multivac itself wrote.** Measured 2026-10-02 on `41e52c5` (0.15.0) with graphify 0.9.29, codegraph 1.6.0 and spec-kit 1.0.11, in scratch ecosystems with HOME and GIT_CONFIG_GLOBAL isolated, and on this brain. Graphers held ⟨3,594⟩ of 19,665 source lines — four modules whole and parts of 23 more — and ⟨171⟩ of 987 tests. This brain's door was 4,445 bytes, 1,807 of them about a graph: four multivac lines (1,034) and graphify's own section (773), plus 226 bytes of `.claude/CLAUDE.md`, against 2,638 without. A consumer door was 1,884 bytes on graphify and 2,293 on codegraph against 1,137 with none; a brain door holding code with two code repos, 4,594 and 4,921 against 2,645. Each edit ran two hooks, the gate and a refresh that returned in 18–25 ms and then rebuilt this brain's 2,198,534-byte graph in the background in 5.8–6.0 s, 8.2–8.8 s of CPU and 191 MB; each search and each read ran graphify's own guard, 70–82 ms, adding 190 or 402 bytes to the agent's context. `change apply` took 1,629–2,018 ms on a codegraph brain against 521–637 ms with none. `.multivac/ecosystem.json` was 461,364 bytes, rewritten by every bookkeeping commit; two greps, 532 bytes, answered what its `explain` of one row answered in 1,073. What a graph gave that a grep does not is reach: codegraph's `impact` named 12 symbols in 3 files in one call, where a grep names the 5 direct callers. The package shipped 62 files and 288,664 bytes, ⟨59 and 230,151⟩ without. **The rule.** No adapter kind, registry entry, config key, flag, door line, hook, gate, lifecycle step, committed artifact or rendered file of multivac's concerns a code graph. A config still declaring `grapher`, `grapher_auto`, `graphers` or `repos.<key>.grapher` loads whatever they hold; `verify` in the brain and `doctor` each print one line naming them as ignored and how to delete them, with a change open, since the config is invariant (MV-97), and a quiet run carries it as one clause. `doors` removes every post-edit refresh hook an earlier multivac wrote, known by the lock preamble it always began with, each entry only where that leaves it empty, and says how many; and it removes `.multivac/ecosystem.json`, which multivac wrote and nothing reads. It deletes nothing else: a vendor's output directory, ignore file, skills, door section and hooks stay, and `doctor` names them in each checkout it may write in, with the vendor's own removal, printed and never run. Where a vendor's own skill or hooks remain beside a door, the door says in one line that its graph is not refreshed. Every path those two vendors' installs wrote stays not code (MV-137), so their removal commits on any branch. `init` still decides that a brain holds code from its tracked and untracked files, as MV-148 measured, and writes `brain: .` for one that does. **What is mechanical**: `absent` legs over `src/**` but the record of what was dropped on both vendors' names, the rendered file and the hook lock, over the registry, the config type, the door renderers and the lifecycle's flags on the grapher's words, and over the skill, the root documents, the constitution, this brain's own setup and the site; a `count=1` leg on the site's one sanctioned mention, the moved page's alias; `unique` legs on the loader's ignored keys, the ignore line, the hook removal by its preamble, the ecosystem removal, the leftover line, the code gate's leftover paths and the code decision `init` keeps; an `each` leg on the two commands printing the ignore line; an `absent` leg on any write, delete or spawn in the record; test legs; and `count` legs on this row's fourteen retirements and thirty-four notes. **Ceilings.** The hook removal knows only the preamble multivac wrote: a hook a human edited past it, a vendor's own hook and a `*.graphify-bak` copy are named at most, never removed. `doctor` names what the two vendors measured at those versions wrote; another grapher's files, or a layout a later version moves, go unnamed, and an install in a read-only repo is not named. The `.codegraph/` line an earlier `change apply` appended to a repository's `.git/info/exclude` stays: it hides a directory nothing builds. A change open across the upgrade keeps in its worktree a graph the hook refreshed; close keeps that worktree and says so. Nothing replaces a transitive `impact` or `path`: navigation is the agent's own reading, and no door says how. The legs read one line at a time, so a reflowed or reworded copy of a dropped sentence passes. | open | proposed | 2026-10-02 | [changes/drop-graphers.md](changes/drop-graphers.md) |

```

Its legs, written after the row in this order (R13.1 has each dry-run):

```markdown
<!-- @anchor MV-153 brain:src/** !brain:src/lib/dropped.ts /graphify|codegraph/i absent -->
<!-- @anchor MV-153 brain:src/adapters/registry.ts /grapher/i absent -->
<!-- @anchor MV-153 brain:src/types.ts /grapher\??:|graphers:|grapherAuto|GrapherDecl/ absent -->
<!-- @anchor MV-153 brain:src/** !brain:src/lib/dropped.ts /ecosystem\.json|graph-refresh\.lock/ absent -->
<!-- @anchor MV-153 brain:src/doors/{brain,consumer,flow}.ts /graph/i absent -->
<!-- @anchor MV-153 brain:src/commands/{change,init}.ts /--no-grapher|--grapher|grapher_auto/ absent -->
<!-- @anchor MV-153 brain:{AGENTS.md,.gitignore,.multivac/config.yml,.multivac/flow.md,.claude/**,.agents/**} /graphify|codegraph|grapher|hook-guard/i absent -->
<!-- @anchor MV-153 brain:skills/** /graphify|codegraph|grapher|ecosystem\.json|--graph/i absent -->
<!-- @anchor MV-153 brain:{README.md,DESIGN.md,CONTRIBUTING.md,.specify/memory/constitution.md,.github/ISSUE_TEMPLATE/*.md,package.json} /graphify|codegraph|grapher|ecosystem\.json|knowledge-graph/i absent -->
<!-- @anchor MV-153 brain:site/content/** /graphify|codegraph|ecosystem\.json/i absent -->
<!-- @anchor MV-153 brain:site/content/** /grapher/i count=1 -->
<!-- @anchor MV-153 brain:src/lib/config.ts /\.\.\.DROPPED_KEYS/ unique -->
<!-- @anchor MV-153 brain:src/lib/config.ts /dropped\.push\(/ unique -->
<!-- @anchor MV-153 brain:src/lib/dropped.ts /ignored — multivac keeps no code graph; / unique -->
<!-- @anchor MV-153 brain:src/commands/{verify,doctor}.ts /droppedKeysLine\(/ each -->
<!-- @anchor MV-153 brain:src/doors/settings.ts /c\.startsWith\(OUR_REFRESH_HEAD\)/ unique -->
<!-- @anchor MV-153 brain:src/doors/settings.ts /^function removeRefreshes\(/ unique -->
<!-- @anchor MV-153 brain:src/commands/doors.ts /await rm\(join\(brainDir, ECOSYSTEM_JSON\)\)/ unique -->
<!-- @anchor MV-153 brain:src/commands/doctor.ts /leftoverLine\(/ unique -->
<!-- @anchor MV-153 brain:src/lib/dropped.ts /(^|[^[:alnum:]_.])(rm|unlink|rmdir|writeFile|appendFile)\(|execFile|spawn/ absent -->
<!-- @anchor MV-153 brain:src/lib/code-in-change.ts /for \(const g of leftoverGlobs\(\)\)/ unique -->
<!-- @anchor MV-153 brain:src/commands/init.ts /await untrackedFiles\(dir\)/ unique -->
<!-- @anchor MV-153 brain:.multivac/invariants.md /RETIRED 2026-10-02 by MV-153/ count=14 -->
<!-- @anchor MV-153 brain:.multivac/invariants.md /Amended 2026-10-02 by MV-153/ count=34 -->
<!-- @anchor MV-153 brain:test/lib/config.test.ts /a config declaring a dropped grapher key loads, and the key is recorded/ unique -->
<!-- @anchor MV-153 brain:test/verify/dropped.test.ts /verify names the dropped keys in one line, and a quiet run in one clause/ unique -->
<!-- @anchor MV-153 brain:test/doors/settings.test.ts /doors removes the refresh hooks an earlier multivac wrote, and nothing it did not write/ unique -->
<!-- @anchor MV-153 brain:test/doors/doors.test.ts /doors removes the ecosystem graph an earlier release rendered/ unique -->
<!-- @anchor MV-153 brain:test/doctor/doctor.test.ts /doctor names what an earlier release's graphers left, with its removal, and runs nothing/ unique -->
<!-- @anchor MV-153 brain:test/invariants/no-graph.test.ts /no adapter is a grapher and no door renders a graph line, whatever an old config declares/ unique -->
```

## R15. Ceilings

What this design does not do, stated in MV-153 or here:

- **The hook removal knows one mark.** A refresh hook a human edited past the lock preamble is
  neither removed by `doors` nor counted by `doctor`; a vendor's own hook (graphify's
  `hook-guard`, its `.codex/hooks.json` and `.gemini/settings.json` entries) is named by
  `doctor`'s leftover line, never removed.
- **`doctor` knows two vendors at two versions.** What graphify 0.9.29 and codegraph 1.6.0
  wrote, as #5 and #6 measured (MV-131, MV-148, MV-149). Another grapher declared under
  `graphers:`, a later version's layout, an install under `HOME` and an install in a read-only
  repo go unnamed. A `codegraph.json` with no `.codegraph/` beside it is the human's (MV-149)
  and is not named.
- **`.git/info/exclude` keeps `.codegraph/`.** An earlier `change apply` appended it to each
  repository's exclude file. It is never committed, hides a directory nothing builds, and lives
  in git's own directory: left alone, not named.
- **A change open across the upgrade.** Its worktree keeps whatever graph the old hook last
  refreshed there; where that is a tracked `graph.json` it rewrote, `git worktree remove` refuses
  at close, and close keeps the worktree and prints its `--force` command, as for any
  uncommitted work.
- **The door line is a heuristic.** It appears where a vendor's skill probe is found, not where
  an agent would actually be sent: a hand-installed graphify skill outside the measured paths
  gets no line.
- **Nothing replaces reach.** `impact` and `path` have no successor; no door says how to
  search. One-hop questions cost the same or less by grep (R8).
- **Line-local legs.** Every leg reads one line: a dropped sentence reflowed across two lines,
  or reworded, passes. The site's `grapher` count pins the alias line by count, not by place.
- **Old releases still write.** A brain on 0.15.0 or earlier keeps building, refreshing and
  committing its graph until it upgrades; and 0.15.0's `change land` on this change re-commits
  the graph (R9.1).

## R16. Out of scope, follow-ups, and what needs the human

Out of scope: any new navigation aid, a `--graph` successor, a search verb, a migration that
edits a config, removing vendor files, and editing history (CHANGELOG's past entries, `specs/**`,
the archive, docs/audit-2026-08-18.md).

**Needs the human**:

1. **The page's URL.** `graphers-and-sdd.md` → `sdd.md` with an `aliases:` line costs ten moved
   legs, eight of them on seven rows that change for nothing else, and keeps old links working.
   Keeping the path costs no law edit and keeps "graphers" in a published URL. This design takes
   the rename.
2. **The door's leftover line** goes beyond the literal decision ("verify and doctor print one
   line"): it exists because graphify's skill and hook-guard keep sending agents to a graph
   nothing refreshes, and only the door reaches the agent. Dropping it removes FR-020, one test
   and the `leftoverVendors` probe from `init` and `doors`.
3. **`repos check` says nothing about leftovers**; `doctor` alone names them (MV-132 as amended).
4. **The site names no vendor**, so the upgrade story — which keys, what `doors` takes back,
   what `doctor` names — is told only in the CHANGELOG. A short upgrade page would carry vendor
   names under leg 10.
5. **Claims.** As asked, the change claims MV-153 alone. SKILL.md rule 4 (MV-150) says "claim
   the row you amend": claiming the 34 amended rows would make `close` verify them too; CI's
   `verify --strict` verifies every leg on every commit either way, and MV-153's `count=34` leg
   pins that every note is there.
6. **Enactment.** MV-153 is filed `proposed`; only the human makes it `active` (MV-81). The six
   proposed rows it amends stay proposed.
7. **The lifecycle on 0.15.0** (R9.1): do not run the first `change land` with main's build;
   resolve modify/delete conflicts on `graphify-out/graph.json` and `.multivac/ecosystem.json` by
   deletion; restore main's `graph.json` before the pull; close after main is rebuilt; decide
   when to close `ci-moves-to-github-actions`.
8. **After the merge**: `rm -rf graphify-out` in main (≈ 25 MB the removed `.gitignore` lines no
   longer hide), `corepack pnpm run build`, then a new session, so the harness reads the
   settings without the refresh hook and the hook-guard.
9. **The constitution bump is PATCH** (R12): the list of adapter kinds shrinks, the rule does
   not. A reader who counts the kind list as part of the principle would call it MAJOR.
10. **A stray symlink from this design's scratch work**: `/home/user/multivac/node_modules/node_modules`,
    pointing into the deleted scratch clone. It is untracked and ignored, and dangles; removing it
    (`rm /home/user/multivac/node_modules/node_modules`) was refused to this session.

Follow-ups, not this change: a release (0.16.0) with the CHANGELOG entry moved under its
version; enacting the proposed rows MV-143 to MV-152 as amended.

### R16.1 The change file's declaration

Set in `.multivac/changes/drop-graphers.md`'s frontmatter before `change plan` (T001 checks it). Each
row's reason is its R14.2 lead or R14.3 note; MV-153 is claimed alone, as asked (R16 item 5).

```yaml
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-25
    - MV-31
    - MV-51
    - MV-55
    - MV-56
    - MV-57
    - MV-69
    - MV-74
    - MV-80
    - MV-87
    - MV-93
    - MV-98
    - MV-102
    - MV-114
    - MV-115
    - MV-121
    - MV-122
    - MV-123
    - MV-124
    - MV-125
    - MV-128
    - MV-129
    - MV-130
    - MV-132
    - MV-135
    - MV-136
    - MV-137
    - MV-141
    - MV-143
    - MV-144
    - MV-146
    - MV-147
    - MV-150
    - MV-152
  adds:
    - MV-153
  retires:
    - MV-50
    - MV-52
    - MV-58
    - MV-59
    - MV-61
    - MV-62
    - MV-90
    - MV-103
    - MV-131
    - MV-134
    - MV-139
    - MV-140
    - MV-148
    - MV-149
claims:
  - MV-153
```
