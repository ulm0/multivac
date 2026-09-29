---
slug: codegraph-worktrees-and-verbs
status: archived
horizon: next
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-52
    - MV-58
    - MV-61
    - MV-74
    - MV-121
    - MV-124
    - MV-128
    - MV-134
    - MV-140
    - MV-148
  adds:
    - MV-149
  retires: []
claims:
  - id: MV-149
    statement: codegraph answers where the code is. change apply builds or syncs an index in each checkout it hands out and land syncs it on the branch; the registry records the codegraph verbs that were run, each with what it misses, and discloses by version what the agent's own calls write and send; the brain's session gets one post-edit refresh hook per grapher, and no hook refreshes anything for a file outside every repository; and a consumer's codegraph index keeps the mounted brain out through codegraph's own exclude list.
---

# codegraph: an index per worktree and the verbs that replace grep plus Read

A change's worktree had no codegraph index, so a query there answered from the index above it; the door listed one verb that loses to grep.

## Quickstart walked (T077), 2026-09-29

Walked with this change's build carrying the review fixes (`MV`), codegraph 1.6.0, graphify 0.9.29
and git 2.43.0, in a scratch directory with `HOME` and `GIT_CONFIG_GLOBAL` isolated and the
telemetry opt-outs set; every `cd` chained with its command, no vendor run in this repository.
Walks F, G, H and I were not re-walked: their figures are research.md's measurements (R11–R20),
and the tests pin what this build prints for them.

- **SC-008, on #4's branch.** A clone of this repository at 92c4c08 with its grapher set to
  codegraph and `opsx-through-its-cli` at e4b09a7: `change apply opsx-through-its-cli --no-sdd`
  reused the branch, wrote `.gitignore (+1)` and built the checkout's index, appended `.codegraph/`
  to the common `info/exclude`, printed `graph codegraph @ brain worktree: built (\`codegraph
  init\`) — local artifact, never committed` and `its index: -p <worktree> — refreshed after your
  edits; …` (5.6 s, exit 0). `delta.py` against a reference built independently by `codegraph init`
  in a fresh clone checked out at e4b09a7: **0 of the 19 branch-only symbols missing, 0 of 192
  moved symbols more than 60 lines off, 0 moved at all** (1,023 nodes each); the trunk index
  against the same reference: 19 missing, 24 of 192 more than 60 lines off, R1's figures. Against
  R1's own `wtA` the one difference is `syncPProbe`, a probe constant R1's `wtA` index was synced
  with and its tree no longer holds. SC-001: `codegraph query bodyGlobs -p <worktree>` found the
  branch-only function; `-p <checkout>` answered `[i] No results found`, exit 0.
- **A.** In that brain: the worktree's `git status --porcelain --ignored` listed `!! .codegraph/`
  only; after `doors`, the brain's hook (566 B, FR-034's exit) piped an edit adding `wtOnlyProbe` in
  the worktree and the index answered it (560 B of JSON), the checkout's did not; a second apply
  printed `refreshed (\`codegraph sync\`)`; land printed the sync line and committed only
  `src/lib/out.ts`, porcelain empty; after the merge, close printed `brain: worktree removed (…)`,
  no forced removal. A small brain with `doors: [agents]`: `as of this apply, refreshed again at
  \`change land\``, once; the index answered `freshTwinProbe` with `[]` before land and 566 B after
  (SC-004). With `CODEGRAPH_NO_WATCH=1` and the worktree's index removed, apply returned in 1.4 s,
  exit 0, the index rebuilt, no git hook written (SC-003).
- **C.** A code-less brain with web (no `.gitignore`: `repos sync` wrote an untracked one), api
  (`*.db`) and ops (`.codegraph/*`, the spelling `check-ignore` read as ignored): apply printed the
  `info/exclude` line for each, the build line and the pointer; each worktree's porcelain empty,
  each tracked `.gitignore` unchanged; a second apply printed no exclude line and synced; land synced
  each index, committed only the edit, and each index answered its edit; close removed the three
  worktrees with plain removals (SC-002). With no codegraph on PATH and web's checkout indexed:
  exactly one `found on neither PATH nor web worktree's node_modules/.bin` line, #5's base line, no
  `-p <worktree>`; land then built the index, porcelain empty (SC-005, SC-007).
- **D.** A code-less brain, web on graphify and api on codegraph: `doors` wrote two refresh hooks,
  540 B and 606 B (SC-009, SC-011). A web edit through both hooks put `zetaWeb` in web's graph and
  made no `.codegraph` there; an api edit made api's index answer `zetaApi` (552 B) and made no
  `graphify-out` there; a brain-file payload ran nothing and took no lock; every hook exit 0.
  `doctor`: `claude post-edit hooks follow your edits — graphify's and codegraph's …`; flow.md: 2
  rows refreshed after each edit. api's grapher dropped: one hook left, the command a user added
  beside codegraph's kept (SC-012).
- **E.** A graphify brain that holds code, api on codegraph: the brain's hook 500 B and api's follow
  hook 606 B. In change `mx`'s api worktree an edit adding `mixedProbe`, through both hooks: the
  worktree's index answered it (558 B; SC-010), and the brain's own hook refreshed the brain's graph
  too (the stated ceiling). After `graphify update .` in api, `doctor` appended to api's line `also
  holds graphify-out/graph.json of graphify, which it does not resolve — …` with its removal
  (SC-013), and named api's untracked `codegraph.json`, which `repos sync`'s first build wrote.
- **J.** This repository after `doors`: `AGENTS.md` and `.claude/settings.json` byte-identical, no
  `.codegraph/` or `codegraph.json` (SC-024). A second `doors` changed no byte in a single-grapher
  codegraph brain nor in the mixed graphify brain (SC-011). An edit of a file in no repository
  through the mixed brain's two hooks: exit 0 each, no lock, the brain's graph unchanged (SC-026).
- **Review measurements.** On 1.6.0 a `codegraph.json` `exclude` of `**/.brain/` or `**/.brain`
  kept a root `.brain` out as `/.brain/` did, so the splice reads those spellings as naming the
  mount. git 2.43 refused to fast-forward a checkout over an untracked file identical to the one
  the branch adds, which is why land never commits a `codegraph.json` beside the untracked copy the
  first build writes; `doctor` names that copy instead.
- **Second walk and convergence.** A walk of every quickstart step with the real vendors passed 44
  of 45 steps and the 26 SCs, and found one false vendor fact, in the law, the site and research:
  asked with a symbol, `codegraph node <symbol> -f <path>` whose text no printed path holds prints
  every definition, byte for byte what no `-f` prints, exit 0 and no warning; "No indexed file
  matches" is printed only with no symbol, and any part of a printed path, in any case, narrows.
  MV-149's measurement and ceiling, MV-61's note, the registry comment, the site and research R18
  were restated, and `test/change/codegraph-real.test.ts` pins it on 1.6.0. `doctor`'s refresh
  path where several graphers are in play now says, of a local index, that `change apply` builds
  it (FR-011); closed-stdin `init` took 851 to 1,368 ms over five runs, so the site says "about a
  second".

Specified in `specs/076-codegraph-worktrees-and-verbs/` (speckit).
