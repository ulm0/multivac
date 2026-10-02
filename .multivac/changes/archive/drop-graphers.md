---
slug: drop-graphers
status: archived
repos:
  brain:
    status: landed
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
---

# multivac keeps no code graph

multivac declared, installed, refreshed, gated on and committed code graphs and an ecosystem graph that every session paid for in door text and hooks; it now keeps none, and a brain an earlier release equipped is told once what is ignored and gets back only what multivac wrote.

## M0 — the base, re-measured on the change's tree

Measured 2026-10-02 in `.multivac/worktrees/drop-graphers/brain` (branch `drop-graphers`, carry
commit `5be0345` over main `41e52c5`, 0.15.0), scratch with `HOME` and `GIT_CONFIG_GLOBAL`
isolated; graphify 0.9.29, codegraph 1.6.0.

- **Base.** The frontmatter declares `touches` the 34 rows of research.md R14.3, `adds: [MV-153]`,
  `retires` the 14 of R14.2, and `claims` MV-153 and the 34 (rule 4, MV-150 — the deviation from
  R16.1, which claimed MV-153 alone); `repos: { brain }`, `landing_order: [[brain]]`. MV-153 is
  `RESERVED`; MV-143–MV-152 are `proposed`; the constitution is 3.0.2; `git status` clean;
  `corepack pnpm run build` rc 0; the suite: **987 tests, 984 pass, 3 skipped, 0 fail** (163 s);
  `verify --strict --check` rc 0, 152 of 153 rows anchored, all ok.
- **The gate.** The pre-commit shim runs this worktree's own `dist/cli.js` (MV-92: the repository
  is multivac), not main's `mvac`; each commit is also checked with main's 0.15.0 `mvac verify`.
- **Rows (T002).** 50 rows and 97 legs name `graphify|codegraph|grapher|graph gate|refresh
  hook|ecosystem.json|ecosystem graph`; 54 rows and 116 legs with `\bgraph\b|graph.json|hook-guard|--graph`
  added — every one in R14.1; no row merged since `f156896`.
- **Quotes and lines (T003).** Every sentence R14.3 quotes is in its row (the five unmatched are the
  replacement texts and MV-102's leg title); all 55 leg lines of R14.3 and the 15 `absent` leg lines
  of R14.2 match the law at `5be0345`.
- **Kept legs (T004).** On the documents this change edits, the legs of kept rows that match a line
  naming a graph are MV-31 (commands.md :48 `count=9`, configuration.md :171 `count=11`), MV-42
  (commands.md :914), MV-129 (commands.md :1204, moved), MV-136 (seed test :283, moved), and
  MV-102 and MV-141's init tests (dropped) — R13.4's list.
- **Legs on the base (T005).** MV-153's thirty, the fourteen tombstones and the 27 moved legs give
  R13.1–R13.3's base column exactly.
- **Before (T006).** Door bytes, base build: consumer 1,310 / 1,884 / 2,293 (none / graphify /
  codegraph); brain holding code 2,811 / 4,594 / 4,921; code-less brain 2,745 / 3,887 / 4,171.
  This brain's session door: `AGENTS.md` 4,445 + `.claude/CLAUDE.md` 226 = 4,671. Hooks:
  `PostToolUse` 2 (gate, refresh), `PreToolUse` 2 (hook-guard search, read), `SessionStart` 1.
  The refresh hook returned in 17–21 ms, then its lock was held ~6.5 s; `graphify update .` after
  a one-line edit: 6.48, 6.90, 6.62 s wall, 9.34–10.08 s CPU, 191 MB peak. `graphify hook-guard`:
  search 78–88 ms, 190 B; read 67–93 ms, 239 B (a file newer than the graph) or 402 B.
  `change apply` (53 files of the base's `src/`, no SDD, three runs): codegraph 1,920, 2,261,
  1,972 ms; none 599, 555, 553 ms. Package: 62 files, 288,664 B packed, 905,793 unpacked.
  Source: 19,665 lines in 53 files; tests: 27,397 lines. `.multivac/ecosystem.json` is 472,884 B
  here (461,364 at `41e52c5`); `graphify-out/graph.json` 2,198,534 B.
- **Lost (T007)**, on a scratch clone of `41e52c5` with a codegraph index built and removed after:
  `codegraph callers refreshGraph` 300 B, 271 ms; `codegraph impact refreshGraph` 12 symbols in 3
  files, 464 B, 295 ms, where `git grep -n -E '\brefreshGraph\(' -- src` gives the definition and
  5 direct callers (521 B); `codegraph impact loadConfig` 170 lines, 3,695 B, 313 ms, against 21
  grep lines, 1,871 B; `graphify path "refreshGraph()" "cmdClose()"` 74 B, 410 ms; `graphify
  explain "MV-137" --graph .multivac/ecosystem.json` 1,073 B, 230 ms, against two greps of 378 B
  (`grep -o … | sort -u`) and 156 B (3 change files) = 534 B.


## The upgrade, walked (T049)

quickstart.md W2 and W3, walked 2026-10-02 at `092bf17` in scratch (`$S`) with `HOME`,
`GIT_CONFIG_GLOBAL` and `TMPDIR` isolated: each brain made by main's 0.15.0 (`OLD`) with the real
vendors, then read by this build (`NEW`). Every line matches contracts/cli-output.md §1–§5; no
fix to T040–T045 was needed.

- **W2, an old graphify brain** (`OLD init --provider claude --grapher graphify`, committed, plus
  the human's own `.claude/settings.json.graphify-bak`):

  ```txt
  $ NEW verify            → config    grapher ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
  $ NEW verify --quiet    → 0 blocking broken · exit 0 · 0 claims · 0 anchored · read brain main @ 626867a (working tree) · enact not answered (nothing staged) · grapher ignored (delete from .multivac/config.yml)
  $ NEW doctor
  config     grapher ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
  leftover   .multivac/ecosystem.json — no longer rendered or read; `multivac doors` removes it
  leftover   .claude/settings.json @ brain: 1 post-edit graph refresh hook an earlier multivac wrote — `multivac doors` removes it
  leftover   graphify @ brain: graphify-out/ (tracked), .graphifyignore, its agents and claude installs — left by an earlier release; nothing refreshes it, so it answers for an older tree, and graphify's own hooks still send agents to it. Remove: cd $S/w2/brain && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && git rm -r -q --ignore-unmatch -- graphify-out .graphifyignore && rm -rf graphify-out .graphifyignore; drop `graphify-out/*` `!graphify-out/graph.json` from .gitignore; `.claude/settings.json.graphify-bak` is your own pre-install copy: keep `*.graphify-bak` in .gitignore while it is there; review `git diff` — each uninstall drops the whole hook group it wrote — then commit
  $ NEW doors
  brain: door + hooks updated
  brain: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph
  brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
  brain: .multivac/ecosystem.json removed — multivac no longer renders it; commit the removal
  brain: brain==code — the brain door is this repo's door
  ```

  `git status --short`: ` M .claude/settings.json`, ` D .multivac/ecosystem.json`,
  ` M .multivac/flow.md`, ` M AGENTS.md` — and a sha256 of every file outside `.git` before and
  after names those four alone (SC-010). In `.claude/settings.json` the session verify, the gate
  and both `graphify hook-guard` hooks are unchanged; the refresh hook is gone. The door carries
  §4's line (`graphify's own skills and hooks here still send you to \`graphify-out/\`, …`). A
  second `NEW doors` prints neither notice. Running the printed removal (graphify's two
  uninstalls, then the `git rm`), dropping the two `.gitignore` lines, `change new
  drop-graphify` and deleting `grapher:` committed through the hooks with `NEW` on PATH
  (`config    .multivac/config.yml is modified, declared by open change drop-graphify`);
  before the key went `doctor` printed the `config` line alone, after it nothing about a graph,
  and `verify --quiet` no `ignored` clause. Edge: `grapher_auto: maybe` and
  `graphers: { none: {} }` — `OLD verify` exits 2 (`"grapher_auto" must be true or false`);
  `NEW verify` exits 0 with `config    grapher_auto, graphers ignored — …; delete them from …`.
- **W3, an old codegraph + spec-kit ecosystem with a change in flight** (`OLD init --sdd speckit
  --grapher codegraph`, `web: ../web`, `OLD doors`, `OLD repos sync`, `web-work` declared over
  `{ brain, web }`, planned and applied by `OLD`, which built an index in each worktree):

  ```txt
  $ NEW doctor (its config and leftover lines)
  config     grapher ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
  leftover   .multivac/ecosystem.json — no longer rendered or read; `multivac doors` removes it
  leftover   .claude/settings.json @ brain: 1 post-edit graph refresh hook an earlier multivac wrote — `multivac doors` removes it
  leftover   .claude/settings.json @ web: 1 post-edit graph refresh hook an earlier multivac wrote — `multivac doors` removes it
  leftover   codegraph @ brain: .codegraph/ (local) — left by an earlier release; nothing syncs it, so it answers for an older tree. Remove: cd $S/w3/brain && rm -rf .codegraph; drop `.codegraph/` from .gitignore — then commit
  leftover   codegraph @ web: .codegraph/ (local), codegraph.json — left by an earlier release; nothing syncs it, so it answers for an older tree. Remove: cd $S/w3/web && rm -rf .codegraph; drop `.codegraph/` from .gitignore; codegraph.json is codegraph's own config: delete it, or drop from its "exclude" the lines an earlier multivac added — then commit
  $ NEW doors
  brain: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph
  brain: .multivac/ecosystem.json removed — multivac no longer renders it; commit the removal
  web: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph
  ```

  The files changed are the two settings files, the two doors, the brain's `flow.md`, and the
  removed `.multivac/ecosystem.json` (sha256 over both repos); `codegraph.json` and both
  `.codegraph/` stay. `NEW change apply web-work` prints no graph and no index line. In each
  worktree `git status --ignored --short` shows `!! .codegraph/` (the brain's through its
  `.gitignore`, web's through `.git/info/exclude`), and `git worktree remove` succeeds in both
  without `--force`. The prototype printed the hook and vendor lines root by root; this build
  prints them in §2's order (hooks, then vendors), which the contract and W3 state.

## The documents (T050–T059)

The reference page is `site/content/docs/reference/sdd.md` ("SDD tools"), its old URL kept by
`aliases: ["/docs/reference/graphers-and-sdd/"]`, and every link under `site/content` moved
with it. `hugo` is not installed in this container, so T059's `hugo --minify` did not run here:
CI's site job (`.github/workflows/ci.yml`, hugo 0.165.0) builds the site on the pull request
and is where the alias redirect is checked. Every in-site anchor link was checked against the
headings of the page it names; none points into a removed section. The past CHANGELOG entries,
`specs/**` other than this change's, the archive and docs/audit-2026-08-18.md are unedited
(`git diff 5be0345..HEAD` over them is empty). T056 and T057 landed in one commit so the two
skill copies are byte-identical in every commit (MV-72).

## Measured on the change's tree (T065–T067)

After commit `e7ef664` (this repository's graphify setup gone), same scratch isolation as M0.

- **This brain's session door**: `AGENTS.md` 2,638 bytes and no `.claude/CLAUDE.md` — a Claude
  Code session here loads 4,671 → 2,638 bytes (−2,033, −43.5%), the prototype's figure exactly.
- **Doors per old config** (`render.mjs`, each build's `dist/`): consumer 1,310 / 1,884 / 2,293
  → 1,137 (none / graphify / codegraph); brain holding code 2,811 / 4,594 / 4,921 → 2,645;
  code-less brain 2,745 / 3,887 / 4,171 → 2,579. Saved with a grapher: 747–1,156 bytes on a
  consumer door, 1,308–2,276 on a brain door — the design's figures, so the CHANGELOG's ranges
  stand.
- **Hooks** in `.claude/settings.json`: `PostToolUse` 2 → 1 (`mvac verify >&2 || exit 2`),
  `PreToolUse` 2 → 0, `SessionStart` 1 → 1.
- **`change apply`** (`apply-time.sh`, the base's 53 `src/` files, no SDD, three runs): this
  build on an old `grapher: codegraph` config 481, 517, 523 ms; on none 489, 462, 475 ms
  (M0, the base build: 1,920, 2,261, 1,972 and 599, 555, 553 ms).
- **Package** (`npm pack --dry-run --json`): 62 files, 288,664 B packed, 905,793 unpacked → 59,
  230,785 and 718,766 (−20.1%, −20.6%).
- **Source**: 19,665 → 16,173 lines, 53 → 50 files (−3,492, −17.8%): `git diff --stat 5be0345
  -- src` is 28 files, +700 −4,192 — four modules deleted, `src/lib/dropped.ts` added, 23 edited.
  The prototype's 16,071 was 102 lines shorter; the upgrade path here is longer.
- **Tests**: 987 → 824 (822 pass, 2 skipped, 0 fail). 174 runs went: the 171 test declarations
  R10 lists, three of them generated once per vendor; 11 were added, 23 retitled. Test sources
  27,397 → 21,245 lines.
- **Law**: `.multivac/invariants.md` 507,249 → 525,842 bytes (+18,593).
- **Into MV-153** (and research.md R14.4): its three ⟨ ⟩ slots now read 3,492 source lines, 174
  of 987 tests, and 59 files and 230,785 bytes. Its base timings, which M0 re-measured outside
  the design's ranges, now span both sets of runs: the refresh hook returned in 17–25 ms, the
  rebuild took 5.8–6.9 s and 8.2–10.1 s of CPU, the guard 67–93 ms, and `change apply` on a
  codegraph brain 1,629–2,261 ms.

## For the human: the lifecycle around this change (T071)

The implementation stops here: `change land` and `change close` are yours (T072). Main still
runs 0.15.0, whose `land` and `close` build and commit graphs, so:

- **Do not run the first `change land drop-graphers` with main's 0.15.0.** Its graph commit
  reads main's config (still `grapher: graphify`), rebuilds graphify in the worktree and commits
  `graphify-out/graph.json` and `.multivac/ecosystem.json` back onto the branch, undoing the last
  content commit. Either run it with this change's own build, from main:
  `node .multivac/worktrees/drop-graphers/brain/dist/cli.js change land drop-graphers`; or push
  and open the merge request by hand, and after the merge record it with
  `mvac change land drop-graphers --landed brain` on the rebuilt main.
- **A modify/delete conflict** on `graphify-out/graph.json` or `.multivac/ecosystem.json` (main's
  bookkeeping and other changes' lands rewrite both while this branch deletes them) resolves by
  deletion: `git rm graphify-out/graph.json .multivac/ecosystem.json`.
- **Before pulling the merge into main**: `git -C /home/user/multivac checkout --
  graphify-out/graph.json` — main's refresh hook rewrites it after every Edit or Write there, and
  a dirty `graph.json` refuses the pull.
- **After the pull**: `rm -rf /home/user/multivac/graphify-out` (about 25 MB of outputs the
  removed `.gitignore` lines no longer hide), `corepack pnpm run build`, then `mvac change close
  drop-graphers` on the new build — 0.15.0's close would run the graph gates and render
  `.multivac/ecosystem.json` into the archive commit — and then start a new session, so Claude
  Code reads `.claude/settings.json` without the refresh hook and graphify's hook-guard.
- `ci-moves-to-github-actions` is still open: closed on 0.15.0 before this merge, its archive
  commit carries a refreshed `graph.json` and `ecosystem.json` (then the modify/delete above);
  closed after, on the new build, it carries neither.
- MV-153 is filed `proposed`; only you make it `active` (MV-81). The constitution moved 3.0.2 →
  3.0.3 as a PATCH (R12).

Specified in `specs/081-drop-graphers/` (speckit).
