# Implementation Plan: Adapters cascade into every declared repo

**Branch**: `013-adapters-cascade-into-every-declared-repo` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-adapters-cascade-into-every-declared-repo/spec.md`

## Summary

One rule replaces three first-root-wins reads: **a declared adapter is
evaluated, acted on and reported per root**, where a root is the brain plus
every declared repo present on disk. The SDD scaffold loops the roots instead
of returning on the first hit and instead of acting on `roots[0]` alone;
`doctor`'s SDD pass gains the per-scope shape its grapher pass already has; the
project-document gate asks each root where the tool is installed; and the
grapher's first build stops being reserved for repos a change happened to
touch. A repo may opt out by declaring its own adapter, mirroring the per-repo
`grapher` override that already exists.

## Technical Context

**Language/Version**: TypeScript 5.x on Node >= 24, ESM, `strict`

**Primary Dependencies**: `yaml`, `picomatch` — the two runtime dependencies the
constitution pins. This feature adds none.

**Storage**: The filesystem and git. No database.

**Testing**: `node:test` via `pnpm test` (build, then `node --test dist-test/**`).
No frameworks; the shared helpers in `test/helpers/fixture.ts` only.

**Target Platform**: A developer machine and CI — macOS and Linux, any git.

**Project Type**: Single CLI package (`src/` + `test/`), brain==code: this repo
is both the brain and the code it governs.

**Performance Goals**: `verify` stays sub-second and is untouched here. The
scaffold and the first graph build are bounded by the number of declared roots
and each runs once per root ever: they are skipped the moment the artifact
exists, so the second lifecycle run costs one `stat` per root.

**Constraints**: `verify`, `doctor` and `doors` make no network call and spawn no
foreign tool (Principle IV, MV-01). Exactly two subprocesses may be spawned on a
tool's behalf, both the tool's own: its validator and its declared scaffold
(Principle II, MV-51/MV-56/MV-75). No command may be derived from a tool's name
(Principle V, MV-59).

**Scale/Scope**: Ecosystems of one to a dozen repos. The measured case is a
brain plus five siblings.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Verdict |
| --- | --- | --- |
| I. A claim nobody checks decays | Does the behaviour land with an anchored row? | **PASS** — MV-87 is reserved and declared in the change; MV-75 and MV-76 are amended in place in the same change, which is what III requires of a rule whose scope moves. |
| II. The tool never claims more than it checked | Does any report state more than was read? | **PASS**, and this is the point of the feature: today `artifact ok` is printed over five unequipped repos. Every line becomes root-scoped, every refusal names the root, and a root whose init failed is reported in the tool's own words rather than counted either way. |
| III. The law changes before the code | Row first, dated, same change? | **PASS** — MV-87 states the per-root rule; MV-75's "when the scaffold is missing" and MV-76's gate both gain the scope they never stated. No invariant is relaxed in code. |
| IV. Deterministic, offline, small | Does anything new run from `verify`/`doctor`/`doors`? | **PASS** — `doctor` gains only reads (`stat` per root, already its idiom in `grapherLines`). Every subprocess stays in the change lifecycle. No new dependency; no new file walk in `verify`. |
| V. An invented integration is a lie | Is any command derived rather than declared? | **PASS** — the scaffold command is the registry's `scaffold.run`; the first graph build uses the adapter's own `create ?? refresh`. A tool with no declared init still gets none, stated per root. |

**Post-design re-check**: unchanged. The design adds one config key
(`repos.<key>.sdd`), no new module, no new dependency, and moves no subprocess
out of the lifecycle. See [research.md](./research.md) for the alternatives that
were rejected for violating IV or V.

## Project Structure

### Documentation (this feature)

```text
specs/013-adapters-cascade-into-every-declared-repo/
├── plan.md              # This file
├── spec.md              # What and why
├── research.md          # Phase 0 — the decisions and what was rejected
├── data-model.md        # Phase 1 — the entities the code moves
├── quickstart.md        # Phase 1 — how to prove it works
├── contracts/
│   └── cli-output.md    # Phase 1 — the line shapes this feature owns
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # /speckit-tasks output, not this command's
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── detect.ts        # sddRoots gains the per-root adapter resolution
│   ├── sdd.ts           # runScaffold loops roots; sddGate's project-doc pass goes per root
│   ├── refresh.ts       # refreshGraph builds when there is no artifact, refreshes when there is
│   └── registry.ts      # unchanged — the data was already right
├── commands/
│   ├── change.ts        # calls the graph ensure beside the existing scaffold call
│   └── doctor.ts        # sddLines gains grapherLines' per-scope shape
├── lib/
│   └── config.ts        # parses repos.<key>.sdd
└── types.ts             # RepoEntry.sdd, beside the existing RepoEntry.grapher

test/
├── doctor/adapters.test.ts   # per-scope reporting
├── change/sdd-gates.test.ts  # per-root scaffold and per-root project-doc gate
└── change/grapher-refresh.test.ts  # first build in an untouched repo
```

**Structure Decision**: No new modules. Every change lands in a file that
already owns the behaviour: the roots are computed where they are computed
today (`src/adapters/detect.ts`), the scaffold loops where it already runs
(`src/adapters/sdd.ts`), and the report gains the shape its sibling in the same
file already has (`src/commands/doctor.ts`). Tests extend the three suites that
already cover these paths rather than opening new ones.

## Complexity Tracking

No constitution violations to justify. The one structural addition — a per-repo
`sdd` key — is a copy of the per-repo `grapher` key the config already carries,
which is why it is not tracked as new complexity: the alternative (a separate
exclusion list) would have been the new mechanism.
</content>
