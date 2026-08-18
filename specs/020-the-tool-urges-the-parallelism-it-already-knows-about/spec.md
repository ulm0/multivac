# Feature Specification: The tool urges the parallelism it already knows about

**Feature Branch**: `the-tool-urges-the-parallelism-it-already-knows-about`

**Created**: 2026-08-18

**Status**: Draft

**Input**: multivac computes which repos have no ordering dependency, hands back one isolated checkout per repo, and prints each SDD step — and then says nothing about working them at once, or about continuing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Applying a change says what can be worked at once (Priority: P1)

An operator applies a change across several repositories. The tool has just
computed the landing stages — which is a statement that the repositories inside
one stage have no ordering dependency on each other — and has just handed back
one isolated checkout per repository, which is the condition that makes
concurrent edits safe.

It says neither. The operator reads a list of directories and decides for
themselves, or more often does not.

**Why this priority**: this is the moment the information exists and the moment
it is useful. Later it is a fact about a decision already made.

**Independent Test**: apply a change declaring two repositories in one stage and
confirm the output names them as workable at once.

**Acceptance Scenarios**:

1. **Given** a change whose first stage holds more than one repository, **When**
   it is applied, **Then** the output names those repositories and says they may
   be worked at the same time.
2. **Given** a change whose stages hold one repository each, **When** it is
   applied, **Then** nothing about working at once is printed — there is nothing
   to say.
3. **Given** any such message, **When** it is read, **Then** it states the two
   things that never parallelise: the same file, and the law.
4. **Given** any such message, **When** the operator ignores it, **Then**
   nothing is refused. It urges; it does not gate.

---

### User Story 2 - The flow says to continue, rather than waiting to be asked (Priority: P1)

An operator who has decided to follow the specification flow is asked, once per
step, to say "continue". The lifecycle prints each step and refuses to move on
without its artifact, so the sequence was never in doubt — the only thing
missing is the instruction to proceed.

**Why this priority**: six confirmations per feature, for a sequence nobody was
choosing between.

**Independent Test**: run a lifecycle step with a declared tool and confirm the
printed instruction says to run the chain to completion, and names how to opt
out.

**Acceptance Scenarios**:

1. **Given** a declared specification tool, **When** a lifecycle step prints its
   instruction, **Then** the instruction says to run the chain through without
   waiting to be asked again, and names the way to opt out on the same line.
2. **Given** the same, **When** a step has a genuine question — an unresolved
   marker the tool itself flags — **Then** the instruction says to stop and ask.
3. **Given** an operator who has turned the automation off, **When** a step
   prints, **Then** nothing tells them to continue automatically.

---

### Edge Cases

- A change declaring one repository: nothing about parallelism is printed.
- A stage of several repositories where only one exists on disk: only what was
  handed back is named.
- No specification tool declared: nothing about a chain is printed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Applying a change MUST name the repositories in one stage that may
  be worked at the same time, when there is more than one.
- **FR-002**: It MUST print nothing about parallelism when there is nothing to
  say.
- **FR-003**: The message MUST state that the same file is never worked twice at
  once, and that the law does not parallelise.
- **FR-004**: Nothing MUST be refused on account of the message; it is printed
  and never verified, for the same reason the ritual is.
- **FR-005**: The printed instruction for a specification step MUST tell the
  agent to run the chain to completion rather than stopping to ask permission.
- **FR-006**: It MUST name, on the same line, how to opt out.
- **FR-007**: It MUST distinguish a genuine question — one the tool itself flags
  — from asking permission to continue.
- **FR-008**: An operator who has turned the automation off MUST see none of it.
- **FR-009**: The law row MUST land in the same change, with anchors that
  resolve, and MUST state that neither half can be gated and why.

### Key Entities

- **Stage**: repositories with no ordering dependency on each other, already
  computed for the landing plan.
- **Isolated checkout**: one per repository, already handed back by applying.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator applying a multi-repo change is told which parts can
  proceed at once, without asking.
- **SC-002**: No message about parallelism appears when the change declares one
  repository.
- **SC-003**: An agent following the printed instructions runs the specification
  chain end to end without asking permission between steps.
- **SC-004**: Nothing in this feature refuses anything.

## Assumptions

- Both halves are print-only. No artifact proves an agent ran two things at
  once, and none proves it did not stop to ask — so gating either would be a
  check reading something it cannot see, which is the ritual's own reason.
- The boundaries are stated every time rather than left to be inferred: the same
  file is a lost update, and the law is a single table with ids allocated one at
  a time.
