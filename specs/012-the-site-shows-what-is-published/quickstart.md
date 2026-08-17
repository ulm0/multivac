# Quickstart: build it at each state

## The three states *(gated)*

```sh
cd site

# a release: the tag is what is rendered
HUGO_PARAMS_RELEASE=0.4.0 hugo --quiet -d /tmp/s && grep -o '<span>v[^<]*' /tmp/s/index.html

# the window: bumped to 0.5.0 in the manifest, last tag still v0.4.0
git describe --tags --abbrev=0                  # v0.4.0
node -p "require('../package.json').version"    # 0.5.0
# the site must show 0.4.0 — the one a reader can install

# no release at all
env -u HUGO_PARAMS_RELEASE hugo --quiet -d /tmp/s && grep -o '<span>v[^<]*' /tmp/s/index.html
# expect vdev
```

## Nothing states a version *(gated)*

```sh
mvac count 'brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/'   # expect 0
```

Add a version to any page and `verify --strict` must refuse, naming MV-84 and
the file. This is the requirement doing the work: what is not written cannot
drift.

## The deployment cannot precede the publication *(by eye)*

```sh
grep -A3 '^stages:' .gitlab-ci.yml     # test, publish, deploy — in that order
```

On a tag, `publish` runs in an earlier stage than `pages`; a failed publish
leaves the deploy unrun. Swapping these two lines silently reopens the hole,
which is why the reason is written beside them.

## Tags reach the job *(by eye, once)*

```sh
grep -B2 -A2 'GIT_DEPTH' .gitlab-ci.yml
```

A shallow clone has no tags and `git describe` would fall back to `dev` without
saying so. Check the first deployed build's badge against the last tag; a `vdev`
in production means this is missing.
