# Contract: where the number comes from

## The page states nothing

```markdown
<span>v{{< param release >}}</span>
```

No version appears under `site/content/`. MV-84 enforces `count=0`.

## The fallback

```yaml
# site/hugo.yaml
params:
  release: dev
```

A build with no release context — a local `hugo server`, a fresh fork with no
tags — renders `vdev`. It names itself rather than showing an empty gap or a
number nobody can install. `dev` is not a semver and does not trip MV-84.

## The derivation

```yaml
pages:
  variables:
    GIT_DEPTH: 0          # a shallow clone has no tags; without this the
                          # fallback renders silently, which is the exact
                          # failure this change removes
  before_script:
    - export HUGO_PARAMS_RELEASE=$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || echo dev)
```

`git describe --tags --abbrev=0` is the newest tag reachable from the commit
being built. On the default branch that is the last release; on a release tag it
is that release.

## When it deploys

```yaml
stages: [test, publish, deploy]

pages:
  rules:
    - if: '$CI_COMMIT_TAG'                              # after the publish
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'     # site-only fixes
```

The stage order is the guarantee, not a comment: on a tag the publish runs
first, and a failed publish leaves the deploy unrun. Reordering these stages
would silently reintroduce a site that announces a package the registry
rejected.

## What this does not guarantee

That the tag was published. A tag is the published version because MV-68
refuses to publish under one that disagrees with the manifest — that is a
refusal, not a confirmation, and no offline check can be more than that.
Deploying after the publish is what closes the gap in practice, and it is a
mechanism rather than a claim.
