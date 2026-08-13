---
slug: changes-do-not-collide
status: open
repos:
  self:
    status: branched
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-25
    - MV-26
  retires: []
claims:
  - id: MV-25
    statement: change apply gives each change its own git worktree under
      .multivac/worktrees/<slug>/<repo>, prints the path, and close removes it;
      where worktrees are unavailable apply falls back in place and refuses a
      tree carrying another change's uncommitted work.
  - id: MV-26
    statement: "Invariant IDs are allocated by the tool, never by hand: change new
      reserves the next free ID as a proposed row in .multivac/invariants.md
      under a lock, and plan refuses a declared add that another change already
      reserved."
---

# Changes do not collide

Two agents in one checkout collided in DOGFOOD-01: `apply` switched the shared
working tree under the other agent's feet (edits landed on the wrong branch, one
was lost), and both changes hand-picked the same next invariant ID, caught only
at merge.

## Worktree per change (MV-25)

`apply` stops switching the shared tree. Each declared repo gets a linked git
worktree at `<brain>/.multivac/worktrees/<slug>/<repoKey>` — machinery, so it
lives under `.multivac/` beside the config and the hooks, and is gitignored
there. The path is printed, because the agent has to know where to work.
`close` removes the worktrees after archiving.

Fallback matters as much as the happy path: git older than 2.5, or an `add`
that fails for any reason, drops back to the in-place `switch` — which is
`ensureBranch`, unchanged. It already refuses outright when the tree holds work
the switch would overwrite, names the blocking paths and the command that parks
them, and carries the change's own declaration file across (`apply` wrote it,
so it is never a reason to refuse). The fallback adds no second refusal path of
its own; it only says which route it took.

## Reserved invariant IDs (MV-26)

The store is **a row in the law table in `proposed` state**, not a new file.
Justification: `.multivac/invariants.md` is already the ID registry, already read by both
`new` and `plan`, already travels with the repo, and `verify` already knows the
state — "proposed rows never block, not even under `--strict`" predates this
change. A separate reservation file would have to be taught to `verify`,
gitignored or tracked, and reconciled with the table it duplicates. Zero new
machinery beats one more store.

Race safety is not the atomic rename alone (two readers would still pick the
same ID): the read-append-write runs under an exclusive `.multivac/invariants.md.lock`
created with `wx` — the one filesystem primitive that is atomic across
processes — and the row is then written to a temp file and renamed into place.
A stale lock is named in the error with the command to remove it.

`new` reserves one ID and writes it into `invariants.adds`; `plan` reserves any
declared add that is still free, and **fails** when the ID is already in the
table under another change — loudly, at declare time, which is the whole point.
`close` releases a reservation that was never used (still `proposed`, still
unanchored, still pointing at this change), so an unused ID does not rot in the
law.

## Observed while running this change through the lifecycle

- `apply` on a brain==code repo whose branch is *already* checked out in the
  shared tree cannot make a worktree (git refuses a branch checked out twice),
  so it falls back in place — correctly, and only for the agent who is already
  there. The isolation shows up for the second agent, which is the one that
  used to lose edits.
- `verify` self-healed two brand-new anchors toward the wrong files because
  their target files were still untracked: a glob with zero *tracked* matches
  reads as "moved". `git add -N` before verify is the workaround.
- `saveChange` reflowed the claim prose when `apply` rewrote the frontmatter.
- Rebased onto the friction backlog: the branch's own `switchInPlace` — a
  second dirty-tree refusal written before `apply-git-robustness` landed — was
  dropped. `ensureBranch` on main already refuses by name, names the unblocking
  command, and carries the declaration file, so the fallback calls it instead of
  re-implementing it.

**Known ceiling:** a reservation is only visible to checkouts that share the
brain's `.multivac/changes/` and `.multivac/invariants.md` — the shared brain
tree where `new` and
`plan` run, before `apply` moves the agent into a worktree. Two agents on two
unmerged branches (or two clones) still cannot see each other's rows; that is
the merge-time problem git already owns, and this change does not pretend to
solve it.
