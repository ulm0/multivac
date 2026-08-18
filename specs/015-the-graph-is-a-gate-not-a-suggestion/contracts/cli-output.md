# Contract: CLI surface and output

For a CLI the output is the interface. These lines are the contract.

## `multivac change close <slug> [--no-grapher]`

The gate runs after the build-where-missing pass and before the archive.

### Satisfied — nothing new is printed

A root holding a graph produces no gate line. The refresh that follows already
says what it did.

### Missing — every root named in one refusal

```text
mvac: graph graphify: `change close points-expire` refused — 2 roots have no graph
mvac:   api: no graphify-out/graph.json — `graphify update .` there
mvac:   web: no graphify-out/graph.json — `graphify update .` there
mvac:   or skip the gate without losing the tool: `--no-grapher` for one run, `grapher_auto: false` in .multivac/config.yml for good
```

Every offending root in one message: an operator must never have to close
repeatedly to discover the full list.

### Unevaluable — the binary is not there

```text
mvac: graph graphify: `change close points-expire` refused — `graphify` is not on PATH, so no root can be checked
mvac:   npm i -g graphify, then `graphify update .` in each root
mvac:   or skip the gate without losing the tool: `--no-grapher` for one run, `grapher_auto: false` in .multivac/config.yml for good
```

A gate that cannot be evaluated refuses rather than passes.

### Out of scope — reported, never counted as a gap

```text
graph none @ landing: no grapher declared for this repo — out of scope, not a gap
```

This line already exists in `doctor` and is the wording the gate reuses. An
unverified adapter is reported the way it already is — the fields to declare —
and refuses nothing.

### Skipped — said out loud

```text
graph graphify: gate skipped (--no-grapher) — a root without a graph will not be reported
graph graphify: gate off (grapher_auto: false) — a root without a graph will not be reported
```

Silence about a skipped check is the failure this whole change is about.

### No grapher declared

Nothing about graphs is printed or required.

## The refresh at close

Unchanged in wording, widened in reach: it runs over the brain and every
declared, present repo, not only the repos the change touched.

```text
graph graphify @ brain: refreshed (`graphify update .`) — artifact left uncommitted
graph graphify @ api: refreshed (`graphify update .`) — artifact left uncommitted
graph graphify @ web: built (`graphify update .`) — artifact left uncommitted
```

## The projected door, when a grapher is declared

```text
A code graph is kept fresh for you by `graphify` at `graphify-out/graph.json`.
ASK IT BEFORE READING THE TREE RAW — it answers in one call what grep takes many:
  - `graphify query "<question>"` — a question in plain words, answered with the subgraph
  - `graphify explain "<node>"` — one node and its neighbours, in prose
  - `graphify path "<A>" "<B>"` — the shortest path between two nodes
```

The verbs come from the adapter's declaration. An adapter that declares none
gets the naming and stops:

```text
A code graph is kept fresh for you by `codegraph` at `<its declared artifact>`.
Read it before walking the tree.
```

With no grapher declared, the door carries none of this.

## What must never appear

The gate must not run in `verify`, `doctor` or `doors`. MV-90 carries an
`absent` leg over those three files, so it cannot be introduced there without
the law failing.
