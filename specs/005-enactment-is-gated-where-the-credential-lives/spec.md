# Feature Specification: enactment is gated where the credential lives

**Feature Branch**: `005-enactment-is-gated-where-the-credential-lives`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Declare the who-enacts rule ungateable with its
reason and refuse a row enacted beside the code it anchors"

## Context

The rule that decides who may change the stated law of this project — an
automated assistant may propose a rule, a person enacts it — currently lives as
prose in two documents and is attached to nothing that checks it. It is the one
rule about authority over the law, and it is the one rule with no check behind
it.

It cannot be checked here, for two reasons that are both properties of the
product rather than gaps in it. First, the tool never invents an author
identity: it runs as whoever runs it, so an assistant acting on a person's
machine commits under that person's name, and the record cannot tell the two
apart. Second, the check this product installs runs as part of making a commit,
with the permissions of whoever is making it — so any refusal placed there is a
refusal the same actor can decline to run.

Where the rule is actually enforced is the hosting service: the button that
merges a proposed change into the trunk, which is held by an account the
assistant does not have.

So this feature does two things. It writes the declaration down — the rule, the
reason it cannot be checked here, and where it is enforced instead — in the
places a reader will meet it. And it builds the half that *is* decidable: not
**who** enacted a rule, but **when**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A commit that enacts a rule beside the code that rule describes is refused (Priority: P1)

A contributor has been working on a feature. The rule that describes the feature
was filed as a proposal when the work began. Finishing, they edit the stated law
to mark the rule as in force, and commit that edit together with the source
files and tests the rule points at. The result is a single commit in which a new
binding rule and the only evidence for it arrive together, authored by the same
hand. A reviewer opening that commit sees the rule buried inside the change that
motivated it, and there is no moment at which the rule was ever considered on
its own.

**Why this priority**: This is the half of the authority rule that a tool can
actually decide, and it is the half that makes the review meaningful. Without
it the declaration in Story 2 is a note nobody acts on. It is also mechanical:
no judgement, no network, no ambiguity about what the offence is.

**Independent Test**: In a repository whose stated law contains a proposed rule
pointing at a source file, stage both an edit marking that rule in force and an
edit to that source file, then run the verification. It must refuse, name the
rule, name the staged files that caused the refusal, and print the command that
unstages them.

**Acceptance Scenarios**:

1. **Given** a staged edit marking a proposed rule as in force **and** a staged
   edit to a file that rule points at, **When** the verification runs, **Then**
   it fails, names that rule, names the offending file, and states that
   enactment lands in its own commit.
2. **Given** a staged edit marking a proposed rule as in force **and no** staged
   edit to any file that rule points at, **When** the verification runs,
   **Then** it passes and says the rule was enacted alone.
3. **Given** a staged edit to a file some in-force rule points at, with no rule
   changing state, **When** the verification runs, **Then** it passes and says
   no rule was enacted in this commit.
4. **Given** a rule that appears in the staged law already marked in force and
   is absent from the previous revision, **When** the verification runs together
   with a staged edit to a file that rule points at, **Then** it fails on the
   same ground: a rule that is born in force has skipped the same review.
5. **Given** the refusal, **When** the contributor unstages the named files and
   runs the verification again, **Then** it passes.

---

### User Story 2 - A reader meets the declaration that the other half is not checkable (Priority: P1)

A contributor — or an assistant reading the repository to learn how it works —
wants to know whether the rule about who may enact law is enforced. Today they
find the sentence in two documents, find no check attached to it anywhere, and
have to guess whether that is deliberate or an oversight. The wrong guess in
either direction is costly: assuming it is enforced means trusting a gate that
does not exist, and assuming it is an oversight means writing a check that
cannot work.

**Why this priority**: An honest gap that is written down is a design decision;
the same gap unwritten is a defect that looks like a feature. This project's own
stated principle is that where something cannot be proven the tool says so
rather than faking it, and the rule about authority over the law is currently
the largest place that principle is unapplied.

**Independent Test**: Read the stated law, the published concept document, and
the output of the project's diagnostic command. Each must state that the
who-enacts half is not checkable here, give the reason, and name where it is
enforced instead — with no claim that a local check covers it.

**Acceptance Scenarios**:

1. **Given** the stated law, **When** a reader looks up the rule about who
   enacts, **Then** the row declares itself uncheckable, gives both reasons, and
   names the hosting service's merge control as where enforcement lives.
2. **Given** the published concept document about the law's lifecycle, **When**
   a reader reaches the section stating that an assistant proposes and a person
   enacts, **Then** the same declaration is there.
3. **Given** the diagnostic command, **When** it runs in this repository,
   **Then** its report carries a line stating that this half is not gated
   locally and where it is gated, so a reader who checks what is armed is not
   left to infer coverage from silence.
4. **Given** any of the above, **When** a reader looks for a claim that the tool
   checks who enacted a rule, **Then** there is none.

---

### User Story 3 - The check says when it could not answer (Priority: P2)

A contributor runs the verification by hand on a clean working copy to see
whether everything is in order. Nothing is staged, so the question "does this
commit enact a rule beside its code" has no subject. If the check simply stayed
quiet, the contributor would read the green result as "enactment was checked and
was fine", which is a stronger claim than was made.

**Why this priority**: It does not prevent a bad commit, so it ranks below the
two stories that do. It is in scope because a check whose scope is narrower than
its output implies is exactly the failure mode this project exists to prevent,
and because the same output is what tells a confused contributor why an offence
they expected to be caught was not.

**Independent Test**: Run the verification on a repository with nothing staged.
The output must contain a line stating that the enactment question was not
answered and why, and the result must not change because of it.

**Acceptance Scenarios**:

1. **Given** a repository with nothing staged, **When** the verification runs,
   **Then** the output states that the enactment check could not answer because
   nothing is staged, and explains that it reads what is staged, so it answers
   only while a commit is being made.
2. **Given** a repository with something staged and no law edit among it,
   **When** the verification runs, **Then** the output states that the question
   *was* answered and that no rule was enacted — distinguishable from the
   not-answered line above.
3. **Given** either case, **When** the result is compared with the same run
   before this feature, **Then** it is unchanged.

---

### Edge Cases

- **Nothing staged.** The question has no subject. Reported as not answered,
  with the reason; the result is unaffected.
- **No previous revision at all** (a repository whose first commit is being
  made). There is nothing to compare a rule's previous state against. Reported
  as not answered, with that reason.
- **The law file is not among the staged files.** No rule can have changed
  state, so the answer is "nothing enacted" and the two extra reads of the law
  file are skipped. This is the ordinary case and it must stay cheap.
- **The working copy has edits to the law file that are not staged.** What is
  staged is what will be committed; the check reads that and ignores the rest.
- **A rule is enacted whose pointers name only other repositories in the
  ecosystem.** Those files are not in this repository's commit, so nothing can
  be beside it here. Passes, and says the rule was enacted alone.
- **A rule points at the law file itself.** The law file necessarily carries the
  state change, so it is never counted as "the code beside it" — otherwise the
  rule could never be enacted at all.
- **Several rules enacted in one commit.** All are named; the refusal is one
  line naming each rule with the files that offend it.
- **A rule leaves the in-force state** (marked amended, retired, or back to
  proposed). Not an enactment. Not refused.
- **The verification is run from a consuming repository rather than from the
  repository that holds the law.** The law file is not in that repository's
  staged content at all, so there is no question to answer there. Reported as
  not answered, with that reason.
- **A person with push rights decides to bypass the check.** Out of scope and
  not claimed. The check refuses the ordinary path and the unsupervised
  assistant; it is not a security boundary and the stated law must not imply
  that it is.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The stated law MUST carry a rule that declares the who-enacts
  half uncheckable **with both of its reasons** — that author identity is never
  fabricated so an assistant commits as the person, and that the local check
  runs with the permissions of whoever is making the commit — and MUST name the
  hosting service's merge control as where enforcement lives.
- **FR-002**: The published concept document covering the law's lifecycle MUST
  carry the same declaration at the point where it already states that an
  assistant proposes and a person enacts.
- **FR-003**: The diagnostic command's report MUST carry a line stating that
  this half is not gated locally, with its reason, and where it is gated.
- **FR-004**: The verification MUST refuse a commit in which the staged law
  marks a rule as in force, that rule was not in force in the previous revision,
  and the same staged set contains at least one file this repository's pointers
  for that rule match.
- **FR-005**: The refusal MUST name every rule involved, name the offending
  staged files, and print the command that unstages them.
- **FR-006**: The law file itself MUST never count as an offending file.
- **FR-007**: Pointers naming repositories other than this one MUST NOT
  contribute offending files, because those files are not in this commit.
- **FR-008**: The verification MUST state, on every run, which of three things
  happened: the question could not be answered (with the reason), it was
  answered and no rule was enacted, or it was answered and rules were enacted
  (alone, or beside code — the refusal).
- **FR-009**: The verification MUST read the staged content, not the working
  copy, when deciding a rule's new state, because the staged content is what the
  commit will contain.
- **FR-010**: The verification MUST NOT reach the network and MUST NOT walk the
  file tree. In the ordinary case — a commit that does not touch the law file —
  the check MUST cost exactly one query of what is staged and nothing more.
- **FR-011**: The stated law MUST state the limit of the check — that it can
  answer only while a commit is being composed, and that it is not a security
  boundary — rather than implying coverage it does not have.
- **FR-012**: No behaviour that exists today may change: every other verdict,
  count, exit result and message the verification produces MUST be unaffected
  except for the one added line.

### Key Entities

- **Rule row** — a line of the stated law carrying an identifier and a lifecycle
  state. The state is the thing this feature watches.
- **Enactment** — a rule whose state is "in force" in the staged law and was not
  "in force" in the previous revision, including a rule that did not exist
  there at all.
- **Pointer** — a declaration attached to a rule naming a repository and a file
  pattern. The pointers of an enacted rule define what "the code it anchors"
  means for that rule.
- **Staged set** — the files whose content the commit being composed will carry.
  The only evidence this check reads, and the reason it can answer only inside a
  commit.

## Success Criteria *(mandatory)*

- **SC-001**: A commit staging both a rule's move to in-force and one file that
  rule points at is refused, with a non-zero result, in 100% of runs; the output
  names 1 rule identifier and at least 1 offending path.
- **SC-002**: The same commit with the offending path unstaged succeeds, with a
  zero result, and the output names the enacted rule as enacted alone.
- **SC-003**: A run with nothing staged prints exactly 1 line reporting the
  enactment question as unanswered, and its result is identical to the result of
  the same run before this feature — measured by running the existing test
  suite, which must stay green.
- **SC-004**: The diagnostic report gains exactly 1 line, and that line names the
  reason and the place of enforcement.
- **SC-005**: The verification's wall-clock cost on this repository stays under
  one second, and the added check makes at most 3 version-control invocations in
  the worst case and exactly 1 in the ordinary case where the law is untouched.
- **SC-006**: 0 statements anywhere in the repository claim that the tool checks
  who enacted a rule.

## Assumptions

- "In force" is spelled `active` in the state column of the law table; the
  proposal state is spelled `proposed`. These are the existing spellings and
  this feature does not introduce or rename any state.
- The previous revision is the current commit the branch points at. Comparing
  against anything further back (a published trunk, a merge base) would require
  a reference this check is not allowed to fetch, and would make the answer
  depend on how recently the contributor synchronised.
- A rule that is born already in force is treated as an enactment. The lifecycle
  files new rules as proposals, so a rule appearing directly in force has
  skipped the same review the feature protects.
- The check has nothing to say from a consuming repository. Consuming
  repositories do not carry the law file, so there is no staged law edit for
  them to have.
- Nothing here is claimed to stop a person who chooses to bypass local checks.
  The enforcement for that case is the hosting service, which this feature names
  rather than reimplements.
- A proposal to require a named person's approval on any change to the law file
  via the hosting service's ownership mechanism was made and declined by the
  owner of this repository. It is recorded, not reopened, and is not part of
  this feature.
