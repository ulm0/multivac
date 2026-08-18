# Feature Specification: The gate runs the code in this tree, not a copy of it

**Feature Branch**: `the-gate-runs-what-you-built`

**Created**: 2026-08-18

**Status**: Draft

**Input**: Two defects found while operating the tool. The commit hook ran a stale global install rather than the build in the tree it was gating, and the test run executed compiled tests whose sources no longer existed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The commit hook runs the multivac that governs this repo (Priority: P1)

An operator commits in a repo that declares or builds its own multivac. The gate
should run *that* one. Today it runs whatever is installed globally on the
machine, because the global is tried first and the repo's own copies are the
fallback.

The visible symptom is mild and the invisible one is not: a machine whose global
install is older enforces an older law table, an older set of modes, and older
refusals, against a repo that pinned something else on purpose.

**Why this priority**: it is the gate. A gate that runs a different program from
the one the repo declared is not enforcing the repo's rules.

**Independent Test**: in a repo whose own build differs from the global install,
commit and confirm the repo's build ran.

**Acceptance Scenarios**:

1. **Given** a repo holding its own built multivac, **When** the hook fires,
   **Then** that build runs, whatever is installed globally.
2. **Given** a repo declaring multivac as a dependency and no build of its own,
   **When** the hook fires, **Then** the declared dependency runs, whatever is
   installed globally.
3. **Given** a repo with neither, **When** the hook fires, **Then** a globally
   installed multivac runs, exactly as it does today.
4. **Given** a repo with none of the three, **When** the hook fires, **Then** the
   commit is not blocked and the report says plainly that nothing was verified.
5. **Given** any of the above, **When** the repo's own gates exist, **Then** they
   still run first and their exit code still wins.

---

### User Story 2 - A test run reflects the tree it was started from (Priority: P1)

An operator runs the test suite after switching branches. Every test that runs
should correspond to a source file that exists.

Today the compiler leaves output for sources that have been deleted or that
belong to another branch, and the runner executes whatever it finds. Both
directions are wrong: a test that no longer exists can fail a clean tree, and a
deleted test can keep passing for as long as its output survives.

**Why this priority**: measured this session — a rebase produced five failures
from a file absent from the branch. The silent direction is worse, and nothing
would surface it.

**Independent Test**: build, delete a test source, build again, and confirm the
deleted test does not run.

**Acceptance Scenarios**:

1. **Given** compiled output from an earlier state, **When** the suite is built
   and run, **Then** only tests whose sources exist in the tree are executed.
2. **Given** a test source deleted since the last build, **When** the suite is
   run, **Then** that test does not run and cannot report a pass.
3. **Given** a normal build with no stale output, **When** the suite is run,
   **Then** nothing about the result changes.

---

### Edge Cases

- A build fails partway, leaving no output at all: the hook falls through to the
  next runner rather than blocking the commit, and says nothing was verified if
  it reaches the end.
- The globally installed multivac is *newer* than the repo's: the repo's still
  wins. Which version governs a repo is the repo's declaration to make, not the
  machine's.
- Output exists for a source that was renamed: it is removed with everything
  else, because the whole directory is cleared rather than reconciled file by
  file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The commit hook MUST prefer the multivac built in the repository it
  is gating, over one declared as that repository's dependency, over one
  installed on the machine.
- **FR-002**: A repository with none of the three MUST NOT have its commit
  blocked, and MUST be told plainly that nothing was verified.
- **FR-003**: The hook MUST continue to run the repository's own gates first,
  with their exit code winning.
- **FR-004**: Building the project MUST clear its compiled output before
  compiling, so no artifact survives whose source is gone.
- **FR-005**: The test run MUST execute only tests whose sources exist in the
  tree at the moment of the run.
- **FR-006**: The clearing MUST work on any platform the project supports,
  without adding a dependency.
- **FR-007**: The law row governing both MUST land in the same change, with
  anchors that resolve against the code.

### Key Entities

- **Runner**: a multivac that can be executed for this repository. Three
  candidates, ordered from most specific to least: the repository's own build,
  its declared dependency, the machine's install.
- **Compiled output**: the directories the build writes. Derived entirely from
  sources, therefore safe to clear, and unsafe to keep.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a repository holding its own build, the hook runs that build,
  regardless of what is installed globally.
- **SC-002**: No test can run whose source is absent from the tree.
- **SC-003**: A deleted test cannot report a pass on any subsequent run.
- **SC-004**: A repository with no runnable multivac still commits, and is told.

## Assumptions

- Most specific wins. A repository that builds or declares a multivac has stated
  which one governs it; a global install is whatever the machine happens to
  have, including on somebody else's laptop.
- Correctness beats the cost of a full rebuild. The project compiles in seconds,
  and an incremental build that can execute a deleted test is not a saving.
- Clearing whole output directories beats reconciling them file by file: fewer
  states, and no way to be half-right.
