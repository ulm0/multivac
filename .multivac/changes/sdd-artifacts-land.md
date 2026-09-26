---
slug: sdd-artifacts-land
status: open
horizon: now
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-142
  adds:
    - MV-144
  retires: []
claims:
  - id: MV-144
    statement: What the declared SDD writes in the brain for a change lands with that change. `change close` reads the brain's own status and stages every path under the artifact directories the change's slug owns, deletions included, so a spec, a plan, a task list or an archived proposal is never left uncommitted for an operator to notice. A tracked project document or configuration file the run did not write is named on its own line and never staged. And a repo the lifecycle clones or creates is equipped before its artifacts are carried onto the change's branch, so the tool's own state counts as installed rather than being scaffolded a second time over the carry.
  - id: MV-142
    statement: "This repository's merge request pipeline judges the request's code against its change, and what multivac, the SDD, the grapher or a harness writes is never code: the harness directories come from the integrations the declared scaffold names, not from a fixed list."
---

# What the SDD writes in the brain lands with the change

An artifact nobody commits is a step nobody can prove ran. `change close`
stages the change file, the law, the graphs and the ecosystem graph, and stops
there: `specs/070-doors-reach-every-harness/` sat untracked after the previous
change closed, and the only reason it reached the branch at all is that a human
noticed `git status`. The lifecycle asks for those artifacts at every gate, so
leaving them out of the commit it prints is the tool asking for proof and then
dropping it.

Three pieces, all of them corrections:

**close stages what the slug owns.** Read `git status --porcelain -z
--untracked-files=all` in the brain and add the paths under each artifact
directory the slug owns: `specs/<n>-<slug>` for spec-kit, and for openspec the
change directory, its archive entry and the capability specs that archive
rewrote. The paths come from status, so `git add` never gets an empty pathspec,
and a dirty constitution or config file the run did not write is named on its own
line instead of being staged (MV-46).

**apply equips before it carries.** `cmdApply` clones or creates a repo inside
the same loop that makes its worktree and carries the SDD files, then equips
afterwards, so the vendor init runs over a checkout whose `.specify` was just
carried out of it and writes a second copy. Cloning first, equipping next, then
branching and carrying is the order the state machine already implies.

**The harness directories are derived, not listed.** MV-142 made the harness
directories non-code from `doorTargets`, which covers the doors multivac
projects and not the directories a declared SDD's integrations install into. A
brain with openspec and no graphify fails its own step 0 commit over
`.agents/**` today.

Spec, plan and tasks: `specs/<n>-sdd-artifacts-land/`.
