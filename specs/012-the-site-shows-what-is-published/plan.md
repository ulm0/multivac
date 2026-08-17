# Implementation Plan: The site shows what is published

**Branch**: `the-site-shows-what-is-published` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

## Summary

The badge stops being a literal and becomes the last git tag, computed at build
time. Deployment stays on every merge to the default branch **and** is added to
the release pipeline, after the publish it describes.

```
merge to main   → docs live now, badge = last published tag
tag v0.5.0      → publish, THEN deploy — badge moves the moment npm accepts
```

Adds no law. MV-77 is amended — it currently pins the badge to the **manifest**,
which is the wrong pair — and MV-84 tightens from `count=1` to `count=0`.

## Technical Context

**Language/Version**: CI configuration and one Hugo parameter. No TypeScript.

**Primary Dependencies**: none. `git describe` and Hugo's existing
`HUGO_PARAMS_*` environment convention; no plugin, no script.

**Testing**: the legs, plus a rendered build at each state. `node:test` gains
nothing here and `site-version.test.ts` is **deleted** — see research D3.

**Performance Goals**: none affected.

**Constraints**: offline (FR-006) — the version comes from a tag in the clone,
never from the registry. The deployment must not precede the publication
(FR-005). English everywhere.

**Scale/Scope**: one CI file, one Hugo config line, one content line, two rows,
one deleted test.

## Constitution Check

| Principle | How this plan satisfies it |
| --- | --- |
| **I. A claim nobody checks decays** | MV-77 has been checked all along — against the wrong thing. Badge and manifest were held equal while both sat at HEAD, so the pair was internally consistent and externally false. The correction is to remove the claim's subject: the site states no version, so there is nothing to check and nothing to drift. |
| **II. The tool never claims more than it checked** | The row will say the badge is the last **tag**, and states the limit: a tag is the published version by MV-68's refusal, not by asking the registry — so a tag whose publish failed would still be named, and that is why deployment follows publication rather than merely coming after it in the file. |
| **III. The law changes before the code** | MV-77 and MV-84 are amended in this change, and MV-77 is declared as a claim so `close` re-verifies it. Neither changes state. |
| **IV. Deterministic, offline, small** | Nothing asks npm. `git describe --tags --abbrev=0` reads the clone; the pages job sets `GIT_DEPTH: 0` because a shallow clone has no tags and would silently render the fallback — a quiet wrong answer is the failure mode this whole change exists to remove. |
| **V. An invented integration is a lie** | No adapter touched. |

**Verdict: no violations.**

## Project Structure

```text
.gitlab-ci.yml                       # stage order; pages on tag + default branch; GIT_DEPTH; the derivation
site/hugo.yaml                       # params.release fallback for a build with no release
site/content/_index.md               # the badge renders the param
.multivac/invariants.md              # MV-77 amended, MV-84 to count=0
test/invariants/site-version.test.ts # DELETED — nothing left to compare
```

**Structure Decision**: no new file. The derivation belongs in the job that
builds the site, because that is the only place that knows both the tag and the
output.

## Complexity Tracking

> No Constitution Check violation. Table intentionally empty.
