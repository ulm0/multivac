# Feature Specification: Managed repos

**Feature Branch**: `managed-repos`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "multivac writes into every declared repo on disk,
whether or not it owns it. `repos.<key>.managed: false` is refused as an
unknown key. A `repos sync --shallow` clone, documented as one you will read
but never land in, is recorded nowhere. The next `change new` runs the SDD init
and the graph build in it, `doors` projects a door and hooks into it, and close
refuses until its graph is committed there. Add `managed` (boolean, default
true), detect a shallow clone offline, keep both out of every write and every
gate that would demand a file there, report them without counting them
deficient, refuse `managed: false` on the brain, decide the scope in one place,
and make the rule law."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A repo that is not ours is never written (Priority: P1)

An operator declares `payments`, a repo another team owns, so that anchors can
read it. Its branches are protected. Today the config cannot say "not ours":
`managed: false` is refused as an unknown key. With it declared, `change new`
must not run the SDD init or the graph build there, and `doors` must not write
a door or hooks there.

**Why this priority**: every write multivac makes in a repo it does not own is
a diff nobody can land. The key is the only way to say so for a full clone.

**Independent Test**: in a scratch ecosystem with stub vendors that record
their runs, declare a present sibling `managed: false` and run `change new`,
`change close`, `doors` and `doctor`. Find no vendor run there, no file written
there, its `core.hooksPath` unchanged, and no gate naming it.

**Acceptance Scenarios**:

1. **Given** `repos.payments.managed: false`, **When** any command loads the
   config, **Then** it loads, and `managed` is read as a boolean that defaults
   to true.
2. **Given** `managed: "false"` or any value other than true or false, **When**
   the config loads, **Then** it is refused by name, like every other malformed
   key.
3. **Given** a present sibling declared `managed: false` that lacks its SDD and
   its graph, **When** the lifecycle scaffolds and builds, **Then** nothing runs
   there and nothing is printed for it.
4. **Given** the same sibling, **When** `change close` refreshes graphs,
   **Then** no refresh runs there.
5. **Given** the same sibling, **When** `doors` runs, **Then** it writes no
   door, skill, harness hook, git hook shim or `core.hooksPath` there, and
   prints one line naming the repo, saying it is not managed and that nothing
   was projected.
6. **Given** a sibling with no `managed` key, **When** any of the above runs,
   **Then** everything happens exactly as today.

---

### User Story 2 - A shallow clone is read-only (Priority: P1)

The same operator runs `multivac repos sync --shallow` on a CI runner or a
machine that only verifies. The usage says the clone is for a repo "you will
read but never land in". Afterwards nothing remembers that. `repos` prints
`present`, `doctor` says `change new` will run the init there, and it does.

**Why this priority**: a flag whose meaning is forgotten one command later
makes every later write silent. Git already records the fact in the clone.

**Independent Test**: publish a repo with two commits, `repos sync --shallow`
it, then run `change new`, `change close`, `doors` and `doctor` with stub
vendors. Find the same outcomes as User Story 1, with the reason given as a
shallow clone. Unshallow it and find it in scope again with nothing edited.

**Acceptance Scenarios**:

1. **Given** a declared sibling whose clone git reports shallow, **When** any
   surface asks whether multivac may write there, **Then** the answer is no,
   exactly as for `managed: false`.
2. **Given** `repos sync --shallow` cloning a repo, **When** it prints the
   clone line, **Then** the line says the clone is read-only and that multivac
   will not write there. The usage says the same.
3. **Given** a shallow clone that was unshallowed, **When** the next command
   runs, **Then** it is in scope, and no file or config needed editing.
4. **Given** any shallow question, **When** it is asked, **Then** it reads the
   sibling's own clone offline, spawns git and nothing else, and ignores the
   git environment inherited from a hook.

---

### User Story 3 - Read-only is reported, never failed (Priority: P2)

The operator runs `doctor` and `repos` to see the ecosystem. A read-only repo
must read as a fact about scope, the way `sdd: none` does. It must not read as
a missing install with a command to run.

**Why this priority**: a report that calls an out-of-scope repo deficient
teaches people to "fix" it by writing into a repo they do not own.

**Independent Test**: with one sibling declared `managed: false` and one
shallow, run `doctor` and `repos`, and compare each line and exit code with the
same ecosystem before the change.

**Acceptance Scenarios**:

1. **Given** a read-only sibling, **When** `repos` lists it, **Then** its line
   says not managed or shallow, read-only.
2. **Given** a read-only sibling, **When** `doctor` prints its repos line and
   each adapter line, **Then** each names the repo and why it is read-only, and
   names no command multivac would run there. The SDD and graph lines say out
   of scope, not a gap, in place of an install state.
3. **Given** a read-only sibling with an uncommitted graph, **When** `doctor`
   reports it, **Then** no NOT COMMITTED or IGNORED line is printed for it.
4. **Given** a read-only sibling, **When** `doctor` runs, bare or `--strict`,
   **Then** its exit code is what it would be without that sibling.
5. **Given** `repos sync` fetching a present read-only sibling, **When** it
   runs, **Then** it still fetches, and its exit rule is unchanged (MV-54).

---

### User Story 4 - No gate demands a file in a read-only repo (Priority: P2)

A change names only the brain. Its close is refused because a shallow sibling's
graph is not committed, and the refusal names a `git commit` in a clone the sync
called read-only. The SDD gates search that sibling for proof and name it among
the repos they looked in.

**Why this priority**: a refusal whose only fix is a forbidden write blocks the
change or trains `--no-grapher`.

**Independent Test**: with a read-only sibling that has no graph, no SDD state
and no spec, run `change plan`, `change apply` and `change close` with stub
vendors. Find no refusal naming it, and find each gate's result for the other
roots unchanged.

**Acceptance Scenarios**:

1. **Given** a read-only sibling, **When** the graph gate and the tracked gate
   judge roots, **Then** it is not judged, and neither gate names it.
2. **Given** a read-only sibling, **When** the SDD step and ledger gates search
   for proof, **Then** it is not searched, not named among the repos looked in,
   and no validator runs there.
3. **Given** a read-only sibling, **When** the project-document gate chooses
   roots, **Then** it is not asked.
4. **Given** an adapter that only read-only siblings resolve, **When** a gate
   reaches it, **Then** it is not gated, and one line names those repos and
   says they are read-only.
5. **Given** an adapter resolved by a managed sibling that is not on disk,
   **When** a gate reaches it, **Then** it refuses as today.

---

### User Story 5 - A change cannot name a read-only repo (Priority: P2)

An operator writes `repos: { payments: { status: planned } }` into a change.
`change apply` would create a branch and a worktree in `payments`, or create
the repo if it is missing, and `land` expects a merge there.

**Why this priority**: the change file is the operator's own statement that
multivac will work there, and it contradicts the declaration.

**Independent Test**: name a read-only sibling in a change, run `change plan`
and `change apply`, and find each refused, with the change file, the law, every
index, every branch and every worktree exactly as before.

**Acceptance Scenarios**:

1. **Given** a change naming a sibling declared `managed: false`, on disk or
   not, **When** `change plan` or `change apply` runs, **Then** it exits 1,
   naming the repo, why it is read-only, and both fixes: drop it from the
   change, or remove `managed: false` through a change (MV-97).
2. **Given** a change naming a present sibling whose clone is shallow, **When**
   `change plan` or `change apply` runs, **Then** it exits 1, naming the repo
   and the fix `git -C <path> fetch --unshallow`.
3. **Given** either refusal, **When** it happens, **Then** nothing was cloned,
   created, branched, bumped or committed first.
4. **Given** a change naming only managed, full-clone repos, **When** plan and
   apply run, **Then** they behave as today.

---

### User Story 6 - The brain is always managed, and the law says so (Priority: P3)

A maintainer reads MV-125 before adding a surface that writes into a repo. It
names the one place scope is decided, both reasons a repo is read-only, what
each surface does, and what the legs cannot catch.

**Why this priority**: every write surface since MV-87 was written as "every
declared, present repo". Without a row, the next one will be too.

**Independent Test**: read MV-125, the rows it amends and the configuration
reference. In a scratch copy with MV-125 active, add a sibling write that
skips the scope function and confirm a leg turns red.

**Acceptance Scenarios**:

1. **Given** `managed: false` on the entry that is the brain, under any key,
   **When** the config loads, **Then** it is refused by name, saying the brain
   is always managed.
2. **Given** a brain whose own checkout is shallow, **When** any command runs,
   **Then** the brain stays in scope.
3. **Given** MV-125, **When** it is read, **Then** it states the rule, the
   measured evidence and its ceilings in about 400 words or fewer.
4. **Given** MV-50, MV-56, MV-87, MV-90, MV-103 and MV-122, **When** they are
   read, **Then** each carries an inline note dated 2026-09-14, naming MV-125,
   at the clause it changes.
5. **Given** the configuration reference, **When** it is read, **Then**
   `repos.<key>.managed` has its own heading, with its default, what read-only
   means, the shallow twin and the brain refusal.
6. **Given** MV-125 while this change is open, **When** the law is verified,
   **Then** a broken leg reports as pending and blocks nothing.

---

### Edge Cases

- A sibling declared `managed: false` whose clone is also shallow is reported
  once, as not managed: the declaration comes first.
- `managed: true` written out is the default, and changes nothing.
- A `managed: false` sibling not on disk is still cloned and fetched by
  `repos sync`, since cloning and fetching read. `doctor` names it missing and
  not managed.
- Only the answer `true` makes a clone shallow. An error, including a
  directory git cannot read as a repository, leaves the sibling in scope as
  today. Whether that directory is a clone at all is the `repos check`
  change's question.
- A directory nested inside another repository gets that repository's answer.
  That is stated as a ceiling and left to `repos check`.
- A door or hooks projected before a repo became read-only are left in place.
  Removing them is a write, and `doors` says it projected nothing.
- A consumer `verify` run by a hook inside a read-only repo reads, as today.
- `--no-sdd`, `--no-grapher`, `sdd_auto: false` and `grapher_auto: false` mean
  what they mean today. A read-only repo is out of scope, not skipped.
- `sdd: none` and `grapher: none` on a managed repo keep their meaning. That
  repo still gets its door and hooks.
- flow.md, the doors' ecosystem lists and the printed steps render from
  declarations, and still name a read-only repo as declared. A shallow clone
  is not a declaration.
- Test stubs record where each run happened. A fixture's shallow clone is made
  with `git clone --depth 1` from a `file://` URL, since a local path clone
  ignores `--depth`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The config MUST accept `repos.<key>.managed`, a boolean that
  defaults to true. Any other value MUST be refused by name, the way other
  malformed repo keys are (MV-114).
- **FR-002**: `managed: false` on the entry that resolves to the brain MUST be
  refused by name at load, whatever its key.
- **FR-003**: A declared repo MUST be read-only when its entry says
  `managed: false`, or when it is on disk and git reports its clone shallow.
  The brain MUST never be read-only. The shallow question MUST be asked of the
  sibling's own clone, offline, spawning git only, with the inherited git
  environment dropped (MV-106).
- **FR-004**: One function MUST decide whether a root is read-only, and every
  surface in FR-005 to FR-009 MUST ask it. No surface MAY read `managed` or ask
  the shallow question itself.
- **FR-005**: In a read-only root, multivac MUST NOT run the SDD scaffold, the
  graph build or the graph refresh. `doors` MUST NOT project a door, skill,
  harness hook config, git hook shim or `core.hooksPath` there. The scaffold,
  the build and the refresh MUST print nothing for such a root. `doors` MUST print one line naming the
  repo, why it is read-only and that nothing was projected.
- **FR-006**: The graph gate and the tracked gate MUST NOT judge a read-only
  root. The SDD step and ledger gates MUST NOT search it or name it among the
  repos looked in, and no validator MAY run there. The project-document gate
  MUST NOT ask it. An adapter whose declared roots are all read-only MUST NOT be
  gated, and the gate MUST print one line naming them as read-only. A managed
  root that is declared and not on disk MUST refuse as today.
- **FR-007**: `change plan` and `change apply` MUST refuse, exit 1, a change
  whose `repos:` names a read-only repo. The refusal names each such repo, the
  reason, and its fixes. They MUST refuse before any clone, greenfield
  creation, status bump, commit or worktree.
- **FR-008**: `doctor` MUST name each read-only root on its repos line and, in
  place of an install state, on each adapter line, as out of scope and not a
  gap. It MUST name no command multivac would run there and print no
  NOT COMMITTED or IGNORED line for it. Its exit codes MUST NOT change.
- **FR-009**: `repos` MUST mark each read-only repo. `repos sync` MUST say a
  clone it makes with `--shallow` is read-only, and the `--shallow` usage MUST
  say so. Clone, fetch and their exit rules MUST NOT change.
- **FR-010**: With no `managed` key and no shallow clone, every command's
  output, exit code and writes MUST be what they are today.
- **FR-011**: The configuration reference MUST give `repos.<key>.managed` its
  own heading (MV-31). The `repos` and `doors` command references MUST say what
  a read-only repo gets. Copies that say `doors` writes into, or the lifecycle
  and gates reach, every declared repo present on disk MUST change with them
  (MV-111).
- **FR-012**: MV-125 MUST state the rule, the measurements and the ceilings,
  with legs on the scope function, the config key, the brain refusal, the
  shallow question, each surface that asks the function, `doors`' skip line
  and the plan and apply refusal. It MUST stay `proposed`.
- **FR-013**: MV-50, MV-56, MV-87, MV-90, MV-103 and MV-122 MUST each carry an
  inline note naming MV-125 where their rule changes:
  - MV-50: the close refresh reaches every declared, present repo that is not
    read-only;
  - MV-56: the repos a refusal looked in exclude read-only ones;
  - MV-87: a read-only root is out of scope for the scaffold, the build, the
    project-document gate and the report's install state, and is reported as
    read-only;
  - MV-90: "every declared, present root" excludes read-only roots;
  - MV-103: the tracked gate never judges a read-only root;
  - MV-122: an adapter whose declared roots are all read-only is not gated,
    and says so, where "an adapter no present root resolves refuses" would
    have refused.
- **FR-014**: No runtime dependency MAY be added. `verify`, `doctor` and
  `doors` MUST stay offline and spawn no vendor tool (MV-01). No test MAY
  depend on the host PATH or the host git configuration.

### Key Entities

- **Managed declaration**: `repos.<key>.managed`, the operator's statement
  that multivac may write in that repo; true unless it says false.
- **Shallow clone**: a sibling clone whose history git reports truncated, made
  by `repos sync --shallow` or any `--depth` clone.
- **Read-only repo**: a declared repo that is not managed or is a shallow
  clone. It is read, verified, cloned and fetched, and never written or gated.
- **Scope answer**: the one function's verdict for a root, writable or
  read-only, with the reason.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the measured ecosystem's shallow sibling, vendor runs from
  `change new` drop from 2 to 0, and files the lifecycle leaves there drop
  from 2 to 0. Both stay 0 when the sibling is a full clone declared
  `managed: false`.
- **SC-002**: Files `doors` writes into the shallow sibling drop from 11 to 0,
  and its `core.hooksPath` stays unset. The same holds for a full clone
  declared `managed: false`.
- **SC-003**: Close refusals naming a read-only root drop from 1 to 0.
- **SC-004**: A config with `managed: false` on a sibling loads in every
  command, where today `repos` and `verify` exit 2 and `doctor` and `doors`
  exit 1.
- **SC-005**: `doctor` and `repos` name 3 of 3 read-only fixtures: not managed
  and present, not managed and missing, and shallow. They call 0 of them
  missing an install, and `doctor`'s exit codes match the ecosystem without
  them.
- **SC-006**: Every existing test passes unchanged, and a scratch ecosystem
  with no `managed` key and no shallow clone gives byte-identical output for
  `doctor`, `repos`, `doors` and `change new`.
- **SC-007**: `verify --strict` reports 0 blocking failures. 6 of 6 amended
  rows carry a note naming MV-125, and MV-125 stays `proposed`.

## Assumptions

- The measurements are from 2026-09-14, against this build with HOME isolated
  and stubs for `specify` and `graphify` on a constructed PATH. Three figures
  come from the 2026-09-14 requirements study and were not re-measured here:
  spec-kit 1.0.6 writing 30 files on init, about 41 vendor files with two
  integrations, and a protected branch declining the push.
- A full clone of a repo another team owns cannot be told from one of ours.
  `managed: false` is how the operator says so, and editing it needs an open
  change (MV-97).
- In CI, siblings synced with `--shallow` read as read-only, which is what a
  verifying pipeline needs. The brain's own shallow checkout stays in scope,
  because the brain is where multivac writes its law.
- `git rev-parse --is-shallow-repository` answers `true` in a `--depth 1` clone
  and `false` in a full one (measured). Git older than 2.15 lacks the option,
  and whatever it prints is not `true`, so such a clone stays in scope (read,
  not measured).
- Which managed repos a change may build, refresh or gate is unchanged. It
  stays every declared, present repo until the change that scopes it to the
  repos a change names.
- Rows are amended inline in the table's shape, "Amended 2026-09-14 by
  MV-125" (MV-111, MV-120).
