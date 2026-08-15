---
title: Graphers and SDD
weight: 4
---

Two kinds of foreign tool, one contract. A **grapher** builds the map layer —
what exists, what calls what — which is the one layer a machine can derive
well. An **SDD** tool (spec-driven development) runs its own propose / apply /
archive workflow alongside multivac's change lifecycle.

multivac never installs either one. It reads what they leave on disk and, when
you ask, invokes what they put on `PATH`.

```yaml
sdd:     opsx
grapher: graphify
```

Like door targets, adapters are **data in a shipped registry**, not modules.
Your config selects them by name; adding one is a merge request to multivac.

## Artifact ≠ binary

This is the distinction the whole design turns on. Each adapter declares two
capabilities, and only the missing half turns off:

| capability | means | needs |
| --- | --- | --- |
| **read** | multivac can consume what the tool produced | the **artifact** on disk |
| **run** | multivac can invoke the tool | the **binary** on `PATH` |

| adapter | artifact | binary | refresh |
| --- | --- | --- | --- |
| `opsx` | `openspec/specs`, `openspec/changes` | `openspec` | `openspec update` |
| `speckit` | `.specify` | `specify` | `specify check` |
| `graphify` | `graphify-out/graph.json` | `graphify` | `graphify update .` |
| `codegraph` | `.codegraph` | `codegraph` | `codegraph sync` (build: `codegraph init`) |
| *any other grapher* | `<name>-out/graph.json` | `<name>` | `<name> update .` |

If you cloned a repo that already has the artifact committed, the read half
works with the tool not installed at all. The binary is only needed to
*invoke* — and that is the line multivac never crosses: it reads foreign
artifacts and invokes declared binaries, but it never installs foreign
software.

Declared repos are the exception, because they are the tool's own data:
`repos sync` clones them, on explicit request.

## The three-state policy

| state | behaviour |
| --- | --- |
| **not declared** | nothing. Not even a notice. `doctor` prints no line for it. |
| **declared, nothing present** | notice, feature off, **exit 0** |
| **declared, artifact or binary present** | adapter active |

Declaring means "this project uses it" — which stays true on a machine that
does not have it yet. `mvac init . --sdd speckit` writes the config whether or
not `specify` exists. **No absent adapter ever turns `verify` red.**

That is why not-declared and declared-but-absent are different states: the
first is "we do not use one", the second is "we use one, it is not here", and
only the second deserves a line telling you how to get it.

## Graphers

Declare one globally, or per repo:

```yaml
grapher: graphify
repos:
  api: ../acme-api
  legacy:
    path: ../legacy
    grapher: codegraph     # this repo uses a different tool
```

`doctor` reports one line per scope — the brain, plus every present repo:

```txt
grapher    graphify @ brain: artifact ok · binary ok · fresh
grapher    graphify @ api: artifact missing → run `graphify update .` there
```

Every degraded shape is a pointer with the exact command:

```txt
grapher    nograph @ brain: artifact missing · binary missing → npm i -g nograph, then `nograph update .`
grapher    nograph @ brain: artifact ok · binary missing → npm i -g nograph (graph cannot refresh)
grapher    graphify @ brain: artifact ok · binary ok · graph STALE (older than last commit) → run `graphify update .` there
```

Stale means the artifact's mtime is older than the repo's last commit — the
graph describes code that has since moved. It is a `doctor` warning and never
a `verify` failure.

### The generic contract

Graphers are **not** an enumerated list. An unknown name still works, because
the spec is derived from the name:

- artifact `<name>-out/graph.json`
- binary `<name>`
- install hint `npm i -g <name>`
- refresh `<name> update .`

Two names carry verified overrides where the vendor's own docs disagree.
`graphify` matches the generic contract exactly. `codegraph` indexes into
`.codegraph/` rather than `<name>-out/`, and splits build from refresh —
`codegraph init` builds it, `codegraph sync` refreshes it — which is why
`doctor` names the right one for the situation:

```txt
grapher    codegraph @ brain: artifact missing → run `codegraph init` there
```

### Automatic refresh

The grapher's automation contract is `grapher-refresh`: at the end of
`change close`, multivac **runs** the refresh command — in the brain and in
each declared+present repo the change touched, using that scope's grapher
(`repos.<key>.grapher`, falling back to the global one) — and reports each
scope's result:

```txt
graph graphify @ brain: refreshed (`graphify update .`) — artifact left uncommitted
graph graphify @ api: refreshed (`graphify update .`) — artifact left uncommitted
```

The git hook shims run `verify` only — there is no refresh on the hook path.
Between closes, a stale graph next to a present binary is a `doctor` warning
carrying the manual command.

An absent binary degrades to a notice with the install hint; a refresh that
exits non-zero is a warning that hands the command back — `close` never fails
because a foreign tool did:

```txt
graph graphify @ brain: binary not found — refresh skipped; npm i -g graphify, then `graphify update .` there
graph graphify @ api: refresh failed (…) — run `graphify update .` there by hand
```

multivac never stages or commits the refreshed artifact. Graph output is
regenerated locally; commit it only in dedicated chore commits, if your
project commits it at all.

No grapher is declared by default. A newborn brain is two content files, and a
graph of that is noise.

## SDD adapters

Two entries, selected by the registry key — which is multivac's name for the
adapter, not necessarily the tool's own binary name:

| key | tool | binary | install |
| --- | --- | --- | --- |
| `opsx` | OpenSpec | `openspec` | `npm i -g @fission-ai/openspec` |
| `speckit` | GitHub Spec Kit | `specify` | `uv tool install specify-cli` |

```txt
$ mvac doctor
sdd        opsx: artifact ok · binary ok · sdd_auto on — change new/apply/close print the agent step
sdd        opsx agent steps — propose: run /opsx:propose <slug> in your agent to draft the spec change · apply: run /opsx:apply <slug> in your agent to implement the proposed tasks · archive: run /opsx:archive <slug> in your agent to update the specs and archive the change
```

```txt
sdd        nope: unknown adapter — known: opsx, speckit; fix sdd: in .multivac/config.yml
```

{{< callout >}}
For OpenSpec, the terminal CLI is `init` / `update` / `list` / `show` /
`validate`; `propose`, `apply` and `archive` are the `/opsx:` commands your
agent runs in chat. That is why multivac never shells the steps out: it prints
the instruction and the agent runs it.
{{< /callout >}}

### The steps instruct the agent

An SDD's propose/apply/archive steps are **chat commands the agent runs**, not
terminal subcommands — invoking the binary with a step name would silently do
nothing. So the lifecycle emits the instruction at the right moment, worded
per tool in the shipped registry (`agentSteps`), with the slug interpolated:

| lifecycle step | prints |
| --- | --- |
| `change new <slug>` | `sdd opsx: run /opsx:propose <slug> in your agent to draft the spec change` |
| `change apply <slug>` | `sdd opsx: run /opsx:apply <slug> in your agent to implement the proposed tasks` |
| `change close <slug>` | `sdd opsx: run /opsx:archive <slug> in your agent to update the specs and archive the change` |

For `speckit` the flow is `/speckit.specify` at new, then `/speckit.plan`,
`/speckit.tasks` and `/speckit.implement` at apply — and **no archive step**,
because spec-kit has none; the lifecycle says so honestly instead of inventing
one:

```txt
sdd speckit: archive — this tool has no agent-run archive step; nothing to run
```

Each instruction is printed only when an `sdd` is declared **and** `sdd_auto`
is on **and** `--no-sdd` was not passed. The brain door carries the same flow,
so an agent knows it at session start. Nothing here needs the tool's binary —
the instruction is for the agent, not the shell.

### `sdd_auto` and `--no-sdd`

Two ways to opt out, at two scopes:

| | scope | effect |
| --- | --- | --- |
| `sdd_auto: false` in config | permanent | the adapter stays declared and reported; no instruction is ever printed |
| `--no-sdd` on a `change` invocation | this run | skips the printout once |

```txt
sdd        opsx: artifact missing (looked for openspec/specs, openspec/changes) · binary ok · sdd_auto: false — the lifecycle prints nothing; run the steps yourself
```

`doctor` keeps reporting the adapter either way. Turning automation off is not
the same as undeclaring it — you still want to know the artifact is there and
the binary is current.

## Detection at init

`init` proposes adapters it finds, commented out, never enabled:

| found on disk | proposed |
| --- | --- |
| `openspec/` | `sdd: opsx` |
| `.specify/` | `sdd: speckit` |
| `graphify-out/` | `grapher: graphify` |
| `.codegraph/` | `grapher: codegraph` |

```yaml
# detected graphify artifacts — uncomment to enable:
# grapher: graphify
```

Detect, then ask. A directory existing is evidence, not consent.
