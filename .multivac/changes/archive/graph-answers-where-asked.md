---
slug: graph-answers-where-asked
status: archived
horizon: now
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-25
    - MV-50
    - MV-52
    - MV-87
    - MV-90
    - MV-93
    - MV-103
    - MV-122
    - MV-124
    - MV-125
    - MV-128
    - MV-129
    - MV-131
    - MV-132
    - MV-134
    - MV-137
    - MV-139
    - MV-140
    - MV-143
  adds:
    - MV-148
  retires: []
claims:
  - id: MV-148
    statement: The graph the agent asks is one that answers. A brain that holds no code resolves no grapher and keeps no code graph, keeping an existing install until a human removes it; the brain door and change apply say where each code repo's graph is asked from the brain; the brain's post-edit refresh follows edits into the code repos and never into a checkout of the brain; and the grapher's ignore lines are the root's non-code directories, written before the first build and at land, and committed with the graph.
---

# The graph the agent asks is one that answers

A code-less brain built a code graph of its own law and specs, while nothing told an agent in the brain where the code repos' graphs are asked from.

## Quickstart walked (T075), 2026-09-29

Walked with this change's build at e8a8906 (`MV`) and the base build at e5d034f (`BASE`), graphify
0.9.29 and codegraph 1.6.0, in a scratch directory with `HOME` and `GIT_CONFIG_GLOBAL` isolated and
the telemetry opt-outs set; every `cd` chained with its command. `web` exports `computeTotal()`
and `zeta()` and holds `specs/add.spec.ts`; `api` one function.

- **A.** `init --provider claude --grapher graphify` in an empty repo, graphify off PATH: exit 0,
  the contract's init line, no `graphify-out/`, `.graphifyignore` or `.claude/skills/graphify`
  (SC-015). `repos sync` with web and api declared built both graphs and none in the brain
  (SC-012). web's `.graphifyignore`: the 12 lines `/.agents/` … `/.brain/` … `/openspec/`, no
  `/specs/`, then the record; its graph 7 nodes, `src` 5 and `specs` 2, and after the harness
  install and a refresh 9, none from `.agents/` or `.claude/` (SC-021). A repo whose source was
  untracked got `brain: .`, and its graph answered `computeTotal` (SC-014).
- **B.** `doors`: the where-block, 954 B, no `## graphify` (SC-002). From the brain, `--graph
  ../web/graphify-out/graph.json` answered `computeTotal()` at `src/server.ts` L4 (SC-001); the
  bare verb exited 1, `graph file not found`, and moved nothing. A zero-repo brain's door: the
  three ecosystem verbs and the unresolved line (SC-006).
- **C.** `change apply totals` printed web's base line (`--graph <web>/graphify-out/graph.json
  answers for the base…`); the worktree held no graph (SC-003). web's and api's `git status` were
  the same before `change new` and after `apply` (SC-023). The hook: 540 B (SC-009); a brain-file
  payload built nothing in the brain; a web edit refreshed web's graph, which then answered
  `zeta2()`; an edit in web's worktree, which held no graph yet, ran nothing. In a later change
  naming `brain` and web, a payload from the brain's worktree built nothing there, and one from
  web's worktree, which held the committed graph, refreshed it: its md5 moved and it answered
  `zeta4()` (SC-008, all four payloads). Land named web's untracked `.graphifyignore`,
  created no copy, and committed the graph on `totals`; no `.gitignore` there (SC-023). Close
  removed the worktree holding `graphify-out/cache/` and the rest of graphify's outputs (SC-005),
  and its archive commit named no graph (SC-012). `doctor`: the fact line, web's and api's lines,
  `follows your edits into the code repos' checkouts`; `repos check` exit 0 once api's graph was
  committed (1 before, for api's uncommitted graph, never the brain). `doctor`, `verify`, `doors`
  and `repos sync` left every main checkout's status as it was (SC-023).
- **D.** A brain `BASE` initialised: after `MV doors`, one leftover door line and doctor's removal
  (764 B at this scratch path; the contract's form); `MV init` rewrote the door byte for byte
  (SC-018). `change new` changed no byte of the kept graph and `repos check` stated the leftover on
  the brain's line (SC-016's `change new` half; the payload, land and close halves are the tests'). The printed removal: 23 D and 2 M, one `"PreToolUse": []`, `CLAUDE.md`
  still a link (SC-017); after it and `doors`, no leftover line, and `change new` installed nothing
  (SC-013). With doors `[agents, codex, gemini]`, gemini's uninstall came first and
  `.gemini/settings.json` kept `"BeforeTool": []` (SC-017).
- **E.** This brain at e5d034f: 6,066 nodes; the 12 derived lines and the record, then a plain
  `graphify update .` exited 1, `new graph has 1483 nodes but existing graph.json has 6066`; this
  change's refresh ran `graphify update . --force` (6.4 s, 1,483 nodes, 1,852,060 B), and a later
  plain update exited 0 (SC-024). `MV doors` added exactly the brain==code line to what `BASE doors`
  wrote (SC-019). `graphify explain "graphPointer()"` found the node in the branch's graph and `No
  node matching` in the trunk's (SC-004).
- **F.** A fresh speckit brain holding code, doors claude and codex: after `repos sync` and a
  refresh, 21 files under `.agents/` and `.codex/` and no node from them (SC-020).
- **G.** A code-less brain on codegraph built no `.codegraph` (SC-012); `codegraph query
  computeTotal -p ../web` answered `src/server.ts:4`; `apply` printed codegraph's base line and
  never `-p <worktree>` (SC-003); in a brain==code codegraph brain, `-p <worktree>` for a
  branch-only symbol exited 0 with `No results found`, the hazard that line avoids. Mixed graphers:
  the mixed notice, no refresh entry, both groups `refreshed at change land and change close`, and
  doctor naming both (SC-010). graphify in web's `node_modules/.bin` alone: the unreachable notice,
  no refresh entry, doctor's unreachable line, and the door and flow.md byte for byte as wired
  (SC-011); on PATH again, `doors` wired it.
- **H.** This worktree: `node dist/cli.js doors` changes no door byte; 882 tests, 879 pass and 3
  skipped; `verify --strict` 148 of 148 anchored, 0 blocking; 19 notes by MV-148 (SC-019, SC-025).
- **T076.** In a scratch clone of e8a8906, a plain `graphify update .` exited 0: 1,542 nodes, the
  same ids, 4,242 links (4,228 before), `built_at_commit` e8a8906; copied back.

Specified in `specs/075-graph-answers-where-asked/` (speckit).
