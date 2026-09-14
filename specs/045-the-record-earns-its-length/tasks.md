---

description: "Task list for the-record-earns-its-length"
---

# Tasks: The record earns its length

**Input**: `specs/045-the-record-earns-its-length/`

**Where**: the change worktree `.multivac/worktrees/the-record-earns-its-length/brain`,
after `change apply`.

## Phase 1: Setup

- [X] T001 `node dist/cli.js change apply the-record-earns-its-length`; confirm the worktree is on branch `the-record-earns-its-length`

## Phase 2: US1 — MV-120 in one screen (P1)

- [X] T002 [US1] Replace MV-120's statement cell in .multivac/invariants.md with the verified ≤400-word text (bold lead verbatim, three halves, what is mechanical, every ceiling with its scope)

## Phase 3: US2 — notes shorter than their rules (P2)

- [X] T003 [US2] Replace the MV-14 and MV-111 `**Amended 2026-09-13 by MV-120**` notes in .multivac/invariants.md with the verified ≤60-word texts (MV-14 quotes the retired order; MV-111 keeps WITHDRAWN, MV-112 and "a forced read, not a revert")

## Phase 4: US3 — the changelog for the person installing (P1)

- [X] T004 [P] [US3] Apply the 18 verified CHANGELOG.md edits: 0.10.0 entry ≤1500 words, every prior ID still named, no claim added
- [X] T005 [P] [US3] Shorten the 0.2.0 MV-72 bullet in CHANGELOG.md to ≤40 words

## Phase 5: Polish

- [X] T006 Run the quickstart.md word counts, and confirm the MV-121 reservation row is gone from .multivac/invariants.md
- [X] T007 In the worktree: `pnpm run build`, `verify --strict` (0 blocking broken), `node --test "dist-test/**/*.test.js"` (all pass)
- [X] T007a Bite in a scratch clone of the branch, with the open change file moved aside (MV-120 is active): reverting DESIGN.md gives exit 1 on `[absent]`; dropping the date from MV-111's note literal gives exit 1 on `[count]` (SC-006)
- [X] T008 Commit on the branch, staging only .multivac/invariants.md, CHANGELOG.md and this ledger
- [X] T009 /speckit.converge until Converged

## After the tasks — the lifecycle, not the ledger

1. Merge into main, then `change land the-record-earns-its-length --landed brain`.
2. `change close the-record-earns-its-length`, then commit the archive.
3. Push a `close-` branch and open an MR. A human reads MV-120 before merging.

## Dependencies

- T001 precedes all edits.
- T002 and T003 touch the same file, so they run in sequence.
- T007 precedes T008.
