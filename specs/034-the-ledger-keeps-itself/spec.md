# Feature Specification: The ledger keeps itself

**Feature Branch**: `the-ledger-keeps-itself`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "The lifecycle must commit what it wrote, refuse a slug it would overwrite, prove a step with that step's own artifact, and report a failed tracker call as a failure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A gate is satisfied by its own change's artifact (Priority: P1)

An author opens `points-expire`. `specs/003-rapid-points-expire-rollout/` exists
from a change closed months ago. `change plan points-expire` finds it, calls the
SDD step proven, and moves on — the spec for this change was never written.

**Why this priority**: it is the SDD integration's flagship gate, satisfied by
somebody else's artifact. Every later gate inherits the same hole, and the
registry's own note already says the match is meant to be a suffix.

**Independent Test**: plant a directory whose name contains the slug as a
prefix, and confirm `change plan` still refuses.

**Acceptance Scenarios**:

1. **Given** `specs/003-rapid-<slug>-rollout/spec.md` and no directory ending in
   the slug, **When** `change plan <slug>` runs, **Then** it refuses and names
   the artifact it wants.
2. **Given** `specs/030-<slug>/spec.md`, **When** `change plan <slug>` runs,
   **Then** it proceeds, as today.
3. **Given** the same shapes at `apply` and `close`, **When** each runs,
   **Then** each behaves the same way.

---

### User Story 2 - A slug that would overwrite an archive is refused (Priority: P1)

An author runs `change new points-expire` for a second feature about the same
subject. `changes/archive/points-expire.md` already exists. Nothing objects; the
eventual `close` overwrites the archived change — the record the docs describe
as never deleted.

**Why this priority**: it destroys a closed change's record silently, and the
sibling command `roadmap add` already refuses exactly this.

**Independent Test**: archive a change, open one with the same slug, and confirm
the refusal.

**Acceptance Scenarios**:

1. **Given** an archived change with that slug, **When** `change new <slug>`
   runs, **Then** it refuses, naming the archive and how to proceed.
2. **Given** no archive, **When** `change new <slug>` runs, **Then** it opens as
   today.

---

### User Story 3 - What the lifecycle writes, the lifecycle commits (Priority: P1)

`close` prints the exact commit an operator should run, and leaves out the law
file it just edited. `land --landed` writes a status bump and commits nothing at
all. Both leave the brain dirty in a shared checkout, and the next `change new`
refuses over it.

**Why this priority**: the contract is stated in the code —
*nothing is left floating* — and two of its own writers break it.

**Independent Test**: run each, then confirm `git status` is clean for the
bookkeeping paths.

**Acceptance Scenarios**:

1. **Given** a close that repointed the law's links, **When** the commit line is
   printed, **Then** the law file is among its paths.
2. **Given** `change land <slug> --landed <repo>`, **When** it succeeds, **Then**
   the status bump is committed the way every other lifecycle write is.
3. **Given** a commit that cannot happen, **When** either runs, **Then** it
   degrades to the exact command, as today — never a half-done state.

---

### User Story 4 - `--abandon` tells the truth about what landed (Priority: P2)

A change with landed repos is abandoned. The archive records *nothing landed*.

**Why this priority**: it writes a false sentence into the permanent record. It
is P2 only because the change is being abandoned anyway.

**Acceptance Scenarios**:

1. **Given** a change with at least one repo at `landed`, **When** `--abandon`
   runs, **Then** the record names what landed instead of denying it.

---

### User Story 5 - A failed tracker call is reported as a failure (Priority: P1)

`roadmap sync` prints `#12 up to date` or `#12 closed`. On GitHub the update
always failed — `gh issue edit` has no `--label` — and the failure was caught
and printed as *not found in the tracker*, a different fact. `closeIssue`'s
error is swallowed entirely.

**Why this priority**: it is the tool reporting success it did not have, in the
one place that talks to somebody else's system.

**Independent Test**: with a tracker binary that exits non-zero, confirm the
line says what failed.

**Acceptance Scenarios**:

1. **Given** GitHub as the tracker, **When** an issue is updated, **Then** the
   flag used is the one `gh` documents and the call succeeds.
2. **Given** any tracker call that fails, **When** `roadmap sync` prints,
   **Then** the line names the failure, not a guess at its cause.
3. **Given** a call that fails because the issue is gone, **When** it prints,
   **Then** it still refuses to create a second issue, as today.

---

### Edge Cases

- Two artifacts both ending in the slug: the existing resolver takes the first
  in sorted order, unchanged.
- A slug that is a suffix of a longer slug (`expire` and `points-expire`): the
  suffix match must not let `expire` be satisfied by `030-points-expire`. The
  separator before the slug is part of the match.
- `close` on a change whose reservation was released: the law is still repointed,
  so it is still staged.
- A tracker with no label flag documented: it gets no entry rather than a guess
  (Principle V).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An SDD artifact glob MUST match the slug as a suffix of the
  directory name, with its separator, not as a substring.
- **FR-002**: `change new` MUST refuse a slug whose archived change exists,
  naming it.
- **FR-003**: The commit `close` prints MUST include every path it edited,
  including the law file when links were repointed.
- **FR-004**: `land --landed` MUST commit its bookkeeping like every other
  lifecycle write.
- **FR-005**: `--abandon` MUST describe what actually landed.
- **FR-006**: A tracker's label flag MUST come from its registry entry, because
  the vendors' flags differ, and MUST be what that vendor documents.
- **FR-007**: A failed tracker call MUST be reported as the failure it was, with
  the tool's own message, and MUST still never create a second issue.
- **FR-008**: No new runtime dependency.

### Key Entities

- **Bookkeeping paths**: the change file, the law row, a status bump — what the
  lifecycle writes into the brain and must commit.
- **Proof artifact**: the file an SDD step leaves behind, which a later step
  refuses without.
- **Tracker entry**: a vendor's verbs and flags, as data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A directory containing the slug but not ending in it does not
  satisfy any gate.
- **SC-002**: `change new` over an archived slug exits non-zero and writes
  nothing.
- **SC-003**: After `close`, the bookkeeping paths are clean.
- **SC-004**: After `land --landed`, the bookkeeping paths are clean.
- **SC-005**: An abandoned change with landed repos does not say nothing landed.
- **SC-006**: A failing tracker call produces a line naming the failure.
- **SC-007**: The existing suite passes, with any test asserting the old
  behaviour updated rather than deleted — including any that used `git add -A`
  to paper over an uncommitted lifecycle write.

## Assumptions

- spec-kit's directory layout is `NNN-<short-name>`, so a suffix match is what
  the registry note already claims and what the tool already documents.
- GitHub's `gh issue edit` takes `--add-label`; GitLab's `glab issue update`
  takes `--label`. Both are the vendors' documented flags.
- Label accumulation on GitHub — `--add-label` adds without removing the
  previous status label — is a known ceiling of this change, stated rather than
  silently accepted.
