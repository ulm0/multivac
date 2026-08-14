---
slug: repo-qualified-exclusions
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-35
  retires: []
claims:
  - id: MV-35
    statement: "An anchor exclusion may name the repo it applies to — `!<repo>:<glob>` — and then bites only in that declared repo; the bare `!<glob>` keeps its meaning, repo-relative in every repo the leg evaluates. An exclusion naming an undeclared repo is a parse-stage diagnostic that names the key, never a silent no-op; a qualifier in a single-repo leg is legal and redundant. Exclusions still count toward vacuity: a leg whose exclusions remove every candidate file is vacuous."
---

# An exclusion can name its repo

A leg scoped `*` evaluates in every declared repo, and its `!glob` exclusions
were repo-relative — so there was no way to exempt one path in one repo. That
blocked the pattern the ecosystem most wants: an `absent` tombstone across the
whole ecosystem, exempting only the page that carries the tombstone.

    <!-- @anchor INV-77 *:**.md !brain:07-reglas-de-negocio.md /PIN/ absent -->

means "everywhere, except that page **in the brain**" — a file of the same
name in any other repo is still checked. The hand-rolled guard this tool
replaces closed the hole by matching basenames inside its own repo only, and
the migration could not express it.

The qualifier resolves by directory, not by spelling: two keys naming one
checkout (`brain: .`) are one target, so `!brain:` bites there too.
