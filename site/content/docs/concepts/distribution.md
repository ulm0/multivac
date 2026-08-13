---
title: Distribution
weight: 5
---

The brain lists repos; repos point at the brain. One brain = one ecosystem.
Distribution is the reverse direction of the registry: how the brain reaches
every consumer repo, and how stale it is allowed to get.

## The mount

Every code repo mounts the brain — default folder `.brain/`, configurable
per ecosystem. An agent entering a consumer repo finds the brain there, and
the consumer door tells it what binds and that the change may cross repos.

## Pin + staleness

A pinned mount gives reproducible builds and stale docs. Always-latest gives
freshness and irreproducible builds. The tool doesn't choose:

> The pin stays, and `verify` reports when it is behind the declared channel
> (`channel:` in `.multivac/config.yml`, global or per repo). Reproducible
> *and* fresh, with the debt visible instead of silent.

Offline by construction: staleness compares the pin against the locally
known remote-tracking ref — best-effort, no network — and the report carries
the last-fetch age:

```txt
stale     api: pin 35 behind origin/main · last fetch 6d ago — run `multivac repos sync`
```
Fetching happens only in explicit operations (`repos sync`,
`change plan/apply`), never in `verify` or hooks.

## Doors

Two kinds of door, not the same file renamed:

- **Brain door** — how to work on the ecosystem from here: where every repo
  lives, the ritual, the law, the landing order.
- **Consumer door** — what is law in this repo, where the brain lives, and
  that the change may cross repos.

`multivac doors` generates both, under one rule: one canonical door,
`AGENTS.md`, projected to the rest —

- **symlink** when the format is identical (`CLAUDE.md`);
- **three-line stub** when it isn't (Cursor wants `.cursor/rules/*.mdc` with
  frontmatter; a symlink can't add frontmatter);
- `--no-symlink` for Windows.

Still a single source; only the projection varies. The default is no
projection at all: `AGENTS.md` alone, already read by most harnesses —
`doors: [agents, claude]` in config is what adds the symlink.

`doors` also installs the enforcement floor where it projects: in each
consumer repo it writes the versioned `.multivac/hooks/` directory and
points `core.hooksPath` at it — the same git-hook shim as the brain's,
running `verify` scoped to that repo's anchors. The breaking commits happen
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
