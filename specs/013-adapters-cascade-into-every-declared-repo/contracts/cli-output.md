# Contract — the lines this feature owns

multivac's interface is its output: an operator and an agent both read these
lines, and the tests assert on them. This file pins the shapes **as shipped**.
`<scope>` is always the name the config gave the root (`brain`, or a repo key).

Where a wording already named its scope before this change, it is kept byte for
byte — the diff is only ever "which roots produce a line", never a rewrite of
sentences other tests and other docs quote.

## Scaffold, `change new` and the gates (`src/adapters/sdd.ts`)

Announced before the tool runs, because it writes into the tree and reaches the
network. One pair of lines per root that needed it:

```txt
sdd speckit: .specify is missing in brain — running the tool's own init there: `specify init --here --integration claude --force`
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable
sdd speckit: .specify is missing in api — running the tool's own init there: `specify init --here --integration claude --force`
sdd speckit: scaffolded — api:.specify is there now; its steps are runnable
```

Failure, per root, never fatal to the run — the roots after it are still
attempted:

```txt
sdd speckit: `specify init --here --integration claude --force` left no .specify in api — it said: error: failed to download template — run it in api by hand; until then the gates refuse on their own terms
```

Binary absent — said once per binary, not once per root, because it is one fact
about the machine:

```txt
sdd speckit: `specify` is not on PATH, so `specify init --here --integration claude --force` cannot be run — install it: uv tool install specify-cli
```

No init declared by the adapter — one line per root that lacks the artifact,
and nothing is executed anywhere:

```txt
sdd opsx: declared, and nothing of it is in brain — multivac does not know this tool's init command and will not guess one. Install it (npm i -g @fission-ai/openspec) and run its own init there yourself, then re-run this command
sdd opsx: declared, and nothing of it is in api — multivac does not know this tool's init command and will not guess one. …
```

**Silence is a contract too**: a root that already has the artifact, a root
whose `sdd` resolves to `none`, and a repo declared but absent from disk each
produce no line at all.

## Diagnostic, `doctor` (`src/commands/doctor.ts`)

One line per declared, present root — the shape `grapher` already prints:

```txt
sdd        speckit @ brain: artifact ok · binary ok · sdd_auto on — …
sdd        speckit @ api: artifact missing (looked for .specify) — declared but never run here; `change new` runs the tool's own `specify init --here --integration claude --force`, doctor never does (it reaches the network) · binary ok · sdd_auto on — …
sdd        none @ landing: no sdd declared for this repo — out of scope, not a gap
```

The tool-level lines — the flow, and which lifecycle commands gate — stay
printed **once per distinct tool**, not per root: they describe the adapter,
not a checkout. So does the `revisit:` cadence.

Project-level document, per root the tool applies to. Reported even where the
tool is not installed: a report that hid a missing constitution until somebody
scaffolded the repo would hide it exactly when it is most worth saying.

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md present (last modified 2026-08-04), law's newest row 2026-08-01 — fresh
sdd        speckit project law @ api: .specify/memory/constitution.md missing → run /speckit.constitution in your agent to write the project principles — …
sdd        speckit project law — revisit: once at start, then on every principle change: …
```

## Gate, `change plan` (`src/adapters/sdd.ts`)

Asked of every root where the tool is **installed** — the gate, unlike the
report, does not ask a repo that has no reason to own the document.

Pass, per root (wording unchanged from before this feature):

```txt
sdd speckit: brain: .specify/memory/constitution.md ok
sdd speckit: api: .specify/memory/constitution.md ok
```

Refusal, per failing root, each naming its own root; several roots failing
produce several refusals:

```txt
sdd speckit: `change plan <slug>` refused — brain:.specify/memory/constitution.md is missing or unreadable
  run /speckit.constitution in your agent to write the project principles — …
  then re-run: multivac change plan <slug>
sdd speckit: `change plan <slug>` refused — api:.specify/memory/constitution.md is still the unfilled template shipped by the tool (placeholders remain — the tool asks the author to replace them)
  …
```

The `— looked in <every root>` list survives for exactly one case: the tool is
installed in **no** root at all, so there is no root to name.

MV-76's three refusal wordings — missing or unreadable, empty, still the
unfilled template — are unchanged; each simply gains `<scope>:` in front of
the path, which the "empty" and "template" cases already had.

## Graph, the change lifecycle (`src/adapters/refresh.ts`)

First build, in a scope that has no artifact — the adapter's `create` when it
declares one, its `refresh` otherwise:

```txt
graph fakegraph @ api: built (`fakegraph build .`) — artifact left uncommitted
```

Refresh, in a scope that has one — the existing line, unchanged:

```txt
graph graphify @ brain: refreshed (`graphify update .`) — artifact left uncommitted
```

Absent binary and a failed run name whichever of build/refresh this scope
needed:

```txt
graph fakegraph @ api: binary not found — build skipped; npm i -g fakegraph, then `fakegraph build .`
graph fakegraph @ api: build failed (<the tool's own words>) — run `fakegraph build .` there by hand
```

## Invariants of the contract

1. **Every line names its scope.** An ecosystem of six produces six lines, each
   identifiable without opening a directory.
2. **No line reports a root on the strength of another root's files.**
3. **Silence means "nothing to do here"**, never "not checked": anything
   skipped because it could not be evaluated says so.
4. **Nothing here is printed by `verify`, `doctor` or `doors` as a side effect
   of running a foreign tool.** `doctor`'s lines are reads — one `stat` per
   root.
</content>
