# Research: The graph the agent asks is one that answers

Measured 2026-09-28 in scratch ecosystems of a brain and two code repos cloned from local
bare remotes, with `HOME`, `GIT_CONFIG_GLOBAL`, `DO_NOT_TRACK=1`, `OPENSPEC_TELEMETRY=0` and
`CODEGRAPH_TELEMETRY=0` isolated, graphify 0.9.29, codegraph 1.6.0 and mvac 0.14.1 (`main`'s
dist), and on a clone of this brain. Three investigations (codeless-brain, where-asked,
graphignore), each checked by three adversarial lenses (guarantee kept, every adapter set, the
saving is real), merged into one design and read by a completeness critic whose 13 gaps the
spec folds in (checklists/requirements.md maps each). Who measured a figure is marked:
**(inv)** the investigator of that piece, **(ver-G)**, **(ver-X)**, **(ver-M)** the guarantee,
cross-adapter and measurement verifiers, **(synth)** the design's re-measurement, **(critic)**
the completeness critic, **(plan)** re-measured for these artifacts. Tokens are bytes/4.

The design cites `file:line` on `main` at **92c4c08**; `opsx-through-its-cli` was merged and
archived since (bfe9728), and this change was promoted (49591e7) and declared (e5d034f). Every
`file:line` below is re-anchored on the branch head when the change is applied (tasks.md T001).

The scratch setup behind every figure, for whoever re-runs one:

```bash
SCR=<scratch>; export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 \
  OPENSPEC_TELEMETRY=0 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1
mkdir -p $HOME && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
graphify --version   # 0.9.29
codegraph --version  # 1.6.0
```

Every vendor command in scratch is chained with its `cd` in ONE invocation: a `cd` that does
not persist once let `graphify uninstall --project` fire in a real repository.

## R0. The design's ids and the spec's

| Design | Spec | Design | Spec |
| --- | --- | --- | --- |
| FR-B1 `askAt` | FR-001 | FR-A1 the guard | FR-016 |
| FR-B2 `askedGraphers` | FR-002 | FR-A2, FR-A3 init | FR-017 |
| FR-B2 `whereLines` | FR-003, FR-004 | FR-A5 init/doctor lines | FR-018 |
| FR-B5 brain==code line | FR-005 | FR-A6 plan | FR-019 |
| FR-B6 ecosystem verbs | FR-006 | FR-A7 discovery / doctor / door | FR-020, FR-021, FR-022 |
| FR-B3 `graphPointer` | FR-007 | FR-A4 repos check | FR-023 |
| FR-B4 paths clause | FR-008 | §1.2 `nonCodeGlobs` | FR-024 |
| FR-B8 forced removal | FR-009 | FR-A8, FR-B7 flow.md | FR-025 |
| FR-B9 consumer door | FR-010 | FR-D1 derivation | FR-026 |
| FR-C1 follow hook | FR-011 | FR-D2 append rules | FR-027 |
| FR-C2 wiring | FR-012 | FR-D3 when written | FR-028 |
| FR-C3 mixed notice | FR-013, FR-014 | FR-D4 rebuild | FR-029 |
| FR-C4 doctor refresh path | FR-015 | FR-D5 doctor facts | FR-030 |
| §2 law / §2.4 instance / §7 docs | FR-032 / FR-033 / FR-034 | FR-D6 codegraph | FR-031 |

SC-A1→SC-012, A2→SC-013, A3→SC-014, A4→SC-019, A5→SC-016; SC-B1→SC-001, B2→SC-003,
B3→SC-004, B4→SC-005, B5→SC-006; SC-C1→SC-008, C2→SC-009, C3→SC-010; SC-D1→SC-020,
D2→SC-021, D3→SC-022, D4→SC-023, D5→SC-024. New: SC-002 (the door block's size and codegraph
never paired with `<checkout>`), SC-007 (consumer pin, paths clause), SC-011 (critic gap 10),
SC-015 (FR-A3), SC-017 (gemini first, the removal's residue), SC-018 (critic gap 3), SC-025.

## R1. A brain that holds no code resolved a grapher for itself

`adapterFor(cfg, root, 'grapher')` (src/adapters/detect.ts:95-105 at 92c4c08) answers a root's
own value first and the ecosystem's otherwise; #3 made the SDD brain-only and left graphers per
root, so a brain no repos entry declares as code resolves the top-level grapher for itself.

| What | Figure | Command (who) |
| --- | --- | --- |
| `init --grapher graphify`, doors `[agents, claude]`, code-less brain | 23 files, 170,619 B, and a 2-node graph of `CLAUDE.md` | `git ls-files \| grep -E 'graphify\|^\.claude/CLAUDE\.md$' \| xargs cat \| wc -c` (inv, ver-M) |
| after the first close | 63 nodes, 60 from graphify's own skill; 220,214 B; archive commit +1,261/−17 lines of graph | `git diff --numstat` of the archive commit (ver-M) |
| "where is the order total computed", bare, from the brain | answered from `.agents/skills/graphify/references/exports.md` ("Step 8 - Token reduction benchmark"); `graphify explain computeTotal` found nothing | (inv, ver-M) |
| the same, `--graph ../web/graphify-out/graph.json` | `computeTotal()`, `src=src/server.ts` | (inv) |
| `--grapher codegraph`, code-less brain | a 163,840-byte index of 0 nodes | `codegraph status` (inv, ver-M) |
| after a human's committed removal | `change new` reinstalled it (950 → 467 ms without), `change close` refused over it, `repos check` failed it, one brain edit made the post-edit hook build a new graph | (inv, ver-M) |
| `init --grapher graphify`, empty repo, graphify off PATH | exit 1, `init refused — graphify: …` | `PATH=$SCR/nobin:/usr/bin:/bin mvac init --provider claude --grapher graphify --quiet; echo $?` (inv, ver-X) |
| the guard alone, over the suite | base 828 pass 0 fail; guard 803 pass, 25 fail; with every known grapher in `nonCodeGlobs` too, the same 25 | `node --test "dist-test/**/*.test.js"` on two clones built at 92c4c08 (critic) |

**Decision**: in `adapterFor`, after #3's SDD guard, reading the same `own = entryOf(cfg,
root)`: `if (kind === 'grapher' && root === 'brain' && own === undefined) return undefined;`. A
brain holds code only where a repos entry is the brain (`isBrain`, config.ts:414-418). Every
surface resolving through it skips the brain with no further edit: `graphScopes`, and through it
`ensureGraphs`, `installHarness`, `graphGate`, `graphTrackedGate`, the close refresh loop,
`doctor`'s scope list, `equipRoots`/`toolsToRun`/`missingTools`; `sharedGraph`/`commitGraph`;
`reposCheck`; `renderEcosystem`'s `graphOf('brain')`; `doors`' brain projection; `init`'s
kept-config lookup; seed.ts:159 and init.ts:758 inherit it (critic: every reader covered). #3's
comment "Graphers still resolve per root" gains the exception. A code repo keyed to the brain is
`isBrain` and resolves as before: `core: .` → graphify, `core: { path: ., grapher: codegraph }`
→ codegraph (ver-X).

**Rationale**: one resolver, as MV-122 made it; every reader follows.

**Alternatives considered**: a filter in `graphScopes` only — it misses `init`'s lookup,
`repos check`, land's `sharedGraph`, step zero, `ecosystem.json` and the hook wiring, the
twelve-readers drift MV-122 ended. Resolving the brain's grapher for a change that names `brain`
(ver-G B2 option a) — it builds a graph no later change refreshes, recreating the leftover;
printing is honest and the fix is one config line (R3). A `doctor` heuristic "the brain holds
files that are not multivac's" (ver-G B1 fix b) — it fires on every README and CI file; #3
dropped a code gate in code-less brains for the same reason.

## R2. What "holds code" means at `init`

`init` decided the brain entry from tracked files only: an untracked `src/server.ts` gave
`# repos:` and no brain entry (ver-G). A README-only repo is taken as code and keeps a 4-node
graph of its documents (ver-M). A repo created on a hosting provider, with `README.md`,
`LICENSE` and `.gitignore` committed, got `repos: brain: .` from
`node dist/cli.js init --provider claude --grapher graphify` and 22 graphify files (critic,
`gh/init.log`).

**Decision**: `holdsFiles(dir)` decides once, before any write: in a git repository, whether
`lsFiles` plus `untrackedFiles` (git.ts:183) list a file outside `.multivac/`; outside one,
whether any entry but `.multivac` and `.git` exists. On a first run `toolsInitWouldRun` passes
the grapher only when it is true, and the same answer replaces init.ts:573's. Its only read of
untracked files is in that helper, so MV-128's `const wouldRun = await toolsInitWouldRun\(dir,
kept, f\)` keeps its spelling.

**Rationale**: the predicate is a declaration an operator can read and change (`brain: .`), and
init's lines say which way it went (R3).

**Alternatives considered**: narrowing the predicate so README, LICENSE, `.gitignore` and the
non-code set do not count (critic gap 6's second fix) — it brings back the file-kind heuristic
§1.5 of the design dropped, trades one misjudgement for another, and `init` still decides once;
the population it leaves out is stated instead (R15, spec Assumptions).

## R3. Every surface that skips the brain says so

| Surface | Line | Bytes (who) |
| --- | --- | --- |
| `init`, code-less brain declaring a grapher | contracts/cli-output.md *init* | 187 (synth) |
| `doctor`, where a grapher is asked from the brain or a leftover is found | *doctor — the fact line*, in place of `outOfScope`'s false `none @ brain: no grapher declared` (ver-G) | 211 (synth); today's brain status line is 70 |
| `change plan`, a change naming `brain`, a grapher declared | *change plan* | 197 (synth) |
| `change plan`'s label | `(the brain)` in place of `(brain==code)` (change.ts:945 at 92c4c08) | — |
| flow.md | the gate row names only the repos a change names; a declared-no-code-root row | R6 |

`doctor`'s early `return []` (doctor.ts:367) also lets the fact and leftover lines through.

**Decision**: these lines, with the leg phrases of R17.

**Alternatives considered**: a silent skip — the drift MV-122 exists to stop; a `doctor`
warning — the state is chosen, not wrong.

## R4. A kept install: found, reported, removed by the human

Binding decision of 2026-09-25: an install already there is kept; `doctor` only prints its
removal (MV-129: `doors` and `doctor` run no vendor).

| Fact | Measured (who) |
| --- | --- |
| the printed removal, doors `[agents, claude]` | 23 deletions and 2 modifications; `"PreToolUse": []` left in `.claude/settings.json`; `CLAUDE.md` stays a symlink (inv, ver-M, critic `kept/`) |
| `graphify uninstall --project` (every platform) | about 25 "nothing to do" lines, and gemini's hook-guard left (ver-X) |
| order, doors `[agents, codex, gemini]` | another platform's uninstall first removes the shared section and gemini's uninstall then stops early, leaving its `BeforeTool` hook; gemini first leaves `"BeforeTool":[]` (ver-X) |
| `--purge` | ignored under `--project` (inv; graphify install.py L2074-2105) |
| `*.graphify-bak` | the human's own pre-install settings copy, untracked and ignored (ver-G) — never removed |
| the uninstall and a human's hook | it drops the whole hook group it wrote, commands a human added to it included (ver-G) |
| `codegraph uninit` | without `--force` it prompts and removes nothing (inv) |
| the door `init` writes | `init.ts:630` renders `renderBrainDoor(cfg, countActiveInvariants(…))`; MV-102 says `init` writes the bytes `doors` writes (`test/init/reinit.test.ts:161`) — a door line fed only by `doors` would differ after a re-run of `init` (critic gap 3) |

**Decision**: `leftoverGraphs(cfg, dir)` (repo-state.ts, beside `leftoverSdds` and #4's
`leftoverBodies`) probes a code-less brain offline for every known grapher and every grapher
under `graphers:` — artifact, state directory, `graphignoreFile`, every harness platform probe,
declared door or not — reading no config key to choose. `doctor` prints one line per grapher
found (contracts/cli-output.md): graphify's own uninstall per platform found, the platform its
entry marks `uninstallFirst` (gemini, measured on 0.9.29) leading, then registry order, then
`git rm -q --ignore-unmatch -- <artifact> <ignore file> && rm -rf <state dir> <ignore file>`,
asking for a `git diff` review and naming the emptied hook lists (674 B, plan; the design's
608 B line did not name the residue it required); codegraph's `codegraph uninit --force`
(214 B, synth); a declared grapher's `git rm … && rm -f <artifact>`. `repos check` appends
`; leftover <name> install (tracked|untracked)` to the brain's line, as #3's SDD leftover does
(repos.ts:319-323). The door gets one line (210 B, synth), rendered by `renderBrainDoor(config,
activeInvariants, leftovers)`, whose leftovers BOTH `init` and `doors` pass from `await
leftoverGraphs(…)` (an `each` leg), so their bytes stay one.

**Rationale**: the decision, made honest: the human is told exactly what runs, in which order,
and what it leaves.

**Alternatives considered**: a name check for gemini in code — dispatch on a platform's name
(Principle V); the order is data on the platform entry. `--project` without `--platform`,
`--purge`, `rm *.graphify-bak` — above. The door citing the vendor's section in a kept-install
brain (ver-M M3) — that section tells the agent to run the bare verb in the brain, which answers
from the leftover; the 210 B disclaimer is honest, citing is not.

## R5. Pointing a verb at a checkout

| Grapher | Flag | Measured (who) |
| --- | --- | --- |
| graphify 0.9.29 | `--graph <checkout>/graphify-out/graph.json` | query 6,483 B, explain 1,868 B, path 114 B, byte-identical from any cwd, with an absolute or relative path (inv, ver-M); a `--graph` query, explain or path writes nothing in the caller's cwd — the stamp goes next to the graph (critic) |
| codegraph 1.6.0 | `-p <checkout>` | 1,282 B, byte-identical (inv, ver-M); with no index at the path it answers from the nearest index above, exit 0, or fails with exit 1 when there is none (codegraph.js:258-279); `codegraph query <branch-only symbol> -p <worktree>` under a brain==code codegraph brain: exit 0, `No results found` (ver-G, ver-X) |

`graphify update <path>` leaves a stray `graphify-out/manifest.json` in the caller's cwd (inv),
so no printed refresh takes a path.

**Decision**: `AdapterSpec.askAt?: string` beside `queries`, `{checkout}` the placeholder, with
a registry comment quoting the measurements: graphify `'--graph
{checkout}/graphify-out/graph.json'`, codegraph `'-p {checkout}'`; none for a grapher under
`graphers:`. A local index is never paired with a change's worktree (R8).

**Alternatives considered**: `codegraph -p <worktree>` in the door or `apply` — a silent exit-0
answer from the index above (all three where-asked verifiers).

## R6. The door says where each code repo's graph is asked

**Decision**: `askedGraphers(cfg): Map<string, string[]>` groups, in config order, the brain's
own grapher where it holds code and each declared non-brain repo's not marked `managed: false`;
when that is empty and the top level resolves a grapher, it returns that name with no repos
(ver-G M3). It is synchronous, so "writable" means not `managed: false`; a shallow or unsynced
clone is named though multivac builds nothing there (critic gap 11; a ceiling).
`whereLines(config, groups, holds)` renders it (contracts/cli-output.md *The brain door*): in a
code-less brain in place of `grapherLines`; in a brain==code brain for its siblings, under
"The other code repos keep their own graphs". It never cites the vendor's `## graphify` section.

The head line of the design sent every grapher "pointed at … the worktree `change apply`
printed" — for codegraph that is the silent wrong-answer path (critic gap 8, reading
`synth/lines/v2-codeless-codegraph.txt`). It now says: with each verb's flag pointed at a repo
below — in a change, the flag `change apply` printed under that repo's checkout. An unverified
grapher gets no group and the head appears only above a group; a grapher no writable code repo
resolves — no repo declared, or every one `managed: false` or `grapher: none` — gets one line
saying so and no verb (critic gap 11).

| Block | Design (synth) | Now (plan) |
| --- | --- | --- |
| code-less, one graphify group of two repos, post-edit door | 915 B | 954 B (967 B with the lifecycle freshness) |
| code-less, one codegraph group | 690 B | 728 B |
| head line | 283 B | 321 B |
| siblings head (brain==code) | — | 282 B |
| a grapher no writable code repo resolves | — | 160 B |

Measured as `wc -c` of the rendered lines, each ending in a newline, with the example repos of
the synth ecosystem (`web: ../web`, `api: ../api`, `svc: ../svc`): `plan-measure/final.py`.

The ecosystem-graph verbs (`--graph .multivac/ecosystem.json`, ecosystem.ts:132-137) are given
for the brain where `askedGraphers(cfg).has('graphify')`, so a zero-repo code-less brain keeps
its three (today 3; 0 with the guard alone, ver-G). A consumer's check stays
`adapterFor(cfg, key, 'grapher') === 'graphify'` (widening it gives codegraph repos graphify
verbs, ver-X).

**Spelling** (critic gap 4): MV-61's `unique` leg reads `ASK IT BEFORE READING THE TREE RAW` in
brain.ts, and today's constant is `'ASK IT BEFORE READING THE TREE RAW.'` with its period
(brain.ts:120) while the head needs "…RAW, from here,": the module constant is the stem, without
the period, and each use appends. MV-140's `unique` leg reads `: 'refreshed at \`change land\`
and \`change close\`';` (brain.ts:108-110): the phrase is spelled once, as the else branch of one
helper's ternary that `grapherLines` and `whereLines` both call. The no-query line stays one
literal through a shared helper (MV-61's `has NO query command`).

**Alternatives considered**: widening the consumer's ecosystem check — above. A second text for
codegraph's head — the per-group lines already carry what differs.

## R7. The brain==code door names its worktrees' form

The trunk graph lacked 27 branch-only source symbols of #3's worktree graph, and 73 of the 185
moved symbols land more than 60 lines from where the same path, read from the brain, puts them
(ver-M, a python diff of `trunk.json` against `wt.json`); `graphify explain "sddGoverning()"
--graph <#3 worktree graph>` resolved where the trunk graph said `No node matching` (inv, ver-M).

The design's line said the graph holds "code only". After the forced rebuild this brain's graph
still held `site` 213 nodes, about 104 nodes of root documents (`DESIGN.md` 47, `CHANGELOG.md`
19, `CODE_OF_CONDUCT.md` 13, `CONTRIBUTING.md` 9, `docs` 9, `README.md` 4, `CLAUDE.md` 3) and
`.github` 16 (critic gap 13): the lines are directories.

**Decision**: `grapherLines`' two lines stay byte for byte; `renderBrainDoor` appends one line
(never inside `grapherLines`, which the consumer door shares, MV-90): "It answers for this
checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above
relates them." then, for a shared artifact with `askAt`, the worktree form (316 B, plan; the
design's 330 B said "code only"), and for a local one, that a worktree has no index yet and the
grapher asked from here or there answers from this checkout's index (269 B, plan; ver-G, ver-X
measured the walk-up, exit 0).

**Alternatives considered**: "code only" — false (above). Adding root documents to the lines —
the lines are the non-code set's directories (R11); a file line per root document is a second
list that drifts.

## R8. `change apply` names the flag that reaches each checkout's graph

On a repo's first change the worktree has no graph (`ls <wt>/graphify-out`: none, ver-X), and the
base's, asked from the brain with `--graph <abs>/graphify-out/graph.json`, answered 6,491 B
(`adapterFor` hit, ver-X).

**Decision**: `graphPointer(cfg, key, ws, abs)` in change.ts, called under each `  <key>: <ws>`
line of `cmdApply`'s "work here" block, probes `initState(spec, ws)` and, when `ws !== abs`,
`initState(spec, abs)` — both offline (MV-124) — and prints at most one line (data-model.md
*Pointer states*; texts in contracts/cli-output.md). Byte counts with the example paths of the
design (20–53 characters), plan: installed 156 B; codegraph in place 87 B; graphify base 214 B;
codegraph base 234 B; graphify none 88 B; codegraph none 119 B. The design's base lines said
"paths relative to <abs>", which does not carry FR-008's clause; every line that names a flag now
says "paths in its answers are relative to".

**Alternatives considered**: `-p <worktree>` for codegraph — R5. A pointer for the brain's own
main checkout — the bare verbs already ask it.

## R9. `change close` removes a worktree holding only the grapher's outputs

A `--graph` query writes `graphify-out/cache/last_query_stamp` next to the graph it read, which
blocked `git worktree remove` with exit 128 (inv); land's refresh in a worktree whose
`.gitignore` has no `graphify-out/*` line leaves 7 untracked entries before any query (ver-X);
picomatch `graphify-out/**` matches both `graphify-out/` and `graphify-out/graph.json`, and the
empty `.multivac/cache/` the hook leaves in a worktree is invisible to git (critic).

**Decision**: `removeWorktrees` (change.ts:571-598) runs `['worktree', 'remove', '--force', wt]`
when every path `git status --porcelain` names lies under the key's grapher `local` globs,
matched with picomatch as the code gate matches; anything else keeps the worktree, as today; the
restore of the committed shared artifact stays. This is the reader of `local` MV-124 said did
not exist yet.

## R10. The brain's hook follows edits into the code, never into the brain

Today's hook (MV-52, MV-140; 492 B for graphify, 558 B for codegraph, critic):

```sh
L=.multivac/cache/graph-refresh.lock; f=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1); t=$(git -C "$(dirname "${f:-.}")" rev-parse --show-toplevel 2>/dev/null); [ -n "$t" ] && [ -e "$t/graphify-out/graph.json" ] && cd "$t"; PATH="$PATH:$PWD/node_modules/.bin"; …
```

falls through to the session's directory when the edited repo holds no graph — the brain.

**Decision**: `refreshHookCmd(refresh, env, artifact, follow?)` (settings.ts:91); with `follow`
the toplevel line is
`[ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/<art>" ] && cd "$t" || exit 0; `
(540 B for graphify, 606 B for codegraph; synth, critic). Measured (synth, `node` over the dist
`refreshHookCmd` plus the guard, run synchronously): a brain-file payload and a brain-worktree
payload (`.multivac/worktrees/x/brain/tools/ledger.ts`) left the kept graph's md5 at
`238412e5…` in both checkouts; a payload in `../web/src/util.ts` refreshed web (`graphify query
zeta` found it); one in `brain/.multivac/worktrees/x/web/src/util.ts` refreshed that worktree's
graph (`omega` found). Without `follow` the bytes are unchanged.

`doors` (doors.ts:311-320) projects a code-less brain with `brainRefreshGrapher(cfg)` — the one
grapher every writable code repo resolving one resolves; roots resolving none do not disagree
(ver-X s6) — and `follow: !brainHoldsCode(cfg)`. The follow hook's
`PATH="$PATH:$PWD/node_modules/.bin"` runs after `cd "$t"`, so it reaches only the edited repo's
own copy (ver-X). The design wired the hook when the binary was found in the brain or in any one
code repo; an edit in another repo then refreshed nothing, silently, while the door said
"refreshed after your edits there" (critic gap 10). It is wired only when `missingRequired(spec,
root.dir)` is empty for every writable code repo resolving that grapher — which a binary on PATH
satisfies for all — else no hook, and one notice.

Where the writable code repos resolve several graphers, no hook is wired and `doors` prints one
notice: one hook runs one command, and a per-grapher identity in `ownsRefresh` (`REFRESH_HEAD`,
settings.ts:57, :131) is pinned by MV-52 and MV-124 — `codegraph-worktrees-and-verbs`' work.
The door's freshness, flow.md's refresh row (flow.ts:127, which the design left out — critic gap
11), `doctor`'s refresh path (doctor.ts:446-454) and `doors` ask the one `brainRefreshGrapher`.

graphify's own hooks, in a kept install (ver-M): 190 B on a Grep or a search-like Bash call
(grep, rg, find, fd, ack, ag) and 402 B on an in-project Read or Glob of a source or doc file
(239 B stale variant), pointing at the graph in the session's directory — measured with the
`graphify.cli` constants and payloads piped to `graphify hook-guard`.

**Alternatives considered**: `[ "$t" != "$(pwd -P)" ]`, or a `--show-toplevel` compare (ver-G,
ver-M) — it misses a brain worktree, whose toplevel is not the session's directory. The
investigator's 502 B `… && cd "$t" || exit 0` — it refreshes a kept leftover (ver-G, ver-X,
ver-M). A repo-scope test in the hook (critic gap 10's first fix) — it needs every writable
repo's and worktree's path in a committed settings file, rewritten whenever the repos change;
the reach into a `managed: false` or `grapher: none` repo holding the artifact is the same a
brain==code hook has today, and is stated as a ceiling (R20).

## R11. The ignore lines are the root's non-code directories

| Harm | Figure (who) |
| --- | --- |
| this brain, no `.graphifyignore` | 62% of 5,937 nodes from `specs/` (ver-M) |
| a fresh brain, doors claude and codex, the fixed 5 lines | 228 of 305 nodes from `.agents/` and `.codex/` after one refresh (ver-M) |
| a consumer, the fixed lines | 427 of 501 nodes from the mount (ver-M) |
| a code repo with `specs/add.spec.ts` | graphed `add.ts` only (ver-M) |
| unanchored `specs/` | hid `src/specs/` code, 33 → 26 nodes (ver-X); an anchored `/specs/` keeps `src/specs/b.ts` (critic) |

The fixed list today (registry.ts:908): `.claude/`, `.multivac/`, `.specify/`, `specs/`,
`openspec/`.

**Decision**: `graphIgnoreLines(cfg, brain, scope, spec)` in code-in-change.ts: each top-level
`<dir>/**` of `nonCodeGlobs(cfg, scope)`, written `/<dir>/`, except every known grapher's own
output directory (its `local` top directory); in a code repo, the mount, wherever it is; every
declared repo whose resolved path lies inside the root, relative; `[]` for a grapher with no
`graphignoreFile`. SDD step-artifact directories come in only where `nonCodeGlobs` puts them — in
the brain (#3); `.specify/` and `openspec/` are vendor state everywhere. The static `graphignore`
field and list go; `graphignoreFile` stays.

The design removed only the resolving grapher's own `local` directory. Once `nonCodeGlobs` takes
every known grapher (R12a), codegraph's `.codegraph/**` enters a graphify root's set:
`nonCodeGlobs(loadConfig('/home/user/multivac'), 'brain')` with the loop patched gave 13 lines,
`/.codegraph/` among them (critic gap 2). Leaving out every known grapher's own output directory
(graphify skips `graphify-out/` natively, and indexes no `.db`) keeps the 12 lines the design
measured for this brain:

`/.agents/ /.claude/ /.codex/ /.copilot/ /.cursor/ /.gemini/ /.husky/ /.multivac/ /.opencode/ /.specify/ /openspec/ /specs/`

A code repo gets the same set without `/specs/`, plus `/.brain/`. `test/init/equip.test.ts`'s
`(+5)` becomes 11 with no SDD and 12 with speckit, for the registry at 92c4c08 (synth);
re-measured at T001, after #4 (whose `bodyGlobs` are not top-level `<dir>/**` globs).

The synth clone's `.graphifyignore` held 13 lines, `/.brain/` among them, though the brain has
no mount (critic gap 13): the 1,460-node result is the same either way, since nothing lives
there; the instance edit writes the 12.

`nonCodeGlobs` adds every door target's directory and every graphify platform's probe directory
whether declared or not (code-in-change.ts:52-83), but the SDD scaffold's integration
directories only for declared doors (:73-80). Over every door target with main's dist the sets
are equal except windsurf, which adds `/.devin/`, for no SDD, speckit and opsx alike (critic gap
9). **Decision**: stated, not widened: widening the non-code set to every integration directory
makes `.github/prompts/**` and `.codex/**` not code in every brain, which #4 (MV-147) rejected in
favour of the body entries; adding windsurf appends `/.devin/` at the next land, which rebuilds
only if the graph holds nodes there.

**Append rules** (FR-027). graphify 0.9.29 ignores `#` lines (synth: 1,460 nodes with the record
and without; critic). A directory line nullifies a human's re-include of a path under it
(`!.agents/skills/team/`, ver-G) — so such a line skips the derived one. A derived `/x/` is
skipped when the file has `x/`, `/x/`, `x` or `/x`, negated or not; when a record line lists it;
or when any line names a path under `x` (`.agents/*`). The record is
`# multivac: kept out of the graph — <lines>`, from the constant `IGNORE_RECORD`; `(+N)` counts
lines, not the record.

**Alternatives considered**: hand-adding `.agents/` to the fixed list (inv item 6) — one
platform; the derivation covers every harness directory. Keeping `specs/` or `specs/*/spec.md`
in the code graph (inv V3/V5) — +3.3 MB or +821 KB committed, 27–30 non-code nodes on code
questions; the why lives in the law, the changes and the specs, which the ecosystem graph
relates. Unanchored lines — above.

## R12. When the lines are written, and what lands them

(a) **`nonCodeGlobs`.** With the guard alone, graphify's paths left the set of a code-less
brain whose top level declares graphify: 32 → 25 globs (ver-X), so removing a kept install would
read as code. The grapher loop (code-in-change.ts:100-108) takes every name in `grapherNames` and
every key of `cfg.graphers`, whichever resolves, mirroring #3's "every known SDD's vendor state".

(b) **When.**

| Tried | Measured (who) |
| --- | --- |
| append at every equip, in `repos sync`, in `doors`/`doctor` | main checkouts end up with modified tracked files the landing merge must overwrite: `git merge` exit 2 (ver-G, ver-X); `repos sync` would dirty graphs of repos no change names (MV-134's harm); `doctor` would freeze a graph (exit 1 on every refresh) |
| an ignore file left uncommitted | never reached the worktree where `change land` refreshes: 1,460 nodes became 5,937 there, and the merged main froze (ver-M) |
| creating the ignore file at land beside a byte-identical untracked copy in the repo's own checkout | `git pull`/merge refused, rc=1/2 (ver-X, ver-G) |
| land's write of `.gitignore` | `writeIgnores` writes both files (refresh.ts:228-231); in a checkout whose committed `.gitignore` lacks `graphify-out/*` / `!graphify-out/graph.json`, land left ` M .gitignore`, outside `graphify-out/**`, so close kept the worktree and the lines never landed (critic gap 5; #6's critic found the same for codegraph) |

**Decision** (FR-028): before a root's first build in `ensureGraphs`, as today (both files;
MV-128's timing); at `change land`, in `commitGraph`, before `refreshGraph`, in the checkout
holding the change's branch — `writeIgnores(…, lines, { gitignore: false })`, the grapher's
ignore file alone — only when that file is committed at the checkout's HEAD, or absent both
there and in the repo's own checkout; otherwise land prints the named line and writes nothing.
When land appended, it stages `[art, file]` (plus `ECOSYSTEM_PATH` in a brain checkout); when
the rebuilt graph still holds a node under a recorded line, it restores the file (`git checkout
-- <file>` when tracked, a delete when multivac created it) and warns. The HEAD read lives in
change.ts (MV-103's `absent` leg keeps `inHead` out of refresh.ts). equip over a built root,
`repos sync`, `doors`, `doctor` and `verify` never write (an `absent` leg).

**Alternatives considered**: event-triggered rebuild ("when it appended") — R13. A close-time
retrofit in the brain's archive commit — land covers every change naming the brain, and the
state-based rebuild heals a brain==code graph at close; one retrofit site. Committing
`.gitignore` with the ignore file at land (critic gap 5's second fix) — it edits a file humans
curate, for lines whose only effect in a change's worktree the forced removal (R9) already
covers.

## R13. The rebuild is driven by what the graph holds

On a clone of main, with the record and the lines written into `.graphifyignore` (synth,
`plain.log`, `force.log`):

```
$ graphify update .            # exit 1
[graphify watch] fail-closed: kept 4477 node(s) from 644 file(s) that left the scan corpus but still exist on disk (ignore rules or filters changed?). …
[graphify] WARNING: new graph has 1460 nodes but existing graph.json has 5937. Refusing to overwrite — you may be missing chunk files from a previous session. Pass --force to override.
$ graphify update . --force    # exit 0, 6.4 s
[graphify watch] Rebuilt: 1460 nodes, 3866 edges, 96 communities
```

`graph.json` 5,854,764 → 1,815,100 B; `GRAPH_REPORT.md` 150,289 → 20,947 B; a later plain
update exits 0; the top sources left are `src` 568, `test` 438, `site` 213, `skills` 52 (synth,
ver-M). A rebuild triggered by the event of an append froze the graph when it failed once: the
lines were there, and no later run rebuilt (ver-G, ver-M). The dated backup is graphify's own
`backup_if_protected`, only for curated or semantic graphs (ver-G). A forced rebuild cannot gut a
code-less brain's kept graph: no grapher resolves there, so neither `commitGraph` nor
`refreshGraph` runs (ver-G M2).

**Decision** (FR-029): `holdsIgnored(spec, dir)` (refresh.ts, files only — MV-50/MV-52's
`'git'|gitRun` `absent` leg holds) is true when the root's artifact parses and holds a node whose
`source_file` starts with a directory a record line lists and no negation re-includes; then
`refreshGraph` runs `spec.rebuild` (`'graphify update . --force'`) instead of `spec.refresh`,
with the same env, lock and failure quoting (MV-50, MV-123, MV-124). The post-edit hook never
forces (an `absent` leg on `--force` in settings.ts).

**Alternatives considered**: `--force` on every refresh — bypasses the vendor's guard where
nothing explains the shrink. `doctor` running the rebuild — Principle IV.

## R14. `doctor`'s ignore facts, and codegraph

**Decision** (FR-030): per installed, writable root whose grapher is verified and has a shared
artifact and a `graphignoreFile`, `doctor` appends up to three facts to the root's grapher line,
reading only (contracts/cli-output.md). The "rebuilds" of the first fact is conditional: the
design's text claimed a rebuild the missing `/.codegraph/` line would never cause (critic gap 2).

codegraph 1.6.0 indexes no Markdown, so 0 of its nodes come from `.specify`, `specs`, `.claude`,
`.agents` or `.multivac`; it honours `.gitignore` through git; `codegraph.json`'s `exclude` is
applied by `sync` (inv). A consumer of a brain==code brain indexes the mount — 93.3% of its nodes
(inv) — and a `.gitignore` mount line makes a later `git submodule add` exit 128 (ver-X): the
fix is a JSON-key merge into `codegraph.json`, a new writer, `codegraph-worktrees-and-verbs`'.
A code-less brain's mount adds 0 codegraph nodes (inv). **Decision** (FR-031): no codegraph
lines here; the registry comment "No graphignore: no ignore file of codegraph's was verified"
(registry.ts:981) is replaced by the mechanism above; `remove: 'codegraph uninit --force'`.

## R15. What it saves, by population, and what it costs

Units are kept apart: **tokens** an agent reads, **repository** bytes, **time** one-time and
recurring, **correctness**. There is no byte-saving claim against grep for asking the graph.

| Population | Per session | Other |
| --- | --- | --- |
| (a) new code-less graphify brain, doors `[agents, claude]` | −793 B ≈ −198 tokens: graphify's section 772 B, `.claude/CLAUDE.md` 226 B, the skill listing ~385 B and today's door lines 364 B go; the where-block, 954 B, comes (inv, ver-M; plan) | per call −190 B on a Grep or search-like Bash, −402 B on an in-project Read/Glob (ver-M); repository 23 files, 170,619 B at init, 220,214 B after the first close, and +1,261 lines per archive commit, all to 0; time −0.33–0.40 s per close and ~0.35 s of background CPU per brain edit (`graphify update .` 327/402/349 ms), −~0.5 s once at init (ver-M); correctness: the brain graph answered from the skill, the pointed graph answers `computeTotal()` |
| (a') the same on the default doors `[agents]` | **+317 B** ≈ +79 tokens: today's inline verbs render 650 B (graphify's `agents` platform writes no section; critic), the where-block 967 B with no post-edit door (plan) | no vendor section or hook to remove; the repository and time savings of (a) apply, less the claude platform's files (not measured apart) |
| (a'') a brain created on a hosting provider (README, LICENSE, `.gitignore` committed) | none: `init` declares it code (critic, 22 graphify files) | today's behaviour; the operator removes `brain: .` to reach (a) |
| (b) an existing code-less graphify brain keeping its install | **+800 B** ≈ +200 tokens (954 + 210 leftover line − 364) until removal; the vendor's section and hooks stay | recurring: close's brain refresh, the archive churn, the reinstall after a removal (950 → 467 ms, ver-M) and the post-edit rebuild of a removed graph all go; after the printed removal it is (a) |
| (c) a code-less codegraph brain | **+279 B** (728 − 449) | −163,840 B of 0-node index per brain checkout; −565–635 ms `codegraph init`, −283–345 ms `codegraph sync` per brain edit (inv, ver-M) |
| (d) a code-less brain whose repos resolve a grapher, none at top level | up ≈954 B, and possibly a hook (ver-X) | pinned by a test |
| (e) brain==code, this brain | +316 B (plan) | GRAPH_REPORT.md 150,289 → 20,947 B per broad read (≈37.6k → 5.2k tokens); query output ~0 (budget-capped, 38,872 → 38,807 B over 6 questions); relevance on 6 code questions: non-code nodes shown 14/456 → 0/459, non-code seeds 6/38 → 0/35, targets 5/6 → 6/6; query latency 779 → 375 ms (avg of 3); graph.json 5,854,764 → 1,815,100 B, 5,937 → 1,460 nodes; 45–86% of each landed graph diff's records came from the ignored paths (ver-M, 5 commits); the fixed 5 lines alone give 1,520 nodes — the derivation adds −60 nodes (`.agents/skills/graphify`) and −50,117 B, the bulk is the retrofit (ver-M) |
| (f) consumers (main checkout, `/.brain/`) | — | fresh brain mount: graph.json 406,897 → 61,075 B, GRAPH_REPORT 15,346 → 3,224 B, 501 → 74 nodes, targets 4/5 → 5/5 (ver-M); mature brain (upper bound): 4,180,621 → 106,092 B, 133,481 → 3,675 B, 4,463 → 96 nodes, 3/5 → 4/5 (inv); a consumer's change worktree has an empty mount (ver-X, ver-M) |
| (g) fresh speckit brain==code, doors claude and codex | — | 305 → 77 nodes, 242,105 → 62,528 B, non-code shown 57/254 → 0/265, targets 4/5 → 5/5 (ver-M) |
| (h) code repos with a `specs/` test directory | — | no longer hidden from their own graph (ver-M) |

**Navigation from the brain** (three questions over multivac's `src/`, 50 files, 653,487 B):

| Trace | Q1 | Q2 | Q3 | Total |
| --- | --- | --- | --- | --- |
| today, typical: bare brain query (nothing), `grep -rn`, a whole-file Read (inv, reproduced ver-M) | 48,093 | 89,933 | 22,123 | 160,149 B |
| the pointer: `--graph` query (+ explain) + Read from the line the graph printed (ver-M) | 9,630–11,498 | 11,224–12,814 | 11,133–15,490 | 31,987–39,802 B |
| narrowed grep + 60-line Read (ver-M) | 4,406 | 3,351 | 7,716 | 15,473 B |
| Claude Code Grep default (ver-M) | 4,840 | 5,532 | 4,688 | 15,060 B |

Against the typical trace the pointer saves 120–128 KB (75–80%); against a disciplined grep it
costs 2.1–2.6× and loses on every question — a stated ceiling. The answer node was a Start node
in 0 of 3 questions and present in the output for 2 of 3; Q3's question-worded query missed;
with `--budget`, Q2's answer appears only at ≥1200 (4,049 B). The case is correctness.

**Added costs**: `apply` pointer 87–234 B per workspace, once per change (plan); the `--graph`
argument 57–110 B per query (inv); `doctor`'s fact line 211 B, leftover line 674 B (graphify) or
214 B (codegraph) per run until removal; the post-edit hook +48 B, bash only, never read by an
agent; one forced rebuild per append covering indexed files (6.4 s here); the law: sixteen notes
and a row in a 388,288 B `invariants.md` (ver-M).

## R16. Composition with #3 and #4, and rows left alone

- **#3 (MV-146).** The guard goes into #3's `adapterFor`, after its SDD guard, reading its
  `own`. `askedGraphers` and `brainRefreshGrapher` read the top level only through `ownDecl`,
  never a dotted or bracket read of `sdd`/`grapher`, so MV-122's dotted leg and #3's bracket leg
  stay at 0; `leftoverGraphs` reads `cfg.graphers`, which the dotted leg does not match
  (`grapher` then `s` is no word boundary). `nonCodeGlobs` (root-aware since #3,
  code-in-change.ts:43) changes in its grapher loop only.
- **#4 (MV-147).** Merged before this change is applied. It added `bodyGlobs` to `nonCodeGlobs`
  (entries under integration directories, no top-level `<dir>/**`), `leftoverBodies` beside
  `leftoverSdds`, the flow.md ungateable verb, and notes: MV-124's (the entry's `env` reaches no
  printed command) and MV-121's (the grapher queries' disclosure is `codegraph-worktrees-and-verbs`').
  This change prints the same verbs with a flag appended — no new verb, so the disclosure owner
  is unchanged — and touches different sentences of MV-124.
- **#6 (`codegraph-worktrees-and-verbs`, MV-149, designed).** It extends, under the same names,
  `askAt`, `whereLines`, `graphPointer`, the follow hook (`refreshHookCmd`'s `follow`),
  `graphIgnoreLines(cfg, brain, scope, spec)`, `writeIgnores(…, lines)`, land's ignore step,
  `leftoverGraphs` and the forced worktree removal, renames `brainRefreshGrapher` to
  `brainRefreshGraphers` (moving MV-148's leg), and withdraws, by its own note on MV-148, the
  sentences "and `-p <repo>` for a local index, which a change's worktree does not have", "and no
  codegraph index at all, so codegraph's hook follows into repo checkouts only", "Where the code
  repos resolve several graphers the brain wires no hook." and the codegraph half of "A grapher
  declared under `graphers:` and codegraph get no ignore lines, and codegraph in a consumer of a
  brain==code brain indexes the mount" — so MV-148 spells each of those as a sentence of its own.
- **Left alone.** MV-61: verbs printed as each tool spells them, one line each with its answer,
  the flag appended as the agent types it; a grapher under `graphers:` still gets no query line.
  MV-123: the lookup is unchanged, asked in another root. MV-125: every new surface skips a
  read-only root (`askedGraphers` by `managed: false`, `doctor`'s ignore facts by `readOnly`), and
  no new `s.readOnly) continue;` spelling enters the counted files; the follow hook's reach is R20.
  MV-102: `init` and `doors` still write one door. MV-144: its ceiling (land's fast-forward merge
  aborts over an untracked `graph.json`) stands, and the ignore file follows the same rule.
  MV-146, MV-147: nothing in them becomes false.

## R17. Legs

Dialect: POSIX ERE through `git grep`, per `skills/multivac/references/anchors.md`: no `\s`,
`\d`, `\w` or `\b`; one include glob per leg, braces for alternates. Today's counts, re-run on
e5d034f (plan): `registry.ts /graphignore: \[/` 1 (0 after); `{doors,doctor,verify,repos}.ts
/writeIgnores/` 0; `settings.ts /--force/` 0; `brain.ts /ASK IT BEFORE READING THE TREE RAW/` 1
(stays 1); `brain.ts /: 'refreshed at \`change land\` and \`change close\`';/` 1 (stays 1);
`change.ts /'worktree', 'remove'/` 1; `refresh.ts /await writeIgnores\(s\.name, spec, s\.dir,
s\.scope\)/` 1; `flow.ts /refuses while the brain or a repo the change names has no/` 1;
`doors.ts /notices, spec\?\.artifacts\[0\]\)/` 1; `init.ts /renderBrainDoor\(cfg,
countActiveInvariants/` 1; `doors.ts /missingRequired\(spec, dir\)/` 1.

**New legs, MV-148** (40):

```text
<!-- @anchor MV-148 brain:src/adapters/detect.ts /if \(kind === 'grapher' && root === 'brain' && own === undefined\) return undefined;/ unique -->
<!-- @anchor MV-148 brain:src/adapters/detect.ts /export function askedGraphers\(/ unique -->
<!-- @anchor MV-148 brain:src/adapters/detect.ts /export function brainRefreshGrapher\(/ unique -->
<!-- @anchor MV-148 brain:src/doors/settings.ts /\[ ! -e "\$t\/\.multivac\/config\.yml" \] && / unique -->
<!-- @anchor MV-148 brain:src/doors/settings.ts /--force/ absent -->
<!-- @anchor MV-148 brain:src/doors/brain.ts /export function whereLines\(/ unique -->
<!-- @anchor MV-148 brain:src/doors/brain.ts /holds no code, so it keeps no code graph/ unique -->
<!-- @anchor MV-148 brain:src/{doors/brain,commands/change}.ts /paths in its answers are relative to/ each -->
<!-- @anchor MV-148 brain:src/commands/change.ts /^async function graphPointer\(/ unique -->
<!-- @anchor MV-148 brain:src/commands/change.ts /no repos entry is the brain — no code graph is built, gated or landed here/ unique -->
<!-- @anchor MV-148 brain:src/commands/change.ts /await writeIgnores\(/ unique -->
<!-- @anchor MV-148 brain:src/commands/change.ts /gitignore: false/ unique -->
<!-- @anchor MV-148 brain:src/commands/change.ts /\['worktree', 'remove', '--force', wt\]/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /askAt: '--graph \{checkout\}\/graphify-out\/graph\.json'/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /askAt: '-p \{checkout\}'/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /rebuild: 'graphify update \. --force'/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /uninstall: 'graphify uninstall --project --platform \{key\}'/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /uninstallFirst: true/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /remove: 'codegraph uninit --force'/ unique -->
<!-- @anchor MV-148 brain:src/adapters/registry.ts /graphignore: \[/ absent -->
<!-- @anchor MV-148 brain:src/lib/code-in-change.ts /export function graphIgnoreLines\(/ unique -->
<!-- @anchor MV-148 brain:src/adapters/refresh.ts /export async function holdsIgnored\(/ unique -->
<!-- @anchor MV-148 brain:src/adapters/refresh.ts /IGNORE_RECORD = '# multivac:/ unique -->
<!-- @anchor MV-148 brain:src/commands/{doors,doctor,verify,repos}.ts /writeIgnores/ absent -->
<!-- @anchor MV-148 brain:src/lib/repo-state.ts /export async function leftoverGraphs\(/ unique -->
<!-- @anchor MV-148 brain:src/commands/{init,doors}.ts /await leftoverGraphs\(/ each -->
<!-- @anchor MV-148 brain:src/commands/doctor.ts /holds no code \(no repos entry is the brain\)/ unique -->
<!-- @anchor MV-148 brain:src/commands/init.ts /await untrackedFiles\(dir\)/ unique -->
<!-- @anchor MV-148 brain:src/doors/flow.ts /: 'a repo the change names'/ unique -->
<!-- @anchor MV-148 brain:src/doors/flow.ts /the brain holds no code, so none here/ unique -->
<!-- @anchor MV-148 brain:test/change/codeless-brain.test.ts /a code-less brain is never built, gated, refreshed or landed/ unique -->
<!-- @anchor MV-148 brain:test/doctor/doctor.test.ts /a kept install in a code-less brain is named with its removal, gemini first/ unique -->
<!-- @anchor MV-148 brain:test/doors/graph-navigation.test.ts /a code-less brain's hook never refreshes a checkout of the brain/ unique -->
<!-- @anchor MV-148 brain:test/doors/where.test.ts /a code-less brain's door names each code repo's graph and the flag that reaches it/ unique -->
<!-- @anchor MV-148 brain:test/change/graph-where.test.ts /apply names the flag that reaches each checkout's graph/ unique -->
<!-- @anchor MV-148 brain:test/change/grapher-refresh.test.ts /land appends the derived ignore lines, rebuilds and commits them with the graph/ unique -->
<!-- @anchor MV-148 brain:test/init/equip.test.ts /untracked source makes the brain code/ unique -->
<!-- @anchor MV-148 brain:site/content/docs/reference/graphers-and-sdd.md /^### A brain that holds no code$/ unique -->
<!-- @anchor MV-148 brain:site/content/docs/reference/graphers-and-sdd.md /^### Where to ask the graph$/ unique -->
<!-- @anchor MV-148 brain:.multivac/invariants.md /Amended [0-9-]+ by MV-148/ count=16 -->
```

The design's 36, plus four the critic's fixes need: `gitignore: false` (gap 5), `uninstallFirst:
true` (the gemini order as data, Principle V), the leftover probe in `init` and `doors` (gap 3),
and the door test (the where-block had no test leg).

**Legs that move** (each by the task whose code makes the old one false: T061, T048, T024):

| Row | Old | New | Why |
| --- | --- | --- | --- |
| MV-128 | `src/adapters/refresh.ts /await writeIgnores\(s\.name, spec, s\.dir, s\.scope\)/ unique` | `src/adapters/refresh.ts /await writeIgnores\(s\.name, spec, s\.dir, s\.scope, / unique` | the call passes the derived lines; the harness call spells `s.name!` and does not match |
| MV-140 | `src/doors/flow.ts /refuses while the brain or a repo the change names has no/ unique` | `src/doors/flow.ts /'the brain or a repo the change names'/ unique` | the row names the brain only where it holds code; MV-148's leg covers the other branch |
| MV-140 | `src/commands/doors.ts /notices, spec\?\.artifacts\[0\]\)/ unique` | `src/commands/doors.ts /notices, spec\?\.artifacts\[0\], follow\)/ unique` | the call gains the follow flag |

**Unchanged and still green**, checked against the planned spellings: MV-52 `missingRequired\(spec,
dir\)` unique and `refresh path: `; MV-61 `ASK IT BEFORE READING THE TREE RAW` and `has NO query
command` unique; MV-90 `grapherLines\(config, adapterFor\(config, repoKey, 'grapher'\)\)` (the
consumer door is unchanged); MV-102 `renderBrainDoor\(cfg, countActiveInvariants` unique (the call
gains a third argument after it); MV-124 `\.state === 'installed'\) continue; // already built
here` unique and `refresh, spec\?\.env \?\? \{\}, notices, ` unique; MV-128 `graphignoreFile:
'\.graphifyignore'` unique; MV-131 `run: 'graphify install --project --platform \{key\}'` unique
(`uninstall: 'graphify uninstall` does not contain `run: 'graphify install`); MV-134 `const paths =
\[relative\(brain, dest\), changeRel\(slug\), LAW_PATH, \.\.\.graphs`; MV-139 `LAW_PATH,
\.\.\.graphs, ECOSYSTEM_PATH, \.\.\.sddPaths\.paths\]`; MV-140 `: 'refreshed at \`change land\` and
\`change close\`';` unique (one ternary), `rev-parse --show-toplevel 2>\/dev\/null\); ` \+` unique
(the follow guard sits on the next line) and `sectionDoors\(cfg, spec\)` unique in doctor.ts;
MV-50/MV-52 `refresh.ts /'git'|gitRun/ absent` (`holdsIgnored` reads files only); MV-103
`refresh.ts /inHead|graphTrackedGate/ absent`; MV-122 and #3's bracket leg: 0; MV-125's `.managed`
leg excludes detect.ts, where `askedGraphers` reads it, and its `count=6` gains no spelling; MV-12
`brain-first-class.test.ts /brain==code/`; MV-142's and MV-147's test titles in equip.test.ts
kept.

**Spelling rules the legs rely on**:

- The hook guard is emitted literally as `[ ! -e "$t/.multivac/config.yml" ] && ` inside a template string, with no `${…}` in it.
- `ASK` is one module constant in brain.ts, the stem `'ASK IT BEFORE READING THE TREE RAW'` without a period; `grapherLines` appends `.` (its bytes unchanged), `whereLines` appends `, from here, …` (critic gap 4).
- The lifecycle freshness is spelled once, as the else branch of one helper's ternary, `: 'refreshed at \`change land\` and \`change close\`';`, called by `grapherLines` and `whereLines` (critic gap 4).
- The no-query line is one helper, so `has NO query command` stays one literal.
- flow.ts spells `const who = holds ? 'the brain or a repo the change names' : 'a repo the change names';` on one line.
- init.ts reads untracked files once, in `holdsFiles(dir)`; MV-128's `const wouldRun = await toolsInitWouldRun\(dir, kept, f\)` keeps its spelling.
- The code-less hook lookup in doors.ts spells `missingRequired(spec, root.dir)`, so MV-52's `missingRequired\(spec, dir\)` stays `unique`.
- Land's ignore call spells `gitignore: false` once in change.ts.
- New text in code, strings, comments and docs matches no existing `absent` leg (critic gap 12). Phrases to avoid, with the row whose leg reads them: MV-124 ``(at|has no) `\.codegraph` `` and `` `.codegraph` | `` (write `` `.codegraph/` `` or `.codegraph/codegraph.db`, never a bare `` `.codegraph` `` code span, and no codegraph row in a docs table starting that way); MV-123 `is not on PATH` (write "is not reachable from"); MV-125 `every declared, present repo`; MV-146 `in every repo where … is installed`; MV-121 ``leaves `.claude/settings.json` alone``. T071 re-runs every `absent` leg of the law over the tree.

## R18. The law as it will be written

**MV-148**, filed into its reserved row (`| MV-148 | RESERVED by change graph-answers-where-asked
— state the rule here before close. | open | proposed | 2026-09-29 | … |`), one physical line,
wrapped here for reading:

```text
| MV-148 | **The graph an agent is told to ask is one that answers: a brain that holds no code keeps no code graph and says where the code repos' graphs are asked from it, a change's checkout is named with the flag that reaches its graph, the brain's refresh follows edits into the code repos and never into a checkout of the brain, and the grapher's ignore lines are the root's non-code directories, landed with the graph.** Measured 2026-09-28 with graphify 0.9.29 and codegraph 1.6.0, in scratch ecosystems of a brain and two code repos with HOME and GIT_CONFIG_GLOBAL isolated, and on this brain. A brain no repos entry declares as code resolved the ecosystem's grapher for itself: `init` installed 23 graphify files, 170,619 bytes, and a 2-node graph of `CLAUDE.md`; after the first close that graph held 63 nodes, 60 of them graphify's own skill, the archive commit carried 1,261 lines of it, and asked where the order total is computed it answered from the skill, while the code repo's graph, asked from the brain with `--graph ../web/graphify-out/graph.json`, answered `computeTotal()`. codegraph built a 163,840-byte index of 0 nodes there. After a human removed that install, the next `change new` reinstalled it, `change close` refused over it, `repos check` failed it, and one edit of a brain file made multivac's post-edit hook build a new graph there. `init --grapher graphify` in an empty repo exited 1 without graphify on PATH, and a repo whose source was not committed yet was taken as holding none. From the brain the door named the brain's own graph and `change apply` a path and no graph: this brain's trunk graph lacked 27 source symbols of a change's worktree graph, whose answers name paths relative to that worktree, and 73 of the 185 symbols that moved sit more than 60 lines from where the same path, read from the brain, puts them. `graphify query --graph <path>` and `codegraph query -p <path>` answered byte for byte as from inside that checkout; codegraph given a path with no index answered from the nearest index above it, with exit 0. graphify's own hooks added 190 bytes to a Grep and 402 to an in-project Read, pointing at the graph in the session's directory. This brain had no `.graphifyignore`, and 62% of its 5,937 nodes came from `specs/`; a fresh brain's ignore lines missed `.agents/` and `.codex/`, 228 of 305 nodes after one refresh, a consumer's missed its brain mount, 427 of 501 nodes, and a code repo's `specs/` line hid its own `specs/*.spec.ts`. An ignore line appended over an existing graph made every plain `graphify update .` exit 1, refusing to shrink, until `--force`, and an ignore file left uncommitted never reached the worktree where `change land` refreshes: 1,460 nodes became 5,937 there. **The rule.** *No code, no graph.* A brain holds code when a repos entry is the brain. For a brain that does not, `adapterFor` resolves no grapher at the brain root, so no build, refresh, harness install, gate, land commit, `repos check` or `doctor` status reaches it, and `init` asks for the grapher's binary and equips the brain only when the repo holds files, tracked or untracked and not ignored. `init`, `doctor`, and `change plan` for a change naming `brain`, say the brain holds no code and how to declare it. An install found there is kept: `doctor` prints its removal — the grapher's own uninstall for each platform found, the platform its entry marks first leading (gemini on 0.9.29), then its files, naming the emptied hook lists the uninstall leaves — `repos check` states it, nothing fails over it, the brain door, which `init` and `doors` write alike, says it answers no code question, and every known grapher's paths are not code in any repo. *Where asked.* `askedGraphers` answers which graphers an agent in the brain asks: the brain's where it holds code, each code repo's not marked `managed: false`, else the ecosystem's declaration. A code-less brain's door lists, per such grapher with an entry, the repos' paths and each verb with the entry's `askAt` — `--graph <checkout>/graphify-out/graph.json`, the checkout being the repo or, in a change, the one whose flag `change apply` printed, and `-p <repo>` for a local index, which a change's worktree does not have — says so of a grapher no writable code repo resolves, and never cites the vendor's section; a brain holding code keeps its lines, adds its worktrees' form, and says the law, the changes and their specs are kept out of its graph. `change apply` prints under each workspace the flag that reaches its graph, else the repo checkout's, for the base without the branch's edits, else that there is none. Every pointer says its answers' paths are relative to the checkout asked. `change close` removes a worktree whose only changes are the grapher's outputs. *Followed.* A code-less brain's post-edit hook runs the one grapher its writable code repos resolve, wired only where its binary is on PATH or in each of those repos, and only in the edited file's repo when that repo holds the artifact and is not a checkout of the brain; brain==code and consumer hooks keep their bytes. The door, flow.md, `doctor` and `doors` say a graph is refreshed after edits only where that hook runs its grapher. *Kept out.* A root's ignore lines are the top-level directories of its non-code set but every known grapher's own output directory, its nested declared repos and, in a code repo, the mount, anchored `/<dir>/` and appended under a `# multivac:` record, never over a line already there in any spelling, negated, recorded, or naming a path under it. They are written before a root's first build and, at `change land`, into the grapher's ignore file alone, never `.gitignore`, in the checkout holding the change's branch when that file is committed there or absent there and in the repo's own checkout, and committed with the graph; `doors`, `doctor`, `verify` and `repos sync` over a built root never write them. A refresh at land or close runs the entry's `rebuild` while the graph holds a node under a recorded line. **What is mechanical**: `unique` legs on the brain guard, `askedGraphers`, `brainRefreshGrapher`, `whereLines` and its fact sentence, `graphPointer`, the hook's brain-checkout test, the registry's `askAt`, `rebuild`, `uninstall`, `uninstallFirst` and `remove`, `graphIgnoreLines`, `holdsIgnored`, the record, land's ignore write and its `.gitignore` exclusion, the forced worktree removal, `leftoverGraphs`, doctor's fact line, init's untracked read, plan's line and the two flow rows; `each` legs on the paths clause and on the door's leftover probe in `init` and `doors`; `absent` legs on a static ignore list, on `writeIgnores` in `doors`, `doctor`, `verify` and `repos`, and on `--force` in the hook; test legs; site legs; a count on the sixteen amendment notes. **Ceilings.** A brain holds code by declaration: source in a repo with no entry at `.` is not graphed until `brain: .` is added, a directory not yet a repository is judged at `init` by its entries without ignore rules, and a repo holding only a README, a LICENSE or a `.gitignore` is declared code. A kept install keeps graphify's own section and hooks naming the bare verb in the session's directory — claude's on a search and an in-project read, gemini's on every read; codex's hook is a no-op, cursor and agents have none — until a human removes it, and the removal leaves emptied hook lists in the settings files graphify touched. Where the code repos resolve several graphers the brain wires no hook. The follow hook, like a brain==code hook, refreshes any checkout holding the artifact that an edit made from the brain session reaches, a `managed: false` or `grapher: none` repo's included. A change's worktree holds no graphify graph until `change land` commits one and no codegraph index at all, so codegraph's hook follows into repo checkouts only; a graph edited only through Bash is stale, and existence is never freshness (MV-90). An answer's paths can still be read from the wrong checkout. A graphify query worded without the identifier missed one question in three, and asking the graph cost 2.1 to 2.6 times the bytes of a narrowed grep. A shallow or unsynced repo is named though multivac builds nothing there. A line a human deletes along with its record is appended again at the next land; a `specs/` line an earlier multivac wrote into a code repo stays; a negation re-includes a whole directory only; a code repo whose ignore file is untracked in its own checkout lands a graph built without it; a door whose SDD integration writes outside every door's own directory adds a line, windsurf's `/.devin/`; and the lines are directories, so a root's own Markdown files and documentation directories stay in its graph. The rebuild bypasses graphify's shrink guard only where recorded lines explain the shrink. A grapher declared under `graphers:` and codegraph get no ignore lines, and codegraph in a consumer of a brain==code brain indexes the mount. graphify was measured on 0.9.29 alone (MV-121). The legs see spellings. | open | proposed | <date> | [changes/graph-answers-where-asked.md](changes/graph-answers-where-asked.md) |
```

**The sixteen notes**, each `**Amended <date> by MV-148**: …` appended at the end of its row's
statement cell, `<date>` the day the law commit is made:

| Row | Note |
| --- | --- |
| MV-25 | under each workspace it prints, it also prints what reaches that checkout's graph: the flag pointing the grapher's verbs at the checkout, else the repo checkout's flag for the base without the branch's edits, else that there is none. It says the answers' paths are relative to the checkout asked. |
| MV-50 | "in the brain" is the brain only where a repos entry is the brain. A brain that holds no code is never refreshed, and neither is an install kept there. Where the graph holds a node under a line multivac recorded in the grapher's ignore file, the refresh runs the entry's `rebuild` instead of its `refresh`: on graphify 0.9.29 a plain `graphify update .` refuses to shrink with exit 1, and `graphify update . --force` exits 0. |
| MV-52 | in a brain that holds no code, the hook runs the one grapher the writable code repos resolve, wired only when MV-123's lookup finds its binary on PATH or in each of those repos. It runs only in the edited file's repo, when that repo holds the artifact and has no `.multivac/config.yml`, so never in a checkout of the brain, and exits 0 otherwise (540 bytes, from 492). Where those repos resolve several graphers, or the binary is not reachable from each, none is wired and `doors` says so. brain==code and consumer hooks keep their bytes. |
| MV-90 | "the brain and the repos the change names" counts the brain only where a repos entry is the brain. A brain that holds no code is not built, judged or named, and a change naming `brain` there is told so at `change plan`. The door half: a code-less brain's door names the code repos' graphers and where to point their verbs, never a graph of its own. |
| MV-103 | the gate never judges a brain that holds no code, and a graph left there is neither refused nor staged. |
| MV-122 | for `grapher`, the brain root reads the declared entry whose path is the brain, and resolves none where no entry is. `askedGraphers` and `brainRefreshGrapher` in `detect.ts` answer, through the same resolver, which graphers an agent in the brain asks and which one its hook runs. |
| MV-124 | graphify declares its `graphignoreFile` and a `rebuild`, and its ignore lines are derived (MV-148), never listed. "Nothing reads the shared, local and ignore lists yet" is WITHDRAWN: `change close` reads `local` to remove a worktree holding only the grapher's outputs. |
| MV-128 | init equips the grapher, and its pre-write lookup asks for the grapher's binary, only for a brain that holds code. A repo holds code at init when git lists a file there outside `.multivac/`, tracked or untracked and not ignored. When a declared grapher gets no graph in the brain, init says so. "its own file keeping multivac's and the SDD's files out" becomes the root's non-code directories but every known grapher's own output directory, derived and anchored, under a `# multivac:` record (MV-148). |
| MV-129 | `toolsToRun` names no grapher for a brain that holds no code, so `repos sync` and the lifecycle run none there. A code repo's missing grapher binary still exits `repos sync` 1. |
| MV-131 | `installHarness` never runs in a brain that holds no code, and `doctor` names no missing install there. An install left there is named with its removal, the platform its entry marks first leading: on graphify 0.9.29, gemini's uninstall leaves its hook when another platform's uninstall removed the shared section first. |
| MV-132 | a brain that holds no code declares no graph. Its line checks none, and a grapher install left there is a fact on it, never a failure. |
| MV-134 | the brain in "the brain and the repos the change names" is the brain only where it holds code, and `change land` commits no graph in a brain that does not, even for a change naming `brain`. Before its refresh, land appends the grapher's missing ignore lines in the checkout that holds the change's branch, and commits that file with the artifact. It does so when the ignore file is committed there, or absent both there and in the repo's own checkout; otherwise it names the file. It writes the grapher's ignore file alone, and the `.gitignore` lines stay first-build-only (MV-128). "whose only uncommitted file is the shared graph" becomes "whose only changes lie under the grapher's `local` paths". Such a worktree is removed with `--force`. |
| MV-137 | the paths of every known grapher, and of every grapher under `graphers:`, are not code in any repo, whichever grapher resolves there, so removing an install a code-less brain kept is free. The non-code set's top-level directories, but every known grapher's own output directory, are also the grapher's ignore lines (MV-148). |
| MV-139 | in a brain that holds no code, the brain node's grapher and graph are null. `change land` commits the governance graph only where it commits a brain graph, and `commitBookkeeping` and `change close` still commit it. The brain door gives graphify's `--graph` verbs where graphify is among the graphers asked from the brain (`askedGraphers`), the ecosystem's declaration included. |
| MV-140 | in a brain that holds no code, the door says so. For each grapher the code repos resolve, it lists the repos' paths and each verb with the flag that points it at a checkout, and says the answers' paths are relative to that checkout. There, "refreshed after your edits" also needs the brain's hook wired for that grapher (MV-52's note), and flow.md's refresh row and `doctor`'s refresh path ask the same. A brain that holds code keeps both lines, and adds its worktrees' form and that the law, the changes and their specs are kept out of its graph. `doctor`'s refresh path says whether the brain's hook follows edits. flow.md's gate names the brain only where it holds code. Ceiling: until a kept install is removed, graphify's own hooks and section name the bare verb in the session's directory: claude's on a search and an in-project read, gemini's on every read. |
| MV-143 | a brain that holds no code resolves no grapher, so its door never cites the vendor's section, whatever a kept install wrote there, and `doctor` offers no install there. |

`change.invariants.touches` lists exactly these sixteen, `adds: [MV-148]`, `retires: []`
(.multivac/changes/graph-answers-where-asked.md, e5d034f). The design's MV-52, MV-128, MV-134,
MV-137 and MV-140 notes gained what critic gaps 2, 5, 10, 11 and 13 changed; the design's
MV-140 note said "that its graph holds code alone", now withdrawn by gap 13.

## R19. Tests that move

The guard alone turned 25 tests red (critic, R1). Each is moved in the task that changes what
it asserts; a title an existing leg reads is kept.

| Test | What moves | Leg reading its title |
| --- | --- | --- |
| `test/doctor/adapters.test.ts` :396 (in "the SDD runs in the brain alone … — MV-146") and :427 (in "one resolver answers for both kinds…") | their `adapterFor(cfg,'brain','grapher')` assertions become `undefined` for a brain no entry declares | none |
| `test/change/equip-lifecycle.test.ts:86` "change new refuses the SDD its steps need, before writing anything — MV-129" | to the `brainIsCode` fixture (it expects `graph graphify @ …: build skipped`) | none (MV-144 reads :146) |
| `test/init/equip.test.ts:44` "declared at init, installed at init: spec-kit scaffolded and the graph built — MV-128" | the repo gets a source file (FR-017) | none |
| `test/init/equip.test.ts:86` "a tool init would run and cannot find refuses init before anything is written — MV-128" | its graphify pass gets a source file; an empty-repo case exits 0 | none |
| `test/init/equip.test.ts:145` "before the first build, the ignore lines go in, appended — MV-128" | `(+5)` → the derived count; the record and anchored lines | none |
| `test/doors/flow.test.ts:49` "the page sorts declared obligations…" (the :60 assertion) | the code-less gate row; a brain==code case keeps "the brain or a repo the change names" | none |
| `test/doors/flow.test.ts:140` "an unverified adapter is named as declared-but-unknown" | green with FR-025 | none |
| `test/doors/doors.test.ts:338` "grapher declared + present: harness post-edit entry, git shim untouched" | green with FR-012's follow entry | MV-52 — kept |
| `test/init/init.test.ts:367` "the scaffolded door names the declared grapher — MV-102" | green with FR-003/FR-006 (`graphify query "<question>" --graph .multivac/ecosystem.json`) | MV-102 — kept |
| `test/doors/ecosystem-graph.test.ts:107` | green with FR-006; code-less cases added | none (MV-139 reads :61) |
| `test/change/grapher-tracked.test.ts` :92, :105, :132, :176, :236, :247 | to `brainIsCode` where they assert the brain | MV-103 "close proceeds once the graph is committed", "the gate stages nothing" — kept |
| `test/change/grapher-gate.test.ts:90` | the code-less fixture names api and web (2 roots); a `brainIsCode` twin keeps the brain's refusal (3) | MV-90 "close refuses while declared roots have no graph" — kept |
| `test/change/harness-install.test.ts` `tmp()` | gains a committed `src/app.ts`; add "a code-less brain gets no harness install" | MV-143 "the door is linked before the vendor writes there" — kept |
| `@ brain` assertions (synth `grep -c`): doctor.test.ts 12, vendor-state.test.ts 12, binary-lookup.test.ts 7, grapher-refresh.test.ts 4, harness-install.test.ts 3, per-root.test.ts 2; brain-only, constitution-state, sdd-gates, init/equip, repos/check 1 each | to `brainIsCode` where the brain is asserted | MV-50, MV-58, MV-59, MV-87, MV-134 (grapher-refresh), MV-21, MV-47, MV-53, MV-57, MV-75, MV-87, MV-146, MV-147 (doctor) — kept |
| `test/repos/brain-first-class.test.ts:104-106` | the undeclared brain's plan output reads `(the brain)`; :100 stays `(brain==code)` | MV-12 `/brain==code/` — many matches remain |
| `test/change/concurrency.test.ts` | apply's exact stdout accounts for the pointer line, or a grapher-free fixture | MV-25 "both live at once" — kept |
| `test/doctor/adapters.test.ts:463` | the registry snapshot drops `graphignore` and gains `rebuild`, `askAt`, `harness.uninstall`, `uninstallFirst`, `remove` | none |
| `test/verify/code-in-change.test.ts:208` | `.graphifyignore` stays non-code | MV-137, MV-142, MV-146, MV-147 titles — kept |
| `test/change/vendor-state.test.ts:235` | codegraph still writes no `.graphifyignore` | none |
| `test/init/reinit.test.ts:161` "init and doors write the same door, byte for byte" | extended with a kept install (critic gap 3) | MV-102 — kept |

The fixture: `makeScratchEcosystem(tmp, { brainIsCode?: true })` adds `brain: .` and a tracked
`src/app.ts`; the default stays code-less, which #3's SDD tests depend on.

## R20. Ceilings, stated

Every edge case of spec.md marked a ceiling is in MV-148's ceilings. One more is stated there
and not amended elsewhere: MV-125's headline says a repo multivac does not own is never written,
and a brain==code hook already refreshes any checkout holding the artifact that an edit reaches,
a `managed: false` one included; the code-less follow hook has the same reach (critic gap 10).
A repo-scope test in the hook is rejected (R10); MV-125 is not amended, since this change adds a
reach MV-140 already had rather than falsifying a sentence MV-125 states of the lifecycle's
surfaces — the operator may prefer a seventeenth note (listed as unresolved in the hand-off).

## R21. The human's questions, at the design's defaults

1. The land-time retrofit in other teams' code repos: **yes** (the alternative, `doctor`-only
   printing, leaves existing repos polluted; the retrofit is where most of the saving is).
2. The kept-install door line (210 B, +800 B per session until the removal): **kept** — the
   honest counter to the vendor's own nudges; it goes with the install.
3. The per-grapher hooks for mixed ecosystems, codegraph's exclude of a mounted brain==code
   brain, and codegraph's printed-query telemetry disclosure: **`codegraph-worktrees-and-verbs`**.
4. A change → spec-directory edge in `ecosystem.json`: **out of scope, no owner** (1 of 3
   questions reached the slug through ecosystem.json in inv, 3 of 3 in ver-M).
5. This brain's one-time graph diff (−4,477 nodes, mostly `specs/` and `.multivac/`, plus the
   new `.graphifyignore`): **reviewed within this change** (T072).
