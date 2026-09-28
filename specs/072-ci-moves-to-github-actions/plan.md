# Implementation Plan: CI moves to GitHub Actions

**Branch**: `072-ci-moves-to-github-actions` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/072-ci-moves-to-github-actions/spec.md`

## Summary

Replace `.gitlab-ci.yml` and `.gitlab/` with `.github/workflows/ci.yml` and
`.github/{PULL_REQUEST_TEMPLATE.md,ISSUE_TEMPLATE/}`, preserving every job's
behavior (test, selfverify, change-gate, pages, publish) with GitHub Actions
equivalents, each third-party action pinned to its latest released tag as of
2026-09-27. The npm publish job drops `NPM_CONFIG_PROVENANCE: "false"` and
regains provenance, since GitHub's default runners are hosted (the condition
MV-88 existed for no longer holds), which retires MV-88. Five invariant rows
(MV-34, MV-68, MV-77, MV-111, MV-142) are amended in place to anchor the new
paths instead of the GitLab ones; one row (MV-145) is added stating the
migration itself.

## Technical Context

**Language/Version**: GitHub Actions workflow YAML; jobs run Node 24 (this
project's `engines.node`).

**Primary Dependencies** (pinned to latest release tag, checked via `gh api
repos/<owner>/<repo>/releases/latest` on 2026-09-27):
`actions/checkout@v7.0.1`, `actions/cache@v6.1.0`,
`actions/configure-pages@v6.0.0`, `actions/upload-pages-artifact@v5.0.0`,
`actions/deploy-pages@v5.0.1`, `peaceiris/actions-hugo@v3.2.1`. Neither
`actions/setup-node` nor `pnpm/action-setup` is needed — the project pins its
toolchain with `corepack`/`packageManager`, matching the old
`.gitlab-ci.yml`'s own `before_script`; `actions/cache` caches the pnpm store
directly.

**Storage**: N/A (CI configuration only).

**Testing**: existing `pnpm test` and `node dist/cli.js verify --strict`
(unchanged commands — only the runner around them changes).

**Target Platform**: GitHub-hosted `ubuntu-latest` runners (this is the fact
that lets provenance come back — see FR-008).

**Project Type**: CI/CD configuration for a single repo where brain == code
(`repos: { brain: . }`, per `.multivac/config.yml`).

**Performance Goals**: N/A.

**Constraints**: every guarantee FR-001..FR-014 in spec.md names must hold
with no behavior regression; every action pinned, not floating on a major
tag, so the migration is reproducible on the day it lands.

**Scale/Scope**: one workflow file (or a small number split by trigger)
covering 5 logical jobs (test, selfverify, change-gate, pages, publish) plus
3 ported templates; 5 invariant rows amended, 1 retired, 1 added.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. A Claim Nobody Checks Decays** — PASS. Every invariant row this change
  touches (MV-34, MV-68, MV-77, MV-111, MV-142) keeps or gains anchors on the
  new `.github/` paths; none is left describing a file that no longer exists.
- **II. The Tool Never Claims More Than It Checked** — PASS. No new anchor
  claims a cross-file "for each X, a matching Y" fact that a regex can't
  state; ordering facts (publish-before-deploy) stay expressed as a `needs:`
  test the way MV-77 already handles it for GitLab stage order (a dedicated
  `test/invariants/*.test.ts`, not a line-matching anchor).
- **III. The Law Changes Before The Code** — PASS. This change amends MV-34,
  MV-68, MV-77, MV-111, MV-142 and retires MV-88 in the same change that
  rewrites the CI files they describe, per this project's own rule (see
  AGENTS.md: "where a project document and an active row disagree, the row
  wins").
- **IV. Deterministic, Offline, Small** — PASS, and strengthened: pinning
  every action to a specific release tag (not `@v4`-style floating majors)
  keeps CI reproducible; `verify` itself still makes no network call.
- **V. An Invented Integration Is A Lie** — PASS. `sdd: speckit` and
  `grapher: graphify` are unchanged; nothing here invents a new declared
  integration name.

No violations to record in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/072-ci-moves-to-github-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   └── ci.yml                      # test, selfverify, change-gate, pages, publish
├── PULL_REQUEST_TEMPLATE.md        # replaces .gitlab/merge_request_templates/Default.md
└── ISSUE_TEMPLATE/
    ├── bug.md                      # replaces .gitlab/issue_templates/Bug.md
    └── integration.md              # replaces .gitlab/issue_templates/Integration.md

# removed by this change:
# .gitlab-ci.yml
# .gitlab/
```

**Structure Decision**: single workflow file `ci.yml` with five jobs wired by
`on:` triggers and `needs:`, mirroring `.gitlab-ci.yml`'s single-file,
multi-stage shape (`test`, `publish`, `deploy` stages) rather than splitting
into several workflow files — there is one trigger surface (push, pull_request,
tag) and splitting it would re-introduce the exact cross-file ordering problem
MV-77 already solved once with `needs:`/stage ordering in one file.

## Complexity Tracking

*No violations — table intentionally omitted.*
