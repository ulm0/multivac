# Research: The CLI is parsed by citty

## D0 — Measured before designing

citty 0.2.2, installed and probed rather than read about:

    citty 0.2.2 | runtime deps: {}   | 52K unpacked | 1 package installed

    parseArgs(['.'])                  -> {"_":["."],"dir":"."}
    parseArgs(['--repo','api'])       -> {"repo":"api"}
    parseArgs(['--repo=api'])         -> {"repo":"api"}
    parseArgs(['--no-strict'])        -> {"strict":false}

    runCommand(['--nope'])            -> ACCEPTED, flag dropped
    runCommand(['a','b','c'])         -> ACCEPTED, b and c dropped

## D1 — citty parses; it does not refuse

**Decision**: `undeclared()` keeps the refusal and runs FIRST.

**Rationale**: the last line of the probe is MV-85's defect verbatim — an
argument nobody declared, accepted in silence. That row was written because
`doctor --sttrict` ran a non-strict report and exited 0. Delegating the refusal
to a parser that does not perform it would retire the row by accident, which is
the one thing a refactor must never do.

**Alternatives considered**: citty's `strict` — it has none for this;
post-hoc comparison of parsed keys against the declaration — rejected, it moves
the check after the parse and reports what was dropped rather than refusing what
was passed.

## D2 — One declaration, two readers

**Decision**: the citty `ArgsDef` is the single declaration. `undeclared()`
derives the surface from it.

**Rationale**: it is the only reason to take the dependency. Today a command
writes its surface for the refusal and parses the same surface by hand; the two
can drift and nothing notices. Deriving one from the other makes the drift
impossible rather than tested for.

## D3 — The signature stays `run(argv, ctx)`

**Decision**: commands keep taking the raw argument array and parse inside.

**Rationale**: ~500 existing tests call `cmd.run(['--sdd','speckit',dir], ctx)`.
A signature change would edit every one of them, and a refactor whose tests must
be edited has stopped being a refactor — SC-001 says so. The parse moves; the
boundary does not.

## D4 — The usage text is not generated

**Decision**: `renderUsage` is not used. `--help` stays the dispatcher's.

**Rationale**: MV-69 has every command declaring its own usage, and those
strings carry prose a generated table cannot — what a flag means, and what the
command refuses. The site documents the exact output, repaired one change ago.

## D5 — MV-02 is amended, not retired

**Decision**: the row keeps pinning a number; the number becomes three.

**Rationale**: the count is law because transitive weight is what it guards, and
citty brings none — one package, zero dependencies. A row that said "as few as
possible" would check nothing. Three is checkable, and the next addition faces
the same amendment.
