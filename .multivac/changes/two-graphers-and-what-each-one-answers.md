---
slug: two-graphers-and-what-each-one-answers
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-59
  adds:
    - MV-61
    - MV-62
  retires: []
claims:
  - id: MV-61
    statement: "Every shipped grapher carries its own query verbs, printed verbatim in the brain door; a tool without one says so, and nothing is guessed for a declared grapher."
  - id: MV-62
    statement: "A shipped grapher entry names any network its refresh performs, and gives the command that makes the offline contract true."
---

# Two graphers, and what each one answers

The table held six graphers. Four of them — `code-review-graph`, `axon`,
`dependency-cruiser`, `scip-typescript` — were verified against their vendors'
docs and never used. That is visible in what their entries contained: a build,
a refresh, an install line. Nothing a reader could *ask*.

Which is the wrong half. Keeping an artifact fresh was already automatic; a
post-edit hook does it whether or not anybody mentions the graph. The half
that pays for the refresh is the agent asking the graph instead of grepping
the tree — and multivac was not telling it to. The brain door said nothing
about the grapher at all. An agent read the door, learned the law, and went
off to grep a repo that had a current graph sitting next to it.

So the table is two, and both of them now carry `queries`.

**The verbs are not interchangeable, and that is the whole point.** `graphify
query` takes a question in words and walks the graph outward from whatever
matches. `codegraph query` is a symbol lookup by name, with `--kind` and
`--limit`. Hand codegraph a sentence and you get nothing; hand graphify a bare
identifier and you have thrown away what it is for. A door that told the agent
to "query the graph" would be wrong for one of them, with no way to tell
which — so the door prints the tool's own verb, verbatim, or states that the
tool has none.

**A verb is written down only after it has been run.** `graphify query` does
not appear in `graphify --help`, which lists install, uninstall, path, explain,
diagnose, clone and merge-driver. It was run against the shipped 0.9.29 binary
and returns a BFS subgraph. Reading the help output and stopping there would
have dropped the most useful verb the tool has — the same failure as reading a
vendor's README and inventing the rest, one step further in.

**codegraph phones home.** Telemetry is on by default: commands run, languages
indexed, file counts, platform. The vendor documents that source code, file
paths, repository URLs and symbol names are never collected, and that is worth
stating precisely rather than darkly. But the table's contract says "no model
and no network inside it", and multivac fires that refresh from a post-edit
hook — so the entry names the traffic and gives the opt-out (`codegraph
telemetry off`, or `DO_NOT_TRACK=1`, which it honors). MV-62 makes that a rule
rather than a courtesy: an entry states the network its refresh performs.

Nothing is lost by narrowing. Every dropped tool still works through
`graphers:` in config with no merge request against multivac — it simply gets
no query lines, because multivac does not know its verbs and will not guess
them. That is the same refusal MV-59 already makes about paths and commands,
applied to the one field that was missing.

MV-59 is touched, not weakened: four of its anchors pinned fields of entries
that no longer exist, and one pinned a test that was renamed. The rule it
states — never derive a contract from a name — binds harder with a shorter
table, not less.
