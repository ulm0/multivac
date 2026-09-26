---
slug: sdd-artifacts-land
status: open
horizon: now
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-142
    - MV-130
    - MV-139
  adds:
    - MV-144
  retires: []
claims:
  - id: MV-144
    statement: What the declared SDD writes in the brain for a change lands with that change. `change close` reads the brain's own status and stages every path under the artifact directories the change's slug owns, deletions included, so a spec, a plan, a task list or an archived proposal is never left uncommitted for an operator to notice. A tracked project document or configuration file the run did not write is named on its own line and never staged. And a repo the lifecycle clones or creates is equipped before its artifacts are carried onto the change's branch, so the tool's own state counts as installed rather than being scaffolded a second time over the carry.
  - id: MV-130
    statement: "Each declared door maps to the tool's own integration name, and an integration entry records what it writes: its key, whether installing it over an existing project is safe, and the directories it creates outside the tool's own store, measured per version."
  - id: MV-139
    statement: The governance graph is rendered from the brain's declarations and lands in the archive commit, beside the law, the change file, the code graphs and the SDD artifacts the closing slug owns.
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

Spec, plan and tasks: `specs/071-sdd-artifacts-land/`.

**Walked, not assumed** (2026-09-25):

- A fresh brain declaring `opsx` and no grapher, with the real openspec on PATH
  through a shim, printed step zero as `git add -- .agents .multivac AGENTS.md
  openspec` and that commit PASSED the hooks it had just installed. Before this
  change the same shape was refused as code outside a change, over the `.agents`
  directory openspec's own init had been told to create. The user's untracked file
  stayed untracked.
- Each integration's directories were measured one repo at a time, with `HOME`
  isolated: openspec 1.13.2 and spec-kit 1.0.11. Two of them are why a list would
  have been wrong — `codex` writes `.agents/`, and openspec's `windsurf` writes
  `.devin/`.
- The close pathspec, the deletion inside a feature directory, the dirty file that
  is named rather than staged, and the no-SDD case are four tests in
  `test/change/lifecycle-polish.test.ts`; the apply order is one in
  `test/change/equip-lifecycle.test.ts`. 788 green, `verify` at 144 claims and 0
  broken.
- This change's own close is the live proof of the first rule: it stages
  `specs/071-sdd-artifacts-land/`, which the previous change had to have added by
  hand.

**Seen on the way, not fixed here**: `test/change/managed-repos.test.ts`'s
read-only sibling test fails intermittently under the full parallel suite and
passes alone and on a re-run. It is a test-level flake, worth its own change.

**Rows whose legs followed a shape this change moved**: MV-130's legs pin the
integration entries, which now also carry `dirs`, and MV-139's leg pins the end of
close's pathspec, which now continues with the SDD artifacts. Both are amended
here with a dated note, because a leg repointed silently is the drift the law
exists to stop (MV-111).
