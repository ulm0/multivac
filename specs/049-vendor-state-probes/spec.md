# Feature Specification: Vendor state probes

**Feature Branch**: `vendor-state-probes`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Every surface decides a vendor is initialised because a path is there. A hand-made `.specify/` silences the scaffold and reads `artifact ok`, a 0-byte `graph.json` satisfies the graph gate, a graph staged and never committed satisfies the tracked gate, and a codegraph clone holding only `.codegraph/.gitignore` skips its build and fails its refresh. The opt-outs the registry names are never set on a run. Judge each adapter by the vendor's own state files through one offline probe, declare per adapter what is shared and what is local, make codegraph's database a local artifact the tracked gate leaves alone, read HEAD instead of the index, apply the declared opt-out environment on every run, and make the rule law."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Installed means the vendor says so (Priority: P1)

An operator declares `sdd: speckit` in a repo where someone once ran
`mkdir .specify`. `change new` stays silent and runs no init. `doctor` prints
`speckit @ brain: artifact ok`. In the same directory spec-kit's own
`specify integration status` exits 1 with `integration-state-missing`. A
grapher's `graph.json` truncated to 0 bytes passes the graph gate the same way.

**Why this priority**: every later step reads "installed" from this answer, and
today the answer is yes whenever a directory exists.

**Independent Test**: in scratch roots, lay out each shipped adapter's state
files four ways: none of them, the vendor's directory alone, a state file that
fails its check, and the files a real init writes. Ask the probe, `doctor`, the
scaffold and the graph gate about each root, and find all four surfaces giving
the same state.

**Acceptance Scenarios**:

1. **Given** `.specify/integration.json` that parses, has
   `integration_state_schema` 1 and a non-empty `installed_integrations`,
   **When** the probe asks about speckit, **Then** the root is installed.
2. **Given** a `.specify/` with no `integration.json`, or one that does not
   parse, has another schema, or lists no integration, **When** the probe asks,
   **Then** the root is partial, and the reason names the file and what failed.
3. **Given** no `.specify/` at all, **When** the probe asks, **Then** the root
   is missing.
4. **Given** `openspec/config.yaml` or `openspec/config.yml`, **When** the
   probe asks about opsx, **Then** the root is installed. **Given**
   `openspec/specs/` without either file, **Then** it is partial.
5. **Given** a `graphify-out/graph.json` that parses as JSON, **When** the probe
   asks about graphify, **Then** the root is installed. **Given** a 0-byte or
   truncated one, **Then** it is partial.
6. **Given** a state file that exists and cannot be read, **When** the probe
   asks, **Then** the root is unevaluable, and the reason names the file and
   the error.
7. **Given** a config-declared grapher, **When** the probe asks, **Then** the
   root is installed when its declared artifact is there, and missing
   otherwise.
8. **Given** any root, **When** the probe runs, **Then** it spawns no process
   and reaches no network.

---

### User Story 2 - Each surface acts on that state (Priority: P1)

The same operator runs `change new`, `change close` and `doctor`. Each has to
act on the probe's four answers without destroying anything. spec-kit 1.0.6
reverts edited templates when its init runs again, so a partial `.specify/`
must not be re-initialised behind the operator's back. A graph is derived from
the tree, so rebuilding a partial one loses nothing.

**Why this priority**: a probe nobody acts on changes nothing, and acting on it
wrongly would delete an operator's edits.

**Independent Test**: for each of the four states, run `change new`,
`change close` and `doctor` in a scratch root with stub vendors that record
their runs, and compare what ran and what was printed with the scenarios below.

**Acceptance Scenarios**:

1. **Given** an SDD root that is installed, **When** the lifecycle scaffolds,
   **Then** it runs nothing and prints nothing for that root.
2. **Given** an SDD root that is missing, **When** the lifecycle scaffolds,
   **Then** it runs the vendor's init there, as today, and says `scaffolded`
   only if the probe then finds the root installed.
3. **Given** an SDD root that is partial or unevaluable, **When** the lifecycle
   scaffolds, **Then** it runs nothing there and warns, naming the root, the
   probe's reason and the init command to run by hand.
4. **Given** a grapher root that is missing or partial, **When** the first
   build or close reaches it, **Then** it runs the build command, not the
   refresh.
5. **Given** a grapher root that is installed, **When** close reaches it,
   **Then** it runs the refresh.
6. **Given** a grapher root that is not installed after the build, **When** the
   graph gate judges it, **Then** close refuses, naming the root and the
   probe's reason. An unevaluable root refuses as unable to be checked.
7. **Given** any root with an adapter resolved, **When** `doctor` reports it,
   **Then** the line names the state and, for partial or unevaluable, the
   reason. Its exit code is unchanged.
8. **Given** a root whose SDD state is anything but missing, **When** the
   project-document gate chooses the roots to ask, **Then** that root is asked,
   the same roots as today.

---

### User Story 3 - codegraph's database stays in its checkout (Priority: P1)

A team declares `grapher: codegraph`. codegraph writes `.codegraph/` holding its
own `.gitignore`. MV-103's refusal prints `git add .codegraph`, which commits
that `.gitignore` alone. In a fresh clone `.codegraph/` exists with no database,
so no build runs, both gates pass, and close's `codegraph sync` fails with
`CodeGraph not initialized`, which close only warns about.

**Why this priority**: the declared grapher never works in any clone, and the
only fix the gate offers is to commit an SQLite file.

**Independent Test**: commit a repo holding only `.codegraph/.gitignore`, clone
it, and run close with a stub codegraph. Find the build run, the database
there, both gates passing without the database being committed, and `doctor`
reporting the artifact as local.

**Acceptance Scenarios**:

1. **Given** the shipped registry, **When** codegraph's artifact is read,
   **Then** it is `.codegraph/codegraph.db`, and codegraph declares it local.
   graphify's `graphify-out/graph.json` is declared shared.
2. **Given** a clone whose `.codegraph/` holds no database, **When** the first
   build or close reaches it, **Then** the probe reads it as partial and the
   build runs, not `codegraph sync`.
3. **Given** a codegraph root with its database built and untracked, **When**
   the tracked gate judges it, **Then** it passes and says nothing.
4. **Given** a codegraph root still without a database after the build,
   **When** the graph gate judges it, **Then** it refuses: a local artifact
   must be built in this checkout.
5. **Given** a config-declared grapher, **When** its kind is read, **Then** it
   is shared, as today.

---

### User Story 4 - The tracked gate reads what was committed (Priority: P2)

An author runs `git add graphify-out/graph.json` and closes a change without
committing it. The tracked gate passes and `doctor` prints `fresh`. The next
clone of that commit has no graph.

**Why this priority**: the gate exists so a clone has the graph, and the index
is not what a clone gets.

**Independent Test**: stage a built graph without committing it and run close
and `doctor`. Find the refusal. Commit it and find the gate passing. Change the
committed graph in the working tree and find the gate still passing.

**Acceptance Scenarios**:

1. **Given** a shared artifact present, staged and absent from HEAD, **When**
   the tracked gate judges the root, **Then** close refuses, saying the artifact
   is not committed and naming the commands that add and commit it.
2. **Given** a shared artifact absent from HEAD and matched by an ignore rule,
   **When** the gate judges it, **Then** the refusal says it is ignored and
   names the rule to remove first, as today.
3. **Given** a shared artifact in HEAD and modified in the working tree,
   **When** the gate judges it, **Then** it passes. Freshness stays out of
   scope (MV-90).
4. **Given** a repo with no commit yet, **When** the gate judges it, **Then**
   the artifact is not committed, and close refuses.
5. **Given** any of these roots, **When** `doctor` reports it, **Then** it says
   what the gate would say, reading HEAD, and gates nothing.
6. **Given** any run of the gate or `doctor`, **When** it finishes, **Then**
   every index and HEAD is exactly as before.

---

### User Story 5 - The opt-outs are applied, not only named (Priority: P2)

The registry names OpenSpec's and codegraph's telemetry opt-outs and says
nothing sets them. The apply gate runs `openspec validate`, close runs
`codegraph sync`, and the post-edit hook runs a refresh on every edit, all with
whatever environment the operator's shell had.

**Why this priority**: MV-62 exists because the refresh runs on every edit, and
naming an opt-out nobody applies leaves the network traffic in place.

**Independent Test**: with stubs recording their environment and none of the
variables set in the parent, run the validator gate, the build, the refresh and
the post-edit hook doors writes. Find every variable the entry declares set in
each run.

**Acceptance Scenarios**:

1. **Given** the shipped registry, **When** `env` is read, **Then** opsx
   declares `DO_NOT_TRACK=1` and `OPENSPEC_TELEMETRY=0`, codegraph declares
   `DO_NOT_TRACK=1`, `CODEGRAPH_TELEMETRY=0` and `CODEGRAPH_NO_DOWNLOAD=1`, and
   speckit and graphify declare none.
2. **Given** an entry declaring `env`, **When** multivac runs its scaffold,
   validator, build or refresh, **Then** the process sees each declared
   variable at its declared value, over any inherited value, and the command
   string is unchanged.
3. **Given** a grapher whose entry declares `env`, **When** `doors` writes its
   post-edit hook, **Then** the hook sets each variable before the refresh
   runs, outside the declared command, and multivac still recognises the hook
   as its own.
4. **Given** an entry declaring no `env`, **When** it runs or its hook is
   written, **Then** the environment and the hook's bytes are what they are
   today.
5. **Given** the registry notes, **When** they are read, **Then** they no longer
   say that nothing here sets the opt-outs.

---

### User Story 6 - The registry states what is shared and what is local (Priority: P3)

The change that equips a root will write ignore rules and commit the vendor's
shared files. It needs to know, per adapter, which paths are versioned, which
stay in one checkout, and which lines keep a grapher from describing
multivac's own files. Today none of that is written down anywhere.

**Why this priority**: nothing reads these declarations yet, but the equip
change cannot be written without them, and they are facts to record while they
are measured.

**Independent Test**: read each shipped entry and compare it with the values
below.

**Acceptance Scenarios**:

1. **Given** speckit, **When** its declarations are read, **Then** shared is
   `.specify/**` without `.specify/feature.json` and
   `.specify/extensions/*/local-config.yml`, and those two are local.
2. **Given** opsx, **Then** shared is `openspec/config.yaml`,
   `openspec/config.yml` and `openspec/specs/**`, and nothing is local.
3. **Given** graphify, **Then** shared is `graphify-out/graph.json`, local is
   the rest of `graphify-out/`, its ignore lines are `graphify-out/*` and
   `!graphify-out/graph.json`, and its default graph-ignore lines are
   `.claude/`, `.multivac/`, `.specify/`, `specs/` and `openspec/`.
4. **Given** codegraph, **Then** nothing is shared, `.codegraph/` is local, its
   ignore line is `.codegraph/`, and it declares no graph-ignore lines, because
   no ignore file of codegraph's was verified.
5. **Given** this change, **When** it lands, **Then** no command writes an
   ignore file, commits a shared path or runs an init it did not run before.

---

### User Story 7 - The law says so (Priority: P3)

A maintainer adding a surface that asks whether a vendor is there reads
MV-124. It names the probe, the four states and what each surface does with
them, the shared/local split, the HEAD read, the opt-out environment, and what
the legs cannot catch.

**Why this priority**: presence has been the check since the first adapter, and
without the row the next surface will ask presence again.

**Independent Test**: read MV-124 and the rows it amends. In a scratch copy
with MV-124 active, add a presence check to a gate and confirm a leg turns red.

**Acceptance Scenarios**:

1. **Given** MV-124, **When** it is read, **Then** it states the rule, the
   measured evidence and its ceilings in about 400 words or fewer.
2. **Given** MV-52, MV-62, MV-75, MV-87, MV-90, MV-103, MV-113 and MV-121, **When** they
   are read, **Then** each carries an inline note dated 2026-09-14, naming
   MV-124, at the clause it changes.
3. **Given** MV-124 while this change is open, **When** the law is verified,
   **Then** a broken leg reports as pending and blocks nothing.

---

### Edge Cases

- An `integration.json` naming an integration the doors do not use (copilot) is
  installed. Whether the installed keys match `doors:` is the door map's
  question, a later change.
- A future spec-kit that bumps `integration_state_schema` reads as partial, so
  the scaffold warns and never re-runs over it.
- A `graph.json` holding merge-conflict markers is partial, and the build runs.
- A state path that is a directory, or a broken link, is not a state file, so
  the root is partial.
- `CODEGRAPH_DIR` moves codegraph's database. The probe reads the default path
  only, and a root using another directory reads as partial.
- A root not on disk is never probed. Which roots are acted on does not change.
- A sibling repo's HEAD is read in that repo, with the ambient git environment
  dropped (MV-106).
- An operator who sets `DO_NOT_TRACK=0` still gets `1` in runs multivac spawns
  for an entry declaring it. Running the tool by hand is the way to opt in.
- `init`'s proposal of an adapter from a directory it finds stays a proposal. It
  names a tool to declare and never says the tool is initialised.
- Test stubs write the state files the real tools write: an `integration.json`
  with schema 1 and an integration, a `codegraph.db`, a `graph.json` that
  parses. A stub kinder than the tool tests a tool that does not exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: One probe MUST decide, for a root and an adapter, whether the
  vendor is initialised there. It answers installed, missing, partial or
  unevaluable, with a reason for the last two. It MUST read only files: no
  subprocess and no network.
- **FR-002**: Each shipped entry MUST declare its state files and their checks:
  - speckit: `.specify/integration.json` parses as JSON, its
    `integration_state_schema` is 1, and `installed_integrations` is a
    non-empty list;
  - opsx: `openspec/config.yaml` or `openspec/config.yml` is a file;
  - graphify: `graphify-out/graph.json` parses as JSON;
  - codegraph: `.codegraph/codegraph.db` is a file.

  The vendor's own directory is `.specify/`, `openspec/`, `graphify-out/` and
  `.codegraph/` respectively. A config-declared grapher has none, and is
  installed when its declared artifact exists and missing otherwise.
- **FR-003**: The states MUST mean:
  - installed: every check passes;
  - unevaluable: a state file whose check reads it is there and cannot be
    read; the reason names the path and the error;
  - partial: otherwise, the vendor's own directory or a state file is there
    and a check fails; the reason names the path and the check;
  - missing: none of the above.
- **FR-004**: Every surface that asks whether an adapter is initialised in a
  root MUST ask the probe: the scaffold, the first build, the choice between
  build and refresh, the graph gate, the tracked gate, `doctor`, and the
  project-document gate's choice of roots. No surface MAY decide it from a
  path being there.
- **FR-005**: The scaffold MUST run nothing and print nothing in an installed
  root. It MUST run the vendor's init in a missing root, and print
  `scaffolded` only when the probe then finds the root installed. In a partial
  or unevaluable root it MUST run nothing and warn, naming the root, the reason
  and the init command.
- **FR-006**: A grapher root that is missing or partial MUST get the build
  command, and an installed one the refresh. An unevaluable root MUST get
  neither. The graph gate MUST pass an installed root, refuse a missing or
  partial one with the reason, and refuse an unevaluable one as unable to be
  checked, with the reason. The binary rule stays MV-123's.
- **FR-007**: `doctor` MUST report each root's state, with the reason when
  partial or unevaluable, and, for a grapher, whether its artifact is shared or
  local. Its exit codes MUST NOT change.
- **FR-008**: The project-document gate MUST ask every root whose state is not
  missing.
- **FR-009**: codegraph's artifact MUST be `.codegraph/codegraph.db`, declared
  local. graphify's artifact MUST be declared shared. A config-declared
  grapher's artifact is shared.
- **FR-010**: The tracked gate MUST judge only shared artifacts of installed
  roots, and MUST ask whether the artifact is in that root's committed HEAD,
  not in its index. Absent from HEAD and ignored, it MUST say ignored and name
  the rule to remove first. Absent from HEAD otherwise, it MUST say not
  committed and name the commands to add and commit it. A local artifact MUST
  never be asked. `doctor` MUST report the same reading. Neither MAY stage or
  commit anything.
- **FR-011**: Each shipped entry MUST declare `shared`, `local` and `ignore`,
  each grapher its default graph-ignore lines, and each entry `env`, with the
  values in User Stories 5 and 6. Nothing in this change MAY read `shared`,
  `local`, `ignore` or the graph-ignore lines, and a test MUST pin their values.
- **FR-012**: Every vendor command multivac runs for an entry, meaning the
  scaffold, the validator, the build and the refresh, MUST run with that entry's
  `env` over the inherited environment, the declared value winning. The
  command string MUST NOT change. The post-edit hook `doors` writes MUST set
  the same variables before the refresh and outside the declared command, and
  MUST stay recognisable as multivac's. An entry with no `env` MUST leave both
  as they are today.
- **FR-013**: MV-124 MUST replace the reserved row with the rule, the evidence
  and the ceilings in about 400 words or fewer, authority `specified`, state
  `proposed`. Its legs MUST pin the single probe, each call site asking it, the
  HEAD read, codegraph's local artifact, the declared `env` on each run, and
  the absence of presence checks and of index reads for the tracked question,
  wherever a pattern can tell them from prose.
- **FR-014**: MV-52, MV-62, MV-75, MV-87, MV-90, MV-103, MV-113 and MV-121 MUST each
  carry an inline note naming MV-124 where their rule changes:
  - MV-52: the hook carries the entry's opt-out environment;
  - MV-62: the opt-out is applied on every run, not only named;
  - MV-75: the scaffold asks the probe, and a partial root is warned, not
    re-initialised;
  - MV-87: "lacks the artifact" and "no artifact" mean the probe does not find
    the vendor installed;
  - MV-90: existence is the probe's installed, and a local artifact means built
    in this checkout;
  - MV-103: shared artifacts only, read from HEAD, codegraph exempt;
  - MV-113: its `absent` leg on `specs/*` in the registry moves to a `*` inside
    an `artifact:` value, since opsx's shared `openspec/specs/**` is a glob of
    paths to version, not a proof (found while implementing);
  - MV-121: "never claims multivac applies one" is withdrawn for the variables
    an entry's `env` declares.

  Legs that name replaced expressions MUST move in the same change. Copies that
  say nothing sets the opt-outs, that name `.codegraph` as codegraph's
  artifact, or that call an artifact tracked when it is only in the index MUST
  change with them in docs, skills, DESIGN.md, source comments and test titles
  (MV-111).
- **FR-015**: No runtime dependency MAY be added. `verify`, `doctor` and
  `doors` MUST stay offline and spawn no vendor tool (MV-01). No test MAY
  depend on the host PATH.

### Key Entities

- **State file**: a file a vendor writes when its init runs, with the check
  that proves the init finished.
- **Init state**: the probe's answer for one root and one adapter: installed,
  missing, partial or unevaluable, with a reason.
- **Shared path**: a vendor path that belongs in the repository and is
  committed.
- **Local path**: a vendor path that belongs to one checkout and is ignored.
- **Artifact kind**: whether a grapher's artifact is shared or local.
- **Opt-out environment**: the variables an entry declares to turn off a
  vendor's network traffic, set on every run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Surfaces that decide "initialised" from a path being there drop
  from 7 to 0, and one probe answers for all 7.
- **SC-002**: The 5 measured cases, a hand-made `.specify/`, a 0-byte
  `graph.json`, a staged-only `graph.json`, a codegraph clone without its
  database and a vendor run without its opt-outs, each give the outcome this
  spec requires: 5 of 5.
- **SC-003**: For opsx and codegraph, every declared variable is set in 100% of
  recorded runs: the validator, the build, the refresh and the post-edit hook.
- **SC-004**: With PATH empty, the probe returns the same state for every
  fixture as with stubs on PATH.
- **SC-005**: Every existing assertion on outcomes and exit codes passes, except
  the ones this change inverts: a hand-made root that stayed silent, a staged
  graph that passed, and a codegraph clone that skipped its build. Assertions
  on wording this change retires move with it.
- **SC-006**: `verify --strict` reports 0 blocking failures, and the full test
  suite passes with no test reading the host PATH.
- **SC-007**: 8 of 8 amended rows carry a note naming MV-124. MV-124 stays
  `proposed`, because this change enacts nothing.

## Assumptions

- The measurements are from 2026-09-14, against this build with HOME isolated,
  stubs on a constructed PATH, and spec-kit 1.0.6 for `integration.json` and
  `specify integration status`. This brain's own `integration.json`, written by
  spec-kit 0.16.4, carries the same two keys. Whether spec-kit before 0.16.4
  writes the file was not measured: such an install reads partial and is
  warned, never re-initialised.
- codegraph and OpenSpec were not installed where this was measured. codegraph
  1.6.0's `.codegraph/codegraph.db`, its own `.gitignore` and its
  `CodeGraph not initialized` exit, and OpenSpec 1.13.0's `openspec/config.yaml`
  or `config.yml`, come from the 2026-09-14 requirements study and the
  registry's verified notes. Stubs reproduce them here.
- The opt-out names are the ones MV-121 recorded from OpenSpec 1.13.0's source
  and codegraph 1.6.0's README. Whether each vendor honours them was read, not
  measured on the network.
- spec-kit 1.0.6's own `.specify/.gitignore` ignores `feature.json` and
  `extensions/*/local-config.yml`, which is where speckit's local list comes
  from.
- HEAD is the committed ref this change reads. Reading the integrated ref of a
  landing branch waits for the change that commits `graph.json` at `land`.
- Rows are amended inline in the table's shape, "Amended 2026-09-14 by
  MV-124", with the WITHDRAWN convention for a retired clause (MV-111,
  MV-120).
