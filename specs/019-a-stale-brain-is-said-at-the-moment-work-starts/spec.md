# Feature Specification: A stale mount is said when work starts

**Feature Branch**: `a-stale-brain-is-said-at-the-moment-work-starts`

**Created**: 2026-08-18

**Status**: Draft

**Input**: The brain is mounted in each repo at a pinned commit. Staleness is already computed offline and reported by `verify`, and the consumer door says to refresh. Nothing says it at the moment an operator starts new work.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Opening a change says the brain is behind (Priority: P1)

An operator opens a change. Some declared repository still pins the brain at a
commit behind the channel — someone else's change landed since. Every decision
about to be made will be measured against law that has moved.

The tool already knows: it computes this offline, and the verifier reports it.
The moment it matters most is the moment work begins, and nothing says it there.

**Why this priority**: "refresh before you start" is exactly the instruction
that has to arrive at the start. Anywhere else it is a fact about the past.

**Independent Test**: pin a repository behind the channel, open a change, and
confirm the report names the repository and how far behind it is.

**Acceptance Scenarios**:

1. **Given** a repository whose pin is behind the channel, **When** a change is
   opened, **Then** the report names it, says how far behind, and says how to
   refresh.
2. **Given** the same, **When** a change is applied, **Then** the same report
   appears — it is the other moment work starts.
3. **Given** every pin current, **When** a change is opened or applied, **Then**
   nothing about staleness is printed.
4. **Given** a stale pin, **When** a change is opened, **Then** it is **not**
   refused. The report is the whole behaviour.

---

### User Story 2 - The report never claims more than an offline read can know (Priority: P2)

A pin can be behind for two different reasons: someone landed work, or nobody
fetched. Offline, these are indistinguishable.

**Why this priority**: it is the difference between a useful report and one that
cries wolf on every laptop that has been closed for a weekend.

**Independent Test**: with a channel ref that does not resolve locally, confirm
the report says so rather than guessing.

**Acceptance Scenarios**:

1. **Given** a channel ref unknown locally, **When** a change is opened, **Then**
   the report says the comparison could not be made, and names the command that
   fetches.
2. **Given** any report, **When** it is read, **Then** it carries how long ago
   this machine last fetched, so the reader can judge it.

---

### Edge Cases

- The brain is its own code repository: nothing to pin, nothing reported.
- A declared repository is absent from disk: nothing to read, nothing reported.
- A pin *ahead* of the channel: not stale, nothing reported.
- Staleness configured as blocking: the verifier still blocks, exactly as it
  does today. This feature adds no second refusal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Opening a change MUST report any declared repository whose pin is
  behind its channel, naming the repository, the distance, and how to refresh.
- **FR-002**: Applying a change MUST report the same.
- **FR-003**: Neither MUST refuse on account of a stale pin.
- **FR-004**: The report MUST use the same offline computation the verifier
  uses, never a second implementation.
- **FR-005**: A channel ref that does not resolve locally MUST be reported as
  uncomparable, never guessed.
- **FR-006**: The report MUST carry how long ago this machine last fetched.
- **FR-007**: Nothing MUST be printed when every pin is current.
- **FR-008**: Neither step MUST reach the network to produce the report.
- **FR-009**: The law row MUST land in the same change, with anchors that
  resolve, and MUST state that the read is offline and therefore reports what
  was last fetched rather than what exists remotely.

### Key Entities

- **Pin**: the commit each repository records for the mounted brain.
- **Channel**: the ref a pin is measured against.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator starting work on a stale ecosystem is told before they
  write anything.
- **SC-002**: No change is ever refused because of a pin.
- **SC-003**: The staleness answer is computed in exactly one place in the code.
- **SC-004**: Opening and applying a change reach no network.

## Assumptions

- Report, never refuse. A pin behind its channel offline may mean somebody
  landed work or may mean nobody fetched, and refusing on the second reading
  would fail an ordinary morning. Blocking remains what an operator opts into
  through the existing configuration, enforced where it already is.
- The moments work starts are opening a change and applying one. Later steps are
  not the start of anything.
