# Phase 1 — Data model: Presence is not identity

Three ownership questions, each answered by a fact the artifact states about
itself rather than by its existence.

## Hook file

| Question | Today | After |
| --- | --- | --- |
| may multivac rewrite it? | never, if it exists | yes when it carries the shim's managed header |
| does it run multivac? | `/\bmvac\b\|multivac/` anywhere in the text | the mention appears on a line whose first non-space character is not `#` |
| otherwise | refused with the line to append | unchanged |

States: **absent** → write ours. **ours** (header present) → regenerate with
the current arguments. **foreign, wired** → leave alone, report as wired.
**foreign, not wired** → refuse with the fix line.

## Runner rung

| Rung | Test today | Test after |
| --- | --- | --- |
| the repo's own build | `dist/cli.js` and `node_modules` exist | …and `package.json` names multivac |
| a declared dependency | `node_modules/multivac/package.json` exists | unchanged |
| `mvac` on PATH | on PATH | unchanged |
| nothing runnable | warn, exit 0 | unchanged |

The shim (sh) and `findRunner` (Node) are one pair: both gain the same test.

## Projected file

| Kind | Today | After |
| --- | --- | --- |
| canonical / native (`AGENTS.md`) | read, merge the block, write | unchanged |
| `symlink` | link | unchanged |
| `stub` | **write whole file** | read, merge the block, write; frontmatter only when created |

A malformed block carries the file's path into the error, so a multi-repo run
names the file that stopped it.

## Version record

`.multivac/projected.yml` is written by `init` when absent, and moved only by
`doors --adopt` (MV-86). `init` re-run leaves an existing record alone.
