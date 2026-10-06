---
title: Distribution
weight: 6
---

The brain lists repos; repos point at the brain. One brain = one ecosystem.
Distribution is the reverse direction of the registry: how the brain reaches
every consumer repo, and how stale it is allowed to get.

## What the consumer door carries

The door written into a consumer repo used to be four bullets: the law, the
mount refresh, "the change may cross repos", and "run verify". The brain's door
listed the ecosystem and carried the adapter blocks; this one carried neither —
and this is the door most sessions start from, because code is where work
happens.

It now carries:

- **the mount refresh, first**, with its reason. The pin stays where the last
  commit left it, so a present mount is not a current one. It is the only
  instruction in that door with an ordering requirement, and it used to be the
  second of four bullets.
- **the ecosystem list** — every declared repo with its path, the one you are in
  marked, a one-line `role` where the operator declared one, and `brain` named
  explicitly because that handle is usable in anchors and can never appear in a
  list built from `repos:`. Nothing is printed below two declared repos.
- **the adapter that applies to this repo** — one line, when an SDD governs it
  and `sdd_auto` is on, saying the brain's SDD runs in the brain checkout and
  where this repo's code belongs. The step list is the brain door's alone; no
  consumer door carries it.

The list describes what the ecosystem **declares**, not what this machine has
checked out: a door that changed with which repos happen to be cloned would
differ between two machines for reasons unrelated to the ecosystem, and the
door is committed. Rendering makes no filesystem check and no network call.

## The mount

Every code repo multivac manages mounts the brain — default folder `.brain/`,
configurable per ecosystem, as a git submodule that `repos sync` adds from
`brain_url` and leaves for you to commit. An agent entering a consumer repo
finds the brain there, and the consumer door tells it what binds and that the
change may cross repos.

Two exceptions. The common one for a single project: when the brain
IS the code repo (`repos: { brain: . }`, see
[Getting started](../../guide/getting-started/)), there is nothing to mount
and nothing to pin. That repo keeps the brain door, and mount, pin and
staleness checks skip it entirely. The other is a read-only repo
(`managed: false`, or a shallow clone): `repos sync` reports it as read-only
and adds no mount there.

## Pin + staleness

A pinned mount gives reproducible builds and stale docs. Always-latest gives
freshness and irreproducible builds. The tool doesn't choose:

> The pin stays, and `verify` checks it against the declared channel
> (`channel:` in `.multivac/config.yml`, global or per repo). Reproducible
> *and* fresh, with the debt visible instead of silent.

By default a stale pin **reports**. Set `staleness: block` and a pin behind
its channel becomes a blocking failure — exit 1, with the fix in the line:

```txt
  stale     api: pin 35 behind origin/main · last fetch 6d ago — blocking (staleness: block); git -C ../api submodule update --remote .brain
```

`change new`, `change apply` and `doctor` also report a pin behind its channel,
but only a `verify` run in the brain checkout can fail on one; a run from a
consumer repo, which is what that repo's hooks run, is scoped to that repo and
never compares a pin with its channel.

Offline by construction: staleness compares the pin against the locally
known remote-tracking ref — best-effort, no network — and the report carries
the last-fetch age. A channel ref that does not resolve locally stays a
report even under `block`: offline never guesses and never gates. Only
`repos sync` fetches git refs. `change plan` and `change apply` clone a repo
the change names that is absent and has a `url` (`apply` creates one without a
`url` from scratch), and refuse a read-only one (`managed: false`, or a shallow
clone) before cloning anything; a clone already there is never fetched, and
`verify` and hooks never fetch.

## Doors

Two kinds of door, not the same file renamed:

- **Brain door** — how to work on the ecosystem from here: where every repo
  lives, the law, how a change enters, [the ritual](../the-change#the-ritual),
  and the SDD's steps when one is declared.
- **Consumer door** — what is law in this repo, where the brain lives, and
  that the change may cross repos.

`multivac doors` generates both, under one rule: one canonical door,
`AGENTS.md`, projected to the rest —

- **symlink** when the format is identical (`CLAUDE.md`, `GEMINI.md`);
- **stub** when it isn't (Copilot's `.github/copilot-instructions.md`, a file
  you may already keep, gets a managed block pointing at `AGENTS.md`);
- **nothing at all** when the harness already reads `AGENTS.md` — a second
  file would be a paraphrase, which is the thing this tool exists to avoid.

Where a symlink is not permitted — Windows without developer mode — `doors`
says so and names the fallback instead of writing a broken link. Every
target and its projection:
[Agent integrations](../../reference/integrations).

Still a single source; only the projection varies. The default is no
projection at all: `AGENTS.md` alone, already read by most harnesses —
`doors: [agents, claude]` in config is what adds the symlink.

`doors` also installs the enforcement floor where it projects: in each
consumer repo it writes the same git-hook shims as the brain's, running
`verify` scoped to that repo's anchors. In a repo with no hook set-up they sit
in the versioned `.multivac/hooks/` directory with `core.hooksPath` pointed at
it (a hook already in `.git/hooks/` runs first). Where `core.hooksPath`
already names a directory, or `.husky/` is there with the path unset, the shims
go into that directory instead, wherever the hook name is free or holds an
earlier multivac shim, and `core.hooksPath` is left alone; a hook there that
does not run multivac is not touched, and `doors` prints the line to append to
it. With `strict_pre_push: true` in config, the pre-push shim runs
`verify --strict`; the other shims stay a plain `verify` either way. The
breaking commits happen in the code repos, so "everything that commits"
includes them. `doors` never commits on its own. A declared repo that is absent
is skipped and reported; a read-only one (`managed: false`, or a shallow clone)
gets no door, no shims and no `core.hooksPath`.

## The managed block

`init` and `doors` never clobber an existing door. Everything multivac
writes into a pre-existing door file lives between two markers:

```
<!-- multivac:begin -->
…generated content…
<!-- multivac:end -->
```

The rest of the file is the user's. Regeneration replaces only the block; a
missing file is created whole, with the block. Consumer repos arrive with
rich hand-written `AGENTS.md` files, and a tool that overwrites them loses
the adoption argument in the first minute. The harness hook config,
`.claude/settings.json`, takes no markers: multivac merges its `verify` hooks
into the JSON and keeps every key and hook it did not write, and it takes back
the post-edit graph refresh hooks an earlier multivac wrote, with a notice.

## Skills: the third artifact class

What multivac installs into a repo splits by when the agent reads it:

| class | loaded | carries |
| --- | --- | --- |
| **door** | always — first read of the session | pointers + law: where the brain is, what binds, run `verify` |
| **hooks** | fired, and read when they speak — a clean run is one quiet line, anything off prints in full | enforcement: the `pre-commit`, `pre-push` and `pre-merge-commit` shims, harness hooks |
| **skill** | on demand | the operating manual |

The skill carries what no command prints: how to judge an anchor, the
`moved` and `broken` forks, the retire procedure, seed validation, and the
interview protocol. For the rest it names the command or the door line that
prints it. The door stays short precisely because the manual moved out of it.
multivac installs the skill only for Claude Code, into the brain and every
code repo it manages; the empty brain's door still tells your agent to load
it. The interview shipping as a skill run by the user's own agent is the same
no-embedded-LLM rule as everywhere else: multivac validates and files the
output; it never calls a model itself.

Doors, harness hooks, and skills live in one tool-shipped targets registry.
`.multivac/config.yml` never defines targets; it only selects them by name.
Adding a harness is an entry in the registry — an MR to multivac — not a
module. `doors` mirrors the skill directory whole: whatever the source does
not ship is removed from the copy, a file you added there included.
