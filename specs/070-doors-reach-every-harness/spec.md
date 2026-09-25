# Feature Specification: Doors reach every harness and say the truth

**Feature Branch**: `070-doors-reach-every-harness`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "doors-reach-every-harness — Doors reach every harness and say the truth. Link every symlink door before a vendor install writes there; rewrite absolute binary paths in hook files on every equip; let a door claim the vendor's own graph section only where a declared platform writes it; name the law at the path it has in a consumer; make the Cursor door native and skip the vendor's cursor platform where the section already exists. Adds MV-143, amends MV-131 and MV-140."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The brain door reaches an agent working in a code repo (Priority: P1)

An agent opens a session in a declared code repo whose harness reads `CLAUDE.md`. It must load the brain's door: the law's location, the change lifecycle, the SDD flow and the graph verbs. Today the grapher's own project install gets there first and writes a regular `CLAUDE.md` of its own, and the door is never linked afterwards because multivac refuses to overwrite a file it did not write. The agent works with the vendor's section and no governance.

**Why this priority**: it is the difference between an ecosystem that governs its code repos and one that governs only its brain. Every other saving in a consumer door assumes the agent loads that door.

**Independent Test**: set up an ecosystem whose code repo has no `CLAUDE.md`, run the command that equips it, and confirm that `CLAUDE.md` resolves to `AGENTS.md` and that the brain door block is what an agent reading `CLAUDE.md` gets.

**Acceptance Scenarios**:

1. **Given** a declared, writable repo with `AGENTS.md` and no `CLAUDE.md`, **When** the repo is equipped, **Then** `CLAUDE.md` is a link to `AGENTS.md`, the vendor's section is inside `AGENTS.md`, and the door block is intact.
2. **Given** the same repo with a regular `CLAUDE.md` that multivac did not write, **When** the repo is equipped, **Then** nothing is overwritten and the report names the file as one a human must resolve.
3. **Given** a repo declared read-only, **When** the repo is equipped, **Then** no link and no install are attempted there.
4. **Given** a repo created or cloned during the change lifecycle, **When** the lifecycle equips it, **Then** the link exists before the vendor writes.

### User Story 2 - Hook commands work on every machine, after any vendor install (Priority: P2)

A hook file committed in a repo must name a vendor binary by its bare name, so the hook runs for every person who checks the repo out. multivac already normalizes those paths, but only on the pass that performs the install. A later install by the same vendor, run by a human or by another tool, puts the absolute path back and it gets committed.

**Why this priority**: a committed absolute path breaks silently for everyone but its author, and the repair is invisible unless someone reads the hook file.

**Independent Test**: write an absolute path into a hook file by hand, run any command that equips the root, and confirm the path is bare and that the run said so.

**Acceptance Scenarios**:

1. **Given** a hook file naming a vendor binary by absolute path and a vendor whose install is already present, **When** any equipping command runs, **Then** the path is rewritten to the bare name and the run reports the rewrite.
2. **Given** a hook file that merely mentions the tool's name in prose, **When** the rewrite runs, **Then** the prose is untouched.

### User Story 3 - A door states only what is true where it is read (Priority: P2)

A door must not promise a section that nothing writes, and must not send an agent to a path that does not exist in that repo. Two statements break this: the graph lines cite the vendor's own section as the manual for its verbs wherever a harness is declared, although only some platforms write that section; and the project-document lines name the law at the brain's own relative path in repos where the law lives under the mounted brain.

**Why this priority**: an agent that follows a false pointer spends tokens and then falls back to guessing. A claim that happens to hold for one ecosystem is the drift the law exists to stop.

**Independent Test**: render a door in a root whose declared platforms write no vendor section, and a consumer door in a repo with the brain mounted; neither may contain a pointer that does not resolve in that root.

**Acceptance Scenarios**:

1. **Given** a root whose declared doors resolve to platforms that do not write the vendor's section, **When** the door is rendered, **Then** it names the verbs itself instead of citing a section that is absent.
2. **Given** a root where a declared platform does write that section, **When** the door is rendered, **Then** it cites the section and does not repeat the verbs.
3. **Given** a health report for a root missing the vendor's section, **When** it names the command that installs it, **Then** the platform it names is one that writes the section.
4. **Given** a consumer repo with the brain mounted, **When** its door is rendered, **Then** every law path it prints is the path that repo can open.

### User Story 4 - Cursor reads the canonical door, once (Priority: P3)

Cursor reads `AGENTS.md` at the project root, so a second copy of the door in a rules file is dead weight, and the vendor's rules file repeats a graph section the canonical door already carries.

**Why this priority**: real but small, and it depends on confirming by hand that Cursor injects `AGENTS.md` into its Agent chats.

**Independent Test**: declare the Cursor door in a root, run the projection twice, and confirm no rules file is left behind and no duplicate graph section exists.

**Acceptance Scenarios**:

1. **Given** a root with a Cursor rules file holding only multivac's managed block, **When** the doors are projected, **Then** the managed block is removed and the emptied file is deleted.
2. **Given** a rules file that also holds a human's own text, **When** the doors are projected, **Then** only the managed block is removed and the file survives with that text.
3. **Given** a root whose `AGENTS.md` already carries the vendor's graph section, **When** the vendor's installs run, **Then** the Cursor platform is skipped and the skip is reported.
4. **Given** a root whose `AGENTS.md` has no such section, **When** the vendor's installs run, **Then** the Cursor platform runs as before.

### Edge Cases

- A door link that exists but dangles, because the canonical door has not been written yet: the link is enough, and the door lands when it is written.
- A repo whose canonical door file is itself missing: the link is created and the door written in the same pass, in either order, with no file overwritten.
- A brain that is also the code it governs: exactly one root, and the link is the same operation.
- A root where the vendor's binary is absent: no install, no skip decision, and the report says why.
- A vendor that writes its section into the linked file rather than following the link: the section must still end up in the canonical door, or the run says it did not.
- A root that declares no grapher, or a grapher with no harness map: no link is attempted for the vendor's sake, and the doors projection keeps its own behavior.
- A hook file whose absolute path points at a binary that no longer exists: the rewrite is textual and does not check the target.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Before a grapher's own project install runs in a root, multivac MUST create every declared door that is a link to the canonical door file in that root.
- **FR-002**: The link pass MUST skip a root that is read-only and MUST NOT replace an existing regular file, naming any file it left alone.
- **FR-003**: The link pass MUST run wherever the install runs: the brain, every declared repo equipped by a sync, and every repo the change lifecycle clones, creates or prepares.
- **FR-004**: Every equipping run MUST rewrite an absolute path to a vendor binary in the vendor's hook files to the bare binary name, whether or not that run performed the install, and MUST report each rewrite.
- **FR-005**: A door MAY cite the vendor's own section as the manual for its verbs only where at least one declared door resolves to a platform recorded as writing that section; otherwise the door MUST print the verbs itself.
- **FR-006**: A health report naming the command that installs a missing vendor section MUST name a platform recorded as writing that section.
- **FR-007**: Every path a consumer door prints for the law MUST be the path that repo can open, with the mount prefix where the law lives under a mounted brain.
- **FR-008**: The Cursor door MUST project nothing beyond the canonical door, and one projection run MUST remove multivac's managed block from a pre-existing Cursor rules file, deleting that file only when the removal leaves it empty.
- **FR-009**: The vendor's Cursor platform MUST be skipped in a root whose canonical door already carries the vendor's section, after the platforms that write that section have run, and the skip MUST be reported.
- **FR-010**: A door file and a door link are not code: they MUST NOT be committed by the lifecycle, and the operator MUST be shown what to commit.
- **FR-011**: The law MUST state the new rule as MV-143 and MUST carry the amended wording of MV-131 and MV-140, with anchors that fail if any of the above regresses.

### Key Entities

- **Door**: the file a harness reads at a repo's root. Either the canonical file, a link to it, a managed block inside a foreign file, or nothing at all for a harness that already reads the canonical file.
- **Root**: the brain plus every declared repo present on disk and writable. Every pass in this feature is per root.
- **Platform**: one entry of a vendor's harness map, with the file that proves it installed and whether it writes the vendor's own section into the canonical door.
- **Hook file**: a file a vendor writes that names a binary to run, and that a repo commits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a fresh ecosystem with a code repo, an agent session started in that repo loads the brain door on its first message. Measured today: it loads none of it.
- **SC-002**: That session's governance context arrives for at least 1,100 fewer tokens than the repair-by-hand path with an SDD declared, and at least 376 fewer with no SDD.
- **SC-003**: Across every root, zero door files claim a vendor section that no declared platform writes, and zero health reports name a platform that does not write it.
- **SC-004**: After any equipping run, zero committed hook files contain an absolute path to a vendor binary.
- **SC-005**: Zero consumer doors print a law path that does not resolve in the repo that carries them.
- **SC-006**: After one projection run in a Cursor root, zero multivac rules files remain and the canonical door carries exactly one copy of the vendor's graph section.
- **SC-007**: The law's own check passes with the new and amended rows anchored, and the change closes with its declared claims resolving.

## Assumptions

- The grapher used for measurement is graphify 0.9.29, whose platform behavior was measured with an isolated home directory: the claude, codex and gemini platforms write hook commands naming the binary by absolute path, and writing a file follows a symbolic link.
- Cursor injects the canonical door into its Agent chats. Story 4's saving depends on confirming that by hand, and nothing else in this feature depends on it.
- Repairing a root whose canonical door was already replaced by a regular file is out of scope: it stays a reported condition for a human, per the rule that multivac never overwrites a file it did not write.
- A code repo reaches its door through the brain mount it already carries; this feature adds no new mount mechanism.
- The operator commits door files and links, as they do today for a projection run.
