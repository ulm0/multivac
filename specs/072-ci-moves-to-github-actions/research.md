# Research: CI moves to GitHub Actions

## Action versions (checked 2026-09-27 via `gh api repos/<owner>/<repo>/releases/latest`)

| Action | Latest tag | Used for |
| --- | --- | --- |
| `actions/checkout` | `v7.0.1` | every job that reads repo content |
| `pnpm/action-setup` | `v6.1.0` | installs pnpm (replaces `corepack prepare --activate` for pnpm itself; Node still comes from the `node:24`-equivalent... see below) |
| `actions/configure-pages` | `v6.0.0` | GitHub Pages deploy |
| `actions/upload-pages-artifact` | `v5.0.0` | GitHub Pages deploy |
| `actions/deploy-pages` | `v5.0.1` | GitHub Pages deploy |
| `peaceiris/actions-hugo` | `v3.2.1` | installs the Hugo binary |

**Decision**: pin every action to the exact tag above, not a floating major
(`@v7`) — Constitution Principle IV ("Deterministic, Offline, Small") already
governs `verify`'s own determinism; the same reasoning extends to CI inputs
that could otherwise change what a green run means without a code change.

**Alternatives considered**: floating major tags (`@v4`) are GitHub's own
convention and would auto-pick up patches, but a floating tag is a moving
target this repo's own law (MV-77's ordering guarantee, MV-142's exact
command match) would rather not depend on implicitly; pinning is one line and
costs nothing.

## Node / pnpm toolchain on GitHub-hosted runners

**Decision**: `ubuntu-latest` runners ship Node preinstalled but not
necessarily `>=24` or the exact `pnpm@11.21.0` this project's
`packageManager` field declares. Keep using `corepack enable && corepack
prepare --activate` exactly as `.gitlab-ci.yml` did — it already reads the
pin from `package.json` and needs no action at all. Use
`actions/setup-node@v7.0.0` only for its dependency-cache integration
(`cache: pnpm`), pointed at Node 24 to satisfy `engines.node`.

**Alternatives considered**: `pnpm/action-setup` installs pnpm from its own
version input, duplicating the pin `packageManager` already states — a
second place the pnpm version could drift from the manifest. Rejected in
favor of corepack, which reads the one declared pin.

## Hugo version parity

**Decision**: the old pipeline pinned `hugomods/hugo:std-go-git-0.165.0`.
Per HugoMods' own tag documentation (docker.hugomods.com/docs/tags/), `std`
means the standard (non-extended) Hugo build, `go-git` bundles Go and git in
the image, and the trailing segment is the Hugo version. So the exact
equivalent on `peaceiris/actions-hugo@v3.2.1` is `hugo-version: '0.165.0'`
with `extended: false` — this project's site has no `.scss` sources, so
extended was never needed and matching it exactly (rather than guessing
"extended is a safe superset") keeps the built output identical.

**Alternatives considered**: `extended: true` would still build correctly
(no scss to fail) but changes the binary from the one every prior build
actually used, which is an unforced, unverifiable difference from the
baseline — rejected per the same "don't introduce a variable nothing asked
for" reasoning as pinning actions exactly.

## GitLab MR/pipeline variables → GitHub Actions equivalents

| GitLab | GitHub Actions | Notes |
| --- | --- | --- |
| `$CI_COMMIT_TAG` | `github.ref_type == 'tag'` / `startsWith(github.ref, 'refs/tags/v')` | job-level `if:` |
| `$CI_PIPELINE_SOURCE == "merge_request_event"` | `github.event_name == 'pull_request'` | `change-gate` job trigger |
| `$CI_MERGE_REQUEST_DIFF_BASE_SHA` | `github.event.pull_request.base.sha` | range base for `verify --range` |
| `$CI_COMMIT_SHA` | `github.sha` (on `pull_request`, this is the merge commit; use `github.event.pull_request.head.sha` for the actual head) | range head |
| `$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME` | `github.head_ref` | `--branch` argument |
| `$CI_DEFAULT_BRANCH` | `github.event.repository.default_branch` | pages deploy-on-default-branch condition |
| `GIT_DEPTH: 0` (full clone) | `actions/checkout@v7.0.1` with `fetch-depth: 0` | needed wherever `git describe --tags` or a diff range is computed |
| GitLab `cache:` (pnpm store) | `actions/setup-node@v7.0.0`'s built-in `cache: pnpm`, or `actions/cache@v6.1.0` keyed on `pnpm-lock.yaml` | dependency cache |
| GitLab Pages (`pages:` job + `artifacts.paths`) | `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`, with the repo's Pages source set to "GitHub Actions" | requires a one-time repo setting, out of band, same category as branch protection |
| GitLab `stages: [test, publish, deploy]` ordering | GitHub Actions `needs:` between jobs in one workflow file | publish-before-deploy (MV-77) becomes `deploy: needs: [publish]`, conditioned so it only applies when publish actually ran |
| GitLab OIDC (`id_tokens: NPM_ID_TOKEN`) | GitHub Actions OIDC (`permissions: id-token: write`) | npm's trusted-publisher flow reads the standard OIDC token GitHub issues; no per-job `aud` claim needed the way GitLab required |

## Provenance restoration (retiring MV-88)

**Decision**: MV-88 exists because npm's registry refuses to verify a
provenance bundle from anything but a GitHub- or GitLab.com-hosted (shared)
runner, and this project's GitLab pipeline ran on a self-hosted runner after
exhausting its shared-runner minutes. GitHub Actions' default `ubuntu-latest`
runner is GitHub-hosted, which is exactly the environment npm's provenance
verification accepts. Moving CI to GitHub Actions removes the precondition
MV-88 states, so: drop `NPM_CONFIG_PROVENANCE: "false"` from the publish job,
and retire MV-88 per the brain's own retirement procedure (row flips to
`retired`, new `absent` legs written for `NPM_CONFIG_PROVENANCE` on the new
workflow file, per `references/change.md`'s "Retiring an invariant").

**Alternatives considered**: keeping provenance disabled "to be safe" was
rejected — MV-88's own text names its restore condition explicitly ("the day
this project publishes from a gitlab.com shared runner again"), and GitHub's
hosted runner satisfies the equivalent condition for GitHub, so leaving it
off would be carrying a limitation this migration itself removes.

## npm trusted publisher reconfiguration (out of band)

**Decision**: npmjs.com's trusted-publisher setting for the `multivac`
package currently names GitLab (namespace `ulm0`, project `multivac`, CI file
path `.gitlab-ci.yml`, per the comment in the old pipeline). This is a
website setting with no CLI or file-based representation in this repo, so it
is called out as a manual, out-of-band step in spec.md's Assumptions rather
than a task this change's code can perform. It must be done before the first
tag is pushed after this change lands, or the publish job's OIDC exchange
will fail.

## Issue/PR template format

**Decision**: GitHub reads a single default PR template at
`.github/PULL_REQUEST_TEMPLATE.md` (no chooser needed for one template,
matching GitLab's one `Default.md`), and issue templates in
`.github/ISSUE_TEMPLATE/*.md` using the classic Markdown format (front matter
`name:`/`about:`, not the newer YAML-forms format) to keep the port
byte-for-byte on the body content, only adding the small front matter block
GitHub requires to list each template by name.

**Alternatives considered**: GitHub's newer YAML issue-forms format
(`.yml`) gives structured fields, but rewriting `Bug.md`/`Integration.md`'s
free-form Markdown prompts as form fields would change their content, which
the spec's FR-011 asks to avoid; Markdown templates carry the existing
content unchanged.
