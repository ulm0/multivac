---
title: Configuration
weight: 2
---

One file: `.multivac/config.yml`, in the brain. It is a **registry, not a
plugin system** — it selects entries the tool already ships, by name, and
declares where the repos are. It never defines behaviour.

`init` writes it. Every key below is optional; a file containing nothing but
`{}` loads with every default applied. Every validation error names the key
and the fix.

What `init` writes with no flags:

```yaml
# multivac configuration — seeded by `multivac init`.
# Edit directly; adopting a new agent later is one line here + `multivac doors`.
doors: [agents]
# repos:
#   backend: ../backend   # bare string = { path }
```

A filled-in one:

```yaml
doors:   [agents, claude, cursor]
sdd:     opsx
grapher: graphify
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
    grapher: codegraph
    channel: origin/release
```

## Top-level keys

### `doors`

| | |
| --- | --- |
| type | list of strings — registry target names |
| default | `[]` |
| example | `doors: [agents, claude, cursor]` |

Which harness door targets `doors` projects, and which ones `doctor` reports
on. Names must exist in the shipped registry; see
[Agent integrations](../integrations) for the nine entries.

**Without it:** `doors` still writes the canonical `AGENTS.md` into the brain
and every present repo, because that write is unconditional — but no symlink,
no stub, no skill, no harness hook is installed for any vendor. `doctor` says
so:

```txt
doors      none declared — add doors: [agents] to .multivac/config.yml
```

An unknown name is a notice from `doors` and a line from `doctor`, never a
crash:

```txt
doors      nope: unknown target — known: agents, claude, cursor, opencode, codex, windsurf, gemini, copilot, aider; fix doors: in .multivac/config.yml
```

### `sdd`

| | |
| --- | --- |
| type | string — one of `opsx`, `speckit` |
| default | unset |
| example | `sdd: opsx` |

Selects the spec-driven-development adapter whose `propose` / `apply` /
`archive` steps run inside the change lifecycle. See
[Graphers and SDD](../graphers-and-sdd).

**Without it:** silence. No SDD step runs, `doctor` prints no `sdd` line at
all. Not declaring is different from declaring something absent — the first
is "we do not use one", the second is "we use one, it is not on this
machine".

### `sdd_auto`

| | |
| --- | --- |
| type | boolean |
| default | `true` |
| example | `sdd_auto: false` |

Whether the declared `sdd` adapter runs automatically at `change new`,
`change apply` and `change close`.

**Without it:** the workflow is automatic. Set it to `false` to keep the
adapter declared — `doctor` still reports it — while running its steps by
hand:

```txt
sdd        opsx: artifact ok · binary ok · sdd_auto: false — workflow manual
```

`--no-sdd` on a single `change` invocation does the same thing once, without
editing the config.

### `grapher`

| | |
| --- | --- |
| type | string — any tool name |
| default | unset |
| example | `grapher: graphify` |

The code-graph tool for the brain, and the fallback for every repo that does
not override it. The name must be one multivac **speaks** — `graphify` or
`codegraph` — or one you declare yourself under [`graphers`](#graphers).
multivac never derives an artifact path or a refresh command from a name,
because inventing either is inventing a fact.

Two, deliberately. Speaking a grapher means knowing what it can *answer*, so
the brain door can tell an agent which verb to reach for; that is earned one
tool at a time, not scaled by adding rows. Any other tool still works through
[`graphers`](#graphers) with no merge request against multivac — it simply
gets no query lines in the door, because multivac does not know its verbs.

**Without it:** no `grapher` lines in `doctor`, no refresh hint at the end of
`change close`. A newborn brain is two content files; graphing that is noise,
which is why `init` declares no grapher unless it detects one.

### `graphers`

| | |
| --- | --- |
| type | mapping of name -> `{ artifact, refresh, create?, binary?, install? }` |
| default | `{}` |
| example | see below |

Contracts for graphers the shipped registry has not verified. This is what
makes an unverified tool usable **without a merge request against multivac**:

```yaml
grapher: mytool
graphers:
  mytool:
    artifact: .mytool/index.db   # repo-relative path the tool writes, file or directory
    refresh: mytool index        # the one command safe to re-run
    create: mytool init          # optional, when the build differs from the refresh
    binary: mytool               # optional, defaults to the first word of refresh
    install: pipx install mytool # optional, printed when the binary is missing
```

`artifact` and `refresh` are required. A declaration also overrides a shipped
registry entry — you know your own install better than the table does.

**Without it:** a `grapher:` naming an unverified tool is reported as
unverified, with these exact fields to fill in, and nothing is run.

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
Everything else is reported and exits 0 unless you pass `--strict`.

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

**Without it:** stale pins are reported, never gating. Under `block`, a
resolvable stale pin exits 1 with the sync command in the line — but a
channel ref that does not resolve locally still only reports, because offline
never guesses and never gates:

```txt
  stale?    api: channel origin/main unknown locally — reported only, cannot gate offline; `multivac repos sync` fetches it
```

A pin **ahead** of the channel is not stale and never gates.

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

**Without it:** both hooks run the default policy. Turning it on keeps
commits permissive and makes a push gate on the presence and uniqueness legs
as well — the last hop out of the machine held to a harder bar than a commit
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

1. **Which bytes a brain-scoped `verify` judges** (MV-53). Every declared
   repo is read at its channel ref — resolved *in that repo* — not at its
   working tree, so a sibling parked on a WIP branch never reddens the
   brain's law. The brain's own repo is the exception: always its working
   tree, because that is the commit the run gates. Undeclared, this defaults
   to `origin/main`; a ref that does not resolve there falls back to the
   working tree and says so on that repo's `read` line. `--worktree` forces
   the working-tree read across the whole ecosystem. The ref is a **local**
   remote-tracking snapshot — `verify` never fetches — so the `read` line also
   names how old it is; `mvac repos sync` is what refreshes it.
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

**Without it:** `.brain`, which is also the name `verify` prefers when it
runs from a consumer repo and has to find the brain. If a repo has no gitlink
there:

```txt
pins       api: no brain mount at .brain — add the brain as a gitlink (git submodule add <brain-url> .brain)
```

### `repos`

| | |
| --- | --- |
| type | mapping of key → path string, or key → `{ path, url, grapher, channel }` |
| default | `{}` |
| example | see below |

The ecosystem. Every anchor's `<repo>` prefix is one of these keys — plus two
built-ins you do not declare: `brain` (the brain itself) and `*` (every
declared repo).

```yaml
repos:
  api: ../acme-api                     # bare string = { path: ../acme-api }
  payments:
    url: git@example.com:acme/payments.git
    path: ../payments                  # optional; defaults to ../<key>
    grapher: codegraph                 # overrides the global grapher
    channel: origin/release            # overrides the global channel
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
them under `repos:` in `.multivac/config.yml`* — and `doors` just writes the
brain's own door and stops.

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
and the repair. `doors` and `doctor` are the two exceptions and exit 1: for
those an unloadable config is the diagnosis they were asked for, not an
environment they failed to read.

```txt
$ mvac verify
.multivac/config.yml: top level must be a mapping of keys, not a list or scalar
```

```txt
$ mvac verify
no .multivac/config.yml in /private/tmp — run `multivac init .` to create it
```

## Layout

The config lives at `.multivac/config.yml`, and everything else multivac
creates lives beside it: the law, the changes, the ritual, the hooks, the
gitignored cache and worktrees. `AGENTS.md` at the repo root is the one
exception, because that is where harnesses look. Your own content is never
under `.multivac/` — the line is the user's files versus multivac's artifacts.

```txt
AGENTS.md                  the door
.multivac/config.yml       this file
.multivac/invariants.md    the law table
.multivac/changes/         one file per ecosystem change
.multivac/ritual.md        the closing ceremony
.multivac/hooks/           pre-commit and pre-push shims
.multivac/cache/           gitignored
.multivac/worktrees/       one checkout per open change, gitignored
```

A brain that still keeps `invariants.md` or `changes/` at its root is the
pre-`.multivac/` layout: every command refuses it and names `multivac init .`,
which migrates with `git mv` so history follows. It never moves a file
multivac did not write.
