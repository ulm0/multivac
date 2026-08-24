# Graph Report - site  (2026-08-24)

## Corpus Check
- 25 files · ~46,314 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 202 nodes · 195 edges · 23 communities (22 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2f5d2d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Top-level keys
- docs/_index.md
- SDD adapters
- the-change.md
- commands.md
- integrations.md
- hooks.md
- Existing ecosystem: seed → questions → interview → law
- `change <sub> <slug> [args]`
- claims-and-anchors.md
- writing-anchors.md
- install.md
- distribution.md
- invariants.md
- `verify [dir] [--strict] [--check] [--worktree] [--repo <key>]`
- adoption.md
- composition.md
- gitlab.com/ulm0/multivac/site

## God Nodes (most connected - your core abstractions)
1. `Top-level keys` - 17 edges
2. `SDD adapters` - 9 edges
3. `Existing ecosystem: seed → questions → interview → law` - 8 edges
4. ``verify [dir] [--strict] [--check] [--worktree] [--repo <key>]`` - 7 edges
5. ``change <sub> <slug> [args]`` - 6 edges
6. ``roadmap [add <slug> "<title>"] [--horizon now|next|later]`` - 4 edges
7. `Graphers` - 4 edges
8. `Git hooks — the universal floor` - 4 edges
9. ``close`` - 3 edges
10. `The agent proposes; the human enacts` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (23 total, 1 thin omitted)

### Community 0 - "Top-level keys"
Cohesion: 0.09
Nodes (21): `authorities`, `blocking`, Changing it needs an open change (MV-97), `channel`, `doors`, Errors are exit 2, `grapher`, `grapher_auto` (+13 more)

### Community 1 - "docs/_index.md"
Cohesion: 0.10
Nodes (16): Enforcement: the ladder, Entry from anywhere, one protocol, The session is home, Three layers, A paraphrase ages silently, The ritual, Three layers, and which of them a machine can write, What follows from all this (+8 more)

### Community 2 - "SDD adapters"
Cohesion: 0.11
Nodes (18): A declared grapher obliges something (MV-90), And it is part of the repository (MV-103), Artifact ≠ binary, Automatic refresh, Detection at init, Each tool's own flow, not a fixed triple, Existence is the weakest proof, Graphers (+10 more)

### Community 3 - "the-change.md"
Cohesion: 0.12
Nodes (15): Done when its anchors resolve, Four declared fields, Greenfield, Planned — a change that has not started (MV-89), The change file, The ritual, The ritual arrives with candidates (MV-98), The subcommands (+7 more)

### Community 4 - "commands.md"
Cohesion: 0.13
Nodes (14): `add <slug> "<title>" [--horizon now|next|later]`, `count '<repo>:<glob> [!<glob> ...] /<regex>/[i]' [dir]`, `doctor [--strict]`, `doors`, Exit codes, `help [topic|command]`, `init [dir] [--provider a,b] [--sdd name] [--grapher name] [--quiet]`, `.multivac/flow.md` — what your declarations oblige (MV-96) (+6 more)

### Community 5 - "integrations.md"
Cohesion: 0.15
Nodes (12): `agents`, `claude`, `codex`, `copilot`, `cursor`, Detection, `gemini`, `opencode` (+4 more)

### Community 6 - "hooks.md"
Cohesion: 0.18
Nodes (10): A repo that already has hooks, Git hooks — the universal floor, Harness hooks — the early ceiling, Installed is not enforcing, Nothing here commits, Recommended ladder, What blocks and what informs, What "preserving" means here (+2 more)

### Community 7 - "Existing ecosystem: seed → questions → interview → law"
Cohesion: 0.20
Nodes (9): 1. Seed, 2. Read by category, not by repo, 3. Take the open questions to a human, 4. Draft the map and the proposed law, 5. File everything as `proposed`, 6. Validate in blast-radius batches, 7. Project the doors, Existing ecosystem: seed → questions → interview → law (+1 more)

### Community 8 - "`change <sub> <slug> [args]`"
Cohesion: 0.20
Nodes (10): A brain behind its channel (MV-94), `--abandon`, `apply`, `change <sub> <slug> [args]`, `close`, `land`, `new`, `plan` (+2 more)

### Community 9 - "claims-and-anchors.md"
Cohesion: 0.22
Nodes (8): Anchor to contracts, not implementations, Asymmetric severity, Coverage, not completeness, Five modes, one mechanism, Legs, Matching rules, Self-healing, states, exit codes, The anchor

### Community 10 - "writing-anchors.md"
Cohesion: 0.22
Nodes (8): Before committing an anchor: two self-checks, Choosing the mode, Dialect: POSIX ERE, enforced, Grammar, Matching rules you must know, Not everything anchors, The legs pattern, The universal: `each` and `each!`

### Community 11 - "install.md"
Cohesion: 0.25
Nodes (7): Check it, Every machine needs its own runner, Next, Or from source, Requirements, Try it, then keep it, Two names, one binary

### Community 12 - "distribution.md"
Cohesion: 0.29
Nodes (6): Doors, Pin + staleness, Skills: the third artifact class, The managed block, The mount, What the consumer door carries (MV-93)

### Community 13 - "invariants.md"
Cohesion: 0.29
Nodes (6): Amend, IDs, Retire, That rule is ungateable, and MV-81 says so, The agent proposes; the human enacts, Three birth paths, one table

### Community 14 - "`verify [dir] [--strict] [--check] [--worktree] [--repo <key>]`"
Cohesion: 0.29
Nodes (7): `drift`: a recorded finding that does not gate, From a consumer repo, Pin staleness, Self-healing, The exit matrix, `verify [dir] [--strict] [--check] [--worktree] [--repo <key>]`, What each run reads (MV-53)

### Community 15 - "adoption.md"
Cohesion: 0.33
Nodes (5): Next, The arc, What changes per case, and what does not, What each phase buys, Where you start

### Community 16 - "composition.md"
Cohesion: 0.33
Nodes (5): Neither is required, Next, Not competing is a rule here, not a posture, Why a grapher helps, Why an SDD tool is recommended

## Knowledge Gaps
- **160 isolated node(s):** `gitlab.com/ulm0/multivac/site`, `The four jobs`, `Three sections, and the changelog`, `Where to start`, `The arc` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does ``change <sub> <slug> [args]`` connect ``change <sub> <slug> [args]`` to `commands.md`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `gitlab.com/ulm0/multivac/site`, `The four jobs`, `Three sections, and the changelog` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Top-level keys` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `docs/_index.md` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `SDD adapters` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `the-change.md` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `commands.md` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._