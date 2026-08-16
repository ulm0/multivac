---
slug: doors-prunes-what-it-projects
status: archived
repos:
  brain:
    status: landed
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

**Decided, in the spec and built:** it is ours. Nothing on disk records who
wrote a file, so keeping "user files" means inferring authorship from a name or
a timestamp and then acting on the guess — the thing this project forbids
itself. The directory has one source and its content is that source; a user's
own skills live beside it, untouched. `site/content/docs/reference/integrations.md`
says so to users.

## Found alongside, NOT fixed here

`installHooks` treats `core.hooksPath` as repo-relative when it may be
absolute. `git config core.hooksPath` returning `/Users/me/proj/.multivac/hooks`
takes the `alongside` strategy, and `join(repo, dir)` with an absolute `dir`
concatenates rather than replaces — so the shims land in
`<repo>/Users/me/proj/.multivac/hooks/`, a literal directory tree named after
the machine's filesystem, while the notice prints the absolute path as if that
were where they went. Reproduced by running `doors` in a git worktree of this
repo, which inherits the main checkout's absolute `core.hooksPath` through the
shared config; a repo whose owner simply set an absolute hooksPath gets it too.

Left unfixed on purpose: it is `src/hooks/install.ts` and MV-73 is
`src/commands/doors.ts` — a different mechanism, a different row, and folding
it in here would put a fix nobody reviewed for it under a claim that does not
cover it. Written down so it is not lost; it wants its own change.
