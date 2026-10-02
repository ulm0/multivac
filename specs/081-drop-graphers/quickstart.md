# Quickstart: multivac keeps no code graph

Walks that prove the change, with the commands that measured the design's figures. `WT` is the
change's worktree (`.multivac/worktrees/drop-graphers/brain`); `NEW` is `node $WT/dist/cli.js`;
`OLD` is main's 0.15.0 (`node /home/user/multivac/dist/cli.js`, or `mvac` before the merge);
`$S` a scratch directory. Every walk outside `WT` runs in scratch with the environment isolated:

```sh
export HOME=$S/home GIT_CONFIG_GLOBAL=$S/home/.gitconfig TMPDIR=$S/tmp \
  CODEGRAPH_TELEMETRY=0 DO_NOT_TRACK=1 CODEGRAPH_NO_DOWNLOAD=1 CODEGRAPH_NO_UPDATE_CHECK=1 \
  OPENSPEC_TELEMETRY=0
```

Vendors as measured: graphify 0.9.29, codegraph 1.6.0, spec-kit 1.0.11, openspec 1.13.2.

## W1. Build and suite

```sh
cd $WT && corepack pnpm run build && TMPDIR=$S/tmp node --test "dist-test/**/*.test.js"
```

Expect: the suite passes; 987 − 171 + 11 tests at the design's count (research.md R10); none
named for a grapher but the MV-153 tests.

```sh
cd $WT && NEW verify --strict --check; echo rc=$?
```

Expect exit 0; MV-153 anchored by thirty legs, all green (W7).

## W2. An old graphify brain upgrades (US2)

```sh
mkdir -p $S/w2/brain && cd $S/w2/brain && git init -q && mkdir src && echo 'export const a = 1;' > src/a.ts \
  && git add src && git commit -q -m code \
  && OLD init --quiet --provider claude --grapher graphify . \
  && git add -A && git commit -q -m 'multivac init'
cp .claude/settings.json .claude/settings.json.graphify-bak   # the human's own copy, as MV-148 measured
NEW verify; NEW verify --quiet; NEW doctor; NEW doors; git status --short
```

Expect (contracts §1–§4): one `config` line in `verify`, one clause in `--quiet`; `doctor`'s
`config` line and three `leftover` lines (ecosystem file, one refresh hook, graphify @ brain with
its agents and claude installs and the backup copy); `doors` prints the hook notice and the
ecosystem removal; the door carries graphify's leftover line; `git status` shows
` M .claude/settings.json`, ` D .multivac/ecosystem.json`, ` M .multivac/flow.md`, ` M AGENTS.md`.
In `.claude/settings.json` the verify gate and both `graphify hook-guard` hooks are byte-identical
to before; the refresh hook is gone. A second `NEW doors` prints neither notice.

Then follow the printed removal, delete `grapher: graphify` with a change open, and commit:

```sh
cd $S/w2/brain && <the doctor line's Remove: commands> \
  && NEW change new drop-graphify "drop graphify" && sed -i '/^grapher:/d' .multivac/config.yml \
  && git add -A && git commit -q -m 'Drop graphify' && NEW doctor && NEW verify --quiet
```

Expect: the commit passes the hooks (`config … declared by open change drop-graphify`; the
removed paths are not code); `doctor` prints nothing about graphs; `verify --quiet` has no
`ignored` clause. Before the key is deleted, `doctor` prints the `config` line alone.

Edge: replace the config's `grapher:` line with `grapher_auto: maybe` and `graphers: { none: {} }`
— `OLD verify` exits non-zero (`"grapher_auto" must be true or false`); `NEW verify` loads and
names `grapher_auto, graphers`.

## W3. An old codegraph + spec-kit ecosystem, a change in flight (US2)

```sh
mkdir -p $S/w3 && cd $S/w3 && for r in brain web; do mkdir -p $r/src && (cd $r && git init -q \
  && echo 'export const a = 1;' > src/a.ts && git add src && git commit -q -m code); done \
  && cd brain && OLD init --quiet --provider claude --sdd speckit --grapher codegraph . \
  && printf '  web: ../web\n' >> .multivac/config.yml && OLD doors && OLD repos sync \
  && git add -A && git commit -q -m eco \
  && OLD change new web-work "web work" && <declare repos { brain, web }, landing_order> \
  && OLD change plan web-work && OLD change apply web-work
NEW doctor; NEW doors; NEW change apply web-work
```

Expect: `doctor` prints the `config` line, the ecosystem line, one hook line per root
(`brain`, `web`) and `codegraph @ brain` / `codegraph @ web` (`web` with the `codegraph.json`
note); `doors` removes one hook in each root and the ecosystem file; the second `apply` prints no
graph line. In the change's worktree `.codegraph/` remains, ignored through `.git/info/exclude`
(`git status --ignored --short` shows `!! .codegraph/`), and `git worktree remove` succeeds
without `--force`.

## W4. This repository after the last commit (US4)

```sh
cd $WT && wc -c AGENTS.md && test ! -e .claude/CLAUDE.md && test ! -e .graphifyignore \
  && git ls-files | grep -c -i -E 'graphify|codegraph' ; \
  node -e 'const s=require("./.claude/settings.json").hooks;for(const[k,v]of Object.entries(s))console.log(k,v.flatMap(e=>e.hooks.map(h=>h.command)))'
```

Expect: `AGENTS.md` 2,638 bytes ±5% (contracts §4); `git ls-files` names nothing of either
vendor; `PostToolUse` holds `mvac verify >&2 || exit 2` alone, `SessionStart` the session
verify, no `PreToolUse`.

## W5. What it saves (US6)

```sh
# Door bytes per configuration: a scratch .multivac/config.yml per shape, rendered by each build.
cat > $S/render.mjs <<'JS'
const [dist, dir] = process.argv.slice(2);
const { loadConfig } = await import(`${dist}/lib/config.js`);
const { renderBrainDoor } = await import(`${dist}/doors/brain.js`);
const { renderConsumerDoor } = await import(`${dist}/doors/consumer.js`);
const cfg = await loadConfig(dir);
console.log(JSON.stringify({ brain: Buffer.byteLength(renderBrainDoor(cfg, 10)), consumer: Buffer.byteLength(renderConsumerDoor(cfg, 'web')) }));
JS
for g in none graphify codegraph; do node $S/render.mjs /home/user/multivac/dist $S/doors/code-$g; \
  node $S/render.mjs $WT/dist $S/doors/code-$g; done
```

Each `code-$g` declares `doors: [agents, claude]`, `sdd: speckit`, `brain: .`, `web` and `api`,
and `grapher: $g` unless `none`; `codeless-$g` drops `brain: .`. Design figures: research.md R7.

```sh
# This brain's session door, before (main) and after (WT):
wc -c /home/user/multivac/AGENTS.md /home/user/multivac/.claude/CLAUDE.md $WT/AGENTS.md
# Hooks per edit, and the refresh's cost (before only):
P='{"tool_name":"Edit","tool_input":{"file_path":"'$S'/clone/src/a.ts"}}'
HOOK=$(node -e 'console.log(require("/home/user/multivac/.claude/settings.json").hooks.PostToolUse.flatMap(e=>e.hooks).find(h=>h.command.startsWith("L=")).command)')
s=$(date +%s%N); echo "$P" | sh -c "$HOOK"; echo $(( ($(date +%s%N)-s)/1000000 )) ms
python3 -c 'import resource,subprocess,time;t=time.time();subprocess.run(["graphify","update","."]);r=resource.getrusage(resource.RUSAGE_CHILDREN);print(round(time.time()-t,2),"s",round(r.ru_utime+r.ru_stime,2),"cpu",r.ru_maxrss//1024,"MB")'
# change apply on an old codegraph config, before and after (three runs each):
sh $S/apply-time.sh base-cg '' codegraph; sh $S/apply-time.sh new-cg $WT/bin codegraph; sh $S/apply-time.sh new-none $WT/bin none
# The package, the source, the tests:
cd $WT && npm pack --dry-run --json --cache $S/npmcache | node -e 'const p=JSON.parse(require("fs").readFileSync(0))[0];console.log(p.entryCount,p.size,p.unpackedSize)'
git ls-files src | xargs cat | wc -l; git diff --stat $(git merge-base HEAD main) -- src | tail -1
TMPDIR=$S/tmp node --test "dist-test/**/*.test.js" | grep -E '^# (tests|pass|skipped)'
```

`apply-time.sh` (research.md R7) makes a 53-file TypeScript brain, inits it with the build on
PATH (`$WT/bin` holds `mvac` and `multivac` shims running `NEW`), appends `grapher: <g>` for the
new build, opens, declares and plans `t1`, and times `change apply t1`.

## W6. What it loses (US6)

On a scratch worktree of the base, with a codegraph index built for the measurement and removed
after:

```sh
codegraph init . && codegraph callers refreshGraph; codegraph impact refreshGraph; codegraph impact loadConfig
git grep -n -E '\brefreshGraph\(' -- src; git grep -n 'loadConfig(' -- src
graphify path "refreshGraph()" "cmdClose()"
graphify explain "MV-137" --graph .multivac/ecosystem.json
grep -o -E '@anchor MV-137 brain:[^ ]+' .multivac/invariants.md
grep -l -E '^ +- MV-137$' .multivac/changes/*.md .multivac/changes/archive/*.md
rm -rf .codegraph
```

Expect research.md R8's table: `impact` names 12 symbols in 3 files where a grep names 5 direct
callers; the two greps answer `explain`'s row question in 532 bytes against 1,073.

## W7. The legs

```sh
cat > $S/dry.sh <<'SH'
while IFS= read -r leg; do
  q=$(printf %s "$leg" | sed -E 's/ (absent|unique|count=[0-9]+|present|each)$//')
  printf '%s\n    => %s\n' "$leg" "$(cd "$2" && $3 count "$q" 2>&1 | grep -E 'match|vacuous' | head -1)"
done < "$1"
SH
grep '@anchor MV-153' $WT/.multivac/invariants.md | sed -E 's/^<!-- @anchor MV-153 //; s/ -->$//' > $S/legs.txt
sh $S/dry.sh $S/legs.txt $WT "node $WT/dist/cli.js"
grep -v '@anchor' $WT/.multivac/invariants.md | grep -c 'RETIRED 2026-10-02 by MV-153'   # 14
grep -v '@anchor' $WT/.multivac/invariants.md | grep -c 'Amended 2026-10-02 by MV-153'   # 34
cd $WT && NEW verify --strict --check
```

Expect research.md R13.1's prototype column, with legs 8–11 at 0 (11 at 1) and 25–30 at 1.

## The lifecycle, for the human (research.md R9.1)

- Do not run the first `change land drop-graphers` with main's 0.15.0: it rebuilds graphify in
  the worktree and commits `graphify-out/graph.json` and `.multivac/ecosystem.json` back onto the
  branch. Run it with `node $WT/dist/cli.js change land drop-graphers` from main, or push and open
  the merge request by hand and record it after the merge with `mvac change land drop-graphers
  --landed brain` on the rebuilt main.
- If the merge reports modify/delete on `graphify-out/graph.json` or `.multivac/ecosystem.json`,
  resolve by deletion: `git rm graphify-out/graph.json .multivac/ecosystem.json`.
- Before pulling the merge into main: `git -C /home/user/multivac checkout --
  graphify-out/graph.json` (main's refresh hook rewrote it on every edit there).
- After the pull: `rm -rf /home/user/multivac/graphify-out` (≈ 25 MB of outputs the `.gitignore`
  lines no longer hide), `corepack pnpm run build`, `mvac change close drop-graphers` on the new
  build, then start a new session so Claude Code reads the settings without the refresh hook and
  the hook-guard.
