# Implementation Plan: A door in a code repo names the ecosystem

**Branch**: `the-consumer-door-carries-the-ecosystem` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

## Summary

The consumer door gains three things the brain's door has had all along: the
list of repositories in the ecosystem, the adapter blocks resolved for that
repository, and an opening that puts the mount refresh first.

The graph block already crossed over with MV-90, and the lesson from that is the
shape here: one rendering serving both doors, never a second copy. The SDD block
is currently inline in `renderBrainDoor`; it comes out into a function the way
`grapherLines` already did.

One new declared field — an optional per-repository role — because what a
repository is *for* cannot be derived from its path.

## Technical Context

**Language/Version**: TypeScript, Node 24 (ESM)
**Primary Dependencies**: `yaml`, `picomatch`. None added.
**Storage**: `.multivac/config.yml` gains one optional per-repo key.
**Testing**: `node:test`.
**Target Platform**: CLI.
**Project Type**: single project.
**Performance Goals**: unchanged — rendering is string assembly over a parsed config.
**Constraints**: the door renders from declarations only. No filesystem check, no network, per MV-01 and FR-009.
**Scale/Scope**: a brain plus a handful of declared repositories.

## Constitution Check

| Principle | Verdict | How |
|---|---|---|
| I | PASS | MV-93 anchors the list, the role parse, the reordering and the shared SDD rendering. |
| II | PASS | The centre of it: the door must not claim the lifecycle scaffolds where it warns, and must not promise a list that omits the one handle every anchor may use. Both were caught in review before implementation. |
| III | PASS | MV-93 reserved and proposed. MV-61 and MV-87 are amended in place, dated — MV-61 because MV-90 moved the graph rendering to both doors and left its row saying "the brain door". |
| IV | PASS | No dependency, no network, no subprocess. The door probes nothing, and an `absent` leg pins that. |
| V | PASS | A role is declared or omitted, never derived. The adapter blocks render from the registry. |

**Post-design re-check**: unchanged.

## Project Structure

```text
src/
├── types.ts             # RepoEntry gains role?
├── lib/config.ts        # role parsed, reduced to one line
├── doors/
│   ├── brain.ts         # sddLines() extracted from renderBrainDoor, beside grapherLines
│   └── consumer.ts      # ecosystem list, adapter blocks, refresh first
└── commands/doors.ts    # unchanged: it already passes the repo key

test/doors/ecosystem.test.ts   # NEW

site/content/docs/reference/configuration.md   # the role key
site/content/docs/concepts/distribution.md     # what the consumer door now carries
```

**Structure Decision**: both doors render from `src/doors/`, and every block is
one function used by both. The alternative — a second rendering for the consumer
door — is how the two come to disagree, and the door is where disagreement is
least visible.

## Phase 0 — Research

See [research.md](./research.md).

## Phase 1 — Design

- [data-model.md](./data-model.md) — the role field and the list's contents.
- [contracts/cli-output.md](./contracts/cli-output.md) — the door, in full.
- [quickstart.md](./quickstart.md) — scenarios against a real ecosystem.
