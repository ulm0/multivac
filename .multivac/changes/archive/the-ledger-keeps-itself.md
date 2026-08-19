---
slug: the-ledger-keeps-itself
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-46
  adds:
    - MV-110
  retires: []
claims:
  - id: MV-110
    statement: The lifecycle commits what it wrote, refuses a slug it would overwrite, proves a step with that step's own artifact, and reports a failed tracker call as a failure. Nothing it writes is left floating, and nothing it says happened is inferred.
---

# The ledger keeps itself

`commitBookkeeping`'s docstring states the contract: *everything the lifecycle
writes into the brain … is committed by the lifecycle, scoped to exactly those
paths … Nothing is left floating.* Five places do not keep it.

- **The SDD proof matches a slug as a SUBSTRING.** `specs/*<slug>*/spec.md`
  wraps the slug in wildcards on both sides, so any older feature directory
  whose name merely contains the slug satisfies `plan`, `apply` and `close`.
  The registry's own note says the opposite — *the gates match the slug as a
  suffix* — and spec-kit's layout is `NNN-<short-name>`, which is exactly a
  suffix. With sixteen directories under `specs/` in this repo, the collision
  is routine rather than theoretical.
- **`change new` accepts a slug whose archive exists.** Nothing checks
  `changes/archive/<slug>.md`, so the eventual `close` overwrites an archived
  change — the ledger the docs call never deleted. `roadmap add` already has
  the check `change new` lacks.
- **`close` prints a commit that omits the law it just edited.** `archiveChange`
  repoints the law's links on every close, so the file is dirty in exactly the
  case the printed command does not stage — and the next `change new` refuses
  over it.
- **`land --landed` writes the status bump and commits nothing.** It is the one
  lifecycle write with no `commitBookkeeping` call, contradicting the docstring
  above.
- **`--abandon` reads claims only.** A change whose repos are landed is
  archived saying *nothing landed*, which is false in the ledger that survives.

And the tracker, which reports success it did not have: `gh issue edit` has no
`--label` — it takes `--add-label` — so every GitHub update fails, and the
failure is caught and printed as *not found in the tracker*, which is a
different fact. `closeIssue` swallows its error entirely and prints `closed`.

Out of scope, and named so it is not read as fixed: `close`'s speckit ledger
still `continue`s when the artifact never existed, so `new → land --landed →
close` crosses every SDD gate. That is a gate design question, not a
bookkeeping one.
