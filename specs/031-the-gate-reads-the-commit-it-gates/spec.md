# Feature Specification: The gate reads the commit it gates

**Feature Branch**: `the-gate-reads-the-commit-it-gates`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "A check that reads the index must read the index the commit is actually being composed in; and the law's death must be gated the way its birth is."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - `git commit -a` is gated (Priority: P1)

A maintainer edits the law file and a source file, then commits the way they
always do: `git commit -am "..."`. The pre-commit hook runs `verify`, which
reads `.git/index` — a set of paths that does not include either edit, because
`-a` composes its commit in a temporary index that only the hook's environment
points at. The enactment check reports "no row enacted", the config check stays
silent, and the commit lands ungated.

**Why this priority**: it is the release's two newest gates, both bypassed by
the most common commit form, silently, in the direction that lets things
through. And it is unrecoverable: both checks are about the commit being
composed, so once it lands nothing looks again.

**Independent Test**: install the real hook in a scratch repo, stage an
offending pair, and commit with `-a`. The commit must be refused.

**Acceptance Scenarios**:

1. **Given** a row reaching `active` beside the code it anchors, **When** the
   commit is made with `git commit -a`, **Then** it is refused exactly as it is
   for a plain `git commit`.
2. **Given** a config edit with an open change, **When** the commit is made with
   `git commit -a`, **Then** MV-97's check sees the config among the staged
   paths.
3. **Given** a sibling repo being read during the same run, **When** any check
   reads it, **Then** it is read through its OWN index, never the hook repo's —
   the reason the ambient pointers are dropped in the first place.

---

### User Story 2 - A pathspec commit is judged on what it contains (Priority: P2)

A maintainer has two files staged and commits one of them:
`git commit -- one.txt`. The gate reads the index on disk, sees both, and can
refuse the commit over a path that is not in it.

**Why this priority**: it is the same defect in the other direction. It costs a
false refusal rather than a silent pass, so it is second — but a gate that
refuses for a reason the operator cannot see in their own commit is how a gate
gets disabled.

**Independent Test**: stage two paths, commit one by pathspec, and confirm the
verdict is about the committed path alone.

**Acceptance Scenarios**:

1. **Given** two staged paths where only one is being committed, **When** the
   hook runs, **Then** the check reports on the committed path only.

---

### User Story 3 - The law cannot die quietly (Priority: P1)

Someone deletes the one row whose tombstone is in their way, or removes
`.multivac/invariants.md` altogether, and commits. `verify` prints
`0 claims · 0 anchored`, exit 0, and every gate is green because there is
nothing left to break.

**Why this priority**: the tool's whole claim is that the brain cannot lie.
A brain with no law does not lie — it says nothing, which is worse, and today
that is the one edit no gate notices. Birth is gated (MV-81) and the config's
death is gated (MV-97); the law's own death is not.

**Independent Test**: in a brain, `git rm .multivac/invariants.md`, commit, and
confirm the commit is refused; delete a single active row and confirm the same.

**Acceptance Scenarios**:

1. **Given** a commit whose index removes `.multivac/invariants.md`, **When**
   the hook runs, **Then** it is refused, naming the file and the alternative.
2. **Given** a commit that removes a row which is `active` at HEAD, **When** the
   hook runs, **Then** it is refused, naming the row ids and pointing at
   retirement rather than deletion.
3. **Given** a row moved from `active` to `retired`, **When** the hook runs,
   **Then** it is NOT refused: retirement is the sanctioned way for a row to
   stop applying.
4. **Given** a `proposed` row being dropped — a reservation given back — **When**
   the hook runs, **Then** it is NOT refused: `change close --abandon` does
   exactly that.

---

### Edge Cases

- No HEAD yet (the first commit in a brain): there is no previous law to
  compare against, so the death check has nothing to say and says so.
- A consumer repo verifying against a mounted brain: the law file is not in
  that checkout's index, and MV-81 already declines to answer there. The death
  check declines on the same ground.
- The index cannot be read at all: both checks already report "not answered"
  rather than guessing, and that stays.
- A rebase or a merge running hooks with an ambient index: the same rule
  applies — the ambient index is this repo's, so it is the one to read.
- `GIT_INDEX_FILE` pointing at another repo entirely (a hook in repo A reading
  repo B): the pointer is dropped, because the repo is not the ambient one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A git read that asks about the index MUST use the ambient
  `GIT_INDEX_FILE` when, and only when, the repository being read is the
  repository that environment describes.
- **FR-002**: Every other git read MUST keep dropping the ambient pointers, so
  a sibling repo is never read through another repo's index.
- **FR-003**: The decision MUST be made by comparing resolved git directories,
  not by comparing paths as typed.
- **FR-004**: MV-81's enactment check and MV-97's config check MUST both see the
  paths the commit actually contains, under `git commit`, `git commit -a` and a
  pathspec commit alike.
- **FR-005**: A commit whose index removes the law file MUST be refused, naming
  the file and what to do instead.
- **FR-006**: A commit that removes a row which is `active` at HEAD MUST be
  refused, naming the ids, and pointing at retirement.
- **FR-007**: Moving a row to `retired`, and dropping a `proposed` row, MUST NOT
  be refused.
- **FR-008**: Where the answer cannot be known — no HEAD, unreadable index, the
  law not in this checkout — the check MUST say it did not answer, and MUST NOT
  gate.

### Key Entities

- **Ambient git environment**: the pointers git sets for a hook —
  `GIT_INDEX_FILE` above all — describing the commit being composed.
- **Staged paths**: what the commit contains, as opposed to what the working
  tree or the on-disk index holds.
- **Row state**: `proposed`, `active`, `retired` — the three states whose
  transitions the law's own gates are about.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A `git commit -a` that MV-81 refuses under a plain commit is
  refused identically — measured through a real installed hook, not by calling
  the function.
- **SC-002**: A pathspec commit is judged on its own paths only.
- **SC-003**: `git rm .multivac/invariants.md && git commit` exits non-zero.
- **SC-004**: Deleting one active row exits non-zero and names the row.
- **SC-005**: Retiring a row, and abandoning a reservation, still succeed.
- **SC-006**: A sibling repo read during a hook run still reports its own state,
  proving FR-002 did not regress.
- **SC-007**: The existing suite passes unchanged.

## Assumptions

- Git sets `GIT_INDEX_FILE` for hooks in every commit form; where it is unset,
  the on-disk index IS the commit's index and the current behaviour is already
  correct.
- Reading a lock file as an index is what git itself asks hooks to do; no
  attempt is made to interpret or write it.
- Retirement remains a deliberate, reviewable act — this change gates deletion,
  it does not invent a new lifecycle for rows.
