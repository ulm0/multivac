---
slug: the-ceremony-loses-nothing
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-107
  adds:
    - MV-117
  retires: []
claims:
  - id: MV-117
    statement: "The closing ceremony loses nothing: a claim whose only anchors live in the file being archived is named before the archive orphans it, an existing archive is never overwritten, a retired row is as undeletable as an active one, and a frontmatter key the lifecycle drops is said out loud when it is dropped."
---

# The ceremony loses nothing

`change close` is the one command that claims to be careful, and four things
disappear through it without a word.

- **A claim can be green at close and unanchored forever after.** `close`
  verifies a change's claims against every anchor it can see — including the
  ones written inside the change file itself — and then archives that file.
  `parse.ts` never reads `changes/archive/`, so the anchors go out of
  evaluation the moment they pass.
- **An archive is overwritten in silence.** `change new` refuses a slug whose
  archive exists (MV-110), but `archiveChange` still writes over one on the
  parallel-branch path that guard cannot see.
- **A retired row can be deleted.** MV-107 gates a row leaving `active`, and
  retirement is the sanctioned exit — so the retired rows ARE the record of
  what a rule used to be, and nothing stops one being removed.
- **A frontmatter key the lifecycle does not know is dropped.** The scaffold
  says so now, but the drop itself is still silent at the moment it happens.

Two findings from the same audit are deliberately NOT fixed here, and the row
says why: `close`'s speckit ledger passing when no artifact ever existed is a
gate-design question MV-110 already named as its own change, and `--abandon`
reporting rather than refusing over landed repos is a decision MV-110 recorded
on purpose.
