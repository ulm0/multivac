---
slug: the-rows-say-what-they-check
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-21
    - MV-31
    - MV-45
    - MV-46
    - MV-51
    - MV-56
    - MV-57
  adds: []
  retires: []
claims:
  - id: MV-45
    statement: Both close paths read the anchor set before archiving; --abandon no longer releases against an empty one.
  - id: MV-46
    statement: No lifecycle command sweeps a tree with `add -A`, and the leg sees the call rather than a comment about it.
---

# The rows say what they check

An external audit read the law against the code. Nine claims were examined;
**eight were confirmed overstating and one was cleared** (MV-10 is accurate —
`gates = gate && behind !== '?'`, so an unresolvable channel reports and does
not gate, exactly as the row says).

This change adds no law. Every row here already says the right thing or nearly
so; what is wrong is that some describe code that drifted, and two describe code
that never matched. **Where the row states the better behaviour, the CODE moves**
— relaxing a row to match its drift is the one direction Principle III forbids.

## The two where the code moves

**MV-46** ends with "`add -A` appears nowhere in the lifecycle". It does:
`greenfield()` at `change.ts:461` runs `gitRun(abs, ['add', '-A'])`. Harmless in
itself — a repo multivac has just created, holding one file it just wrote — but
the row says *nowhere*.

Worse is the leg. It is `/add -A/ count=1`, and the only line in the file
matching those bytes is a **comment** at :874 saying "never `add -A`". The real
call spells it `['add', '-A']` and is invisible. The row's most emphatic clause
was anchored to a sentence asserting the opposite of the code 400 lines above
it, and it was green.

**MV-45** says a reservation is released only when "no anchor names its ID", and
that the anchor set is read before the archive moves the change file. The normal
close does exactly that. **`--abandon` does neither**: it archives first, then
calls `releaseUnused(brain, slug, new Set())` — an empty anchor set, so the
condition is never evaluated. `--abandon` requires zero claims, which makes it
*unlikely* that an anchor names the ID, not impossible: an anchor written by
hand against the reserved ID would let that ID return to the pool with a live
reference to it, which is the MV-26 collision hazard by another road.

## The five where the row moves

- **MV-51** and **MV-56** both say the tool shells out for validation ONLY, and
  that the validator is "the ONE subprocess". MV-75 added a second on purpose —
  the SDD's own init, which reaches the network. `sdd.ts:191` already says
  "besides the tool's own validator"; the rows never caught up.
- **MV-31** documents "one per harness entry in the registry — including the
  entries marked unsupported". MV-28 removed that kind: "there is no
  `unsupported` kind".
- **MV-57** reports STALE by comparing the file's **mtime** to the law's newest
  row date. Git does not preserve mtimes, so on a fresh clone every file is
  stamped at checkout and STALE cannot fire for the reader most likely to need
  it. A real signal on the machine that edited the file, and silent elsewhere.
- **MV-21** claims detection of "a path a `package.json` script names". The code
  is `scripts.includes(file)`, a substring test its own `ponytail:` comment
  flags as missing concatenated paths. Approximate, and the row reads exact.

## And two documents

`CONTRIBUTING.md` tells a contributor to "mark it unsupported with the reason" —
the exact entry MV-28 forbids, so the guide sends an MR the law rejects.
`DESIGN.md` describes a `ripgrep` matching engine and a commit-sha-keyed cache
in `.multivac/cache/`; neither exists, and it is the document the README sends
readers to for the full design.
