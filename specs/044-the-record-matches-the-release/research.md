# Research: The record matches the release

Everything below was measured against the repository at `38fbee0` and the tags,
and dry-run in a scratch clone: `verify --strict` 120 ok, exit 0; 587/587 tests;
every leg bites.

## R1 — Did MV-105 … MV-119 ship in 0.10.0?

- **Decision**: yes, all fifteen. They belong in the 0.10.0 entry, not in an
  unreleased section.
- **Rationale**:
  - `b336c78` (2026-08-19) moved them to `active`. `02929f3` "release 0.10.0"
    and tag `v0.10.0` (`e2f5d2d`, 2026-08-24) came after.
  - Every fix and merge commit behind them passes
    `git merge-base --is-ancestor <sha> v0.10.0`.
  - Every leg of the fifteen holds at `v0.10.0`.
  - The packaged diff `v0.9.0..v0.10.0` (`dist` + `skills`) traces hunk by hunk
    to those rows or to `8ff5ab8` (MV-50). The exceptions are the init step-0
    line and the "untracked or modified" refusal wording from `16a6c1e`. MV-111's
    legs pin both, so they are credited to MV-111.
- **Alternatives considered**: an "Unreleased" section. Rejected, because the
  tag contains the code.

## R2 — Scope: MV-72

- **Decision**: name MV-72 in the 0.2.0 entry.
- **Rationale**:
  - Measured with one definition over every entry: a row `active` at a release's
    tag that no entry at or before that release names. The only gaps after the
    0.1.0 baseline are MV-105 … MV-119 and MV-72.
  - MV-120 states the rule for every release. Leaving MV-72 out makes that rule
    false on the day it is enacted.
- **Alternatives considered**: reword MV-120 to call MV-72 an open gap. Rejected
  as a rule with a known exception written into it on day one.

## R3 — Constitution: 2.0.1 or 2.0.2

- **Decision**: 2.0.2 PATCH, a prepended Sync Impact Report, and a footer reading
  `2.0.2 … Last Amended <landing date>`.
- **Rationale**:
  - Governance says: "Amend this file in place, bump the version below … and
    prepend a Sync Impact Report". There is no exception for metadata.
  - Both earlier drifts came from edits that followed no procedure: `16a6c1e`
    added the 2.0.1 report without moving the footer, and `9e7c284` rewrote
    Principle IV with no report. A third silent edit would repeat the defect it
    corrects.
  - Precedent: both earlier PATCH reports read "a statement of fact corrected".
- **Alternatives considered**: set the footer to 2.0.1 / 2026-08-19 with no
  report. Rejected, because it is an unrecorded in-place edit, and its date is
  ambiguous between `16a6c1e` and `9e7c284`.

## R4 — How a row records that a later row changed it

- **Decision**: an inline `**Amended <date> by MV-120**: …` note, in the shape the
  table already uses. MV-111's retired clause stays visible and is marked
  WITHDRAWN (MV-29, MV-31, MV-68). MV-14's lead sentence, the one readers cite,
  now cites MV-92, and the note quotes the retired order (the MV-84 precedent
  for a false headline).
- **Rationale**: MV-111 says retirement never deletes history, and a rule is
  stated once and cited elsewhere.
- **Alternatives considered**:
  - A new row that supersedes MV-14. Rejected: MV-14's non-order clauses are
    still true.
  - Deleting MV-111's clause. Rejected: it erases history.

## R5 — Leg shapes

- **Decision**: four legs.
  1. `brain:{*.md,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md /(look for|try) `?mvac`?( on `?PATH`?)? first|`?mvac`? on `?PATH`?,? (then )?`?npx --no-install/ absent`
  2. `brain:.multivac/invariants.md /runnable multivac in order — `mvac` on PATH/ absent`
  3. `brain:.multivac/invariants.md /Amended 2026-09-13 by MV-120/ count=2`
  4. `brain:.specify/memory/constitution.md /^\*\*Version\*\*: 2\.0\.[01] \|/ absent`
- **Rationale**:
  - Leg 1: 4 hits at HEAD and 0 after the fix. It matches no correct text:
    `**`mvac` on PATH** —`, "then mvac on PATH.", "(mvac on PATH)". Backticks
    are optional, so plain prose is caught too. `CHANGELOG.md` is excluded
    because its 0.8.0 entry is history. The law file is excluded because MV-14's
    note quotes the old order.
  - Leg 3: `count` counts matching LINES and skips anchor-comment lines, so it
    reads 2 (MV-14 and MV-111). MV-120's own statement must not contain the
    literal.
  - Leg 4: anchored at line start, and Sync Impact Report lines carry no `**`.
- **Alternatives considered**:
  - Fifteen `each` legs, one per ID, in `CHANGELOG.md`. Not added: they catch a
    deletion from 0.10.0 but never the next release's omission, and MV-120's
    ceiling already names that gap.
  - A `count=1` on `2.0.2` plus an `absent` on `Version change: 2.0.2 →`.
    Rejected: every future amendment would have to edit MV-120, and the
    constitution's content is never machine-judged (MV-57).
  - A `unique` leg on the MV-111 note. Rejected: `unique` does not gate at commit.

## R6 — Does anything bite while the change is open?

- **Decision**: prove the bite in a scratch copy with MV-120 `active`.
- **Rationale**: while a change is open its row stays `proposed`, so a
  broken leg reads "pending … never blocks" (a green one reads ok). Measured in the clone with the row active:
  - docs reverted: `[absent]` names 4 files, exit 1;
  - MV-14 lead reverted: exit 1;
  - one note removed: count found 1, exit 1;
  - footer 2.0.0 or 2.0.1: exit 1;
  - enactment staged alone passes; beside a `DESIGN.md` edit, it is refused (MV-81).

## R7 — Date

- **Decision**: 2026-09-13. `change new` stamped that date in UTC at 21:25.
- **Risk**: if landing slips past a date change, five literals move together:
  the row date, both notes, leg 3 and the constitution's Last Amended.
