---
slug: the-graph-is-part-of-the-repository
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-90
  adds:
    - MV-103
  retires: []
claims:
  - id: MV-103
    statement: "A declared grapher's artifact is part of the repository it describes: `change close` refuses while a declared, present root keeps its graph untracked or ignored, naming the path and the `git add` that ends it — and multivac still never stages it."
---

# The graph a declared grapher leaves is part of the repository

MV-90 made a declared grapher OBLIGE a graph, and asks one question about it:
does the artifact exist on disk. A graph that exists only in a working tree
answers that question and helps nobody else — the next clone has none, the gate
passes there only because `ensureGraphs` rebuilds it, and until somebody runs
the tool the door still tells every agent to ask a graph that is not there.

Declaring a grapher is a declaration about the REPOSITORY, not about one
checkout. So the artifact belongs in it.

**What this does not do.** multivac does not stage it. MV-50 says the refresh
module never invokes git and the artifact lands only in dedicated chore commits,
and that stays true: the tool refuses and names the command, the human runs it.
A gate that quietly wrote to somebody's index would be a worse tool than one
that leaves a graph behind.

**Where the check lives.** Not in `src/adapters/refresh.ts` — MV-50 carries an
`absent` leg over that file for `git`, deliberately, so the refresher can never
touch the index. The tracked question is asked from its own module beside it.

**Two ways to fail, two messages.** Untracked is one `git add` away. Ignored by
a `.gitignore` rule is not — `git add` there fails silently as far as the author
can tell — so that case names the rule and says to remove it first.

**The ceiling.** The gate asks about the ARTIFACT the adapter declares, not
about every file the tool writes beside it: graph caches, dated exports and
generated HTML are excluded by this repo's own `.gitignore` and demanding them
would fight the tool that wrote them. Requiring the artifact is the checkable
core of "the graph is part of the repository"; requiring the whole directory is
a rule nobody could keep.
