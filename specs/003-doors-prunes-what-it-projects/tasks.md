# Tasks: doors prunes what it projects

**Input**: Design documents from `specs/003-doors-prunes-what-it-projects/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

Phases are dependency-ordered: the bound (Phase 1) is checkable before the
removal exists, the removal (Phase 2) is what Phase 3 tests, and Phase 4 only
makes sense once the code it cites is written. A box is ticked only after the
command that proves it has been run.

## Phase 1: The bound, before anything can remove

- [X] T001 In `test/doors/registry.test.ts`, assert that every entry declaring a
      `skill` declares it inside a directory of its own — the directory part is
      neither the target root nor an escape above it — so no entry can ever
      resolve the projected directory to the repository root (FR-002)
- [X] T002 Run `pnpm test` and confirm T001 passes against today's registry
      before any removal code exists (SC-002)

## Phase 2: The mirror

- [X] T003 In `src/commands/doors.ts`, build the source keep-set: every entry
      under the packaged skill directory as a relative path mapped to its kind,
      file or directory (FR-001)
- [X] T004 Remove, before the copy, every entry under the projected directory
      whose path is absent from the keep-set or present with a different kind;
      a removed directory takes its subtree with it (FR-001, FR-003, edge case:
      type conflict)
- [X] T005 Keep the removal inside the existing "packaged skill present" branch,
      so a missing source removes nothing and still prints its notice (FR-004)
- [X] T006 Scope the destination to `join(dir, dirname(entry.skill))` — the
      entry's own directory, never its parent — and state the rule and the bound
      in a comment citing MV-73, in the words the anchor pins (FR-002, FR-005)

## Phase 3: The tests (each maps to a user story)

- [X] T007 In `test/doors/doors.test.ts`, add the removal test named for what it
      proves — a file the source no longer has is deleted from the copy: plant a
      retired file, a retired directory with a file under it, a user-authored
      file, and an edit to a projected file; run `doors`; assert all four are
      resolved to the source (Story 1, Story 3, FR-001, FR-003, FR-007, SC-001)
- [X] T008 In the same test, plant a file where the source has a directory,
      run `doors`, and assert the path ends as the source's directory with the
      source's files under it (edge case: type conflict)
- [X] T009 Add the bound test: sibling skill directories under the same parent,
      in the shape `specify init` installs, plus a loose file directly under that
      parent; run `doors`; assert every one of them survives byte-for-byte
      (Story 2, FR-002, SC-002)
- [X] T010 Assert the run is idempotent — a second `doors` leaves the projected
      tree identical (FR-006)

## Phase 4: The law and the gates

- [X] T011 Point MV-73's anchor legs at what was actually written: the comment
      in `src/commands/doors.ts` and both tests in `test/doors/doors.test.ts`,
      the removal and the bound (Principle I)
- [X] T012 Run `pnpm run build && pnpm test` — every test green, including the
      MV-72 skill-copy comparison, which now passes without anyone deleting a
      file by hand (FR-009, SC-003, SC-004)
- [X] T013 Run `node dist/cli.js verify --strict` and confirm exit 0 with MV-73's
      legs resolving (Principle I)
- [X] T014 Confirm by inspection that the projected copy in this repository,
      `.claude/skills/multivac/`, is unchanged by the run — the mirror of a tree
      that already matched its source is a no-op (FR-006, FR-009)

## Phase 5: What a user reads

- [X] T015 State the mirror in `site/content/docs/reference/integrations.md`,
      beside what `doors` already documents writing for Claude Code: the
      directory is pruned to what the package ships, a file added there by hand
      goes with the rest, and a sibling skill is never touched. A deletion a
      user cannot find in the docs is a surprise, and this one is deliberate
      (FR-007, Story 2, Story 3)
