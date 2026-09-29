# Quickstart: walk it with the real graphers

Every command runs in scratch with graphify 0.9.29 and codegraph 1.6.0 on PATH, `HOME` and
`GIT_CONFIG_GLOBAL` isolated. Every mutating command is chained with its `cd` in ONE
invocation — a `cd` that did not persist once let `graphify uninstall --project` fire in a real
repository. `MV` is this change's build; `BASE` is the build at `e5d034f` (main with #3 and #4,
before this change), for the twins that must not move and for a brain with today's install.
Expected lines are in [contracts/cli-output.md](contracts/cli-output.md); the measurements they
are checked against are in [research.md](research.md). **(measured)** marks a result already
measured with these vendors; **(expected)** follows from this design and is what the tests pin.

```bash
REPO=/home/user/multivac/.multivac/worktrees/graph-answers-where-asked/brain; SCR=<scratch>   # this change's worktree: `multivac` on PATH runs main's build (analyze I3)
export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0 \
  CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1
mkdir -p $HOME $SCR/nobin && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
NODE=$(command -v node); MV="$NODE $REPO/dist/cli.js"
mkdir -p $SCR/base && git -C $REPO archive e5d034f | tar -x -C $SCR/base \
  && cd $SCR/base && corepack pnpm install --frozen-lockfile && corepack pnpm build
BASE="node $SCR/base/dist/cli.js"
graphify --version && codegraph --version    # 0.9.29, 1.6.0
```

`web` and `api` are two TypeScript repos, each with a bare remote under `$SCR/remotes/`: web's
`src/server.ts` exports `computeTotal()`, `src/util.ts` a `zeta()`, and `specs/add.spec.ts` a
test; api's `src/index.ts` one function.

## Walk A — a brain that holds no code (US3)

1. `mkdir -p $SCR/eco/brain && cd $SCR/eco/brain && git init -q && PATH=$SCR/nobin:/usr/bin:/bin $MV init --provider claude --grapher graphify; echo $?`
   (`$MV` names node by its absolute path, so only graphify is off PATH) — exit 0 (today exit 1,
   `init refused — graphify: …`, **measured** inv); the init line of the contract;
   `cd $SCR/eco/brain && ls graphify-out .graphifyignore .claude/skills/graphify 2>&1 | grep -c 'No such'`
   is 3 (**expected**; SC-015).
2. `cd $SCR/eco && git clone -q $SCR/remotes/web.git web && git clone -q $SCR/remotes/api.git api`;
   declare `repos: { web: ../web, api: ../api }` in the brain's `.multivac/config.yml`, then run
   the printed step-zero commit (once it is committed the config changes only inside a change);
   `cd $SCR/eco/brain && $MV repos sync` — each code repo gets its graph, the brain none
   (**expected**; SC-012).
3. `cd $SCR/eco/web && cat .graphifyignore` — the lines `/.agents/` … `/.brain/`, then the
   `# multivac:` record listing them, and no `/specs/` (**expected**); `cd $SCR/eco/web && python3 -c "import json,collections;g=json.load(open('graphify-out/graph.json'));print(collections.Counter(n.get('source_file','').split('/')[0] for n in g['nodes']))"`
   — no `.agents` or `.brain`, and `specs` present (SC-021; ver-M measured 501 → 74 nodes with the
   mount line in a larger consumer than this fixture, whose own graph is a few nodes: walked, `src` 4
   and `specs` 2).
4. A second brain for the untracked-source rule:
   `mkdir -p $SCR/u && cd $SCR/u && git init -q && mkdir src && printf 'export function computeTotal(a: number[]) { return a.reduce((s, x) => s + x, 0); }\n' > src/server.ts && $MV init --provider claude --grapher graphify --quiet && grep -A1 '^repos:' .multivac/config.yml && graphify query "computeTotal" --graph graphify-out/graph.json | grep -c computeTotal`
   — `brain: .` and a positive count (today `# repos:`, **measured** ver-G; SC-014).

## Walk B — the door and the flag (US1)

1. `cd $SCR/eco/brain && $MV doors && sed -n '/holds no code/,/^$/p' AGENTS.md | grep -v '^$' | wc -c` — the
   where-block of the contract, 954 B for the two repos (**measured**; SC-002 — without the
   `grep -v`, the range's closing blank line makes it 955); `grep -c '## graphify' AGENTS.md` is 0.
2. `cd $SCR/eco/brain && graphify query "where is the order total computed" --graph ../web/graphify-out/graph.json | grep -m1 computeTotal`
   — `computeTotal()` with `src=src/server.ts` (**measured** inv; SC-001);
   `cd $SCR/eco/brain && graphify query "where is the order total computed"; echo $?` exits 1,
   `graph file not found`, and `git status --porcelain` is unchanged (**measured** inv).
3. `cd $SCR/eco/brain && graphify query "which repo does INV-01 anchor" --graph .multivac/ecosystem.json`
   answers with the binary alone (**measured** inv).
4. A zero-repo twin: `mkdir -p $SCR/z && cd $SCR/z && git init -q && $MV init --provider claude --grapher graphify --quiet && grep -o -- '--graph .multivac/ecosystem.json' AGENTS.md | wc -l`
   — 3 (SC-006; the three verbs share one line, so `grep -c` prints 1), and the unresolved line of
   the contract.

## Walk C — a change, its pointer, the hook, land and close (US1, US2, US4)

1. `cd $SCR/eco/brain && $MV change new totals "Totals"`; declare `repos: { web: { status: planned } }`
   and `landing_order: [[web]]`; `cd $SCR/eco/brain && $MV change plan totals && $MV change apply totals | tee $SCR/apply.log`
   — under `web: <wt>`, the graphify base line naming `--graph $SCR/eco/web/graphify-out/graph.json`
   (**expected**; SC-003); `ls <wt>/graphify-out` shows none (**measured** ver-X);
   `cd $SCR/eco/brain && graphify query "which function computes the total" --graph $SCR/eco/web/graphify-out/graph.json | wc -c`
   — exit 0 (**measured**; ver-X's 6,491 B came from a larger web than this fixture's).
2. The hook. `cd $SCR/eco/brain && HOOK=$(python3 -c "import json;s=json.load(open('.claude/settings.json'));print([h['command'] for e in s['hooks']['PostToolUse'] for h in e['hooks'] if 'graph-refresh.lock' in h['command']][0])") && printf %s "$HOOK" | wc -c`
   — 540 plus the `env` prefix (**expected**; SC-009). Then, one payload at a time, waiting for
   the lock to clear (`for i in $(seq 60); do [ -d <repo>/.multivac/cache/graph-refresh.lock ] || break; sleep 1; done`):
   - `cd $SCR/eco/brain && echo '{"tool_name":"Edit","tool_input":{"file_path":"'$SCR'/eco/brain/.multivac/changes/totals.md"}}' | sh -c "$HOOK"`
     — no `graphify-out/` appears in the brain (**measured** synth);
   - the same with `$SCR/eco/brain/.multivac/worktrees/totals/brain/…` when the change names the
     brain — nothing runs (**measured** synth);
   - `cd $SCR/eco/web && printf 'export function zeta2() { return 2; }\n' >> src/util.ts && cd $SCR/eco/brain && echo '{"tool_name":"Edit","tool_input":{"file_path":"'$SCR'/eco/web/src/util.ts"}}' | sh -c "$HOOK"`
     — web's graph then answers `zeta2` (**measured** synth; SC-008);
   - the same in web's worktree `<wt>/src/util.ts` — the worktree's graph once `change land` built
     one there, else nothing runs (the worktree holds no graph yet).
3. Land. `cd <wt> && git add src && git commit -qm totals && cd $SCR/eco/brain && $MV change land totals`
   — web's own checkout holds `.graphifyignore` untracked (written by `repos sync`), so land prints
   `web: .graphifyignore in $SCR/eco/web is not committed — …` and creates no copy (**expected**;
   FR-028); `git -C <wt> status --porcelain` names no `.gitignore` (SC-023).
   `cd $SCR/eco/web && git add .graphifyignore && git commit -qm ignore`, then merge the branch into
   web's main. web's own checkout still holds the untracked `graphify-out/graph.json` that `repos
   sync` built, which the branch's committed graph would overwrite: the merge refuses with exit 1
   (`untracked working tree files would be overwritten by merge`) until you move it aside
   (`cd $SCR/eco/web && mv graphify-out/graph.json $SCR/web-graph.json`), and until that merge
   lands `change close` refuses with `web: graphify-out/graph.json is not committed`, a gate older
   than this change (**measured**). Then `cd $SCR/eco/brain && $MV change land totals --landed web`.
4. Close. `cd $SCR/eco/brain && graphify query "total" --graph <wt>/graphify-out/graph.json >/dev/null && git -C <wt> status --porcelain`
   — `?? graphify-out/cache/` (**measured** inv: blocks `git worktree remove`, exit 128);
   `cd $SCR/eco/brain && $MV change close totals` — `web: worktree removed (<wt>)` (**measured**;
   SC-005); the printed archive commit names no `graphify-out/graph.json` for the brain (SC-012).
   Close also refuses a claim with no anchor: state and anchor the change's claim first, as any
   close requires.
5. `cd $SCR/eco/brain && $MV doctor | grep '^grapher'` — the fact line, web's and api's status
   lines, and `refresh path: claude post-edit hook follows your edits into the code repos'
   checkouts` (**measured**); `cd $SCR/eco/brain && $MV repos check; echo $?` — 0 once api's graph,
   which `repos sync` built, is committed (`cd $SCR/eco/api && git add graphify-out/graph.json && git commit -qm graph`);
   before that it exits 1 on api's line, `graphify built but graphify-out/graph.json is not
   committed`, while the brain's line reads `ok cloned` (**measured**).
6. Main checkouts untouched: `git -C $SCR/eco/web status --porcelain` and `git -C $SCR/eco/api status --porcelain`
   are empty after `change new`, `plan`, `apply`, `repos sync`, `doors`, `doctor` and `verify`
   (SC-023).

## Walk D — a kept install (US3)

1. `mkdir -p $SCR/eco2/brain && cd $SCR/eco2/brain && git init -q && $BASE init --provider claude --grapher graphify --quiet`,
   clone web and api beside it, declare them, run the printed step-zero commit — 23 graphify
   files, 170,619 B in the brain (**measured** inv).
2. `cd $SCR/eco2/brain && $MV doors && $MV doctor | grep leftover` — the 674 B removal line
   (**expected**); `grep -c 'is a leftover that holds no code' AGENTS.md` is 1;
   `cd $SCR/eco2/brain && cp AGENTS.md $SCR/door.doors && $MV init --provider claude --quiet && cmp AGENTS.md $SCR/door.doors`
   — identical (SC-018).
3. `cd $SCR/eco2/brain && md5sum graphify-out/graph.json > $SCR/kept.md5 && $MV change new probe "Probe" && md5sum -c $SCR/kept.md5`
   — OK: nothing reinstalled or refreshed (SC-016); `cd $SCR/eco2/brain && $MV repos check; echo $?` — the
   brain's line `ok cloned; leftover graphify install (tracked)`, and 0 once each code repo's graph
   the `init` re-run built is committed there — until then 1, on that repo's own line (**measured**).
4. Run the printed removal:
   `cd $SCR/eco2/brain && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore && git status --porcelain | awk '{print $1}' | sort | uniq -c`
   — 23 D and 2 M; `grep -c '"PreToolUse": \[\]' .claude/settings.json` is 1; `CLAUDE.md` is still a
   link (**measured** inv, ver-M, critic; SC-017). Commit; `cd $SCR/eco2/brain && $MV doors && grep -c leftover AGENTS.md`
   — 0; `cd $SCR/eco2/brain && $MV change new probe2 "Probe"` reinstalls nothing (today it reinstalls, **measured** inv;
   SC-013).
5. With doors `[agents, codex, gemini]` in a third brain `$SCR/eco3/brain` built by `$BASE` as in step 1: `cd $SCR/eco3/brain && $MV doctor | grep -o 'graphify uninstall --project --platform [a-z]*' | head -1`
   — `--platform gemini`; after the printed removal `.gemini/settings.json` ends with `"BeforeTool":[]`
   (**measured** order effect, ver-X; SC-017).

## Walk E — a brain that holds code: this brain, cloned (US1, US4)

1. `git clone -q $REPO $SCR/clone && cd $SCR/clone && git checkout -q e5d034f && python3 -c "import json;print(len(json.load(open('graphify-out/graph.json'))['nodes']))"`
   — the committed graph: 6,066 nodes in 5,989,444 B at e5d034f, 4,583 of them under the 12 lines
   (**measured**; 5,937 on 92c4c08, before #4 moved it).
2. Write the record and the 12 lines of contracts/cli-output.md *The ignore file* into
   `.graphifyignore`, then `cd $SCR/clone && graphify update .; echo $?` — exit 1, `new graph has
   1483 nodes but existing graph.json has 6066. Refusing to overwrite` (**measured** at e5d034f;
   1460 and 5937 on 92c4c08).
3. With this change's `refreshGraph` (`holdsIgnored` true), which runs `cd $SCR/clone && graphify update . --force` — exit 0 in
   about 6.5 s, 1,483 nodes, 1,852,040 B at e5d034f (1,460 and 1,815,100 B on 92c4c08); a later
   `cd $SCR/clone && graphify update .` exits 0 (**measured**; SC-024).
4. `cd $SCR/clone && $MV doors && grep -c 'kept out of it: the ecosystem graph above relates them' AGENTS.md`
   — 1, and the two grapher lines byte for byte as `$BASE doors` renders them (SC-019).
5. `graphify explain "graphPointer()" --graph <this change's worktree graph>` resolves where the
   trunk graph says `No node matching` (SC-004; **measured** inv, ver-M with #3's `sddGoverning()`,
   which the trunk graph now holds and whose worktree is gone — analyze C3).

## Walk F — a fresh brain that holds code, doors claude and codex (US4)

`mkdir -p $SCR/f && cd $SCR/f && git init -q && mkdir src && printf 'export const a = 1;\n' > src/a.ts && git add src && git commit -qm src && $MV init --provider claude --sdd speckit --grapher graphify`,
add `codex` to `doors:`, then `cd $SCR/f && $MV doors`, run the printed commit, `cd $SCR/f && $MV repos sync` — the graph holds no
node from `.agents/` or `.codex/` (SC-020; walked, 0 of 4 nodes, where `$BASE` graphs 120 of 124
from them; ver-M's 305 → 77 came from a larger brain than this fixture).

## Walk G — codegraph, and mixed graphers (US1, US2, US3)

1. A code-less brain on `--grapher codegraph`: `mkdir -p $SCR/cg && cd $SCR/cg && git init -q && $MV init --provider claude --grapher codegraph --quiet && ls .codegraph`
   fails (today a 163,840-byte index of 0 nodes, **measured** inv).
2. `cd $SCR/eco/web && codegraph init && cd $SCR/eco/brain && codegraph query computeTotal -p ../web` — `function computeTotal src/server.ts:2`
   (**measured** inv).
3. `change apply` on a codegraph repo prints the base index line and never `-p <worktree>`
   (**expected**; SC-003); under a brain==code codegraph brain,
   `codegraph query <branch-only symbol> -p <worktree>` gives exit 0 and `No results found` — the
   hazard the line prevents (**measured** ver-G, ver-X).
4. Mixed: web on graphify, api `grapher: codegraph` — `cd $SCR/eco/brain && $MV doors` prints the
   mixed notice, `.claude/settings.json` holds no refresh entry, the door says `refreshed at
   \`change land\` and \`change close\``, and `cd $SCR/eco/brain && $MV doctor | grep 'refresh path'` names both graphers
   (**expected**; SC-010).
5. The binary in one repo only: put `graphify` in `$SCR/eco/web/node_modules/.bin` alone, drop it
   from PATH, `cd $SCR/eco/brain && $MV doors` — the unreachable notice, no refresh entry (**expected**; SC-011).

## Walk H — this repository

In the change's worktree, with its own build (`node dist/cli.js`, never the `multivac` on PATH,
which runs main's): `node dist/cli.js doors` adds exactly the brain==code line to `AGENTS.md` (and
`CLAUDE.md` through the link) and re-renders `.multivac/flow.md` and `.multivac/ecosystem.json`;
`corepack pnpm test` passes; `node dist/cli.js verify --strict` reports every claim anchored, 0
blocking and no broken leg of any mode (analyze CA3); `grep -c 'Amended [0-9-]* by MV-148'
.multivac/invariants.md` is 19 (SC-025; 16 until review added MV-87, MV-93 and MV-125). Measured at S6 (T072-T074): `.graphifyignore` the 12
lines and the record, the forced rebuild 6,066 → 1,542 nodes, 5,989,444 → 1,969,521 B, 0 nodes
under a recorded line; after T076's refresh the committed graph held 1,542 nodes in 1,974,492 B
at e6f7994, 0 under a recorded line, and a refresh reproduced it byte for byte (walked).
