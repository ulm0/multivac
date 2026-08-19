---
slug: the-projection-survives-its-environment
status: open
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-73
    - MV-108
  adds:
    - MV-115
  retires: []
claims:
  - id: MV-115
    statement: "The projection survives the environments it lands in: hooks resolve through the common dir so a linked worktree runs the repo's own gates, a declared refresh means the same thing on both of its runners, and one mangled file is one named notice rather than the end of a multi-repo run."
---

# The projection survives its environment

Four places where the machinery works on the author's machine and not on the
next one.

- **A linked worktree skips the repo's own gates.** The shim probes
  `$(git rev-parse --git-dir)/hooks/<name>`, which in a linked worktree names
  `.git/worktrees/<id>` — a directory with no `hooks/` — while git runs hooks
  from the COMMON dir. Measured: `--git-dir` and `--git-common-dir` are
  byte-identical outside a worktree, and inside one only the second has
  `hooks/`. A comment in the same file claims worktrees resolve.
- **A declared refresh means two things.** The harness hook embeds the
  operator's command raw in a shell line; `refreshGraph` splits it on spaces
  into an argv. So quotes, redirects and `&&` work after an edit and break at
  close — the same declared string, two dialects.
- **One mangled file ends the run.** `applyManagedBlock` throws, and every
  repo after the broken one gets no door and no hooks. Duplicate marker pairs
  update only the first, leaving an agent reading two doors that disagree.
- **`doctor` calls a gutted shim armed.** It tests the file's presence, so a
  shim edited down to `exit 0` reports as installed and arms `--strict` over
  a gate that does nothing.

MV-73's headline is narrowed to what its body and its legs actually describe —
the skill mirror — rather than claiming a prune it does not perform.
