# Feature Specification: A door in a code repo names the ecosystem, not only the law

**Feature Branch**: `the-consumer-door-carries-the-ecosystem`

**Created**: 2026-08-18

**Status**: Draft

**Input**: "If instead of entering from the brain repo I enter through one of the underlying repos, then on pulling the brain it should have context of the whole ecosystem."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The door names the ecosystem it belongs to (Priority: P1)

An agent opens a code repository in an ecosystem. Its door tells it the law
exists and where the brain is mounted. It does not tell it what else is in the
ecosystem, which repositories a change might cross, or what any of them are for.

The brain's own door lists them. The door in the repository where work actually
happens does not — and that is the door most sessions start from, because code
is where work happens.

**Why this priority**: entering through a code repo is the normal case. A door
that describes a two-repo world when there are six is the tool withholding what
it knows.

**Independent Test**: project the doors in a multi-repo ecosystem and confirm a
sibling repo's door names the others, marks which one it is, and names the
handle used for the brain.

**Acceptance Scenarios**:

1. **Given** an ecosystem of several declared repositories, **When** the doors
   are projected, **Then** each repository's door lists the others and marks
   which entry is the repository being read.
2. **Given** a repository declaring a one-line role, **When** the doors are
   projected, **Then** that role appears beside its entry; when none is
   declared, the entry carries the path alone and nothing is invented.
3. **Given** any ecosystem, **When** a door lists the repositories, **Then** it
   also names the handle that stands for the brain, because that handle is
   usable in anchors and can never appear in a list built from the declared
   repositories.
4. **Given** an ecosystem with a single declared repository, **When** the doors
   are projected, **Then** no list is printed: a list whose only row is "this
   repo" is noise.

---

### User Story 2 - The mount refresh is the first instruction, not the second bullet (Priority: P1)

The brain is mounted in each repository at a pinned commit. The pin stays where
the last commit left it, so a present mount is not a current one — an agent that
reads it without refreshing decides against weeks-old law.

The door already says to refresh. It says it as one of four bullets, after the
law and before two others.

**Why this priority**: it is the only instruction in that door with an ordering
requirement. Everything else can be read in any order; this one has to happen
before the rest is trustworthy.

**Independent Test**: project a consumer door and confirm the refresh is the
first thing instructed, with its reason attached.

**Acceptance Scenarios**:

1. **Given** any consumer door, **When** it is read, **Then** the refresh
   instruction appears before the law, the ecosystem list and the adapters,
   and carries the reason a present mount is not a current one.
2. **Given** an ecosystem configured to treat a stale pin as blocking, **When**
   the door is projected, **Then** it still says so, exactly as it does today.

---

### User Story 3 - The adapters that apply here are named here (Priority: P2)

An ecosystem declares a specification-driven tool. The brain's door explains the
flow. The door in the repository where the feature will be built says nothing
about it, so an agent working there does not know a flow exists, let alone that
the lifecycle will refuse without its artifacts.

**Why this priority**: it completes the pattern the graph block already
established, and it is the difference between a gate that looks arbitrary and
one that was announced.

**Independent Test**: declare a specification-driven tool and confirm a sibling
repo's door names it and its flow, resolved with the tool that applies to that
repository.

**Acceptance Scenarios**:

1. **Given** a declared specification-driven tool, **When** the doors are
   projected, **Then** each repository's door names it and its per-change flow.
2. **Given** a repository that opts out of that tool, **When** the doors are
   projected, **Then** its door says nothing about it.
3. **Given** any door naming that tool, **When** it describes scaffolding,
   **Then** it says what the lifecycle actually does — runs the tool's own init
   where the artifact is missing, or says why it could not — and does not name
   a single lifecycle step as if it were the only one.

---

### Edge Cases

- A declared repository is absent from disk: it still appears in every other
  repository's list, because the list describes what the ecosystem declares,
  not what this machine happens to have checked out. The door makes no
  filesystem check of any kind.
- A role is declared as several lines: it is reduced to one line, because the
  list is a list.
- The brain is its own code repository: its entry is not duplicated into the
  sibling list, and its door remains the brain's door.
- No specification-driven tool is declared: no block about one appears.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A door projected into a declared repository MUST list the other
  declared repositories and mark which entry is the repository being read.
- **FR-002**: The list MUST also name the handle that stands for the brain,
  which is usable in anchors and never appears among the declared repositories.
- **FR-003**: A repository MAY declare a one-line role, which MUST appear beside
  its entry when present and MUST NOT be invented when absent.
- **FR-004**: A declared role spanning several lines MUST be reduced to one.
- **FR-005**: No list MUST be printed when only one repository is declared.
- **FR-006**: The mount refresh MUST be the first instruction in the door, with
  the reason a present mount is not a current one.
- **FR-007**: A door MUST carry the specification-driven tool's block when one
  applies to that repository, resolved per repository, and MUST omit it when
  none does.
- **FR-008**: Any description of scaffolding MUST state what the lifecycle
  actually does, including that it may report why it could not, and MUST NOT
  name one lifecycle step as though it were the only one.
- **FR-009**: Rendering a door MUST make no filesystem check and no network
  call: it renders from what is declared.
- **FR-010**: The list MUST describe what the ecosystem declares, not what this
  machine has on disk.
- **FR-011**: The law row MUST land in the same change, with anchors that
  resolve against the code, and the rows this behaviour makes stale MUST be
  amended in place.

### Key Entities

- **Declared repository**: a key, a path, and optionally a role, a URL, and
  per-repository adapter overrides. Gains one optional field.
- **Consumer door**: the managed block written into each declared repository.
  Gains the ecosystem list, the adapter blocks, and a reordered opening.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any repository's door alone, a reader can name every other
  repository in the ecosystem and which one they are in.
- **SC-002**: The first instruction in every consumer door is to refresh the
  mount.
- **SC-003**: A door never states an adapter's behaviour more strongly than the
  lifecycle implements it.
- **SC-004**: Projecting doors touches no file outside the doors themselves and
  reaches no network.

## Assumptions

- What a repository is *for* cannot be derived from its path, so it is declared
  or omitted. A guessed description is worse than none.
- The list is of declarations, not of checkouts. A door that changed depending
  on which repositories happen to be cloned would differ between machines for
  reasons unrelated to the ecosystem.
- The brain keeps its own door. Naming its handle in a list is not giving it a
  consumer door.
