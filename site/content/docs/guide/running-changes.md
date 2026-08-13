---
title: Running changes
weight: 4
---

A change is a file in the brain — `changes/<slug>.md` — that five
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
created changes/points-expire.md — declare repos, landing_order, invariants, claims
```

The scaffold:

```markdown
---
slug: points-expire
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds: []
  retires: []
claims: []
---

# points expire

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan points-expire`.
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
   relaxes or reshapes, `adds` for new law, `retires` for tombstoning. An
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
see [Adapters](../adapters). `--no-sdd` skips it once.

## plan — resolve the declaration against reality

```txt
$ mvac change plan points-expire
api: ~/eco/acme-api
web: missing at ~/eco/acme-web, no url — greenfield; `change apply points-expire` creates it
landing order:
  stage 1: api
  stage 2: web
invariant INV-02: new — add its row before close
claim INV-02: no anchor — add <!-- @anchor INV-02 <repo>:<glob> /<regex>/ --> before close
```

Which declared repos are present, what the order implies, what is still
missing for close. A declared repo with a `url` and no local clone gets
cloned here — the one place implicit cloning is allowed, because you
explicitly asked for an operation that needs the repo.

## apply — branch, or create

```txt
$ mvac change apply points-expire
api: branched points-expire from main
web: created ~/eco/acme-web — git init, door written, first commit
web: branched points-expire from main
next: write the feature in each repo on branch points-expire, commit, then `multivac change land points-expire`
```

Each present repo gets a branch named after the slug. A repo that doesn't
exist is created: `git init`, first commit, consumer door with the brain
mounted — the first agent session in it already knows the law. Statuses
move to `branched` in the change file. Write the feature on those
branches and commit.

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
api: recorded as landed
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
anchors in `invariants.md`, close re-runs verify **scoped to the declared
claims**:

```txt
$ mvac change close points-expire
INV-02: ok
archived -> changes/archive/points-expire.md
```

The change file is archived, never deleted; its `status` flips to
`archived`. If a declared claim's anchors don't hold, close fails: fix the
code or fix the declaration, honestly.

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
