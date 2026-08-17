---
title: The change
weight: 4
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

- every claim in field 4 resolves ok or moved on its new anchors,
- every declared repo is recorded landed,
- the SDD's own artifacts exist, where one is declared.

That scope is deliberate and it is narrower than it sounds: `close` evaluates
the **claim IDs the change declared**, not the rows under `touches` or
`retires`, and it never runs an unscoped verify. An amended row that nobody
listed as a claim is not re-checked here — the pre-commit hook is what catches
it, on every commit, which is the earlier and stricter place. Declare the rows
you amend as claims if you want `close` to be the one that answers.

Updating the documentation stops being discipline and becomes mechanism.
Nothing new is invented: the change declares before what today gets checked
after, when anyone remembers.

## The ritual

Closing a change is a **ceremony**, and only half of it is mechanical.
multivac executes that half — the landing order held, every declared claim
resolves, no invariant was relaxed in code instead of in the law. The other
half is the team's: who reviews what, who gets told, what ships before what
when the reason is not technical. No tool can invent those, and none can
check them.

So the team writes them, one line each, in `.multivac/ritual.md` next to the
law — and `close` prints them verbatim once the gate has passed and the
change is archived:

```txt
$ mvac change close points-expire
INV-02: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this on a branch; nothing lands on main directly:
  git -C ~/eco/brain switch -c close-points-expire && git add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md && git commit -m "Archive the points-expire change" && git push -u origin close-points-expire
  then open MR close-points-expire -> main

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

**Printed, not verified.** Nothing gates on the ritual, nothing parses it; an
empty or absent ritual prints nothing at all. `init` scaffolds the file with
a single comment saying what belongs there, and the brain door names it.

It gets its own file rather than a section of the law because the law is
parsed — `verify` reads its anchors, `plan` reads its state cells — and the
ritual is prose the tool only ever prints.

## The subcommands

- **plan** resolves the declaration against reality: which declared repos
  are present, what the order implies, what the change touches. A declared
  repo missing locally gets cloned here — an explicit operation that needs
  it, the same contract as `git submodule update`.
- **apply** branches each repo from its default branch, resolved in that
  order: where `origin/HEAD` points, then this machine's `init.defaultBranch`,
  then `main`, then `master` — never a fixed name. A repo that doesn't exist is
  created with its consumer door. The edits and commits are yours, on those
  branches. A declared SDD adapter's apply step is **printed** here for you to
  run (`--no-sdd` skips the printing and the later gate for one change).
- **land** reports the MR order the stages dictate: what is ready to push
  now, what is blocked behind an earlier stage. It opens nothing — multivac
  has no forge integration — and `--landed <repo>` is you recording a merge.
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
