# Feature Specification: One binary lookup

**Feature Branch**: `one-binary-lookup`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Two rules decide whether a vendor binary is there, and neither knows PATHEXT. `doctor`, `doors`, the refresh at close and the graph gate look on PATH alone, while the validator and the scaffold also look in the root's `node_modules/.bin`. The speckit scaffold exits 1 when `claude` is not on PATH, and its failure is quoted by spec-kit's ASCII banner. A graphify failure is quoted by its traceback header. No missing-binary message names the vendor. Use one lookup for adapter binaries, declare which binaries each adapter requires, pass `--ignore-agent-tools`, quote a failure by its cause, name the vendor's repository, and make the rule law."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A binary is found the same way everywhere (Priority: P1)

An operator installs OpenSpec as a project dependency, so `openspec` lives in
the brain's `node_modules/.bin` and not on PATH. `change apply` runs the
validator from there. `doctor` says `binary missing → npm i -g
@fission-ai/openspec` for the same binary. A grapher installed the same way
reads as missing at close, at the graph gate and in `doors`, and no refresh
hook is wired for it.

**Why this priority**: two answers to one question means one of them is a
false report, and the operator cannot tell which.

**Independent Test**: in a scratch brain with a stub binary in
`node_modules/.bin` only, run `doctor`, `change apply`, `doors` and
`change close`. All four agree that it is found. Move the stub onto PATH, then
remove it, and they agree again each time.

**Acceptance Scenarios**:

1. **Given** `openspec` is executable only in a root's `node_modules/.bin`,
   **When** `doctor` reports that root, **Then** it reports the binary found,
   just as the gate that runs the validator does.
2. **Given** a grapher's binary is executable only in a root's
   `node_modules/.bin`, **When** close builds or refreshes that root, the graph
   gate evaluates it, or `doors` projects it, **Then** the command runs and
   reaches that binary, the gate evaluates rather than refusing as missing, and
   the post-edit hook is wired and reaches the same binary.
3. **Given** the same binary on PATH and in `node_modules/.bin`, **When** any
   surface looks it up, **Then** the copy on PATH is the one found and run.
4. **Given** win32 and a PATHEXT listing `.EXE`, **When** `specify` is looked
   up with `specify.exe` in a PATH directory, **Then** it is found.
5. **Given** a file with the binary's name in `node_modules/.bin` that is not
   executable, **When** it is looked up, **Then** it is not found.

---

### User Story 2 - The scaffold runs without `claude`, and a failure says why (Priority: P1)

An operator declares `sdd: speckit` on a machine where `specify` is installed
and `claude` is not. `change new` runs the scaffold. It exits 1, writes
nothing, and the lifecycle prints `left no .specify in brain — it said:
███████╗██████╗ …`. The cause, `claude not found`, is on line 28. When a graph
refresh fails, close quotes `Traceback (most recent call last):` and a path on
this machine. The `PermissionError` that says what went wrong is on the last
line.

**Why this priority**: the scaffold is what makes the SDD's steps runnable,
and it fails for a reason nobody is shown.

**Independent Test**: with a stub that behaves as spec-kit 1.0.6 does without
`claude`, run `change new` and find `.specify` written. Feed the recorded
outputs of spec-kit 1.0.6 and graphify 0.9.29 to the failure paths, and find
each cause quoted with no banner.

**Acceptance Scenarios**:

1. **Given** `sdd: speckit`, `specify` found and no `claude` on PATH, **When**
   `change new` scaffolds, **Then** the command it prints and runs passes
   `--ignore-agent-tools`, and `.specify` is there afterwards.
2. **Given** a scaffold that fails with spec-kit 1.0.6's recorded output,
   **When** the lifecycle reports it, **Then** the quote contains
   `claude not found` and no block-element or box-drawing character.
3. **Given** a refresh that fails with graphify 0.9.29's recorded traceback,
   **When** close warns, **Then** the quote is the `PermissionError` line, and
   neither the `Traceback` header nor a `File` line.
4. **Given** a failure whose output names no cause, **When** it is quoted,
   **Then** the quote is its last non-banner lines.
5. **Given** a validator that reports issues in its JSON shape, **When** it
   fails, **Then** those issues are quoted exactly as today.
6. **Given** the test suite's `specify` stub, **When** it is invoked with an
   argv other than the registry's scaffold command, **Then** it fails the run.
   **When** it is invoked without `--ignore-agent-tools` and no `claude` is on
   its PATH, **Then** it prints spec-kit 1.0.6's recorded output and exits 1.

---

### User Story 3 - A missing binary names how to get it and whose it is (Priority: P2)

An operator on a fresh machine runs `change new` in a brain declaring speckit
and graphify. Each notice names an install line. None names the project
behind the tool. `graphifyy` on PyPI and `graphify` on npm are different
things, and the one fact that settles which is meant, the vendor's repository,
is in the registry and printed nowhere.

**Why this priority**: an install line alone can be wrong for this machine,
and without the repository the operator has nothing to check it against.

**Independent Test**: with no vendor binary findable, run `change new`,
`change plan`, `change close` and `doctor`. Every missing-binary line names
the binary, the adapter, the install line and the vendor's repository.

**Acceptance Scenarios**:

1. **Given** speckit is declared and `specify` is not found, **When** the
   scaffold or `doctor` reports it, **Then** each line names
   `specify`, `speckit`, `uv tool install specify-cli` and
   `https://github.com/github/spec-kit`.
2. **Given** graphify is declared and `graphify` is not found, **When** the
   build or refresh notice, the graph gate or `doctor` reports it, **Then** each
   line names `graphify`, the adapter, `uv tool install graphifyy` and
   `https://github.com/Graphify-Labs/graphify`.
3. **Given** a config-declared grapher, which has no vendor repository on
   record, **When** its binary is not found, **Then** the line names the binary,
   the adapter and its install line, and says the grapher is declared in the
   config instead of naming a repository.
4. **Given** any binary that is not found, **When** its line is printed,
   **Then** it names both places looked, PATH and the root's
   `node_modules/.bin`, and never says "not on PATH" alone.
5. **Given** any of these commands, **When** a binary is missing, **Then** the
   exit code and outcome are the ones it had before this change.

---

### User Story 4 - The registry states what must be installed (Priority: P2)

A maintainer adds an adapter whose command needs two binaries. `binaries`
means "any of", which is right for detection. It cannot say "all of these
must be found before this runs", so a surface asking whether the command can
run would get yes with half the tool present.

**Why this priority**: the lookup needs a list it can require in full, and
the later init refusal needs the same list.

**Independent Test**: read each shipped entry's `required`. Look up an entry
declaring two required binaries with one of them absent, and find it not
runnable, with the absent one named.

**Acceptance Scenarios**:

1. **Given** the shipped registry, **When** `required` is read, **Then** speckit
   requires `specify`, opsx `openspec`, graphify `graphify` and codegraph
   `codegraph`.
2. **Given** a config-declared grapher, **When** its `required` is read,
   **Then** it is its declared `binary`, or else the first word of its
   `refresh`.
3. **Given** an adapter whose `required` lists two binaries and one is not
   found, **When** any surface asks whether it can run, **Then** the answer is
   no, and the missing binary is the one named.
4. **Given** `binaries`, **When** this change lands, **Then** every entry still
   carries it and no command reads it: `required` alone decides whether a root
   can run.

---

### User Story 5 - The law says so (Priority: P3)

A maintainer adding a surface that runs a vendor tool reads MV-123. It says
which lookup to ask, in which root, what a missing binary's line names, how a
failure is quoted, and what the legs cannot catch.

**Why this priority**: the second lookup arrived as a local fix to one call
site, and without the row the third will too.

**Independent Test**: read MV-123 and the rows it amends. Then, in a scratch
copy with MV-123 active, add a PATH walk to a surface and confirm a leg turns
red.

**Acceptance Scenarios**:

1. **Given** MV-123, **When** it is read, **Then** it states the rule, the
   measured evidence and its ceilings in about 400 words or fewer.
2. **Given** MV-50, MV-52, MV-66, MV-75, MV-90 and MV-115, **When** they are
   read, **Then** each carries an inline note dated 2026-09-14, naming MV-123,
   at the clause it changes.
3. **Given** MV-123 while this change is open, **When** the law is verified,
   **Then** a broken leg reports as pending and blocks nothing.

---

### Edge Cases

- A binary in one root's `node_modules/.bin` is not found for another root.
  The brain's local install does not make a sibling runnable.
- An empty PATH segment is skipped, as today. It is never read as the current
  directory.
- On win32, a name is tried with each extension PATHEXT lists, in PATHEXT's
  order, in both places. Elsewhere PATHEXT is ignored.
- `doctor` reports the same tool once per root, because the second half of the
  lookup depends on the root.
- A declared grapher whose `refresh` begins with `env` or a variable
  assignment still has its first word taken as the binary. That is MV-115's
  ceiling, and declaring `binary:` is the fix.
- A traceback that chains exceptions is quoted by its last exception line.
- Output made only of banner lines quotes node's own first message line, as
  today.
- The post-edit hook reaches `node_modules/.bin` in the directory it runs in.
  That is the same directory its lock is relative to, so it has the same
  ceiling.
- A root not on disk is never looked up in. Which roots are acted on does not
  change.
- Tests exercise the win32 rule by giving the lookup a platform and a PATHEXT.
  No test runs on win32 or reads the host PATH.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: One lookup MUST decide whether an SDD or grapher adapter's
  binary is found for a root. It tries each PATH directory in order, then the
  root's own `node_modules/.bin`, and a match MUST be an executable file. No
  other code may probe PATH or `node_modules/.bin` for an adapter's binary.
- **FR-002**: On win32 the lookup MUST try the name with each extension
  PATHEXT lists, in that order, in both places. On other platforms it MUST
  ignore PATHEXT.
- **FR-003**: Every surface that runs an adapter's command, or reports whether
  it can, MUST ask that lookup in the root the command runs in. That covers
  the scaffold, the validator, the graph build and the refresh at close, the
  graph gate, `doors`' decision to wire the refresh hook, and `doctor`.
- **FR-004**: A command MUST run the binary the lookup found. A command run
  through a shell, meaning a grapher's build, its refresh at close and the
  post-edit hook, MUST reach the root's `node_modules/.bin` after PATH.
- **FR-005**: Each adapter MUST declare `required`, the binaries that must all
  be found: `specify` for speckit, `openspec` for opsx, `graphify` for
  graphify, `codegraph` for codegraph. A config-declared grapher requires its
  `binary`, or else the first word of `refresh`. A root can run an adapter only
  when every required binary is found. `binaries` stays, and no command reads it.
- **FR-006**: Every line reporting a missing required binary MUST name the
  binary, the adapter, the registry's install line, and the vendor's
  repository from the entry's `source`. A config-declared grapher MUST say it
  is declared in the config in place of a repository. The line MUST name both
  places looked.
- **FR-007**: When a binary is missing, every call site MUST keep its outcome
  and exit code. The scaffold warns and goes on, the build and refresh print
  their notice, the SDD validator gate and the graph gate refuse, `doctor`
  reports, and `doors` wires no hook. This binds the change, not the law:
  MV-123 leaves each outcome to the row governing its call site (MV-50, MV-52,
  MV-66, MV-75, MV-90), so a later change may alter one there.- **FR-008**: The speckit scaffold command MUST pass `--ignore-agent-tools`.
  Its note MUST state the measured reason with spec-kit's version.
- **FR-009**: When a vendor command fails, its quote MUST be built in this
  order:
  1. Drop every line made only of box-drawing, block-element and space
     characters, and trim box borders off the lines that remain.
  2. If a Python traceback is present, quote the exception line that ends it.
  3. Otherwise, quote the lines naming an error, a refusal, a denial or
     something not found, in the tool's order.
  4. Otherwise, quote the last lines.

  The quote MUST hold at most three lines. When nothing remains, node's first
  message line MUST be quoted, as today. A validator's JSON issues MUST be
  quoted as today.
- **FR-010**: FR-009 MUST be one rule, used by the scaffold's failure, the
  validator's non-JSON failure, and the build or refresh failure at close.
- **FR-011**: The test `specify` stub MUST check its argv against the
  registry's scaffold command. Without `--ignore-agent-tools` and with no
  `claude` on its PATH, it MUST print spec-kit 1.0.6's recorded output and
  exit 1. Failure-quote tests MUST use the recorded outputs of spec-kit 1.0.6
  and graphify 0.9.29. No test MAY depend on the host PATH.
- **FR-012**: MV-123 MUST replace the reserved row with the rule, the
  evidence and the ceilings in about 400 words or fewer, authority
  `specified`, state `proposed`. Its legs MUST pin the single lookup, the
  scaffold flag and the single quoting rule, and pin the absence of other
  adapter-binary probes wherever a pattern can tell a probe from prose.
- **FR-013**: MV-50, MV-52, MV-66, MV-75, MV-90 and MV-115 MUST each carry an
  inline note naming MV-123 where their rule changes:
  - MV-50: how a refresh failure is quoted, and what the missing-binary notice
    names;
  - MV-52: what "binary present" means for the hook, and what the hook reaches;
  - MV-66: that the validator's lookup is now every adapter's;
  - MV-75: the scaffold's argv;
  - MV-90: what a gate refusing a missing binary names;
  - MV-115: which probe its first-word ceiling now describes.

  Legs that name replaced expressions MUST move in the same change. Copies
  that call the whole lookup "on PATH", or promise a tool's first or stderr
  lines, MUST change with them in docs, skills, DESIGN.md, source comments and
  test titles (MV-111).
- **FR-014**: No runtime dependency MAY be added. The lookup MUST read only
  the filesystem and the environment. `verify`, `doctor` and `doors` MUST stay
  offline and spawn no vendor tool (MV-01).

### Key Entities

- **Adapter binary**: a binary an SDD or grapher adapter's commands need,
  listed in its `required`.
- **Root**: the brain, or one declared repo on disk. It is where a command runs
  and where `node_modules/.bin` is looked in.
- **Missing-binary line**: any output saying a required binary was not found:
  a notice, a refusal or a `doctor` report.
- **Failure quote**: the part of a failed vendor command's output that a
  warning or refusal repeats.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Rules for finding an adapter binary drop from 2 to 1.
- **SC-002**: `doctor`, the apply gate, close and `doors` agree on found or not
  found in 4 of 4 placements: on PATH only, in `node_modules/.bin` only, in
  both, and nowhere.
- **SC-003**: With `specify` found and no `claude` on PATH, `change new` exits 0
  and leaves `.specify` in the brain.
- **SC-004**: For the recorded spec-kit 1.0.6 and graphify 0.9.29 failures, the
  quote contains `claude not found` and the `PermissionError` line
  respectively. It contains 0 box-drawing or block-element characters and 0
  `File "` lines.
- **SC-005**: For each of the 4 shipped adapters, every missing-binary line
  from the scaffold, the validator gate, the build or refresh, the graph gate
  and `doctor` contains that adapter's `source` URL.
- **SC-006**: Every existing assertion on outcomes and exit codes passes.
  Assertions on wording this change retires move with it.
- **SC-007**: `verify --strict` reports 0 blocking failures, and the full test
  suite passes with no test reading the host PATH.
- **SC-008**: 6 of 6 amended rows carry a note naming MV-123. MV-123 stays
  `proposed`, because this change enacts nothing.

## Assumptions

- The measurements are from 2026-09-14: spec-kit 1.0.6 and graphify 0.9.29,
  run against this repository's build with HOME isolated and a constructed
  PATH. `doctor`'s disagreement was run. That `doors`, the refresh and the
  graph gate use the same PATH-only probe was read from source.
- The win32 behaviour is inferred from source (audit C46) and specified from
  PATHEXT's documented meaning. It was never run on win32. Whether node can
  spawn a `.cmd` shim found this way is not established, and the row states
  that ceiling.
- `--ignore-agent-tools` was measured on spec-kit 1.0.6 only. Whether older
  versions accept it was not checked, and a version floor is a later change.
- Matching a cause works on English words. A tool that states its cause in
  other words falls back to its last lines. That is a ceiling, not a guarantee.
- The set of roots does not change. Refusing a command before it writes, when
  a binary is missing, is a later change that uses this lookup and this line.
- Rows are amended inline in the table's shape, "Amended 2026-09-14 by
  MV-123", with the WITHDRAWN convention for a retired clause (MV-111,
  MV-120).
