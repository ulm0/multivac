---
slug: the-gate-cannot-lie
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-47
    - MV-48
  retires: []
claims:
  - id: MV-47
    statement: "`doctor --strict` exits 1 when the enforcement gate is disarmed — the shim missing, `core.hooksPath` not multivac's with no shim chained, or no runnable multivac so the shim no-ops. Bare `doctor` stays a report that exits 0 and describes the degradation; the only other exit 1 stays invalid config/law. The exit contract is documented in `mvac doctor --help`, the site's doctor page and the CLI reference."
  - id: MV-48
    statement: "`count`'s summary teaches `each`, never the deletion-ratchet hole: after a `count=N` breakdown it names `each` for a rule that must hold in every matched file and `each!` to forbid a pattern everywhere, pointing at `mvac help anchor`; the `each`/`each!` breakdown already lists the zero-match files an each-author needs. `help anchor` and the site's anchor and count pages carry the same guidance."
---

# The gate cannot lie

The two ship-blocking findings from measurement 3: the only two ways a
well-behaved adopter ends up unprotected while believing otherwise.

## 1. `doctor` must fail when the gate is disarmed (MV-47)

After `git config --unset core.hooksPath`, doctor named the disarm and printed
the fix — but exited 0. A CI step `mvac doctor` passed while nothing was
enforced; detection depended on a human reading the report. Now the enforcement
floor is a strict assertion: `doctor --strict` exits 1 when the gate is not
armed — the shim missing, `core.hooksPath` pointing away from multivac's dir
with no shim chained alongside, or no runnable multivac so the shim no-ops.
Bare `doctor` is unchanged: a report that exits 0 and describes the
degradation. Invalid config/law keeps its own exit 1.

## 2. `count` must name `each` for universal-shaped legs (MV-48)

`count`'s summary always said "a ratchet pins count=N" and only listed files
WITH matches, so a cold adopter drafting "no file may contain X" or "every file
must contain X" was advised straight back into the count=N deletion-ratchet
hole that `each` was built to close. Now the `count=N` summary ends with one
line naming `each`/`each!` and pointing at `mvac help anchor`; the `each`/`each!`
breakdown already lists the zero-match files the each-author needs to see.
`help anchor` and the site's anchor and count pages say the same thing.
