---
description: "Task list for CI moves to GitHub Actions"
---

# Tasks: CI moves to GitHub Actions

**Input**: Design documents from `/specs/072-ci-moves-to-github-actions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: no test-writing tasks — this feature is CI configuration; its own
verification is the quickstart.md scenarios plus `pnpm test` / `verify
--strict`, run in Polish.

**Organization**: tasks grouped by spec.md's user stories (US1 P1, US2 P2,
US3 P2, US4 P3).

## Phase 1: Setup

- [ ] T001 Create `.github/workflows/` and `.github/ISSUE_TEMPLATE/` directories in the repo root

## Phase 2: Foundational (blocks all user stories)

**Purpose**: the one workflow file every job lives in, with its shared triggers and permissions declared before any job is written.

- [ ] T002 Create `.github/workflows/ci.yml` with `name:`, top-level `on: [push, pull_request]` (push covers branches and tags — jobs filter tags with `if:`), and top-level `permissions: { contents: read, id-token: write, pages: write }`

**Checkpoint**: `ci.yml` exists and parses; individual jobs added by each user story below.

---

## Phase 3: User Story 1 - A push or PR is judged the same way it was on GitLab (Priority: P1) 🎯 MVP

**Goal**: `test`, `selfverify`, `change-gate` run on GitHub Actions with the same trigger rules and commands the GitLab jobs used.

**Independent Test**: quickstart.md §1 and §2 — open a PR, watch all three jobs pass; push a change outside an open change's branch and watch `change-gate` fail it.

### Implementation for User Story 1

- [ ] T003 [US1] Add `test` job to `.github/workflows/ci.yml`: `if: github.ref_type != 'tag'`, `actions/checkout@v7.0.1`, `corepack enable && corepack prepare --activate`, `pnpm install --frozen-lockfile`, `pnpm test`, with pnpm store caching (`actions/cache@v6.1.0` keyed on `pnpm-lock.yaml`, path from `pnpm store path`)
- [ ] T004 [US1] Add `selfverify` job to `.github/workflows/ci.yml`: same `if`/checkout/corepack/install as T003, then `pnpm run build` and `node dist/cli.js verify --strict`
- [ ] T005 [US1] Add `change-gate` job to `.github/workflows/ci.yml`: `if: github.event_name == 'pull_request'`, `actions/checkout@v7.0.1` with `fetch-depth: 0`, corepack/install/build as above, then `node dist/cli.js verify --strict --range "${{ github.event.pull_request.base.sha }}..${{ github.sha }}" --branch "${{ github.head_ref }}"`
- [ ] T006 [US1] Amend MV-142's row in `.multivac/invariants.md` to describe the GitHub Actions `change-gate` job and rewrite its three anchors (job name, `if:` condition, verify command) to target `brain:.github/workflows/ci.yml` instead of `brain:.gitlab-ci.yml`, dated today
- [ ] T007 [US1] Amend the parts of MV-68 and MV-111's rows that describe `test`/`selfverify` skipping on tags to name `.github/workflows/ci.yml`, and rewrite their `A tag SKIPS this job` / `when: never` anchors (`count=2`) to the GitHub Actions `if:` equivalent on both jobs

**Checkpoint**: MVP — pushes and PRs are judged on GitHub Actions with no GitLab dependency for the everyday path.

---

## Phase 4: User Story 2 - The docs site keeps advertising the version that is actually published (Priority: P2)

**Goal**: `pages` job builds and deploys the Hugo site, badge sourced from full tag history, deploying only after `publish` succeeds when a tag triggered the run (MV-77).

**Independent Test**: quickstart.md §3.

### Implementation for User Story 2

- [ ] T008 [US2] Add `pages` job to `.github/workflows/ci.yml`: `if: github.ref_type == 'tag' || github.ref == format('refs/heads/{0}', github.event.repository.default_branch)`, `needs: [publish]` with `if: always() && (needs.publish.result == 'success' || needs.publish.result == 'skipped')` so it still runs on a plain default-branch push where `publish` never ran
- [ ] T009 [US2] In the `pages` job: `actions/checkout@v7.0.1` with `fetch-depth: 0`, `peaceiris/actions-hugo@v3.2.1` with `hugo-version: '0.165.0'` and `extended: false` (matches the old `hugomods/hugo:std-go-git-0.165.0` image exactly — see research.md), set `HUGO_PARAMS_RELEASE` from `git describe --tags --abbrev=0 || echo dev`, build with `hugo --minify --baseURL https://multivac.ulm0.com/` in `site/`
- [ ] T010 [US2] In the `pages` job: `actions/configure-pages@v6.0.0`, `actions/upload-pages-artifact@v5.0.0` pointed at `site/public`, `actions/deploy-pages@v5.0.1`
- [ ] T011 [US2] Amend MV-77's row in `.multivac/invariants.md`: rewrite its anchors (`HUGO_PARAMS_RELEASE=...`, `GIT_DEPTH: 0`) to target `brain:.github/workflows/ci.yml`, and update `test/invariants/site-deploy.test.ts` in `test/invariants/site-deploy.test.ts` to read the `needs:` dependency between `pages` and `publish` instead of the GitLab stage list
- [ ] T012 [US2] Run `node --test dist-test/invariants/site-deploy.test.js` (after `pnpm run build`) to confirm the updated test passes against the new workflow file

**Checkpoint**: US1 + US2 both work; the site deploys and orders itself correctly around a release.

---

## Phase 5: User Story 3 - A tagged release publishes to npm with no long-lived credential, and now with provenance (Priority: P2)

**Goal**: `publish` job runs only on `v<semver>` tags, refuses on a version mismatch, publishes via OIDC, and now produces a verifiable provenance attestation — retiring MV-88.

**Independent Test**: quickstart.md §4 and §5.

### Implementation for User Story 3

- [ ] T013 [US3] Add `publish` job to `.github/workflows/ci.yml`: `if: startsWith(github.ref, 'refs/tags/v')`, `actions/checkout@v7.0.1`, corepack enable/prepare, `npm install -g npm@latest` (OIDC publish support), `pnpm install --frozen-lockfile`, `pnpm run build`
- [ ] T014 [US3] In the `publish` job: assert `"v$(node -p 'require(\"./package.json\").version')" == "${{ github.ref_name }}"` before publishing, then `npm publish --access public` with **no** `NPM_CONFIG_PROVENANCE` override (provenance defaults on for OIDC trusted publishing on a GitHub-hosted runner)
- [ ] T015 [US3] Retire MV-88 per `references/change.md`'s retirement procedure: flip its row to `retired` in `.multivac/invariants.md`, keep its ID and body, and add a new `absent` leg — `<!-- @anchor MV-88 brain:.github/workflows/ci.yml /NPM_CONFIG_PROVENANCE/ absent -->` — so the dead override can never resurface
- [ ] T016 [US3] Amend MV-68's row: rewrite its anchors (`aud: "npm:registry.npmjs.org"`, `CI_COMMIT_TAG =~`, `NPM_TOKEN absent`) to their GitHub Actions equivalents on `brain:.github/workflows/ci.yml` (OIDC via `permissions: id-token: write`, `github.ref_name` tag match, no `NPM_TOKEN`/`secrets.NPM_TOKEN` anywhere)
- [ ] T017 [US3] Add a code comment in the `publish` job (mirroring the old file's own style) noting the npmjs.com trusted-publisher setting must be repointed at this GitHub repo before the first tag after this change lands (out-of-band, per spec.md Assumptions) — not machine-checkable, so it is prose, not an anchor

**Checkpoint**: US1-US3 all work; a release publishes with provenance and no stored token.

---

## Phase 6: User Story 4 - Contributors and bug reporters see the same forms GitHub understands (Priority: P3)

**Goal**: PR and issue templates ported byte-equivalent to the paths GitHub reads.

**Independent Test**: quickstart.md §6.

### Implementation for User Story 4

- [ ] T018 [P] [US4] Create `.github/PULL_REQUEST_TEMPLATE.md` with the same section content as `.gitlab/merge_request_templates/Default.md` (What landed / Claims made true / Landing order / Verification / Friction)
- [ ] T019 [P] [US4] Create `.github/ISSUE_TEMPLATE/bug.md` with YAML front matter (`name: Bug`, `about:`, `title:`, `labels:`) followed by the same body as `.gitlab/issue_templates/Bug.md`
- [ ] T020 [P] [US4] Create `.github/ISSUE_TEMPLATE/integration.md` with YAML front matter (`name: Integration`, `about:`) followed by the same body as `.gitlab/issue_templates/Integration.md`
- [ ] T021 [US4] Amend MV-34's row in `.multivac/invariants.md`: rewrite its prose (GitLab merge request/issue templates → GitHub) and its three anchors to target `brain:.github/PULL_REQUEST_TEMPLATE.md` and `brain:.github/ISSUE_TEMPLATE/*.md`

**Checkpoint**: all four user stories work independently; every invariant this change touches now anchors to `.github/`.

---

## Phase 7: Polish & cross-cutting

**Purpose**: retire the GitLab files only once nothing in the brain still points at them, and prove the whole change closes clean.

- [ ] T022 Grep `.multivac/invariants.md` for any remaining `brain:.gitlab` anchor and confirm none survive outside the rows already amended in T006, T007, T011, T016, T021
- [ ] T023 Delete `.gitlab-ci.yml` and the `.gitlab/` directory
- [ ] T024 Write MV-145's row body in `.multivac/invariants.md` (replacing the `RESERVED by change...` placeholder) stating the claim from the change file's `claims:` field, and add its anchors: `<!-- @anchor MV-145 brain:.github/workflows/ci.yml /name:/ present -->`, `<!-- @anchor MV-145 brain:.gitlab-ci.yml // absent -->` (glob absent — file itself gone), and confirm `git ls-files .gitlab` returns nothing
- [ ] T025 Run `pnpm run build && pnpm test` and fix any break
- [ ] T026 Run `node dist/cli.js verify --strict` and fix any broken blocking leg
- [ ] T027 Run quickstart.md §1-§7 end to end against the pushed branch/PR (§4's provenance check waits for a real tag and may be validated after this change lands and the first post-migration release ships)
- [ ] T028 Update `package.json`'s `repository.url`, `homepage`, and `bugs.url` from `gitlab.com/ulm0/multivac` to the GitHub equivalents, since they now describe a repo the code no longer lives in

## Dependencies & Execution Order

- **Setup (T001)** — no dependencies.
- **Foundational (T002)** — depends on T001; blocks every user story phase (they all edit the same `ci.yml` file).
- **US1 (T003-T007)** — depends on T002. No dependency on US2-US4.
- **US2 (T008-T012)** — depends on T002; T008's `needs: [publish]` references a job US3 defines, so land T013 (or at least name the `publish` job) before or together with T008. Sequence US3 before US2 in a single-author run to avoid a dangling `needs:` reference.
- **US3 (T013-T017)** — depends on T002. No dependency on US1/US2/US4.
- **US4 (T018-T021)** — depends on T001 only; fully independent of US1-US3.
- **Polish (T022-T028)** — depends on every prior phase (T022 needs every amendment in place before it can confirm nothing stale remains; T023 needs every job/template ported first).

## Parallel Example

```text
# After Foundational (T002):
Task: "T013 [US3] Add publish job to ci.yml"
Task: "T018 [US4] Create .github/PULL_REQUEST_TEMPLATE.md"
Task: "T019 [US4] Create .github/ISSUE_TEMPLATE/bug.md"
Task: "T020 [US4] Create .github/ISSUE_TEMPLATE/integration.md"
# T008 (US2) waits until T013's publish job is named, since it needs it.
```

## Implementation Strategy

**MVP**: Phase 1 + 2 + 3 (US1) — pushes and PRs are judged on GitHub Actions.
This alone lets `.gitlab-ci.yml` and `.github/workflows/ci.yml` coexist
harmlessly for one transitional commit if ever needed, though this change
lands all phases together since `change close` verifies the whole claim set
at once.

**Incremental**: US1 → US3 (release path, since US2's `pages` job depends on
`publish` existing) → US2 (site) → US4 (templates, fully independent, can run
any time after Setup) → Polish (delete the old files, close the change).
