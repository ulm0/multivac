# Quickstart: walk it with the built CLI

Every command runs in scratch with `HOME` and `GIT_CONFIG_GLOBAL` isolated. Every mutating
command is chained with its `cd` in ONE invocation — a `cd` that does not persist must never let
a command write into the real brain. `MV` is this change's build; `OLD` is the build of the
branch head before this change's first commit (#5–#7 merged, recorded by T001), for the twins
that must not move; `/root/.local/bin/mvac` is 0.14.1, where a walk names it. Expected lines are
in [contracts/cli-output.md](contracts/cli-output.md); the measurements they are checked against
are in [research.md](research.md).

```bash
WT=<this change's worktree>; SCR=<scratch>; BASE_REV=564aed4   # T001's pre-change head (main 915889f + the speckit files)
unset MULTIVAC_QUIET CLAUDE_PROJECT_DIR
export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0 CODEGRAPH_TELEMETRY=0
mkdir -p $HOME $SCR/bin $SCR/oldbin && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
cd $WT && corepack pnpm build
printf '#!/bin/sh\nexec node %s/dist/cli.js "$@"\n' "$WT" > $SCR/bin/mvac && chmod +x $SCR/bin/mvac
export PATH=$SCR/bin:$PATH; MV="node $WT/dist/cli.js"
mkdir -p $SCR/base && git -C $WT archive $BASE_REV | tar -x -C $SCR/base \
  && cd $SCR/base && corepack pnpm install --frozen-lockfile && corepack pnpm build
printf '#!/bin/sh\nexec node %s/base/dist/cli.js "$@"\n' "$SCR" > $SCR/oldbin/mvac && chmod +x $SCR/oldbin/mvac
OLD="node $SCR/base/dist/cli.js"; S=<scratchpad>/c78/synth8b; CR=<scratchpad>/c78/critic/v8
strip() { sed 's/\x1b\[[0-9;]*m//g'; }
mvac --version
```

`strip` removes colour. Ecosystem fixtures are built with the design's `$S/mkeco.sh <dir>
[extra-config]` — a code-less brain `<dir>/acme-brain` declaring `api` → `../acme-api` (with
`src/` and `db/migrations/0001.sql`) and `web` → `../acme-web`, each with a bare remote
`<dir>/<repo>.git`, and the rows `INV-1` (an `api:` leg on `accounts`) and `INV-2` (a `web:`
leg) — and the critic's `$CR/mkeco-same.sh <dir>`, the same with keys equal to basenames (`api`
→ `../api`, `web` → `../web`) and `INV-3`, `*:README.md /FLUXCAP/ absent`, blocking by default.

## Walk A — this brain from every directory (US1, US5, US8; SC-001, SC-020, SC-040)

1. `git clone -q --shared $WT $SCR/self && cd $SCR/self && mkdir -p .multivac/worktrees && git log -1 --format=%h`
2. `cd $SCR/self && for d in . src src/commands .multivac .multivac/hooks test/verify .multivac/worktrees; do (cd $d && $MV verify --check | strip | grep -v '^  root '); done | sort | uniq -c` — every line counted 7 times; exit 0 each. `$OLD` from `src` exits 2 with `` run `multivac init .` ``.
3. `cd $SCR/self/src && $MV verify --check | strip | grep '^  root '` — `  root      $SCR/self (asked from src)`; from the root, `grep -c '^  root '` is 0.
4. `cd $SCR/self && $MV verify --check --quiet | strip` — one line starting `0 blocking broken · exit 0`, about 195 B (`wc -c`); `cd $SCR/self/src && MULTIVAC_QUIET=1 $MV verify --check | strip` — the same line.
5. `ln -s $SCR/self $SCR/self-link && cd $SCR/self-link && $MV verify --check | strip | grep -c '^  root '` — 0; `cd $SCR/self-link && $MV doctor | grep -c '^root '` and `cd $SCR/self-link && $MV roadmap | grep -c '^root:'` — 0 each.
6. `cd $SCR/self/src && $MV count 'brain:src/**/*.ts /export async function resolveSources/'; echo "exit=$?"` — exit 0, the `read` line and one match in `verify.ts` (SC-036; `$OLD`: exit 2).

## Walk B — the worktree false green (US2; SC-008, SC-010)

1. `cd $SCR/self && git worktree add -q .multivac/worktrees/demo/brain -b demo`
2. `cd $SCR/self/.multivac/worktrees/demo/brain && printf '| MV-999 | probe | specified | active | 2026-09-29 | x |\n<!-- @anchor MV-999 brain:src/cli.ts /THIS_STRING_IS_NOT_THERE/ unique -->\n' >> .multivac/invariants.md && git commit -qam probe --no-verify`
3. `cd $SCR/self/.multivac/worktrees/demo/brain/src && $MV verify --check --strict | strip; echo "exit=$?"` — exit 1, `broken MV-999 … · blocking`, no `scoped to repo`. `cd $SCR/self/.multivac/worktrees/demo/brain/src && $OLD verify --check --strict; echo "exit=$?"` — exit 0, `scoped to repo "brain"`.
4. `cd $SCR/self/.multivac/worktrees/demo && $MV verify --check | strip | grep '^  root '` — `  root      $SCR/self (asked from .multivac/worktrees/demo)`, exit 0; `cd $SCR/self/.multivac/worktrees/demo/brain/src && $MV count 'brain:src/**/*.ts /export async function resolveSources/'; echo "exit=$?"` — exit 0 (SC-036).
5. `cd $SCR/self/.multivac/worktrees/demo/brain && git reset -q --hard HEAD~1`

## Walk C — hook payloads (US6; SC-028–SC-032)

1. `cd $SCR/self/.multivac/worktrees/demo/brain && printf "const x = 'fetch';\n" >> src/commands/doctor.ts`
2. From the main checkout, the exact edit gate:
   `cd $SCR/self && F=$SCR/self/.multivac/worktrees/demo/brain/src/commands/doctor.ts && printf '{"hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"%s"},"cwd":"%s"}' "$F" "$PWD" | CLAUDE_PROJECT_DIR=$PWD sh -c 'mvac verify >&2 || exit 2' 2>$SCR/red.err; echo "exit=$?"; strip < $SCR/red.err | grep -E '^  root |broken MV-01'`
   — exit 2; `  root      $SCR/self/.multivac/worktrees/demo/brain (asked from $SCR/self)` — the session's directory, outside that root, so absolute — and `broken MV-01 [absent] … · blocking`. The same with `env -u CLAUDE_PROJECT_DIR` before `sh` — exit 0.
3. Session start from a subdirectory:
   `cd $SCR/self/src && printf '{"hook_event_name":"SessionStart","source":"startup","cwd":"%s"}' "$PWD" | CLAUDE_PROJECT_DIR=$SCR/self sh -c 'mvac verify 2>&1 || true' | strip`
   — one line, `0 blocking broken · exit 0 · …`.
4. A hook that starts in `$HOME`, as a forwarded hook does:
   `cd $HOME && printf '{"hook_event_name":"SessionStart","source":"resume","cwd":"%s"}' "$SCR/self" | CLAUDE_PROJECT_DIR=$SCR/self sh -c 'mvac verify 2>&1 || true' | strip`
   — the project's one line, no `init`, no `$HOME`; the edit payload of step 2 run from `$HOME`
   (with `"cwd":"$SCR/self"`) gives step 2's exit 2.
5. A repository holding only `.multivac/cache`:
   `mkdir -p $SCR/cacheonly && cd $SCR/cacheonly && git init -q && mkdir -p .multivac/cache graphify-out && echo '{}' > graphify-out/graph.json && echo x > a.txt && cd $SCR/self/.multivac/worktrees/demo/brain && git checkout -q -- src/commands/doctor.ts && cd $SCR/self && printf '{"hook_event_name":"PostToolUse","tool_input":{"file_path":"%s"}}' "$SCR/cacheonly/a.txt" | CLAUDE_PROJECT_DIR=$PWD sh -c 'mvac verify >&2 || exit 2'; echo "exit=$?"`
   — exit 0: the session's root (SC-030). The same for `/nowhere/x.ts`.
6. A deliberately red fixture brain below the toplevel:
   `mkdir -p $SCR/self/test/fixtures/red/.multivac && cd $SCR/self/test/fixtures/red && cp $SCR/self/.multivac/config.yml .multivac/ && printf '| INV-1 | probe | specified | active | 2026-09-29 | x |\n<!-- @anchor INV-1 brain:x.txt /NOPE/ unique -->\n' > .multivac/invariants.md && echo x > x.txt && $MV verify --check; echo "exit=$?"`
   — asked directly, the fixture is verified (its own verdict). Then
   `cd $SCR/self && printf '{"hook_event_name":"PostToolUse","tool_input":{"file_path":"%s"}}' "$SCR/self/test/fixtures/red/x.txt" | CLAUDE_PROJECT_DIR=$PWD sh -c 'mvac verify >&2 || exit 2'; echo "exit=$?"`
   — exit 0: the session's root; nothing of the fixture delivered. `cd $SCR/self && rm -rf test/fixtures/red`
7. `cd $SCR/self && printf '{"hook_event_name":"Stop"}' | CLAUDE_PROJECT_DIR=$PWD $MV verify --check | strip | head -1` — the ordinary report's first line; `cd $SCR/self && CLAUDE_PROJECT_DIR=$PWD $MV verify --check . </dev/null | strip | head -1` — the same, stdin never read.

## Walk D — an ecosystem (US1, US2, US3, US5, US7, US8)

1. `bash $S/mkeco.sh $SCR/eco $S/chan.yml && cd $SCR/eco/acme-brain && $MV doors && $MV repos sync` (`channel: origin/main`), then `cd $SCR/eco/acme-api && git commit -qm mount --no-verify && git push -q origin HEAD && cd $SCR/eco/acme-web && git commit -qm mount --no-verify && git push -q origin HEAD`.
2. `cd $SCR/eco/acme-api/src && $MV verify --check | strip; echo "exit=$?"` and the same from `db/migrations` — the `acme-api` root's report plus the root line, exit 0 (SC-002).
3. `cd $SCR/eco/acme-api/.brain && $MV verify --check | strip | grep -c 'repos sync'` — 0; each missing sibling `not on disk beside this mount — … verify in $SCR/eco/acme-api …`; exit as `$OLD` (SC-014).
4. `cd $SCR/eco/acme-api/.brain && sed -i '/^| INV-2 /d' .multivac/invariants.md && git add .multivac/invariants.md && $MV verify --check | strip; echo "exit=$?"` — `law REFUSED INV-2 was law and is gone · blocking`, exit 1; `cd $SCR/eco/acme-api/.brain/.multivac && $MV verify --check | strip | grep -c '^  root '` — 1, still exit 1. `cd $SCR/eco/acme-api/.brain && git reset -q --hard` (SC-013).
5. `cd $SCR/eco/acme-brain && printf '\n' >> .multivac/invariants.md && git commit -qam 'law: touch' --no-verify && git push -q origin HEAD && $MV verify --check --quiet | strip` — one line and two `stale … pin 1 behind` lines, about 476 B; without `--quiet`, about 714 B (SC-024).
6. `cd $SCR/eco/acme-brain && git worktree add -q .multivac/worktrees/demo/brain -b demo && cd .multivac/worktrees/demo/brain && $MV verify --check | strip; echo "exit=$?"` — exit 0, both siblings at `origin/main` with their fetch age; `cd $SCR/eco/acme-brain/.multivac/worktrees/demo/brain && $MV doctor | strip | grep '^repos'` — `repos      2/2 cloned`; `$OLD` gives `0/2 cloned … git clone …` (SC-009, SC-011).
7. `cd $SCR/eco/acme-api && $MV count 'api:db/**/*.sql /accounts/'; echo "exit=$?"` — exit 0, `api: working tree … — this checkout` (SC-037); then `cd $SCR/eco/acme-api && git worktree add -q $SCR/eco/acme-brain/.multivac/worktrees/demo/api -b demo && cd $SCR/eco/acme-brain/.multivac/worktrees/demo/api/src && $MV count 'api:db/**/*.sql /accounts/'; echo "exit=$?"` — exit 0, the same `this checkout` read (`$OLD`: exit 2).
8. Floor: `cd $SCR/eco/acme-brain && printf 'requires: ">=99.0.0"\n' >> .multivac/config.yml && cd $SCR/eco/acme-api/.brain && printf 'requires: ">=99.0.0"\n' >> .multivac/config.yml`, then `for d in $SCR/eco/acme-brain $SCR/eco/acme-brain/.multivac $SCR/eco/acme-api $SCR/eco/acme-api/src; do (cd $d && $MV verify --check 2>&1 | strip | grep -c 'requires >=99.0.0'); done` — 1 each; `$OLD` prints it at `acme-brain` only (SC-034). Revert both edits with `git checkout --` in each.
9. `cd $SCR/eco/acme-api/.brain && mv .multivac/projected.yml $SCR/projected.bak && cd $SCR/eco/acme-api/src && $MV verify --check 2>&1 | strip | grep -c '^mvac:'` — 0; `cd $SCR/eco/acme-api/.brain && $MV verify --check 2>&1 | strip | grep -c 'doors --adopt'` — 1 (SC-035). `cd $SCR/eco/acme-api/.brain && mv $SCR/projected.bak .multivac/projected.yml`

## Walk E — the change's own sibling worktrees (critic gap 1; US2; SC-012)

1. `bash $CR/mkeco-same.sh $SCR/same` — `path: ../api`; `INV-3` forbids `FLUXCAP` in any README; the law is committed.
2. `cd $SCR/same/acme-brain && git worktree add -q .multivac/worktrees/demo/brain -b demo && git -C $SCR/same/api worktree add -q $SCR/same/acme-brain/.multivac/worktrees/demo/api -b demo && echo FLUXCAP >> $SCR/same/acme-brain/.multivac/worktrees/demo/api/README.md`
3. `cd $SCR/same/acme-brain/.multivac/worktrees/demo/brain && $MV verify --check --worktree | strip; echo "exit=$?"` — exit 1, `api: working tree on demo`, `broken INV-3 … api:README.md:2 · blocking`; `cd $SCR/same/acme-brain/.multivac/worktrees/demo/brain && $MV doctor | strip | grep -o 'api: on [a-z]*'` — `api: on demo`. `$OLD` gives the same (today's answer, kept); the design's s2 gave exit 0 and `api: working tree on main`.
4. Repeat 1–3 in `$S/mkeco.sh`'s layout (`api` → `../acme-api`), with a `FLUXCAP`-forbidding row added and the api worktree made at `.multivac/worktrees/demo/api` from `acme-api` — the same answers, found by key (where `$OLD` reads nothing: `../acme-api` from the worktree is not on disk).

## Walk F — nested mounts, a monorepo, a fixture brain (US1; SC-003, SC-006, SC-007)

1. `bash $S/mkeco.sh $SCR/nest <sp>/c78/synth8/extra-mount.yml && cd $SCR/nest/acme-brain && $MV doors && $MV repos sync` (`mount: docs/brain`), then `for d in . src docs; do (cd $SCR/nest/acme-api/$d && $MV verify --check | strip | grep -c 'scoped to repo "api"'); done` — 1 each, exit 0.
2. A repository `mono` whose `services/api/.brain` is a brain naming `mount: .brain`, with an `absent` leg broken in `services/api/src`: `cd $SCR/mono/services/api && $MV verify --check | strip; echo "exit=$?"` — exit 1, 611 B shape, identical to `$OLD`; `cd $SCR/mono/services/api/src && $MV verify --check | strip; echo "exit=$?"` — the same plus the root line, exit 1 (`$OLD`: exit 2).
3. `mkdir -p $SCR/eco/acme-api/test/fixtures/brainx/.multivac $SCR/eco/acme-api/test/fixtures/other && cp $SCR/eco/acme-brain/.multivac/config.yml $SCR/eco/acme-api/test/fixtures/brainx/.multivac/ && cd $SCR/eco/acme-api/test/fixtures && $MV verify --check | strip | head -1`, and the same from `other` — `scoped to repo "api" …`, exit 0 (`$OLD`: exit 2). `rm -rf $SCR/eco/acme-api/test/fixtures`

## Walk G — ungoverned and failing lookups (US4; SC-016–SC-019)

1. `mkdir -p $SCR/nogit && cd $SCR/nogit && $MV verify; echo "exit=$?"` — today's text, exit 2. `cd $SCR/nogit && git init -q child && cd child && $MV init . --provider claude </dev/null && cd $SCR/nogit && $MV verify; echo "exit=$?"` — `… is in no git repository — nothing was verified; the brain at $SCR/nogit/child verifies from there`, exit 2.
2. `mkdir -p $SCR/dot && cd $SCR/dot && git init -q && printf 'work/\n' > .gitignore && git add .gitignore && git commit -qm dot && mkdir -p work/notes && cp -r $SCR/eco/acme-brain work/ && cd $SCR/dot/work/notes && $MV verify; echo "exit=$?"` — `$SCR/dot/work/notes is inside $SCR/dot, which no brain governs — nothing was verified`, exit 2 (`$OLD`: `` run `multivac init .` ``); `cd $SCR/dot/work && $MV verify; echo "exit=$?"` — today's `this checkout matches no repo declared in the brain at $SCR/dot/work/acme-brain — run …`, exit 2; no `init` in either (SC-016).
3. `mkdir -p $SCR/lib && cd $SCR/lib && git init -q && echo x > x && git add x && git commit -qm x && cd $SCR/eco/acme-api && git submodule add -q $SCR/lib vendor/lib && cd vendor/lib && $MV verify; echo "exit=$?"` — `… is a submodule of $SCR/eco/acme-api, which multivac verifies from there — nothing was verified here`, exit 2. `cd $SCR/eco/acme-api && git submodule deinit -qf vendor/lib && git rm -qf vendor/lib`
4. As root: `cp -r $SCR/eco/acme-api $SCR/dub && chown -R nobody $SCR/dub && cd $SCR/dub && $MV verify; echo "exit=$?"` and the same from `$SCR/dub/src` — exit 2, `git rev-parse --show-toplevel failed in … fatal: detected dubious ownership …` (SC-017). `rm -rf $SCR/dub`
5. `cd $SCR/self/src && GIT_DIR=$SCR/eco/acme-api/.git $MV verify --check | strip | head -1` — this brain's first line.
6. `cd $SCR/self/src && $MV change new zz "probe"; echo "exit=$?"` and `cd $SCR/self/src && $MV repos sync; echo "exit=$?"` — exit 2, `no .multivac/config.yml in $SCR/self/src — it is inside the brain at $SCR/self; run this there`, no `multivac init` (SC-019). `mkdir -p $SCR/plain && cd $SCR/plain && git init -q && $MV change new zz "probe"; echo "exit=$?"` — today's text.
7. Inside a stale-pin mount (simulated: the mount's `.multivac` moved aside, as a pin that predates the brain has none): `cd $SCR/eco/acme-web && mv .brain/.multivac $SCR/stale.bak && cd .brain && $MV verify; echo "exit=$?"` — MV-49's text plus ` Run it in $SCR/eco/acme-web.`, exit 2 (SC-018). `cd $SCR/eco/acme-web && mv $SCR/stale.bak .brain/.multivac`

## Walk H — opsx and codegraph (US1, US5)

1. `mkdir -p $SCR/oc/src && cd $SCR/oc && git init -q && printf 'print(1)\n' > src/app.py && $MV init . --provider claude --sdd opsx --grapher codegraph </dev/null`, then run the printed step-0 commit.
2. `for d in src openspec .codegraph; do (cd $SCR/oc/$d && $MV verify --check | strip | grep -c '^  root '; echo "exit=$?"); done` — 1 each, exit 0; `$OLD` exits 2 in each (166–173 B).
3. `cd $SCR/oc/openspec && $MV verify --check --quiet | strip` — one line.

## Walk I — no adapter, the shims (US5, US8; SC-022, SC-033, SC-038, SC-039)

1. `mkdir -p $SCR/b/src && cd $SCR/b && git init -q && $MV init . --provider claude </dev/null && grep -c '^export MULTIVAC_QUIET=1$' .multivac/hooks/pre-commit .multivac/hooks/pre-merge-commit .multivac/hooks/pre-push && grep -c -E 'MV-[0-9]+' .multivac/hooks/pre-commit .multivac/hooks/pre-merge-commit .multivac/hooks/pre-push` — 1 each, then 0 each.
2. `cd $SCR/b && git add -A && git commit -qm init 2>&1 | strip | tail -3` — the full report (`config … is new here`). Then, each through the shims and each chained with `cd $SCR/b &&`: a law commit — a row added to `.multivac/invariants.md` — prints in full; `echo x > src/a.txt && git add src/a.txt && git commit -qm code 2>&1 | strip` prints one line, about 188 B; a commit that only rewords an existing row's statement prints in full with `no row reached active`.
3. `cd $SCR/b/src && $MV doctor | strip | head -1; echo "exit=$?"` — `root      $SCR/b (asked from $SCR/b/src)`, exit 0 (`$OLD`: exit 1, `config invalid`). `cd $SCR/b && $MV roadmap add later-thing "Later thing" && cd $SCR/b/src && $MV roadmap | strip | head -2` — the root line, then `roadmap: 1 planned`. `cd $SCR/b/src && $MV doors | strip | head -1` — `root: $SCR/b (asked from $SCR/b/src)`.
4. `cd $SCR/b && echo y > src/b.txt && git add src/b.txt && PATH=$SCR/oldbin:$PATH git commit -qm older 2>&1 | strip | tail -2` — the full report, exit 0 under the new shim.
5. `cd $SCR/b && cp .claude/settings.json $SCR/s.json && $OLD doors && cmp .claude/settings.json $SCR/s.json && grep -c MULTIVAC_QUIET .multivac/hooks/pre-commit` — `cmp` silent; 0: the older `doors` rewrote the shims without the export (the stated ceiling). `cd $SCR/b && $MV doors && cmp .claude/settings.json $SCR/s.json && grep -c MULTIVAC_QUIET .multivac/hooks/pre-commit` — silent; 1. The same with `/root/.local/bin/mvac doors` (0.14.1) (SC-033). `grep -c 'mvac verify' .claude/settings.json` — 2.

## Walk J — the suite, the law, the replay (SC-027, SC-041, SC-042)

1. `cd $WT && corepack pnpm test 2>&1 | tail -8` and `cd $WT && MULTIVAC_QUIET=1 CLAUDE_PROJECT_DIR=/x corepack pnpm test 2>&1 | tail -8` — the same counts, 0 failures in both.
2. `cd $WT && $MV verify --strict | strip | tail -3` — every claim anchored, `0 blocking broken · exit 0`; `cd $WT && $MV count 'brain:.multivac/invariants.md /Amended 2026-09-29 by MV-151/'` — 5 (4 without MV-150's note); a plain `grep -c` says 6, because the count leg's own line carries the phrase and the matcher skips anchor lines.
3. `cd $WT && $MV count 'brain:site/content/** /mv-[0-9]+/i' && $MV count 'brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/' && $MV count 'brain:src/hooks/install.ts /graph|refresh/'` — 0 matches each.
4. The replay: `bash $CR/hist.sh` with `MV` as the new binary, over this brain's agent-made commits — 6 of 13 fold, about 1,033 B saved; each commit that prints in full has the law staged (SC-027).

## Walk K — a live harness (for the human)

Open a real Claude Code session in the brain's main checkout, after the change lands there.

1. The SessionStart context shows the one line, starting `0 blocking broken · exit 0`.
2. Edit a file under `.multivac/worktrees/<slug>/brain/` so that it breaks an active blocking
   leg. The same turn gets `PostToolUse:Edit hook blocking error from command: "mvac verify >&2
   || exit 2": …`, naming the worktree's root in its `root` line and its red. Revert the edit.
3. Record both facts, with the Claude Code version, in the change body; they are the two the
   spec's Assumptions say were measured only from the binary and a simulated payload.
