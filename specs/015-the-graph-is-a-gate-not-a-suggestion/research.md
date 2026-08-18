# Research: A declared grapher leaves a graph, or close refuses

Phase 0. Six decisions, resolved against the existing code.

## D1 — The gate lives at close, and only at close

**Decision**: `change close` runs the gate. No other command does.

**Rationale**: MV-01 keeps `verify`, `doctor` and `doors` offline and free of
foreign subprocesses, and evaluating this gate means asking whether a foreign
tool can be run and letting it build. The change lifecycle is where subprocesses
already run — the SDD gates run the tool's own validator there. Within the
lifecycle, `close` is the step that decides a change is DONE: someone opening a
change should not be stopped by a tool they have not installed yet, someone
declaring the work finished should be.

**Alternatives considered**: gating `apply` — rejected, it punishes the start of
work for a condition that only matters at the end. A `verify` leg — rejected on
MV-01; it would also make every pre-commit hook run a foreign tool.

## D2 — Build first, then judge

**Decision**: the gate runs the existing build-where-missing pass before it
evaluates, and refuses on what is still missing afterwards.

**Rationale**: `ensureGraphs` is self-limiting — a root with an artifact is a
`stat` and a skip — so running it here costs nothing and means the first close
in a fresh ecosystem builds rather than refuses. A gate that refuses what it
could have fixed teaches people to route around it.

**Alternatives considered**: judge first and let the operator run the build —
rejected: the tool already knows the command and is already allowed to run it.

## D3 — Absent binary refuses; unverified adapter does not

**Decision**: a declared adapter whose binary is not on PATH refuses. A declared
adapter with no registry entry and no operator declaration reports the fields to
declare and gates on nothing.

**Rationale**: these look similar and are opposites. An absent binary is a check
that COULD be made and was not — Principle II says a gate that cannot be
evaluated refuses rather than passes, which is exactly what `sddGate` does when
the validator is missing. An unverified adapter is a tool whose artifact path
and build command are unknown; demanding an artifact whose location would have
to be guessed is Principle V's invented integration wearing a gate's clothes.

**Alternatives considered**: refusing on unverified adapters too — rejected, it
would demand a file the tool cannot name.

## D4 — Two switches, in the SDD adapter's words

**Decision**: `--no-grapher` for one run, `grapher_auto: false` in the config for
good. The per-repo `grapher: none` opt-out already exists and is unchanged.

**Rationale**: the SDD adapter has had exactly this pair since MV-56 and the
refusal prints both on the line after it. Two adapters with two vocabularies for
the same idea is a tax on every reader. `grapher_auto` is a new key, parsed the
way `sdd_auto` already is; the registry's `automation` field already names
`grapher-refresh` as this adapter's automation contract, so the concept was
described before it was switchable.

**Alternatives considered**: reusing `grapher: none` as the only escape —
rejected, it conflates "do not graph this repo" with "graph it but do not gate
me", and an operator forced to un-declare their tool to close a change will
un-declare it permanently.

## D5 — Existence, never freshness

**Decision**: the gate asks whether an artifact exists. It never asks whether it
is current, and the row says so.

**Rationale**: freshness is a report elsewhere in this tool for a reason — pin
staleness is reported, and only becomes blocking when an operator sets it. A
gate that claimed currency would have to define it (mtime? content hash? tracked
files newer than the artifact?), and each definition is wrong for some adapter.
Claiming existence and checking existence is Principle II satisfied; the
temptation to widen it later is why the exclusion is written into the row.

**Alternatives considered**: comparing artifact mtime against the newest tracked
file — rejected; it fails on a fresh clone, where every file is newer than
everything, and would refuse a change for a graph that is perfectly correct.

## D6 — The refresh scope is the shared one, and the local copy is deleted

**Decision**: `cmdClose` drops its hand-rolled scope list and calls
`graphScopes(brain, cfg)`.

**Rationale**: `close` builds `[{brain}, ...repos this change touched]` inline —
ten lines that duplicate `graphScopes`, which already returns the brain plus
every declared, present repo with the grapher that applies to each. Two
enumerations of the same thing is how the two disagree, and here they disagree
by design: the shared one reaches every declared repo, the local one reaches
only the repos a change happened to name. A repo that changed by a merge, a
sync, or another change was left describing a tree that had moved — for a
reader whose whole instruction is to trust the graph instead of reading the
tree.

Affordable because the declared refresh is a local parse: no model call, no
network. If that stops being true for some adapter, the fix is skipping roots
whose files have not moved — not going back to a subset chosen by which repos a
change happened to name.

**Alternatives considered**: keeping both and calling the shared one only at
close — rejected, that is the same duplication with a longer comment.

## D7 — The door names the graph only when one is declared

**Decision**: when a grapher is declared, the projected door instructs the agent
to consult the graph before reading the tree, naming the tool and its artifact.
Query commands appear only when the adapter declares them.

**Rationale**: the door already does this for the SDD adapter through
`projectLawLines` and does nothing for the grapher, so a declared graph tool
never reaches the agent's instructions at all — this repo's own door says it
only because a human typed it. Requiring an artifact at close while never
telling anyone to read it is the tool talking to itself.

Query verbs are per-tool and not derivable: `graphify query "<question>"` is
documented and used daily in this repo; another grapher's equivalent is unknown
and inventing one is exactly Principle V's failure. So the registry entry gains
an optional field for them, filled only where the vendor documents it, and an
adapter without it contributes the artifact's location and stops there.

**Alternatives considered**: a generic sentence with no tool name — rejected, an
instruction an agent cannot act on is noise. Deriving verbs from the tool name —
rejected on Principle V, in its plainest form.
