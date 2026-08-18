# Contract: CLI surface and output

For a CLI the output is the interface. These lines are the contract; the tests
assert them and the law anchors point at them.

## `multivac roadmap`

No `[dir]`, the same as its sibling `change`: both act on the brain the process is standing in.

Lists planned changes grouped by horizon, nearest first, alphabetical by slug
within each group, then the count of changes in flight.

```text
roadmap: 4 planned
  now
    tracker-projects-the-roadmap — Issues, boards and labels from the change files
  next
    agents-run-in-parallel-where-work-isolates — Urge the fan-out the tool already knows about
    the-sdd-chain-runs-unattended — Automatic by default, opt out on the same line
  later
    the-graph-builds-itself-everywhere — First build per declared root
in flight: 1 open change — adapters-cascade-into-every-declared-repo
```

- A horizon with no items is omitted entirely, not printed empty.
- `in flight: no open change` when none is open.
- Empty roadmap:

```text
roadmap: empty — record an intention with `multivac roadmap add <slug> "<title>"`
in flight: 1 open change — adapters-cascade-into-every-declared-repo
```

## `multivac roadmap add <slug> "<title>" [--horizon now|next|later]`

Creates the planned change file and commits it. Reserves no invariant id,
creates no branch, creates no worktree.

```text
recorded .multivac/changes/<slug>.md — planned, horizon later
  no invariant id is reserved until it starts: multivac change new <slug>
```

Refusals:

```text
mvac: <slug> is already planned — see it with `multivac roadmap`, or start it with `multivac change new <slug>`
mvac: <slug> is already open — it started; nothing to record
mvac: <slug> is already archived at .multivac/changes/archive/<slug>.md — this change is closed; start a new one with a new slug, or read it there
mvac: unknown horizon "someday" — use now, next or later
```

## `multivac change new <slug>` on a planned slug

Promotes rather than refusing. The output says which happened, because the
operator who typed it may not remember the file was there.

```text
promoted .multivac/changes/<slug>.md — planned since it was recorded, now open
reserved MV-90 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
```

Then the three edits and the SDD steps, exactly as `change new` prints them
today. Promotion changes what the first two lines say and nothing else.

The prose body is carried across untouched. A title argument is accepted and
ignored on promotion — the body already carries the title written when the
intention was recorded — and the output says so:

```text
  title ignored on promotion — the body already carries the one recorded with the intention
```

## Later lifecycle steps on a planned change

`plan`, `apply`, `land` and `close` refuse, and name the step that comes first:

```text
mvac: <slug> is planned, not started — start it first: multivac change new <slug>
```

## What must never appear

No command anywhere may print a refusal whose reason is that a slug was not
recorded on the roadmap first. There is no flag to require it and no
configuration key to turn it on. MV-89 carries an `absent` leg for this, so the
sentence cannot be introduced without the law failing.
