# Feature Specification: Session zero equips every repo before it drafts law

**Feature Branch**: `061-session-zero-equips` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 13 of the 2026-09-14 plan (clusters C02 and N24, report item 41).

## Context: what was measured

Measured 2026-09-16 on this repository's integration branch.

1. **`init` prints one flow.** It picks discovery or interview from `lsFiles(dir).length > 0`. A new brain for existing code in other repos is an empty directory, so it is told to interview.
2. **`init` never asks for `repos:`.** A config edited after the first commit is refused by `verify` until a change is open, and no change exists in session zero.
3. **The protocol skips setup.** The skill, `discovery.md` and `interview.md` never run `repos sync`, never write a project document, and project doors last. So an agent drafts law over repos that are not cloned, not equipped and not graphed.
4. **`seed` reports files only.** It says nothing about whether each repo has its graph and its project document.

## User Scenarios & Testing

### US1 - `init` lays out the whole of session zero (P1)
1. **Given** any brain, **when** `init` finishes, **then** it prints, in order:
   - declare `repos:` before the first commit;
   - the commit;
   - load the skill;
   - `repos sync`;
   - both flows, marking the one that fits this directory;
   - the project document, when the declared SDD gates one;
   - enact the rows, then `doors` and `verify`.

### US2 - `seed` reports each repo's setup (P1)
1. **Given** declared repos on disk, **when** `seed` runs, **then** the report carries, per repo, the grapher's state and the project document's verdict, with the command that fixes each.
2. The third open question names the written project documents it found.

### US3 - The protocol runs setup before law (P1)
1. The skill, `discovery.md` and `interview.md` order the work as sync, seed, project document, law, doors.

## Requirements
- **FR-001:** The `init` next steps are printed as described in US1.
- **FR-002:** `seed` reads `initState` and `projectDocVerdict`. It runs no vendor command and reaches no network.
- **FR-003:** The skill copy stays byte-identical (MV-72).
