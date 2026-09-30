---
slug: verify-rooted-and-quiet
status: archived
horizon: later
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-53
    - MV-112
    - MV-127
    - MV-138
    - MV-150
  adds:
    - MV-151
  retires: []
claims:
  - MV-151
---

# verify finds its root and speaks only when something is off

verify read whatever directory it was run from and printed its full report on every clean run, including after every edit an agent made.

MV-151 is filed `proposed`; enacting it is the human's, in its own commit (MV-81). The two harness facts it rests on — that a green session start's one line reaches the model, and that the edit gate follows a worktree edit — were read from Claude Code's binary and simulated payloads; Walk K of specs/078-verify-rooted-and-quiet/quickstart.md is the human's live-session confirmation, to be recorded here with the Claude Code version.

Walked 2026-09-29 in scratch with this branch's build against the base build (564aed4, main 915889f with the speckit files), `HOME` and `GIT_CONFIG_GLOBAL` isolated, colour stripped (quickstart.md):

- A (this brain): from `src`, `src/commands`, `.multivac`, `.multivac/hooks`, `test/verify` and `.multivac/worktrees` of the main checkout the report is the root's 348 B plus a 49, 58, 55, 61, 57 and 65 B root line, rc 0 (the base build: rc 2, 90–106 B of `init .`); `--quiet` and `MULTIVAC_QUIET=1` print one 195 B line from the root and from `src`; a symlinked path prints no root line from `verify`, `doctor` or `roadmap`; `count` from `src` reads and counts, rc 0 (base: rc 2).
- B (the worktree false green): MV-999 committed on the change worktree's branch, `--check --strict` from its `src` rc 1 naming it `· blocking` with no `scoped to repo` (base: rc 0, `scoped to repo "brain"`); the slug directory prints the main brain's report plus its root line, rc 0 (base: rc 2).
- C (payloads, through the exact gate commands on the PATH's `mvac`): an MV-01 violation in the change worktree, edit payload from the main checkout, rc 2, the red report with `root … demo/brain (asked from <session>)`, 741 B; without `CLAUDE_PROJECT_DIR` rc 0; the session start from `src` and from `$HOME` with `cwd` the project prints the one line; an edit in a cache-only repository, under `/nowhere` or in a deliberately red fixture brain below the toplevel verifies the session's root, rc 0, nothing of the fixture delivered; a `Stop` payload and a `[dir]` run are ordinary runs.
- D (code-less ecosystem, `channel: origin/main`): the consumer root 452 B, `src` and `db/migrations` the same plus the root line, rc 0; inside the mount no `repos sync`, each missing sibling naming the host once, rc 1 as the base; a staged deletion of INV-2 refused from the mount (1,550 B) and its `.multivac` (1,698 B with the root line), rc 1; two pins one behind print the one line and the two `stale` lines, 476 B beside the version notice (820 B in full); the change worktree reads both siblings at `origin/main`, rc 0, and `doctor` there says `repos      2/2 cloned` (base: `0/2 cloned … git clone`); `count 'api:db/**/*.sql /accounts/'` from the consumer and its change worktree's `src` reads `this checkout`, rc 0 (base: rc 2); the `>=99.0.0` floor prints once in the brain, its `.multivac`, the consumer and its `src` (base: the brain only); a mount without a record is silent in the consumer and yellow in the brain and the mount.
- E (the change's own sibling worktrees): `path: ../api` and `path: ../acme-api` both read `api: working tree on demo`, red on the FLUXCAP leg, and `doctor` says `api: on demo`; the base build agrees in the first layout and reads nothing in the second.
- F: `mount: docs/brain` scopes the consumer's root, `src` and `docs` to "api", rc 0 (base: `NOT verified`, rc 2 and rc 1 scoped wrong); the monorepo subproject 609 B rc 1 byte-identical to the base, its `src` the same plus the root line (base: rc 2); a brain fixture under `test/fixtures` is never taken for the brain (the base scoped to the fixture's own config).
- G: outside a repository today's text, or the child brain named; `dot/work/notes` "is inside … which no brain governs", `dot/work` today's "matches no repo declared"; a vendored submodule names its superproject; dubious ownership quoted, rc 2, 288 and 292 B; an ambient `GIT_DIR` leaves the run this brain's; `change new` and `repos sync` from `src` name the brain; a stale-pin mount prints MV-49's text plus `Run it in <host>.`, 302 B.
- H (opsx and codegraph): `src`, `openspec` and `.codegraph` each print one root line, rc 0 (base: rc 2); `--quiet` from `openspec` is one line.
- I (a fresh claude-door brain through its shims): each shim exports the switch once and names no row; the root commit prints in full (370 B, `is new here`), a law commit in full (365 B), a code-only commit one line (207 B, the unanchored row and the stale ecosystem clause on it), a reworded row in full (365 B), the base binary under the new shim in full, rc 0; `doctor`, `roadmap` and `doors` from `src` name the root, `roadmap: 1 planned` (base: `config invalid` rc 1, `roadmap: empty`); `.claude/settings.json` byte-identical under this build's, the base build's and 0.14.1's `doors`, whose shims come back without the export (the stated ceiling).
- J: the suite 986 tests, 983 pass, 3 skipped, with and without `MULTIVAC_QUIET=1 CLAUDE_PROJECT_DIR=/x` exported; `verify --strict` 151 of 151 anchored, 0 blocking; the five notes counted 5 by their leg; MV-126's, MV-84's and MV-52's legs 0. The replay, each commit recomposed in the index and verified with and without the switch: of this brain's 39 commits from b5cdb63 to 915889f, 18 fold (2,724 B), 16 print in full with the law staged and 5 with a change finished at land — the folds are the lifecycle's own bookkeeping commits, whose output an agent never reads; of this change's own 10 agent-made commits, 7 fold (1,586 B) and 3 print in full, each with the law staged.
