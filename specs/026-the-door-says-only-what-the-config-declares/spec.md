# Feature Specification: The door says only what the config declares

**Feature Branch**: `the-door-says-only-what-the-config-declares`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "On a re-run, `init` writes a door naming an SDD the config does not declare, reports that the flag did not take effect, and `doors` removes the block on the next run."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The door never names an adapter the configuration does not declare (Priority: P1)

An operator re-runs initialisation on a brain whose configuration exists but
names no spec-driven-development tool, passing a flag that names one. The
command tells them, correctly, that the configuration does not answer that flag
and how to make it stick — and then writes a door that instructs every agent to
gate its work through exactly that tool.

Nothing on disk records the choice. The configuration is silent, so the next
projection run removes the block again.

**Why this priority**: the door is the first file an agent reads, and this one
names a tool the law does not declare. It is the same failure the refusal
already prevents for a disagreeing flag, in the one row that refusal does not
cover.

**Independent Test**: initialise with no adapter flag, re-run with one, and read
the door: it must not name the tool.

**Acceptance Scenarios**:

1. **Given** a brain whose configuration declares no tool, **When**
   initialisation is re-run naming one, **Then** the door does not name it.
2. **Given** that same run, **When** the operator reads the output, **Then** it
   still reports the flag as unanswered with how to make it stick — the report
   does not change, it becomes true.
3. **Given** a brain whose configuration declares a tool, **When**
   initialisation is re-run with no flag, **Then** the door names the declared
   tool, exactly as it does today.

---

### User Story 2 - Two commands, one door (Priority: P1)

An operator runs initialisation and then the projection command, changing
nothing in between. Both doors name the same tool — including naming none.

**Why this priority**: it is the property that makes the first story checkable
from outside. A door that depends on which command ran last is a door nobody
can reason about — and the drift is silent, because the file changes while
nothing the operator wrote did.

**Independent Test**: run initialisation with a flag the configuration does not
answer, then the projection command, and compare the tool the door names before
and after.

**Acceptance Scenarios**:

1. **Given** any repository state and any flags, **When** initialisation is
   followed by the projection command with nothing edited between them,
   **Then** the door names the same tool before and after, including naming
   none.

---

### Edge Cases

- The configuration exists and declares the same tool the flag names: the door
  names it, from the configuration. Unchanged.
- No configuration at all — a first run: the flag is what writes the
  configuration, so the door is projected from it. Unchanged.
- The configuration exists but cannot be read: it declares nothing, so the door
  names nothing. The existing error stands.
- A flag naming a code-graph tool rather than a spec-driven one: the same rule
  applies, and it reaches the door through the projection the command already
  runs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a configuration file exists, the door MUST name a
  spec-driven-development tool only if that configuration declares one.
- **FR-002**: A flag naming a tool the configuration does not declare MUST NOT
  reach the door, and MUST still be reported as unanswered with how to make it
  stick.
- **FR-003**: Initialisation followed by the projection command, with nothing
  edited in between, MUST leave the door naming the same tool — including
  naming none.
- **FR-004**: A first run — no configuration present — MUST behave exactly as it
  does today, the flag being what writes the configuration.
- **FR-005**: The refusal for a flag that disagrees with a declared value MUST
  be unchanged in every respect.
- **FR-006**: The law row governing this MUST land in the same change, and the
  row it narrows MUST be amended in place rather than contradicted.

### Key Entities

- **Declared tool**: what the configuration says. The only thing the door may
  name once a configuration exists.
- **Requested tool**: what a flag says. On a first run it becomes the declared
  tool; afterwards it is a request, honoured only where the configuration
  already agrees.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every combination of configuration state and flags, the tool
  named in the door written by initialisation is the tool named in the door
  written by the projection command.
- **SC-002**: An operator reading the output can predict the contents of the
  door without opening it, and is never contradicted by the file.
- **SC-003**: First-run behaviour is unchanged in every respect.
- **SC-004**: No run leaves the door naming a tool that appears nowhere in the
  configuration.

## Assumptions

- The configuration is authoritative for everything a re-run writes. This is
  already law; this change closes the one path that outlived it.
- The report stays as it is. It was never wrong about what SHOULD happen — it
  described a configuration that does not answer the flag, which is true. What
  was wrong was the door written underneath it.
- Removing the fallback cannot break a first run, because on a first run the
  configuration has just been written from the flags, so reading the
  configuration and reading the flag give the same answer.
- The two commands write different door BODIES — initialisation scaffolds the
  empty-brain text, the projection command projects the brain door — and that
  is out of scope here. Measured while writing this change's test, and left
  alone deliberately: it is a question about which body is right, not about
  which declaration wins, and answering it inside this change would hide a
  one-operator fix inside a rewrite.
