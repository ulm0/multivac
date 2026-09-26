# Feature Specification: What the SDD writes in the brain lands with the change

**Feature Branch**: `071-sdd-artifacts-land`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "close stages the SDD artifacts the closing slug owns, from the brain's own status; apply equips a cloned or created repo before it carries the SDD files onto the change branch; the harness directories that are not code are derived from the declared scaffold's integrations. Adds MV-144, amends MV-142."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The proof of a step lands with the change (Priority: P1)

Every gate in the lifecycle demands an artifact: a spec before planning, a plan
and a task list before applying, an archived proposal before closing. Those files
are written in the brain, and the commit the lifecycle prints at close stages the
change file, the law, the graphs and the governance graph — not them. The
operator either notices `git status` or the branch merges without the proof the
gates asked for.

**Why this priority**: a gate whose evidence never reaches the branch is a gate
that only ran on one machine. Everything else in this feature is smaller.

**Independent test**: close a change in an ecosystem with an SDD declared and
confirm the printed commit stages the feature directory the slug owns, including
a file deleted inside it.

**Acceptance Scenarios**:

1. **Given** a closing change whose SDD wrote a feature directory for its slug in the brain, **When** close prints its commit, **Then** every untracked and modified path under that directory is in the pathspec.
2. **Given** a file deleted inside that directory, **When** close prints its commit, **Then** the deletion is staged too.
3. **Given** an openspec ecosystem, **When** close prints its commit, **Then** the change directory, its archive entry and the capability specs the archive rewrote are all in the pathspec.
4. **Given** a tracked project document the run did not write, dirty in the working tree, **When** close prints its commit, **Then** it is named on its own line and is not staged.
5. **Given** an ecosystem with no SDD declared, or a run with the SDD skipped, **When** close prints its commit, **Then** the pathspec is what it is today and nothing new appears.
6. **Given** an SDD that wrote nothing for this slug, **When** close prints its commit, **Then** no empty pathspec is produced.

### User Story 2 - A repo the lifecycle just made is equipped before its artifacts move (Priority: P2)

`change apply` clones or creates a repo, makes its worktree and carries the SDD
files onto the change's branch, and equips the repo afterwards. The vendor init
then runs over a checkout whose artifacts were just carried out of it, so it
writes a second copy of what the change already moved.

**Why this priority**: it costs one vendor init per new repo and leaves files the
operator has to reconcile, but it is a one-time cost per repo rather than a
per-change one.

**Independent test**: apply a change naming a repo that does not exist yet and
confirm the vendor init ran before the carry, and that the checkout does not end
with a second copy of the carried artifacts.

**Acceptance Scenarios**:

1. **Given** a change naming a repo that is not on disk, **When** apply runs, **Then** the repo is created or cloned, equipped, and only then branched and carried.
2. **Given** a repo already on disk and equipped, **When** apply runs, **Then** nothing is installed again and the carry behaves as it does today.

### User Story 3 - The directories a declared tool installs into are not code (Priority: P2)

The code gate treats the harness directories as non-code, derived from the door
targets multivac projects. A declared SDD's own integrations install into other
directories, so a brain that declares openspec and no grapher is refused its own
first commit over a directory one of those integrations wrote.

**Why this priority**: it blocks the first commit of a fresh ecosystem on some
adapter combinations, which is where a tool makes its first impression.

**Independent test**: in a fresh brain with openspec declared and no grapher, run
the step 0 commit through the installed hooks and expect it to pass.

**Acceptance Scenarios**:

1. **Given** a declared scaffold whose integrations install into a harness directory, **When** the code gate classifies a path under it, **Then** the path is not code.
2. **Given** a path under a directory no declared integration names, **When** the gate classifies it, **Then** it is code, as before.

### Edge Cases

- A slug whose feature directory exists in a code repo rather than the brain: close stages only the brain's, because the repos' own commits are theirs to make.
- Two changes closing near each other: each stages only the paths under its own slug's directories, never the other's.
- An artifact directory whose name does not carry the slug: nothing is derived for it, and the operator is told what was staged.
- A brain that is also a code repo: the same rule, one root.
- A repo declared read-only: never equipped, never carried, and apply already refuses a change that names one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: At close, multivac MUST stage every path the brain's own status reports under an artifact directory the closing slug owns, including deletions.
- **FR-002**: The pathspec MUST be built from paths that exist in status, so no empty or non-matching pathspec is ever printed.
- **FR-003**: A tracked file the run did not write, such as a project document or a configuration file, MUST be reported on its own line and MUST NOT be staged.
- **FR-004**: With no SDD declared, with the SDD turned off, or with the step skipped for one run, the pathspec MUST be exactly what it is today.
- **FR-005**: `change apply` MUST clone or create every missing repo it names, equip them, and only then branch and carry the SDD files.
- **FR-006**: The directories that are not code MUST include those the declared scaffold's own integrations install into, derived from the declarations rather than from a fixed list.
- **FR-007**: The law MUST state the new rule as MV-144 and carry the amended MV-142, with anchors that fail if any of this regresses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a close with an SDD declared, zero artifact files under the closing slug's directories are left uncommitted.
- **SC-002**: Zero files the run did not write are staged by that commit.
- **SC-003**: A fresh brain with openspec declared and no grapher passes its own first commit through the installed hooks; measured today, it is refused.
- **SC-004**: Applying a change that creates a repo leaves zero duplicate copies of the carried artifacts in the checkout.
- **SC-005**: The law's own check passes with the new and amended rows anchored, and the change closes with its declared claims resolving.

## Assumptions

- The artifact directories a slug owns are derived from the SDD adapter's declared artifact paths, which already carry the slug placeholder.
- Capability specs an openspec archive rewrites live under the paths that archive names, so they can be derived from the archive entry rather than guessed.
- Code repos commit their own artifacts the way they land work; close continues to print that instruction for them rather than staging across repos.
