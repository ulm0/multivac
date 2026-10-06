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

## roadmap — write it down without starting it

Not every intention is ready to become work. `roadmap add` records one as a
change in the `planned` state: same file, same directory, one state earlier.

```txt
$ mvac roadmap add tracker-projects-the-roadmap "Issues and boards from the change files"
committed: roadmap: tracker-projects-the-roadmap planned (later)
recorded .multivac/changes/tracker-projects-the-roadmap.md — planned, horizon later
  no invariant id is reserved until it starts: multivac change new tracker-projects-the-roadmap
```

`--horizon now|next|later` says how near it is; the default is `later`, so
nothing becomes urgent by omission. Reading the list back:

```txt
$ mvac roadmap
roadmap: 3 planned
  now
    tracker-projects-the-roadmap — Issues and boards from the change files
  next
    agents-run-in-parallel-where-work-isolates — Urge the fan-out the tool already knows about
  later
    ci-checks-every-repo — One CI job per declared repo
in flight: 1 open change — points-expire
```

Horizons print nearest first, slugs are alphabetical within a horizon, and an
empty horizon is omitted rather than printed empty. The `in flight:` line is
separate on purpose: a roadmap read without it invites reading intention as
progress.

Nothing on the roadmap reserves an id, opens a branch or delays a release, and
nothing requires you to use it — `change new` on a slug nobody planned behaves
exactly as it always has. See [Planned](../../concepts/the-change/#planned--a-change-that-has-not-started)
for why each of those is deliberate.

When it becomes work, `change new` **promotes** the file rather than writing a
second one, and the id is reserved at that moment:

```txt
$ mvac change new tracker-projects-the-roadmap
committed: change promoted: tracker-projects-the-roadmap — reserves INV-03
promoted .multivac/changes/tracker-projects-the-roadmap.md — planned since it was recorded, now open
  title ignored on promotion — the body already carries the one recorded with the intention
reserved INV-03 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [INV-03]                           # the rows close verifies; each states its rule
```

Whatever you wrote in the body while the idea was young is carried across byte
for byte. From here the flow is the one below, unchanged.

## new — declare before you touch anything

```txt
$ mvac change new "points expire"
committed: change open: points-expire — reserves INV-02
created .multivac/changes/points-expire.md — declare repos, landing_order, invariants, claims
reserved INV-02 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [INV-02]                           # the rows close verifies; each states its rule
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
    - INV-02
  retires: []
claims: []
---

# points expire

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan points-expire`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [<ID>] — the rows close verifies; each row states its own rule

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours: with an SDD declared, `change close` only
appends the line citing its directory.
```

The last paragraph is the rule: comments and layout do not survive a rewrite,
and a key multivac does not know is dropped with a warning. Notes go in the
body.

Fill the four declared fields before writing code:

1. **`repos`** — registry keys, each with a `status`:
   `planned | branched | committed | mr | landed`. `apply` raises it to
   `branched` and `land --landed` sets `landed`; nothing writes `committed` or
   `mr`. A repo that doesn't exist yet is legal — greenfield apply creates it.
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
4. **`claims`** — the IDs of the rows this change makes true. A claim is an
   ID and nothing else: the row states the rule, so state it there before
   close. Draft the anchors now, while you know exactly what the change
   promises. `close` refuses a claim of no row, of a row the change neither
   adds, touches nor retires, of a retired row it does not retire, or of a
   row that still reads RESERVED, and a row you add and anchor without
   claiming it.

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
claims: [INV-02]
```

If an SDD adapter is declared, `new` **prints** that tool's propose step for you
to run in your agent, and names the artifact that will prove it ran. The step is
yours; the one thing `new` runs is the tool's own `init` in the brain, where the
tool has never run, and it refuses to open the change if that `init` cannot run
because the binary cannot be found. See [SDD tools](../../reference/sdd).
`--no-sdd` skips the printing and the `init` for that run; `plan`, `apply` and
`close` each run their own gate and take their own `--no-sdd`.

The SDD lives in the brain, so its steps start in the brain checkout and write
the change's specs there, whichever repos the change names; once `apply` has
carried them onto the change's branch, OpenSpec's apply step runs where they
now are, and its line says so. The why, the design
and the tasks go into those files, not into the change file's body: the body
keeps what it held while planned, or one sentence, and `close` adds the line
that points at the spec directory.

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
cloned here, and by `apply` if it is still missing — because you explicitly
asked for an operation that needs the repo.

## apply — a worktree per repo, or create

```txt
$ mvac change apply points-expire
committed: change apply: points-expire — status branched
web: created ~/eco/acme-web — git init, door written, first commit
api: branched points-expire from main cba4d83 — no origin/main known locally
api: worktree ~/eco/brain/.multivac/worktrees/points-expire/api
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
repo that doesn't exist is made first: cloned if it declares a `url`, otherwise
`git init` and a first commit holding only the consumer door, `AGENTS.md`. The
door names where the brain mounts but does not mount it: until `multivac repos sync`
has, the first session there cannot read the law. Statuses move to `branched`
in the change file; `close` removes the worktrees.

Where git cannot make a worktree, apply branches the repo in place, as it
always did — but refuses if that tree carries any uncommitted work, naming
the files and the `git stash push` that frees it. It never switches a dirty
tree onto your branch.

The change's bookkeeping is committed before any branch is made (`committed:
change apply: <slug> — status branched`), so every checkout apply hands back
inherits it from the base — nothing rides across a switch uncommitted.

### The SDD files ride onto the branch

Your SDD writes a change's artifacts, such as spec-kit's `specs/<n>-<slug>/`,
into the brain checkout, before any branch exists. When the brain is also a code
repo and the change names it, `apply` moves them onto the change's branch: it
copies them into the worktree, commits them there, and removes them from the
checkout. The SDD's own shared files that are not yet committed, such as a
freshly installed `.specify/`, go the same way.

```txt
brain: carried 3 speckit files onto points-expire and committed them there
```

So the merge lands them, and no untracked copy is left to stop it. A tracked
file you modified in the checkout, or one git ignores, cannot be moved safely.
`apply` names it and stops before it bumps anything:

```txt
brain: specs/004-points-expire/tasks.md is tracked and modified here — commit or stash it in ~/eco/brain, then re-run
```

For spec-kit, the worktree also gets its own `.specify/feature.json`, so
`/speckit.implement` run there finds the feature. For OpenSpec, `openspec
instructions apply` runs where `openspec/changes/<slug>/` now is — the brain's
change worktree — and the archive runs after the merge, in the brain checkout,
never in the worktree: an archive left only there never reaches the brain, and
`close` refuses it by name.

A brain with no code of its own has no branch to carry them to: the spec
directory stays in the brain checkout, and `close` names it in the archive
commit it prints. The steps still
run from there, and the code goes only into the code repos' worktrees — `plan`
says so, naming where. With two changes open in one brain, `plan` and `apply`
also point spec-kit's `.specify/feature.json` at the right change's directory
before its steps run, and say when it named the other.

## land — the order is law

```txt
$ mvac change land points-expire
channel: origin/main does not resolve here (no remote, or never fetched) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read
stage 1 [ready] api:branched
  api: git -C ~/eco/acme-api push -u origin points-expire
  api: open MR points-expire -> main (state the landing order in the description)
  api: once merged: multivac change land points-expire --landed api
stage 2 [blocked] web:branched
  waiting on an earlier stage — do not push yet
```

`land` reports stage by stage: what is ready to push and MR now, what is
blocked behind an earlier stage. It commits nothing on the change's branch:
what you push is what you committed there. The `channel:` line reads the
brain's published ref for the declared claims; with no remote, as here, it
says it read nothing.

The code you push is judged too. Where an SDD governs the repo and `sdd_auto` is
on, code that is not on the branch of an open change declaring the repo is
refused at commit and merge by the git hooks of a brain that holds code. A code repo's own checkout reads a mounted brain
that can lag: a branch that is no open change there is only reported at commit
and merge (a consumer's change worktree reads the brain itself and refuses it), and the merge request pipeline's
`verify --strict --range <base>..<head> --branch <name>` refuses it, while a
branch whose open change does not declare the repo is refused in any run.
See [Code lands in a change](../../reference/commands/#code-lands-in-a-change).

When an MR merges, record it — the one form of `land` that writes, committing
the status bump in the brain:

```txt
$ mvac change land points-expire --landed api
api: recorded as landed — points-expire is merged into main 8fd47c9
committed: change land: points-expire — api landed
channel: origin/main does not resolve here (no remote, or never fetched) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read
stage 1 [landed] api:landed
stage 2 [ready] web:branched
  ...
```

When every stage is landed, the last line of the report is:

```txt
all stages landed — run `multivac change close points-expire`
```

If close would still refuse the change on what its claims cite, the last
`land` says so instead of sending you there: it names each line close refuses
on, and ends `all stages landed — fix the line close refuses on above, then:
multivac change close points-expire`.

```txt
  close refuses until: INV-02: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md
```

## close — the gate

`close` refuses until the work is actually done. Every repo not landed gets a
line, so straight after `apply` that is both:

```txt
$ mvac change close points-expire
api: branched — land every stage first (multivac change land points-expire)
web: branched — land every stage first (multivac change land points-expire)
```

exit 1. When everything landed and the declared claims have their rows and
anchors in `.multivac/invariants.md`, close re-runs verify **scoped to the declared
claims**:

```txt
$ mvac change close points-expire
INV-02: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C ~/eco/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Archive the points-expire change" (no origin remote — the direct commit is the landing)
api: worktree removed (~/eco/brain/.multivac/worktrees/points-expire/api)
web: worktree removed (~/eco/brain/.multivac/worktrees/points-expire/web)

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

The printed commit is scoped to the closing change's paths — never `add -A`,
which in a shared checkout would sweep another change's files into the archive
commit. With an SDD declared, those paths include the change's spec directories
in the brain, whatever `--no-sdd` or `sdd_auto: false` said, and the archived
change file ends with one line pointing at them:

```txt
Specified in `specs/004-points-expire/` (speckit).
```

The printed commit's wording tracks where the brain stands: on a working branch the
commit lands through that branch's MR; on the trunk of a brain with a remote
the recipe is branch + MR (`nothing lands on main directly`); only a solo
brain with no origin is told the direct commit IS the landing.

The change file is archived, never deleted; its `status` flips to
`archived`. The worktrees go with it — one still holding uncommitted work is
reported, never forced. If a declared claim's anchors don't hold, close fails: fix the
code or fix the declaration, honestly.

Close verifies each declared claim — its anchors and its row — and nothing
else: a row you only amend is checked here when the change claims it, and on
every commit by the pre-commit hook. Before anything is written it also checks
what each claim cites, and names every refusal in one run — among them a
claim of no row, of a row this change neither adds, touches nor retires, of a
row that states no rule yet, or anchored only in the change file it archives,
and a row you added and anchored but never claimed. A row the brain's channel
already states and this checkout lacks is named as a pull, never as a second
statement.

The tail is the [ritual](../../concepts/the-change#the-ritual): the half of
the closing ceremony no tool can check, written by the team in
`.multivac/ritual.md` and printed here line by line, minus headings, comments
and blank lines — never verified, never gating. An empty or absent ritual prints nothing.

Decisions made mid-change become claims at close: propose the row, the
human enacts. This is the organic birth path — the main one at steady
state.

## Amending and retiring

**Amend**: an invariant is never relaxed in code. Open a change declaring
it in `invariants.touches`, update the row (dated) in the same change,
change the code in the same change. Claim the row, and close verifies its
amended legs; claimed or not, `verify` reports them on each commit where the
hooks are armed, and refuses one only in a blocking mode or under `--strict`.

**Retire**: a change like any other, and the tombstone is authored, never
derived:

1. Declare the retirement in `invariants.retires`.
2. Flip the row's state to `retired`. Keep the ID and the row — IDs are
   never renumbered, never reused; history stays in git.
3. Its legs other than `absent` stop being evaluated. Do not invert them —
   inverting an enactment leg would demand the enactment itself disappear.
4. Write NEW `absent` legs on that row for the dead mechanism's
   identifiers — the names someone would grep for, in every surface where
   they could resurface:

   ```markdown
   | INV-19 | RETIRED — cart reservation holds stock. | specified | retired | 2026-08-13 | map |
   <!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
   <!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
   ```

5. In the same change, remove the dead mechanism's remains from the code
   and the doors. From then on the new `absent` legs gate every run: a
   retired row's tombstone blocks by default.
