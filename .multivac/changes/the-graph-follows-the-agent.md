---
slug: the-graph-follows-the-agent
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-50
  adds:
    - MV-52
  retires: []
claims:
  - id: MV-52
    statement: "The graph refresh follows the agent, not the commit: `doors` installs a harness post-edit refresh for every declared target whose registry entry declares a post-edit hook, and only when a grapher is declared and its binary is present — one more entry in the same managed `.claude/settings.json` edit that preserves foreign keys. The entry is fire-and-forget (backgrounded, output discarded, always exit 0) and coalesced behind an atomic lock directory under `.multivac/cache/`, so a per-edit harness cannot thrash. The git hook shims never call a grapher, the refresh module never spawns git, `change close` stays the safety net for edits made outside the harness, and doctor names which path is live."
---

# The graph follows the agent

The grapher is not enforcement. Nothing lands wrong because the graph is
stale — it is a navigation aid for the agent, and its natural trigger is
"files changed in this session". That signal is a HARNESS post-edit hook. Git
has none until commit time, and hanging an ergonomic refresh off the commit
path couples a convenience to a gate and blows the sub-second budget.

So the refresh goes where the edits are. `doors` already writes a managed
`.claude/settings.json` for verify (SessionStart / PostToolUse); the graph
refresh is one more entry in that same merge, gated on a declared grapher with
its binary present, matched on the file-editing tools the registry names. It
is backgrounded and silent so it never adds latency to the edit loop, and it
skips when a refresh is already running. The git hook shims stay verify-only.

`change close` keeps refreshing — a change can land edits made outside the
harness — but it is the net, not the mechanism. The docs, the registry note
and DESIGN.md now say exactly what happens and where: harness post-edit hook
when the harness has one, close as the net, git hooks never.
