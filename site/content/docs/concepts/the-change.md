---
title: The change
weight: 3
---

The ecosystem change: planned in the brain, executed across every repo the
feature touches, closing back into the brain. The verb the other three jobs
serve.

```
multivac change new "points expire"
multivac change plan <slug>     # which repos, in what order, which invariants it touches
multivac change apply <slug>    # branch per repo from origin/main, edits, commits
multivac change land <slug>     # MRs respecting the declared order
multivac change close <slug>    # updates the brain and verifies the declared claims
```

## Four declared fields

A change declares, before anything is touched:

1. **Which repos it touches.** Registry keys. A repo that doesn't exist yet
   is legal — greenfield `apply` creates it.
2. **Landing order — ordered stages.** Each stage is a list of repo keys;
   repos in the same stage land in parallel; a stage lands only after every
   earlier stage:

   ```yaml
   landing_order:
     - [api]              # web and worker consume what api serves
     - [web, worker]
   ```

   The order is law for `land`; declare only the ordering that is a real
   constraint — an empty list is one parallel stage.
3. **Which invariants it touches**, under the rule: an invariant is never
   relaxed in code — it is changed in the law first, dated, in the same
   change.
4. **Which claims it makes true**, with their anchors. This is the contract
   `close` verifies. Draft the anchors now, while the promise is fresh —
   after merge nobody remembers.

## The change file

A change is a **file in the brain**: `.multivac/changes/<slug>.md`, carrying the four
declared fields plus per-repo status
(`planned / branched / committed / MR / landed`). That file is the state the
five subcommands read and write, across days and machines. On close it is
archived, never deleted.

## Done when its anchors resolve

> A change is not done when it merges. It is done when its anchors resolve.

Because the claims were declared up front, `close` doesn't ask whether
someone updated the docs — it re-runs `verify` **scoped to the declared
claims** and refuses to archive until:

- every claim in field 4 resolves ok on its new anchors,
- every "amends INV-xx" ended consistent — row and code agree,
- no blocking leg broke anywhere the change touched.

The ritual stops being discipline and becomes mechanism. Nothing new is
invented: the change declares before what today gets checked after, when
anyone remembers.

## The subcommands

- **plan** resolves the declaration against reality: which declared repos
  are present, what the order implies, what the change touches. A declared
  repo missing locally gets cloned here — an explicit operation that needs
  it, the same contract as `git submodule update`.
- **apply** branches each repo from `origin/main` (falling back to `main`);
  a repo that doesn't exist is created with its consumer door. The edits and
  commits are yours, on those branches. A declared SDD adapter's apply step
  runs here automatically (`--no-sdd` skips it for one change).
- **land** reports the MR order the stages dictate: what is ready to push
  now, what is blocked behind an earlier stage. `--landed <repo>` records a
  merge.
- **close** is the gate above. On success the change file is archived; the
  rows the change promised are already in the law, enacted by the human.

Decisions made mid-change become claims at close: the agent proposes the
row, the human enacts. This is the organic birth path — the main one at
steady state.

## Greenfield

A change whose repos don't exist yet: `apply` creates them — `git init`,
first commit, consumer door with the brain mounted — so the first agent
session in each already knows the law. The brain precedes the code. No
second machinery: `apply` knows how to create, not only edit.
