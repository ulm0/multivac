---
slug: close-keeps-used-reservations
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-45
  retires: []
claims:
  - id: MV-45
    statement: close releases only reservations the change never used — a row that is anchored, or whose rule has been stated, survives close.
---

# Close keeps used reservations

Reproduced in a scratch brain (PROVER run, 2026-08-15): two changes ran the
full lifecycle; at close, `releaseUnused` deleted BOTH law rows even though
each was stated and anchored, leaving an empty law table.

Two root causes, one function each:

1. **Order**: `cmdClose` computed `anchoredClaimIds` AFTER `archiveChange`
   moved the change file to `changes/archive/<slug>.md` — an untracked path
   `lsFiles` cannot see, while the tracked original is already unlinked. Any
   anchor living in the change file itself (the grammar allows it) was
   invisible at exactly the moment release checked it. The same close had just
   evaluated those anchors green in the close gate.
2. **Semantics**: `releaseUnused` treated "still `proposed`" as "never used".
   A row whose statement the author already replaced (the ledger's own
   instruction: "state the rule here before close") is used, whether or not
   an anchor names it — and when the change declares no claim for it, no gate
   stands between the stated rule and deletion.

The fix: read the anchor set before archiving, and release only rows still
carrying the scaffolded `RESERVED by change <slug>` statement.

Friction (recorded per MV-44's open change): `new` left this declaration and
the MV-45 row floating uncommitted in the shared checkout — committed by hand
below, as `the-ledger-keeps-itself` already plans to automate.
