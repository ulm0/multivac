# Feature Specification: doors prunes what it projects

**Feature Branch**: `003-doors-prunes-what-it-projects`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "doors prunes what it projects: a file the source no longer has is deleted from the projected skill copy in the same run"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A file dropped from the skill stops appearing in the projection (Priority: P1)

A maintainer deletes a page from the skill the tool ships — it was merged into
another page, or it described a mechanism that no longer exists. They release,
the user upgrades, the user re-runs the projection command. Today the deleted
page is still sitting in the user's projected copy, and no future run will ever
remove it: the projection only ever adds. The user is now reading, and their
agent is now reading, a page the tool deliberately retired.

**Why this priority**: This is the defect. Everything else in this feature is a
bound on the fix.

**Independent Test**: Put a file in the projected copy that the source does not
have, run the projection, and the file is gone; every file the source does have
is present and byte-identical.

**Acceptance Scenarios**:

1. **Given** a projected copy holding a file the source no longer has, **When**
   the projection runs, **Then** that file is deleted.
2. **Given** a projected copy holding a whole directory the source no longer
   has, **When** the projection runs, **Then** the directory and everything
   under it is deleted.
3. **Given** a projected copy holding exactly what the source holds, **When**
   the projection runs, **Then** nothing is deleted and every file still matches
   the source byte for byte.
4. **Given** the projection has just run, **When** it runs again, **Then** the
   result is identical — the pass is idempotent, not a delete-and-restore cycle
   whose intermediate state anything could observe as loss.

---

### User Story 2 - Another tool's installation in the same parent survives (Priority: P1)

A user's repository has both this tool and another one installed into the same
harness. The other tool writes ten sibling directories next to the one this tool
owns, under one shared parent. If the removal pass judged the parent instead of
the directory this tool projects into, the next run would delete a different
tool's entire installation — silently, as a side effect of a command whose
declared job is to write one door.

**Why this priority**: Equal to Story 1. A fix that trades a stale file for
someone else's deleted installation is worse than the defect, and the two must
ship together or not at all.

**Independent Test**: Place sibling directories and loose files beside the
projected directory, under the same parent, run the projection, and every one of
them is untouched.

**Acceptance Scenarios**:

1. **Given** sibling directories under the same parent as the projected
   directory, **When** the projection runs, **Then** all of them and their
   contents are untouched.
2. **Given** a loose file directly under that shared parent, **When** the
   projection runs, **Then** it is untouched.
3. **Given** anything at all above the shared parent, **When** the projection
   runs, **Then** it is untouched.

---

### User Story 3 - A user who edited the projected copy learns whose directory it is (Priority: P2)

A user adds their own notes to a file inside the projected directory, or drops a
new file in beside the projected ones. On the next run their addition is gone.
This is the deliberate answer to the question the change raised, not an
oversight: the projected directory is the tool's, wholly, the same way the
managed block inside the shared door file is the tool's.

**Why this priority**: It is a consequence of Story 1 rather than a separate
mechanism, but it is a decision with a cost to a real person, so it is stated
where someone can disagree with it rather than left as an assumption.

**Independent Test**: Add a file the source does not have inside the projected
directory, run the projection, and it is gone — the same outcome as a retired
file, by the same rule.

**Acceptance Scenarios**:

1. **Given** a user-authored file inside the projected directory, **When** the
   projection runs, **Then** it is deleted, exactly as a retired file is.
2. **Given** a user-authored edit to a projected file, **When** the projection
   runs, **Then** the file is restored to the source's bytes.
3. **Given** a user-authored directory *beside* the projected directory, under
   the shared parent, **When** the projection runs, **Then** it survives — the
   supported place for a user's own content is outside the directory the tool
   owns.

---

### Edge Cases

- **The source is missing** (a broken or partial installation of the tool).
  Nothing is copied today and a notice is printed; nothing must be deleted
  either. A removal pass with no source to compare against would empty the
  user's projected directory on the strength of a bug in the tool's own
  packaging.
- **The projected directory does not exist yet** — a first run. There is nothing
  to remove; the run must behave exactly as it does today.
- **A file exists in the projection where the source has a directory of the same
  name, or the reverse.** The result must be what the source says, not a
  merge-shaped failure.
- **A symbolic link inside the projected directory pointing outside it.** The
  link may be removed, because it is inside the owned directory; whatever it
  points at must not be, because that is outside.
- **The projected directory holds files the user has committed to their
  repository.** Removal shows up as a deletion in their version control, which
  is the visible, reviewable outcome — and is the point: this project's own
  checks compare the two trees, and a stale file the tool refuses to remove
  fails them.
- **More than one harness declares a projected skill directory.** Every one of
  them mirrors, by the same rule, because the behaviour is dispatched on the
  kind of entry, never on its name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After a projection run, the projected skill directory MUST contain
  exactly the files the source holds, with the source's bytes, and nothing else.
- **FR-002**: Removal MUST be confined to the directory the tool projects into.
  No file, directory or link outside that directory may be removed, moved or
  altered by this pass — its parent above all.
- **FR-003**: A directory present in the projection and absent from the source
  MUST be removed with everything beneath it.
- **FR-004**: When the source is unavailable, NOTHING may be removed, and the
  run MUST report why, as it already does.
- **FR-005**: The rule MUST apply to every harness entry that declares a
  projected skill directory, by the entry's kind and never by its name.
- **FR-006**: Repeated runs MUST be idempotent: a second run changes nothing a
  first run left correct.
- **FR-007**: A file added under the projected directory by anyone other than
  the tool MUST be treated exactly as a retired file: removed. The tool MUST NOT
  attempt to tell one from the other.
- **FR-008**: The behaviour MUST stay offline and deterministic — the pass reads
  two directory listings and removes files; nothing else.
- **FR-009**: The tool's own repository, which tracks both the source tree and
  its projected copy, MUST end a run with the two trees identical.
- **FR-010**: The removal MUST happen in the same run as the write, under the
  same command, with no new flag, prompt or confirmation step. A user who has to
  ask for the mirror does not have one.

### Key Entities

- **Source tree**: the skill directory shipped inside the tool's own package.
  The single authority for what the projection should contain.
- **Projected directory**: the directory inside a target repository that the
  tool writes the skill into. Owned by the tool, entirely.
- **Shared parent**: the directory the projected directory sits in, which other
  tools also install into. Out of bounds, always.
- **Retired file**: a file that was in an earlier version of the source and is
  not in this one. Indistinguishable, on disk, from a file a user added.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A file planted in the projected directory that the source does not
  have is gone after exactly one run — not two, and not never.
- **SC-002**: Zero files outside the projected directory are removed by any run,
  demonstrated by an automated check that plants siblings under the shared
  parent and asserts they survive.
- **SC-003**: The tool's own two tracked copies of the skill tree stay identical
  file-for-file and byte-for-byte after a run, so the check that compares them
  passes without anyone deleting a file by hand.
- **SC-004**: 100% of the branches this adds — retired file, retired directory,
  missing source, first run, sibling survival — are covered by automated checks
  in the project's existing suite.
- **SC-005**: The pass adds exactly one extra listing of a directory holding
  fewer than a hundred files per target, and no network call, no subprocess and
  no model call — so the command's runtime is indistinguishable from today's.

## Assumptions

- The projected skill directory is the tool's to own. It carries the tool's
  name, it is created by the tool, and its entire content has one known source;
  nothing in it was ever authored in place. This is the same ownership the tool
  already asserts over the managed block it writes inside a shared door file,
  and the same one behind its rule that everything it creates lives under its
  own directory.
- Nothing on disk records who wrote a file. Preserving "user files" would mean
  guessing from a heuristic — a name pattern, a modification time — and reporting
  a guess as a fact is precisely what this project forbids itself. Removing
  everything the source does not have is the only rule that can be stated
  truthfully.
- A user with their own agent instructions has a supported place to put them:
  their own directory beside the projected one, which this feature must leave
  alone, and the shared door file, whose unmanaged parts the tool already
  preserves.
- The source tree is small — a handful of files — so comparing the two listings
  in full is cheaper than any incremental scheme, and the command already copies
  the whole tree on every run.
- The projection command is expected to write; it is not a read-only inspection
  command, and its documented job is already to overwrite what it owns.
