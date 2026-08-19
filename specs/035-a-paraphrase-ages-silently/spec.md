# Feature Specification: A paraphrase ages silently

**Feature Branch**: `a-paraphrase-ages-silently`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "An amendment that retires a sentence must retire every copy of it, and the retirement must be mechanical rather than remembered."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One question, one answer (Priority: P1)

A reader asks how many runtime dependencies this project allows. MV-02 says
three. The constitution's Principle IV says two. `CONTRIBUTING.md` says two.
Two law rows say two in passing. The test whose job is to have teeth about the
number is titled with two.

**Why this priority**: it is the project's own named failure mode — *a
paraphrase ages silently* — committed by the project, about the rule it most
recently amended, in the document it calls non-negotiable.

**Independent Test**: search the repository for the retired phrase and find
nothing.

**Acceptance Scenarios**:

1. **Given** the amended rule, **When** any of those six documents is read,
   **Then** it states three, or cites MV-02 instead of restating it.
2. **Given** the constitution, **When** its Sync Impact Report is read, **Then**
   the version reflects the change to Principle IV and says what moved.

---

### User Story 2 - A row does not outlive its meaning (Priority: P1)

Five rows are green while their sentences are false: MV-68 claims a tag runs
publish and nothing else — and its own leg pins that sentence into the CI file;
MV-84's headline states the rule its body repealed; MV-82 counts five legs while
carrying six; MV-31 promises the whole surface and checks a frozen list; MV-01's
tombstone covers three files out of the commands' real import graph.

**Why this priority**: an anchor pins a pattern, not a meaning. A row that
passes while its sentence is false is worse than a missing row, because it is
cited.

**Acceptance Scenarios**:

1. **Given** a clause the code no longer honours, **When** the row is read,
   **Then** the clause is marked WITHDRAWN with its reason, the corpus's own
   convention.
2. **Given** MV-68's leg, **When** it is evaluated, **Then** it no longer holds
   the false sentence in place.
3. **Given** MV-01's tombstone, **When** it is evaluated, **Then** it covers the
   directories those commands actually import.

---

### User Story 3 - The projected skill teaches what the tool does (Priority: P1)

The skill `doors` installs into every repo teaches an arrow-edge
`landing_order` the parser refuses, tells the interview to write its primary
output inside the managed block `doors` regenerates from config, and claims
`change apply` re-projects doors.

**Why this priority**: it is the one artifact whose drift multiplies — it is
copied into every consumer repo, and it is read by agents that follow it
literally. The interview instruction causes user-content loss by following the
manual.

**Acceptance Scenarios**:

1. **Given** the skill's landing_order section, **When** an agent follows it,
   **Then** what it writes parses.
2. **Given** the interview section, **When** an agent follows it, **Then** its
   output lands where `doors` will not overwrite it.
3. **Given** any mechanism the skill names, **When** it is looked for in the
   code, **Then** it exists.

---

### User Story 4 - The first minutes of a new brain work (Priority: P2)

`init` scaffolds everything untracked; `change new` requires its bookkeeping
paths to be clean; so the very next lifecycle command in a fresh brain always
refuses. The refusal calls an untracked file *"carries uncommitted edits"*,
which is the wrong word for a file nobody edited.

**Why this priority**: it is the first thing a new user meets, and it has been
true since before the last release.

**Acceptance Scenarios**:

1. **Given** a brain just created by `init`, **When** the closing report is
   read, **Then** committing the scaffold is named as a step.
2. **Given** an untracked bookkeeping path, **When** a lifecycle command
   refuses, **Then** it says *untracked or modified* rather than *uncommitted
   edits*.

---

### Edge Cases

- A retired phrase quoted deliberately, as history: allowed, and the amendment
  says so — the tombstone must not make it impossible to describe what changed.
  Quotation inside a row's own amendment note is the sanctioned place.
- A row whose clause is withdrawn but whose headline still reads well: the
  headline is what gets cited, so it is the part that must be true.
- `DESIGN.md` is a design record, not the release state. Its stale names are
  corrected where they describe what SHIPPED, and left where they record what
  was considered.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The retired dependency-count sentence MUST NOT appear anywhere
  outside a recorded amendment.
- **FR-002**: The constitution MUST state the current constraint in every
  section that states it, with its version bumped and its Sync Impact Report
  updated.
- **FR-003**: A row whose clause the code no longer honours MUST carry that
  clause as WITHDRAWN, with the reason and the row that superseded it.
- **FR-004**: No anchor may pin a sentence the project has retired.
- **FR-005**: The projected skill MUST teach only mechanisms that exist, in the
  syntax the tool accepts, and MUST NOT direct output into a managed block.
- **FR-006**: A lifecycle refusal MUST describe an untracked path as untracked.
- **FR-007**: `init`'s closing report MUST name committing the scaffold.
- **FR-008**: An amendment that retires a sentence MUST ship a tombstone on the
  retired phrase — the mechanism that makes this class self-detecting.

### Key Entities

- **Retired phrase**: the exact words an amendment removed from force.
- **Restatement**: any unanchored copy of a rule — a row body, a doc page, a
  constitution section, a test title.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `mvac count 'brain:** /pins two runtime dependencies/'` and its
  variants return zero outside recorded amendments.
- **SC-002**: Every row named in US2 states only what the code does.
- **SC-003**: The skill's examples parse, and its named mechanisms exist.
- **SC-004**: A fresh `init` followed by `change new` succeeds when the user
  follows the printed report.
- **SC-005**: A tombstone exists for each phrase this change retires, so the
  next copy is a red rather than an audit finding.
- **SC-006**: The existing suite passes.

## Assumptions

- The corpus's WITHDRAWN convention (MV-29, MV-31) is the sanctioned way to
  retire a clause without deleting the history of it.
- Correcting the constitution is in scope for a change, per the project's own
  instruction to amend it in place and bump its version on a principle change.
- The harness-hook fix (a red verify never reaching the agent) is deliberately
  NOT in this change: it requires blocking the agent's edit, which is a policy
  decision for the operator, and it is recorded rather than taken.
