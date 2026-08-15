---
slug: the-graph-refreshes-itself
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-50
  retires: []
claims:
  - id: MV-50
    statement: "`change close` executes the declared grapher's refresh — in the brain and in each declared+present repo the change touched — when its binary is on PATH; an absent binary degrades to the install notice and a failing refresh is a warning, never a failed close. The refresh module never invokes git: the artifact is left on disk uncommitted, to land only in dedicated chore commits. The post-edit refresh claim is honest: the hook shims run verify only, and the site says refresh happens at `change close` (plus doctor's stale-graph warning), not through the hook path."
---

# The graph refreshes itself

`change close` used to print `graph: refresh with \`graphify update .\` in the
changed repos` and do nothing, while the site claimed the artifact is
"refreshed after edits through the harness hook path" — a path that runs
`verify` only. Two lies, one direction each.

Now close EXECUTES the refresh: for the brain and every declared+present repo
in the change's `repos` map, the scope's grapher (`repos.<key>.grapher`,
falling back to the global `grapher:`) runs its adapter `refresh` command in
that directory, one result line per scope. An absent binary keeps the old
notice with the install hint; a refresh that exits non-zero is a warning that
hands the command back — close never fails because a foreign tool did.

The refresh module (`src/adapters/refresh.ts`) never spawns git, so the
artifact cannot be staged or committed by the lifecycle: graph output is
regenerated locally and lands only in dedicated chore commits.

The hook shims were left as they are — they run `verify` only; wiring
config-resolved grapher execution into the sh shims is not a few lines. The
docs now say what the code does: refresh happens at `change close`, staleness
is doctor's warning with the manual command.
