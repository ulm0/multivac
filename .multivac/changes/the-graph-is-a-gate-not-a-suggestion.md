---
slug: the-graph-is-a-gate-not-a-suggestion
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-87
  adds:
    - MV-90
  retires: []
claims:
  - id: MV-90
    statement: A declared grapher leaves a graph in every declared, present root or close refuses — the gate the SDD adapter has had since MV-56, applied to the adapter that never got one, with the same two switches and the same refusal shape.
---

# A declared grapher leaves a graph, or close refuses

Declaring `grapher: graphify` reads like a decision. It is closer to a wish.

The SDD adapter is gated at both ends: `change plan` refuses without the
spec, `change apply` refuses without the plan and the tasks, and each gate
names the artifact it looked for and the command that produces it. Declaring
an SDD tool therefore MEANS something — the lifecycle stops without it.

The grapher has no gate anywhere. `ensureGraphs` builds where a root has no
artifact, `refreshGraph` refreshes at close, and every failure path is a
notice that keeps going:

    graph graphify @ api: binary not found — build skipped; npm i -g graphify, then `graphify update .` there
    graph graphify @ api: build failed (…) — run `graphify update .` there by hand

Both lines are correct and both are advice. Nothing reads them back. A change
closes with four declared repos ungraphed and says nothing at close, which is
how the ecosystem this tool was measured against ended up with a declared
grapher and five repos that never had a graph. MV-87 made the adapter reach
every root; it did not make reaching them required.

**What a gate here actually buys.** The graph is not decoration — the brain
door tells every agent to ask the graph before reading the tree, and the SDD
flow leans on it. A missing graph does not fail loudly; it degrades into
agents grepping, which looks like working. That is the failure mode gates
exist for: the one nobody notices.

**Why close, and not verify.** MV-01 keeps `verify`, `doctor` and `doors`
offline and free of foreign subprocesses, and building a graph is a foreign
subprocess. The lifecycle is where subprocesses already run — the SDD gates
run the tool's own validator there — so the gate belongs at `change close`,
the step that decides a change is done.

**The escape hatches are the ones that already exist**, in the same words:
`--no-grapher` for one run, `grapher_auto: false` in the config for good.
The switch is not a loophole; it is the difference between a tool that
refuses and a tool that decides for you. And a declared grapher whose binary
is absent refuses too, naming the binary and the install hint — the same
shape `sddGate` uses, because a gate that cannot be evaluated refuses rather
than passes.
