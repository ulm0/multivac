---
slug: the-refusal-reads-the-whole-token
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-105
  retires: []
claims:
  - id: MV-105
    statement: "A valued flag is declared once and accepted in both written forms — `--repo api` and `--repo=api` — and refused when its value is missing or is itself a flag. Every command reads that one refusal, `change` included: no command keeps a second, narrower one."
---

# The refusal reads the whole token

0.9.0 published a regression. `mvac init --provider=claude` was accepted by
0.8.0 and is refused by 0.9.0: MV-104 moved parsing to citty, which understands
the equals form, and put `undeclared` in front of it — and `undeclared` compares
WHOLE tokens against the declared names. `--provider=claude` matches neither
`--provider` nor any other declared flag, so the parser that would have
understood it is never reached. The change that caused it promised the opposite
in its own spec (FR-003, SC-003), and its test file asks each reader about a
different input, never the pair about the same one.

Two more holes in the same function, from the same cause — the refusal reasons
about tokens rather than about the surface:

- A declared valued flag consumes the next argument whatever it is, so
  `verify --repo --strict` runs NON-strict with no refusal. That is
  `doctor --sttrict` — the defect MV-85 exists to end — reintroduced inside the
  guard that ends it.
- `change` never reaches the guard. It keeps a hand-rolled check that sees only
  tokens beginning with `--`, so `change land <slug> api` and
  `change land <slug> -landed api` exit 0 having recorded nothing, in the one
  command that mutates the record. Its own comment, MV-85's row and the exit
  table in `commands.md` all promise refusal.

The fix is consolidation, and it is smaller than what it replaces: the split
happens once in `undeclared`, the missing-value check happens once beside it,
and `change`'s private check is deleted in favour of the shared one.
