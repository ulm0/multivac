# Feature Specification: A brain knows what projected it

**Feature Branch**: `the-brain-knows-what-projected-it`

**Created**: 2026-08-17

**Status**: Draft

**Input**: "When a new multivac ships and the user updates, how do the changes reach an existing brain? Warn loudly and constantly — a call to action, red or yellow. Use `version: 0.3.0` to say which version it was made with, and change it when an explicit update is done."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The person whose gate is quietly disarmed (Priority: P1)

Someone installed multivac months ago and has not thought about it since. A
release has fixed the way the hook shim resolves the hooks path — their shim
puts the gate somewhere it will never fire, and nothing in their repository
mentions it. Every commit passes. The gate has been off for weeks.

After this change, every command they run says so: which version projected this
brain, which they are running, and the command that closes the gap.

**Why this priority**: this already happened in this repository. A stale global
binary ran for weeks against a newer brain, and the only reason anyone noticed
was an unrelated investigation. A tool whose value is that a gate ran must say
when the gate is old.

**Independent Test**: record an old version in a brain, run any command with a
newer binary, and see the notice with the fix in it.

**Acceptance Scenarios**:

1. **Given** a brain recording an older version than the running binary,
   **When** any command runs, **Then** a notice names both versions and the
   command that re-projects.
2. **Given** the same, **When** the command is one that gates, **Then** it still
   does its job and exits as it would have. The notice never changes an exit
   code.
3. **Given** a brain and a binary that agree, **When** any command runs, **Then**
   nothing is printed about versions.

---

### User Story 2 - The team that disagrees about green (Priority: P1)

Two people verify the same brain from different machines on different versions.
One sees a claim resolve and the other sees it broken, on identical bytes,
because a release changed what a leg means. Neither has any reason to suspect
the other's binary.

A team that has met this once writes down a floor. Anyone below it is told, in
the loudest of the three levels, on every run.

**Why this priority**: equal to US1 and worse in kind. A stale projection is a
nuisance; two people disagreeing about what verification means is a correctness
failure that hides inside a green report.

**Independent Test**: declare a floor above the running binary and observe the
strongest notice, on every command, with the exit code unchanged.

**Acceptance Scenarios**:

1. **Given** a declared floor above the running version, **When** any command
   runs, **Then** the notice is the most severe of the three and says the gate
   cannot be trusted at this version.
2. **Given** the same, **When** the command would have exited 0, **Then** it
   still exits 0. Nothing is refused on account of a version.
3. **Given** no floor declared, **When** the running version is merely older
   than the record, **Then** the notice is the lesser severity.

---

### User Story 3 - The upgrade is taken on purpose (Priority: P2)

Somebody upgrades the binary, re-projects, reads what changed, and decides they
have adopted this version. Only then does the record move — and the notice stops.

**Why this priority**: P2 because it completes US1 rather than standing alone,
and it is the part that decides whether the whole feature works. A record that
moved as a side effect of any command would silence the notice without the
upgrade having been taken, which is worse than no notice at all: it would look
resolved.

**Independent Test**: run the re-projection without the explicit act; the notice
persists. Run it with; the notice stops.

**Acceptance Scenarios**:

1. **Given** an out-of-date record, **When** the projection is re-run without
   the explicit act, **Then** the projections are refreshed and the notice
   **still appears**.
2. **Given** the same, **When** the explicit act is used, **Then** the record
   moves to the running version and the notice stops.
3. **Given** any command that is not the explicit act, **When** it runs, **Then**
   the record is unchanged on disk.

---

### Edge Cases

- **A brain with no record at all** — every brain that exists today. This must
  not read as "version zero" and produce the loudest notice on first run. It is
  an absence, and it says so, once, in the mildest form.
- **A running binary NEWER than the floor and equal to the record**: silent.
- **A running binary older than the record but above the floor**: someone else on
  the team is ahead. That is worth saying and is not an error.
- **A malformed floor.** The field is authored by hand and can be mistyped. It
  must be refused with the accepted form named, and must not be silently ignored
  — that would be MV-85's defect in a new place.
- **Pre-release or build-metadata versions** (`0.4.0-rc.1`). Comparison must
  either handle them or refuse them; it must not compare them wrongly and be
  confident about it.
- **The notice must not corrupt machine-read output.** `verify` output is read
  by agents and by hooks.
- **A repository that is not a brain.** No config, no record: nothing to compare,
  and no notice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A brain MUST record the version it was deliberately brought to, in
  a file the tool owns and a human never edits.
- **FR-002**: That record MUST be written when the brain is created, and MUST
  move only under an explicit act. No other command may move it.
- **FR-003**: A team MUST be able to declare a minimum version, by hand, in the
  configuration they already author. The tool MUST NOT write that field.
- **FR-004**: Every command MUST compare the running version against both and
  emit a notice when they disagree.
- **FR-005**: The notice MUST carry three severities, distinguished by colour
  where colour is available: below the declared floor is the most severe; a
  disagreement with the record is lesser; agreement is silent.
- **FR-006**: The notice MUST name the running version, the recorded version,
  and the exact command that closes the gap. A notice without an action is a
  nag.
- **FR-007**: Nothing MUST be refused on account of a version. No exit code
  changes; enforcement degrades, it never locks anyone out.
- **FR-008**: `verify` MUST NOT write the record. It runs inside another
  person's commit and in hooks.
- **FR-009**: Colour MUST be suppressed where the existing convention suppresses
  it, and the notice MUST remain complete without it.
- **FR-010**: A malformed floor MUST be refused with the accepted form named.
- **FR-011**: A brain with no record MUST NOT be treated as an old version.
- **FR-012**: The comparison MUST NOT introduce a runtime dependency.

### Key Entities

- **Record**: the version this brain was deliberately brought to. Machine-owned.
- **Floor**: the minimum version this team will trust. Human-owned.
- **Running version**: what the binary in hand reports.
- **Notice**: severity, both versions, and the command that fixes it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With a record older than the running binary, every command prints
  the notice — measured across the whole command registry, not a sample.
- **SC-002**: No command's exit code differs with the notice present or absent,
  for every command and both severities.
- **SC-003**: Re-projecting without the explicit act leaves the record byte-identical and the notice still appears. With the act, the record equals the running version and the notice stops.
- **SC-004**: No command other than the two that may write it changes the file
  on disk — verified by comparing bytes before and after every command.
- **SC-005**: A brain with no record produces the mildest notice, never the
  most severe.
- **SC-006**: A malformed floor is refused, naming the accepted form.
- **SC-007**: The notice is complete and readable with colour suppressed.
- **SC-008**: The runtime dependency count is unchanged.

## Assumptions

- Versions this project publishes are plain three-number semver. The floor
  grammar is deliberately only a floor — a range grammar is a parser, and a
  parser is the dependency FR-012 forbids.
- The record answers *which version projected this*, not *whether the projection
  is still intact*: a hand-edited door leaves the record just as fresh. This is
  provenance, not integrity, and the law row must say so rather than let the
  stronger reading stand.
- Reaching the network to ask what the newest version is stays out of scope. The
  comparison is between the binary in hand and two files on disk.
