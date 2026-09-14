# Feature Specification: Vendor facts are true

**Feature Branch**: `vendor-facts-true`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Five things the registry, its copies and the law say about vendor tools are false: the SDD scaffold 'reaches the network', graphify's `query` 'is absent from its help', OpenSpec's terminal CLI is 'init/update/list/show/validate', spec-kit 'leaves .claude/settings.json alone', and two entries hide the network their tools reach. Correct every copy against measured versions, without changing who runs what, and make the rule law."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The scaffold's stated reason is true (Priority: P1)

An operator reads `doctor`'s sdd line, a reference page, or MV-75 to learn why
only the change lifecycle runs `specify init`. Each of them says the init
"reaches the network" or "downloads its templates". That reason appears 16
times: in the registry note and the `scaffold` field's doc, the scaffold
function's doc and comment, `doctor`'s comment and the clause it prints, MV-51,
MV-75, two reference pages (three places), and two test files (five places).
MV-87 cites MV-01 for it. It is false.
`specify init --help` 1.0.6 says initialization does not need network access.
specify 1.0.6, 0.16.5 and 0.9.4, and `openspec init` 1.13.0, all exit 0 with
the network denied.

**Why this priority**: the false reason is the one that keeps SDD setup out of
`init`, and it is printed to every operator whose repo lacks the scaffold. A
later decision about where the scaffold runs has to rest on true reasons.

**Independent Test**: search the live tree for the retired reason and find
none. Then read MV-51, MV-75, the `doctor` clause and the two reference pages,
and find each one naming the same commands as before, with a reason that is
true.

**Acceptance Scenarios**:

1. **Given** a repo that declares speckit and lacks `.specify`, **When**
   `doctor` runs, **Then** its sdd line still names the init and says `doctor`
   never runs it, and the reason it gives names no network.
2. **Given** MV-51 and MV-75, **When** they are read, **Then** each carries an
   inline note dated 2026-09-14 that names MV-121 and withdraws the network
   clause. The clause stays visible, and the note states the measured fact.
3. **Given** the change lifecycle, `verify`, `doctor`, `doors` and `init`,
   **When** each one runs over a repo lacking the scaffold, **Then** the same
   commands run it as before the change: the lifecycle does, and the other four
   never do.
4. **Given** a later edit that restores the retired reason in source, a site
   page, a skill or a test, **When** the law is verified with MV-121 active,
   **Then** the result is a blocking failure that names the file.

---

### User Story 2 - An entry names the network its tool reaches (Priority: P1)

An operator on a machine that declares opsx or codegraph reads the entry to
learn what leaves the machine when multivac runs the tool. Principle V requires
the entry to say. The opsx entry says nothing, although every `openspec`
command sends PostHog telemetry to `edge.openspec.dev` by default. That
includes `openspec validate`, which the gates run, and `openspec update` also
checks the npm registry. The codegraph entry names its telemetry, but it omits
`CODEGRAPH_TELEMETRY=0` and the npm shim's download of the platform bundle from
GitHub Releases. It also quotes a never-collected list the vendor no longer
states.

**Why this priority**: the constitution is already broken here, and the traffic
reaches third parties from someone else's machine.

**Independent Test**: read both entries and find each network path the vendor's
own source shows, with its opt-out variables spelled exactly as that source
spells them.

**Acceptance Scenarios**:

1. **Given** the opsx entry, **When** it is read, **Then** it names the default
   telemetry on every command, including the validator the gates run, and the
   npm version check on `openspec update`, together with `DO_NOT_TRACK=1` and
   `OPENSPEC_TELEMETRY=0`.
2. **Given** the codegraph entry, **When** it is read, **Then** it names the
   telemetry with `codegraph telemetry off`, `CODEGRAPH_TELEMETRY=0` and
   `DO_NOT_TRACK=1`, names the shim's GitHub Releases fallback with
   `CODEGRAPH_NO_DOWNLOAD=1`, and quotes the never-collected list as 1.6.0
   states it.
3. **Given** either entry, **When** it is read, **Then** nothing in it claims
   multivac sets any opt-out itself.
4. **Given** the codegraph entry, **When** it is read, **Then** it also names
   the MCP server's update check with `CODEGRAPH_NO_UPDATE_CHECK`, because the
   note names that server.

---

### User Story 3 - MV-61 states graphify's help as it is (Priority: P2)

An agent reads MV-61 to learn why query verbs are recorded only after they are
run. The example the row gives is that graphify's `query` is absent from its
own help, and a present leg pins that phrase in the registry. `graphify --help`
0.9.29 lists `query "<question>"`. The same false example appears in a registry
comment, the graphify note and the graphers reference page.

**Why this priority**: the rule stays true and only its evidence is wrong, but
the law currently anchors something false.

**Independent Test**: read MV-61 and find the example withdrawn and the rule
intact. Then search the live tree for the retired phrase and find only the
note that quotes it.

**Acceptance Scenarios**:

1. **Given** MV-61, **When** it is read, **Then** an inline note names MV-121,
   withdraws the help-output example, and keeps the rule that a verb is
   recorded only after it is run.
2. **Given** the registry and the reference page, **When** they are read,
   **Then** neither says `query` is missing from graphify's help, and the
   present leg on that phrase is gone.

---

### User Story 4 - The remaining vendor notes match the tool (Priority: P3)

A maintainer reads the registry to learn a vendor's surface. The opsx note and
a site callout both say OpenSpec's terminal CLI is `init/update/list/show/validate`,
but 1.13.0 also ships terminal `archive`, `new change`, `status` and
`instructions`. The speckit scaffold comment says spec-kit leaves
`.claude/settings.json` alone. In fact spec-kit re-serializes that file: the
result is byte-identical when multivac wrote it, the file is rewritten when
formatted another way or holding non-ASCII text, and it is deleted when it
holds only `{"hooks": {}}`.

**Why this priority**: neither fact changes what multivac runs today. Both
mislead the next person who designs against them.

**Independent Test**: compare each statement with the vendor's measured
behaviour at the version it names.

**Acceptance Scenarios**:

1. **Given** the opsx note and the site callout, **When** they are read, **Then**
   neither lists the terminal CLI as those five verbs alone, and both still
   say the steps are chat commands the agent runs.
2. **Given** the speckit scaffold comment, **When** it is read, **Then** it states
   the three measured outcomes for `.claude/settings.json` and the version they
   were measured on.

---

### User Story 5 - The rule is law, with its limits stated (Priority: P3)

A maintainer about to add or edit a registry entry reads MV-121 and learns
three things: vendor facts carry the version they were measured on, network
disclosure covers every command multivac runs from an entry, and a retired
fact is retired at every copy,
together with what the legs can and cannot catch.

**Why this priority**: without the row, this is one more correction pass that
ages like the last one.

**Independent Test**: read MV-121. Then, in a scratch copy with the row
active, restore each retired phrase and confirm its leg turns red.

**Acceptance Scenarios**:

1. **Given** MV-121, **When** it is read, **Then** it states the rule, the
   measured evidence and its ceilings in about 400 words or fewer.
2. **Given** MV-121 while this change is open, **When** the law is verified,
   **Then** a broken leg reports as pending and blocks nothing.
3. **Given** MV-121 marked active in a scratch copy, **When** any retired phrase
   is restored, **Then** the matching leg reports a blocking failure.

---

### Edge Cases

- Some copies of "reaches the network" are true: `roadmap sync`, the tracker
  adapter and MV-99. A leg on the bare phrase would fail them, so each leg
  targets the scaffold's retired wording.
- The amendment notes quote the retired phrases. A leg that forbids a phrase
  therefore cannot read the law file, or must target wording the notes do not
  carry.
- History must not trip a leg. That covers archived changes, `specs/**` (this
  spec included) and `CHANGELOG.md`.
- spec-kit 0.5.0's help says project files download from a GitHub release on
  its `--ai` path. The registry argv uses `--integration`, which exited 0 with
  the network denied even in 0.5.0. The corrected fact names the versions
  measured and never claims every version.
- Without `claude` on PATH, the registry argv exits 1 before writing anything.
  That is not a network fact, and it stays out of scope.
- Two test fixtures simulate an init failure with "failed to download
  template". A reader learns the false premise from them, so they simulate a
  failure that names no download.
- `openspec update` is the opsx entry's `refresh`, which no multivac path runs.
  Its network is still disclosed, because the entry names the command.
- MV-62's legs pin "TELEMETRY IS ON BY DEFAULT" and "codegraph telemetry off".
  Both stay true, and the codegraph note keeps both.
- While MV-121 is `proposed`, its legs read as pending. Proof that they bite
  has to come from a scratch copy with the row active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No live copy MAY give the network as the reason the SDD scaffold
  is not run by a command. That covers the 16 places in User Story 1.
- **FR-002**: Where a reason is still given, it MUST be one that is true today:
  the init writes the vendor's files into the tree, and running it again
  reverts edited ones. A revert or network fact stated MUST name the measured
  version.
- **FR-003**: Which commands run the scaffold MUST NOT change, and neither may
  the tests that pin it. MV-75's `absent` leg over `verify`, `doctor` and
  `doors` MUST stay.
- **FR-004**: MV-51 and MV-75 MUST each carry an inline amendment note naming
  MV-121 that withdraws the network clause and keeps it visible. MV-87 MUST
  carry one that scopes its MV-01 citation to the grapher's first build.
- **FR-005**: MV-61 MUST carry an inline amendment note naming MV-121 that
  withdraws the help-output example and keeps the rule. Its present leg on the
  retired phrase MUST be removed. The registry comment, the graphify note and
  the reference page MUST move with it.
- **FR-006**: The opsx entry MUST disclose the default telemetry on every
  command, including the validator the gates run, and the npm version check on
  `update`. It MUST give the opt-outs as the vendor's source spells them.
- **FR-007**: The codegraph entry MUST add `CODEGRAPH_TELEMETRY=0` and the
  shim's download fallback with `CODEGRAPH_NO_DOWNLOAD=1`. Its never-collected
  list MUST be the one the named version's docs give. Its two MV-62-pinned
  phrases MUST stay.
- **FR-008**: No entry MAY claim multivac applies an opt-out, and no opt-out is
  applied by this change.
- **FR-009**: The opsx note and the site callout MUST NOT present the terminal
  CLI as `init/update/list/show/validate` alone.
- **FR-010**: The speckit scaffold comment MUST state spec-kit's measured effect
  on `.claude/settings.json` and the version it was measured on.
- **FR-011**: Test fixtures that simulate an init failure MUST NOT name a
  download.
- **FR-012**: MV-121 MUST replace the reserved row with the rule, the evidence
  and the ceilings in about 400 words or fewer. Its authority is `specified`
  and its state stays `proposed`.
- **FR-013**: MV-121 MUST carry an `absent` leg for each retired phrase: the
  scaffold's network reason, graphify's missing `query`, the five-verb OpenSpec
  CLI, and spec-kit leaving settings alone. No leg may match history, the notes
  that quote those phrases, the true network copies, or vendor-authored skills.
- **FR-014**: No runtime dependency MAY be added, and no behaviour may change
  beyond the text `doctor` prints. Tests that pin that text MUST move in the
  same change.

### Key Entities

- **Registry entry**: one adapter's data in the registry, together with its
  note and the comments beside it. It is the source every copy restates.
- **Copy**: a restatement of an entry's fact outside the entry, in law rows,
  printed messages, site pages, test comments or titles.
- **Amendment note**: an inline, dated note on a law row that names the amending
  row and keeps the withdrawn clause visible.
- **Leg**: an anchor under a row. `absent` forbids a pattern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Live copies of the scaffold's network reason drop from 16 to 0.
- **SC-002**: Live statements that graphify's help lacks `query` drop from 4 to
  0, and the present leg pinning one is gone.
- **SC-003**: 2 of 2 entries whose tools reach the network name every path
  measured and its opt-out. Today that is 0 of 2.
- **SC-004**: Which command runs the scaffold is unchanged: MV-75's `absent` leg
  stays green, and the lifecycle scaffold tests pass unmodified in what they
  assert about who runs it.
- **SC-005**: `verify --strict` reports 0 blocking failures, and the full test
  suite passes.
- **SC-006**: With MV-121 active in a scratch copy, restoring each retired
  phrase turns its leg red, 4 of 4. MV-121 stays `proposed`, because this change
  enacts nothing.

## Assumptions

- The measurements come from the 2026-09-14 requirements synthesis. Those runs
  used an isolated HOME and network denied by `sandbox-exec`, and read the
  OpenSpec 1.13.0 and codegraph 1.6.0 packages' own source. Other versions are
  not claimed.
- The decision stays and only its stated reason is replaced. Moving the
  scaffold into `init` is a later change that amends MV-75's "change lifecycle
  alone".
- Applying the opt-outs to the environment multivac spawns tools with is a later
  change. Principle V requires disclosure, and disclosure is what this change
  delivers.
- The `refresh` that SDD entries carry and no path runs is registry shape, not a
  vendor fact. Recording an opsx scaffold and adding `--ignore-agent-tools` are
  later changes too.
- Rows are amended inline in the table's shape, "Amended 2026-09-14 by MV-121",
  with the WITHDRAWN convention for a retired clause (MV-111, MV-120).
