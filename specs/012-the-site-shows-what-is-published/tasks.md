---

description: "Task list for the-site-shows-what-is-published"
---

# Tasks: The site shows what is published

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/badge.md](./contracts/badge.md), [quickstart.md](./quickstart.md)

---

## Phase 1: The number changes its source (P1)

- [X] T001 `site/hugo.yaml`: `params.release: dev` — the fallback for a build
      with no release context. Not a semver, so MV-84 stays satisfied.
- [X] T002 `site/content/_index.md`: the badge renders `{{< param release >}}`.
      Verified beforehand that a shortcode nested inside `hero-badge` renders.
- [X] T003 `.gitlab-ci.yml`: the pages job exports `HUGO_PARAMS_RELEASE` from
      `git describe --tags --abbrev=0`, stripped of its `v`, falling back to
      `dev`.
- [X] T004 `.gitlab-ci.yml`: `GIT_DEPTH: 0` on that job, with the reason beside
      it — a shallow clone has no tags and would render the fallback in
      production without saying so.

## Phase 2: When it deploys (P1)

- [X] T005 Reorder stages to `test → publish → deploy`, so a release's site
      follows the publish it describes. **Write the reason in the file**:
      swapping them reintroduces a site announcing a package the registry
      rejected.
- [X] T006 Add `$CI_COMMIT_TAG` to the pages rules, keeping the default-branch
      rule — site-only corrections must not wait for a release (US2).

## Phase 3: The law (P1)

- [X] T007 Amend MV-77: it pins badge to **manifest**, and both live at HEAD, so
      the pair is internally consistent and externally false. It becomes: the
      site renders the last published tag and states no version of its own.
      State the limit — a tag is published by MV-68's *refusal*, not by asking
      the registry, and the deploy-after-publish ordering is what closes it.
- [X] T008 Tighten MV-84 from `count=1` to `count=0`, and amend its text: it
      currently says MV-77's test asserts the badge exists and equals the
      manifest, which stops being true.
- [X] T009 Delete `test/invariants/site-version.test.ts`. It compares two
      literals and there is now one. Record the reason: what replaces it is not
      another test but the absence of the thing it compared.
- [X] T010 Re-point MV-77's legs at the three single-file strings: the param in
      the badge, the derivation in the CI job, the fallback in the config.

## Phase 4: Prove it (P1)

- [X] T011 Build at all three states per `quickstart.md`: a release, the window
      (manifest ahead of the last tag), and no release at all.
- [X] T012 Prove MV-84 bites at count=0: add a version to a page,
      `verify --strict` refuses naming the file; revert.
- [X] T013 `pnpm test` and `verify --strict`; changelog under Unreleased; land;
      close.

### After close

No row changes state. This change adds no law and enacts nothing.

## Notes

- The stage order is load-bearing and looks like formatting. T005's comment is
  part of the deliverable.
- Deploying only from tags was **rejected by the operator** with a binding
  reason: site-only corrections would wait for a release nobody needs to cut.

---

## What the run recorded

**All three states built and read** (SC-002, SC-003):

```
release       HUGO_PARAMS_RELEASE=0.4.0  →  <span>v0.4.0
no release    (unset)                    →  <span>vdev
the window    manifest 0.5.0, tag v0.4.0 →  <span>v0.4.0
```

The third is the finding, demonstrated rather than argued: the manifest was set
to 0.5.0 and the badge did not move, because it never reads the manifest.

**Three mutations, each caught by the thing meant to catch it:**

- stages reordered back to `deploy → publish` → the ordering test fails, naming
  the order it found;
- the `$CI_COMMIT_TAG` rule removed → the rules test fails with "the badge would
  wait for the next unrelated merge";
- a version literal appended to a concept page → MV-84 refuses at `absent`,
  naming `philosophy.md:140`.

**One anchor was attempted and abandoned, for a structural reason worth
keeping.** The stage order is the guarantee that a release's site cannot precede
its package, so it wants a leg — but it is a **relation between lines** and the
scanner matches one line at a time. No regex over a single line can say "publish
appears before deploy". Anchoring the comment that explains the order would have
been MV-46's defect committed knowingly: evidence that is a sentence about the
code. It is a test, and the row says why it is a test rather than leaving the
absence unexplained.

**A test was deleted and one written.** `site-version.test.ts` compared two
literals; after this there is one fewer than it needs, and what replaces it is
not another comparison but the absence of the thing compared.
`site-deploy.test.ts` pins what actually carries the guarantee — the ordering
and the two triggers.

**MV-84 is stronger than before, not merely adjusted.** It was `count=1` with a
stated blind spot: a ratchet counts across files, so swapping the badge for a
lie elsewhere kept the count at 1. At `absent` there is no swap to be blind to.
The half it could not state — held by MV-77's test — no longer needs holding.
