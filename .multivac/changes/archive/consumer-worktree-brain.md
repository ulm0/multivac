---
slug: consumer-worktree-brain
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-138
  retires: []
claims:
  - id: MV-138
    statement: verify run in a checkout under a brain's .multivac/worktrees/<slug>/<key> takes the brain, the slug and the repo key from that path, before looking for a mount, so a consumer's change worktree is verified against the brain that made it.
---

# A change worktree finds its brain from its own path

`verify` in a consumer's change worktree exited 2, because the mount there is an uninitialised submodule, while the path names the brain, the slug and the key. See `specs/063-consumer-worktree-brain/`.
