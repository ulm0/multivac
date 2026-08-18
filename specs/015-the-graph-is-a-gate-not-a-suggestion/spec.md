# Feature Specification: A declared grapher leaves a graph, or close refuses

**Feature Branch**: `the-graph-is-a-gate-not-a-suggestion`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Declaring a grapher currently obliges nothing. The SDD adapter is gated at both ends and therefore means something; the grapher's every failure path is a notice that keeps going. A change can close with four declared repos ungraphed and say nothing about it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Closing a change tells me the graph is missing (Priority: P1)

An operator declared a code-graph tool for the ecosystem because agents are told
to ask the graph before reading the tree. They finish a change and close it. If
any declared, present repo has no graph, closing must stop and say which repos
and what to run there — not close quietly and leave the gap for somebody to
discover months later by noticing that agents have been grepping all along.

**Why this priority**: this is the whole feature. Everything else here is about
being honest at the edges of it.

**Independent Test**: declare a grapher, delete the graph in one declared repo,
close a change, and confirm it refuses naming that repo and the command that
builds one there.

**Acceptance Scenarios**:

1. **Given** a declared grapher and every declared, present repo holding a
   graph, **When** the operator closes a change, **Then** closing proceeds as
   it does today.
2. **Given** a declared grapher and two declared, present repos with no graph,
   **When** the operator closes a change, **Then** closing is refused, both
   repos are named, and the command that produces a graph in each is printed.
3. **Given** the refusal above, **When** the operator reads the next line,
   **Then** it names both ways to proceed without it — one for this run, one
   for good.
4. **Given** a declared, present repo whose files changed since its graph was
   written — by a merge, a sync, or work outside this change — **When** the
   operator closes a change, **Then** its graph is refreshed too: the refresh
   covers every declared, present repo, not only the ones this change touched.
5. **Given** a repo declared in the configuration but not present on disk,
   **When** the operator closes a change, **Then** it is not counted as a gap:
   the tool never demands an artifact in a directory that is not there.

---

### User Story 2 - A gate that cannot be evaluated refuses (Priority: P2)

The operator declared a grapher but the tool is not installed on this machine.
Closing must refuse rather than pass, because "no graph found and no way to
look" is not evidence that anything is fine.

**Why this priority**: without it the gate is trivially bypassed by not
installing the tool, which is the same as not having a gate — and it would be
the tool passing on a check it never made.

**Independent Test**: declare a grapher whose binary is absent from the path
and confirm closing refuses, naming the binary and how to install it.

**Acceptance Scenarios**:

1. **Given** a declared grapher whose binary is not on the path, **When** the
   operator closes a change, **Then** closing is refused, the binary is named,
   and the install hint the adapter declares is printed.
2. **Given** a declared grapher name that the tool has never verified — no
   registry entry and no declaration of its own — **When** the operator closes
   a change, **Then** closing is NOT refused on its account: the fields to
   declare are reported instead. Nothing is required of a tool whose commands
   would have to be guessed.

---

### User Story 3 - Out of scope is reported as out of scope, not as a gap (Priority: P3)

Some repos are deliberately not graphed. An operator who set that must not be
told, once per change, that something is missing.

**Why this priority**: a gate that cries about deliberate choices is a gate
people learn to switch off, which costs more than it was ever worth.

**Independent Test**: mark one repo as having no grapher, leave it with no
graph, and confirm closing succeeds and describes it as out of scope.

**Acceptance Scenarios**:

1. **Given** a repo whose configuration opts it out of graphing, **When** the
   operator closes a change, **Then** closing succeeds and that repo is
   described as out of scope rather than as a gap.
2. **Given** an ecosystem with no grapher declared at all, **When** the
   operator closes a change, **Then** nothing about graphs is required or
   printed.

---

### User Story 4 - An agent entering from a sibling repo is told about the graph (Priority: P2)

The brain's door already names the graph tool, its artifact and its query verbs
— that block is projected, not hand-written. The door projected into every
OTHER declared repo carries none of it: four bullets about the law, the mount
and `verify`, and nothing about any adapter.

That is where it matters most. An operator who enters the ecosystem through a
code repo rather than through the brain — which is the normal case, because
code is where work happens — gets an agent that never learns a graph exists and
greps instead. Meanwhile this change is about to REFUSE a close for the absence
of an artifact that repo's own door never mentioned.

**Why this priority**: it is the other half of the gate. Requiring the artifact
in a repo whose door never names it is the tool talking to itself.

**Independent Test**: project the doors in an ecosystem with a declared grapher
and confirm a sibling repo's door names the tool, its artifact and its verbs,
using the grapher that applies to THAT repo.

**Acceptance Scenarios**:

1. **Given** a declared grapher and a sibling repo, **When** the doors are
   projected, **Then** that repo's door instructs the agent to consult the
   graph before reading the tree, naming the tool and where its graph lives.
2. **Given** a repo with its own grapher override, **When** the doors are
   projected, **Then** its door names THAT tool, not the ecosystem's.
3. **Given** a repo opted out with `grapher: none`, **When** the doors are
   projected, **Then** its door says nothing about graphs.
4. **Given** a grapher that declares no query commands, **When** the doors are
   projected, **Then** the door says so in the words the brain's door already
   uses, and invents nothing.

---

### Edge Cases

- Every declared repo is missing a graph: all are named in one refusal, not one
  refusal per repo discovered in sequence.
- A repo is present but the graph tool fails while building there: closing
  refuses, because the artifact still does not exist — and the tool's own words
  about why are already printed by the build step.
- The escape hatch is used: closing proceeds, and the fact that the gate was
  skipped is stated rather than silent.
- The graph exists but is stale: out of scope. This gate asks whether a graph
  exists, never whether it is current — staleness is a different question with
  a different answer, and claiming to check it would be claiming more than was
  checked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Closing a change MUST refuse when a declared grapher has left no
  graph in a declared, present repo.
- **FR-002**: The refusal MUST name every repo missing a graph in a single
  message, and the command that produces one in each.
- **FR-003**: The refusal MUST name both ways to proceed without the gate — one
  that applies to a single run, one that applies until it is changed back — on
  the line after the refusal.
- **FR-004**: A declared repo that is not present on disk MUST NOT be counted as
  a gap.
- **FR-005**: Closing MUST refuse when a declared grapher's binary is not
  available, naming the binary and the install hint the adapter declares.
- **FR-006**: Closing MUST NOT refuse on account of a grapher the tool has never
  verified; the fields to declare are reported instead.
- **FR-007**: A repo explicitly opted out of graphing MUST be reported as out of
  scope, never as a gap, and MUST NOT cause a refusal.
- **FR-008**: An ecosystem with no grapher declared MUST see nothing about
  graphs required or printed at close.
- **FR-009**: When the gate is skipped through either escape hatch, the fact
  that it was skipped MUST be stated.
- **FR-010**: The gate MUST run only at the step that decides a change is done.
  No earlier lifecycle step may refuse on the graph's account.
- **FR-011**: The gate MUST NOT run in any command that is required to work
  offline and without spawning a foreign tool.
- **FR-012**: The gate MUST ask only whether a graph exists, never whether it is
  current.
- **FR-014**: Refreshing MUST cover every declared, present repo at close, not
  only the repos the change touched. A repo whose files moved by any route —
  another change, a merge, a sync — must not be left describing a tree that is
  gone, because the graph's whole purpose is that an agent can trust it instead
  of reading the tree.
- **FR-015**: The door projected into a declared repo MUST carry the graph
  block the brain's door already carries, resolved with the grapher that
  applies to THAT repo — the per-repo override first, the ecosystem's
  otherwise. A repo with no grapher applying to it MUST get no graph block.
- **FR-016**: That block MUST be produced by the same code that produces the
  brain's, never a second rendering. Two renderings of one block is how the two
  come to disagree, and the door is the surface where disagreement is least
  visible.
- **FR-013**: The law row governing this behaviour MUST land in the same change
  as the behaviour, with anchors that resolve against the code; the existing row
  that made the adapter reach every repo MUST be amended in place to record that
  reaching them is now required rather than attempted.

### Key Entities

- **Root**: the brain plus every declared repo present on disk, each carrying
  the graph tool that applies to it — the per-repo choice first, the
  ecosystem's otherwise. Already the unit every part of this adapter uses; this
  feature adds no new way to enumerate them.
- **Gate verdict per root**: one of *satisfied* (a graph is there), *missing*
  (the tool applies and there is no graph), *out of scope* (no tool applies), or
  *unevaluable* (the tool applies but cannot be run). Only *missing* and
  *unevaluable* refuse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An ecosystem with a declared grapher cannot complete a change
  while any declared, present repo lacks a graph, unless the operator says so
  explicitly.
- **SC-002**: A refusal names every offending repo in one message; an operator
  never has to close repeatedly to discover the full list.
- **SC-003**: Declaring a graph tool that is not installed never results in a
  change closing as though the check had passed.
- **SC-004**: A repo deliberately excluded from graphing produces no gap
  message across any number of changes.
- **SC-005**: The commands that are required to run offline remain unchanged in
  what they spawn and what they reach.

## Assumptions

- The gate belongs at the step that decides a change is done, not at the step
  that opens one. Someone opening a change should not be stopped by a tool they
  have not installed yet; someone declaring the work finished should be.
- The two escape hatches mirror the ones the specification-driven adapter
  already offers, in the same words, because two adapters with two vocabularies
  for the same idea is a tax on the reader.
- The graph artifact stays uncommitted, exactly as it is today. This feature
  changes when a graph must exist, never where it lives or whether it is
  tracked.
- Freshness stays a report and does not become a gate. A row that claims to
  check currency would be claiming more than it checked.
- Refreshing every declared repo at close is affordable because the declared
  refresh command is a local parse with no model call and no network. If that
  ever stops being true for some adapter, the answer is to skip repos whose
  files have not moved — not to go back to refreshing a subset chosen by which
  repos a change happened to name.
- One configuration key is introduced, mirroring the one the
  specification-driven adapter already has, so an ecosystem can keep its graph
  tool and drop the gate. The per-repo opt-out already exists and is unchanged.
  A second vocabulary for the same idea would be a tax on the reader, so the
  new key is named after the existing one rather than invented fresh.
