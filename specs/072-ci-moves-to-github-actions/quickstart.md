# Quickstart: validating the GitHub Actions migration

Prerequisites: `origin` remote already points at `github.com:ulm0/multivac.git`
(confirmed); GitHub Actions enabled on the repo; the repo's Pages source set
to "GitHub Actions" (Settings → Pages); the npm trusted publisher for
`multivac` repointed at this GitHub repo (see research.md — out of band, must
happen before the next tag).

## 1. Everyday path (test / selfverify / change-gate)

```sh
git checkout -b scratch/ci-check
git commit --allow-empty -m "trigger CI"
git push -u origin scratch/ci-check
gh pr create --fill
gh pr checks --watch
```

Expected: `test`, `selfverify`, `change-gate` all run and pass on the PR (this
branch carries no code changes so `change-gate`'s own gate — a change must
own the branch to commit code — does not apply; this only proves the jobs
run and call the right commands).

## 2. change-gate actually gates

Push a commit to a scratch branch that is not an open change's branch, and
that touches a source file (see `.multivac/invariants.md`'s MV-137). Confirm
`change-gate` fails the PR the way `.gitlab-ci.yml`'s job used to.

## 3. Site deploy ordering (MV-77)

```sh
git push origin main   # no tag involved
gh run watch --workflow=ci.yml
```

Expected: `pages` runs and succeeds without waiting on `publish` (publish did
not run — no tag).

Then, on a release branch/tag:

```sh
git tag v0.14.2
git push origin v0.14.2
gh run watch --workflow=ci.yml
```

Expected: `test`/`selfverify`/`change-gate` are skipped (tag push);
`publish` runs first; `pages` starts only after `publish` reports success,
and its badge shows `0.14.2`.

## 4. Publish safety check

```sh
git tag v9.9.9   # deliberately wrong — does not match package.json
git push origin v9.9.9
```

Expected: `publish` fails at the tag/version equality check, before calling
`npm publish`. Delete the tag afterward (`git push --delete origin v9.9.9`).

## 5. Provenance

After a real tag publishes, check `npm view multivac --json | jq .dist.attestations`
or the version's npmjs.com page shows a "Provenance" badge — confirms MV-88's
retirement is actually true, not just declared.

## 6. Templates

Open a PR and a new issue against the GitHub repo in a browser; confirm the
PR description box pre-fills with `PULL_REQUEST_TEMPLATE.md`'s content, and
the issue creation page offers "Bug" and "Integration" as named choices.

## 7. Law and graph

```sh
node dist/cli.js verify --strict
node dist/cli.js change close ci-moves-to-github-actions
```

Both must exit 0 before this change is done.
