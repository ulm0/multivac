---
slug: test-branch-determinism
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-24
  retires: []
claims:
  - id: MV-24
    statement: Every git repo a test creates is initialised on an explicit `main` through the shared `gitInit` helper, so no assertion in the suite depends on the host's `init.defaultBranch`.
---

# Test fixtures pin their default branch

`pnpm test` is green on a developer machine and red in CI, and the repo could
not see it: every test fixture calls `git init -q` and then asserts on `main`.
`git init` takes its branch name from `init.defaultBranch`, which is set to
`main` in a typical developer's global git config and unset in `node:24` —
where git 2.39 still falls back to `master`. Seven tests across
`apply-base`, `lifecycle-polish` and `change` fail in a fresh container with
`fatal: invalid reference: main` and `'master' !== 'main'`, so the `test` job
on `.gitlab-ci.yml` is failing on main while the working tree looks green.

The tool itself is not wrong — it reads the real default branch and reported
`branched points-expire from master` correctly. Only the fixtures are
ambient-config dependent.

Fix at the root rather than per call site: one exported `gitInit` in
`test/helpers/fixture.ts` that passes `-b main`, used by all six places that
init a repo, plus an `absent` tombstone over `test/**` (excluding the helper)
so a new test cannot reintroduce a bare `git init`. A direct assertion that
the fixture brain is on `main` makes the regression fail on a developer
machine too, not only in CI.

Anchors: `test/helpers/fixture.ts` for the helper and its `-b main`,
`test/**` for the tombstone, `test/helpers/scaffold.test.ts` for the branch
assertion.
