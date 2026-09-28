# Feature Specification: CI moves to GitHub Actions

**Feature Branch**: `072-ci-moves-to-github-actions`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Migrate this repo's CI from GitLab CI (.gitlab-ci.yml, .gitlab/) to GitHub Actions (.github/workflows/), since the repo's git remote already moved to github.com:ulm0/multivac.git. Every action pinned to its current latest released tag. Preserve every guarantee the old pipeline held: test, selfverify, change-gate, pages (publish-before-deploy ordering, MV-77), publish (tag-gated, OIDC trusted publishing). Restore npm provenance since GitHub-hosted runners are supported (retiring MV-88). Port .gitlab/ MR and issue templates to .github/ equivalents (MV-34). Delete .gitlab-ci.yml and .gitlab/."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A push or pull request is judged the same way it was on GitLab (Priority: P1)

A contributor pushes a branch or opens a pull request. The pipeline runs the test suite, rebuilds the CLI and re-verifies the brain's own law against its own code, and — for a pull request — re-verifies the diff's range against the change it claims to belong to. None of this depends on GitLab; it runs the same way on GitHub.

**Why this priority**: this is the everyday path every contributor and every merge goes through. If it silently stopped running, unverified code could reach `main`.

**Independent Test**: open a pull request against a throwaway branch with a deliberately broken invariant anchor; the run fails and blocks merge, matching what `.gitlab-ci.yml`'s `change-gate` job did.

**Acceptance Scenarios**:

1. **Given** a push to any branch that is not a tag, **When** the workflow runs, **Then** it installs dependencies, runs `pnpm test`, builds the CLI, and runs `node dist/cli.js verify --strict` — matching the old `test` and `selfverify` jobs.
2. **Given** a pull request, **When** the workflow runs, **Then** it additionally runs `node dist/cli.js verify --strict --range <base>..<head> --branch <source-branch>` against the full git history — matching the old `change-gate` job.
3. **Given** a push whose ref is a `v<semver>` tag, **When** the workflow runs, **Then** the test/selfverify/change-gate jobs are skipped, exactly as `.gitlab-ci.yml` skipped them for tags.

---

### User Story 2 - The docs site keeps advertising the version that is actually published (Priority: P2)

The project's Hugo site badge reads the last published version from git tags, and only ever deploys after a release it names has actually reached the registry, never before, so the badge can't announce a version nobody can install yet (MV-77).

**Why this priority**: a site deploy racing ahead of a still-running publish would restore the exact falsehood MV-77 exists to prevent, on the first release after the migration.

**Independent Test**: push a tag; confirm the workflow run graph shows the publish job's success as a precondition of the pages job when a tag triggered the run, and that a merge to the default branch (no tag) still deploys the site without waiting on any publish job.

**Acceptance Scenarios**:

1. **Given** a merge to the repository's default branch with no tag involved, **When** the workflow runs, **Then** the site is built and deployed without depending on the publish job.
2. **Given** a push of a `v<semver>` tag, **When** the workflow runs, **Then** the site deploy job only starts after the publish job has succeeded.
3. **Given** the site is deployed, **When** the badge renders, **Then** it shows the version from `git describe --tags --abbrev=0`, computed with full tag history available (not a shallow clone).

---

### User Story 3 - A tagged release publishes to npm with no long-lived credential, and now with provenance (Priority: P2)

Pushing a `v<semver>` tag that matches `package.json`'s version publishes the package to npm using OIDC trusted publishing. Because GitHub Actions' default runners are GitHub-hosted (unlike the self-hosted GitLab runner this project outgrew its shared-runner minutes on), npm's registry can verify the resulting provenance attestation, so the tarball now carries a verifiable link back to the commit and workflow run that built it.

**Why this priority**: releases are infrequent but irreversible once published; getting the tag/version check and the credential-free publish wrong is a worse failure than a broken everyday CI run.

**Independent Test**: push a tag whose value disagrees with `package.json`'s version to a scratch fork; the publish job refuses before calling `npm publish`. Push a correct tag; the resulting npm version page shows a provenance attestation.

**Acceptance Scenarios**:

1. **Given** a `v<semver>` tag whose semver does not equal `package.json`'s `version`, **When** the publish job runs, **Then** it fails before invoking `npm publish`.
2. **Given** a `v<semver>` tag whose semver equals `package.json`'s `version`, **When** the publish job runs, **Then** it publishes via OIDC with no npm token stored anywhere in the repository or its secrets, and with provenance enabled.
3. **Given** a push that is not a `v<semver>` tag, **When** the workflow runs, **Then** the publish job does not run at all.

---

### User Story 4 - Contributors and bug reporters see the same forms GitHub understands (Priority: P3)

Opening a pull request or an issue on GitHub shows the same prompts the GitLab merge request and issue templates used to show, now in the paths GitHub itself reads.

**Why this priority**: lowest technical risk, but the content still has to move — GitLab reads `.gitlab/`, GitHub does not, so leaving the old paths in place would mean nobody sees a template at all.

**Independent Test**: open a new pull request and a new issue against the GitHub repo; both show the ported template content by default with no manual template selection needed for the PR template and the default choice for issues.

**Acceptance Scenarios**:

1. **Given** a new pull request is opened, **When** GitHub renders the description box, **Then** it is pre-filled with the content that used to live at `.gitlab/merge_request_templates/Default.md`.
2. **Given** a new issue is opened, **When** GitHub offers issue types, **Then** the Bug and Integration templates that used to live at `.gitlab/issue_templates/` are offered with equivalent content.

---

### Edge Cases

- What happens when a tag is pushed whose publish job fails partway (e.g. npm registry outage)? The site deploy job must not run for that tag, since it depends on publish's success — matching MV-77's ordering guarantee.
- What happens on a pull request opened from a fork? `change-gate` still needs the base and head SHAs and the source branch name; a fork PR must resolve these the same way a same-repo PR does, or the job must fail loudly rather than silently pass.
- What happens to the reserved GitLab-only concepts (`CI_MERGE_REQUEST_DIFF_BASE_SHA`, `CI_PROJECT_DIR` cache paths) — every one must have a named GitHub Actions equivalent before the old file is deleted, not simply be dropped.
- What happens if `git describe --tags` is run against a shallow checkout? It must return nothing detectable as a real version; the workflow must always fetch full history for jobs that call it, as the old `GIT_DEPTH: 0` setting guaranteed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST run its test suite and build on every push and pull request, skipping only pushes whose ref is a `v<semver>` tag, matching the old `test` job.
- **FR-002**: The repository MUST rebuild the CLI and run `node dist/cli.js verify --strict` on every push and pull request except tags, matching the old `selfverify` job.
- **FR-003**: The repository MUST run `node dist/cli.js verify --strict --range <diff-base>..<head> --branch <source-branch>` on every pull request, with full git history available, matching the old `change-gate` job (MV-142).
- **FR-004**: The repository MUST build and deploy its Hugo site on every push to the default branch and on every `v<semver>` tag, with the version badge sourced from `git describe --tags --abbrev=0` against full tag history.
- **FR-005**: When a tag triggers both a publish and a site deploy, the site deploy MUST run only after the publish job succeeds (MV-77's publish-before-deploy ordering).
- **FR-006**: The repository MUST publish to npm only on a push of a tag matching `v<semver>`, and MUST refuse to publish when that tag's semver disagrees with `package.json`'s declared version.
- **FR-007**: The npm publish MUST use OIDC trusted publishing with no long-lived npm token stored as a secret.
- **FR-008**: The npm publish MUST produce a verifiable provenance attestation (GitHub-hosted runners support what the old self-hosted GitLab runner could not).
- **FR-009**: Every third-party action referenced by the workflows MUST be pinned to its current latest released version tag at the time of writing.
- **FR-010**: The pull request template that used to live at `.gitlab/merge_request_templates/Default.md` MUST be available at the path GitHub reads by default for new pull requests, with equivalent content.
- **FR-011**: The Bug and Integration issue templates that used to live at `.gitlab/issue_templates/` MUST be available at the path GitHub reads for new issues, with equivalent content.
- **FR-012**: `.gitlab-ci.yml` and the `.gitlab/` directory MUST be removed once every job and template they defined has a working GitHub equivalent.
- **FR-013**: Every invariant row whose anchors currently point at `.gitlab-ci.yml` or `.gitlab/` (MV-34, MV-68, MV-77, MV-111, MV-142) MUST be amended to point at the new GitHub Actions / `.github/` locations, so the law keeps describing the code that actually runs.
- **FR-014**: MV-88 (no provenance from a self-hosted runner) MUST be retired, since the condition it described no longer holds once CI runs on GitHub-hosted runners.

### Key Entities

- **Workflow file(s) under `.github/workflows/`**: replace `.gitlab-ci.yml`'s stages (`test`, `publish`, `deploy`) as GitHub Actions jobs with equivalent trigger and ordering (`needs:`) rules.
- **`.github/PULL_REQUEST_TEMPLATE.md`**: replaces `.gitlab/merge_request_templates/Default.md`.
- **`.github/ISSUE_TEMPLATE/`**: replaces `.gitlab/issue_templates/{Bug,Integration}.md`.
- **Invariant rows MV-34, MV-68, MV-77, MV-111, MV-142, MV-88, MV-145**: the law describing this pipeline; amended, retired, or added by this change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every push and pull request is judged by a GitHub Actions run with no GitLab pipeline remaining to duplicate or contradict it.
- **SC-002**: A pull request that would have failed `change-gate` on GitLab fails the equivalent GitHub Actions job before merge, with zero exceptions across a sample pull request deliberately constructed to trigger it.
- **SC-003**: A tagged release publishes to npm and the resulting package version shows a verifiable provenance attestation on its npmjs.com page.
- **SC-004**: `node dist/cli.js verify --strict` reports zero blocking anchors broken by this change, and `node dist/cli.js change close ci-moves-to-github-actions` succeeds.
- **SC-005**: No file under `.gitlab/` and no `.gitlab-ci.yml` remains in the repository after the change lands.

## Assumptions

- The git remote `origin` already points at `github.com:ulm0/multivac.git` (confirmed) and GitHub Actions is enabled for that repository.
- The npm trusted publisher configuration on npmjs.com for the `multivac` package is repointed from the GitLab project to this GitHub repository and workflow file as an out-of-band manual step on npmjs.com; no code in this repository can perform that step.
- "Latest released tag" for each action means the latest tag `gh api repos/<owner>/<repo>/releases/latest` reports as of the day this change is authored (2026-09-27); it is not a promise to track future releases automatically.
- GitHub's default branch protection / required-status-check configuration (the GitHub equivalent of GitLab's "pipeline must pass before merge" project setting) is a repository setting outside this change's code, matching how the GitLab equivalent was already out of band per MV-142's own stated ceiling.
- The Hugo version the site builds with stays pinned to the same effective version the old `hugomods/hugo:std-go-git-0.165.0` image used, so the built site's output does not change as a side effect of the CI migration.
