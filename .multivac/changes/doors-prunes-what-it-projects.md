---
slug: doors-prunes-what-it-projects
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-73
  retires: []
claims:
  - id: MV-73
    statement: "doors removes what it stops projecting: a file the source no longer has is deleted from the projected copy in the same run."
---

# doors prunes what it projects

The skill install is a `cpSync` from `<packageRoot>/skills/<name>` into the
target's skill directory, and nothing ever deletes. Reproduced: a file planted
at `.claude/skills/multivac/references/STALE.md` survived every later `doors`
run.

That was survivable while the copy was untracked scratch. MV-72 made both trees
tracked, so the stale file is now **committed**, and the test MV-72 anchors goes
red for a file the tool itself refuses to remove. The only fix available to a
user is `rm` by hand — for a directory multivac claims to own.

Projection is a mirror, not an accretion. `doors` writes the skill tree from a
known source; every file under the projected directory that the source no
longer has belongs to a version of the skill that is gone, and the run that
notices is the run that should remove it.

## Scope

The delete pass is bounded to the directory multivac projects into
(`<target>/skills/<name>`), never a parent, and it is the same rule for every
registry entry carrying a `skill` — `doors` dispatches on `kind`, not on name
(MV-28).

That bound is load-bearing, not defensive. `specify init --here --integration
claude` installs ten sibling skills into the same parent —
`.claude/skills/speckit-specify/`, `-plan`, `-tasks`, and so on. A prune that
walked `.claude/skills/` instead of `.claude/skills/multivac/` would delete
another tool's installation on the next `doors` run.

Open question for the plan: whether a file a *user* added under that directory
is theirs or ours. The honest default is that the directory is multivac's, the
way the managed block in `AGENTS.md` is multivac's — but that is a decision, and
it belongs in the spec rather than in an assumption.
