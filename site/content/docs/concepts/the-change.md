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
multivac change apply <slug>    # branch per repo from its default branch, edits, commits
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
4. **Which rows it makes true** — its claims, each a row's ID, with their
   anchors. The row states the rule; the claim cites it and never restates
   it. This is the contract `close` verifies. Draft the anchors now, while
   the promise is fresh — after merge nobody remembers.

## The change file

A change is a **file in the brain**: `.multivac/changes/<slug>.md`, carrying the four
declared fields plus per-repo status
(`planned / branched / committed / mr / landed`). That file is the state the
five subcommands read and write, across days and machines. On close it is
archived, never deleted.

## Done when its anchors resolve

> A change is not done when it merges. It is done when its anchors resolve.

Because the claims were declared up front, `close` doesn't ask whether
someone updated the docs — it re-runs `verify` **scoped to the declared
claims** and refuses to archive until:

- every claim in field 4 resolves ok or moved on its new anchors,
- every claim cites a row this change adds, touches or retires, and that row
  states its rule,
- every declared repo is recorded landed,
- no claim is anchored only in the change file, which `close` archives, and no
  row the change adds is left unclaimed while anchored or already in the law,
- the SDD's own artifacts exist, where one is declared.

That scope is deliberate and it is narrower than it sounds: `close` evaluates
the **claim IDs the change declared**, not the rows under `touches` or
`retires`, and it never runs an unscoped verify. An amended row that nobody
listed as a claim is not re-checked here: `verify` reports it on each commit
where the hooks are armed. A leg of it gates only when it is broken or vacuous in
a mode that blocks (by default `absent`, `count` and `each`), or in any mode
under `--strict`, as CI runs it, and the legs of a `proposed` or `drift` row are
only reported. An anchor line that does not parse, or names a repo key the
config does not declare, is refused on any row. Declare the rows you amend as
claims if you want `close` to be the one that answers.

Where `sdd_auto` is on and an SDD governs a declared repo — the brain itself,
when it is declared as one — the code comes through the change as well. In the
brain's own checkout and in a change's worktrees, a commit or a merge of code
outside the branch of an open change that declares the repo is refused, and so
is a merge request whose commits do so, when the pipeline runs
`verify --strict --range <base>..<head> --branch <name>`. A consumer checkout
reads a mounted brain that can lag the change, so there a branch that is no
open change is only reported and the `--range` run in CI decides, while a
branch whose open change does not declare the repo is refused in any run. A change is how code reaches a
repo, not a description written next to it.

Updating the documentation stops being discipline and becomes mechanism.
Nothing new is invented: the change declares before what today gets checked
after, when anyone remembers.

## The ritual

Closing a change is a **ceremony**, and only half of it is mechanical.
multivac executes that half — every declared repo landed, every declared
claim resolves and cites a row of the law that states its rule. The other
half is the team's: who reviews what, who gets told, what ships before what
when the reason is not technical. No tool can invent those, and none can
check them.

So the team writes them, one line each, in `.multivac/ritual.md` next to the
law — and `close` prints their lines as a checklist once the gate has passed
and the change is archived:

```txt
$ mvac change close points-expire
…
ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

What `close` prints before the ritual — the claims, the archive and the commit
to make — is in the [commands reference](../../reference/commands/#close).

**Printed, not verified.** Nothing gates on the ritual and nothing checks it;
headings and comments are left out, so an empty or absent ritual prints nothing
at all. `init` scaffolds the file with an explanation and candidate lines, all
commented out, and the brain door names it.

It gets its own file rather than a section of the law because the law is
parsed — `verify` reads its anchors, `plan` reads its state cells — and the
ritual is prose the tool only ever prints.

## Planned — a change that has not started

A roadmap is the list of things an ecosystem intends to do, and the brain
already keeps that list. Every change file is born `open`, which means a branch
is implied and an invariant id is reserved. So without one more state, the only
way to write an intention down is to commit to starting it today — and the
alternative people reach for is a second list in a wiki or a tracker, which
drifts from the first within a week. Whichever list the tool does not read becomes fiction.

`planned` sits in front of the lifecycle:

```txt
planned → open → archived
```

It is the same file, in the same directory, with the same schema, plus a
`horizon` of `now`, `next` or `later`. That is the entire ordering model: no
dates, no estimates, no rank, no dependencies between items. Starting the work
is `change new <slug>` on a slug that is already planned — the file is
**promoted**, not replaced, so the prose written when the idea was young
survives into the change that implements it. One document, one history.

Three properties make the state safe to use rather than decorative:

- **It reserves nothing.** An id allocated for work that may never happen is a
  hole in the law table no later change can fill. Reservation stays at
  `change new`, the moment the work actually begins.
- **It blocks nothing.** `verify --strict` refuses a change only once it is
  finished and still unclosed: every claim resolving, every declared repo
  landed. A planned change has neither, so no roadmap entry can hold a release,
  however long the roadmap stays non-empty.
- **It is not a gate.** `change new` on a slug nobody planned works exactly as
  it always did. Requiring a feature to appear on the roadmap first is
  unverifiable intent — the same category as the ritual, which is why the
  ritual is printed and never checked. A gate everyone learns to skip at three
  in the morning teaches people to work around the tool.

Every later step — `plan`, `apply`, `land`, `close` — refuses a change that has
not started, and names `change new` as the step that comes first. Where an SDD
is declared, `plan`, `apply` and `close` run its gate before that check, so
their refusal can be for a missing artifact instead; `close --abandon` runs no
gate, so a planned change always gets the not-started refusal there.

See [`roadmap`](../../reference/commands/#roadmap-add-slug-title---horizon-nownextlater--sync)
for the command, and [Running changes](../../guide/running-changes/#roadmap--write-it-down-without-starting-it)
for the flow.

### The ritual arrives with candidates

`init` used to write the ritual as a bare comment, and facing a blank page most
people write nothing — so the closing step printed nothing forever. It now
carries candidates drawn from what you declared, **every one commented out**.

An unadopted ceremony is not a ceremony. Uncomment what your team actually owes
each other and delete the rest; nothing is asserted on your behalf, and a
commented line never prints. A fresh brain still prints nothing at close, which
is exactly what it did before.

Only things no check could decide are seeded: putting a checked thing in the
ritual would move it onto a poster.

The ritual is **authored** — written once by you, never overwritten by any
command. That is the opposite of
[`flow.md`](../../reference/commands/#multivacflowmd--what-your-declarations-oblige),
which is derived and rewritten whole on every projection.

## The subcommands

- **plan** resolves the declaration against reality: which declared repos
  are present, what the order implies, what the change touches. A declared
  repo missing locally that has a `url` gets cloned here — an explicit
  operation that needs it, the same contract as `git submodule update`.
- **apply** branches each repo from its default branch, resolved in that
  order: where `origin/HEAD` points, then this machine's `init.defaultBranch`,
  then `main`, then `master` — never a fixed name; if none exists it branches
  from the checked-out HEAD and says so. A repo that doesn't exist is cloned
  from its `url`, or created with its consumer door when it has none. The edits
  and commits are yours, on those branches. A declared SDD adapter's apply step
  is **printed** here for you to run (`--no-sdd` skips the printing, the tool's
  own init in the brain and this step's gate for one run; later steps need it
  again).
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
the consumer door, a first commit — so the first agent session in each starts
at a door that points it to the law; the brain itself is mounted by
`multivac repos sync`. The brain precedes the code. No second machinery:
`apply` knows how to create, not only edit.
