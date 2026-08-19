# Feature Specification: The sentences are true

**Feature Branch**: `the-sentences-are-true`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "The last of the false sentences — and mostly the code is what moves, because the sentence is the design."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A broken config exits the way the contract says (Priority: P1)

An operator's config will not load. `verify` and `count` exit 2, as documented.
`seed` and `repos` exit 1 — the code for a failed check — and `roadmap` exits
**0**, having done nothing at all.

**Why this priority**: a script cannot tell an environment error from a failed
gate, and `roadmap`'s exit 0 says the sync succeeded.

**Acceptance Scenarios**:

1. **Given** a config that will not load, **When** any command that reads it
   runs, **Then** it exits 2 and names the problem — except `doors` and
   `doctor`, which the contract exempts.
2. **Given** a valid config, **When** they run, **Then** nothing changes.

---

### User Story 2 - `doctor` gates on the law it says it gates on (Priority: P2)

`doctor --help` and the reference both promise exit 1 when the config **or the
law** is invalid. The law half was never implemented: the anchors are collected
with their parse diagnostics discarded.

**Acceptance Scenarios**:

1. **Given** a law file with a malformed anchor, **When** bare `doctor` runs,
   **Then** it exits 1 and names the diagnostic.
2. **Given** a law that parses, **When** it runs, **Then** exit 0, as today.

---

### User Story 3 - The guide stops telling people to lose their work (Priority: P1)

`session-zero.md` directs the interview's output into the brain door's managed
block, which `doors` regenerates whole from config on every run.

**Acceptance Scenarios**:

1. **Given** the guide, **When** an operator follows it, **Then** what they
   write survives the next `doors`.

---

### User Story 4 - The law describes the code that exists (Priority: P2)

MV-85's body says `verify` and `change` keep their own argument loops. They
call the shared refusal now, and so does `count`. And self-heal — the one code
path that rewrites the law file — is stated by no row at all.

**Acceptance Scenarios**:

1. **Given** MV-85, **When** it is read, **Then** it describes the code that
   exists.
2. **Given** the corpus, **When** a reader looks for the rule about the tool
   editing its own law, **Then** a row states it.

---

### Edge Cases

- `doors` and `doctor` keep exit 1 on an unloadable config: for them it is the
  diagnosis they were asked for, which the contract already says.
- A command that does not read the config at all is unaffected.
- `roadmap sync` with no tracker declared: unchanged — that is not an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every command that reads the config MUST exit 2 when it will not
  load, except `doors` and `doctor`.
- **FR-002**: `doctor` MUST exit 1 when the law does not parse, and MUST name
  the diagnostic.
- **FR-003**: `session-zero.md` MUST direct interview output outside the
  managed block.
- **FR-004**: MV-85 MUST describe the argument handling that exists.
- **FR-005**: A row MUST state that `verify` rewrites the law file, and under
  what conditions.
- **FR-006**: No new runtime dependency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `seed`, `repos` and `roadmap` exit 2 on an unloadable config.
- **SC-002**: `doors` and `doctor` still exit 1 there.
- **SC-003**: `doctor` exits 1 on a law that does not parse, naming it.
- **SC-004**: No guide tells anyone to write inside a managed block.
- **SC-005**: MV-85 and the new self-heal row are both true of the code.
- **SC-006**: The suite passes.

## Assumptions

- Where a documented contract and the code disagree, the contract is the
  design and the code is the defect — unless the contract is itself wrong,
  which is judged case by case. Here `configuration.md`'s exit rule is
  coherent and useful, and `roadmap`'s exit 0 is indefensible.
- `doctor` already collects the law's anchors, so honouring its own promise is
  keeping a value it currently throws away rather than new machinery.
