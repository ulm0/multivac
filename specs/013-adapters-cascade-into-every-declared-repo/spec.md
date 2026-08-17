# Feature Specification: Adapters cascade into every declared repo

**Feature Branch**: `013-adapters-cascade-into-every-declared-repo`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Declared SDD and grapher adapters must reach every declared, present repo, not just whichever root happens to answer first."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One repo's tooling stops standing in for the ecosystem's (Priority: P1)

An operator declares an SDD tool in a brain that governs six repos. One of those
repos was initialized by hand, months ago. Today the operator expects the
lifecycle to make the tool's steps runnable everywhere it declared them, and
instead nothing happens anywhere — not in the sibling repos, and not even in the
brain — because the check that decides "is this installed" is satisfied by the
one repo that was done by hand.

**Why this priority**: This is the defect that silently disables the whole
feature. Every other story in this spec is visible only once the lifecycle stops
concluding, from a single repo, that the ecosystem is already equipped. It is
also the shape that produces a green report over an unequipped ecosystem, which
Principle II names as the failure the project exists to prevent.

**Independent Test**: Take an ecosystem where exactly one declared repo carries
the SDD's artifact and every other root carries none. Run the lifecycle point
that scaffolds. Each root without the artifact is scaffolded and says so; the
one that has it is passed over in silence.

**Acceptance Scenarios**:

1. **Given** a brain plus five declared repos where only one repo has the SDD's
   artifact, **When** the operator runs the lifecycle point that scaffolds,
   **Then** the brain and the four bare repos are each scaffolded, and the
   already-equipped repo is left untouched.
2. **Given** the same ecosystem after that run, **When** the operator runs the
   same lifecycle point again, **Then** nothing is scaffolded and nothing is
   reported: every root already has the artifact.
3. **Given** a declared repo that is not present on disk, **When** the lifecycle
   scaffolds, **Then** that repo is skipped and named as absent, and no
   directory is created for it.
4. **Given** an operator who does not want the SDD in one particular repo,
   **When** that repo declares its own adapter override, **Then** the lifecycle
   never scaffolds there and never counts that repo's absence against any gate.

---

### User Story 2 - The report names the repo it is talking about (Priority: P2)

An operator runs the diagnostic to find out where their declared tooling stands.
For the code graph they get one line per repo, each naming the scope and the
command to run there. For the SDD they get one line for the entire ecosystem,
and that line reports the state of whichever repo answered first — so five
unequipped repos read as "ok".

**Why this priority**: Without it the operator cannot see the problem Story 1
fixes, cannot confirm the fix landed, and cannot tell which repo still needs a
human. The diagnostic is also what an operator reaches for before deciding
whether to trust a gate.

**Independent Test**: In an ecosystem where the SDD's artifact exists in some
roots and not others, run the diagnostic. Every declared, present root appears
by the name the config gave it, with its own verdict.

**Acceptance Scenarios**:

1. **Given** an ecosystem where one repo has the SDD's artifact and four do not,
   **When** the operator runs the diagnostic, **Then** it prints one line per
   declared, present root, each naming that root's scope and its own state.
2. **Given** the same ecosystem, **When** the diagnostic reports the SDD's
   project-level document, **Then** it reports that document per root, and never
   presents one root's document as the ecosystem's.
3. **Given** a root where the tool's artifact is missing, **When** the diagnostic
   reports it, **Then** the line names the command that would install it there
   and states that the diagnostic is not the thing that runs it.

---

### User Story 3 - A declared repo that no change has touched still has a graph (Priority: P3)

An operator declares a code graph tool for the ecosystem. The brain has a graph,
because the brain is where changes happen. Five sibling repos have none and
never will: the graph is only ever built for repos a change explicitly touched,
so a repo has to be worked on before it can be navigated — exactly backwards for
an agent that needs the graph in order to work on it.

**Why this priority**: It is a real gap with a visible cost, but the diagnostic
already reports it per repo and names the command, so an operator can act on it
today. Stories 1 and 2 have no such workaround.

**Independent Test**: In an ecosystem where the brain has a graph and the
declared repos have none, run the lifecycle. Each declared, present repo without
a graph gets its first build and says so.

**Acceptance Scenarios**:

1. **Given** declared, present repos with no graph artifact, **When** the
   operator runs the lifecycle, **Then** each of those repos gets its first
   build, named by scope.
2. **Given** a repo that already has a graph, **When** the lifecycle runs,
   **Then** its existing refresh behaviour is unchanged and no second build is
   forced.
3. **Given** a repo whose declared grapher is not installed on this machine,
   **When** the lifecycle reaches it, **Then** it reports the install hint and
   the command, builds nothing, and does not fail the lifecycle.

---

### Edge Cases

- **A root that the tool's own init fails in.** The failure is reported in the
  tool's own words, with the command handed back, and the remaining roots are
  still attempted — one repo's broken checkout must not decide the fate of five.
- **A tool with no declared init.** Nothing is guessed. The gap is stated once
  per root that lacks the artifact, naming what the operator must run there.
- **The tool's binary is absent.** Nothing runs anywhere; the install hint is
  reported, and the gates that follow still refuse on their own terms.
- **An init that exits 0 and writes nothing.** The artifact decides, not the exit
  code: that root is reported as still not equipped.
- **A repo declared but absent from disk.** Named as absent, never created,
  never counted as equipped, and never counted as failing.
- **A repo the operator excluded from the SDD.** Never scaffolded, never gated,
  and its absence never reported as a deficiency.
- **Automation switched off** (`sdd_auto: false`, or the per-run skip flag).
  Nothing is scaffolded and nothing is gated, exactly as today.
- **Many repos.** The report stays one line per root per subject, so an
  ecosystem of six does not bury the one line that matters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The lifecycle MUST evaluate "is this tool installed here" per root,
  where a root is the brain plus every declared repo present on disk. The
  presence of a tool's artifact in one root MUST NOT suppress any action in
  another root.
- **FR-002**: The lifecycle MUST run the declared tool's own init in every root
  that lacks the artifact, and MUST leave every root that has it untouched and
  unmentioned.
- **FR-003**: Each init MUST be announced before it runs, naming the root it runs
  in and the command being run verbatim.
- **FR-004**: A root whose init fails MUST be reported with the tool's own words
  and the command to run by hand, and MUST NOT prevent the remaining roots from
  being attempted.
- **FR-005**: The result of each init MUST be judged by whether the artifact is
  now present in that root, never by the exit code alone.
- **FR-006**: A repo MUST be able to declare its own SDD adapter, or to declare
  that it has none, overriding the ecosystem-wide declaration — the same override
  the code graph tool already has.
- **FR-007**: The diagnostic MUST report the SDD's state once per declared,
  present root, naming that root by the key the config gave it.
- **FR-008**: The diagnostic MUST report the SDD's project-level document per
  root, and MUST NOT present one root's document as the ecosystem's.
- **FR-009**: The gate on the project-level document MUST ask per root, and MUST
  refuse while any root where the SDD is installed lacks a written document.
  Every refusal MUST name the root.
- **FR-010**: The lifecycle MUST build the code graph once in every declared,
  present repo that has no graph artifact yet, naming each scope.
- **FR-011**: The existing per-change graph refresh MUST keep its current
  behaviour: a repo that already has a graph is refreshed as it is today.
- **FR-012**: Nothing this feature adds may run from `verify`, `doctor` or
  `doors`. Every action that runs a foreign tool stays inside the change
  lifecycle.
- **FR-013**: No command may be guessed or derived from a tool's name. A tool
  that declares no init gets no init, and the gap is stated per root.
- **FR-014**: The closing ceremony stays print-only. No enforcement introduced by
  this feature may be added to it.
- **FR-015**: The existing switches that turn the SDD automation off MUST turn
  off every behaviour this feature adds to it.
- **FR-016**: Where a change is refused or an action skipped, the message MUST
  name every root that was examined, so an operator in an ecosystem of six knows
  which checkout to open.

### Key Entities

- **Root**: One directory the declared tooling may live in — the brain, or one
  declared repo present on disk — carrying the name the config gave it. The unit
  every check, every action and every report in this feature is scoped to.
- **Adapter declaration**: The ecosystem-wide choice of SDD tool and code graph
  tool, optionally overridden per repo.
- **Artifact**: What a tool leaves on disk that proves it has run in a root. The
  only evidence any check here accepts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In an ecosystem where one repo was equipped by hand and the rest
  were not, one lifecycle run leaves every declared, present root equipped —
  where today it leaves zero.
- **SC-002**: The diagnostic's output contains exactly one line per declared,
  present root per subject reported, and an operator can name the unequipped
  repos from that output alone without opening a directory.
- **SC-003**: No root is ever reported as equipped on the strength of a different
  root's files.
- **SC-004**: A repo excluded from the SDD by its own declaration produces no
  scaffold, no gate refusal and no deficiency line.
- **SC-005**: A repo declared and present but never touched by any change has a
  usable code graph after one lifecycle run.
- **SC-006**: `verify`, `doctor` and `doors` make no network call and run no
  foreign tool's init, before and after this change alike.
- **SC-007**: Every message this feature adds names the root it is about.

## Assumptions

- **The per-repo SDD override mirrors the code graph one.** The config already
  lets a repo declare its own code graph tool, falling back to the
  ecosystem-wide declaration. The SDD override is assumed to take the same
  shape and the same fallback rather than inventing a second mechanism.
- **A root with no SDD declared is out of scope, not deficient.** Excluding a
  repo is an ordinary configuration, so it produces silence rather than a
  notice.
- **The project-level document is gated only where the tool is installed.**
  Gating it in a repo that does not run the SDD would refuse work over a
  document that repo has no reason to own.
- **The first graph build uses the same command the diagnostic already names.**
  No new command is introduced for building versus refreshing beyond what an
  adapter already declares.
- **Ordering across roots is the brain first, then declared repos in config
  order.** The brain is where the change is being run from, so its state is the
  one the operator sees first.
- **Absent repos stay absent.** Nothing here clones, and a declared repo missing
  from disk is reported rather than fetched.
</content>
</invoke>
