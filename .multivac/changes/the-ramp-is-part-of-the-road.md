---
slug: the-ramp-is-part-of-the-road
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-31
  adds:
    - MV-39
    - MV-40
    - MV-41
    - MV-42
  retires: []
claims:
  - id: MV-39
    statement: "`multivac help anchor` teaches the whole grammar from the CLI in one screen: the anchor line, POSIX ERE only with the shorthand replacements named, per-line matching except `.sql` (per normalized statement), `count=N` counted across every file the glob matches (a deletion ratchet, never a universal), exactly one include glob (braces for alternatives), repo-qualified exclusions, and where anchors may live."
  - id: MV-40
    statement: "`multivac count '<repo>:<glob> /re/'` is a dry-run that prints the per-file breakdown and the total through the same parse and scan path verify uses — never a reimplementation — so a `count=N` ratchet is right the first time. It writes nothing and exits 0 when the spec evaluates."
  - id: MV-41
    statement: "`--help`/`-h` on any subcommand is recognized by the dispatcher before the command runs: usage on stdout, exit 0, no side effect on the tree."
  - id: MV-42
    statement: "verify is readable at the summary: parse diagnostics print above it, the unanchored claim ids are named (never only counted), and a law row in state `drift` records a real, not-yet-fixable finding — its legs report but never gate, and the summary names the drifting ids. Every other row keeps the exit matrix unchanged."
---

# The on-ramp: help anchor, count dry-run, safe --help, readable verify

Measurement 2 (internal/measurements/02-foreign-ecosystems.md, findings 7, 9,
10, 11, 12) priced the cold-adopter on-ramp: two of three agents learned the
anchor grammar by reading this repo's TypeScript, `seed --help` executed seed,
hand git-grep counts were wrong on 2 of 3 subjects, verify withheld the
unanchored ids, and recording a true finding made the repo un-committable.

Four fixes, one change:

- `help` command; `help anchor` is the one-screen grammar reference.
- `count` command: the ratchet dry-run, through `parseAnchors` + `scanLeg`.
- `--help`/`-h` intercepted in `cli.ts` dispatch, before any command code runs.
- verify: diagnostics above the summary, unanchored ids named, and the law
  table's existing state column gains `drift` — chosen over a new config key
  because the table already carries lifecycle states (`proposed`, `retired`),
  measurement 2's own measurer wrote `state: drift` expecting it to work, and
  a finding belongs next to the law it contradicts, not in config.
