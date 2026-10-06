---
title: Configuration
weight: 2
---

One file: `.multivac/config.yml`, in the brain. It is a **registry, not a
plugin system** — it selects entries the tool already ships, by name, and
declares where the repos are. It never defines behaviour.

`init` writes it. Every key below is optional; a file containing nothing but
`{}` loads with every default applied. Every validation error names the key
and the fix, and a key multivac does not know — at the top level or in a repo
entry — is one: `strict_prepush` is refused as `.multivac/config.yml: unknown
key "strict_prepush" — did you mean "strict_pre_push"?`, never loaded and
ignored.

A config an earlier release wrote may still declare a code graph, at the root
or on a repo. Those keys load and are ignored — multivac keeps no code graph —
and `doctor` names them in one line, as does `verify` in the brain checkout,
with how to delete them.

What `init` writes with no flags, in an empty directory with no git remote:

```yaml
# multivac configuration — seeded by `multivac init`.
# Edit directly; adopting a new agent later is one line here + `multivac doors`.
doors: [agents]
# brain_url:   # no git remote detected — the URL others clone the brain from, for `repos sync` to mount
# repos:
#   backend: ../backend   # bare string = { path }
```

A filled-in one:

```yaml
doors:   [agents, claude, cursor]
sdd:     opsx
authorities: [published, specified, open]
blocking: [absent, count, each]
staleness: block
strict_pre_push: true
channel: origin/main
mount: .brain
repos:
  api: ../acme-api
  payments:
    url: git@example.com:acme/payments.git
    path: ../payments
    channel: origin/release
```

## Changing it needs an open change

This file decides which repos exist, which adapters bind and which gates run.
Every one of those is as load-bearing as a law row, so a staged modification is
refused while no change is open:

```txt
config    .multivac/config.yml is modified and no change is open — it decides which repos are verified and which gates run
          open one first (`multivac change new "<title>"`), or drop the edit
```

**Creating one is free** — a brain has to start somewhere, and `init` is the
only thing that writes this file, only when it is absent. So the rule reads what
the commit does rather than who claims to have done it.

**Any open change satisfies it**, including one opened for this very edit. The
stronger reading — a change that *names* this file — would need a field the
change file does not have. What this buys is that the edit lands on a branch
with a merge request describing it.

It reads the index, not the working tree: the index is what is about to be
committed.

## Top-level keys

### `doors`

| | |
| --- | --- |
| type | list of strings — registry target names |
| default | `[]` |
| example | `doors: [agents, claude, cursor]` |

Which harness door targets `doors` projects, and which ones `doctor` reports
on. Names must exist in the shipped registry; see
[Agent integrations](../integrations) for the eight entries.

**`doors` and `--provider` are not the same list**, which is why the flag adds
to this key rather than being it. `--provider` answers *which coding agents do
you use* — `claude`, `cursor`, `copilot`. `doors` records *which doors are
projected*, and the list `init` writes starts with `agents`: the canonical
`AGENTS.md`, which is not an agent anyone installs but the format the others
project from. Naming this key `providers` would put a non-provider at the head
of that list.

**Without it:** `doors` still writes the canonical `AGENTS.md` and the git hook
shims into the brain and every repo on disk that is not read-only, because that
write is unconditional — but no symlink, no stub, no skill, no harness hook is
installed for any vendor. `doctor` says so:

```txt
doors      none declared — add doors: [agents] to .multivac/config.yml
```

An unknown name is a notice from `doors` and a line from `doctor`, never a
crash:

```txt
doors      nope: unknown target — known: agents, claude, cursor, opencode, codex, windsurf, gemini, copilot; fix doors: in .multivac/config.yml
```

### `sdd`

| | |
| --- | --- |
| type | string — one of `opsx`, `speckit`, or `none` |
| default | unset |
| example | `sdd: opsx` |

Selects the spec-driven-development adapter whose own steps run inside the
change lifecycle — for OpenSpec, `openspec new change`, the `status` and
`instructions` loop, `instructions apply` and `archive`. See
[SDD tools](../sdd). It runs in the brain alone — it is
installed there and its steps print there — and it governs the code of every
declared repo that does not say `sdd: none` (see
[`sdd:` per repo](#repos)). In a brain that is its own code repo, the brain's
own entry may declare it instead. `none` declares no SDD.

A declaration that would resolve in no root is refused when the config loads,
naming the key and the fix: a tool in a repo's own `sdd:`, a top-level tool the
brain's own entry contradicts with another tool or `none`, or a name multivac
does not know. Commands that load the config exit 2 on it; the exceptions are
under [Errors are exit 2](#errors-are-exit-2). `doctor` reports it on its
`config invalid` line:

```txt
repos.landing.sdd: opsx — REFUSED: the SDD lives in the brain alone, so a code repo's sdd: takes only none, which exempts its code from the change gate. Fix: remove repos.landing.sdd or set it to none in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
```

A repo that mounts the brain is not refused over its brain's config: `verify`
there prints the same text as one `sdd` line ending *in the mounted brain's
config; its owner fixes it*, which blocks only under `--strict`, and `count`
prints it and counts.

**Without it, and with the brain's own entry declaring none:** silence. No SDD step runs,
`doctor` prints no `sdd` line at all. Not declaring is different from
declaring something absent — the first is "we do not use one", the second is
"we use one, it is not on this machine".

### `sdd_auto`

| | |
| --- | --- |
| type | boolean |
| default | `true` |
| example | `sdd_auto: false` |

Whether the declared `sdd` adapter prints its steps at `change new`,
`change plan`, `change apply`, `change land` and `change close`, and gates on
their artifacts at `change plan` and `change apply`, and at `change close` on
the tool's archive, where it has one, and its task ledger. `false` also drops
the check that code lands only on the branch of an open change.

**Without it:** each lifecycle point prints its steps and the next command
refuses without their artifacts. Set it to `false` to keep the adapter
declared — `doctor` still reports it — while running its steps by hand:

```txt
sdd        opsx @ brain: installed · binary ok · sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself
```

`--no-sdd` on a single `change` invocation skips the steps and their gates once,
without editing the config; at `change plan`, `change apply` and `change close`
it also records the skip in the change file. Neither
stops `change close` from naming the brain's spec directories for the change in
the archive commit it prints and citing them in its body: the switch skips the
steps and their gates, never what was already written.

### `tracker`

Which issue tracker the roadmap projects to: `gitlab`, `github`, or absent
(`none` reads as absent). Any other name loads, and only `roadmap sync`
refuses it.

```yaml
tracker: gitlab
```

Root level only. Unlike `channel`, which a repo may override, the tracker
projects the **change** — and changes live only in the brain, so a
per-repo override would answer a question nobody can ask.

Projection is one way and runs only from `multivac roadmap sync`. It reaches the
network, so it never runs from `verify`, `doctor` or `doors`. Each issue carries
a `multivac::planned` or `multivac::open` label, added and never removed, so an
issue that was both carries both.

### `repos.<key>.role`

Optional. One line saying what a repo is **for**, rendered in the ecosystem list
a repo's own door carries once two repos are declared.

```yaml
repos:
  api:
    path: ../acme-api
    role: the contract every surface consumes
  web: ../acme-web
```

Declared or omitted, never derived — what a repo is for is not in its path, and
`api — api` is worse than silence. A repo with no `role` has its entry stop at
the path.

A role written across several lines is reduced to one, because the list is a
list.

### `repos.<key>.managed`

| | |
| --- | --- |
| type | boolean |
| default | `true` |
| example | `managed: false` |

Whether multivac may write in this repo. Declare a repo another team owns, with
protected branches, so anchors can read it — and say it is not yours:

```yaml
repos:
  payments:
    path: ../payments
    managed: false
```

A read-only repo is read, verified, cloned and fetched, and never written: no
SDD init, and `doors` projects no door, skill, harness hook config, git hook
shim or `core.hooksPath` there. No gate demands a file there — the SDD runs in
the brain alone. `doctor` and `repos` report it, `doctor`'s pins line expects
no mount there, names nothing an earlier release left there, and `doctor`'s
exit code does not change:

```txt
pins       payments: not managed, read-only — no mount expected
```

A change that names it is refused by `change plan` and `change apply` before
anything is cloned, branched or bumped:

```txt
payments: not managed, read-only — drop it from .multivac/changes/points-expire.md, or remove `managed: false` through a change …
```

**The shallow twin.** A clone git reports shallow — `repos sync --shallow`
makes one — is read-only the same way, with no key to write. The clone itself
is asked (`git rev-parse --is-shallow-repository`, offline) on every run, so
`git -C ../payments fetch --unshallow` brings it back into scope with nothing
edited, and `doctor` says `shallow, read-only`. A full clone of somebody else's
repo cannot be told from one of yours: that is what the key is for.

**The brain is always managed**, shallow or not, and its entry cannot say
otherwise under any key:

```txt
.multivac/config.yml: repos.brain.managed: false — brain is the brain, and the brain is always managed; remove the key
```

Any value other than `true` or `false` is refused by name. A door or hooks
projected before a repo became read-only are left in place — removing them is a
write too.

### `authorities`

| | |
| --- | --- |
| type | list of strings |
| default | `[]` |
| example | `authorities: [published, specified, open]` |

The vocabulary your law table's `authority` column draws from — how hard a
claim binds, from "published to customers" down to "still an open question".

{{< callout type="warning" >}}
**Read but not yet enforced.** The loader parses and validates this key, and
nothing in the current build consumes it: no command rejects a row whose
authority is outside the list. Declare it as documentation for your team and
your agent; do not expect it to gate anything today.
{{< /callout >}}

### `blocking`

| | |
| --- | --- |
| type | list of anchor modes — from `present`, `absent`, `unique`, `count`, `each` |
| default | `[absent, count, each]` |
| example | `blocking: [absent, count, each, unique]` |

Which anchor modes make a broken leg exit 1 under the **default** policy.
A broken leg in any other mode is reported and exits 0 unless you pass
`--strict`. It decides legs only: the lines about the commit itself
(enactment, law removal, a config edit, code outside a change) and a stale pin
under `staleness: block` gate on their own terms.

**Without it:** tombstones (`absent`), counted claims (`count`) and
universals (`each`/`each!`) gate; presence and uniqueness report. That
asymmetry is the point — a rename should not kill your commit, but calling a
dead endpoint should.

You may widen the set. You may not narrow it below the tombstone:

```txt
$ mvac verify
.multivac/config.yml: "blocking" must include "absent" — the tombstone always blocks; add it back
```

An unknown mode is refused with the allowed list:

```txt
.multivac/config.yml: "blocking" has unknown mode "sometimes" — allowed: present, absent, unique, count, each
```

### `staleness`

| | |
| --- | --- |
| type | `report` or `block` |
| default | `report` |
| example | `staleness: block` |

What happens when a consumer repo's pinned brain mount is behind the declared
`channel`. `report` prints the line and exits 0; `block` makes it a verify
failure.

**Without it:** stale pins are reported, never gating. Under `block`, a stale
pin exits 1, and its line carries the `git submodule update --remote` that
moves the pin — but a channel ref that does not resolve locally, or a pin whose
commit the brain checkout lacks (the line reads `pin ? behind`), still only
reports, because offline never guesses and never gates:

```txt
  stale?    api: channel origin/main unknown locally — reported only, cannot gate offline; `multivac repos sync` fetches it
```

A pin **ahead** of the channel is not stale and never gates. Any other value of
the key is refused:

```txt
.multivac/config.yml: "staleness" must be "report" or "block" — block makes a stale pin exit 1
```

### `strict_pre_push`

| | |
| --- | --- |
| type | boolean |
| default | `false` |
| example | `strict_pre_push: true` |

Whether `doors` writes the pre-push shim as `mvac verify --strict` instead of
`mvac verify`.

**Without it:** every hook shim runs `mvac verify`. Turning it on leaves
commits and merges on it and makes a push also gate on a broken leg in any
mode, presence and uniqueness included, and on a finished change nobody has
closed — the last hop out of the machine held to a harder bar than a commit
anyone can still amend. It only takes effect the next time `doors` (or
`init`) rewrites the shims. See [Hooks](../hooks).

### `channel`

| | |
| --- | --- |
| type | string — a git ref |
| default | unset for pin staleness; **`origin/main`** for what a brain-scoped `verify` reads |
| example | `channel: origin/main` |

**The ecosystem as published.** Per-repo `repos.<key>.channel` overrides it.
The key answers two questions:

1. **Which bytes a brain-scoped `verify` judges**. Every declared repo is read
   at its channel ref — resolved *in that repo* — not at its working tree, so a
   sibling parked on a WIP branch never reddens the brain's law. The brain's own
   repo is the exception: always its working tree, because that is the commit
   the run gates. Undeclared, this defaults to `origin/main`; a ref that does
   not resolve there falls back to the working tree and says so on that repo's
   `read` line. `--worktree` forces the working-tree read across the whole
   ecosystem. The ref is a **local** remote-tracking snapshot — `verify` never
   fetches — so the `read` line also names how old it is; `mvac repos sync` is
   what refreshes it.
2. **What each consumer's brain-mount pin is compared against**, resolved
   **in the brain checkout**. This one has no default: undeclared, `verify`
   skips the staleness check for that repo entirely — there is nothing to
   compare to. `doctor` falls back to the brain's remote-tracking branch if
   there is one, and otherwise says what to add:

```txt
pins       api: pin 8f2a1cc — no channel ref to compare; set channel: in .multivac/config.yml
```

`doctor` also names the branch each repo is parked on and whether it is that
repo's channel — the line that explains a `verify` result at a glance:

```txt
branches   api: on wip/refactor @ 4d5e6f7 — OFF channel origin/main @ 1a2b3c4; verify reads the channel, not this tree
```

### `mount`

| | |
| --- | --- |
| type | string — a repo-relative directory |
| default | `.brain` |
| example | `mount: docs/brain` |

Where each consumer repo mounts the brain, as a git submodule. Both the
staleness check and `doctor`'s `pins` line read the gitlink at this path.
`multivac repos sync` creates it, from [`brain_url`](#brain_url).

**Without it:** `.brain`, which is also the name `verify` prefers when it
runs from a consumer repo and has to find the brain. If a repo has no gitlink
there:

```txt
pins       api: no brain mount at .brain — run `multivac repos sync` to add it
```

### `brain_url`

| | |
| --- | --- |
| type | string — a git url |
| default | none |
| example | `brain_url: git@github.com:acme/brain.git` |

The address other people clone the brain from. `multivac repos sync` writes it
into each consumer's `.gitmodules` when it mounts the brain there, so it has to
be the url **everyone** can reach, not the one on your machine.

**Hand-authored — the tool never writes this field**, and never works it out
from `git remote get-url origin`. A brain's own origin is often a local ssh
alias (`git@work-github:acme/brain.git`), and a guess would land in every
consumer's `.gitmodules`, broken for everybody else. `multivac init` writes the
key commented out, with the origin it found as a suggestion:

```yaml
# brain_url: git@work-github:acme/brain.git   # the URL others clone the brain from — uncomment to let `repos sync` mount it
```

Read it, fix it if it is an alias, and uncomment it. A blank value
(`brain_url: ""`) is refused when the config loads: state the URL or remove the
key.

**Without it:** `repos sync` mounts nothing, and says so once:

```txt
no brain_url in .multivac/config.yml — multivac will not guess it from a git remote; add the URL other people clone the brain from, then re-run `multivac repos sync`
```

A url git refuses is reported by cause. That includes a local path: git blocks
the `file` transport for submodules, and multivac does not switch that
protection off in your repos.

### `requires`

The minimum multivac this team will trust. **Hand-authored — the tool never
writes this field**, because a floor is a decision and multivac does not answer
for a human's decisions.

```yaml
requires: ">=X.Y.Z"
```

Grammar is `>=X.Y.Z` and nothing else. A floor gets a floor's grammar: `^0.3` or
`>=0.3 <1` needs a semver range parser, which would be a fourth runtime
dependency, and the law pins the count at three. A malformed value is
**refused by name**, not ignored — silently dropping it would leave you
believing a gate is declared that is not.

A binary below the floor gets the loudest notice on every run and is **not
refused**. Nothing here changes an exit code: enforcement degrades, it never
locks you out.

### `repos`

| | |
| --- | --- |
| type | mapping of key → path string, or key → `{ path, url, sdd, channel, role, managed }` |
| default | `{}` |
| example | see below |

The ecosystem. Every anchor's `<repo>` prefix is one of these keys — plus two
built-ins you do not declare: `brain` (the brain itself) and `*` (every
declared repo plus the brain).

```yaml
repos:
  api: ../acme-api                     # bare string = { path: ../acme-api }
  payments:
    url: git@example.com:acme/payments.git
    path: ../payments                  # optional; defaults to ../<key>
    sdd: none                          # the one value a repo's sdd: takes — its code is not gated
    channel: origin/release            # overrides the global channel
  ledger:
    path: ../ledger
    managed: false                     # another team's: read and verified, never written
```

**`sdd:` per repo.** The SDD lives in the brain alone: it is installed there,
its steps print there, and its gates read the brain and the change's worktrees —
the brain checkout alone for a step printed at `change land`.
No code repo is scaffolded, gated on a project document, or given the SDD's
steps in its door. What the brain's SDD does reach is every declared repo's
CODE: it lands only on the branch of an open change (see
[Code lands in a change](../commands#code-lands-in-a-change)). A repo whose code
should not be held to that says so in its own entry, with the one value a
repo's `sdd:` takes:

```yaml
repos:
  landing:
    path: ../acme-landing
    sdd: none
```

`none` is out of scope, not a gap: that repo's code is not gated, `doctor`
names it as exempt, and it is never reported as lacking anything. An absent
`sdd:` means the brain's SDD governs the repo's code — it does not mean none. A
tool name there is refused when the config loads.

**The brain's own entry.** Without an entry at path `.`, the brain holds no
code. Add `brain: .` — inside a change, once the config is committed — when the
brain starts holding code; `init` writes it into a config it creates when the
repo it scaffolds holds any file of its own, a README, a LICENSE or a
`.gitignore` included — files git ignores do not count, and a config `init`
keeps is not touched. For the SDD, the brain's entry may repeat the top-level
tool or declare one where the top level has none; a different tool, or `none`
under a top-level tool, is refused:

```yaml
sdd: speckit
repos:
  brain:
    path: .
    sdd: speckit                       # repeats the top-level tool
  api: ../acme-api
```

With `sdd: speckit` at the top level and `landing` declaring `sdd: none`,
`doctor` reports the SDD for the brain and names whose code it governs. A repo
an earlier release equipped with the SDD keeps that install until someone
removes it; `doctor` names it with the removal and never fails over it:

```txt
sdd        speckit @ brain: installed · binary ok · sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts
sdd        speckit governs the code of api — its steps run in the brain; exempt (sdd: none): landing
sdd        leftover speckit install @ api: .specify/integration.json (tracked) — delete .specify/ there; `specify integration uninstall <key>` removes its skills and leaves .specify/
```

Paths are resolved relative to the brain directory. An entry with only a
`url` is legal — the repo is declared before it is cloned, and its anchors
report `unevaluated` rather than red:

```txt
  unevaluated INV-04 [present] .multivac/invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it
```

**Without it:** nothing to verify against except the `brain` handle itself.
`doctor` says so:

```txt
repos      none declared — add repos: to .multivac/config.yml
```

`seed` writes the same finding into its report — *No repos declared — add
them under `repos:` in `.multivac/config.yml`* — and `doors` projects into the
brain alone: its door, its git hook shims and `.multivac/flow.md`.

`*` is reserved outright — it already means "every repo" in an anchor leg:

```txt
.multivac/config.yml: repos."*" is a reserved key — "*" means every repo in anchor legs; rename the repo
```

`brain` has exactly one legal meaning: `brain: .`, the brain==code
declaration `init` writes when the brain is its own code repo. Pointed
anywhere else it would let a consumer-scoped `verify` evaluate the brain's
own anchors against a consumer checkout, so it is refused:

```txt
.multivac/config.yml: repos.brain must be the brain itself (path .) — it is "../elsewhere"; rename the repo
```

An entry with neither `path` nor `url` cannot be located:

```txt
.multivac/config.yml: repos.api needs "path" or "url" — add path: ../api
```

## Errors are exit 2

A config that does not load is an environment error, not a failed check.
Every command that reads it exits **2** and prints one line naming the key
and the repair. `doors`, `doctor` and `init` are the exceptions and exit 1:
for `doors` and `doctor` an unloadable config is the diagnosis they were asked
for, and `init` stops rather than re-render every projection from a config it
could not read. Bare `roadmap` never reads it and `roadmap add` reads it only to
check the slug, so both carry on and exit 0 when it does not load or is missing;
only `roadmap sync` exits 2.

```txt
$ mvac verify
.multivac/config.yml: top level must be a mapping of keys, not a list or scalar
```

```txt
$ mvac verify
no .multivac/config.yml in /private/tmp — run `multivac init .` to create it
```

The `init` advice is given only where no brain holds the directory — `init`
itself does not look upward, so run below a brain it scaffolds a second one
there. Below a brain the refusal names that brain instead, and `verify`, which
reads the checkout that holds where it is asked, says where it stands when
nothing governs it — see [Where a run roots](../commands#where-a-run-roots):

```txt
$ cd src && mvac repos sync
no .multivac/config.yml in /home/you/brain/src — it is inside the brain at /home/you/brain; run this there
$ cd ~/notes && mvac verify
/home/you/notes is inside /home/you, which no brain governs — nothing was verified
$ cd /tmp/scratch && mvac verify
/tmp/scratch is in no git repository — nothing was verified; the brain at /tmp/scratch/brain verifies from there
```

## `.multivac/projected.yml` — not config

A second file lives beside the config, and it is **not** yours to edit:

```yaml
# Written by multivac, never by hand.
# The version this brain was deliberately brought to — not whatever
# binary last touched it. `mvac doors --adopt` is what moves it.
version: X.Y.Z
```

It records the version this brain was **deliberately brought to** — not whatever
binary last touched it. `init` writes it; `mvac doors --adopt` moves it; nothing
else does. Bare `mvac doors` re-projects and leaves it alone on purpose, so the
notice survives a run you made for an unrelated reason.

Upgrading the binary does not upgrade a brain: `npm i -g multivac@latest`
replaces the projector, not the projections it already wrote. The record is what
lets every command tell you the two have drifted, and name the command that
closes it. It is **provenance, not integrity** — it says which version wrote
these files, never that they still are what was written.

## Layout

The config lives at `.multivac/config.yml`, and everything multivac keeps for
itself lives beside it: the law, the changes, the ritual, the gitignored cache
and worktrees, and the hook shims — unless the repo already claimed a hooks
directory, where they go instead (see [Hooks](../hooks)). The doors are the
exception, because they sit where harnesses look: `AGENTS.md` at the repo root,
plus the files `doors`
projects for each vendor you list (`CLAUDE.md`, `GEMINI.md`, `.claude/`,
`.github/copilot-instructions.md`). Your own content is never
under `.multivac/` — the line is the user's files versus multivac's artifacts.

```txt
AGENTS.md                  the door
.multivac/config.yml       this file
.multivac/invariants.md    the law table
.multivac/changes/         one file per ecosystem change
.multivac/ritual.md        the closing ceremony
.multivac/flow.md          what the declarations oblige; generated
.multivac/hooks/           pre-commit, pre-push and pre-merge-commit shims, unless the repo has its own hooks dir
.multivac/cache/           gitignored
.multivac/worktrees/       one checkout per repo a change names, from change apply until change close, gitignored
```

A brain that still keeps `invariants.md` or `changes/` at its root is the
pre-`.multivac/` layout: every command that loads the config refuses it and
names `multivac init .`, which migrates with `git mv` so history follows. It
never moves a file multivac did not write. When both copies exist and read as
multivac's own, those commands and `init .` refuse without offering the
migration: merge what you want from the root file into `.multivac/` by hand,
then delete the root one.
