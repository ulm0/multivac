# Feature Specification: init says what it ignored

**Feature Branch**: `init-says-what-it-ignored`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "What happens if I re-run init on a repo that already had it? Is anything appended, replaced, or overwritten by the new flags?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A flag that disagrees with the config is refused (Priority: P1)

An operator re-runs initialisation on a brain that already has a configuration,
passing an adapter flag that names a different tool from the one the
configuration declares. Today the configuration is kept — correctly — and the
flag silently wins in the door that is written moments later, so the door
instructs the agent to follow a tool the law does not declare. The operator is
told neither thing.

They should be refused, with both values named and both ways forward stated.

**Why this priority**: the door is the first file an agent reads. A door that
disagrees with the configuration is worse than either being wrong, because the
disagreement is what nobody checks.

**Independent Test**: initialise with one adapter, re-run with a different one,
and confirm the command refuses without writing anything.

**Acceptance Scenarios**:

1. **Given** a brain whose configuration declares one adapter, **When**
   initialisation is re-run naming a different one, **Then** it is refused, both
   values are named, and the two ways forward are stated — change the
   configuration, or drop the flag.
2. **Given** that refusal, **When** the operator inspects the repository,
   **Then** nothing was written: not the door, not the hooks, not the version
   record.
3. **Given** a flag naming the same adapter the configuration already declares,
   **When** initialisation is re-run, **Then** it proceeds silently — agreement
   is not an event.
4. **Given** a brain with no configuration, **When** initialisation runs with
   any flags, **Then** it behaves exactly as it does today.

---

### User Story 2 - A re-run says which arguments the config already answered (Priority: P2)

An operator re-running initialisation should not have to compare their command
line against a file to learn what happened to it.

**Why this priority**: it turns a silent no-op into a legible one. The refusal
in US1 covers the dangerous case; this covers the merely confusing one.

**Independent Test**: re-run with flags that agree with the configuration and
confirm the output names them as already answered.

**Acceptance Scenarios**:

1. **Given** a brain with a configuration, **When** initialisation is re-run
   with adapter flags that agree with it, **Then** the report says the
   configuration already answers them and names which.
2. **Given** a brain with a configuration, **When** initialisation is re-run
   with no flags at all, **Then** nothing extra is reported — there is nothing
   to have ignored.

---

### Edge Cases

- The configuration exists but declares no adapter at all, and a flag names one:
  there is nothing to disagree with, so it is not a refusal. The configuration
  is still not rewritten, so the flag is reported as unanswered with the way to
  make it stick.
- Both adapter kinds disagree at once: one refusal naming both, not two runs to
  discover the second.
- The configuration is present but unreadable: the existing error stands. This
  feature never turns a parse failure into a disagreement report.
- A flag that is not an adapter — one that changes no declared value — is
  unaffected in every case.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Re-running initialisation with an adapter flag naming a different
  tool from the one the existing configuration declares MUST be refused.
- **FR-002**: The refusal MUST name the configured value, the requested value,
  and both ways forward: change the configuration, or drop the flag.
- **FR-003**: A refusal MUST write nothing — no door, no hooks, no version
  record, no projection.
- **FR-004**: When more than one adapter disagrees, all disagreements MUST be
  named in one refusal.
- **FR-005**: A flag that agrees with the existing configuration MUST NOT be
  refused, and MUST be reported as already answered by the configuration.
- **FR-006**: A re-run with no flags MUST report nothing extra.
- **FR-007**: The door MUST be projected from the configuration whenever one
  exists, never from a flag that the configuration did not receive.
- **FR-008**: A first run — no configuration present — MUST behave exactly as it
  does today, with flags authoritative because they are what write the
  configuration.
- **FR-009**: A flag naming an adapter where the configuration declares none
  MUST NOT be refused, and MUST be reported as unanswered with how to make it
  stick.
- **FR-010**: The law row governing this MUST land in the same change, with
  anchors that resolve against the code.

### Key Entities

- **Declared value**: what the configuration says about an adapter. On a re-run
  it is authoritative for everything the command writes.
- **Requested value**: what a flag says. On a first run it becomes the declared
  value; on a re-run it is a request the command either honours by agreement or
  refuses by disagreement, and never silently drops.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any successful re-run, the door and the configuration name
  the same adapters. No sequence of flags can make them disagree.
- **SC-002**: A refused run leaves the repository byte-identical to how it was
  before the command.
- **SC-003**: An operator can tell from the output alone which of their
  arguments took effect, without opening the configuration.
- **SC-004**: First-run behaviour is unchanged in every respect.

## Assumptions

- The configuration is authoritative on a re-run. The alternative — flags
  rewriting it — would let one command silently relax a declaration the law
  depends on, and the change lifecycle exists so that such edits are visible.
- Refusing is right rather than warning-and-continuing, because the surface
  being written is the door, and a door that contradicts the configuration is
  read by an agent long before a human re-reads a warning that scrolled past.
- Everything else about a re-run is already correct and is deliberately left
  alone: write-if-missing artifacts, the managed block in the door, the legacy
  layout migration, and hook installation that never displaces the repository's
  own gates.
