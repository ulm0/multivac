---
title: Running changes
weight: 5
---

A change is a file in the brain — `.multivac/changes/<slug>.md` — that five
subcommands read and write, across days and machines. It is not done when
it merges; it is done when its anchors resolve.

```sh
mvac change new "points expire"
mvac change plan points-expire
mvac change apply points-expire
mvac change land points-expire
mvac change close points-expire
```

All output below is real, captured from a two-repo scratch ecosystem
(`api` existing, `web` greenfield). Paths shortened.

## new — declare before you touch anything

```txt
$ mvac change new "points expire"
committed: change open: points-expire — reserves INV-02
created .multivac/changes/points-expire.md — declare repos, landing_order, invariants, claims
reserved INV-02 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [{ id: INV-02, statement: "..." }]  # what close verifies
```

`new` also takes the next free invariant ID out of the law table and writes it
straight back as a `proposed` row naming this change. Never pick an ID by
hand: two agents both picking "the next one" pick the same one, and the
collision only surfaces at merge. A `proposed` row never gates `verify`, and
`close` releases the reservation if the change never used it — a row whose
rule you stated, or that an anchor names, stays.

The scaffold and the reserved row land as **one commit on the current branch**
(`change open: <slug> — reserves <ID>`): the shared tree stays clean, and a
concurrent `new` reads the committed table instead of a floating edit. A tree
already dirty at the bookkeeping paths is refused with the exact command that
unblocks it.

The scaffold:

```markdown
---
slug: points-expire
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - INV-02        # reserved for this change
  retires: []
claims: []
---

# points expire

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan points-expire`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies
```

Fill the four declared fields before writing code:

1. **`repos`** — registry keys, each with a `status` the subcommands move:
   `planned | branched | committed | mr | landed`. A repo that doesn't
   exist yet is legal — greenfield apply creates it.
2. **`landing_order`** — ordered stages, each a list of repo keys. Repos in
   the same stage land in parallel; a stage lands only after every earlier
   stage. Empty list = everything in one parallel stage. Every declared
   repo must appear in a stage — `plan` refuses otherwise
   (`repo "web" missing from landing_order — add it to a stage`).
3. **`invariants`** — `touches` ("amends INV-xx") for every rule the change
   relaxes or reshapes, `adds` for new law (the ID `new` reserved, or one you
   declare — `plan` reserves it and fails if another change holds it),
   `retires` for tombstoning. An
   invariant is never relaxed in code: the row changes first, dated, in
   this change; the code follows in the same change.
4. **`claims`** — the statements this change makes true, with their
   anchors. This is the contract `close` verifies. Draft the anchors now,
   while you know exactly what the change promises — after merge nobody
   remembers.

A filled declaration:

```yaml
repos:
  api:
    status: planned
  web:
    status: planned
landing_order:
  - [api]        # web claims the feature only after api serves it
  - [web]
invariants:
  touches: []
  adds: [INV-02]
  retires: []
claims:
  - id: INV-02
    statement: Expired points are excluded from every balance read.
```

If an SDD adapter is declared, `new` also runs its propose step —
see [Graphers and SDD](../../reference/graphers-and-sdd). `--no-sdd` skips it once.

## plan — resolve the declaration against reality

```txt
$ mvac change plan points-expire
api: ~/eco/acme-api
web: missing at ~/eco/acme-web, no url — greenfield; `change apply points-expire` creates it
landing order:
  stage 1: api
  stage 2: web
invariant INV-02: reserved — proposed row in .multivac/invariants.md; state the rule before close
claim INV-02: no anchor — add <!-- @anchor INV-02 <repo>:<glob> /<regex>/ --> before close
```

Which declared repos are present, what the order implies, what is still
missing for close. A declared repo with a `url` and no local clone gets
cloned here — the one place implicit cloning is allowed, because you
explicitly asked for an operation that needs the repo.

## apply — a worktree per repo, or create

```txt
$ mvac change apply points-expire
committed: change apply: points-expire — status branched
api: branched points-expire from main cba4d83 — no origin/main known locally
api: worktree ~/eco/brain/.multivac/worktrees/points-expire/api
web: created ~/eco/acme-web — git init, door written, first commit
web: branched points-expire from main a5d5c36 — no origin/main known locally
web: worktree ~/eco/brain/.multivac/worktrees/points-expire/web
work here — one checkout per repo, nobody else's tree moves:
  api: ~/eco/brain/.multivac/worktrees/points-expire/api
  web: ~/eco/brain/.multivac/worktrees/points-expire/web
then commit on branch points-expire and run `multivac change land points-expire`
```

Each present repo gets its own git worktree for this change, branched after
the slug. **Write the feature in the printed paths**, not in the shared
checkout: another agent may be running another change in the same repo, and a
shared working tree switched under them puts their edits on your branch. A
repo that doesn't exist is created first: `git init`, first commit, consumer
door with the brain mounted — the first agent session in it already knows the
law. Statuses move to `branched` in the change file; `close` removes the
worktrees.

Where git cannot make a worktree, apply branches the repo in place, as it
always did — but refuses if that tree carries another change's uncommitted
work, naming the files and the `git stash push` that frees it. It never
switches a dirty tree onto your branch.

The change's bookkeeping is committed before any branch is made (`committed:
change apply: <slug> — status branched`), so every checkout apply hands back
inherits it from the base — nothing rides across a switch uncommitted.
Anything else uncommitted that the switch would overwrite stops `apply` by
name, with the command that parks it — never a raw git error, never a silent
loss.

## land — the order is law

```txt
$ mvac change land points-expire
stage 1 [ready] api:branched
  api: git -C ~/eco/acme-api push -u origin points-expire
  api: open MR points-expire -> main (state the landing order in the description)
  api: once merged: multivac change land points-expire --landed api
stage 2 [blocked] web:branched
  waiting on an earlier stage — do not push yet
```

`land` reports stage by stage: what is ready to push and MR now, what is
blocked behind an earlier stage. When an MR merges, record it:

```txt
$ mvac change land points-expire --landed api
api: recorded as landed — points-expire is merged into main 8fd47c9
stage 1 [landed] api:landed
stage 2 [ready] web:branched
  ...
```

When every stage is landed:

```txt
all stages landed — run `multivac change close points-expire`
```

## close — the gate

`close` refuses until the work is actually done. Repos not landed:

```txt
$ mvac change close points-expire
api: branched — land every stage first (multivac change land points-expire)
```

exit 1. When everything landed and the declared claims have their rows and
anchors in `.multivac/invariants.md`, close re-runs verify **scoped to the declared
claims**:

```txt
$ mvac change close points-expire
INV-02: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C ~/eco/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md && git commit -m "Archive the points-expire change" (no origin remote — the direct commit is the landing)
api: worktree removed (~/eco/brain/.multivac/worktrees/points-expire/api)
web: worktree removed (~/eco/brain/.multivac/worktrees/points-expire/web)

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

The printed commit is scoped to the closing change's paths — never `add -A`,
which in a shared checkout would sweep another change's files into the archive
commit. The wording tracks where the brain stands: on a working branch the
commit lands through that branch's MR; on the trunk of a brain with a remote
the recipe is branch + MR (`nothing lands on main directly`); only a solo
brain with no origin is told the direct commit IS the landing.

The change file is archived, never deleted; its `status` flips to
`archived`. The worktrees go with it — one still holding uncommitted work is
reported, never forced. If a declared claim's anchors don't hold, close fails: fix the
code or fix the declaration, honestly.

The tail is the [ritual](../../concepts/the-change#the-ritual): the half of
the closing ceremony no tool can check, written by the team in
`.multivac/ritual.md` and printed here verbatim — never verified, never
gating. An empty or absent ritual prints nothing.

Decisions made mid-change become claims at close: propose the row, the
human enacts. This is the organic birth path — the main one at steady
state.

## Amending and retiring

**Amend**: an invariant is never relaxed in code. Open a change declaring
it in `invariants.touches`, update the row (dated) in the same change,
change the code in the same change; close checks law and code ended
consistent.

**Retire**: a change like any other, and the tombstone is authored, never
derived:

1. Declare the retirement in `invariants.retires`.
2. Flip the row's state to `retired`. Keep the ID and the row — IDs are
   never renumbered, never reused; history stays in git.
3. Its existing legs stop being evaluated. Do not invert them — inverting
   an enactment leg would demand the enactment itself disappear.
4. Write NEW `absent` legs on that row for the dead mechanism's
   identifiers — the names someone would grep for, in every surface where
   they could resurface:

   ```markdown
   | INV-19 | RETIRED — cart reservation holds stock. | specified | retired | 2026-08-13 | journal |
   <!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
   <!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
   ```

5. In the same change, remove the dead mechanism's remains from the code
   and the doors — the new legs hold you to it at close.
