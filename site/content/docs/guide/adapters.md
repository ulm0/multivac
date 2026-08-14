---
title: Adapters
weight: 6
---

multivac never installs anything, and no absent adapter turns `verify`
red. Adapters live in a registry shipped inside the multivac package —
door targets, skills, SDD and grapher adapters alike. Adding a harness or
a tool is an MR to multivac, an entry, not a module. Your
`.multivac/config.yml` never defines adapters; it only selects them by
name:

```yaml
doors:   [agents, claude, cursor]
sdd:     opsx
grapher: graphify
```

## Harness targets

One canonical door, `AGENTS.md`; the rest are projections. The default is
`doors: [agents]` — no projection at all, since `AGENTS.md` is already
read by Codex, opencode, Cursor, and Claude Code. A vendor target is
something you add.

| target | projection |
| --- | --- |
| `agents` | `AGENTS.md` itself — canonical, always present |
| `claude` | `CLAUDE.md` symlink to `AGENTS.md`, plus `.claude/settings.json` harness hooks (`mvac verify` on `SessionStart` and post-edit) and the multivac skill under `.claude/skills/multivac/` |
| `cursor` | `.cursor/rules/multivac.mdc` — a stub, not a symlink, because Cursor requires frontmatter |

The cursor stub in full:

```markdown
---
description: multivac door — ecosystem law, brain location
alwaysApply: true
---

<!-- multivac:begin -->
Read `AGENTS.md` at the repo root — the multivac door: what is law here, where the brain lives. Run `multivac verify` before you commit.
<!-- multivac:end -->
```

`doors --no-symlink` writes stubs instead of symlinks (Windows without
developer mode). Everything multivac writes into a pre-existing file lands
between `<!-- multivac:begin -->` and `<!-- multivac:end -->`; the rest of
the file is yours. Adopting a new harness later is one line in
`config.yml` plus `mvac doors` — never re-run init.

Three artifact classes, split by when the agent reads them:

| class | loaded | carries |
| --- | --- | --- |
| **door** | always — first read of the session | pointers + law: where the brain is, what binds, run `verify` |
| **hooks** | never read — they fire | enforcement: `pre-commit`/`pre-push`, harness hooks |
| **skill** | on demand | the operating manual: anchors, the change lifecycle, the interview |

## SDD automation

Known SDD adapters: `opsx` and `speckit`. Declaring one
(`sdd: opsx`) automates its workflow inside the change lifecycle —
`doctor` reports it:

```txt
sdd        opsx: artifact missing (looked for openspec/specs, openspec/changes) · binary ok · workflow automated in change lifecycle (sdd_auto)
```

`change new` runs the adapter's propose step for the new slug. Failure
degrades, never blocks:

```txt
$ mvac change new "sdd probe"
created .multivac/changes/sdd-probe.md — declare repos, landing_order, invariants, claims
sdd opsx: propose failed (Command failed: openspec propose sdd-probe) — run it by hand
```

Opting out is explicit: `sdd_auto: false` in `.multivac/config.yml`, or
`--no-sdd` on a single `change` invocation. A declared-but-absent binary
degrades as usual: notice, feature off, exit 0.

## Graphers and freshness

`grapher: graphify` — global, or per repo under `repos:`. `doctor` checks
artifact, binary, and freshness for the brain and every declared repo:

```txt
grapher    graphify @ brain: artifact ok · binary ok · fresh
grapher    graphify @ api: artifact missing → run `graphify update .` there
```

A stale or missing artifact next to a present binary is a doctor pointer,
never silence — and never a red verify. A newborn brain is two content
files; a graph of that is noise, so no grapher is declared by default.

## The three-state dependency policy

| state | behavior |
| --- | --- |
| declared and present | adapter active |
| declared and absent | notice, feature off, **exit 0** |
| not declared | nothing, not even a notice |

Declaring means "this project uses it" — true even if this machine doesn't
have it yet. `mvac init . --sdd speckit` with speckit absent writes the
config anyway. Adapters warn on format mismatch instead of crashing, and
keep working.

## Artifact ≠ binary

Almost no adapter needs the executable; it needs what the executable left
on disk. Each adapter declares two capabilities, `read` and `run`, and
only the missing half turns off.

| adapter | what multivac reads | binary needed? |
| --- | --- | --- |
| opsx | `openspec/specs/`, `openspec/changes/` | no |
| speckit | `.specify/` | no |
| graphify | `graphify-out/graph.json` | no |

If you cloned the repo, the `read` half works with the tool not installed.
The binary is only needed to invoke — `openspec propose`,
`graphify update`. That is the line multivac never crosses: it reads
foreign artifacts and invokes declared binaries, but it never installs
foreign software. Declared repos are different — they are the tool's own
data, and `repos sync` clones them on explicit request.
