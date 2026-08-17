# Data model: The docs say what ships

No runtime data. The entities are the four places a version is written, the
statements that describe a release state, and the law rows that hold them.

## Version site

Every place the project states its own current version, and what holds each one.

| Site | Form | Held by | This release |
| --- | --- | --- | --- |
| manifest | `"version": "X.Y.Z"` | the author — this is the source | `0.3.0` |
| changelog | `## X.Y.Z — YYYY-MM-DD` heading | MV-78 + `changelog.test.ts` | `## 0.3.0 — 2026-08-17` |
| site badge | `<span>vX.Y.Z</span>` | MV-77 + `site-version.test.ts` | `v0.3.0` |
| git tag | `vX.Y.Z` | MV-68 + the publish job's own check | `v0.3.0` |
| **anywhere else on the site** | — | **MV-84: there is nowhere else** | — |

The last row is the one this change adds. The first four hold pinned strings
equal to each other; none of them said anything about prose.

## Release-state claim

A sentence asserting whether and how the project is published. Each is either
true of the released version or it is a defect.

| Claim shape | Status | Where it was found |
| --- | --- | --- |
| "an early build, pre-release" | false since 0.1.0 | `_index.md`, `install.md` |
| "the package is `private: true`" | never true of a published version | `install.md` |
| "unreleased" (of the project) | false since 0.1.0 | `install.md` |
| "unreleased commit" (of a git commit) | **true and legal** | `install.md` — a commit, not the project |

The last row is the distinction the corrections must preserve: "run an
unreleased commit" describes a commit somebody cloned, not the project's
release state, and rewriting it would make the page worse.

## Changelog entry

One per released version, newest first. Its sections carry different
obligations:

| Section | Obligation |
| --- | --- |
| **Changed — read before upgrading** | states what used to happen, what happens now, and whose repository is affected |
| **Fixed** | names the defect and its consequence, not the patch |
| **Added** | names the invariant by ID |
| **Documentation** | changes that do not touch an installed tool |

Every section names its invariants by ID, because a rule quoted without its ID
does not bind — which is the same reason the file exists.

## What holds MV-84, exactly

Two checks, and the row states the division rather than implying either is
sufficient:

- `count=1` over `site/content/**` — **nothing but one version string**. It is
  a deletion ratchet: it counts across files together, so it cannot notice the
  badge being replaced by a lie elsewhere.
- `site-version.test.ts` (MV-77) — **that one string is the badge, and it equals
  the manifest**. It fails if the badge is gone.

Neither alone says "the site states exactly one version and it is the
manifest's". Together they do.
