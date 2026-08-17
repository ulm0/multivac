# Implementation Plan: The docs say what ships

**Branch**: `the-docs-say-what-ships` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-the-docs-say-what-ships/spec.md`

## Summary

Cut 0.3.0, and make the pages stop claiming a release state the manifest
contradicts.

The release itself is mechanical and already governed: MV-68 pins the tag to
the manifest, MV-77 pins the site badge to the manifest, MV-78 requires a dated
changelog entry for the declared version. What is missing is one rung below
those: **nothing stops a page from writing a version number in its prose that
nobody checks**, which is exactly how the install page came to tell readers the
binary prints `1.0.0` and the package is `private: true` — neither of which has
ever been true of a published multivac.

MV-84 closes that: **the site's pages carry exactly one version string, and a
test says what it must equal.** Measured today the site has three — the badge,
plus two in `install.md`; after the corrections it has one, and a `count=1` leg
turns the second one anybody adds into a refusal.

The rest is the release: bump, write the entry, move the badge, fix every
statement the documentation audit confirms false, tag.

## Technical Context

**Language/Version**: TypeScript (Node ≥ 24) for the test; Markdown for the
prose; the law table for MV-84.

**Primary Dependencies**: none added. The runtime dependency count stays two
(`yaml`, `picomatch`) — this feature adds no code path.

**Storage**: n/a.

**Testing**: `node:test`, no frameworks, `pnpm test`. Plus
`mvac verify --strict` for MV-84 itself, and the `count` dry-run for the leg.

**Target Platform**: the published npm package and the documentation site.

**Project Type**: release + documentation correction inside the tool's own
repository.

**Performance Goals**: `verify` stays sub-second. MV-84's leg is one regex over
the 23 tracked files under `site/content/` — no new cost worth measuring.

**Constraints**: no network in `verify` (MV-01), so nothing here asks npm what
is published. The version being released is decided by the manifest and the tag,
never inferred. English everywhere. Nothing lands on `main` directly.

**Scale/Scope**: one manifest field, one changelog entry, one badge, the
statements the audit confirms, one law row, one test, one tag.

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 — see below.*

| Principle | How this plan satisfies it |
| --- | --- |
| **I. A claim nobody checks decays** | This feature exists because of a claim nobody checked. `install.md` said `1.0.0` and `private: true` under a law table with 83 anchored rows, because no row covered prose about the release. MV-84 anchors it, and the changelog entry cites MV-82 and MV-83 by ID rather than describing them. |
| **II. The tool never claims more than it checked** | MV-84's leg is `count=1`, and `count` is a **deletion ratchet, not a universal** — it counts across all files together, so removing the badge while adding a lie elsewhere keeps the count at 1 and passes. That hole is closed by a **different** check, not by pretending: MV-77's test asserts the badge exists and equals the manifest. The row states the pair and the limit rather than claiming the leg alone is sufficient. The row also states its scope: `site/content/**` only. `DESIGN.md`'s version numbers are historical facts about other software and are deliberately out of reach. |
| **III. The law changes before the code** | MV-84 is reserved `proposed` by `change new` and is stated in the same change as the corrections it governs. `change close` re-runs verify scoped to it. It stays `proposed`; only a human enacts. |
| **IV. Deterministic, offline, small** | Nothing fetches the published package to compare. The version under release is read from the manifest, and the tag check that matters runs in CI where the tag exists (MV-68). No runtime dependency added; no new code path in `src/`. |
| **V. An invented integration is a lie** | No adapter touched. The changelog entry describes only what the diff `v0.2.0..main` contains — two source files and two test files — and does not credit the release with anything else. |

**Verdict: no violations.** Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/008-the-docs-say-what-ships/
├── plan.md              # This file
├── research.md          # Phase 0: the two decisions, measured
├── data-model.md        # Phase 1: what a release is made of
├── quickstart.md        # Phase 1: cut it, and break it on purpose
├── contracts/
│   └── release.md       # Phase 1: the release contract, as it already stands
├── checklists/
│   └── requirements.md  # from /speckit-specify
└── tasks.md             # /speckit-tasks
```

### Source (repository root)

```text
package.json                              # version 0.2.0 -> 0.3.0
CHANGELOG.md                              # new dated 0.3.0 entry, newest first
site/content/_index.md                    # badge v0.2.0 -> v0.3.0; the "where this is" paragraph
site/content/docs/guide/install.md        # the three false statements, and the version block
.multivac/invariants.md                   # MV-84 row + leg
test/invariants/site-version.test.ts      # extended, or a sibling — see research D2
```

**Structure Decision**: no new directory. The release touches the manifest, the
changelog and the site; the rule lands in the existing law table and the
existing invariant-test directory, beside MV-77's test, which is the rule it
completes.

## Complexity Tracking

> No Constitution Check violation. Table intentionally empty.
