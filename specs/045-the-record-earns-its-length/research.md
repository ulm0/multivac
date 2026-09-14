# Research: The record earns its length

## R1 — What may be cut

- **Decision**: measured evidence (dates, commit counts, leg breakdowns, the
  MV-84/88/89/90/91 aside), long "before" narratives, and internal mechanism in
  the changelog. Nothing else.
- **Rationale**: the rule, the ceilings, and each qualifier that limits a
  sentence are what bind. The evidence already lives in the archived change and
  in `specs/044`. The rest is in git at `f057e4a`, specifically MV-78 failing for
  two commits, "sixty-eight IDs", and "nearly two hundred lines above".
- **Alternatives considered**: moving that residue into this research file.
  Rejected, because git already holds it and copying it here would be the kind
  of padding this change removes.

## R2 — Does a shorter row need an amendment note?

- **Decision**: no.
- **Rationale**: an amendment note records that a rule changed, and no rule
  changes here. The count leg (`Amended 2026-09-13 by MV-120`, count=2) must stay
  at 2.
- **Alternatives considered**: a "Shortened" note pointing at the archive.
  Rejected, because it adds words to fix a problem of too many words, and the
  archive link is already the row's source cell.

## R3 — What the fidelity pass restored (18)

**MV-120**:
- touches "nothing compares with the rows a claim contradicts" (not "nothing
  checks")
- "no leg can read"
- the "judgement about meaning" reason
- leg 1's scope
- "stale values measured"

**MV-14 note**:
- "MV-92's first rung"
- which rungs the legs pin
- that MV-92's shim tests hold the order

**MV-111 note**:
- "a forced read, not a revert"
- "what the harness gate still does not cover"

**Changelog**:
- MV-112's claude-only ceiling
- MV-107's still-allowed deletions
- MV-118's "on a broken config"
- MV-108's two ceilings
- MV-109's lone `\r`
- plus the remainder recorded in the dry-run

## R4 — Checks that do not care about statement text

- **Finding**: at commit time, `verify` checks only enactment (MV-81), law
  deletion (MV-107/MV-117) and config (MV-97). Editing an active row's statement
  inside an open change passes. Measured on a staged index: exit 0.
