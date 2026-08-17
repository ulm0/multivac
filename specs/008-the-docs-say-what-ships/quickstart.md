# Quickstart: cut it, and break it on purpose

Checks a machine decides are marked **gated**; the rest are **by eye** and are
named as such rather than counted as coverage.

## Before the tag

```sh
pnpm install && pnpm run build
pnpm test                      # 360+ tests
node dist/cli.js verify --strict
```

Both green, on `main`, before anything is tagged.

## SC-001 — the four agree *(gated)*

```sh
node -p "require('./package.json').version"          # 0.3.0
grep -m1 -o '^## [0-9.]*' CHANGELOG.md               # ## 0.3.0
grep -o '<span>v[0-9.]*' site/content/_index.md      # <span>v0.3.0
```

and then, mechanically:

```sh
pnpm test -- --test-name-pattern="version|changelog"
```

`site-version.test.ts` and `changelog.test.ts` compare the badge and the entry
against the manifest. They are the check; the greps above are just the reading.

## SC-002 — nothing calls it unreleased *(gated)*

```sh
grep -rniE "pre-release|prerelease|unreleased|private: true|early build" \
  site/content/ README.md CONTRIBUTING.md
```

Expect nothing. A hit in `CHANGELOG.md` describing a past state is a different
matter and the glob deliberately excludes it.

## SC-003 — MV-84 refuses a second version string, in both directions *(gated)*

```sh
node dist/cli.js count 'brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/'
# expect: 1 match — the badge
```

Now break it:

```sh
printf '\nBuilt against 9.9.9.\n' >> site/content/docs/concepts/philosophy.md
node dist/cli.js verify --strict ; echo "exit $?"
git checkout site/content/docs/concepts/philosophy.md
```

**Pass**: exit 1, MV-84 named, `philosophy.md` named. **Fail**: exit 0 — the
glob does not reach that page, which is the defect this check exists to find.

And the half MV-84 does *not* cover, which MV-77's test does:

```sh
# delete the badge line, then:
pnpm test -- --test-name-pattern="version on the site home"
# expect: fails with "no longer carries the version badge this test pins"
```

Run both. The pair is the rule; either one alone passes a broken site.

## SC-006 — the tag

```sh
git tag v0.3.0 && git push origin v0.3.0
```

The publish job re-checks `v$(package.json version)` against `$CI_COMMIT_TAG`
and refuses on mismatch. Watch it; a red publish job means the four did not
agree and the fix is the manifest, never the check.

## SC-004 / SC-005 — *(by eye)*

Read the 0.3.0 entry as somebody running 0.2.0 in a repository of their own.
They should be able to say, without opening the source, what will newly go red
and why. If they cannot, the entry is not finished.

Then: every finding the documentation audit confirmed is fixed in this change,
and the two counts are stated in `tasks.md`. A confirmed finding carried forward
is a visible failure here, not a quiet one.
