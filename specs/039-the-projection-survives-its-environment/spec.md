# Feature Specification: The projection survives its environment

**Feature Branch**: `the-projection-survives-its-environment`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Four places where the projection works on the author's machine and not on the next one."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A linked worktree runs the repo's own gates (Priority: P1)

A team uses `git worktree`. multivac's shim chains the repo's own
`.git/hooks/<name>` first — except in a worktree, where it probes
`$GIT_DIR/hooks` and `$GIT_DIR` is `.git/worktrees/<id>`, which has no `hooks/`
at all. The project's own lefthook or hand-written gate never runs, and the
file's docstring says worktrees resolve.

**Why this priority**: it silently disables somebody else's gate, which is the
one thing this shim exists never to do.

**Independent Test**: create a linked worktree, put a hook in the common dir,
commit from the worktree, confirm the hook ran.

**Acceptance Scenarios**:

1. **Given** a linked worktree and a hook in the common dir, **When** a commit
   runs the shim, **Then** that hook runs first and its exit code wins.
2. **Given** an ordinary checkout, **When** anything resolves the hooks dir,
   **Then** the answer is what it was — the two spellings are identical there.
3. **Given** `doctor`, **When** it reports the hooks directory, **Then** it
   names the one git will actually use.

---

### User Story 2 - A declared command means one thing (Priority: P2)

An operator declares `refresh: sh -c 'graphify update . && echo done'`. It
works after an edit and fails at close, because one runner embeds the string in
a shell and the other splits it on spaces.

**Acceptance Scenarios**:

1. **Given** a declared refresh with quotes or an operator, **When** it runs on
   either path, **Then** it means the same thing.
2. **Given** a plain one-word-per-argument command, **When** it runs, **Then**
   nothing changes.

---

### User Story 3 - One mangled file is one notice (Priority: P2)

A door in the third of six repos has a mangled managed block. The projection
throws, and repos four to six get no door and no hooks.

**Acceptance Scenarios**:

1. **Given** a mangled managed block in one repo, **When** `doors` runs,
   **Then** that file is reported by name and every other repo is still
   projected.
2. **Given** a file with two marker pairs, **When** the projection runs,
   **Then** it refuses rather than updating the first and leaving the second.
3. **Given** `init` meeting a mangled door, **When** it runs, **Then** the door
   is a notice and the brain is still scaffolded.

---

### User Story 4 - "Armed" means the shim still runs multivac (Priority: P2)

Someone edits `.multivac/hooks/pre-commit` down to `exit 0`. `doctor` reports
the hooks installed and `--strict` calls the gate armed.

**Acceptance Scenarios**:

1. **Given** one of our shims gutted, **When** `doctor` reports, **Then** it
   says the gate is not armed.
2. **Given** an intact shim, **When** it reports, **Then** nothing changes.

---

### Edge Cases

- `--git-common-dir` on a plain repo: identical to `--git-dir`; verified before
  the change, so the swap is a no-op outside a worktree.
- A refresh command that is a bare binary with plain arguments: a shell runs it
  identically; only quoting and operators change meaning.
- A file with one marker and not the other: already refused; that stays.
- A hook file that is somebody else's: never rewritten, never judged as ours.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every resolution of a repo's hooks directory MUST use the common
  dir, in the shim and in its Node mirror alike.
- **FR-002**: The comment describing that resolution MUST say what the code
  does.
- **FR-003**: A declared refresh command MUST be interpreted identically by
  every runner that runs it.
- **FR-004**: A managed-block failure MUST be reported per file and MUST NOT
  stop the rest of the run.
- **FR-005**: A second marker pair MUST be refused rather than half-updated.
- **FR-006**: `doctor` MUST judge our own shim by what it runs, not by its
  presence.
- **FR-007**: MV-73's headline MUST claim only the pruning it performs.
- **FR-008**: No new runtime dependency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a linked worktree, a hook in the common dir runs on commit.
- **SC-002**: Outside a worktree, the resolved hooks directory is unchanged.
- **SC-003**: A refresh with an operator behaves the same on both runners.
- **SC-004**: With one mangled door among several repos, the others are still
  projected and the broken one is named.
- **SC-005**: A gutted shim is reported as not armed.
- **SC-006**: The suite passes.

## Assumptions

- `hooks/` is not a per-worktree path in git, so the common dir is the correct
  answer everywhere — measured on git 2.55.
- A declared command is the operator's shell line: Principle V says an adapter
  entry carries what the vendor documents, and the operator's own `refresh:`
  is theirs to write. Making both runners shell is the smaller surprise.
- The staleness of a build (MV-92's ceiling) is out of scope and stays stated.
