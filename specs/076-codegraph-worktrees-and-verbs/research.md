# Research: codegraph answers for the checkout it is asked in

Measured 2026-09-28 and 2026-09-29 in scratch ecosystems with `HOME`, `GIT_CONFIG_GLOBAL`,
`DO_NOT_TRACK=1`, `CODEGRAPH_TELEMETRY=0`, `CODEGRAPH_NO_DOWNLOAD=1` and
`CODEGRAPH_NO_UPDATE_CHECK=1` isolated (except where a run measured what happens without
them), on codegraph 1.6.0, graphify 0.9.29, git 2.43.0 and mvac 0.14.1 (`main`'s dist at
92c4c08). Three investigations — worktree-index (piece **W**), verbs (**V**), mixed-and-mount
(split into **H**, hooks, and **K**, kept out) — each checked by three adversarial lenses
(guarantee kept, every adapter set, the saving is real), merged into one design and read by a
completeness critic whose 12 gaps the spec folds in (checklists/requirements.md maps each).
Who measured a figure is marked: **(inv)** the investigator of that piece, **(ver-G)**,
**(ver-X)**, **(ver-M)** the guarantee, cross-adapter and measurement verifiers (with the piece
letter where it is ambiguous), **(synth)** the design's re-measurement, **(critic)** the
completeness critic, who cloned main at 92c4c08, applied the core of this change and ran the
suite and end-to-end flows, **(plan)** re-measured for these artifacts on main at 62d4588 (#3
and #4 merged, #5 not). Tokens are bytes/4.

The design cites `file:line` on `main` at **92c4c08**. Since then opsx-through-its-cli (#4,
MV-147) merged and was archived (bfe9728), and graph-answers-where-asked (#5, MV-148) was
promoted, declared and branched (49591e7, e5d034f, 62d4588) and is being implemented; it lands
before this change, whose surfaces it creates. **Every `file:line` below is re-anchored on the
tree with #5 merged when this change is applied (tasks.md T001).** Tasks name functions first.

The scratch setup behind every figure, for whoever re-runs one:

```bash
SCR=<scratch>; export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 \
  OPENSPEC_TELEMETRY=0 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1
mkdir -p $HOME && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
codegraph --version  # 1.6.0
graphify --version   # 0.9.29
git --version        # 2.43.0
```

Every vendor command in scratch is chained with its `cd` in ONE invocation, and no codegraph or
graphify write runs with its working directory inside `/home/user/multivac`.

## R0. The design's ids, #5's names, and the spec's

**Design → spec.**

| Design | Spec | Design | Spec |
| --- | --- | --- | --- |
| FR-W1 build or sync | FR-001 | FR-H1 identity | FR-012 |
| FR-W1 step 2 lookup (+ critic gap 10) | FR-002 | FR-H2 merge | FR-013 |
| FR-W2 exclude (+ gap 2) | FR-003 | FR-H3 resolver | FR-014 |
| FR-W3 stdin | FR-004 | FR-H4 wiring, notices | FR-015 |
| FR-W4 land (+ gaps 1, 8) | FR-005 | FR-H5 one predicate | FR-016 |
| FR-W4/§1.2 close, #5's FR-B8 | FR-006 | FR-H6 two-artifact line | FR-017 |
| FR-W5 pointer | FR-007 | FR-K1 registry | FR-018 |
| FR-W6 brain==code line | FR-008 | FR-K2 lines | FR-019 |
| FR-W6 group line | FR-009 | FR-K3 splice | FR-020 |
| FR-W7 layout | FR-010 | FR-K4 skip | FR-021 |
| critic gap 7 | FR-011 | FR-K5 when written | FR-022 |
| FR-V1 verbs | FR-026 | FR-K6 doctor | FR-023 |
| FR-V2 header | FR-027 | FR-K7 #5's readers | FR-024 |
| FR-V3 dedup | FR-028 | FR-K8 mount | FR-025 |
| FR-V4 disclosure (+ gap 5) | FR-029 | §2 law | FR-031 |
| FR-V5 retired copy (+ gap 6) | FR-030 | §2.4 instance / §7 docs | FR-032 / FR-033 |

SC-W1→SC-001, W2→SC-002 (+ gaps 1, 2), W3→SC-003, W4→SC-004, W5→SC-005, W6→SC-006;
SC-H1→SC-009, H2→SC-010, H3→SC-011, H4→SC-012; SC-K1→SC-014, K2→SC-015, K3→SC-016,
K4→SC-017, K5→SC-018; SC-V1→SC-020, V2→SC-021, V3→SC-022. New: SC-007 (gap 8), SC-008 (the
§8.1 correctness figures as a criterion), SC-013 (FR-H6), SC-019 (FR-K4's measured override),
SC-023 (MV-84, MV-126, `absent` legs), SC-024 (§2.4), SC-025.

**#5's names, as its artifacts define them** (specs/075-graph-answers-where-asked/ on its
branch). The design wrote #5's surfaces from c5/design.md; where #5's spec, data-model or
contracts differ, **#5's artifacts win** and this change adapts:

| Design wrote | #5's artifacts define | This change |
| --- | --- | --- |
| FR-B2 group line, FR-B3 pointer, FR-B5 brain==code line, FR-B8 forced removal, FR-B9 consumer door, FR-C2/C3 wiring and mixed notice, FR-C4 doctor refresh path, FR-D1…D6 ignore lines, FR-A7 leftovers | FR-003/004, FR-007, FR-005, FR-009, FR-010, FR-012/013, FR-015, FR-026…031, FR-020…022 (#5's research R0) | cites #5's surfaces by name, not by id |
| FR-B5 codegraph line opens "It answers for this checkout, code only: …" (282 B) | "It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them. …" (269 B; #5's critic gap 13 removed "code only") | keeps #5's first sentence; 441 B (+172) |
| a follow hook is wired where the binary is found "in the brain or in one writable code repo resolving it" | #5 FR-012: "only when its binary is on PATH or in each such repo's `node_modules/.bin` — never on the strength of a copy in the brain or in one repo alone, which the hook cannot reach after it moves into another repo" | each follow hook is wired by #5's rule, per grapher (FR-015) |
| MV-52's note quotes "Where those repos resolve several graphers, none is wired and `doors` says so" | #5's MV-52 note: "Where those repos resolve several graphers, or the binary is not reachable from each, none is wired and `doors` says so." | the note quotes #5's sentence and keeps its reachability half |
| land runs "#5's `writeIgnores`", whose `.gitignore` target the critic assumed stays (gap 1) | #5 FR-028 and data-model *Land's ignore step*: `writeIgnores(…, { gitignore: false, before: 'the refresh at \`change land\`' })` — the grapher's ignore file alone | land's local branch calls the same one `writeIgnores` with `gitignore: false`; gap 1 is closed by #5, and SC-002 pins it |
| `holdsIgnored` must be gated on `rebuild` so a 12 MB SQLite artifact is never parsed | #5's `refreshGraph` already short-circuits `spec.rebuild && await holdsIgnored(…)`, and #5's doctor facts (FR-030) apply only to a shared artifact | the gate is made explicit inside `holdsIgnored` (FR-024), so no later caller can parse it |
| `leftoverGraphs` "extended beyond a code-less brain" | `leftoverGraphs(cfg, dir)` returns `[]` when the brain holds code | a third argument asks the same probe per code repo (data-model.md *Leftovers*) |
| the pointer's in-place line `its index: -p <ws> — <fresh>; …` | `its index: -p <abs> — paths in its answers are relative to this checkout` (87 B), in place only | the in-place and the worktree line both carry the freshness clause |
| the design's `whereLines` dedup line at two spaces | #5's verbs under a group sit at four spaces | the dedup line is four spaces in, 58 B |

## R1. A worktree without an index answers from the one above it

**Decision**: the change's checkout gets its own index (FR-001); nothing prints a `-p` at a
checkout that has none (FR-007, FR-009).

**Rationale**:

- #4's branch at e4b09a7, 148 files: the trunk index lacked **19 branch-only symbols** of the
  worktree's index, and put **24 of 192** moved symbols more than 60 lines from their line on
  the branch (ver-M W, `python3 delta.py mv/.codegraph/codegraph.db wtA/.codegraph/codegraph.db`).
- A sibling's worktree nested in a codegraph brain==code brain (`…/worktrees/y/web`):
  `codegraph query cmdApply -p .` answered with the brain's code, exit 0 (inv W).
- A branch-only symbol asked at an unindexed worktree: `[i] No results found`, 37–43 B, exit 0,
  then a grep of 104–577 B; with the worktree's own index, 514 B and correct
  (`codegraph query bodyGlobs -p <wt> | wc -c`, ver-M W).
- `codegraph status` warns about a borrowed index; only `query` is silent (bin/codegraph.js:879
  in 1.6.0's dist, ver-M W).
- From the main checkout, `codegraph query X -p <wt>` equals the same asked inside `<wt>`,
  byte for byte, for `query`, `callers`, `callees` and `impact` (inv V); a session inside an
  indexed worktree resolves that worktree's index with the bare verb (inv W, inv V).

**Alternatives considered**: the pointer alone, naming the base (#5's state) — true but
the agent's answers about the branch stay wrong; building only where a post-edit hook is
wired — rejected (§1.5 of the design): apply, land and close keep the index at most one
lifecycle step old everywhere, and the pointer says which.

## R2. Build or sync at apply, every time

**Decision**: apply builds where no index is installed and syncs where one is, in each
checkout it hands out, the repo branched in place included, through `refreshGraph` (FR-001).
No skip for an installed worktree.

**Rationale**:

| What | Figure | Who |
| --- | --- | --- |
| `codegraph init` in a worktree, 52 files | 1,131–1,192 ms (inv); 1,154–1,370 ms (ver-M W); 4.0 MB | inv W, ver-M W |
| 148 files | 1,882–2,160 ms, 11.8 MB | ver-M W |
| 675 files | 4.8–5.5 s, 24 MB | inv W |
| 1,012 files | 6,982 ms, 35,778,789 B | ver-X W |
| `codegraph sync`, no change | 0.29–0.32 s | inv W, ver-M W |
| `codegraph sync` after one edit | 0.55–0.81 s (549–607 ms ver-M W) | inv W, ver-M W |
| `init` in a worktree writes outside it | nothing (`find` before/after) | inv W |
| brain==code codegraph apply, end to end | 1,065 ms, porcelain `!! .codegraph/` only | critic `$SCR/bc` |

Skipping an installed worktree on re-apply (the investigator's copy of `ensureGraphs`' rule)
froze the index: ver-G W, ver-X W and ver-M W each found the pointer and the door then read as
branch-fresh while the index was as old as the first apply. The repo branched in place was
indexed by `equip` before `ensureWorkspace` switched its branch, so the sync brings it to the
branch. `refreshGraph` carries MV-58's lock, MV-124's `env` (the `...spec.env` `each` leg on
refresh.ts) and MV-50's warn-never-throw; an unevaluable state is warned and skipped.

**Alternatives considered**: copy the base index into the worktree, then sync — identical
output at 52, 148 and 675 files (inv W), saving 0.05–0.36 s at 148 files (ver-M W, not the
investigator's 0.6 s) and about 3.5 s at 675; it needs a new writer of a vendor's private
SQLite and WAL files under the base's lock and an unrecorded vendor fact (relative paths,
hash-based sync) that MV-121 would require recorded. **No owner; the human decides** (spec
Assumptions). Building a graphify graph in a worktree at apply — dropped: the worktree checks
out the branch's committed graph, and a refresh there cost 18.5 s (10.8 s ver-M W) and a
487+/476− diff to add one doc edge.

## R3. The prompt, and the runner that closes stdin

**Decision**: `runDeclared` ends the child's stdin right after spawning (FR-004), spelled
`const p = execFileP('sh', ['-c', run], { … }); p.child.stdin?.end(); await p;`, its `env`
line (with `localBin(dir)]`) unchanged.

**Rationale**:

- With its watcher off (`CODEGRAPH_NO_WATCH=1`, or WSL on a `/mnt` path) `codegraph init`
  prompts. Through multivac's runner, which left stdin open, it had not returned after 30 s
  (ver-X W).
- `node run.mjs <wt> open|close` (synth; `execFile('sh', ['-c', 'codegraph init'], { env: {
  …, CODEGRAPH_NO_WATCH: '1' }, timeout: 12000 })`, then `p.stdin?.end()` when `close`):
  stdin open → `KILLED(timeout)` at 12,015 ms, the killed `sh` leaving a `codegraph init`
  orphan; stdin closed → rc=0 in **851 ms**, and `.git/hooks` held 0 non-sample files before
  and after.
- `-y` is not the fix: it installs three git hooks into the shared `.git/hooks` (ver-X W).
- Closing stdin changes nothing else (critic): `graphify install --project --platform claude`
  gives the same rc, output and 13 files with stdin closed as open; `p.child.stdin?.end()` over
  600 spawns, including an immediate `exit 3`, raised 0 EPIPE errors (`node epipe.mjs`).
- MV-115's leg `execFileP\('sh', \['-c', run\]` still matches the `const p = …` spelling
  (critic).

**Alternatives considered**: `CODEGRAPH_NO_WATCH` in the entry's `env` — relies on an
unrecorded vendor default, and closing stdin covers the `/mnt` case too; a timeout on the
runner — dropped: the measured hang is a stdin prompt, and a timeout would kill a
legitimately slow index. The SDD scaffold's runner (sdd.ts) is untouched: no prompt was
measured there (no owner).

## R4. The index never dirties the checkout, and which path to ask

**Decision**: before the build, `excludeLocalOutputs(ws, spec, key)` asks
`git -C <ws> check-ignore -q <line>` of **each line of `spec.ignore` itself** (`.codegraph/`)
and appends every line git does not ignore to `<common>/info/exclude`, `common` being
`resolve(ws, (await gitRun(ws, ['rev-parse', '--git-common-dir'])).trim())`; it says so in one
line (FR-003). Never a tracked file. `--git-common-dir` without `--path-format` works on git
before 2.31.

**Rationale**:

- The hazard (ver-G W, ver-X W, ver-M W): in a sibling repo whose `.codegraph/` line MV-128
  wrote at `repos sync` and nobody committed, a worktree index shows `?? .codegraph/`,
  `change close` keeps the worktree as holding uncommitted work, and `git add -A` stages
  codegraph's own `.codegraph/.gitignore` onto the branch.
- The fix, measured (synth, `$SCR/ex/web`): `git -C ../wt1 check-ignore -q
  .codegraph/codegraph.db` rc=1 before the write and rc=0 after, on a path not yet created;
  after `codegraph init </dev/null` the worktree's porcelain is empty and `--ignored` shows
  `!! .codegraph/`; the main checkout is untouched apart from its pre-existing ` ?? .gitignore`;
  plain `git worktree remove` exits 0. A second append finds the line.
- The per-worktree `info/exclude` (`.git/worktrees/<n>/info/exclude`) is not read by git 2.43
  (ver-G W): only the common one works.
- **Which path (critic gap 2).** The design probed `spec.artifacts[0]`
  (`.codegraph/codegraph.db`). codegraph 1.6.0 writes `.codegraph/.gitignore` = `*`,
  `!.gitignore`, which un-ignores itself, so git lists `.codegraph/.gitignore`, not the
  database. In `$SCR/eco2`, a sibling whose committed `.gitignore` is only `*.db`: apply printed
  the build line and no exclude line; `check-ignore -q .codegraph/codegraph.db` rc=0;
  porcelain `?? .codegraph/`. In a fresh worktree there: `.codegraph/codegraph.db` rc=0,
  `.codegraph/.gitignore` rc=1, `.codegraph/` rc=1. In `$SCR/bc`, where `.codegraph/` is
  committed: `.codegraph/` rc=0 and `.codegraph/.gitignore` rc=0 (critic). Asking the ignore
  line itself (`.codegraph/`) is right in all three cases and reads the entry's field, not its
  name (Principle V).
- #5's forced removal (a worktree whose every uncommitted path is under the `local` globs,
  `picomatch('.codegraph/**')('.codegraph/')` true, critic) stays as the second defence; it
  does not cover the `git add -A` window between apply and close.

**Alternatives considered**: #5's forced removal alone (the §10 alternative) — leaves the
`git add -A` hazard; a `.gitignore` edit in the worktree — a tracked file on the branch;
the per-worktree exclude — not read.

## R5. Land syncs the index, after the same exclude step, and commits none

**Decision**: `commitGraph` no longer returns at `!art` for a local artifact (FR-005). It
resolves the spec, keeps the `readOnly` check, returns `true` silently on a detached HEAD or
another branch (nothing of the index is committed, so a detached HEAD must not start refusing
land; the refusal stays for shared artifacts); on the change's branch it runs #5's ignore step
through its one `writeIgnores(…, { gitignore: false, … })` call (critic gap 1) and commits
`codegraph.json` alone when the step appended (R16), then asks `missingRequired(spec, dir)` and
returns silently on a miss, else runs `excludeLocalOutputs(dir, spec, key)` (critic gap 8) and
`refreshGraph(name, dir, key, cfg.graphers)`; it commits no index. The exclude step runs only
where a build or sync follows, at land as at apply, so nothing is written under `.git/` for an
index that is not built.

**Rationale**:

- Land syncs the index on the branch after the agent's last edits (0.55–0.81 s), and builds
  one where apply could not, so grapherLines' no-hook wording "refreshed at `change land` and
  `change close`" becomes true of worktree indexes.
- **Gap 8** (critic, `$SCR/eco`, change `late`): apply ran with `PATH=$SCR/nocg:/usr/bin:/bin`
  (no index); land ran with codegraph present: `graph codegraph @ web: built (\`codegraph
  init\`)`, worktree porcelain `?? .codegraph/`; close kept the worktree. The exclude step
  before the refresh closes it.
- **Gap 1** (critic, `$SCR/eco`): with the design's `writeIgnores` writing both targets, land
  printed `graph codegraph @ web: wrote .gitignore (+1) before this land`, the worktree showed
  `?? .gitignore`, and close printed the `--force` line; #5's FR-B8 could not save it
  (`.gitignore` is outside `.codegraph/**`). #5's artifacts already write the grapher's ignore
  file alone at land (`gitignore: false`, #5's critic gap 5), and MV-134's #5 note says so; this
  change reuses that call, and SC-002 asserts "porcelain empty after land".
- The land sync goes through `refreshGraph` → `runDeclared`, so it carries `env` (MV-124) and a
  closed stdin (R3).
- MV-125: land's write runs after `commitGraph`'s `readOnly` check; no new `.readOnly)
  continue;` spelling is added to the files MV-125's `count=6` reads.

**Alternatives considered**: printing `codegraph sync <ws>` for the agent to run — it flushes
queued telemetry on a later UTC day and the agent's call carries no opt-out (ver-X V M5);
re-running `change apply` is the refresh, and it carries `env`.

## R6. The lookup in the checkout, said once

**Decision**: `indexWorktree` asks MV-123's lookup in the checkout the command runs in (the
worktree). On a miss it builds nothing; it lets `refreshGraph` print MV-123's line for
`<key> worktree` — unless the repo's own checkout is still not installed after `equip`, in
which case `equip`'s build of that checkout already printed that line and apply says nothing
more (FR-002).

**Rationale** (critic gap 10): the design said a miss "prints nothing new, since `equip`
already named a missing binary". `ensureGraphs` skips an installed root before its lookup
(the `.state === 'installed') continue; // already built here` line, MV-124's leg), so in the
common case — the repo's own index installed — `equip` printed nothing. Measured (critic,
`$SCR/eco`, change `nob`): web's main index installed, codegraph off PATH, apply printed no
binary line at all. The `node_modules/.bin`-only case (a worktree has no `node_modules`) has no
first line either: `equip` found the binary in the repo's checkout. Without a line the agent
reads only the fallback, which says there is no index but not why. The design's worry was the
duplicate: today's apply prints MV-123's line twice, 238 B each, where the repo's own checkout
is missing too (ver-M W) — the "still not installed" condition keeps that case to `equip`'s one.

| Lookup in the worktree | Repo's own checkout after `equip` | apply prints |
| --- | --- | --- |
| found | any | the exclude line (when it appends), then the build or sync line |
| missing | installed | no exclude write; `graph codegraph @ <key> worktree: build skipped — \`codegraph\` found on neither PATH nor <key> worktree's node_modules/.bin — install codegraph: …, then \`codegraph init\` there` (once) |
| missing | not installed | nothing new (`equip` printed that line for `<key>`) |

MV-123's `binaryMissing\(` `each` leg (sdd, refresh, doctor) and `found on neither PATH nor`
`unique` are unchanged: the line comes from `refreshGraph`.

**Alternatives considered**: silence (the design) — the reason is lost in the common case;
always printing — the duplicate ver-M W measured; `binRoot`, building with the repo's
`node_modules/.bin` binary — dropped with its +103 B hook segment: ver-G W showed that taking
the build half alone gives a silently frozen index the hook cannot reach, and the hook half
breaks #5's pinned hook bytes (a ceiling in MV-149).

## R7. The pointer, its freshness, and the apply output

**Decision**: #5's `graphPointer` prints, for a local artifact installed in the workspace
(worktree or in place, not the brain's own main checkout), `    its index: -p <ws> —
<fresh>; paths in its answers are relative to this checkout`, `<fresh>` from the one predicate
(R10): `refreshed after your edits`, else `as of this apply, refreshed again at \`change
land\`` (FR-007). Not installed: #5's fallback, unchanged; never `-p <ws>`.

**Rationale and measurements** (plan, `node bytes.mjs`, each line with its newline):

| Line | Bytes |
| --- | --- |
| build: `graph codegraph @ web worktree: built (\`codegraph init\`) — local artifact, never committed` | 93 |
| sync: `… refreshed (\`codegraph sync\`) — …` | 97 |
| exclude: `web: .codegraph/ added to <common>/info/exclude — git ignored no index here, and that file is never committed` | **104 + the common directory's length**: 121 for `/srv/eco/web/.git`; 207 for a 104-character path (critic gap 11) |
| pointer, sibling worktree `/srv/eco/brain/.multivac/worktrees/totals/web`, hook / lifecycle | 147 / 171 |
| pointer, this repository's worktree path, hook / lifecycle | 177 / 201 |
| #5's codegraph fallback line (unchanged) | 234 with `/home/you/…` (#5's contract) |

Per codegraph workspace, apply prints the build line and the pointer (240–294 B) where #5
printed its fallback (212–234 B): neutral to about +66 B, once per change, plus the exclude
line on a repo's first apply. **The per-lookup gain is not bytes**: a correct 514 B answer
replaces 37–43 B of "No results" plus a 104–577 B grep — one avoided failed call and a correct
answer (ver-M W; the whole-file Read comparison of the investigator is dropped).

**Alternatives considered**: one freshness wording (the door's) — "refreshed at `change land`
and `change close`" is false of an index that apply just built and land will sync; printing
`its index:` unconditionally (inv W) — weakens MV-148's no-silent-wrong-answer guarantee
(ver-G V M1, ver-X V M4).

## R8. The doors' lines

**Decision**: #5's brain==code codegraph line and #5's `whereLines` codegraph group line flip,
conditionally (FR-008, FR-009). #5's graphify lines and its fallback wording stay.

- brain==code codegraph line (441 B, from #5's 269 B): `  It answers for this checkout, with the
  law, the changes and their specs kept out of it: the ecosystem graph above relates them.
  \`change apply\` builds each change worktree its own index and prints \`its index: -p
  <worktree>\`; paths in its answers are relative to that worktree. Where \`apply\` printed no
  such line, \`-p\` there answers from this checkout's index, without the branch's edits.
  Never run the \`codegraph init\` its notices suggest.`
- group line (one repo `svc`, 240 → 332 B; 345 B with the lifecycle freshness): `… built in
  each checkout, never committed — each change worktree's by \`change apply\`, which prints
  \`its index: -p <worktree>\`; where \`apply\` printed no such line, \`-p\` at that worktree
  answers from the nearest index above it, or fails:` — and `{checkout}` renders `<checkout>`
  for codegraph as for graphify; #5's "a change's worktree has none yet" and "never pairs
  codegraph with `<checkout>`" go.
- "Never run the `codegraph init` its notices suggest": `codegraph node` or `explore` asked with
  `-p <worktree>` from the main checkout prints a notice telling the agent to run
  `codegraph init -i` "here", which rebuilds the trunk index (2.8 s) and, without opt-outs,
  sends an `index` event at once (inv V). From inside an unindexed worktree the notice names
  the trunk — a true warning; the door routes the agent to `change apply` through "Where
  `apply` printed no such line".
- `src/doors/brain.ts`'s grapher head "it is built in each checkout, so never commit it" keeps
  its bytes and is now true of worktrees.

**Alternatives considered**: "build nothing" unconditionally in the FR-B5 line (inv V) —
dropped; a line naming the worktree index without the condition — ver-G W m4, ver-X W m4.

## R9. A hook's grapher is the artifact its toplevel test names

**Decision**: `const ARTIFACT_TEST = /\[ -e "\$t\/([^"]+)" \]/;` and `export function
refreshKey(command): string | undefined` in settings.ts; `ownsRefresh` unchanged
(`REFRESH_HEAD`) (FR-012).

**Rationale**: MV-140's toplevel test `[ -e "$t/<artifact>" ]` has been written since
2026-09-16, and #5's follow form keeps it; #5's `[ ! -e "$t/.multivac/config.yml" ]` does not
match because of the `!`; correct on all four hook forms (brain==code and follow, graphify and
codegraph; inv K, ver-M K). A hook older than MV-140 is keyless. The key adds 0 hook bytes.

**Alternatives considered**: a grapher-named marker in the command — adds bytes and breaks
#5's pinned hook strings (SC-009 of #5: 492/558/540/606 B); keying on the refresh command's
first word — a human's `graphify update .` would become ours.

## R10. One hook per grapher: the merge, the resolver, the wiring, one predicate

**Decision**:

- **Merge** (FR-013): `mergeClaudeSettings(raw, { refreshes?: RefreshHook[]; refresh?; env?;
  artifact?; matcher? })`, `RefreshHook = { refresh; env; artifact?; follow? }`, today's
  `refresh`/`env`/`artifact` sugar a one-element list. The refresh branch becomes
  `ensureRefreshes(hooks, wanted, matcher)`: (1) rewrite in place every hook of ours whose key
  is a wanted artifact, copies included; (2) a wanted grapher still without one takes over, in
  place inside its entry, a hook of ours whose key is unwanted or missing — matcher, a
  `timeout` and sibling commands survive; (3) a wanted grapher still left gets a new entry with
  the post-edit matcher; (4) every other hook of ours is removed, its entry only when emptied;
  an empty list removes every hook of ours. `rewrite(m, command)` holds `m.hook.command =
  command;` and `m.hook.type = 'command';` once each, called by `ensureEvent` and
  `ensureRefreshes`, so MV-74's two `unique` legs keep one spelling each.
- **Resolver** (FR-014): `brainRefreshGraphers(cfg): { name; follow }[]` replaces #5's
  `brainRefreshGrapher`: a brain that holds code → its own (`follow: false`), then each other
  distinct grapher its writable code repos resolve (`follow: true`); a code-less brain → each
  distinct grapher they resolve (`follow: true`). Config only, like #5's `askedGraphers`; roots
  resolving none, unverified graphers and `managed: false` repos do not count; a grapher whose
  artifact equals one already listed is dropped (the notice).
- **Wiring** (FR-015): `installHookConfig(dir, hookConfig, refreshes, notices)` passes
  `refresh: hookConfig.postEdit ? refreshes : []`; `projectInto` builds each with
  `refreshHookOf(spec, follow)` = `{ refresh: spec.refresh, env: spec.env ?? {}, artifact:
  spec.artifacts[0], follow }`, keeping a hook where MV-123's lookup finds its binary: the
  brain's own with `missingRequired(spec, dir)`, a follow hook with `missingRequired(spec,
  root.dir)` empty for **every** writable code repo resolving it (#5's rule, R0). A consumer
  passes its one grapher, `follow: false`. #5's "one hook runs one command" notice goes.
- **One predicate** (FR-016): `hookRefreshes(cfg, name)` in detect.ts — a declared door has
  `hookConfig.postEdit` and `brainRefreshGraphers(cfg)` lists `name` — read by #5's
  `whereLines` freshness, the pointer (R7), flow.md's refresh row and `doctor`'s refresh path.
  It is introduced first over #5's `brainRefreshGrapher` (byte-neutral) so US1 can use it, and
  its body moves to membership in US2.

**Rationale and measurements**:

- Prototype `reconcile.mjs` (inv K, re-run by ver-M K): T1–T9 pass — T1 idempotent, T2 a
  human's `graphify update .`, `codegraph sync` and a command naming `.codegraph/codegraph.db`
  untouched for every wanted set, `[]` included, T3 removal keeps the user's sibling command,
  T4/T5 a keyless pre-MV-140 hook taken over, never doubled, T6 stable under reordered config,
  T9 byte-identical to today's merge for graphify and for codegraph with `env` (fresh and keyed
  files).
- **Behaviour change** (ver-X K E1a): two keyless copies of ours, which the merge used to
  rewrite and keep, become one. MV-74's "a duplicate is reported, never deleted" is about the
  gate hook and its test's fixture is two `mvac verify` entries, so it is unaffected; MV-74's
  note states the refresh case.
- SC-C3 of #5 flipped (inv K, ver-M K, real binaries): a code-less brain with web on graphify
  and api on codegraph — a web payload gives a new node in web's `graph.json` and no
  `web/.codegraph`; an api payload makes `codegraph query zetaApi --json` non-empty in api and
  leaves no `api/graphify-out`; a brain payload leaves no `.multivac/cache` in the brain; every
  exit 0.
- brain==code graphify with a codegraph sibling (ver-G W): the brain's 492 B hook, given a
  payload in the sibling's indexed worktree, rewrote the brain's `graph.json` (md5 6596f246 →
  98621df6) and left `mixedProbe` unfound; with the codegraph follow hook added, `omega_api`
  was found (inv K). The brain's own hook still refreshes the brain on that edit (bytes pinned
  by MV-148): a wasted background `graphify update .`, as today — a ceiling.
- Shared artifact (ver-X K m): the prototype merge was not idempotent with two graphers
  declaring one artifact; the resolver drops the second, and `doors` prints `brain: notice: <a>
  and <b> both write <artifact>, so one hook cannot tell their repos apart — <a> is wired;
  \`change land\` and \`change close\` refresh <b>` (185 B for `graph/out.json`), or `— neither
  is wired; … refresh them` where neither is the brain's own.
- Cost: settings.json +804 B over a graphify-only follow hook (1,159 → 1,963 B), or +1,542 B
  over #5's mixed-case 421 B; no agent reads it, 0 tokens (`node hook/mk.mjs`, ver-M K). Per
  edit: a hook exiting at its guard 8.1–10.2 ms, one spawning the refresh 14.7–15.5 ms; back to
  back at most ~24 ms per code edit and ~17 ms per brain edit, against the 1.45–1.51 s
  `mvac verify` gate already on every edit (N=100 × 3, ver-M K). The refresh runs in the
  background, only in the edited repo: codegraph sync 735–815 ms, graphify 272–336 ms (inv K).

**Alternatives considered**: a mutual-exclusion guard (`[ ! -e "$t/<other artifact>" ]`) in
each follow hook — in a repo holding both artifacts neither hook would run, the declared
grapher's included; two of three K verifiers prefer `doctor` naming the leftover (R11).
Keeping #5's "none wired" in mixed brains — the defect SC-009 measures.

## R11. Two artifacts in one repo: the race, and `doctor`'s line

**Decision**: `doctor`, per writable root, asks #5's leftover probe for the known graphers the
root does not resolve; where the root holds such a grapher's artifact and `hookRefreshes(cfg,
<other>)` holds, it appends ` · also holds <artifact> of <other>, which it does not resolve —
<other>'s post-edit hook refreshes it there; remove it: <removal>` (FR-017). The removal is
#5's `remove` for codegraph (`codegraph uninit --force`) and #5's graphify removal otherwise.
No line when that hook is not wired; exit code unchanged. The predicate is computed in
doctor.ts, so repo-state.ts stays offline (MV-132's `execFile|missingRequired|toolVerdict|spawn`
`absent` leg there).

**Rationale**: in a repo holding both artifacts, both follow hooks pass their guard and take
the repo's one lock; an edit refreshed whichever took it first — **8 and 12 of 20** with stubs
run in parallel (ver-X K). MV-58's "the hook SKIPS, because the refresh already running covers
this edit" holds only for the grapher holding the lock; the other catches up at its next
refresh. MV-58 gets a note, and the race is a ceiling.

## R12. codegraph.json: what 1.6.0 does with it

**Decision**: codegraph's `graphignoreFile` is `codegraph.json`, lines go into its `exclude`
array (FR-018); the registry comment at "No graphignore: no ignore file of codegraph's was
verified" (replaced by #5 with its measured mechanism) now records:

- the file sits at the project root; `exclude` holds gitignore-style patterns;
- `exclude` wins over `include` and `deprioritize`, even for tracked paths and inside
  submodules (inv K, ver-G K);
- `sync` purges newly excluded files — 'Removed: 148', no rebuild needed (ver-M K);
- a malformed `exclude`, invalid JSON or a BOM is ignored with a warning (inv K, ver-G K);
- `init` never creates the file; `init` plus `sync` leave its md5 unchanged (ver-G K);
- `.gitignore` is honoured for tracked and submodule files, and `.git/info/exclude` is not
  (inv K, ver-M K).

**The mount** (ver-M K): a consumer of this brain with the brain mounted at `.brain` — `codegraph
init .` gives **2,254 nodes / 150 files, 2,247 under `.brain`**; with `{"exclude":["/.brain/"]}`
(38 B), **7 nodes / 2 files**.

| What | With the mount | With the 38 B file |
| --- | --- | --- |
| DB, fresh build | 12,115,968 B | 163,840 B |
| `init` / full `index` / sync per edit | 1,939 / 1,984 / 654 ms | 653 / 604 / 541 ms |
| `codegraph query add` | 1,056 B, the brain's `roadmap.ts:122` first | 86 B |
| `codegraph node add` | 2,735 B, "2 definitions named", the brain's first | 169 B |
| `codegraph callers add` | 143 B, both callers from `.brain/` | 31 B |
| `codegraph impact add` | 256 B, 4 of 5 symbols the brain's | 84 B |
| names unique to the consumer | — | unchanged (`query computeTotal` 212 = 212) |

Stated absolutely: **2,247 nodes and 148 files out of the consumer's index per mounted
brain==code brain**; the share is 2,247/(N+2,247), 99.7% in a 2-file fixture and about 31% at
N=5,000 (ver-M K; the design dropped the 99.6% headline). The saving applies in the consumer's
main checkout, where `repos sync` initialised the mount, to sessions opened there and to
`-p <repo>` asked from the brain; a change worktree's mount is empty, 7 nodes either way.

**Alternatives considered**: a `.gitignore` line for the mount — codegraph 1.6.0 honours it,
but it is git-wide and a later `git submodule add` of the mount exits 128 (ver-M K); a JSON
record key in `codegraph.json` — codegraph defines none, an invented integration (Principle
V); a negated entry is the human's opt-out and was measured to keep the mount (inv K).

## R13. Only the structural lines

**Decision**: `graphignoreScope: 'structure'`; #5's `graphIgnoreLines(cfg, brain, scope,
spec)` gives, for it, `/<mountDir(cfg)>/` in a code repo when `brainHoldsCode(cfg)` and each
nested declared repo inside the root, anchored — nothing else; an empty set writes nothing and
creates no file (FR-019).

**Rationale**: codegraph 1.6.0 indexes no markdown, so #5's full derived set is inert: it gives
the same node counts as the mount line alone (consumer 9, brain 2,247; inv K); a code-less
brain's mount adds 0 codegraph nodes (`nodes 3 {'src': 3}`); `.multivac/` is inert in
brain==code (ver-X K). The full set would put a 230 B untracked file into every codegraph repo
and a "not committed" line on every land (ver-X K M2).

## R14. The splice, never a re-serialisation

**Decision**: `spliceJsonList(raw, json, lines)`, a pure function in the new
`src/lib/json-splice.ts` (no fs, no git); `writeIgnores` branches on `spec.graphignoreJson`
(FR-020). Validate with `JSON.parse`: a top-level object with the key absent or an array of
strings is accepted; anything else — invalid JSON, comments, a BOM, a non-array value, a
top-level array — is left byte-identical and `writeIgnores` warns naming the line (codegraph
ignores those files too). Insert at the text level into the LAST top-level occurrence of the key
(JSON.parse and codegraph keep the last): a multi-line array gets `,` plus the file's EOL, the
previous element's indentation and the quoted line; an inline array `, "<line>"`; an empty
array `"<line>"`. Key absent: `"exclude": [<lines>]` after the last top-level member, or into
`{}`, with the top-level members' indentation, never a nested one's. Missing or empty file:
`{\n  "exclude": [\n    "<line>"\n  ]\n}\n` — 38 B for `/.brain/`. A line is quoted with
`JSON.stringify(line)`; no object is ever serialised.

**Rationale**: re-serialising a human's `codegraph.json` dropped a duplicate key, its CRLFs and
a number's digits (`1.50` → `1.5`) (ver-G K M1, ver-X K). Measured (ver-G K, `splice.mjs`,
`more.mjs`): **13 of 13 cases** keep every byte — CRLF, one-line, human keys, numbers,
duplicate key, no trailing newline, escapes, inline and multi-line absent key, `{}`, empty
array, tabs; output minus the inserted span equals the input; idempotent; valid JSON. With
real codegraph, `init .` on the spliced CRLF and one-line files dropped the mount and `legacy/`
(2,252 → 3 nodes) with no warning. The prototype took a nested member's indentation for an
absent key; the rule is the top-level members' (ver-G K).

## R15. The skip reads all four lists

**Decision**: a line `/x/` is skipped when any list in `reads` (`exclude`, `include`,
`includeIgnored`, `deprioritize`) holds `x`, `x/`, `/x`, `/x/`, `x/**` or `/x/**` (measured
equivalent, inv K), a negation of one (`!/.brain/`, the human's opt-in), or a path under `x`
(`/.brain/test/`); a skip over the last three prints `graph codegraph @ <scope>: /.brain/ not
added to codegraph.json — its "deprioritize" names it, which is yours` (108 B) (FR-021).

**Rationale** (ver-G K M2): a human's `deprioritize: [".brain/"]` kept 2,247 mount nodes, and
the naive append to `exclude` dropped them to 0, because `exclude` wins; `includeIgnored:
["packages/"]` was overridden the same way.

## R16. When the lines are written, and land's local branch

**Decision** (FR-022): where #5 writes ignore lines — before a root's first build
(`ensureGraphs`), so a consumer's first index at `repos sync` already excludes the mount; and at
`change land`, in the checkout holding the change's branch, when `codegraph.json` is committed
at its HEAD or absent both there and in the repo's own checkout (#5's rule). At land:

- `git -C <dir> check-ignore -q codegraph.json` hitting is refused by name (140 B):
  `<key>: codegraph.json is ignored in <dir> — \`git -C <dir> check-ignore -v codegraph.json\`
  names the rule; nothing was written` — today `commitBookkeeping` would silently commit
  nothing (change.ts:96-97 at 92c4c08, ver-G K m);
- when it appended: `commitBookkeeping(dir, ['codegraph.json'], \`graph: ${slug} — codegraph
  keeps ${lines} out of its index\`)`, alone (60 B subject for one line);
- where the rule does not allow a write (an untracked copy in the repo's own checkout), land
  says nothing for a local artifact; `doctor` names the file (FR-023). The worktree's index is
  the same either way: its mount is empty (ver-X K m).

Never in `indexWorktree`, `doors`, `doctor`, `verify`, or `repos sync` over a built root (#5's
`writeIgnores` `absent` leg over `{doors,doctor,verify,repos}.ts`). `indexWorktree` never calls
`writeIgnores`: an untracked `codegraph.json` in a change's checkout would be named at land and
keep the worktree at close (ver-G K).

**`doctor`** (FR-023), through `readIgnoreLines(spec, dir)`, the one reader for doctor and land,
branching on `graphignoreJson` and normalising spellings as R15: ` · codegraph.json lacks N
line(s) multivac keeps out of the index (/.brain/) — the next \`change land\` naming <k> adds
them`; ` · codegraph.json is not committed — a clone or worktree with its mount initialised
indexes the mount`; ` · codegraph.json does not parse to an object with an "exclude" list —
codegraph ignores it too; add /.brain/ by hand`. No "holds nodes" fact: that would read SQLite,
outside MV-124's files-only probe, and `sync` heals it.

**#5's readers** (FR-024): `holdsIgnored` returns false unless `spec.rebuild` is declared
(codegraph has none, so a 12 MB SQLite is never JSON-parsed; ver-X K); `leftoverGraphs` counts
a `graphignoreFile` only beside the grapher's artifact or state directory, so a human's
`codegraph.json` alone is never reported as a leftover (ver-G K).

## R17. The mount's normal form

**Decision**: `export function mountDir(cfg)` in code-in-change.ts — `posix.normalize(cfg.mount)`,
strip a leading `./` and a trailing `/`; `undefined` for an absolute path or one starting with
`..`, and no line is written for those. `graphIgnoreLines` uses it for graphify's
`.graphifyignore` too (FR-025).

**Rationale** (ver-X K M3): `/./.brain/`, `./.brain/` and `/.brain//` left the mount indexed
(12 nodes, 10 from the mount) for both codegraph and graphify, while `/.brain/` gave 2. git
records `path = .brain` for `git submodule add … ./.brain`. The code gate's own `${cfg.mount}/**`
in `nonCodeGlobs` with a `./`-spelled mount is unmeasured (no owner); `mountDir` is exported so
the gate can reuse it later.

## R18. The verbs, per question

**Decision**: codegraph's `queries` become four (FR-026), with a comment above them recording
the measurement and what was left out; MV-61's `codegraph query <symbol>` stays spelled once
(the comment never repeats it).

```ts
{ run: 'codegraph query <symbol>', answers: "a name's definitions and imports, each with kind, file:line and signature, best 10 first (`--limit N`)" },
{ run: 'codegraph callers <symbol>', answers: 'the functions calling it, with file:line, module-level callers as their file — 20 unless `--limit N`, counted as listed; aliased imports missed, same-named symbols merged' },
{ run: 'codegraph impact <symbol>', answers: 'what may break if it changes: symbols and tests within two calls, by file — a lower bound; aliased imports missed, same-named symbols merged' },
{ run: 'codegraph node <symbol>', answers: 'its body with line numbers, what it calls and its callers; `-f <file>`, spelled as answers print it, picks one of several same-named' },
```

**Measurements** — this repository's `src/` and `test/` (141 files), all 318 top-level
functions and 52 files (`…/verify-verbs-measurement/{m.sh,all.sh}`, outputs
`out/{all,q1all,q3all}.tsv`, ver-M V):

| Question | Verb | Against what an agent runs | Result |
| --- | --- | --- | --- |
| Where is X defined | `query` | narrowed definition grep | **larger for 311/318**, median 3.43×, +312 B mean; no saving; kept because MV-61 pins it and it adds the signature |
| Who calls X | `callers --limit 500` | `grep -rn 'X(' src test` | smaller for 316/318, median 2.01×, median −132 B; names the calling function; ≥549 B saved for 49/318 |
| What breaks if X changes | `impact` | one-level `grep -rn 'X('` | smaller for 182/318, median 1.10×, median −24 B; the value is reach (two calls, tests), a lower bound |
| Show me X's body | `node` | definition grep + 60-line Read | smaller for 235/318, median 2.07×, median −1,560 B; p10 0.54 (1.85× more); does not replace the Read an Edit needs |
| What does file Y hold | `node -f --symbols-only` (dropped) | `grep -n '^export'` | larger for 52/52, median 3.3× |

- Latency 250–410 ms per codegraph call (inv V 253–282, ver-M V 340–409), against under 10 ms
  for grep.
- `codegraph callers adapterFor` prints header `(20)`, and `(36)` with `--limit 500`: the header
  counts what it lists (inv V).
- `callers` and `impact` merge same-named symbols and miss calls made through an aliased import:
  `run` imported as `git` in seven files (ver-X V M6); in Python `callers` missed method calls
  named `add` (ver-X V); completeness was checked on TypeScript direct imports only.
- `codegraph node grapherLines` prints "2 definitions named" (10,399 B); with `-f
  src/doors/brain.ts` 3,537 B; `-f ../web/src/…` prints "No indexed file matches", rc=0 — the
  path matches only as the index prints it (inv V, ver-X V M1).
- `--limit 1` hides a second definition and is never printed; `--kind` and `--json` stay in the
  tool's `--help`.
- A sentence handed to `codegraph query` returns name matches for its words (1,435 B for one
  sentence, inv V) — the comment "Handing this a sentence returns nothing useful" is false.
- Left out, and the registry comment says why: `explore` 15.7–17.2 KB per call; `context` found
  the expected symbol in 2 of 5 sentences; `files` is what Glob does; `affected` is not a
  navigation question; `callees` repeats `node`'s trail; `--symbols-only` never beat
  `grep '^export'` (0 of 52 files).
- What repays the door's +533 B: one `node` call usually does (220 of 318 functions save
  ≥549 B against a 60-line Read); `callers` only for heavily called symbols; `query` and
  `impact` do not, by bytes (ver-M V; "one question repays the door" restated).

**Alternatives considered**: five verbs (inv V, +549 B without caveats) — `--symbols-only`
dropped; trimming to `callers` and `node` by amending MV-61's leg — the human's call, taken at
the default of four (spec Assumptions).

## R19. The header's claim is refuted, at every copy

**Decision**: the list header (brain.ts:136 on 62d4588) becomes `  ${ASK} These are this
tool's own verbs, not a generic one — each line says what it answers:` — 125 B with its
newline, 6 B shorter; graphify's list branch (a door citing no vendor section) loses the same
6 B (FR-027). Every copy of the retired claims is rewritten (FR-030), paraphrases included
(critic gap 6).

**Rationale**: `codegraph query` printed more than a narrowed definition grep for 311 of 318
functions (R18); graphify's path cost 2.1 to 2.6 times one (#5, MV-148). The investigator's
"It answers in one call what grep takes many" is refuted for both graphers.

**The copies** (plan, on 62d4588, `git grep -n -E` with the pathspecs of MV-121's scope and
root-only `*.md`, as `verify` matches it through picomatch):

```text
RE='sentence and you get nothing|sentence returns nothing|in (one|a single) call what (grep|a search) takes many|one call answers what a search|^takes many'
.claude/skills/multivac/SKILL.md:117  … one call answers what a search
.claude/skills/multivac/SKILL.md:118  takes many — and use **that tool's own verbs** …
.claude/skills/multivac/SKILL.md:125  Hand `codegraph` a sentence and you get nothing; …
site/content/docs/concepts/composition.md:78  query answers in a single call what a search takes many, …
site/content/docs/reference/graphers-and-sdd.md:156  Hand `codegraph` a sentence and you get nothing useful; …
skills/multivac/SKILL.md:117, :118, :125  (as the copy)
src/adapters/registry.ts:1144  // Symbol lookup, NOT a question. Handing this a sentence returns nothing
src/doors/brain.ts:136  `  ${ask} It answers in one call what grep takes many, and it is this tool's verbs, …`
→ 10 lines in 6 files of 882 tracked
```

The design's regex found 5 (both SKILL.md copies :125, the site :156, registry.ts, brain.ts); the
critic's `grep -rn "takes many"` found the SKILL.md :117-118 paraphrase (split across two lines,
so a per-line regex needs `one call answers what a search` and `^takes many`) and composition.md
:78. `.multivac/changes/archive/two-graphers-and-what-each-one-answers.md:42` is outside the
scope (root `*.md` only) and stays: it is history. #5's T067/T068 edit composition.md :77-80
and SKILL.md :113-136; T001 re-runs this count on the tree with #5 merged. The two tests that
assert the retired header, `test/doors/graph-navigation.test.ts:37` and `:45`
(`/ASK IT BEFORE READING THE TREE RAW\. It answers in one call/`), match the new header instead;
the retired phrase is never written into a `doesNotMatch`, since the `absent` leg scans `test/**`
(critic gap 4).

## R20. What the agent's own codegraph calls write and send

**Decision**: FR-V4's disclosure **replaces** #4's sentence in codegraph's `note` — "The
`codegraph query` a door prints runs in the agent's own environment and carries none of that
`env`: the opt-outs above reach it only when set there (MV-147)." — rather than following it
(critic gap 5). The site's two sentences — "The `codegraph query` a door prints runs in your
agent's environment too, so codegraph's variables reach it only when that environment sets
them." and "Whether codegraph honours its variables was read from its source and docs, not
measured on the network." — are rewritten (FR-029, FR-033). The door carries 0 telemetry
bytes. The disclosure's text (contracts/cli-output.md *The codegraph entry*) never repeats
MV-62's `TELEMETRY IS ON BY DEFAULT` or `codegraph telemetry off`, each `unique`.

**Measurements** (1.6.0, HOME isolated, a local recorder as the telemetry endpoint, strace, and
read from its dist; inv V, ver-G V, ver-X V):

- Where npm installed the platform bundle, `query`, `callers`, `impact` and `node` open no
  socket; each appends one count per command name and UTC day to
  `~/.codegraph/telemetry-queue.jsonl`.
- That queue is sent to `telemetry.getcodegraph.com` — with a machine id minted then, the
  version, OS, architecture, Node major and a CI flag — by the first `init`, `uninit`,
  `index`, `sync` or `upgrade` run without an opt-out once its day is past, by
  `codegraph install`, and by the MCP server it registers, at start and every six hours. A
  back-dated queue was POSTed by the next un-opted `sync` (inv V, recorder).
- `init` and `index` also send an `index` event (languages, coarse file-count and duration
  buckets) at once; `uninit` an `uninstall` event.
- Where npm did not deliver the platform bundle, the npm shim downloads it from GitHub Releases
  into `~/.codegraph/bundles` on any command, these verbs included, whatever DO_NOT_TRACK or
  CODEGRAPH_TELEMETRY say (`node npm-shim.js query x`, ver-G V BLOCKING, ver-X V M3);
  `CODEGRAPH_NO_DOWNLOAD=1` stops it.
- With the opt-outs set, `codegraph query` and `codegraph sync` leave the queue's md5 unchanged
  (inv W): multivac's own runs carry `env`, so they record and send nothing.
- The printed `codegraph init` and `codegraph uninit --force` (doctor, the graph gate, #5's
  leftover removal) are run by a human; they are covered by the same disclosure.

**Alternatives considered**: a door clause (173 B measured) or `CODEGRAPH_TELEMETRY: "0"` and
`CODEGRAPH_NO_DOWNLOAD: "1"` in the claude harness settings `env` (not `DO_NOT_TRACK`, which
Claude Code reads itself) — a decision about the user's machine, the same as #4's §10 item 2;
the human's (spec Assumptions). The design's first note said the verbs "open no socket"
unconditionally — false without the bundle (ver-G V BLOCKING).

## R21. What it costs and saves, per door shape

**#6 is correctness first. Bytes are near neutral; apply takes longer.**

| Shape (per session read) | Delta | Source |
| --- | --- | --- |
| A codegraph consumer; brain==code on codegraph | +533 B (block 449 → 982 with a post-edit door, 468 → 1,001 without) | synth `final.mjs`, critic `blk.mjs`, plan |
| brain==code on codegraph, the brain==code line | +172 B (269 → 441) | plan |
| brain==code on codegraph with codegraph siblings | +533 + 172 B, and the dedup line (58 B) in place of 700 B of relisted verbs (the sibling group 1,090 → 390 B) | plan |
| Code-less brain, one codegraph group | +683 B (#5's 728 → 1,411; 1,424 with the lifecycle freshness) | plan |
| graphify list branch (no section door) | −6 B (header) | plan |
| This brain (graphify, cites its section) | 0 B | R22 |

apply time per codegraph repo: `init` 1.1–7.0 s by size, summed over the named repos, twice on
a repo's first apply; re-apply or land 0.29–0.81 s. Disk per live worktree 4.0–35.8 MB, freed at
close. Correctness: 19 missing and 24 misplaced symbols → 0 (R1); a mixed brain's codegraph
edits refreshed by their own hook instead of never (R10); a consumer's index 2,254 → 7 nodes
(R12).

## R22. Composition with #3, #4 and #5, and rows left alone

- **#5 lands first.** This change amends MV-148 by note and flips #5's codegraph texts: the
  where-block group line and `<checkout>` (#5 FR-003), the pointer (#5 FR-007), the brain==code
  codegraph line (#5 FR-005), one hook per grapher in place of "none wired" (#5 FR-012/FR-013),
  codegraph's ignore lines (#5 FR-026/FR-031). #5's tests that pin the old texts are rewritten
  here (R25). #5's fallback line, its forced removal and its follow guard are reused unchanged.
- **Hook bytes.** #5 pins the brain==code, consumer and follow hooks (492/558/540/606 B). The
  key is the artifact test already in every hook since MV-140, so identity adds 0 bytes; the
  extra hooks in mixed brains are #5's follow form, one per grapher.
- **MV-124 / #4.** #4's note says the entry's `env` reaches no printed command. #6's build and
  land sync go through `refreshGraph` → `runDeclared`, so they carry `env`; the printed verbs
  carry none, and are disclosed (R20).
- **MV-121 / #4.** #4's MV-147 note on MV-121 makes the disclosure cover what an entry PRINTS
  and says "measuring what the printed grapher queries send is codegraph-worktrees-and-verbs'";
  #6's MV-121 note is that disclosure for codegraph.
- **MV-50 / MV-103.** refresh.ts still never runs git: the two git reads (`check-ignore`,
  `rev-parse --git-common-dir`) and the `info/exclude` write live in change.ts, like #5's land
  ignore step; `spliceJsonList` is pure; the `codegraph.json` HEAD read is in change.ts and
  doctor.ts.
- **MV-125.** apply's build and exclude write run after `refuseReadOnly`; land's writes after
  `commitGraph`'s `readOnly` check; no new `.readOnly) continue;` spelling.
- **Rows examined and left alone**: MV-123 (the lookup is unchanged, asked in the root the
  command runs in; the one line is `refreshGraph`'s); MV-125; MV-137 (`codegraph.json` becomes
  non-code through `graphignoreFile`, as `.graphifyignore` is, and MV-149 states it); MV-50,
  MV-103; MV-90 (a local artifact is still judged "built in the checkout that closes"; worktree
  indexes are not gated); MV-25 (#5's note — apply prints what reaches each checkout's graph —
  stays true); MV-131 (codegraph's harness install still unmeasured); MV-62 (its note still
  names the telemetry and the opt-out); MV-146, MV-147.
- **This brain** (graphify brain==code, `brain: .`): `indexWorktree` returns at `artifactKind
  !== 'local'`, so no codegraph worktree is built and no `codegraph.json` written; `AGENTS.md`
  cites graphify's section (`sectionDoors` non-empty), so the reworded header does not appear
  and no byte of the door changes; `brainRefreshGraphers` gives `[{ graphify, follow: false }]`,
  one hook, byte-identical (T9); `.claude/skills/multivac/SKILL.md` is re-copied by `doors`.

## R23. Legs

Dialect: POSIX ERE through `git grep`, per `skills/multivac/references/anchors.md`: no `\s`,
`\d`, `\w` or `\b`; one include glob per leg, braces for alternates. Today's counts (plan, on
62d4588): every new name — `indexWorktree|excludeLocalOutputs|refreshKey|ensureRefreshes|function
rewrite\(|spliceJsonList|mountDir|brainRefreshGraphers|readIgnoreLines|refreshHookOf|graphignoreJson|graphignoreScope|as
of this apply|Never run the|which it does not resolve|hookRefreshes` — 1 match over `src/**`, the
comment at `src/adapters/sdd.ts` ("Never run the"), outside every leg's file;
`'rev-parse', '--git-common-dir'` 0 in change.ts (1 in `src/hooks/install.ts`, outside the leg);
`child\.stdin` 0 in refresh.ts (2 in git.ts, outside); `telemetry-queue`, `codegraph\.json` 0;
the seven test titles 0 over `test/**`; the two site headings 0; `run: 'codegraph (query|callers|impact|node) `
1 in registry.ts; the retired-phrase regex 10 lines in 6 files (R19); the superseded-sentence
regex 2 (registry.ts:1154's note, the site's :367). T001 re-runs them with #5 merged.

**New legs, MV-149** (34):

```text
<!-- @anchor MV-149 brain:src/commands/change.ts /^async function indexWorktree\(/ unique -->
<!-- @anchor MV-149 brain:src/commands/change.ts /await indexWorktree\(/ unique -->
<!-- @anchor MV-149 brain:src/commands/change.ts /'rev-parse', '--git-common-dir'/ unique -->
<!-- @anchor MV-149 brain:src/commands/change.ts /await excludeLocalOutputs\(/ count=2 -->
<!-- @anchor MV-149 brain:src/adapters/refresh.ts /\.child\.stdin\?\.end\(\)/ unique -->
<!-- @anchor MV-149 brain:src/doors/settings.ts /export function refreshKey\(/ unique -->
<!-- @anchor MV-149 brain:src/doors/settings.ts /^function ensureRefreshes\(/ unique -->
<!-- @anchor MV-149 brain:src/doors/settings.ts /^function rewrite\(/ unique -->
<!-- @anchor MV-149 brain:src/adapters/detect.ts /export function hookRefreshes\(/ unique -->
<!-- @anchor MV-149 brain:src/adapters/registry.ts /graphignoreFile: 'codegraph\.json'/ unique -->
<!-- @anchor MV-149 brain:src/adapters/registry.ts /graphignoreJson: \{ key: 'exclude', reads: \['exclude', 'include', 'includeIgnored', 'deprioritize'\] \}/ unique -->
<!-- @anchor MV-149 brain:src/adapters/registry.ts /graphignoreScope: 'structure'/ unique -->
<!-- @anchor MV-149 brain:src/lib/json-splice.ts /export function spliceJsonList\(/ unique -->
<!-- @anchor MV-149 brain:src/lib/json-splice.ts /JSON\.stringify\([A-Za-z_.]+, null/ absent -->
<!-- @anchor MV-149 brain:src/lib/code-in-change.ts /export function mountDir\(/ unique -->
<!-- @anchor MV-149 brain:src/adapters/registry.ts /run: 'codegraph (query|callers|impact|node) / count=4 -->
<!-- @anchor MV-149 brain:src/adapters/registry.ts /telemetry-queue\.jsonl/ unique -->
<!-- @anchor MV-149 brain:src/adapters/registry.ts /CODEGRAPH_NO_DOWNLOAD=1 where the agent runs/ unique -->
<!-- @anchor MV-149 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /sentence and you get nothing|sentence returns nothing|in (one|a single) call what (grep|a search) takes many|one call answers what a search|^takes many/ absent -->
<!-- @anchor MV-149 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /opt-outs above reach it only when set there|honours its variables was read from its source and docs/ absent -->
<!-- @anchor MV-149 brain:src/commands/change.ts /as of this apply, refreshed again at `change land`/ unique -->
<!-- @anchor MV-149 brain:src/doors/brain.ts /here `apply` printed no such line/ count=2 -->
<!-- @anchor MV-149 brain:src/doors/brain.ts /Never run the `codegraph init` its notices suggest/ unique -->
<!-- @anchor MV-149 brain:src/commands/doctor.ts /, which it does not resolve — / unique -->
<!-- @anchor MV-149 brain:test/change/graph-where.test.ts /apply builds a local index in each checkout it hands out, never a shared one/ unique -->
<!-- @anchor MV-149 brain:test/change/graph-where.test.ts /a prompt on the grapher's stdin never hangs apply/ unique -->
<!-- @anchor MV-149 brain:test/change/graph-where.test.ts /the worktree index leaves the worktree clean and goes with it at close/ unique -->
<!-- @anchor MV-149 brain:test/doors/settings.test.ts /one refresh hook per grapher, each re-rendered and removed by its artifact/ unique -->
<!-- @anchor MV-149 brain:test/doors/graph-navigation.test.ts /two graphers, one hook each, each refreshing only its own repos/ unique -->
<!-- @anchor MV-149 brain:test/change/vendor-state.test.ts /codegraph's lines are spliced into codegraph\.json, every other byte kept/ unique -->
<!-- @anchor MV-149 brain:test/doctor/adapters.test.ts /codegraph records four verbs, each with what it misses/ unique -->
<!-- @anchor MV-149 brain:site/content/docs/reference/graphers-and-sdd.md /^### A change's own codegraph index$/ unique -->
<!-- @anchor MV-149 brain:site/content/docs/reference/graphers-and-sdd.md /^### One post-edit hook per grapher$/ unique -->
<!-- @anchor MV-149 brain:.multivac/invariants.md /Amended [0-9-]+ by MV-149/ count=10 -->
```

The design's 31, plus three the critic's fixes and the one-predicate decision need: the exclude
step's two calls, apply and land (gap 8); the superseded telemetry sentences at every copy
(gap 5); `hookRefreshes`, the one predicate four surfaces read (FR-016). The retired-phrase leg
is widened (gap 6).

**Legs that move** (each by the task whose code makes the old one false: T035 for MV-148, T037 for MV-124 and MV-140):

| Row | Old | New | Why |
| --- | --- | --- | --- |
| MV-124 | `src/commands/doors.ts /refresh, spec\?\.env \?\? \{\}, notices, / unique` | `src/commands/doors.ts /env: spec\.env \?\? \{\}, artifact: spec\.artifacts\[0\]/ unique` | `installHookConfig` takes a list, built by `refreshHookOf(spec, follow)`, spelled `{ refresh: spec.refresh, env: spec.env ?? {}, artifact: spec.artifacts[0], follow }` |
| MV-140 | `src/commands/doors.ts /notices, spec\?\.artifacts\[0\], follow\)/ unique` (#5's spelling) | `src/commands/doors.ts /artifact: spec\.artifacts\[0\], follow \}/ unique` | the same builder |
| MV-148 | `src/adapters/detect.ts /export function brainRefreshGrapher\(/ unique` | `src/adapters/detect.ts /export function brainRefreshGraphers\(/ unique` | the resolver returns a list; the old regex needs `(` right after `Grapher`, so it would read 0 |

**Unchanged and still green**, checked against the planned spellings: MV-52 `missingRequired\(spec,
dir\)` unique in doors.ts (the brain's own lookup, once; #5's `missingRequired(spec, root.dir)`
for code repos), `refresh path: ` kept, `export function refreshHookCmd`; MV-52 and MV-74 test
legs (`backgrounded, coalesced, never a failure`, `takes our hook, not the entry a user shares
with it`, `an update rewrites one hook, not the entry around it`, `a duplicate is reported,
never deleted`, `no grapher declared: no refresh entry at all`, `harness post-edit entry, git
shim untouched`) pass through the one-element sugar (inv K T6b, T7); MV-58 `export const
GRAPH_LOCK`, `await mkdir\(lock\)`; MV-61 `codegraph query <symbol>` unique, `export interface
GrapherQuery`, `ASK IT BEFORE READING THE TREE RAW` unique (#5's constant), `has NO query
command` unique, the test title 'a grapher states its own query verbs — they are not
interchangeable'; MV-62 `TELEMETRY IS ON BY DEFAULT`, `codegraph telemetry off`, its test title;
MV-74 `for \(const h of hooks\)` (it sits in `ourHooks`, which the rewrite does not touch — critic),
`m\.hook\.command = command` and `m\.hook\.type = 'command'` unique (one `rewrite`),
`const covers = mine\.some`, `added its own entry beside yours`; MV-115 `execFileP\('sh',
\['-c', run\]` (critic); MV-123 `localBin\(dir\)\]` unique, `found on neither PATH nor` unique,
`binaryMissing\(` each; MV-124 `\.state === 'installed'\) continue; // already built here` unique
(`ensureGraphs` unchanged, `indexWorktree` has no skip), `\.\.\.spec\.env` each over sdd and
refresh, `artifacts: \['\.codegraph\/codegraph\.db'\]` and `artifactKind: 'local'` unique;
MV-128 `graphignoreFile: '\.graphifyignore'` unique, #5's `await writeIgnores\(s\.name, spec,
s\.dir, s\.scope, ` unique; MV-148 `change.ts /await writeIgnores\(/` unique (`commitGraph` keeps
one call for both artifact kinds), `gitignore: false` unique, `askAt: '-p \{checkout\}'` unique,
`paths in its answers are relative to` each over brain and change, `settings.ts /--force/`
absent, the hook guard, `export async function leftoverGraphs\(` unique, `export async function
holdsIgnored\(` unique, `\['worktree', 'remove', '--force', wt\]` unique; MV-50/MV-52
`refresh.ts /'git'|gitRun/` absent; MV-103 `refresh.ts /inHead|graphTrackedGate/` absent;
MV-125 the `count=6` skip leg and `await refuseReadOnly\(` `count=2`; MV-132's `absent` leg in
repo-state.ts; MV-134 `^async function commitGraph\(` and its call unique; MV-140 `: 'refreshed
at \`change land\` and \`change close\`';` unique in brain.ts (the pointer's wording is a
different string, in change.ts), `rev-parse --show-toplevel 2>\/dev\/null\); ` \+` unique (hook
bytes unchanged), `runs in the repo of the edited file when it holds the graph` unique.

**Spelling rules the legs rely on**:

- `indexWorktree` is called once, in `cmdApply`'s workspace loop; `excludeLocalOutputs` is
  awaited twice in change.ts, in `indexWorktree` and in `commitGraph`.
- The common-dir read is `gitRun(ws, ['rev-parse', '--git-common-dir'])`, resolved against `ws`.
- `runDeclared` spells `const p = execFileP('sh', ['-c', run], { … }); p.child.stdin?.end();
  await p;`, its `env` line with `localBin(dir)]` unchanged.
- `rewrite(m, command)` holds `m.hook.command = command;` and `m.hook.type = 'command';` once
  each; `ensureEvent` and `ensureRefreshes` both call it.
- The splice quotes a string with `JSON.stringify(line)` and never serialises an object.
- **Quoted strings, never template literals** (critic gap 3). A leg matches the source text, so
  a clause holding backticks is spelled in a single- or double-quoted string literal, as MV-140's
  `: 'refreshed at \`change land\` and \`change close\`';` is — inside a template literal the
  source reads `` \` `` and the leg's plain backtick does not match (critic, `grep -cE` over
  `leg.ts`: "Never run…" 0 in a template literal; "here `apply`…" 1, not 2). So: the brain==code
  codegraph line's clause "Where \`apply\` printed no such line, …" and its closing sentence
  "Never run the \`codegraph init\` its notices suggest." are quoted strings (concatenated with
  `+` where the line interpolates); the group line's clause "where \`apply\` printed no such line,
  …" is a quoted constant concatenated into the line; the pointer's `'as of this apply, refreshed
  again at \`change land\`'` is a quoted string in change.ts. The fallback clause appears twice
  in brain.ts ("Where" and "where"), hence `count=2`.
- The registry's measurement comment above codegraph's `queries` never repeats the literal
  `codegraph query <symbol>`, so MV-61's `unique` leg stays at 1.
- `refreshHookOf(spec, follow)` in doors.ts is the one place a `RefreshHook` is built.
- New text in code, strings, comments and docs matches no existing `absent` leg. Phrases to
  avoid, with the row whose leg reads them (from #5's R17 and this change's dry run): MV-124
  ``(at|has no) `\.codegraph` `` and `` `.codegraph` | `` (write `` `.codegraph/` `` or
  `.codegraph/codegraph.db`, never a bare `` `.codegraph` `` code span); MV-123 `is not on PATH`
  (write "found on neither PATH nor" or "not reachable from"); MV-125 `every declared, present
  repo`; MV-146 `in every repo where … is installed`; MV-121 ``leaves `.claude/settings.json`
  alone``; MV-84 `[0-9]+\.[0-9]+\.[0-9]+` and MV-126 `mv-[0-9]+` over `site/content/**` (the site
  says "the version the registry entry records"); and the two MV-149 `absent` regexes above.
  T074 runs every `absent` leg over the tree (the prose check).

## R24. The law as it will be written

**MV-149**, filed into the row `change new` reserves (`| MV-149 | RESERVED by change
codegraph-worktrees-and-verbs — state the rule here before close. | open | proposed | … |`), one
physical line, wrapped here for reading:

```text
| MV-149 | **A local index is built in each checkout a change hands out, codegraph's door lists the verbs that were run with what each misses, every grapher the brain's session edits gets its own post-edit hook, and a consumer's codegraph index keeps the mounted brain out.** Measured 2026-09-28 and 2026-09-29 with codegraph 1.6.0, graphify 0.9.29, git 2.43.0 and mvac 0.14.1, in scratch ecosystems with HOME and GIT_CONFIG_GLOBAL isolated. `change apply` built no index in the worktrees it made, and codegraph asked from one answered from the nearest index above it with exit 0: on a real branch the trunk index lacked 19 branch-only symbols and put 24 of 192 moved ones more than 60 lines off, and a sibling's worktree nested in a codegraph brain==code brain answered with the brain's code. `codegraph init` in a worktree took 1.1 to 1.4 s and 4.0 MB for 52 files and 7.0 s and 35.8 MB for 1,012, and `codegraph sync` after one edit 0.55 to 0.81 s. With its file watcher off (`CODEGRAPH_NO_WATCH=1`, or WSL on a `/mnt` path) `codegraph init` waits on a prompt: through multivac's runner, which left the child's stdin open, it had not returned after 30 s, and with stdin closed it exited 0 in 851 ms and wrote no git hook. In a sibling repo whose `.codegraph/` line MV-128 wrote and nobody committed, an index in a worktree showed `?? .codegraph/`, `change close` kept the worktree as holding uncommitted work, and `git add -A` staged codegraph's `.codegraph/.gitignore`; the line in the repository's common `info/exclude` cleared both in every checkout, and the worktree's own `info/exclude` was not read. In a repo whose `.gitignore` held only `*.db`, git ignored the database and still listed `?? .codegraph/`, codegraph's own `.gitignore` un-ignoring itself. The door listed one verb and said the graph answers in one call what grep takes many: over this repository's 318 top-level functions `codegraph query` printed more than a narrowed definition grep for 311, while `node` printed less than that grep plus a 60-line Read for 235, a median 2.07 times less, `callers` less than a call-site grep for 316 and `impact` for 182; `callers` listed 20 by default and counted what it listed, 20 of 36; `callers` and `impact` merged same-named symbols and missed calls made through an aliased import, `run` imported as `git` in seven files; and `node -f` matched a path only as its answers print it. The printed verbs opened no socket where npm installed the platform bundle and queued one count per command and day in `~/.codegraph/telemetry-queue.jsonl`, which a later `init`, `uninit`, `index`, `sync` or `upgrade` run without an opt-out, `codegraph install` or its MCP server sends; without the bundle the npm shim downloaded it from GitHub Releases whatever DO_NOT_TRACK said. One refresh hook served a brain: a code-less brain whose repos resolve graphify and codegraph wired none, and in a graphify brain==code brain an edit in a codegraph sibling's worktree refreshed the brain's graph and left the sibling's index without the edit. A consumer of this brain indexed 2,254 nodes, 2,247 of them the mount, and `callers add` answered with the brain's callers; `codegraph.json`'s `exclude` left 7, a `.gitignore` line made a later `git submodule add` of the mount exit 128, and re-serialising a human's `codegraph.json` dropped a duplicate key, its CRLFs and a number's digits. **The rule.** *Indexed.* For a grapher whose artifact is local, `change apply` asks MV-123's lookup in each checkout it hands out, the change's worktree or the repo branched in place, and where the binary is found builds the index there, or syncs the one there, through the one runner with the entry's `env` under that checkout's lock; where it is not found there, apply builds nothing and says so once, naming the checkout, unless its equip of that repo has just said it. Before that, each line of the entry's `ignore` that git does not ignore in that checkout, asked of the line itself, is appended to the repository's common `info/exclude`, never to a tracked file, and apply says so. `change land`, in the checkout holding the change's branch, runs the same exclude step, writes the grapher's own ignore file under MV-148's rule, never `.gitignore`, syncs or builds the index and commits no index, and `change close` removes it with the worktree. A shared artifact gets nothing at apply: the branch carries its committed graph. Every command the grapher runner spawns has its stdin closed. `change apply` prints `its index: -p <checkout>` only where the index is installed, saying `refreshed after your edits` where a declared door has the post-edit hook and the brain wires this grapher's hook, else `as of this apply, refreshed again at \`change land\``, and MV-148's fallback everywhere else. The doors say a change's worktree gets its index at `change apply`, which prints that line, and that where it printed none `-p` at the worktree answers from the nearest index above it; the brain==code door, where codegraph's notice about another worktree can appear, says the `codegraph init` it suggests is not the agent's to run. Every surface that says what land does with a graph says a local index is synced there and never committed. *Asked.* codegraph's `queries` are `query`, `callers`, `impact` and `node`, each run on 1.6.0, each answer naming what that verb misses, and the verb list claims no saving over grep; the claims that a sentence gets nothing from codegraph and that one graph call answers what a search takes many are retired at every copy, in any wording. The entry's note discloses by version what the agent's own codegraph calls write and send, the npm shim's download included, with the opt-outs spelled for where the agent runs, in place of the sentence that said only that its `env` does not reach them. *Followed.* The brain's session gets one post-edit hook per grapher: the brain's own where it holds code, keeping its bytes, and a follow hook for each other grapher its writable code repos resolve, each wired where MV-123's lookup finds its binary on PATH or in each of those repos. A refresh hook is ours by its lock preamble and a grapher's by the artifact its toplevel test names; an update rewrites each grapher's own hooks in place, a hook of ours naming no wanted artifact is taken over, inside its entry, by a grapher still without one, else removed, and graphers declaring one artifact get no follow hook, with a notice. The door, the apply pointer, flow.md and `doctor` ask one question before saying "after your edits". `doctor` names a writable repo holding the artifact of a grapher it does not resolve while that grapher's hook is wired, with its removal. *Kept out.* codegraph's ignore file is `codegraph.json` and its lines go into its `exclude` array: only the structural lines, the mount in a code repo whose brain holds code and the nested declared repos, with the mount written as git records it. They are spliced into the text, which is never re-serialised, and never over a line that `exclude`, `include`, `includeIgnored` or `deprioritize` already names in any spelling, negated, or naming a path under it; a file that does not parse to an object with a string array there is left as it is and named. They are written where MV-148 writes ignore lines, committed alone by `change land`, never by the build in a change's checkout, and the file is not code (MV-137). **What is mechanical**: `unique` legs on apply's build and its call, the common-dir read, the closed stdin, the hook's key, the per-grapher merge and its rewrite, the one freshness predicate, codegraph's ignore file, key and scope, the splice, the mount's normal form, the pointer's freshness, the door's notice clause, the note's two disclosures and doctor's line; `count` legs on the exclude step's two calls, the doors' fallback clause and the four verb runs; `absent` legs on the retired phrases, on the superseded telemetry sentences and on re-serialising; test legs; site legs; a count on the ten amendment notes. **Ceilings.** An index is as fresh as the last apply, land, close or hook run: an edit made through Bash is not in it, and `callers` and `impact` read while the hook's sync runs are partial, 31 of 35 callers in 12 of 12 trials. A codegraph found only in a repo's `node_modules/.bin` builds no worktree index, since a worktree has no `node_modules` and neither the hook nor the agent's shell reaches that copy, and the door names the bare `codegraph`. A worktree's mount is empty, so its index never holds the mounted brain, and a consumer indexed before its mount holds the mount until `codegraph.json` reaches that checkout. `CODEGRAPH_DIR` set to another directory is read partial and leaves a directory `change close` keeps the worktree over. apply's builds run one after another, one per named codegraph repo, and a repo's first apply builds twice, its checkout's and its worktree's. In a repo holding two graphers' artifacts both follow hooks pass their guard and share one lock, so an edit refreshes one of them, 8 and 12 of 20, and the other catches up at its next refresh; and a brain==code brain's own hook, whose bytes are kept, still refreshes the brain when the edited repo lacks the brain's artifact. A line a human deletes from `codegraph.json` without negating it comes back, and a human's exclude under the mount keeps the mount line out. Completeness of `callers` and `impact` was checked on TypeScript direct imports only, and in Python `callers` missed method calls named `add`. The disclosure is by version, the agent's calls carry no opt-out, and a later flush without one sends what they queued. codegraph was measured on 1.6.0 alone (MV-121). The legs see spellings. | open | proposed | <date> | [changes/codegraph-worktrees-and-verbs.md](changes/codegraph-worktrees-and-verbs.md) |
```

Sources for the row's facts: 19 / 24 of 192 — ver-M W (`python3 delta.py`, #4 at e4b09a7);
sibling borrow — inv W; init timings — inv W 1,131–1,192 ms, ver-M W 1,154–1,370 ms, ver-X W
6,982 ms and 35,778,789 B; sync — inv W, ver-M W 549–607 ms; 30 s hang — ver-X W; 851 ms and no
hook — synth `run.mjs`; exclude — ver-G W scratch E, synth; `*.db` — critic `$SCR/eco2`; the
318-function figures — ver-M V `all.sh`, `q1all.tsv`; 20 of 36 — inv V; aliased imports —
ver-X V; `node -f` — ver-X V; telemetry — inv V, ver-G V, ver-X V; hooks — #5 FR-013, ver-G W,
ver-X W; mount — ver-M K; re-serialising — ver-G K; ceilings — ver-X V race 31/35, ver-X K 8/12,
ver-X V Python.

**The ten notes**, each `**Amended <date> by MV-149**: …` appended at the end of its row's
statement cell. Quoted sentences are copied from the rows as they stand after #5 closes;
MV-148's text is #5's research R18, and MV-52's is #5's note on it.

| Row | Note |
| --- | --- |
| MV-52 | the brain's session gets one post-edit hook per grapher: the brain's own where it holds code, whose bytes are unchanged, and a follow hook for each other grapher its writable code repos resolve, each wired where MV-123's lookup finds its binary on PATH or in each of those repos resolving it. In MV-148's note, "the hook runs the one grapher the writable code repos resolve" becomes one follow hook per grapher they resolve, and "Where those repos resolve several graphers, or the binary is not reachable from each, none is wired and `doors` says so" becomes: where a grapher's binary is not reachable from each, that grapher's hook is not wired and `doors` says so; a grapher declaring the artifact another listed grapher writes gets no follow hook, and `doors` says so. `REFRESH_HEAD` stays the mark of ours; which grapher a hook is for is the artifact its toplevel test names. |
| MV-58 | "the hook SKIPS, because the refresh already running covers this edit" holds for the grapher holding the lock. In a repo holding two graphers' artifacts, both follow hooks pass their guard and take that repo's one lock. An edit refreshes whichever takes it first (8 and 12 of 20, measured with stubs run in parallel), and the other catches up at its next refresh. `doctor` names such a repo, with the removal of the artifact it does not resolve. |
| MV-61 | codegraph's `queries` are four verbs, each run on 1.6.0 against this repository's `src/` and `test/`: `codegraph query <symbol>`, `codegraph callers <symbol>`, `codegraph impact <symbol>` and `codegraph node <symbol>`. Each answer names what its verb misses: `callers` lists 20 unless `--limit N` and counts what it lists, `callers` and `impact` merge same-named symbols and miss aliased imports, and `node -f` takes the path as its answers print it. `explore`, `context`, `files`, `affected`, `callees` and `node -f <file> --symbols-only` were run and left out, and the registry says why. The verb list's header no longer says the graph answers in one call what grep takes many: `codegraph query` printed more than a narrowed definition grep for 311 of 318 functions, and graphify's path cost 2.1 to 2.6 times one (MV-148). |
| MV-74 | a refresh hook is still ours by the lock preamble, and which grapher it is for is the artifact its toplevel test names (MV-140), so the merge keeps one hook per wanted grapher. An update rewrites each grapher's own hooks, copies included. A hook of ours whose artifact is not wanted, or that names none, is taken over in place, inside its entry, by a wanted grapher still without a hook; otherwise it is removed, with any entry left empty. "Dropping the grapher removes every refresh hook and only the entries thereby left empty" becomes: dropping a grapher removes its own hooks, and dropping every grapher removes every refresh hook, each with only the entries thereby left empty. Two keyless copies of ours, which the merge used to rewrite and keep, become one; "a second gate hook … is REPORTED … and never deleted" is about the gate and stands. |
| MV-121 | the codegraph entry discloses by version what the agent's own codegraph calls reach: the door's verbs, and the `codegraph init` and `codegraph uninit --force` that `doctor` and the graph gate print for a human. Measured on 1.6.0 with HOME isolated, a local recorder as the telemetry endpoint and strace, and read from its dist. Where npm installed the platform bundle, `query`, `callers`, `impact` and `node` open no socket, and each queues one count per command and UTC day in `~/.codegraph/telemetry-queue.jsonl`. That queue is sent by the first `init`, `uninit`, `index`, `sync` or `upgrade` run without an opt-out once its day is past, by `codegraph install`, and by the MCP server it registers, at start and every six hours. `init` and `index` send an `index` event at once, and `uninit` an `uninstall` event. Where the bundle is missing, the npm shim downloads it from GitHub Releases on any command, whatever DO_NOT_TRACK or CODEGRAPH_TELEMETRY say; CODEGRAPH_NO_DOWNLOAD=1 where the agent runs turns that off. This replaces the entry's sentence that its `env` does not reach the printed query, which MV-147's note asked this change to measure. The copy saying that a sentence handed to `codegraph` gets nothing is retired at every copy: on 1.6.0 a sentence returns name matches for its words. |
| MV-124 | the codegraph half of "codegraph's and OpenSpec's layouts are stubbed" no longer holds. 1.6.0 writes `.codegraph/codegraph.db` and a `.codegraph/.gitignore` of `*` and `!.gitignore`, in WAL mode, with `-wal` and `-shm` beside it at times. Its `init` in a change's worktree wrote nothing outside that worktree. codegraph declares `graphignoreFile: 'codegraph.json'` and the key its lines go into (MV-149). The runner that applies the entry's `env` also closes the child's stdin. "`CODEGRAPH_DIR` reads partial": a worktree built under it also leaves a directory `change close` keeps the worktree over. The `doors` call that passed the entry's `env` passes a list of refresh hooks, each with its grapher's `env`. |
| MV-128 | for codegraph, "its own file" is `codegraph.json`, and the lines go into its `exclude` array. They are only the mount, in a code repo whose brain holds code, and the nested declared repos: on 1.6.0 these are the only lines that change its index, since codegraph indexes no markdown. They are spliced into the file's text, never re-serialised, and never written over a line that any of `exclude`, `include`, `includeIgnored` or `deprioritize` names. They carry no `# multivac:` record, which JSON cannot hold. Where the set is empty, nothing is written. A `.gitignore` line is not the route: codegraph 1.6.0 honours one, but it is git-wide and makes a later `git submodule add` of the mount exit 128. The first build of a local index in a change's checkout at `change apply` writes neither the grapher's own file nor `.gitignore`: it appends the entry's `ignore` lines git would not ignore there to the repository's common `info/exclude`, which is never committed (MV-149). |
| MV-134 | "The lifecycle's graph work covers the brain and the repos the change names" now includes the change's own checkouts for a local artifact. `change apply` builds or syncs it in each checkout it hands out, `change land` syncs it in the checkout holding the change's branch and commits no index, and `change close` removes it with the worktree. "for each ready repo it may write in whose grapher's artifact is shared" is widened by one case: where the grapher's artifact is local, land commits the grapher's ignore file alone when MV-148's rule lets it write one, and says nothing where that rule does not; before it syncs or builds the index there, it appends the entry's `ignore` lines git would not ignore to the repository's common `info/exclude`. "a detached HEAD or an ignored artifact is refused by name" holds for a shared artifact; for a local one a detached HEAD is passed over, since nothing of the index is committed, and an ignored `codegraph.json` is refused by name. |
| MV-140 | the hook's toplevel move follows an edit into a change worktree once that worktree holds codegraph's index, measured on 1.6.0 with the hook's bytes unchanged. The artifact `doors` passes for it also names the grapher each hook is for (MV-74's note), and `doors` passes one per grapher. A worktree index's freshness follows the same rule: `change apply` says `refreshed after your edits` only where a declared door has a post-edit hook and the brain wires that grapher's hook, and otherwise `as of this apply, refreshed again at \`change land\``. flow.md's refresh row and `doctor`'s refresh path say, of a local artifact, that it is built in each change worktree at `change apply`, synced at `change land` and never committed. |
| MV-148 | `change apply` builds a local index in each checkout it hands out (MV-149). "and `-p <repo>` for a local index, which a change's worktree does not have" is therefore WITHDRAWN: a local index is asked with `-p <checkout>`, the checkout being the repo or, in a change, the one whose `its index:` line `change apply` printed; the doors say that where it printed none, `-p` at the worktree answers from the nearest index above it. "and no codegraph index at all, so codegraph's hook follows into repo checkouts only" is WITHDRAWN. "A code-less brain's post-edit hook runs the one grapher its writable code repos resolve" becomes one follow hook for each grapher they resolve, in a brain that holds code too, and "Where the code repos resolve several graphers the brain wires no hook." is WITHDRAWN. In "A grapher declared under `graphers:` and codegraph get no ignore lines, and codegraph in a consumer of a brain==code brain indexes the mount", the codegraph half is WITHDRAWN: codegraph's lines are the structural ones, spliced into `codegraph.json`'s `exclude` with no record, so a line a human deletes without negating it returns, and none is written over a line that `include`, `includeIgnored` or `deprioritize` names either; for a local artifact "committed with the graph" is committed alone. The `brainRefreshGrapher` leg reads `brainRefreshGraphers`, which lists one entry per grapher. |

`change.invariants.touches` lists exactly these 10 rows, `adds: [MV-149]`, `retires: []`
(declared in the change file before `change apply`; T004 checks it). MV-128's note gained the
worktree exception (critic gap 9); MV-134's the land exclude step and the local detached-HEAD
case (gaps 1, 8); MV-121's the replacement of #4's sentence (gap 5); MV-140's the local wording of
flow.md and `doctor` (gap 7).

## R25. Tests that move

The critic ran the suite on a clone of main at 92c4c08 with the core patch (stdin, header, four
verbs, `indexWorktree`, `excludeLocalOutputs`, `commitGraph`'s local branch): **baseline 831
tests, 828 pass, 0 fail; patched 825 pass, 3 fail** (`$SCR/core.tap`). Each test that moves is
moved in the task that changes what it asserts; a title an existing leg reads is kept.

| Test | What moves | Leg reading its title |
| --- | --- | --- |
| `test/doctor/adapters.test.ts:231` 'a grapher states its own query verbs — they are not interchangeable' | codegraph's runs become four; the `/symbol search by name/` match becomes `/definitions and imports/` (critic: #394 failed at :229, and :245's match) | MV-61 — kept |
| `test/doctor/adapters.test.ts:256` 'codegraph names its telemetry, because the refresh runs on every edit' | extended with the disclosure's facts | MV-62 — kept |
| `test/doors/graph-navigation.test.ts:27`–`:45` (the MV-140 and MV-143 tests; #486 and #487 failed at :37 and :45) | `/It answers in one call/` → `/These are this tool's own verbs/` | none |
| #5's `test/change/graph-where.test.ts` 'apply names the flag that reaches each checkout's graph' | its codegraph-worktree case: an installed index gives `its index: -p <wt>`, one without the base fallback and never `-p <wt>`; SC-003 of #5's "no codegraph worktree is ever given `-p <worktree>`" gains "unless its index is installed" | MV-148 — kept |
| #5's `test/doors/where.test.ts` 'a code-less brain's door names each code repo's graph and the flag that reaches it' | a codegraph group pairs each verb with `-p <checkout>` and says where `apply` printed no such line; the brain==code codegraph line; byte pins; #5's consumer pin re-pinned for a codegraph consumer (four verbs, the new header); graphify consumers citing their section unchanged | MV-148 — kept |
| #5's `test/doors/graph-navigation.test.ts` 'a code-less brain's hook never refreshes a checkout of the brain' | unchanged (the follow hook bytes are pinned) | MV-148 — kept |
| #5's `test/doors/doors.test.ts` mixed case (web graphify + api codegraph → no refresh entry and the notice) | two entries, no notice | none |
| #5's `test/doors/flow.test.ts` 'the refresh row promises an edit refresh only for the grapher the brain's hook runs' | the mixed case: both rows say after each edit | none |
| #5's `test/doctor/doctor.test.ts` code-less refresh paths | the mixed line goes; the per-grapher line | none |
| `test/change/concurrency.test.ts` 'both live at once' and other exact-stdout matches of `change apply` | a codegraph fixture adds the build and pointer lines; a grapher-free fixture where the test is about something else | MV-25 — kept |
| `test/change/vendor-state.test.ts:235` "codegraph writes no .graphifyignore" | stays | none |
| `test/doors/settings.test.ts` MV-52 and MV-74 titles | pass through the one-element sugar | MV-52, MV-74 — kept |

If #5 wrote "codegraph worktrees give the base index line and never `-p <worktree>`" as a test
of its own, it is retitled "a codegraph worktree whose index is installed gives `its index: -p
<wt>`, and one without gives the base fallback and never `-p <wt>`" (no leg reads it).

**`test/change/codegraph-real.test.ts`** (new) would be the first real-vendor test. CI installs no
vendor (`.github/workflows/ci.yml`), so it is skipped there and pins nothing in CI: it is
local-only, and says so. Its own `codegraph` calls, run without isolation, would append to the
developer's real `~/.codegraph/telemetry-queue.jsonl` — R20's own finding — so it spawns with
`HOME` set to a temp directory and `DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1
CODEGRAPH_NO_UPDATE_CHECK=1` (critic gap 12). Symbol checks use `codegraph query --json` being
non-empty, never `grep -c <sym>`: 1.6.0 echoes the name in "No results found for" (ver-M K).

## R26. Ceilings, stated

Every edge case of spec.md that states a limit is in MV-149's ceilings: the freshness of an
index and the partial answers during a sync; the `node_modules/.bin`-only binary; the empty
worktree mount and a consumer indexed before the line; `CODEGRAPH_DIR`; sequential builds and
the doubled first apply; the two-artifact race and the brain==code hook's wasted refresh; a
deleted line returning and a human's line under the mount; aliased imports and Python; the
disclosure by version; 1.6.0 alone. The hook-visible lock that would mark an answer read during
a sync as partial is not built: the lock is `.multivac/cache/graph-refresh.lock`, and the site
names it (ver-X V). Two keyless copies becoming one is a stated behaviour change, not a ceiling
(MV-74's note).

## R27. The human's questions, at the design's defaults

1. A write under `.git/`: `change apply` appends `.codegraph/` to a code repo's common
   `info/exclude` when git would list the index — **yes** (multivac already writes
   `core.hooksPath` into repos; the alternative, #5's forced removal alone, leaves the
   `git add -A` hazard).
2. Telemetry of the agent's own codegraph calls — **disclosed by version, no harness env
   written, 0 door bytes**; to be decided together with #4 §10 item 2.
3. The apply cost — **synchronous**, about 1 to 7 s per repo, summed, doubled on a repo's first
   apply; copy-then-sync (0.8–1.3 s, identical output) **has no owner**.
4. brain==code siblings of another grapher get a follow hook — **yes** (ver-X K measured the same
   defect there).
5. A config-only `codegraph.json` commit at land in consumers — **yes**, as #5 §10 item 1 for
   `.graphifyignore`.
6. The door grows by +533 B per codegraph session for four verbs with their caveats — **kept**;
   `query` stays because MV-61 pins it and it adds the signature.
7. The footer date and the row ID: `<date>` is the day the law commit is made; MV-149 is
   substituted if another change allocates first.
