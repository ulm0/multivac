# Research: The site shows what is published

Phase 0. Four decisions, one of them a rejection the operator made and the
design had to absorb.

---

## D1 — The window, measured from the configuration

```yaml
pages:
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
```

The site deploys on every merge to the default branch and on nothing else. The
release sequence is: bump the manifest → merge → **deploy** → tag → publish. So
between the merge and the publish, the site advertises a version the registry
does not have.

And the tail case is worse than the window: **a release abandoned after the
bump merged leaves the site advertising that version forever**, with MV-77
calling it correct, because the manifest does declare it.

MV-77 pins `badge == package.json`. Both live at HEAD. **Neither knows what npm
serves**, so the pair is internally consistent and externally false — which is
why it has been green through every one of these windows.

---

## D2 — Deploying only from tags was rejected, and the reason is binding

The obvious fix is one line: `rules: [if: $CI_COMMIT_TAG]`. The site becomes a
release artifact and the badge cannot drift by construction.

**The operator rejected it**: site-only corrections would then wait for a
release nobody needs to cut. Concretely — the 33 prose corrections that landed
today would sit unpublished until 0.5.0.

**Decision.** Deployment stays on the default branch; only the *number* changes
its source. Pages is **added** to the release pipeline as well, so a release
moves the badge immediately rather than at the next unrelated merge.

---

## D3 — The badge becomes a parameter, and its test is deleted

Measured first: `site/content/` holds **exactly one** version literal — the
badge — because MV-84 pins the count at 1. Every install instruction already
reads `multivac@latest`, which needs no version and stays correct with no
maintenance. So this is one number, not a sweep through prose.

**Decision.** `<span>v{{< param release >}}</span>`, with the value exported by
the pages job from `git describe --tags --abbrev=0`.

Verified before committing to it, because the badge is a shortcode nested
inside another shortcode:

```
$ HUGO_PARAMS_RELEASE=0.9.9 hugo   →   <span>v0.9.9</span>
```

**`test/invariants/site-version.test.ts` is deleted.** It exists to compare two
literals, and after this there is one literal fewer than it needs. What replaces
it is not another test: the three facts are each a single-file string and each
takes an anchor — the badge renders the param, the job derives the param from
the tag, and MV-84 forbids any literal at all. A test would be those legs
written again in a language that cannot see the CI file.

**MV-84 tightens from `count=1` to `count=0`.** The site names no version. That
is a stronger ratchet than the one it replaces, and it is the requirement doing
the work: what is not written cannot drift.

---

## D4 — The stage order would have reopened the hole

```yaml
stages: [test, deploy, publish]
```

`deploy` precedes `publish`. Adding pages to the tag pipeline as it stands would
deploy the site **before** npm accepted the tarball — the same falsehood, one
minute long instead of forever, and it would look fixed.

**Decision.** Reorder to `test → publish → deploy`. On a tag, the site follows
the publish it describes and does not run if that fails. On the default branch
`publish` is skipped by its own rules and the order is irrelevant.

**And the clone.** GitLab clones shallow by default, so `git describe` in the
pages job would find no tags and silently render the fallback — a quiet wrong
answer, which is the failure mode this change exists to remove. `GIT_DEPTH: 0`
on that job, deliberately, with the reason written beside it.

**The limit, which the row must state.** A tag is the published version by
MV-68's refusal to publish under a mismatched one — not by asking the registry.
A tag whose publish job failed would still be the newest tag. Ordering the
deployment after the publication is what makes that unreachable, and it is the
mechanism rather than an assertion.
