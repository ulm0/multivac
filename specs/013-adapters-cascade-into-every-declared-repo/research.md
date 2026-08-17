# Phase 0 — Research

Nothing here needed a library survey. What needed resolving was where the
first-root-wins reads live, which of them are load-bearing, and what an opt-out
looks like in a config that already has one shaped like it. Every decision below
was taken against the code as it stands and against a measured ecosystem (a
brain governing five sibling repos).

## Decision 1 — "installed here" is asked per root, everywhere

**Decision**: `sddRoots(brain, cfg)` keeps returning the brain plus every
declared, present repo, and every consumer of it stops collapsing that list.
Three consumers collapse it today and all three change:

| Site | Today | After |
| --- | --- | --- |
| `runScaffold`, `src/adapters/sdd.ts` | `for (const root of roots) if (present) return` — any hit aborts the whole run | per-root: the roots that lack the artifact are scaffolded, the rest are skipped in silence |
| `runScaffold`, same function | acts on `roots[0]` only | acts on every root that needs it |
| `sddLines`, `src/commands/doctor.ts` | `for (…) if (artifactPresent) { artifact = true; break }` — one boolean for the ecosystem | one line per root, the shape `grapherLines` in the same file already uses |

**Rationale**: The three are the same bug written three times, and the measured
consequence is a green report over an unequipped ecosystem — Principle II's
named failure. The per-scope shape is not invented here; it is copied from the
grapher pass thirty lines below the SDD pass in the same file, which has been
correct all along.

**Alternatives considered**:

- *Fix only the early return, keep brain-only scaffolding.* Rejected: it fixes
  the brain and leaves five repos where the tool's steps are still unrunnable,
  which is the operator's actual complaint.
- *A `--all-repos` flag.* Rejected: a flag whose default reproduces the defect
  is a way of not fixing it, and MV-56 already defines the search set as the
  brain plus every declared repo. The behaviour should match the definition.

## Decision 2 — a repo opts out through its own declaration, spelled `none`

**Decision**: `RepoEntry` gains `sdd?: string`, parsed by the same `optString`
that parses `grapher`, and the resolution is `entry.sdd ?? cfg.sdd` with the
literal `none` meaning "no SDD in this repo". A root resolving to no SDD is
never scaffolded, never gated and never reported as deficient.

**Rationale**: The config already carries a per-repo `grapher` override with
exactly this fallback, so this is the mechanism the file already teaches rather
than a second one. `none` is a string because `optString` — the one validator
every repo key goes through — takes strings, and `sdd: false` would mean adding
a boolean branch to a parser that has no other use for one. `none` cannot
collide: registry names are `opsx` and `speckit`, and an unknown name is already
reported with the known list.

**Alternatives considered**:

- *`sdd: false`.* Rejected on the parser: one more shape in `repoEntry` for one
  key, where a sentinel string reuses the validator unchanged.
- *An ecosystem-level `sdd_exclude: [landing]` list.* Rejected: it puts one
  repo's configuration somewhere other than that repo's entry, and it is a new
  mechanism where an existing one fits.
- *No opt-out at all.* Rejected: FR-006. Not every repo in an ecosystem wants a
  spec-driven flow, and scaffolding one that does not is writing into somebody's
  checkout for no reason.

## Decision 3 — the project-document gate asks only where the tool is installed

**Decision**: `sddGate`'s project-document pass iterates the roots whose SDD
resolves to this tool AND whose artifact is present, and refuses while any of
them lacks a written document, naming each. Roots with no SDD, and roots where
the tool has not been scaffolded, are not asked.

**Rationale**: MV-76 gates `change plan` on the document existing; it never said
in which repo, and the implementation answered "the first one that has it". In
an ecosystem that answer is one repo's constitution standing in for six. Scoping
the question to roots where the tool is actually installed is what keeps the
stricter gate from refusing work over a document a repo has no reason to own —
and after Decision 1, "installed" is a fact the same run just established.

**Alternatives considered**:

- *Gate every declared root regardless of installation.* Rejected: it refuses
  the whole ecosystem's work over a repo that opted out or was never scaffolded,
  and the refusal would be unfixable without scaffolding a repo the operator
  did not want scaffolded.
- *Keep gating the brain only.* Rejected: it is the current behaviour with a
  nicer justification, and it leaves five repos planning against a constitution
  that is not theirs.

## Decision 4 — the first graph build is `refreshGraph`'s own missing-artifact branch

**Decision**: `refreshGraph` picks the adapter's `create` command when the
scope has no artifact and `refresh` when it does (falling back to `refresh`
where no `create` is declared — graphify declares none, because `graphify
update .` builds and refreshes). The change lifecycle then calls it for every
declared, present scope whose graph is missing, at the points where the SDD
scaffold already runs.

**Rationale**: `doctor` already prints `spec.create ?? spec.refresh` for a
missing artifact and `spec.refresh` for a stale one — the distinction exists in
the report and not in the runner, which is why the runner was always one command
short. Putting it inside `refreshGraph` fixes the existing close path too: a
touched repo with no graph is built rather than "refreshed".

Calling it beside the scaffold is self-limiting: the build is skipped the moment
the artifact exists, so the second lifecycle run costs one `stat` per scope, and
a repo is built exactly once ever.

**Alternatives considered**:

- *Build at `change close` only.* Rejected: the graph is what the agent reads to
  do the work, so building it after the work is the wrong end of the change.
- *A new `multivac graph` command.* Rejected: a command the operator must
  remember is the state we are in today — `doctor` already names the command
  per repo and nobody runs it.
- *Build from `doors`.* Rejected outright by Principle IV and MV-01: `doors` is
  offline and spawns no foreign tool. That boundary is not worth spending on
  convenience.

## Decision 5 — the closing ceremony gains nothing

**Decision**: `.multivac/ritual.md` and `change close`'s printing of it are not
touched.

**Rationale**: MV-27 defines the ritual as written by the team, printed
verbatim, never verified and never gating. The enforcement this feature is about
belongs in the gate and the report, both of which can be checked. Putting it in
the ritual would mean either verifying prose the tool cannot judge, or adding
lines nobody asked for to a file the team owns.

## Decision 6 — no new module, no new dependency

**Decision**: Everything lands in the file that already owns the behaviour:
`detect.ts` (roots and per-root resolution), `sdd.ts` (scaffold loop, gate
pass), `refresh.ts` (create-vs-refresh), `doctor.ts` (per-scope report),
`change.ts` (one call), `config.ts` + `types.ts` (one key).

**Rationale**: The runtime dependency count is pinned at two by the
constitution and by a row, and none of this needs a third. A new module would
also split the roots logic from `sddRoots`, which is the one place that knows
what a root is.
</content>
