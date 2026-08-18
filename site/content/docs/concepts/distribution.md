---
title: Distribution
weight: 6
---

The brain lists repos; repos point at the brain. One brain = one ecosystem.
Distribution is the reverse direction of the registry: how the brain reaches
every consumer repo, and how stale it is allowed to get.

## What the consumer door carries (MV-93)

The door written into each declared repo used to be four bullets: the law, the
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
- **the adapters that apply to this repo** — the SDD flow and the graph block,
  resolved with the tool that applies here, rendered by the same code that
  renders the brain's door so the two cannot drift.

The list describes what the ecosystem **declares**, not what this machine has
checked out: a door that changed with which repos happen to be cloned would
differ between two machines for reasons unrelated to the ecosystem, and the
door is committed. Rendering makes no filesystem check and no network call.

## The mount

Every code repo mounts the brain — default folder `.brain/`, configurable
per ecosystem. An agent entering a consumer repo finds the brain there, and
the consumer door tells it what binds and that the change may cross repos.

One exception, and it is the common one for a single project: when the brain
IS the code repo (`repos: { brain: . }`, see
[Getting started](../../guide/getting-started/)), there is nothing to mount
and nothing to pin. That repo keeps the brain door, and mount, pin and
staleness checks skip it entirely.

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

Offline by construction: staleness compares the pin against the locally
known remote-tracking ref — best-effort, no network — and the report carries
the last-fetch age. A channel ref that does not resolve locally stays a
report even under `block`: offline never guesses and never gates. Fetching
happens only in explicit operations (`repos sync`, `change plan/apply`),
never in `verify` or hooks.

## Doors

Two kinds of door, not the same file renamed:

- **Brain door** — how to work on the ecosystem from here: where every repo
  lives, the law, [the ritual](../the-change#the-ritual), the landing order.
- **Consumer door** — what is law in this repo, where the brain lives, and
  that the change may cross repos.

`multivac doors` generates both, under one rule: one canonical door,
`AGENTS.md`, projected to the rest —

- **symlink** when the format is identical (`CLAUDE.md`, `GEMINI.md`);
- **stub** when it isn't (Cursor wants `.cursor/rules/*.mdc` with
  frontmatter; a symlink can't add frontmatter);
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
consumer repo it writes the versioned `.multivac/hooks/` directory and
points `core.hooksPath` at it — the same git-hook shim as the brain's,
running `verify` scoped to that repo's anchors. With `strict_pre_push: true`
in config, the pre-push shim runs `verify --strict`; pre-commit stays on the
default policy either way. The breaking commits happen
in the code repos, so "everything that commits" includes them. `doors`
writes working trees only, never commits on its own; absent repos are
skipped and reported.

## The managed block

`init` and `doors` never clobber an existing door. Everything multivac
writes into a pre-existing file lives between two markers:

```
<!-- multivac:begin -->
…generated content…
<!-- multivac:end -->
```

The rest of the file is the user's. Regeneration replaces only the block; a
missing file is created whole, with the block. Consumer repos arrive with
rich hand-written `AGENTS.md` files, and a tool that overwrites them loses
the adoption argument in the first minute.

## Skills: the third artifact class

What multivac installs into a repo splits by when the agent reads it:

| class | loaded | carries |
| --- | --- | --- |
| **door** | always — first read of the session | pointers + law: where the brain is, what binds, run `verify` |
| **hooks** | never read — they fire | enforcement: `pre-commit` / `pre-push`, harness hooks |
| **skill** | on demand | the operating manual |

The skill carries everything procedural the door must not: how to write an
anchor, the change lifecycle, the retire procedure, seed validation, and the
interview protocol. The door stays ~60 lines precisely because the manual
moved out of it. The interview shipping as a skill run by the user's own
agent is the same no-embedded-LLM rule as everywhere else: multivac
validates and files the output; it never calls a model itself.

Doors, hooks, and skills live in one tool-shipped targets registry.
`.multivac/config.yml` never defines targets; it only selects them by name.
Adding a harness is an entry in the registry — an MR to multivac — not a
module. `doors` installs and updates skills under the same managed-block
rule where the target format allows.
