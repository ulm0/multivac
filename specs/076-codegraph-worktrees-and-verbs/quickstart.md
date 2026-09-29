# Quickstart: walk it with the real graphers

Every command runs in scratch with codegraph 1.6.0 and graphify 0.9.29 on PATH, `HOME` and
`GIT_CONFIG_GLOBAL` isolated and the opt-outs set. Every mutating command is chained with its
`cd` in ONE `&&` invocation, and no codegraph or graphify write ever runs with its working
directory inside `/home/user/multivac`. `MV` is this change's build; `BASE` is the build of main
with graph-answers-where-asked merged, before this change, for the "today" twins. Expected lines
are in [contracts/cli-output.md](contracts/cli-output.md); the measurements they are checked
against are in [research.md](research.md). **(measured)** marks a result already measured with
these vendors; **(expected)** follows from this design and is what the tests pin.

```bash
REPO=/home/user/multivac; SCR=<scratch>
export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0 \
  CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1
mkdir -p $HOME $SCR/nobin && ln -sf "$(command -v node)" $SCR/nobin/node \
  && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
NODE=$(command -v node); MV="$NODE $REPO/dist/cli.js"
mkdir -p $SCR/base && git -C $REPO archive <main with #5 merged> | tar -x -C $SCR/base \
  && cd $SCR/base && corepack pnpm install --frozen-lockfile && corepack pnpm build
BASE="$NODE $SCR/base/dist/cli.js"
codegraph --version && graphify --version && git --version   # 1.6.0, 0.9.29, 2.43.0
cat > $SCR/count.py <<'EOF'
import sqlite3, sys, collections
db = sqlite3.connect('file:' + sys.argv[1] + '/.codegraph/codegraph.db?mode=ro', uri=True)
n = db.execute('select count(*) from nodes').fetchone()[0]
m = sum(1 for (p,) in db.execute('select file_path from nodes') if (p or '').startswith('.brain/'))
print(f'nodes={n} mount={m}')
EOF
hookcmd() { python3 -c "import json,sys;s=json.load(open(sys.argv[1]));print('\n'.join(h['command'] for e in s['hooks']['PostToolUse'] for h in e['hooks'] if 'graph-refresh.lock' in h['command']))" "$1"; }
waitlock() { for i in $(seq 60); do [ -d "$1/.multivac/cache/graph-refresh.lock" ] || break; sleep 1; done; }
```

`src.tar` is a TypeScript tree to index: `git -C $REPO archive HEAD src > $SCR/src.tar` (141 files
under `src/` and `test/` at 92c4c08, 148 at #4's e4b09a7).

## Walk A — a brain that holds code on codegraph, one change (US1)

1. `mkdir -p $SCR/bc && cd $SCR/bc && git init -q && tar -xf $SCR/src.tar && git add -A && git commit -qm src && $MV init --provider claude --grapher codegraph`
   — `wrote .gitignore (+1) before the first build` and the build (**measured**, inv W); no
   `codegraph.json` (no nested repo: the structural set is empty, **expected**; SC-017). Run the
   printed step-zero commit.
2. `cd $SCR/bc && $MV change new wtx "Worktree index"`; declare `repos: { brain: { status: planned } }`
   and `landing_order: [[brain]]` in `.multivac/changes/wtx.md`;
   `cd $SCR/bc && $MV change plan wtx --no-sdd && $MV change apply wtx --no-sdd | tee $SCR/apply-bc.log`
   — `graph codegraph @ brain worktree: built (\`codegraph init\`) — local artifact, never committed`
   and, under the worktree, `its index: -p $SCR/bc/.multivac/worktrees/wtx/brain — refreshed after
   your edits; …` (**expected**; SC-001). Today: exit 0 in 411 ms and `ls -a <wt>` shows no
   `.codegraph` (**measured**, inv W); with `$BASE`, #5's base line and no `-p <wt>`.
3. `WT=$SCR/bc/.multivac/worktrees/wtx/brain && cd $WT && git status --porcelain --ignored | grep codegraph`
   — `!! .codegraph/` only (**measured**, critic `$SCR/bc`: 1,065 ms apply).
4. A branch-only symbol, through the hook:
   `cd $WT && printf 'export function wtOnlyProbe() { return 1; }\n' >> src/lib/out.ts && HOOK="$(hookcmd $SCR/bc/.claude/settings.json)" && echo '{"tool_name":"Edit","tool_input":{"file_path":"'$WT'/src/lib/out.ts"}}' | sh -c "$HOOK" && waitlock $WT && cd $SCR/bc && codegraph query wtOnlyProbe -p $WT --json | wc -c`
   — non-empty (the unchanged hook follows into an indexed worktree: **measured**, inv W,
   `wtEditProbe2 src/lib/out.ts:66`); the same asked inside `$WT` is byte-identical (**measured**,
   inv V). `cd $SCR/bc && codegraph query wtOnlyProbe -p $SCR/bc` answers `[i] No results found`,
   exit 0 — the trunk.
5. Re-apply syncs: `cd $SCR/bc && $MV change apply wtx --no-sdd | grep 'refreshed (`codegraph sync`)'`
   (**expected**).
6. Land and close: `cd $WT && git add -A && git commit -qm probe && cd $SCR/bc && $MV change land wtx`
   — `graph codegraph @ brain: refreshed (\`codegraph sync\`) — local artifact, never committed`, no
   index commit (`git -C $WT log --name-only -1` names `src/lib/out.ts` only, **expected**);
   `cd $SCR/bc && git merge -q --no-ff wtx -m merge && $MV change land wtx --landed brain && $MV change close wtx`
   — `brain: worktree removed (…)` (**expected**).
7. Freshness twin: in a copy with `doors: [agents]` (no post-edit door),
   `cd $SCR/bc2 && $MV change apply wtx --no-sdd | grep -c 'as of this apply, refreshed again at `change land`'`
   — 1; after an edit and `$MV change land wtx`, `codegraph query <edited> -p <wt> --json` is
   non-empty (**expected**; SC-004).

## Walk B — the prompt (US1)

```bash
cat > $SCR/run.mjs <<'EOF'
import { execFile } from 'node:child_process';
const [dir, close] = [process.argv[2], process.argv[3] === 'close'];
const t0 = Date.now();
const p = execFile('sh', ['-c', 'codegraph init'], { cwd: dir, env: { ...process.env, CODEGRAPH_NO_WATCH: '1' }, timeout: 12000 }, (err) =>
  console.log(`${close ? 'closed' : 'open'}: ${err ? (err.killed ? 'KILLED(timeout)' : 'rc=' + err.code) : 'rc=0'} in ${Date.now() - t0} ms`));
if (close) p.stdin?.end();
EOF
```

1. `mkdir -p $SCR/p1 && cd $SCR/p1 && git init -q && tar -xf $SCR/src.tar && ls .git/hooks | grep -vc sample; node $SCR/run.mjs $SCR/p1 close && ls .git/hooks | grep -vc sample`
   — `closed: rc=0` in about a second (851 ms in research, 1,192 to 1,368 ms over the walk's four
   runs), 0 hooks before and after (**measured**, synth).
2. `mkdir -p $SCR/p2 && cd $SCR/p2 && git init -q && tar -xf $SCR/src.tar && node $SCR/run.mjs $SCR/p2 open`
   — `open: KILLED(timeout) in ~12015 ms` (**measured**, synth; 30 s+ through multivac's runner,
   ver-X W). Kill the orphan `codegraph init` it leaves: `pkill -f 'codegraph init'`.
3. With `$MV` in Walk A's brain, `cd $SCR/bc && CODEGRAPH_NO_WATCH=1 $MV change apply wtx --no-sdd; echo $?`
   after `rm -rf $WT/.codegraph` — returns, 0, the index rebuilt (**expected**; SC-003).

## Walk C — a sibling whose ignore line is uncommitted, and one that ignores only `*.db` (US1)

1. A code-less brain with `web` and `api`, each a TypeScript repo with a bare remote under
   `$SCR/remotes/`: `mkdir -p $SCR/eco/brain && cd $SCR/eco/brain && git init -q && $MV init --provider claude --grapher codegraph --quiet`;
   `cd $SCR/eco && git clone -q $SCR/remotes/web.git web && git clone -q $SCR/remotes/api.git api`;
   api's committed `.gitignore` is `*.db`; declare `repos: { web: ../web, api: ../api }`, run the
   printed step-zero commit, then `cd $SCR/eco/brain && $MV repos sync` — each repo indexed; web's
   `.gitignore` holds `.codegraph/` uncommitted (MV-128), api's gets the same line uncommitted.
   Make api's case the `*.db` one: `cd $SCR/eco/api && git checkout -- .gitignore`.
2. Today, by hand (**measured**, synth `$SCR/ex/web`):
   `cd $SCR/eco/web && git worktree add -q -b s1 ../wt1 && git -C ../wt1 check-ignore -q .codegraph/; echo $?` — 1;
   `cd $SCR/eco/web && echo .codegraph/ >> "$(git rev-parse --git-common-dir)/info/exclude" && git -C ../wt1 check-ignore -q .codegraph/; echo $?` — 0;
   `cd $SCR/eco/wt1 && codegraph init </dev/null && git status --porcelain` — empty, and `--ignored`
   shows `!! .codegraph/`; `cd $SCR/eco/web && git worktree remove ../wt1; echo $?` — 0. Undo the
   exclude line and `git branch -D s1` before step 3.
3. `cd $SCR/eco/brain && $MV change new tot "Totals"`; declare `repos: { web: { status: planned }, api: { status: planned } }`
   and `landing_order: [[web, api]]`; `cd $SCR/eco/brain && $MV change plan tot && $MV change apply tot`
   — `web: .codegraph/ added to $SCR/eco/web/.git/info/exclude — git ignored no index here, and that file is never committed`
   and the same for api (the `*.db` repo: git ignores the database but lists `.codegraph/`,
   **measured** critic `$SCR/eco2`), each build line and `its index:` line (**expected**; SC-002).
4. `for r in web api; do git -C $SCR/eco/brain/.multivac/worktrees/tot/$r status --porcelain; done`
   — empty; `git -C $SCR/eco/web diff --stat .gitignore` unchanged; a second
   `cd $SCR/eco/brain && $MV change apply tot | grep -c 'info/exclude'` — 0 (**expected**).
5. Land, merge, close: commit a change in each worktree; `cd $SCR/eco/brain && $MV change land tot`;
   the worktrees' porcelain is still empty (**expected**; critic gap 1); merge each branch in its
   repo; `cd $SCR/eco/brain && $MV change land tot --landed web && $MV change land tot --landed api && $MV change close tot`
   (`--landed` records one repo a call; given twice in one call, only the last is recorded)
   — `web: worktree removed (…)`, `api: worktree removed (…)`, plain removals (today the worktree is
   kept with a `--force` line, **measured** ver-G W).
6. Land builds where apply could not (SC-007): open `late` naming web, apply with
   `PATH=$SCR/nobin:/usr/bin:/bin` (no codegraph) — the fallback line and exactly one
   `found on neither PATH nor web worktree's node_modules/.bin` line if web's own index is installed
   (**expected**; critic gap 10); then `cd $SCR/eco/brain && $MV change land late` with codegraph
   back on PATH — the build line; the worktree's porcelain empty (today `?? .codegraph/`,
   **measured** critic `$SCR/eco` `late`).
7. `node_modules/.bin` only (SC-005): `mkdir -p $SCR/eco/web/node_modules/.bin && ln -s "$(command -v codegraph)" $SCR/eco/web/node_modules/.bin/codegraph`,
   open `nmb` naming web, `cd $SCR/eco/brain && PATH=$SCR/nobin:/usr/bin:/bin $MV change apply nmb | grep -c 'found on neither PATH nor'`
   — 1; the pointer is #5's fallback and `grep -c -- '-p .*worktrees/nmb/web'` is 0 (**expected**).

## Walk D — two graphers, a code-less brain (US2)

1. `mkdir -p $SCR/mix/brain && cd $SCR/mix/brain && git init -q && $MV init --provider claude --quiet`;
   clone `web` and `api` beside it; declare `repos: { web: { path: ../web, grapher: graphify }, api: { path: ../api, grapher: codegraph } }`,
   commit, `cd $SCR/mix/brain && $MV repos sync && $MV doors && hookcmd .claude/settings.json | wc -l`
   — 2 (with `$BASE`: 0 and #5's mixed notice) (**expected**; SC-009).
2. Payloads, one at a time, each hook in turn:
   `cd $SCR/mix/web && printf 'export function zetaWeb() { return 1; }\n' >> src/util.ts && cd $SCR/mix/brain && hookcmd .claude/settings.json | while read -r H; do echo '{"tool_name":"Edit","tool_input":{"file_path":"'$SCR'/mix/web/src/util.ts"}}' | sh -c "$H"; done; waitlock $SCR/mix/web`
   — web's `graph.json` gains `zetaWeb`, and no `$SCR/mix/web/.codegraph` appears; the same with
   `$SCR/mix/api/src/index.ts` and `zetaApi` — `cd $SCR/mix/api && codegraph query zetaApi --json | wc -c`
   non-empty, no `$SCR/mix/api/graphify-out`; a payload naming `$SCR/mix/brain/AGENTS.md` runs no
   grapher and leaves no `graph-refresh.lock` under the brain's `.multivac/cache` (which `init` and
   `doors` already made, empty); every exit 0 (**measured** with the two follow strings, inv K
   and ver-M K).
3. `cd $SCR/mix/brain && $MV doctor | grep 'refresh path'` — `post-edit hooks follow your edits —
   graphify's and codegraph's` (**expected**); `grep -c 'after each edit through the harness hook' .multivac/flow.md`
   — 2.
4. Drop api's grapher (`grapher: none`), `cd $SCR/mix/brain && $MV doors && hookcmd .claude/settings.json | wc -l`
   — 1, and a command a user added beside the codegraph hook in its entry is still there
   (**expected**; SC-012).

## Walk E — a graphify brain that holds code, with a codegraph sibling (US2)

1. A brain==code graphify brain `$SCR/gb` (`repos: { brain: ., api: ../api }`, api on codegraph);
   `cd $SCR/gb && $MV doors && hookcmd .claude/settings.json | wc -c` — the brain's own 500 B hook,
   `$BASE`'s 492 B with FR-034's exit, plus api's 606 B follow hook with its `env` export
   (**expected**; SC-011).
2. Open `mx` naming api, apply (api's worktree indexed), add `mixedProbe` in api's worktree, pipe the
   payload to both hooks, wait for both locks:
   `cd $SCR/gb && codegraph query mixedProbe -p $SCR/gb/.multivac/worktrees/mx/api --json | wc -c`
   — non-empty (today: the brain's `graph.json` md5 6596f246 → 98621df6 and `mixedProbe` unfound,
   **measured** ver-G W; `omega_api` found with the follow hook added, **measured** inv K). The
   brain's own hook still refreshed the brain's graph on that edit (the stated ceiling).
3. `cd $SCR/gb/../api && graphify update . && cd $SCR/gb && $MV doctor | grep 'which it does not resolve'`
   — api's line names `graphify-out/graph.json` and its removal (**expected**; SC-013); with graphify
   dropped from the brain, the line goes.

## Walk F — the mount (US3)

1. Today (**measured**, ver-M K): a consumer `shop` with this brain mounted,
   `cd $SCR/shop && git submodule add -q $REPO .brain && codegraph init . </dev/null && python3 $SCR/count.py .`
   — `nodes=2254 mount=2247` in research's measurement (`nodes=2429 mount=2421` at the walk, the
   mount at 7620178: the count follows the brain's commit); `codegraph callers add` — every caller
   from `.brain/`.
2. `cd $SCR/shop && printf '{\n  "exclude": [\n    "/.brain/"\n  ]\n}\n' > codegraph.json && wc -c codegraph.json && codegraph sync </dev/null && python3 $SCR/count.py .`
   — 38 B; `mount=0` and only shop's own nodes (7 in research's fixture, 8 in the walk's;
   'Removed: 148' there, 152 at the walk; no rebuild, **measured** ver-M K).
3. With `$MV`: a brain==code brain declaring `shop` (codegraph) as a consumer,
   `cd <that brain> && $MV repos sync` — `graph codegraph @ shop: wrote codegraph.json (+1) and .gitignore (+1) before the first build`,
   the 38 B file, `mount=0` and only shop's own nodes (**expected**; SC-014); a `.gitignore` line instead would make a
   later `git submodule add` of the mount exit 128 (**measured**, ver-M K).
4. `mount: ./.brain` in the brain's config: `codegraph.json` and `.graphifyignore` both say
   `/.brain/` (today `/./.brain/` leaves 10 of 12 nodes from the mount, **measured** ver-X K; SC-018).
5. Land: commit a `codegraph.json` without the line in shop, open a change naming shop, apply, land —
   one commit on the branch whose only path is `codegraph.json`
   (`git -C <wt> show --name-only --format= HEAD` prints `codegraph.json`); a second land commits
   nothing (**expected**; SC-016). `git -C <wt> status --porcelain` empty after land.
6. A consumer of a code-less brain, and a brain==code brain with no nested repo: no `codegraph.json`
   after `repos sync` (**expected**; SC-017).

## Walk G — a human's `codegraph.json` (US3)

1. `cd $SCR/shop && printf '{\r\n  "maxFileSize": 1.50,\r\n  "exclude": ["dist/"],\r\n  "exclude": [\r\n    "legacy/"\r\n  ]\r\n}' > codegraph.json && cp codegraph.json $SCR/before.json`,
   then the land of Walk F step 5 — the output with `,\r\n    "/.brain/"` removed is byte-identical
   to `$SCR/before.json` (`cmp`), `python3 -c "import json;json.load(open('codegraph.json'))"` exits 0
   (**measured** on the splice, 13 of 13 cases, ver-G K; SC-015).
2. `cd $SCR/shop && printf '{"deprioritize":[".brain/"]}\n' > codegraph.json && md5sum codegraph.json > $SCR/d.md5`,
   land — `md5sum -c $SCR/d.md5` OK, and the line `/.brain/ not added to codegraph.json — its "deprioritize" names it, which is yours`
   (**expected**); the naive append would have dropped the human's mount nodes (2,247 in research's
   measurement) to 0
   (**measured**, ver-G K; SC-019).
3. `{"exclude": "dist/"}` (not a list): left byte-identical, the malformed line (**expected**).
4. `cd $SCR/shop && $MV doctor | grep codegraph.json` from its brain — the facts of the contract,
   and the file's md5 unchanged (**expected**).

## Walk H — the verbs (US4)

In a scratch clone of this repository at 92c4c08, indexed there (never in `/home/user/multivac`):

1. `cd $SCR/mvc && codegraph callers adapterFor | head -1` — `(20)`; `--limit 500` — `(36)`
   (**measured**, inv V).
2. `cd $SCR/mvc && codegraph node grapherLines | wc -c` — "2 definitions named", 10,399 B;
   `-f src/doors/brain.ts`, `-f brain.ts` and `-f doors` 3,537 B each; `-f ./src/doors/brain.ts`
   and `-f ../web/src/x.ts` 10,399 B, byte for byte the answer with no `-f`, rc=0 and no warning;
   `codegraph node -f ../web/src/x.ts` (no symbol) — "No indexed file matches", rc=0 (**measured**,
   inv V, ver-X V; the miss's silence measured by the walk, T077).
3. `cd $SCR/mvc && codegraph query "where is the door rendered" | wc -c` — name matches for the
   sentence's words (**measured**: 1,150 B at the walk; inv V's own sentence gave 1,435 B — the bytes
   follow the sentence and the commit).
4. With `$MV`: a codegraph consumer's door, `sed -n '/kept fresh for you by `codegraph`/,/^- [^ ]/p' AGENTS.md | head -6 | wc -c`
   — 982 with a post-edit door, 1,001 without (**expected**; SC-020). With `$BASE` the range runs
   into the 22 B `<!-- multivac:end -->` line of its one-verb block: 471 / 490, which is 449 / 468
   for the block itself.

## Walk I — what the agent's calls send (US4)

1. With the opt-outs set: `cd $SCR/mvc && md5sum $HOME/.codegraph/telemetry-queue.jsonl 2>/dev/null; codegraph query adapterFor >/dev/null && codegraph sync </dev/null >/dev/null; md5sum $HOME/.codegraph/telemetry-queue.jsonl 2>/dev/null`
   — unchanged (**measured**, inv W).
2. Without them (`env -u DO_NOT_TRACK -u CODEGRAPH_TELEMETRY`, `HOME` still isolated): a query
   appends one line to the queue; a back-dated queue is POSTed by the next un-opted `sync` to a
   local recorder set as the endpoint (**measured**, inv V).
3. Bundle-less: `node <npm shim> query x` with `DO_NOT_TRACK=1` tries GitHub Releases, and stops with
   `CODEGRAPH_NO_DOWNLOAD=1` (**measured**, ver-G V, ver-X V).

## Walk J — twins that must not move

1. This repository, in a scratch clone at the change's head: `cd $SCR/self && cp AGENTS.md $SCR/a.md && cp .claude/settings.json $SCR/s.json && $MV doors && cmp AGENTS.md $SCR/a.md && cmp .claude/settings.json $SCR/s.json && ls .codegraph codegraph.json 2>&1 | grep -c 'No such'`
   — identical, identical, 2 (**expected**; SC-024: the clone's tracked `settings.json` already
   carries T075's re-render, FR-034's exit included; against `$BASE`'s it differs by that exit
   alone, 8 B).
2. A single-grapher codegraph brain and a graphify consumer: `settings.json` between `$BASE doors`
   and `$MV doors` differs only by FR-034's exit (`[ -n "$t" ] && ` → `[ -n "$t" ] || exit 0; `),
   and a second `$MV doors` changes no byte (**expected**; SC-011).
3. A graphify brain whose doors cite no section (`doors: [agents]`): the door is 6 B shorter, the
   header line only (**expected**; SC-020).
4. An edit outside every repository: with a stub graphify logging its runs on PATH, `mkdir -p
   $SCR/norepo && cd $SCR/gb && echo '{"tool_name":"Write","tool_input":{"file_path":"'$SCR'/norepo/x.ts"}}' | sh -c "$(hookcmd .claude/settings.json | head -n 1)"; echo $?; ls .multivac/cache`
   — exit 0, the stub's log empty, no lock; the same payload through `$BASE`'s hook ran the stub in
   `$SCR/gb` (**expected**; SC-026).

Record every result in `.multivac/changes/codegraph-worktrees-and-verbs.md`'s body (T077).
