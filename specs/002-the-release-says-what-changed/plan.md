# Implementation Plan: The release says what changed

**Branch**: `002-the-release-says-what-changed` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-the-release-says-what-changed/spec.md`

> **Honesty note, read this first.** This plan was written *after* the
> implementation, not before it. The agent wrote `CHANGELOG.md`, the Hugo mount
> and the tests, and only then produced this document. It therefore records a
> design; it did not guide one, and `change apply` never gated anything here.
> Recorded rather than hidden, because a plan that quietly claims to have come
> first is the same class of lie this project exists to prevent (Principle II).
> The finding it produced is in the change file: the lifecycle gates the
> *commands*, not the *work* — nothing stops an agent from editing files without
> ever running `change apply`.

## Summary

`CHANGELOG.md` at the repo root is the single copy. The Hugo site **mounts** it
into `content/docs/changelog.md` rather than keeping a second copy, so FR-003's
"provably derived" is satisfied structurally: there is no second file that could
drift. A test pins the half no anchor can ask — whether the version
`package.json` declares has an entry.

## Technical Context

**Language/Version**: TypeScript on Node >= 24 (tests only; the feature adds no runtime code)
**Primary Dependencies**: none added. Hugo 0.165 extended builds the site; `yaml` and `picomatch` stay the only runtime deps
**Storage**: files in the repository
**Testing**: `node:test`, no frameworks, run by `pnpm test`
**Target Platform**: the repository, and the published documentation site
**Project Type**: single project (CLI + docs site)
**Performance Goals**: none — the checks are file reads at test time, not in `verify`'s hot path
**Constraints**: `verify` stays sub-second and offline; no runtime dependency added
**Scale/Scope**: one changelog file, one Hugo mount, three tests, one law row

## Constitution Check

*Checked against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Verdict | How |
| --- | --- | --- |
| I — A claim nobody checks decays | **Pass** | MV-78 is anchored to the mount lines, the entry format and the test names; the row is cited by ID in the changelog's own preamble |
| II — The tool never claims more than it checked | **Pass, with the note above** | The mount makes the two-surface claim structurally true rather than merely asserted. The honesty note is this principle applied to the plan itself |
| III — The law changes before the code | **Violated in ordering, corrected in substance** | MV-78's row was written and committed before the implementation commit, but the implementation preceded this plan. The row and the code will land in the same change, as the principle requires |
| IV — Deterministic, offline, small | **Pass** | No runtime code, no dependency, no network. `verify` is untouched |
| V — An invented integration is a lie | **N/A** | No adapter data changes |

**Post-design re-check**: unchanged. The one deviation is the ordering recorded
above, and it is recorded rather than justified — there is no good reason for it.

## Project Structure

### Documentation (this feature)

```
specs/002-the-release-says-what-changed/
├── spec.md
├── plan.md              # this file
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```
CHANGELOG.md                          # the single copy — added
site/hugo.yaml                        # module.mounts — modified
test/invariants/changelog.test.ts     # three tests — added
.multivac/invariants.md               # MV-78 — modified
```

**Structure Decision**: no `src/` change at all. The feature is a document, a
build-configuration mount, and the checks that hold them true. Adding runtime
code to enforce a documentation rule would be the wrong layer — `verify` is a
pre-commit gate and this belongs in the test suite, beside MV-02, MV-22, MV-72
and MV-77, which are the same shape.

## Design decisions

### Mount, not copy

The spec left open which surface is the source and how the other derives.
Hugo's `module.mounts` can mount a file from outside the site root, so
`../CHANGELOG.md` becomes `content/docs/changelog.md` at build time. Verified by
building: the page renders at `/docs/changelog/` with `<h1>Changelog`, appears
in the docs navigation, and no file exists under `site/content/`.

This beats the alternative — a tracked copy held identical by a test, the shape
MV-72 uses for the skill tree — because it removes the failure instead of
detecting it. MV-72 has to compare two trees precisely because `doors` must
physically write a copy; nothing here forces a second file to exist.

**Cost, stated**: declaring any content mount replaces Hugo's default, so
`content → content` must be restated beside it. Deleting that line does not
break the changelog page, it empties the entire site. The third assertion in
`changelog.test.ts` exists for exactly that, and the comment above it says why.

**Known nit, not fixed**: the mounted file has no front matter, so the page's
`<title>` falls back to the site title while its `<h1>` reads Changelog. Adding
front matter to a repo-root `CHANGELOG.md` makes GitLab render a stray table
above the content. The nav label and the heading are both right; the tab title
is not worth that trade.

### Entry format

`## <semver> — <date>`, newest first. The format is pinned by an anchor because a
regex over one file is exactly what anchors are for; the *ordering* and the
*presence of the declared version* are not, because one needs a comparison and
the other needs `package.json`. Those two are the tests.

### What is deliberately not built

No generation from commit messages (FR-008), no judgement of entry content
(FR-007), and no change to publishing or tagging (FR-009). The changelog is
authored, like the constitution, and for the same reason.

## Complexity Tracking

No constitutional violation requires justification. The single deviation is the
plan-after-implementation ordering, recorded at the top of this file and in the
change.
