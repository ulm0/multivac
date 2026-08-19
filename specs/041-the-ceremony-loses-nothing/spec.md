# Feature Specification: The ceremony loses nothing

**Feature Branch**: `the-ceremony-loses-nothing`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "close is the one command that claims to be careful, and four things disappear through it without a word."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A claim is not orphaned by its own close (Priority: P1)

An author writes a claim's anchors into the change file while drafting. `close`
verifies the claim — the anchors are there, it is green — and archives the
file. From then on nothing evaluates those anchors, because the parser never
reads `changes/archive/`. The row is active and unanchored, and the run that
made it so reported success.

**Why this priority**: it is the exact failure this tool exists to prevent, in
the ceremony that exists to prevent it.

**Acceptance Scenarios**:

1. **Given** a claim whose only anchors live in the change file being closed,
   **When** `close` runs, **Then** it refuses, naming the claim and where its
   anchors need to live instead.
2. **Given** a claim anchored anywhere else as well, **When** `close` runs,
   **Then** it proceeds.

---

### User Story 2 - An archive is never overwritten (Priority: P2)

Two branches close the same slug. The second write lands on top of the first,
and the record the docs call never deleted is gone.

**Acceptance Scenarios**:

1. **Given** an archive that already exists for this slug, **When** the archive
   is written, **Then** it refuses, naming the file.
2. **Given** no archive, **When** it is written, **Then** it is written.

---

### User Story 3 - A retired row is as undeletable as an active one (Priority: P2)

MV-107 refuses a row that leaves `active`. Retirement is the sanctioned exit,
so the retired rows are the record of what a rule used to be — and deleting one
passes green.

**Acceptance Scenarios**:

1. **Given** a commit that removes a row which is `retired` at HEAD, **When**
   the hook runs, **Then** it is refused on the same terms as an active one.
2. **Given** a `proposed` row disappearing, **When** the hook runs, **Then** it
   is allowed: a reservation given back is what `close --abandon` does.

---

### User Story 4 - A dropped key is said out loud (Priority: P3)

The lifecycle rewrites a change file and silently drops any frontmatter key it
does not know. The scaffold warns about it in prose; the drop itself says
nothing.

**Acceptance Scenarios**:

1. **Given** a change file carrying an unknown key, **When** a lifecycle step
   rewrites it, **Then** the key is named as dropped.

---

### Edge Cases

- A claim anchored both in the change file and in the code: allowed — the code
  anchor survives the archive, which is the whole question.
- An archive written by a command that is re-run after a failure: refused,
  because the file already exists; the operator moves it or picks another slug.
- A row that goes `retired` → absent across two commits: each commit is judged
  on its own, and the second is the one refused.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `close` MUST refuse when a declared claim's only anchors live in
  the change file being archived.
- **FR-002**: The archive write MUST refuse to overwrite an existing archive.
- **FR-003**: A row `retired` at HEAD and absent from the index MUST be refused
  like an active one.
- **FR-004**: A `proposed` row disappearing MUST stay allowed.
- **FR-005**: A frontmatter key the lifecycle drops MUST be named when it is
  dropped.
- **FR-006**: No new runtime dependency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A change whose claim is anchored only in its own file is refused
  at close, and the claim is named.
- **SC-002**: Closing over an existing archive refuses.
- **SC-003**: Deleting a retired row is refused; dropping a proposed one is not.
- **SC-004**: Rewriting a change file with an unknown key names it.
- **SC-005**: The suite passes.

## Assumptions

- `close`'s speckit ledger — passing when no artifact ever existed — is out of
  scope. MV-110 named it as a gate-design question and its own change, and
  reversing that here without new evidence would be churn.
- `--abandon` reporting rather than refusing over landed repos is likewise
  MV-110's recorded decision, and stays.
