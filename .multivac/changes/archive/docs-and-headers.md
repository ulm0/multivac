---
slug: docs-and-headers
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-06
  adds:
    - MV-19
    - MV-20
  retires: []
claims:
  - id: MV-19
    statement: The anchor include/exclude globs are picomatch patterns (`**`, `{a,b}`, dotfiles matched) — stated in the design and the site grammar, and named in the parse error that rejects a malformed repo spec.
  - id: MV-20
    statement: One predicate decides whether a diagnostic gates, and both the exit code and the printed line read it — a line marked blocking always exits 1, and a broken or vacuous leg that is not marked never gates on its own.
---

# Reports say what they gate: scoped headers, glob dialect, one predicate

DOGFOOD-01 polish 5-8, all reporting-layer:

**Scoped header.** Consumer-scoped verify counted every brain claim against
scope-filtered anchors, so a healthy repo read as a coverage collapse
("11 claims · 3 anchored (27%)"). Scoped runs now print how many of the
brain's claims anchor into *this* repo, with no percentage to misread.

**init side effects.** `init` writes `changes/` with a `.gitkeep`; the
design's "enumerated once and completely" list did not say so. Documented.

**Glob dialect.** The include glob is picomatch — `**`, brace alternation,
dotfiles included — and nothing said so anywhere. Now in DESIGN.md's
grammar section, the internal design, the site's anchor pages, and the
parse error that rejects a bad repo spec.

**One predicate.** Report strings and gate logic were computed apart, which
is how "pin 0 behind" got printed as blocking while the gate disagreed.
`legGates` is now the only answer to "does this leg gate?": the exit matrix
counts it, the report line prints `· blocking` from it, and staleness lines
carry their own gate flag instead of a parallel count. A test asserts the
two cannot disagree for the staleness and vacuous cases.
