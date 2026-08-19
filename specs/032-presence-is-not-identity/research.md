# Phase 0 — Research: Presence is not identity

## Measurement 1 — what the shim actually tests

`src/hooks/install.ts`, the first runner rung, in the shim and in `findRunner`:

```sh
if [ -f "$root/dist/cli.js" ] && [ -d "$root/node_modules" ] && command -v node …
  exec node "$root/dist/cli.js" verify
```

Two file tests, no identity. `dist/cli.js` + `node_modules` describes an
enormous share of Node CLI repos — including every repo scaffolded by the
common TypeScript CLI templates.

**Decision**: gate the rung on the repo's `package.json` naming multivac.

**Rationale**: it is the one fact that distinguishes "this repo builds
multivac" from "this repo builds a CLI". It is already on disk, it costs one
read, and it is the same fact the second rung already uses one level down
(`node_modules/multivac/package.json`).

**Alternatives considered**: run the candidate with `--version` and check the
output (rejected — that is executing the unknown binary, which is the defect);
look for a marker file multivac writes into its own builds (rejected — invents
an artifact where a truthful one already exists); drop the rung entirely
(rejected — MV-92 exists because a stale global enforced an older law table
against this repo, measured).

## Measurement 2 — the ownership marker already exists

Every shim multivac generates opens with:

```sh
#!/bin/sh
# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.
```

**Decision**: that line is the identity test for "may I rewrite this hook".

**Rationale**: it says so itself. A hook carrying it was written by this tool
and is regenerable; a hook without it belongs to somebody else, whatever words
it happens to contain.

**Alternatives considered**: a hash of the generated content (rejected — any
version bump invalidates it, so old shims would become foreign); a marker file
listing installed hooks (rejected — a second source of truth about a file that
can state its own provenance).

## Measurement 3 — "runs multivac" today

`/\bmvac\b|multivac/` over the whole file, in two hand-copied places:
`installAlongside` (install.ts) and the harness report (doctor.ts). A hook whose
only mention is `# TODO: wire up multivac` satisfies both.

**Decision**: one shared predicate, requiring the mention on a line whose first
non-space character is not `#`.

**Rationale**: it is the smallest rule that separates a wired hook from a hook
that talks about being wired, and one function means the installer and the
report cannot disagree — which is MV-74's lesson and MV-104's.

**Alternatives considered**: parse the shell (rejected — a shell parser is a
dependency and a bug farm for a yes/no question); require the exact
`MANUAL_CHAIN_LINE` (rejected — too strict: people wire it in their own words,
and refusing those would push them to disable the check).

## Measurement 4 — the stub door

`src/commands/doors.ts` writes the stub with `writeFile`, while the branch
twenty lines above uses `applyManagedBlock(existing, …)`. The docs
(`integrations.md`) and DESIGN both say the managed block is the only region
multivac owns.

**Decision**: read first, merge the block, write. Frontmatter only on creation.

**Rationale**: it is the same call the sibling branch already makes; this is
deleting a special case, not adding one.

## Measurement 5 — `init` versus `doors`

- `installHooks(dir)` in `runInit` — no options, so `strictPrePush` is false
  whatever the config says, while `doors` passes `config.strictPrePush`.
- `await stamp(dir)` unconditionally — while MV-86 is explicit that the record
  moves only under `doors --adopt`, and that restamping on every run makes the
  notice "vanish for a reason unrelated to the upgrade".

**Decision**: `init` loads the config it is about to keep, passes the strictness
through, and stamps only when there is no record.

**Rationale**: MV-86 already decided this; `init` simply was not told.

## Constitution and law

- **MV-74** — a substring of somebody else's command is not identity. This
  change applies that finding to the four places it was not applied to.
- **MV-92** — most specific first. Unchanged in intent; amended to state that it
  chooses which code runs and not whether that code is current.
- **MV-86** — the record moves only under an explicit act. `init` obeys it now.
- **Constitution IV** — no dependency, no network; one extra `package.json` read
  per hook run.
