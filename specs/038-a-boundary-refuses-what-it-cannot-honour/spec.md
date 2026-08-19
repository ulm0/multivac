# Feature Specification: A boundary refuses what it cannot honour

**Feature Branch**: `a-boundary-refuses-what-it-cannot-honour`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "MV-105 unified the flag boundary. The config and init-value boundaries still swallow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - `init` never disarms a gate it cannot read (Priority: P1)

An operator's config breaks. `doctor` tells them to run `multivac init .`. They
do, and the strict pre-push shim becomes a plain one — exit 0, no notice.
`doors` in the same state refuses and leaves the gate armed.

**Why this priority**: it is a security gate silently disarmed by the command
the tool itself recommends, and the disarm is invisible: `doctor` afterwards
still reports the hooks as installed.

**Independent Test**: arm `strict_pre_push`, break the config, run `init .`,
and count the `--strict` lines in the shim.

**Acceptance Scenarios**:

1. **Given** a config that exists and will not load, **When** `init` runs,
   **Then** it refuses naming the error and leaves the projections alone.
2. **Given** no config at all, **When** `init` runs, **Then** it scaffolds one,
   exactly as today.
3. **Given** a config that loads, **When** `init` runs, **Then** hooks are
   installed with the strictness it declares.

---

### User Story 2 - An unknown config key is named, not honoured (Priority: P1)

`strict_prepush: true` loads clean. The gate it looks like it declares does not
exist, and nothing says so.

**Why this priority**: `version.ts` already calls this "MV-85's defect
relocated into a config file" in a comment, about a different field. It is the
same defect, and a declaration nothing honours is worse than a missing one
because the reader believes it.

**Acceptance Scenarios**:

1. **Given** an unknown top-level key, **When** the config loads, **Then** it
   is refused by name.
2. **Given** an unknown key under `repos.<key>` or `graphers.<name>`, **When**
   the config loads, **Then** the same.
3. **Given** a key that differs only in case or separators from a real one,
   **When** it is refused, **Then** the near miss is named.

---

### User Story 3 - A floor with a comment on it is still a floor (Priority: P2)

`requires: ">=0.4.0" # floor for CI` is valid YAML, and the version check does
not see it. The floor is declared and enforces nothing.

**Acceptance Scenarios**:

1. **Given** a `requires:` line with a trailing comment, **When** the version
   notice runs, **Then** the floor is read.
2. **Given** a commented-out `requires:` line, **When** it runs, **Then**
   nothing is read, as today.
3. **Given** a malformed floor with a comment, **When** it runs, **Then** it is
   refused by name rather than vanishing.

---

### User Story 4 - An adapter name is checked before it is written (Priority: P2)

`init --sdd speckti` writes the typo into the config and projects a door saying
features gate through it. Nothing gates.

**Acceptance Scenarios**:

1. **Given** an unknown `--sdd` or `--grapher` name, **When** `init` runs,
   **Then** it is refused naming the known ones, with the exit a refused
   argument gets, and nothing is written.
2. **Given** an empty value in either form, **When** `init` runs, **Then** the
   same refusal and the same exit.
3. **Given** a known name, **When** `init` runs, **Then** it proceeds.

---

### Edge Cases

- A config key a FUTURE version knows: refused by this one. That is the cost of
  refusing, and it is the same cost MV-85 accepted for flags — the alternative
  is a declaration nobody honours.
- `graphers.<name>` extends the grapher vocabulary, so a name declared there is
  legal in `grapher:` even though the registry does not know it. The check
  reads the config's own vocabulary, not only the registry's.
- `isBrain` under a repo entry: derived by the loader, never hand-written, so it
  is refused like any other stray.
- A brain whose config is broken can still be repaired by hand — nothing here
  locks anyone out of an editor, and `doors` already refused in this state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `init` MUST distinguish a config that is absent from one that
  will not load, and MUST refuse on the second rather than projecting from
  nothing.
- **FR-002**: `init` MUST load the config once and use that one truth for every
  decision that reads it.
- **FR-003**: An unknown key at the top level, under `repos.<key>` or under
  `graphers.<name>` MUST be refused by name.
- **FR-004**: A refusal for a near miss MUST name the key it is near.
- **FR-005**: A `requires:` floor MUST be read when the line carries a trailing
  comment, and a malformed one MUST still be refused by name.
- **FR-006**: An `--sdd` or `--grapher` value that names no known adapter — the
  empty string included — MUST be refused before anything is written, with the
  exit a refused argument gets.
- **FR-007**: No new runtime dependency.

### Key Entities

- **Config**: the declared vocabulary of a brain — repos, doors, adapters,
  gates.
- **Boundary**: a place where text a human wrote becomes something the tool
  acts on.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With `strict_pre_push` armed and the config broken, `init .`
  refuses and the shim still carries `--strict`.
- **SC-002**: `strict_prepush: true` is refused, naming `strict_pre_push`.
- **SC-003**: `requires: ">=0.4.0" # floor` is read as a floor.
- **SC-004**: `init --sdd speckti` exits 2 and writes nothing.
- **SC-005**: `init --sdd=` exits 2, not 1.
- **SC-006**: A brain with no config still scaffolds.
- **SC-007**: The suite passes, with any fixture naming a fictional adapter
  updated to a real one rather than deleted.

## Assumptions

- Refusing an unknown config key is right even though MV-86 says enforcement
  degrades rather than locking anyone out: `loadConfig` already throws for
  other invalid shapes, the refusal names the key and its near miss, and an
  editor is always available. A gate that reads as declared and does nothing is
  the worse failure.
- `--sdd=` reaching `init` at all is MV-105 working as specified: the guard
  judges the SURFACE, and whether an empty value is a legal VALUE is the
  command's question. This change is where that question gets answered.
