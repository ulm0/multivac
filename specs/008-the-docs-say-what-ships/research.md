# Research: The docs say what ships

Phase 0. Four decisions, each measured before it was taken.

---

## D1 — `count=1` over `site/content/**`, not `absent` with exemptions

**Measured first.** Every semver-shaped literal in the documentation today:

| where | value | what it is |
| --- | --- | --- |
| `site/content/_index.md` | `v0.2.0` | the badge, already pinned to the manifest by MV-77 |
| `site/content/docs/guide/install.md` | `1.0.0` ×2 | the two false claims this change removes |
| `CHANGELOG.md` | `0.2.0`, `0.1.1`, `0.1.0` | dated headings — historical fact |
| `DESIGN.md` | `0.0.1`, `0.9.21`, `0.9.29` | the npm name placeholder, and graphify's own versions |

`node dist/cli.js count 'brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/'`
reports **3 matches in 23 tracked files** today. After the corrections it is
**1** — the badge.

**Decision.** One leg:

```
<!-- @anchor MV-84 brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/ count=1 -->
```

The site's pages carry exactly one version string. A second one anybody adds is
a refusal that names the file.

**Why not `absent` with `!site/content/_index.md`.** Excluding the landing page
by name exempts the whole file, so a false version claim written into its prose
— three paragraphs below the badge, where the "early build, pre-release"
sentence already lives — would pass. The exemption would be aimed at one span
and would cover a page.

**Why the changelog is not in the glob.** `CHANGELOG.md` lives at the repo root
and is mounted into the site at build time (MV-78), so `git ls-files
site/content` never lists it and its headings stay legal without an exemption.
That is a property of the mount, not luck — but it is a property this leg
depends on, so it is written into the row rather than left for someone to
rediscover when they move the file.

**Why `DESIGN.md` and `CONTRIBUTING.md` are out of scope.** Their version
numbers are facts about other software and about a placeholder release in the
past. A rule that reached them would have to distinguish "a version this project
currently is" from "a version something else once was", which is a judgement no
regex makes. The row says the scope is the site's pages and does not pretend
otherwise.

---

## D2 — The leg is not enough, and the row says which check completes it

**`count` is a deletion ratchet, never a universal.** It counts across all files
together. Delete the badge and add a hardcoded version to `philosophy.md` and
the count is still 1: green, with the site lying and the badge gone.

**Decision.** MV-84 is stated as **half of a pair**, and the row names the other
half rather than implying sufficiency:

- **MV-77's existing test** (`test/invariants/site-version.test.ts`) asserts the
  badge is present *and* equals `package.json`'s version. Delete the badge and
  that test fails on `no longer carries the version badge this test pins`.
- **MV-84's leg** asserts nothing else on the site states a version.

Together: exactly one version string, and it is the manifest's. Neither alone
says that, and this plan does not let the row claim it does.

**No second test is written.** MV-77's already covers the existence-and-equality
half; a new one would restate it. The correct artifact here is the leg plus a
sentence in the row explaining the division — Principle II asks for the honest
statement, not a redundant assertion.

---

## D3 — 0.3.0, and what the entry has to warn about

**The whole diff since the tag**, measured rather than recalled:

```
$ git diff --stat v0.2.0..main -- src/ test/
 src/anchor/match.ts                |  25 +++++++-
 src/anchor/parse.ts                |  27 ++++++++-
 test/anchor/match.test.ts          | 115 ++++++++++++++++++++++++++++++++++
 test/invariants/site-fonts.test.ts |  73 ++++++++++++++++++++++
```

`src/anchor/parse.ts`'s diff is a **refactor only** — the inline literal
`/<!--\s*@anchor\b/` became the exported `ANCHOR_LINE`, and its behaviour is
unchanged. Reading the diff rather than the change file matters here: the
changelog must not credit the release with a parser change it did not make.

So exactly one behaviour changed for an existing user, in `matchesInFile`
(MV-82), and it is the kind that can turn a passing leg into a failing one:

- **Before**: a line was skipped by the scanner if it contained the substring
  `@anchor` anywhere.
- **After**: a line is skipped only if it carries a complete anchor comment —
  the opener `<!--` … `@anchor`, and the `-->` that closes it.
- **Who is affected**: any repository whose source contains a line mentioning
  `@anchor` without being a complete anchor comment. Those lines were invisible
  to every leg; they are now scanned, so an `absent` tombstone or a `count=N`
  ratchet over them can start refusing. That is the defect being fixed, and it
  presenting as a new red is the fix working.

**Decision.** 0.3.0. At 0.x the minor position is where a change that can newly
refuse an existing repository belongs; nothing was removed, so this is not a
major, and it is plainly not a patch.

MV-83 is documentation-only and goes under its own heading rather than under
"read before upgrading" — an installed tool is unaffected by the typeface on
the website.

---

## D4 — Publishing is unchanged, and this change proves it rather than touching it

`.gitlab-ci.yml`'s publish job runs on a tag, mints a short-lived npm credential
by OIDC, and refuses unless `v$(package.json version)` equals `$CI_COMMIT_TAG`
(MV-68). Nothing here modifies that.

**Decision.** The tag is pushed only after the manifest, the changelog and the
badge agree locally and `pnpm test` and `verify --strict` are green. The tag
check is then a confirmation rather than a discovery — which is the point of a
gate that is the last thing to run, not the first thing you rely on.

**Rejected: bumping the version as part of the tag command** (`npm version`).
It writes a commit and a tag in one step, which puts the manifest change and the
tag under one hand and makes the CI check compare a value to itself. The gate is
worth more than the convenience.
