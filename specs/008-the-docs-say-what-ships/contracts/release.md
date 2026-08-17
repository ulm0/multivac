# Contract: what a multivac release is

Nothing in this file is new. It is the contract as it already stands, written
down because this change is the first release cut against it deliberately, and
because MV-84 only makes sense as the missing rung of it.

## The four things that must agree

| Where | What it says | What holds it |
| --- | --- | --- |
| `package.json` `version` | the version being released | the author |
| `CHANGELOG.md` newest `## X.Y.Z — YYYY-MM-DD` | that same version, dated, with its entry | MV-78, `test/invariants/changelog.test.ts` |
| `site/content/_index.md` badge | that same version | MV-77, `test/invariants/site-version.test.ts` |
| the git tag `vX.Y.Z` | that same version | MV-68, `.gitlab-ci.yml` publish job |

The publish job's own line, which is the last check and the only one that can
be made about the tag itself:

```sh
test "v$(node -p 'require("./package.json").version')" = "$CI_COMMIT_TAG"
```

## What MV-84 adds

Those four hold the *pinned* version strings equal. None of them says anything
about a version written into a page's prose — which is how `install.md` came to
tell readers the binary prints `1.0.0` and the package is `private: true`,
under a law table that already had 83 anchored rows.

MV-84: **the site's pages carry exactly one version string.** With MV-77
asserting that string is the badge and equals the manifest, the pair says what
neither says alone.

## The order, and why it is that order

1. Manifest, changelog and badge, in one branch. Merged to `main`.
2. `pnpm test` and `mvac verify --strict` green on `main`.
3. Tag `vX.Y.Z` on that commit, pushed.
4. The publish job runs, re-checks the tag against the manifest, and publishes
   by OIDC.

The tag is pushed **after** the agreement exists locally, so step 3's check
confirms rather than discovers. A release is a decision somebody makes, never a
side effect of a merge (MV-68).

## What is deliberately not in the contract

- **Asking npm what is published.** `verify` takes no network (MV-01), so
  nothing here compares against the registry. The manifest and the tag are the
  authority on what is being released; the registry is the consequence.
- **Whether a release is warranted at all.** Nothing forces a bump. Cutting one
  is a judgement, and this change does not make it a gate.
