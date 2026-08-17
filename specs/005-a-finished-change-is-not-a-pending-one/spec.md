# Feature Specification: A finished change is not a pending one

**Feature Branch**: `005-a-finished-change-is-not-a-pending-one`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "verify --strict refuses a finished-but-unclosed
change, and landing is read from the channel ref"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A change whose every declared claim already resolves stops the strict gate (Priority: P1)

A maintainer declares a change, writes the code it promised, merges it, and
records every repository it touched as landed. Then nothing else happens: the
change file is still in the open folder, so every rule that change named is
still excused from the gate. Weeks pass. Nine changes accumulate in exactly
this state, and between them they hold fourteen rules non-blocking. Breaking
any of those fourteen prints as a notice and exits success. The strict check
reports green the whole time, and part of that green is grace rather than
proof.

**Why this priority**: This is the damage. Every other story in this feature
exists to stop this one recurring. A gate that is green for a reason nobody
asked for is worse than a red one, because nobody looks again.

**Independent Test**: Declare a change naming one rule and one repository,
write code that satisfies that rule, record the repository as landed, and run
the strict check. It must fail, name the change by its short name, and say to
close it. Then delete or close the change and run again: it must pass.

**Acceptance Scenarios**:

1. **Given** an open change whose single declared rule resolves against the
   code and whose only declared repository is recorded as landed, **When** the
   strict check runs, **Then** it exits failure, names the change's short name,
   and states that closing it is the fix.
2. **Given** the same repository, **When** the ordinary (non-strict) check
   runs, **Then** it exits success, because the ordinary check has never gated
   on anything but the blocking modes and this feature does not change that.
3. **Given** an open change declaring two rules, one resolving and one not,
   **When** the strict check runs, **Then** the change is not called finished:
   the unresolved rule reports as pending exactly as before and the run does
   not fail on this feature's account.
4. **Given** an open change whose declared rules all resolve but whose declared
   repository is not yet recorded as landed — the ordinary state of work in
   progress on the author's own branch — **When** the strict check runs,
   **Then** the change is not called finished and the run does not fail on this
   feature's account.
5. **Given** an archived or non-open change, **When** the strict check runs,
   **Then** this feature says nothing about it, because a closed change already
   confers nothing.

---

### User Story 2 - A change that has declared nothing is never called finished (Priority: P1)

A maintainer opens a change to reserve an identifier and goes to lunch. The
change names no rules at all. Read as a universal statement, "every declared
rule resolves" is true of it — there are no rules to fail — so a naive reading
would announce this five-minute-old empty change as finished and tell the
maintainer to close it, when closing it is precisely wrong: it has landed
nothing, and the door for a change that made no promises is the abandon door,
not the close door.

**Why this priority**: A gate that fires on the newest, emptiest change in the
repository would be uninstalled within a day, taking Story 1 with it. The whole
value of Story 1 is that its red means something, and a vacuous red destroys
that in one run.

**Independent Test**: Open a change that declares no rules and run the strict
check. It must not name that change as finished, and must not fail on this
feature's account.

**Acceptance Scenarios**:

1. **Given** an open change declaring zero rules, **When** the strict check
   runs, **Then** the change is never reported as finished, and the run does
   not fail on this feature's account.
2. **Given** an open change declaring a rule that carries no anchor at all,
   **When** the strict check runs, **Then** the change is not reported as
   finished, because a rule nothing checks has not been shown to resolve.
3. **Given** an open change whose every declared rule is also declared by an
   earlier open change, **When** the strict check runs, **Then** the later
   change is not reported as finished, because the rules it would be judged on
   are held by the earlier one.

---

### User Story 3 - Landing is read from what was published, not from what was merged locally (Priority: P2)

A maintainer lands a change through a merge request that squashes. Back in the
brain, the landing step looks for the change's branch inside the default
branch, finds nothing — squashing guarantees it will find nothing, forever —
and says so. The record that the change landed is therefore a human assertion
with no evidence behind it, and that missing evidence is why nobody is
confident enough to close, which is how Story 1's nine open changes came to
exist.

The evidence does exist. The project already reads every declared repository at
its published reference rather than at its working copy. Pointed at the brain's
own published reference, the same read answers the landing question directly:
if the rules the change promised resolve against what is published, the work is
published, however it got there. Squashing destroys the commit trail; it does
not change the content.

**Why this priority**: It removes the cause of Story 1 rather than its symptom,
but Story 1's gate is valuable on its own and must not wait for it. Ranked
second because the gate is the thing that stops damage today.

**Independent Test**: Publish a repository whose published reference contains
the code a change promised, then run the landing step for that change. It must
state that the declared rules resolve against the published reference, name how
old that reference is, and offer the record-it command. Run the same step
against a published reference that does *not* contain the code: it must say
that the rules do not resolve there and that this means either not landed or
not fetched, never only the first.

**Acceptance Scenarios**:

1. **Given** a change whose declared rules resolve at the brain's published
   reference, **When** the landing report runs, **Then** it states that the
   work is published there, names the reference and how long ago it was last
   fetched, and prints the command that records the landing.
2. **Given** the same change, **When** the landing is recorded, **Then** the
   confirmation cites the published reference as the evidence rather than
   reporting an absent local merge.
3. **Given** a change whose declared rules do not all resolve at the published
   reference, **When** the landing is recorded, **Then** it is still recorded —
   the human's assertion stands — and the report says the rules do not resolve
   there, that this means either not landed or not fetched, and names the
   fetching command.
4. **Given** a repository with no published reference to read (no remote, or
   never fetched), **When** the landing step runs, **Then** its behaviour is
   exactly what it was before this feature: the local merge evidence, or the
   plain statement that there is none.
5. **Given** a change that declares no rules, **When** the landing step runs,
   **Then** no published-reference claim is made, because there is nothing to
   read.

---

### Edge Cases

- A change declares rules and every one of them resolves, but the run is scoped
  to a single consuming repository. Only some of that change's checks were
  evaluated, so no finished verdict is reached: a verdict about bytes the run
  never read would be the same lie this project exists to prevent.
- A run restricted to one change's rules — the closing gate — makes no finished
  verdict either. That run deliberately switches the pending grace off, so
  there is no grace to withdraw.
- A rule declared by an open change can never be reported as self-healed: the
  grace rewrites every non-passing result to pending. Passing is therefore the
  only state a declared rule can be in besides pending, which is what makes the
  finished test a single comparison rather than a list of tolerated states.
- Two open changes declare the same rule. The grace already attributes that
  rule to the first change alone; the finished test inherits that attribution,
  so the second change is judged on the rules left to it, which may be none —
  and none is never finished.
- The published reference resolves but is a month stale. The report says the
  age out loud and never converts an unresolved rule into "not landed"; the
  operator is told the other possibility and the command that removes it.
- The published reference does not resolve at all. Nothing is claimed about
  publication and every existing landing message is unchanged.
- Recording a landing is never refused on published-reference evidence. The
  evidence is offered; the assertion stays the human's.
- Closing is never automatic. The strict check names the change and prints the
  command; it does not archive anything, because where the archive commit goes
  depends on a branch that belongs to the operator.
- The author's own branch, at the moment the tests go green. Every rule the
  change declared now resolves, but the change has landed nothing and its
  repositories are still recorded as in progress. It is not finished; it is
  unlanded, and no verdict is reached. Without this, the gate would fire on
  every author on every change at the exact moment their work started working,
  which is where a gate gets uninstalled.
- A change one of whose repositories is landed while another is not. Not
  finished: the closing step refuses a change with any repository outstanding,
  so the instruction would be rejected by the system that printed it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST distinguish a **finished** open change — one that
  declares at least one rule, whose every declared rule resolves, and whose
  every declared repository is recorded as landed — from every other open
  change, using only what the check already computes: no network access and no
  fetch.
- **FR-002**: The strict form of the check MUST exit failure when at least one
  open change is finished by FR-001, MUST name each such change by its short
  name, and MUST state that closing it is the fix.
- **FR-003**: The ordinary form of the check MUST NOT fail on account of a
  finished change. The grace this feature withdraws is withdrawn under the
  strict form only, which is the form the project's own contribution guide and
  continuous integration require to be green.
- **FR-004**: A change declaring zero rules MUST NOT be reported as finished. A
  declared rule that produced no evaluated result — because nothing anchors it
  — MUST NOT count as resolved.
- **FR-005**: A change with a declared repository not yet recorded as landed
  MUST NOT be reported as finished, because closing such a change is refused by
  the system's own closing step: the gate MUST NOT print an instruction the
  system will then reject.
- **FR-006**: A verdict of finished MUST NOT be reached by a run that evaluated
  only part of the checks: a run scoped to one consuming repository, and a run
  restricted to one change's rules, MUST make no such verdict.
- **FR-007**: The finished report line and the exit code MUST come from one
  decision, so that a run marked as failing for this reason exits failure and a
  run that exits success carries no such marking.
- **FR-008**: The landing step MUST be able to answer "did this land?" by
  reading the brain's own published reference and evaluating the change's
  declared rules against those bytes, instead of testing whether the change's
  branch is contained in the default branch.
- **FR-009**: Every statement the landing step makes about the published
  reference MUST name that reference and how long ago it was last fetched, and
  MUST NOT read an unresolved rule as "not landed" without also stating that
  it may mean "not fetched" and naming the command that fetches.
- **FR-010**: Recording a landing MUST remain a human assertion. The published
  reference read MUST offer its conclusion and MUST NOT refuse, block, or
  automatically write the landed record.
- **FR-011**: When the brain's published reference cannot be resolved, or the
  change declares no rules, the landing step's existing messages — the local
  merge evidence and the plain statement that there is none — MUST be unchanged.
- **FR-012**: Closing MUST stay manual. Nothing in this feature may archive a
  change, move its file, or commit on the operator's behalf.
- **FR-013**: The stated law MUST carry this behaviour as a dated row with
  anchors that resolve against the code that implements it, landing in the same
  change as the behaviour.
- **FR-014**: The check MUST stay within its existing performance and
  dependency constraints: it runs in a pre-commit hook, enumerates files
  through the version control index rather than by walking the tree, and adds
  no runtime dependency.

### Key Entities

- **Open change** — a declaration file in the changes folder whose status is
  open. It names the repositories it touches and the rules it will make true.
  Only open ones confer the pending grace; archived ones confer nothing.
- **Declared rule** — an identifier the change promises to make true. Its
  resolution is decided by the anchors written for it in the stated law.
- **Pending grace** — the rewriting of any non-passing result for a declared
  rule into "pending, declared by <change>", which is what stops declare-first
  work from failing the gate.
- **Finished change** — an open change that declares at least one rule, whose
  declared rules all produced a passing result in this run, and whose every
  declared repository is recorded as landed. It is not pending; it is finished
  and unclosed. The three conditions together are exactly the state in which
  the closing step would succeed and nothing but running it remains.
- **Published reference** — the reference naming what a repository has
  published, per repository or globally configured. Reading it is offline: it
  is a local snapshot whose age is a fact the report carries.

## Success Criteria *(mandatory)*

- **SC-001**: In a repository holding one open change whose single declared
  rule resolves and whose single declared repository is recorded as landed, the
  strict check exits failure and its output names that change exactly once with
  the instruction to close it; with that change removed, the same check exits
  success.
- **SC-002**: In a repository holding one open change with a declared rule that
  does not resolve, the strict check exits success on this feature's account
  and the rule still reports as pending naming that change.
- **SC-003**: In a repository holding an open change declaring zero rules, the
  strict check names 0 changes as finished and raises 0 failures on this
  feature's account. The same holds for an open change whose rules all resolve
  while any declared repository is not yet recorded as landed.
- **SC-004**: With a published reference containing the promised code, the
  landing report states that the work is published, names the reference and its
  fetch age, and prints the record-it command; the landed record is written
  only when the operator passes the flag that writes it, in 100% of runs.
- **SC-005**: With no published reference resolvable, the landing step's output
  is byte-for-byte what it was before this feature for the same inputs.
- **SC-006**: Reverting each behaviour this feature claims, in the source, makes
  at least 1 named check fail for that behaviour — a claim with no failing
  check behind it is not claimed.
- **SC-007**: The whole check suite passes and the strict form of the project's
  own verification exits 0, with the law row for this behaviour resolving
  against the code.

## Assumptions

- **Finished means the closing step would succeed.** The originating change
  file states the rule as "every declared claim resolves". This specification
  adds a second condition — every declared repository recorded as landed — and
  the reason is that the gate's only output is an instruction, and the
  instruction must work. The closing step already refuses a change with any
  repository outstanding; a gate that prints "close it" about a change the
  system will then reject teaches the operator to ignore the gate, which is the
  precise failure this feature exists to end. The added condition costs nothing
  against the damage that motivated the feature: every change that reaches the
  closing step has all of its repositories recorded as landed, because the
  closing step will not run otherwise, so all nine of the changes that sat open
  satisfied it. What the condition buys is that the gate stays silent on work
  in progress, where "every declared rule resolves" is the ordinary state of an
  author's branch the moment their tests pass and says nothing about being
  done.
- **Resolution is the evidence of finishedness, and vacuity is not.** "Every
  declared rule resolves" is read as "declares at least one rule, and all of
  them resolved". The empty declaration is excluded deliberately and not as an
  oversight: a universally quantified statement over nothing is true of a
  change created seconds ago, which is the exact state this feature must not
  confuse with finished. The project already routes a change that promised
  nothing to a different door — the one that gives its reserved identifier back
  — so pointing it at the closing door would be wrong as well as noisy.
- **A declared rule that nothing anchors has not resolved.** No evaluated
  result means nothing was checked, and the project's second principle forbids
  claiming more than was checked. Such rules are already named separately in
  the check's output as unanchored.
- **The finished test is a single comparison.** Because the grace rewrites
  every non-passing result for a declared rule into pending, a declared rule is
  either passing or pending — no other state is reachable — so "resolves" is
  "passing". This is a consequence of the existing grace, not a new tolerance.
- **The published-reference read offers its conclusion; the human still
  confirms.** This is the open question the change file left to this
  specification, and it is decided against deriving the record, for three
  reasons. First, the negative is ambiguous by the project's own stated law: a
  published reference is only as true as the last fetch, so an unresolved rule
  means "not landed" *or* "not fetched", and a mechanism that can only be
  trusted in one direction still needs the human for the other. Second, even
  the positive is evidence rather than proof: rules resolving against published
  bytes proves the content is published, not that this change is what published
  it — identical text could have arrived by another route. Third, the record is
  committed state in the change file; writing a falsifiable record from a local
  snapshot with no operator in the loop is the class of invented pass this
  project exists to catch. The read therefore states what it saw and prints the
  command; the flag that records stays the human's.
- **The landing verdict is per change, not per repository.** The read asks
  whether the change's declared rules resolve against what is published, which
  is the same unit the strict gate uses. A rule spanning every repository has
  no single repository to attribute it to, so a per-repository verdict would
  have to either overstate or understate it; one verdict per change avoids
  inventing a number and matches how the rules are written.
- **Reading the brain at its published reference is a departure from the
  default and is confined to the landing question.** The check reads the
  brain's working copy on purpose, because that is the commit it gates. The
  landing question is a different question — "is this published?" — and only
  published bytes can answer it. No other command's read changes.
- **The existing local merge evidence stays.** It is correct when it fires, it
  is the only evidence available where nothing is published, and the law row
  that describes it is not being retired. The published-reference read is
  preferred when it can speak and silent when it cannot.
