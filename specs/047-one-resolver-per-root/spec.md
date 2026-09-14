# Feature Specification: One resolver per root

**Feature Branch**: `one-resolver-per-root`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Twelve functions resolve `sdd:` and `grapher:` on their own, and they disagree. The SDD gate and the printed steps read only the ecosystem's `sdd:`, an opted-out repo still proves a step, `grapher: none` reads as an unverified grapher, the brain ignores its own `grapher:`, and `init --grapher` accepts any typo. Resolve every adapter per root in one place, make `none` a token for both kinds, refuse an unknown `--grapher` before writing, and make the rule law."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The SDD gate and its steps follow each root's adapter (Priority: P1)

An operator declares an SDD per repo: no top-level `sdd:`, and
`repos.web.sdd: speckit`. The scaffold runs in web and `doctor` reports web as
speckit. Then `change plan` passes with no spec and no constitution,
`change new` prints no step, and flow.md says no SDD is declared, while web's
door says the lifecycle refuses. In a mixed ecosystem (`sdd: opsx`,
`repos.web.sdd: speckit`) the gate asks web for an OpenSpec proposal and never
sees the spec that is there.

**Why this priority**: the gate is the only thing that makes declaring an SDD
mean anything, and today a per-repo declaration turns it off without a word.

**Independent Test**: in a scratch ecosystem with that config and no spec in
web, run `change plan` and see it refuse, naming web and the speckit artifact.
Add the spec and see it pass.

**Acceptance Scenarios**:

1. **Given** no top-level `sdd:` and `repos.web.sdd: speckit` with web on disk,
   **When** `change plan <slug>` runs with no spec in web, **Then** it refuses,
   naming the speckit step, its artifact and web as the root it looked in.
2. **Given** the same config, **When** `change new <slug>` runs, **Then** it
   prints speckit's steps for that point.
3. **Given** `sdd: opsx` and `repos.web.sdd: speckit`, **When** the gate runs,
   **Then** web is judged by speckit's artifacts only, and the brain by opsx's
   only.
4. **Given** the same mixed config, **When** flow.md is projected, **Then** it
   lists both adapters' rows, and each row names the roots it applies to.
5. **Given** a config with only a top-level `sdd:` and no repo override,
   **When** any lifecycle point runs or flow.md is projected, **Then** the
   output is byte-identical to today's.

---

### User Story 2 - `none` means no adapter, for both kinds (Priority: P1)

An operator marks a repo `grapher: none`, which the configuration page says
means "do not graph this repo". `doctor` answers `grapher "none" is not
verified` with the fields to declare, `doors` prints the same notice, and the
refresh at `change close` takes the same path. A repo marked `sdd: none` still proves a step: a spec written
there satisfies `change plan`. A top-level `sdd: none` puts "Features gate
through the `none` SDD … REFUSES" into the door.

**Why this priority**: an opt-out that reads as a misconfiguration teaches
people to ignore the notice, and one that still proves steps is a hole in the
gate.

**Independent Test**: declare `none` for each kind, at repo and top level. Run
`doctor`, `doors`, `change plan` and `change close`, and find no notice,
unverified line, block or proof coming from a `none` root.

**Acceptance Scenarios**:

1. **Given** `repos.web.grapher: none`, **When** `doctor`, `doors` or
   `change close` runs, **Then** nothing calls `none` unverified, nothing is
   built or refreshed in web, and `doctor` reports web as out of scope, not a
   gap.
2. **Given** `repos.web.sdd: none` and a spec for the slug in web only,
   **When** `change plan` runs, **Then** the spec proves nothing and the gate
   refuses, naming the roots it looked in, which exclude web.
3. **Given** a top-level `sdd: none` or `grapher: none`, **When** doors and
   flow.md are projected, **Then** no door carries a block naming `none`, and
   flow.md says no adapter of that kind applies.
4. **Given** a top-level `none` and a repo whose own entry names an adapter,
   **When** anything resolves that repo, **Then** it gets its own adapter.
5. **Given** a `graphers:` entry named `none`, **When** the config loads,
   **Then** it is refused by name, because the token cannot also be a tool.

---

### User Story 3 - The brain reads its own entry (Priority: P2)

In a brain that is its own code repo, the operator sets
`repos.brain.grapher: codegraph` under `grapher: graphify`. The brain is still
graphed, gated and described as graphify. With no top-level grapher,
`repos.brain.grapher: graphify` builds nothing, gates nothing and leaves the
graph block out of the brain door. The SDD side reads the brain's entry for
the scaffold and `doctor`, and nowhere else.

**Why this priority**: every other repo's override works. The brain's is
silently dropped, and only in a brain==code ecosystem.

**Independent Test**: with each of those two configs, read the brain door,
flow.md and `doctor`, and run the graph gate. Each one names the brain's own
grapher.

**Acceptance Scenarios**:

1. **Given** `grapher: graphify` and `repos.brain.grapher: codegraph`, **When**
   the brain's graph is built, refreshed, gated, reported or rendered, **Then**
   codegraph is the grapher every time.
2. **Given** no top-level grapher and `repos.brain.grapher: graphify`, **When**
   `change close` runs in a brain with no graph, **Then** the build-where-missing
   pass and the graph gate both act on the brain.
3. **Given** `repos.brain.sdd: none` under `sdd: speckit` with a sibling repo
   on speckit, **When** the brain door is projected, **Then** it carries no SDD
   block, and the printed steps and flow.md still name speckit for the sibling.
4. **Given** a brain with no entry of its own, **When** anything resolves the
   brain, **Then** it gets the ecosystem's adapter, as today.

---

### User Story 4 - `init --grapher` refuses a name it cannot honour (Priority: P2)

An operator types `init --grapher graphfy`. It exits 0, writes
`grapher: graphfy`, says nothing, and projects a door with no graph block.
`init --sdd speckti` already exits 2. MV-114's ceiling says the grapher flag is
checked against the registry, and the comment above the `--sdd` check says it
is checked once the config is read. Neither check exists.

**Why this priority**: the typo lands in a committed config and silently turns
off a gate the operator asked for, and the law states a check that does not
exist.

**Independent Test**: run `init --grapher graphfy` into a directory that does
not exist and find exit 2 with nothing created. Then declare `graphers.mytool`
in an existing config and find `init --grapher mytool` accepted.

**Acceptance Scenarios**:

1. **Given** a target with no config, **When** `init --grapher <name>` names a
   grapher that is not verified, **Then** it exits 2 and names the verified
   graphers, before creating the directory, a git repository, `.multivac` or
   anything else.
2. **Given** a config already at the target that declares `graphers.<name>`,
   **When** `init --grapher <name>` runs, **Then** the name is accepted and the
   run behaves as it does today for a name the config agrees with.
3. **Given** a config at the target that declares no such grapher, **When**
   `init --grapher <name>` names an unverified tool, **Then** it exits 2,
   names the verified graphers and the ones the config declares, and writes
   nothing.
4. **Given** `init --grapher none` or `init --sdd none`, **When** either runs,
   **Then** it is refused as an unknown name, exit 2. Leaving the flag out is
   how init declares no adapter.
5. **Given** MV-114, the init source and the command reference, **When** they
   are read, **Then** none claims a check that does not run, and MV-114 carries
   an inline note naming MV-122 that withdraws its ceiling clause.

---

### User Story 5 - One reader, and the law says so (Priority: P3)

A maintainer adding a surface that acts on an adapter reads MV-122 and learns
that one function answers "which adapter applies here", which roots it
answers for, what `none` means, and which pass is scoped how, together with
what the legs can and cannot catch.

**Why this priority**: twelve functions got here one at a time, and without
the row the thirteenth will too.

**Independent Test**: read MV-122 and the rows it amends. Then, in a scratch
copy with MV-122 active, reintroduce a direct read of `grapher:` in a door
renderer and confirm a leg turns red.

**Acceptance Scenarios**:

1. **Given** MV-122, **When** it is read, **Then** it states the rule, the
   measured evidence and its ceilings in about 400 words or fewer.
2. **Given** MV-50, MV-56, MV-59, MV-87 and MV-90, **When** they are read, **Then**
   each carries an inline note dated 2026-09-14, naming MV-122, at the clause
   it changes.
3. **Given** MV-122 while this change is open, **When** the law is verified,
   **Then** a broken leg reports as pending and blocks nothing.
4. **Given** the three-state policy helpers that nothing calls, **When** the
   source is searched, **Then** they are gone, along with the tests that only
   exercised them.

---

### Edge Cases

- A root resolving to an adapter name nobody knows is reported under that
  name, once per name, as today. It is never judged by another adapter's
  artifacts.
- In a mixed ecosystem, a lifecycle point asks every adapter in scope for its
  own proof, each in its own roots, including adapters whose repos the change
  never touches. That is a ceiling, and `--no-sdd` skips it for one run.
  Scoping proof to the repos a change names is a later change.
- Within one adapter, the MV-113 rule is unchanged, applied only among the
  roots resolving to that adapter: the first root holding any hit decides, and
  several hits there refuse.
- Declared-but-absent repos: the doors, flow.md and printed steps render from
  declarations, so they include them. Runs, gates and `doctor` still act only
  on repos present on disk (MV-87, MV-93). When no present root resolves an
  adapter that a declared root does, the SDD gate refuses and names those
  roots, because nothing can be searched (MV-90's rule for a gate that cannot
  be evaluated).
- A config that cannot be read keeps MV-114's refusal. `init --grapher` does
  not judge a name against a vocabulary it cannot read, and that refusal still
  comes after the directory is created, as MV-114's ceiling states.
- A brain still in the legacy layout is judged the same way: its config is
  read for the vocabulary before init moves anything, so a typo is never
  accepted just because the check ran before the move.
- `grapher_auto: false` with no root resolving a grapher is silence. There is
  no "gate off" line about a gate nothing declared.
- An unverified grapher name that is not `none` keeps MV-59's notice at every
  surface.
- `init` comparing a flag with the config (MV-91) is not resolution, and it
  stays as it is.
- The ritual seed offers its spec line only when some root resolves an SDD.
- Tests that need a vendor binary use stubs on a constructed PATH, never the
  host's.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Which adapter of a kind applies to a root MUST be decided by one
  rule in one place: the repo's own `sdd:` or `grapher:` first, the
  ecosystem's otherwise. For the brain root, the declared entry whose path is
  the brain counts as its own. No other code may read those keys to decide it.
- **FR-002**: `none`, at repo or top level, MUST resolve to no adapter for
  both kinds. A `none` root is never scaffolded, built, refreshed or gated,
  never proves a step, never renders a block, and is never reported as unknown
  or unverified. `doctor` reports it as out of scope, not a gap.
- **FR-003**: A `graphers:` entry named `none` MUST be refused by name when
  the config loads.
- **FR-004**: At every lifecycle point, the SDD gate MUST judge each adapter
  resolved by an in-scope root with that adapter's own steps, ledger,
  validator and install hint, only in the roots resolving to it. A refusal
  names the adapter, the artifact and those roots. An adapter that only
  declared repos not on disk resolve cannot be judged, so it MUST refuse,
  naming them, rather than pass with no line under a door that says it
  refuses.
- **FR-005**: A lifecycle point MUST pass only when every in-scope adapter's
  evaluation passes.
- **FR-006**: The project-document pass MUST ask each root about its own
  adapter's document, where that adapter is installed.
- **FR-007**: The steps printed at a lifecycle point MUST cover each adapter
  resolved by the brain or any declared repo. When more than one adapter
  resolves, each adapter's lines MUST name the roots they apply to.
- **FR-008**: The brain door and each consumer door MUST render the adapters
  resolved for that root, and the post-edit refresh wired into a root MUST be
  that root's grapher.
- **FR-009**: flow.md MUST render every adapter resolved by any declared root,
  naming the roots each row applies to whenever roots resolve differently. It
  MAY say no adapter of a kind is declared only when no root resolves one.
- **FR-010**: The graph build, the refresh at close, the graph gate, the
  tracked gate and `doctor` MUST use the per-root resolution, including the
  brain's own entry.
- **FR-011**: A config naming only top-level adapters, or none, with no repo
  override and no brain entry adapter, MUST produce the same output from every
  surface as before this change.
- **FR-012**: `init --grapher <name>` MUST be accepted only when the name is a
  verified grapher or is declared under `graphers:` in a readable config
  already at the target. Otherwise it MUST exit 2, naming the verified and
  declared names, before creating anything. `none` is not a name. When a
  config is present but unreadable, MV-114's refusal stands and the name is
  not judged.
- **FR-013**: MV-114 MUST carry an inline note naming MV-122 that withdraws its
  `--grapher` ceiling clause and states the measured fact. The init source
  comment and the command reference MUST stop claiming a check that does not
  run, or accepting "any tool name" for the flag.
- **FR-014**: MV-50, MV-56, MV-59, MV-87 and MV-90 MUST each carry an inline
  note naming MV-122 where their rule changes: the grapher each root is
  refreshed with, the roots a step is looked for in, `none` not being a name,
  `none` for both kinds with the brain's own entry, and the brain root's
  grapher. Legs that name replaced expressions MUST move
  in the same change.
- **FR-015**: MV-122 MUST replace the reserved row with the rule, the evidence
  and the ceilings in about 400 words or fewer, authority `specified`, state
  `proposed`. Its legs MUST pin the single resolver, and pin the absence of
  direct reads wherever a pattern can tell a read from prose.
- **FR-016**: The three-state policy helpers nothing calls MUST be removed,
  together with the tests that only exercised them.
- **FR-017**: No runtime dependency MAY be added. `verify`, `doctor` and
  `doors` MUST stay offline and free of vendor subprocesses (MV-01). Tests MUST
  NOT depend on the host PATH.

### Key Entities

- **Root**: the brain, or one declared repo, named by the key the config gave
  it (`brain` for the brain).
- **Resolved adapter**: for one root and one kind (`sdd` or `grapher`), the
  adapter name that applies there, or none.
- **Surface**: anything that runs, gates, reports or renders an adapter: the
  scaffold, the graph build and refresh, the SDD and graph gates, `doctor`,
  the doors, flow.md, the printed steps and the ritual seed.
- **Grapher vocabulary**: the verified graphers plus the names declared under
  `graphers:` in a readable config.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Functions that read `sdd:` or `grapher:` to decide which adapter
  applies drop from 12 to 1.
- **SC-002**: The five measured defects in the change file each flip in a
  scratch ecosystem: the per-repo SDD gates, a `none` repo proves nothing,
  mixed adapters are judged by their own artifacts, the brain's own grapher is
  used in both configs, and `none` of either kind produces 0 notices, blocks
  or unverified lines.
- **SC-003**: `init --grapher graphfy` exits 2 and creates 0 paths in a target
  that did not exist. `init --grapher mytool` exits 0 when an existing config
  declares `graphers.mytool`.
- **SC-004**: Every existing assertion about a config with only top-level
  adapters passes unchanged. That covers gate lines, printed steps, doors,
  flow.md and `doctor`.
- **SC-005**: `verify --strict` reports 0 blocking failures, and the full test
  suite passes with no test reading the host PATH.
- **SC-006**: 6 of 6 amended rows carry a note naming MV-122. MV-122 stays
  `proposed`, because this change enacts nothing.

## Assumptions

- The measurements come from scratch ecosystems built on 2026-09-14 against
  this repository's build, with no vendor binary on PATH. That the refresh at
  close takes the unverified path for `none` is read from its source, not run.
- The set of roots does not change. Runs, gates and reports act on the brain
  plus declared repos present on disk. Renders act on every declared repo.
  Narrowing proof, build and refresh to the repos a change names is a later
  change, and every requirement here holds under that narrowing.
- In a mixed ecosystem every adapter in scope must pass (FR-005). This matches
  how the project-document pass and the graph gate already treat every root,
  and it asks for more proof than today only where roots resolve to different
  adapters.
- `init` checks the grapher before it creates anything, because the registry's
  names need nothing on disk and a config already at the target needs only a
  read. Moving init's other refusals ahead of `git init` is a later change.
- Looking binaries up before running them, `managed: false`, and DESIGN.md's
  "notice, feature off, exit 0" belong to later changes. Removing the unused
  helpers retires no sentence.
- Rows are amended inline in the table's shape, "Amended 2026-09-14 by
  MV-122", with the WITHDRAWN convention for a retired clause (MV-111,
  MV-120).
