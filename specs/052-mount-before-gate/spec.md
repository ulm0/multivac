# Feature Specification: A consumer is mounted before it is gated

**Feature Branch**: `052-mount-before-gate`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "multivac arms a blocking commit gate in consumer repos but never creates the thing that gate depends on … (a) verify warns and exits 0 where a door is present but no brain is reachable, (b) `repos sync` creates the missing mount, (c) the brain's clone URL becomes a declared, hand-authored key, (d) doctor and the consumer door name `multivac repos sync` as the fix."

## Context: what was measured

Measured 2026-09-16 against a real ecosystem (`psr-brain`, 42 declared repos) and
against this repository's source.

1. `doors` writes `.multivac/hooks/pre-commit`, `.multivac/hooks/pre-push` and sets
   `core.hooksPath` in each declared repo. The shim runs `mvac verify`.
2. `verify` in a repo without `.multivac/config.yml` resolves the brain only as a
   subdirectory mount (`findMount`, `src/commands/verify.ts:714`). With no mount it
   exits 2. Measured in `pulsar-deploy-mock-env`:
   `no .multivac/config.yml in <dir> — run `multivac init .` to create it`, `EXIT=2`.
   No commit can be made in that repo while the shim is armed.
3. No command in `src/` runs `git submodule add`; the string appears only inside
   advice text (`src/commands/doctor.ts:464`, `src/doors/consumer.ts:64`,
   `src/commands/verify.ts:1014`). `repos sync` clones and fetches
   (`src/commands/repos.ts:83`) and never mounts.
4. The mount is declared a manual human step in
   `site/content/docs/reference/configuration.md`, key `mount`.
5. In that ecosystem the manual step ran once, by hand, on 2026-08-24, in a commit
   `chore: install multivac consumer door` that added `.brain`, `.gitmodules` and the
   hooks together. Result today: 36 of 42 repos carry the gitlink, 3 carry the
   `.brain` working directory with no gitlink committed, 2 are shallow and
   read-only, and 1 — declared after that batch — has nothing and is the one whose
   commits are blocked.
6. The shim's own text promises the opposite of what happens: "No runnable multivac
   never blocks a commit: it warns loudly and exits 0." A runnable multivac that
   cannot reach the brain exits 2.
7. Guessing the brain's URL is unsafe. `psr-brain`'s own origin is
   `git@gh-work:Cencosud-Cencommerce/psr-brain.git`, a machine-local SSH alias; the
   36 working submodules point at `git@github.com:Cencosud-Cencommerce/psr-brain.git`.
   A guess from `git remote get-url origin` would have written the alias into 42
   `.gitmodules` files, unusable for every other clone.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A repo multivac cannot judge does not block its commits (Priority: P1)

An engineer works in a repo that carries a multivac door — the hooks and the managed
block are there — but the brain is not reachable from it. Today every commit is
refused with a message about a missing config and an instruction (`multivac init .`)
that would create a second brain. The engineer wants the commit to go through, with a
loud warning that nothing was verified and a name for the fix.

**Why this priority**: it is the live breakage. Until it is fixed, a repo can be
locked out of committing by a `doors` run, and the printed fix makes it worse.

**Independent Test**: in a repo with `.multivac/hooks/` and no reachable brain, run
`multivac verify`, observe exit 0 and a warning that names the repo as unverified and
`multivac repos sync` as the fix. Shipping only this restores committing everywhere.

**Acceptance Scenarios**:

1. **Given** a repo with a projected multivac door (a `.multivac/` directory that
   multivac wrote) and no `.multivac/config.yml` and no reachable brain, **When**
   `multivac verify` runs there, **Then** it warns that this checkout was not
   verified and why, names `multivac repos sync` as the fix, and exits 0.
2. **Given** an ordinary repo with no multivac door at all, **When** `multivac verify`
   runs there, **Then** the message and exit code are exactly today's:
   `no .multivac/config.yml in <dir> — run `multivac init .` to create it`, exit 2.
3. **Given** a repo whose brain IS reachable, **When** `multivac verify` runs there,
   **Then** nothing changes: the scoped consumer report and today's exit matrix.
4. **Given** the repo of scenario 1, **When** a commit is made, **Then** the
   pre-commit shim prints the warning and the commit succeeds.

---

### User Story 2 - The tool creates the mount it gates on (Priority: P1)

An ecosystem owner declares a repo and runs one command. That command clones the repo
if it is missing and mounts the brain in it, so the door that `doors` projects has
something to read. The owner reviews and commits the mount themself.

**Why this priority**: it is the root cause. Without it every new repo repeats the
manual step, and the drift measured above (36 / 3 / 1) recurs.

Widened during implementation at the ecosystem owner's request (2026-09-16): the
command is a reconciliation — run whenever a mount may be missing and whenever a repo
is declared — not a setup step that runs once.

**Independent Test**: declare a repo with no mount, run `multivac repos sync`, observe
the gitlink and `.gitmodules` staged in that repo and no commit made.

**Acceptance Scenarios**:

1. **Given** a declared, writable repo with no gitlink at the configured mount and a
   declared brain URL, **When** `multivac repos sync` runs, **Then** the brain is
   added as a submodule at that mount, the gitlink and `.gitmodules` are left staged,
   no commit is made in that repo, and the report names what was staged.
2. **Given** a repo that already carries the gitlink, **When** `multivac repos sync`
   runs, **Then** the mount is left alone and the report says so.
3. **Given** a repo that is `managed: false` or a shallow clone, **When**
   `multivac repos sync` runs, **Then** no mount is attempted and the report names the
   reason, exactly as `doctor`'s pins line already does.
4. **Given** a repo whose working directory holds a mount that was never committed —
   the measured middle state — **When** `multivac repos sync` runs, **Then** the
   existing checkout is not re-cloned or destroyed, and the report names what a human
   must commit.
5. **Given** the mount cannot be created — network, auth, or git refusing — **When**
   `multivac repos sync` runs, **Then** the failure is quoted by its cause, the repo
   is named, and the rest of the repos still sync.

---

### User Story 3 - The brain's URL is declared, never guessed (Priority: P1)

An ecosystem owner writes the URL other people will clone the brain from. multivac
never infers it.

**Why this priority**: it gates User Story 2, and a wrong guess is written into every
consumer's `.gitmodules` — a mistake that propagates to everyone who clones.

**Independent Test**: with no URL declared, `multivac repos sync` mounts nothing and
names the key to add; with it declared, the mount uses exactly that string.

**Acceptance Scenarios**:

1. **Given** a config with no brain URL declared, **When** `multivac repos sync` runs
   against a repo with no mount, **Then** no submodule is added, and the report names
   the missing key, the file it belongs in, and that multivac will not guess it.
2. **Given** a declared brain URL, **When** a mount is created, **Then** the recorded
   submodule URL is that string, byte for byte.
3. **Given** `multivac init`, **When** it writes a config, **Then** the brain URL key
   appears commented out, carrying the detected origin as a suggestion a human must
   uncomment, and the tool never treats the comment as a declaration.

---

### User Story 4 - The fix is named by the tool that can perform it (Priority: P2)

Wherever multivac reports a missing mount, it names its own command.

**Why this priority**: cosmetic relative to the above, but it is the difference
between a report a human can act on in one step and one they must translate.

**Independent Test**: run `doctor` against an ecosystem with a missing mount and read
the pins line; open a consumer door and read its first instruction.

**Acceptance Scenarios**:

1. **Given** a declared repo with no mount, **When** `doctor` runs, **Then** the pins
   line names `multivac repos sync` as the fix.
2. **Given** `doors` projecting into an ecosystem where some repo has no mount,
   **When** it runs, **Then** it reports which repos are unverified until mounted and
   names `multivac repos sync`; it does not refuse, clone, or reach the network.

---

### Edge Cases

- A `.multivac/` directory that a human created by hand, holding no artifact multivac
  writes: it is not a projected door, so scenario 1.2 applies and the exit is 2.
- A repo carrying a door whose mount directory exists but is not a brain: today's
  stale-pin message stands, and its exit code does not change.
- A repo declared with no `url:` of its own: `repos sync` already reports it as
  unsyncable; it must also not attempt a mount there, since it may not be cloned.
- The brain itself, and any entry that resolves to the brain (`brain==code`): there is
  nothing to mount, and nothing is attempted or reported as missing.
- A mount path that is not a direct child — e.g. `mount: docs/brain`: the submodule is
  added at exactly the configured path.
- An ecosystem where the brain has no remote at all: `init` writes the key commented
  and empty, and says so.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `verify`, run in a checkout that carries a multivac-written `.multivac/`
  door and has no `.multivac/config.yml` and no reachable brain, MUST warn that this
  checkout was not verified, state why, name the command that fixes it, and exit 0.
- **FR-002**: `verify`, run in a checkout with no multivac door, MUST keep today's
  message and exit code unchanged.
- **FR-003**: `verify` MUST NOT change behaviour, output or exit code in any checkout
  where the brain is reachable, mounted or not.
- **FR-004**: `repos sync` MUST create the brain mount in each declared repo that is
  writable, is cloned, and has no gitlink at the configured mount.
- **FR-005**: `repos sync` MUST leave the created mount staged and MUST NOT commit in
  a consumer repo.
- **FR-005a**: `repos sync` MUST reconcile on every run, for every declared repo on
  disk, not only for a repo it has just cloned: a repo declared long ago and a repo
  declared today get the same pass, so a mount that went missing is restored by the
  next run.
- **FR-005b**: Where a gitlink exists and its checkout is empty — a consumer cloned
  without its submodules, or a rollout that never initialised the mount — `repos sync`
  MUST fill it.
- **FR-005c**: Where the recorded submodule url differs from the declared brain URL,
  `repos sync` MUST report the difference and the command that would change it, and
  MUST NOT rewrite it: a consumer may point at a fork or a mirror on purpose.
- **FR-006**: `repos sync` MUST skip mounting in a repo that `readOnly` reports as
  `managed: false` or shallow, and MUST name the reason.
- **FR-007**: `repos sync` MUST take the brain's clone URL from a declared
  configuration key, and MUST NOT derive it from any git remote.
- **FR-008**: With that key absent, `repos sync` MUST mount nothing and MUST name the
  key, the file, and that multivac does not guess it.
- **FR-009**: A mount failure MUST name the repo and quote the cause, and MUST NOT
  abort the remaining repos.
- **FR-010**: `init` MUST write the brain-URL key commented out, carrying the detected
  origin as a suggestion, and MUST NOT treat it as declared.
- **FR-011**: `doctor`'s pins line MUST name `multivac repos sync` where a mount is
  missing.
- **FR-012**: `doors` MUST report which declared repos have no mount and name
  `multivac repos sync`, and MUST NOT refuse, clone, or reach the network.
- **FR-013**: `verify`, `doctor` and `doors` MUST make no network call for any
  behaviour this feature adds.
- **FR-014**: The consumer door MUST name `multivac repos sync` where it tells a
  reader to make the mount usable.
- **FR-015**: The law row this change adds MUST state the rule and MUST be anchored to
  the source that makes it true.

### Key Entities

- **Mount**: where a consumer repo holds the brain, a repo-relative path; declared by
  the existing `mount` key, default `.brain`. Present when a gitlink exists at that
  path.
- **Brain URL**: the address other people clone the brain from. Hand-authored,
  declared once in the brain's config, written verbatim into each consumer's
  `.gitmodules`.
- **Projected door**: the files multivac writes into a consumer repo — the hook shims
  and the managed block. Their presence is what distinguishes a repo multivac has
  claimed from a repo it has never touched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a repo carrying a door with no reachable brain, a commit that is
  refused today succeeds, and the session that makes it sees a warning naming the
  repo as unverified.
- **SC-002**: Declaring a new repo and running one command leaves that repo with a
  staged mount, with no hand-written git command anywhere in the sequence.
- **SC-003**: Across an ecosystem of 42 declared repos, the count of repos that are
  gated but unmountable falls to zero without a human running `git submodule add`.
- **SC-004**: No consumer `.gitmodules` records a URL that multivac inferred.
- **SC-005**: Every message this feature adds that reports a missing mount names a
  multivac command, and no such message names a bare git command as the only fix.
- **SC-006**: The exit code and text of `verify` are unchanged for every checkout that
  is not a door without a reachable brain, proven by the existing suite passing
  unmodified except where FR-001 applies.

## Assumptions

- The mount stays a git submodule. Nothing here changes what a mount is, only who
  creates it.
- The human commits the mount. multivac stages and reports; committing in someone
  else's repo stays outside what the tool does.
- The brain URL is one string for the whole ecosystem. A per-repo override is not part
  of this change.
- `repos sync` is the only command that may reach the network, which Principle IV
  already establishes; `doors`, `doctor` and `verify` stay offline.
- The existing `readOnly` resolution (MV-125) is the whole definition of a repo
  multivac may not write in; this change adds no second notion of ownership.
- Repairing the three measured repos whose mount exists but was never committed is the
  ecosystem owner's act, not multivac's: the tool reports what to commit.
