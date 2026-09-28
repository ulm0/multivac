# Data Model: CI moves to GitHub Actions

No application data. The "entities" here are CI configuration objects and law
rows.

## Workflow (`.github/workflows/ci.yml`)

| Job | Trigger | Depends on | Replaces |
| --- | --- | --- | --- |
| `test` | `push`, `pull_request`; skipped when `github.ref_type == 'tag'` | — | GitLab `test` |
| `selfverify` | same as `test` | — | GitLab `selfverify` |
| `change-gate` | `pull_request` only | — | GitLab `change-gate` |
| `publish` | `push` of a tag matching `v[0-9]+.[0-9]+.[0-9]+` | — | GitLab `publish` |
| `pages` | `push` to default branch, or `push` of a `v*` tag | `publish` (only when the trigger was a tag) | GitLab `pages` |

State a job can be in, mirroring the old pipeline's stage semantics: queued →
running → succeeded/failed/skipped. `needs:` encodes GitLab's stage order
(`test → publish → deploy`) without a second stage list.

## Templates

| File | Fields it must preserve | Replaces |
| --- | --- | --- |
| `.github/PULL_REQUEST_TEMPLATE.md` | "What landed", "Claims made true", "Landing order", "Verification" checklist, "Friction" | `.gitlab/merge_request_templates/Default.md` |
| `.github/ISSUE_TEMPLATE/bug.md` | "What happened", "What you expected", "Your setup", `multivac doctor` output block, "Anything the tool should have told you" | `.gitlab/issue_templates/Bug.md` |
| `.github/ISSUE_TEMPLATE/integration.md` | "The tool", "What it reads", "Why it cannot be verified, if it cannot" | `.gitlab/issue_templates/Integration.md` |

## Law rows touched

| Row | Change | New anchors point at |
| --- | --- | --- |
| MV-34 | amended | `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/*.md` |
| MV-68 | amended | `.github/workflows/ci.yml` |
| MV-77 | amended | `.github/workflows/ci.yml`, `test/invariants/site-deploy.test.ts` |
| MV-111 | amended | `.github/workflows/ci.yml` (absent leg, unchanged claim, new file) |
| MV-142 | amended | `.github/workflows/ci.yml` |
| MV-88 | retired | new `absent` legs for `NPM_CONFIG_PROVENANCE` |
| MV-145 | added | `.github/workflows/ci.yml`, `.gitlab-ci.yml` (absent), `.gitlab/` (absent) |
