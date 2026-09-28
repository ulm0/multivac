# Quickstart: walk it with the real vendors

Every command runs in scratch with spec-kit 1.0.11, openspec 1.13.2 and graphify 0.9.29 on
PATH, `HOME` and `GIT_CONFIG_GLOBAL` isolated. Every mutating command is chained with its
`cd` in ONE invocation. `MV` is the change's build; `BASE` is the build at `da4c4e6`, for the
twins the savings are measured against. Expected lines are in [contracts/cli-output.md](contracts/cli-output.md).

```bash
SCR=<scratch>; export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig DO_NOT_TRACK=1
mkdir -p $HOME && git config --global user.name t && git config --global user.email t@t \
  && git config --global init.defaultBranch main && git config --global protocol.file.allow always
```

## Walk A — speckit, a code-less brain, two code repos

1. Two bare remotes `api.git`, `web.git`, each seeded with `src/index.ts`.
2. `cd $SCR/A && mkdir acme-brain && cd acme-brain && git init -q && $MV init --sdd speckit --grapher graphify` — the scaffold line names the skeleton; `wc -c .specify/templates/overrides/*` shows three files; `specify preset resolve plan-template` says the top layer is the project override.
3. Declare `repos:` for api and web before step 0; run the printed step-0 commit.
4. `$MV repos sync` — no `sdd` line for api or web; `find ../acme-api ../acme-web \( -path '*/.specify*' -o -name 'speckit-*' \) | wc -l` is 0 (SC-001).
5. `$MV doors` — api's door names speckit on one line and is ≥ 2,500 B smaller than the `$BASE` twin (SC-002); the brain door's step lines end `[proof: …]` or `[ungateable]`; `grep -c 'commit no Sync Impact Report' AGENTS.md` is 1.
6. Refusals: `repos.web.sdd: opsx` → `$MV verify` exits 2 naming the key; restore. The same edit in `acme-api/.brain/.multivac/config.yml` → in acme-api `$MV verify` exits 0 with the mounted-config line, `--strict` exits 1; restore (SC-004).
7. Write the brain's constitution (replace the template tokens); commit.
8. `$MV change new probe-sdd` — the cite line, the steps, exactly one instruction line; declare `repos: {api, web}`, `landing_order: [[api, web]]`.
9. `bash .specify/scripts/bash/create-new-feature.sh --json --short-name probe-sdd "Probe"` — `cmp` of the new spec.md against the spec skeleton is identical; write the spec.
10. A second change `beta` and its feature directory — `.specify/feature.json` names `specs/002-beta`.
11. `$MV change plan probe-sdd` — the pointer line, the code-location line, one instruction line; `setup-plan.sh --json` then gives `FEATURE_DIR` ending `001-probe-sdd` (SC-006). A plan.md byte-identical to the skeleton makes `apply` refuse naming the override (SC-011). Template bytes read ≤ 4,300 (SC-009).
12. `$MV change apply probe-sdd` — worktrees for api and web, no carry line for them, one instruction line; `git -C ../acme-api show --stat probe-sdd` holds no `.specify` (SC-012: 3 instruction lines across new, plan, apply).
13. In acme-api on `main`: staged `src/index.ts` → `verify --strict` exit 1; staged `specs/x.ts` → exit 1; staged `.specify/x` → exit 0; staged `openspec/config.yaml` → exit 0 (SC-003).
14. Commit code in both worktrees, tick the task, `land`, then `$MV change close probe-sdd --no-sdd` — the pathspec holds `specs/001-probe-sdd`; the archived body ends ``Specified in `specs/001-probe-sdd/` (speckit).`` (SC-005, SC-015).
15. `cd $SCR/A/acme-web && specify init --here --integration claude --force --ignore-agent-tools && cd $SCR/A/acme-brain && $MV doctor` — the governs line and a leftover line for web; `$MV repos check` exit code unchanged.
16. `md5sum .specify/templates/overrides/*.md > ov.md5 && specify init --here --integration claude --force --ignore-agent-tools && md5sum -c ov.md5` — OK ×3 (SC-010).

## Walk B — openspec archive merges

1. `$MV init --sdd opsx` in a brain with api declared and synced; commit `openspec/specs/billing/spec.md`.
2. `$MV change new bill-weekly`; write `openspec/changes/bill-weekly/{proposal.md,tasks.md,specs/billing/spec.md,specs/refunds/spec.md}`; `openspec validate bill-weekly --strict` is valid.
3. `plan`, `apply`, commit in api's worktree, `land --landed api`.
4. `openspec archive bill-weekly --yes`.
5. `$MV change close bill-weekly` — the pathspec holds the archive entry, `openspec/changes/bill-weekly`, `openspec/specs/billing`, `openspec/specs/refunds`; no "dirty" line; after the printed commit, `git status --porcelain -uall` is empty (SC-005).

## Walk C — brain==code keyed `core`

`$MV init --sdd speckit` with the brain entry keyed `core: .`; a change naming `core` with one task left open; after land, `$MV change close` exits 1 naming `tasks.md` (SC-007).

## Walk D — this repository's configuration

In a scratch clone, `diff` `$MV doctor`/`verify` against `$BASE`: only the revisit wording and the door's step endings differ (SC-008). The full suite passes and `verify` is 0 blocking (SC-016).
