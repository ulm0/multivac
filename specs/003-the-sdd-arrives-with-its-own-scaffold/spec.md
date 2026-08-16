# Feature Specification: The SDD arrives with its own scaffold

**Feature Branch**: `003-the-sdd-arrives-with-its-own-scaffold`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "An adapter declares the scaffold that makes its steps runnable, so a declared-but-uninstalled SDD is resolved by the lifecycle instead of switched off."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Declaring the tool is enough to start using it (Priority: P1)

A maintainer declares a spec-driven development tool in their project's
configuration and runs the first lifecycle command. The tool has never run in
this repository, so none of the chat commands the lifecycle is about to print
exist yet, and the artifact the next lifecycle command will refuse without can
therefore never be written. Today the only ways forward both switch the check
off: a one-run escape flag, or turning the automation off in configuration —
each of them disabling the gate in order to fix the very absence that made it
fire. After this feature the lifecycle sets the tool up, using the tool's own
setup command, and the work continues.

**Why this priority**: This is the whole defect, and it is a deadlock rather
than an inconvenience: the change that would install the tool is the change the
tool's own gate refuses to plan. Shipped alone it opens the door.

**Independent Test**: In a repository that declares a spec-driven tool which has
never run there, run the first lifecycle command. The tool's setup must have run
by the time the command returns, and the artifact whose absence meant "not set
up here" must exist.

**Acceptance Scenarios**:

1. **Given** a repository declaring a spec-driven tool whose setup artifact is
   absent, **When** the maintainer runs the lifecycle command that opens a
   change, **Then** the tool's own setup command runs in that repository and the
   setup artifact exists afterwards.
2. **Given** the same repository, **When** the setup runs, **Then** the exact
   command is printed **before** it is run, so a maintainer watching the
   terminal knows what is executing and why, and can stop it.
3. **Given** a repository whose setup artifact is already present, **When** any
   lifecycle command runs, **Then** the setup command is not run and no line
   about it is printed. Setting up an already-set-up repository is not free —
   it downloads templates and can overwrite them.
4. **Given** a repository that declares no spec-driven tool, or one whose
   automation is switched off, or a single run with the one-run escape flag,
   **When** any lifecycle command runs, **Then** nothing about this feature
   happens at all.

---

### User Story 2 - The setup command is the vendor's, quoted, never derived (Priority: P1)

A maintainer declares a tool whose setup command this project has not verified.
The dangerous outcome is not silence — it is a plausible command, derived from
the tool's name, run against their repository. A wrong setup command can create
directories nobody asked for, overwrite files, or simply fail in a way that
reads like the maintainer's mistake.

**Why this priority**: Equal to User Story 1, because it is what makes User
Story 1 safe. A feature that runs commands on the operator's behalf must run
only commands somebody actually verified.

**Independent Test**: For a declared tool whose setup command is not recorded,
run the lifecycle command. Nothing must be executed; the output must say the
setup command is not known here and name what the maintainer should do instead.

**Acceptance Scenarios**:

1. **Given** a declared tool with a recorded setup command, **When** the setup
   runs, **Then** the command executed is byte-for-byte the recorded one.
2. **Given** a declared tool with **no** recorded setup command and no setup
   artifact present, **When** a lifecycle command runs, **Then** nothing is
   executed, the output states plainly that this project does not know that
   tool's setup command and will not guess one, and it names the tool's install
   line so the maintainer can proceed by hand.
3. **Given** a tool name that is not a known adapter at all, **When** a
   lifecycle command runs, **Then** the existing "unknown adapter" message is
   what appears and this feature adds nothing to it.

---

### User Story 3 - A setup that fails says so, in the tool's own words (Priority: P2)

The setup command reaches the network. It can fail: no connectivity, a rate
limit, an unreadable target directory, a tool version that rejects a flag.

**Why this priority**: Without it, the failure mode of a new network call is an
unhandled crash in the middle of a lifecycle command, or — worse — a silent
success message for something that did not happen.

**Independent Test**: Make the tool's setup command exit non-zero with a message
on its error stream, then run the lifecycle command. The lifecycle must report
the tool's own message, hand back the command to run by hand, and must not
crash.

**Acceptance Scenarios**:

1. **Given** a setup command that exits non-zero, **When** the lifecycle runs
   it, **Then** the failure is reported with the tool's own error text, the
   exact command is repeated so it can be run by hand, and the lifecycle command
   continues rather than throwing.
2. **Given** a setup command that exits zero but leaves the setup artifact
   absent, **When** the lifecycle runs it, **Then** this is reported as a
   failure too — a success message is never printed for an artifact that is not
   there.
3. **Given** a failed setup, **When** the lifecycle command that gates on a
   later artifact continues, **Then** it still refuses on its own terms: the
   artifact the setup would have made writable is still missing, so nothing is
   let through by the failure.
4. **Given** a repository where the tool's binary is not installed at all,
   **When** the setup would run, **Then** nothing is executed, the missing
   binary is named, and the tool's install line is printed — the same shape
   already used when a validator binary is missing.

---

### User Story 4 - Nothing that must stay offline gains a network call (Priority: P1)

Three commands in this project are required never to touch the network. The
setup command downloads templates.

**Why this priority**: Equal to User Story 1. A network call in an offline
command is a rule broken, not a bug to be fixed later, and it would be
discovered on an aeroplane or in a locked-down build.

**Independent Test**: Search the sources of the three offline commands for any
reference to the setup routine. There must be none, and this must be checked
mechanically rather than by review.

**Acceptance Scenarios**:

1. **Given** the offline commands, **When** their sources are inspected, **Then**
   they contain no call to the setup routine, and a rule in the project's law
   asserts that absence.
2. **Given** the health report, **When** it runs in a repository that declares a
   tool which has never run there, **Then** it *reports* the state and names the
   setup command as something the lifecycle will run — and does not run it.

---

### Edge Cases

- The repository is one of several: the setup artifact lives in a sibling
  repository rather than the one the lifecycle runs in. Finding it anywhere
  means "set up"; nothing runs.
- The setup artifact is absent everywhere. Only one repository can be set up
  automatically — the one the lifecycle itself is anchored in — and the output
  says which.
- The tool's binary is on the path but the setup command is refused by it (an
  unknown flag on an older version). This is the failing-setup case; the tool's
  own message is what the maintainer sees.
- Two lifecycle commands run concurrently in the same repository and both find
  the artifact absent. The tool's own setup command is the arbiter of that race;
  this feature does not invent a lock for a command that runs once per
  repository, and a second run is the tool's own idempotent setup.
- The setup artifact exists but is empty or partial (an interrupted first run).
  Presence is the declared signal; a partial setup is the tool's problem to
  report when its own steps run, and the maintainer can delete the artifact to
  force a fresh setup.
- The tool's setup is confused with installing the tool. It is not: the binary is
  still installed by the maintainer, and this project never installs foreign
  software.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each spec-driven adapter MUST be able to declare its scaffold: the
  repository-relative artifact whose absence means "this tool has never run
  here", and the vendor's own setup command, verbatim.
- **FR-002**: A declared setup command MUST have been verified by running it,
  and what it writes MUST be recorded alongside it. A setup command that has not
  been verified MUST NOT be recorded at all.
- **FR-003**: The lifecycle MUST run the declared setup command when the
  scaffold artifact is absent from every repository it searches.
- **FR-004**: The lifecycle MUST print the exact command before running it.
- **FR-005**: The lifecycle MUST skip the setup, silently, when the scaffold
  artifact is present in any searched repository.
- **FR-006**: The setup MUST run at the lifecycle points where the tool's steps
  are first expected — the point that opens a change, and the points that refuse
  without an artifact — and MUST run before those refusals are evaluated.
- **FR-007**: The three commands required to stay offline MUST NOT invoke the
  setup, and the project's law MUST carry a mechanically checked assertion of
  that absence.
- **FR-008**: A declared tool with no recorded setup command MUST produce a
  stated gap — naming the tool, saying no setup command is known and that none
  will be guessed — and MUST NOT execute anything.
- **FR-009**: A setup command whose binary is not found MUST be reported with
  the tool's install line, and nothing MUST be executed.
- **FR-010**: A setup command that fails MUST be reported using the tool's own
  error output, with the command repeated for a manual run, and MUST NOT throw
  or change the lifecycle command's exit code by itself.
- **FR-011**: A setup that exits zero but does not produce the scaffold artifact
  MUST be reported as a failure, never as a success.
- **FR-012**: The one-run escape flag and the configuration switch that disable
  the tool's steps and gates MUST disable the setup identically.
- **FR-013**: The setup MUST NOT be treated as, or substituted for, any of the
  tool's own steps: the steps remain chat commands an agent runs, and no step is
  ever satisfied by the setup having run.
- **FR-014**: The health report MUST state, for a declared tool whose artifact is
  missing, that the lifecycle runs the recorded setup command — and MUST NOT run
  it.
- **FR-015**: The project's user-facing documentation MUST distinguish
  *installing the tool* (never done by this project) from *running the tool's
  own setup in this repository* (done by the lifecycle, on an explicit
  declaration).

### Key Entities

- **Scaffold**: a per-adapter declaration with exactly two operative fields —
  the artifact whose absence means "not set up here", and the vendor's own setup
  command verbatim — plus a note recording what running it actually wrote.
- **Scaffold artifact**: a repository-relative path. Its presence is the entire
  test for "this tool has run here"; its content is never judged.
- **Setup command**: a terminal command belonging to the vendor. It is not a
  step, it is never printed as one, and it never satisfies a gate.
- **Searched repositories**: the same set of repositories the artifact gates
  already search — the brain plus each declared, present repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A repository that declares a supported spec-driven tool which has
  never run there can be taken from declaration to a planned change without ever
  passing the escape flag or editing configuration to switch the automation off.
- **SC-002**: The number of commands that can reach the network is unchanged
  outside the lifecycle: the three offline commands contain zero references to
  the setup routine, asserted by a rule in the project's law that fails the
  build if the reference appears.
- **SC-003**: Every one of the five setup outcomes — ran and produced the
  artifact, already present so skipped, no command recorded, binary missing,
  command failed — is demonstrated by its own automated test.
- **SC-004**: A maintainer who sees any of the failing outcomes can act on the
  message alone: it contains the command, and either the tool's own error text
  or the install line.
- **SC-005**: The full existing test suite passes unchanged in behaviour, and
  the whole suite still completes in under a second on the developer machine.
- **SC-006**: No test in the suite executes a real vendor setup command; every
  test drives a stub, so the suite stays offline and deterministic.

## Assumptions

- The set of repositories to search, the artifact-presence probe, the
  binary-on-path probe and the "quote the tool's own error output" shape all
  already exist in this project and are reused rather than reinvented.
- The repository the lifecycle itself is anchored in is the one the setup runs
  in when the artifact is absent everywhere; it is where this project's own
  specs live. Setting up a sibling repository automatically is out of scope, and
  the output naming which repositories were searched is what makes that honest.
- Only one of the two supported spec-driven tools has a setup command verified by
  running it. The other one gets no recorded command in this feature, and the
  stated gap is the correct outcome rather than a shortfall.
- Presence of the scaffold artifact is a sufficient signal for "set up". No
  version, freshness or completeness check is implied.
- The setup is idempotent from the vendor's side; this feature does not add
  locking or retries around it.
