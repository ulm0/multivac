# Feature Specification: multivac keeps no code graph

**Feature Branch**: `081-drop-graphers` | **Created**: 2026-10-02 | **Status**: Draft
**Input**: User description: "Drop graphers altogether. From the tool: no `grapher:` or `graphers:` config, no registry entry, no install or equip of a grapher vendor in `init`, `repos sync` or `change apply`, no door line or verb, no post-edit refresh hook, no hook-guard handling, no graph commit at `change land`, no graph gate at `change close` (`--no-grapher` goes), no per-worktree index, no `codegraph.json` or `.graphifyignore` writer, no `info/exclude` line, no `--graph` or `its index:` line in apply, no telemetry disclosure. From this repository: `graphify-out/`, `.graphifyignore`, the `## graphify` section, `.claude/CLAUDE.md`'s line, the projected graphify skills, the hook-guard and the refresh hook, the `.gitignore` lines, `grapher: graphify` — and whatever else turns up. Old configs keep loading: `verify` and `doctor` print one line saying the key is ignored and how to remove it; `doors` removes the hooks multivac itself wrote, by its own marks; vendor files stay, `doctor` prints their removal; never delete a file multivac did not write. `.multivac/ecosystem.json` goes too: its renderer, every line telling agents to query it, every leg naming it. The work runs as change drop-graphers; the human runs every lifecycle command. Adds MV-153."

## User Scenarios & Testing *(mandatory)*

<!-- US1–US3 are P1: the removal, the upgrade path that makes the removal safe for every brain an earlier release equipped, and the law that changes first. US4 and US5 are this repository's own setup and its documents; US6 writes the measured saving and loss into MV-153. Every figure below was measured on 41e52c5 (0.15.0) and on a prototype in scratch (research.md), and is re-measured on the change's tree (FR-042). -->

### User Story 1 - The tool builds, refreshes, gates, commits and names no graph (Priority: P1) 🎯 MVP

A maintainer upgrades multivac. Nothing in it concerns a code graph any more: no adapter kind,
no registry entry, no config key it acts on, no flag, no door line, no hook, no gate, no lifecycle
step, no committed or rendered artifact. At 0.15.0 graphers held 3,594 of 19,665 source lines —
four modules whole and parts of 23 more — and 171 of 987 tests; every edit in a graphify brain
ran a refresh that rebuilt a 2.2 MB graph in the background (5.8–6.0 s, 191 MB), `change apply`
on a codegraph brain took three times as long as with none, and a door declaring a grapher spent
747 to 2,276 bytes on it.

**Why this priority**: it is the decision; everything else makes it safe or says it.

**Independent Test**: build the change; render every door shape; run `init`, `doors`, `repos
sync`, `change new/plan/apply/land/close` in scratch ecosystems declaring graphify, codegraph or
nothing; nothing builds, refreshes, indexes, gates, commits, renders or names a graph, and the
source names neither vendor outside the record of what was dropped.

**Acceptance Scenarios**:

1. **Given** the new build, **When** the registry is listed, **Then** it holds harness and SDD entries only, and no entry has a grapher field.
2. **Given** any configuration, **When** `init`, `repos sync`, `change plan` or `change apply` equips a root, **Then** it installs or scaffolds the declared SDD and nothing else, and prints no graph line.
3. **Given** `init --grapher graphify` or `change close slug --no-grapher`, **When** run, **Then** each is refused as an unknown flag with exit 2, before anything is written.
4. **Given** any configuration, old keys included, **When** `doors` or `init` renders the brain door, a consumer door and `.multivac/flow.md`, **Then** none carries a graph line, a grapher verb, `--graph`, `its index:` or `.multivac/ecosystem.json`, and `.claude/settings.json` gets the verify gate and no refresh hook.
5. **Given** a change in a brain or repo an earlier release graphed, **When** `apply`, `land` and `close` run, **Then** apply builds no index and writes no `info/exclude` line, land commits no graph, and close runs no graph gate and no refresh, and its archive commit names neither a graph nor `.multivac/ecosystem.json`.
6. **Given** the package, **When** packed, **Then** it ships no module that builds, refreshes or renders a graph.

### User Story 2 - A brain an earlier release equipped upgrades, is told once, and gets back only what multivac wrote (Priority: P1)

A brain that declared `grapher: graphify` (or codegraph, or `graphers:`) upgrades. Its config
still loads — even a value 0.15.0 refused, like `grapher_auto: maybe`. `verify` and `doctor` each
print one line naming the keys as ignored and how to delete them; the config is invariant, so
the line names the change that deleting them needs. `doors` takes back what multivac itself wrote:
the post-edit refresh hook, known by the lock preamble it always began with, and
`.multivac/ecosystem.json`. What the vendors wrote — their output, ignore file, skills, door
section and hooks — stays; `doctor` names it per checkout with the vendor's own removal, printed
and never run, and the door says in one line, where a vendor's skill or hooks remain, that its
graph is no longer refreshed.

**Why this priority**: without it the upgrade breaks every equipped brain or leaves hooks that
rebuild a graph nothing reads.

**Independent Test**: in scratch, equip a brain with 0.15.0 and graphify (claude and agents
installs), and an ecosystem with codegraph and speckit; upgrade to the new build; run `verify`,
`verify --quiet`, `doctor`, `doors`; follow `doctor`'s recipe; commit with a change open.

**Acceptance Scenarios**:

1. **Given** a config declaring `grapher`, `grapher_auto: maybe`, `graphers: { none: {}, x: { bogus: 1 } }` and `repos.web.grapher`, **When** any command loads it, **Then** it loads, and the keys change nothing.
2. **Given** that brain, **When** `verify` runs in the brain checkout, **Then** it prints exactly one `config` line naming the keys in FR-013's order, as ignored, with how to delete them; `verify --quiet` carries it as one clause of its one line; the exit code is what it would be without the keys.
3. **Given** a consumer repo's `verify` reading that brain through its mount, **When** it runs, **Then** it says nothing about the brain's keys.
4. **Given** that brain, **When** `doctor` runs, **Then** it prints the same one `config` line and one `leftover` line per vendor per root it may write in, with the removal; its exit code does not change.
5. **Given** `.claude/settings.json` holding the verify gate, multivac's refresh hook in an entry shared with a human's command, graphify's two `hook-guard` hooks and a hook a human edited past the preamble, **When** `doors` runs, **Then** only the refresh hook goes, the shared entry stays with the human's command, every other hook is byte-identical, and one notice says how many were removed; a second `doors` says nothing about it.
6. **Given** a brain holding `.multivac/ecosystem.json`, **When** `doors` runs, **Then** it removes the file and says once to commit the removal; where there is none it says nothing.
7. **Given** graphify's claude install beside the door, **When** the door is rendered, **Then** it carries one line saying graphify's own skills and hooks still send agents to a graph multivac no longer refreshes, and that `doctor` prints their removal; with no vendor install there, no such line.
8. **Given** the printed recipe followed, **When** the removal is committed with a change open for the config edit, **Then** the hooks pass it on any branch (the paths are not code), and `doctor` prints the config line alone until the key is deleted.

### User Story 3 - The law changes first, and every commit on the way passes main's gate (Priority: P1)

The law names a graph in 54 rows. Before any code goes, MV-153 states the new rule with
its measurements; fourteen rows retire with dated leads and tombstones; thirty-four rows get a
dated note at their end withdrawing only the sentences that became false, quoted as written; six
rows that name a graph in another sense, or as history, stay. Every commit on the change branch
passes the pre-commit gate of main's 0.15.0 binary, so each tombstone and each moved blocking leg
lands with the edit that greens it.

**Why this priority**: Constitution III — the law changes before the code; and a branch that
cannot commit cannot land.

**Independent Test**: dry-run every new and moved leg with `node dist/cli.js count` on the base
and on the change's tree; run `verify --strict --check` after each phase; read every note against
its row.

**Acceptance Scenarios**:

1. **Given** the law at the change's base, **When** every row naming a graph word is listed, **Then** each is retired, amended or kept, with its reason, and no other row changes.
2. **Given** a retired row, **When** read, **Then** it carries `RETIRED 2026-10-02 by MV-153` and keeps its statement as history; its kept `absent` legs and its new tombstone are 0; a leg over a deleted file is gone.
3. **Given** an amended row, **When** read, **Then** its note is the last sentence of its statement, `**Amended 2026-10-02 by MV-153**: …`, and every sentence it withdraws is quoted as the row states it.
4. **Given** any commit on the branch, **When** main's pre-commit runs `verify`, **Then** no blocking leg is broken or vacuous.
5. **Given** the finished tree, **When** `verify --strict --check` runs with the new build, **Then** it exits 0 with MV-153's thirty legs green.

### User Story 4 - This repository drops its own graphify setup, last, without breaking a hook (Priority: P2)

This brain is equipped by graphify: a 2,198,534-byte committed graph, an ignore file, graphify's
section in the door, `.claude/CLAUDE.md`, two projected graphify skills (twenty files), a search
and a read guard on every tool call, a refresh hook on every edit, seven `.gitignore` lines and
`grapher: graphify`. The session's hooks are main's until the merge, and the refresh hook
rebuilds main's tracked graph when an edited checkout holds none; so the setup goes in the last
commit, through the vendor's own uninstall and the new build's `doors`.

**Why this priority**: the tool is its own first user; a brain that keeps graphify's setup keeps
paying for a graph nothing refreshes.

**Independent Test**: on the finished branch, `git ls-files` names nothing of graphify, the
setup leg is 0, the session door is the 2,638-byte rendering, and main's tree was never left dirty.

**Acceptance Scenarios**:

1. **Given** the worktree before the last commit, **When** graphify's `claude` and `agents` uninstalls run, **Then** its door section, `.claude/CLAUDE.md`, both skill trees and its `PreToolUse` hooks go, and the empty list left behind is deleted.
2. **Given** that tree, **When** `.graphifyignore`, the graph `.gitignore` lines and `grapher: graphify` go and the new build's `doors` runs, **Then** the refresh hook and `.multivac/ecosystem.json` are gone, `AGENTS.md`, `.multivac/flow.md` and the skill copy are re-rendered, and the verify gate stays.
3. **Given** `graphify-out/graph.json` removed in that same last commit, **When** no Edit or Write tool touches a file afterwards, **Then** main's tracked graph is never rebuilt by the refresh hook during the change.
4. **Given** the merge, **When** the human pulls main, **Then** the steps to remove the 25 MB of untracked outputs and to restart the session are printed in quickstart.md.

### User Story 5 - The documents, the site and the skill describe the tool as it is (Priority: P2)

Twenty-five documents outside the history name a grapher; the reference page alone 335 times. Each says what the tool
does now; the reference page becomes `sdd.md` with an alias for the old URL; site pages name no
vendor, no rendered file and no law ID; the skill names no grapher in both copies; DESIGN replaces
"No native code graph, ever" with a dated subsection; the CHANGELOG's Unreleased entry starts
with what to read before upgrading.

**Why this priority**: every stale sentence is an instruction an agent or a reader follows.

**Independent Test**: MV-153's document legs are 0 (and the site's `grapher` count is 1, the
alias); every existing leg on an edited file keeps its count; the site builds and the old URL
resolves.

**Acceptance Scenarios**:

1. **Given** the site, **When** searched, **Then** no page names graphify, codegraph or `.multivac/ecosystem.json`, and "grapher" appears once, in the moved page's alias.
2. **Given** `configuration.md`, **When** read, **Then** it says once that an earlier release's code-graph keys load and are ignored, and that `verify` and `doctor` name them.
3. **Given** both skill copies, **When** compared, **Then** they are byte-identical and name no grapher, graph gate, `--graph` or `.multivac/ecosystem.json`.
4. **Given** the CHANGELOG, **When** read, **Then** its Unreleased entry leads with "read before upgrading", names MV-153, the ignored keys, the refused flags, what `doors` takes back, what `doctor` names, what is saved and what is lost.

### User Story 6 - The saving and the loss are measured and written into the law (Priority: P3)

The row states, measured on the change's own tree, what the change saves (door bytes, hooks per
edit, apply time, package, source and tests) and what it loses (transitive reach), with the
commands that measured each.

**Why this priority**: Constitution II — the tool never claims more than it checked; a removal
justified by unmeasured savings is a claim nobody checks.

**Independent Test**: re-run quickstart.md's W5 and W6 on the final tree; every figure in MV-153
and the CHANGELOG matches within its stated range.

**Acceptance Scenarios**:

1. **Given** the final tree, **When** the measurements are re-run, **Then** MV-153's three slots are filled with the change's own figures and the CHANGELOG's ranges agree.
2. **Given** MV-153, **When** read, **Then** it names what a graph answered that a grep does not, with the measured call.

### Edge Cases

- `repos.<key>.grapher` alone, no top-level key: the line names `repos.web.grapher`.
- Only `graphers:` declared: "graphers ignored"; several keys: "grapher, grapher_auto, graphers ignored — … delete them …".
- A `.claude/settings.json` that is not JSON: left alone, with the existing notice; `doctor` counts no hook of ours in it.
- A refresh hook whose entry holds nothing else: the entry goes; the verify gate's entry stays as it was.
- A hook a human edited past the preamble, or a `graphify update .` they typed: never removed, never counted.
- `.multivac/ecosystem.json` modified by hand: still removed — multivac wrote it, nothing reads it.
- A `*.graphify-bak` copy beside a hook file: named as the human's, kept, and the `*.graphify-bak` `.gitignore` line kept while it exists.
- `codegraph.json` with no `.codegraph/` beside it: the human's, never named.
- A leftover in a read-only repo: not named (multivac may not write there).
- A vendor binary not on PATH: `doctor` prints its removal anyway; it runs nothing.
- Vendor skills found but the graph directory gone: the door line says the skills send agents to a graph that is not here.
- A change opened on 0.15.0 and closed on the new build: no graph gate; a worktree whose tracked graph the old hook rewrote is kept at close, with the command to force it.
- A brain that never declared a grapher: no line anywhere; the door loses only the ecosystem line.
- `init` on a target holding graphify's outputs: the brain-holds-code decision reads tracked and untracked files as before; no graph line.

## Requirements *(mandatory)*

### Functional Requirements

#### The tool keeps no graph (US1)

- **FR-001**: The adapter registry MUST hold no grapher entry, no grapher kind and no field or automation only a grapher used; nothing MUST look a grapher up by name.
- **FR-002**: The loaded configuration MUST carry no grapher setting; the four old keys are read only to be named as ignored (FR-013).
- **FR-003**: `init` MUST take no `--grapher`; it MUST refuse the flag as unknown, exit 2, before writing anything; its usage, detection lines and code-less line MUST name no graph; it MUST equip the declared SDD alone.
- **FR-004**: `repos sync`, `change plan` and `change apply` MUST equip the declared SDD alone and run no vendor's harness install.
- **FR-005**: No brain door, consumer door, `.multivac/flow.md` row, `seed` setup line or `change apply` line MUST name a graph, a grapher verb, `--graph`, `its index:` or `.multivac/ecosystem.json`, and none MUST disclose a grapher's telemetry; the door's only graph-related line is FR-020's.
- **FR-006**: `doors` MUST write no post-edit refresh hook, whatever the config declares; the Claude Code settings merge MUST keep the verify gate as before.
- **FR-007**: No lifecycle step MUST build, refresh, index, gate or commit a graph: no per-worktree index and no `.git/info/exclude` line at apply, no graph commit at land, no graph gate, tracked-graph gate or refresh at close; `change` MUST refuse `--no-grapher` as an unknown flag, exit 2, and list no such flag.
- **FR-008**: No module MUST write a `.graphifyignore`, a `codegraph.json`, a grapher's `.gitignore` line or an `info/exclude` line.
- **FR-009**: No command MUST render `.multivac/ecosystem.json` (not `doors`, `init`, a bookkeeping commit, `land` or `close`); `verify` MUST print no staleness line for it; no archive pathspec or bookkeeping commit MUST name it.
- **FR-010**: `doctor` MUST report no grapher row, graph staleness, out-of-scope line, ignore facts or refresh path; `repos check` MUST ask nothing of a graph.
- **FR-011**: The code gate (MV-137) MUST read no grapher from the registry.
- **FR-012**: The package MUST ship no module that builds, refreshes, gates or renders a graph; `init` MUST keep deciding that a brain holds code from its tracked and untracked files and write `brain: .` for one that does.

#### An old brain upgrades (US2)

- **FR-013**: A config declaring `grapher`, `grapher_auto`, `graphers` or `repos.<key>.grapher` MUST load whatever they hold, never validated, and the keys found MUST be named in a fixed order: `grapher`, `grapher_auto`, `graphers`, then each `repos.<key>.grapher` in config order.
- **FR-014**: `verify` in the brain checkout MUST print exactly one `config` line naming the recorded keys as ignored and how to delete them with a change open (contracts §1); `verify --quiet` MUST carry it as one clause of its one line; a consumer-scoped run MUST NOT print it; it MUST never change an exit code.
- **FR-015**: `doctor` MUST print the same one line, without changing its exit code.
- **FR-016**: `doors` MUST remove, from every Claude Code settings file it merges, each hook whose command begins with the refresh preamble an earlier multivac wrote (`L=.multivac/cache/graph-refresh.lock;`), and an entry only where that leaves it empty; it MUST leave every other hook byte-identical, and print one notice per file with the count, nothing where none.
- **FR-017**: `doors` MUST remove `.multivac/ecosystem.json` from the brain where it exists and say once to commit the removal; nothing where it does not. No other command MUST remove it.
- **FR-018**: `doctor` MUST name a `.multivac/ecosystem.json` still present and each settings file still holding hooks of ours, each with "`multivac doors` removes it".
- **FR-019**: `doctor` MUST print one `leftover` line per vendor per root it may write in (the brain and every declared, present, not read-only repo), naming what graphify 0.9.29's or codegraph 1.6.0's installs left there and the removal: the vendor's own uninstall per platform found (gemini first), the `git rm`/`rm -rf` of the output and ignore file, the `.gitignore` lines to drop; a `*.graphify-bak` copy named as the human's and its `.gitignore` line kept while it exists. It MUST run nothing and never change its exit code.
- **FR-020**: A door (brain or consumer) written where a vendor's own skill (and hooks) are found MUST carry one line saying they still send agents to a graph multivac no longer refreshes, and that `doctor` prints their removal; nowhere else; `init` and `doors` MUST write the same door for the same checkout.
- **FR-021**: Every path those two vendors' installs wrote MUST stay not code in every repo (MV-137), so their removal commits on any branch.
- **FR-022**: multivac MUST delete no file and run no vendor command for a leftover; the refresh hooks of FR-016 and the file of FR-017 are the only things it removes.

#### The law first (US3)

- **FR-023**: MV-153 MUST be written first, `proposed`, dated 2026-10-02, in the house style of MV-146 to MV-152 (measured facts, **The rule.**, **What is mechanical**, **Ceilings.**), replacing the reserved row.
- **FR-024**: MV-50, MV-52, MV-58, MV-59, MV-61, MV-62, MV-90, MV-103, MV-131, MV-134, MV-139, MV-140, MV-148 and MV-149 MUST be retired by the procedure of skills/multivac/references/change.md: a dated lead before "Original claim, kept for history:", state `retired`, authority, date and source kept; non-`absent` legs kept unevaluated; an `absent` leg over a deleted file dropped in the commit that deletes it; every other `absent` leg kept; one tombstone each, added in the commit that greens it.
- **FR-025**: The 34 rows of research.md R14.3 MUST each get one note at the end of the statement, `**Amended 2026-10-02 by MV-153**: …`, withdrawing only sentences that became false, each quoted as the row states it; each moved or dropped leg MUST change in the commit that changes its line.
- **FR-026**: MV-01, MV-38, MV-77, MV-86, MV-97 and MV-142 MUST stay as they are.
- **FR-027**: MV-153's thirty legs MUST each be POSIX ERE, dry-run with `count`, and land with the edit that greens it.
- **FR-028**: Every commit on the change branch MUST pass the pre-commit gate of main's 0.15.0 binary; the final tree MUST pass `verify --strict --check` with the new build.
- **FR-029**: The constitution's Principle V MUST read "one entry per harness or SDD tool"; `CONSTITUTION_VERSION` 3.0.3, Last Amended 2026-10-02, no Sync Impact Report.
- **FR-030**: The change file MUST declare `invariants.touches` (the 34), `adds: [MV-153]`, `retires` (the 14) and `claims: [MV-153]`.

#### This repository's setup (US4)

- **FR-031**: graphify's `claude` and `agents` installs MUST be removed with graphify's own uninstall in the worktree: the `## graphify` section of `AGENTS.md`, `.claude/CLAUDE.md`, `.claude/skills/graphify/**`, `.agents/skills/graphify/**`, both `hook-guard` hooks and the empty `PreToolUse` list they leave.
- **FR-032**: `.graphifyignore`, the graph lines of `.gitignore`, `grapher: graphify` and `graphify-out/graph.json` MUST leave the tree; the refresh hook and `.multivac/ecosystem.json` MUST be removed by the new build's `doors`, which re-renders `AGENTS.md`, `.multivac/flow.md` and the skill copy and keeps the verify gate (MV-112).
- **FR-033**: The setup removal MUST be the last commit; no Edit or Write tool MUST touch a file after it.
- **FR-034**: `package.json`'s `knowledge-graph` keyword and the two issue templates' grapher mentions MUST go.
- **FR-035**: quickstart.md MUST give the human the lifecycle precautions of research.md R9.1 and the post-merge steps (restore main's graph before the pull, `rm -rf graphify-out`, rebuild, new session).

#### Documents (US5)

- **FR-036**: Site pages MUST name no vendor, no `.multivac/ecosystem.json`, no law ID and no version string, and "grapher" only in the moved page's alias; `reference/graphers-and-sdd.md` MUST become `reference/sdd.md` with `aliases: ["/docs/reference/graphers-and-sdd/"]`, and every link to it MUST move.
- **FR-037**: The site pages of research.md R11 MUST describe the tool as it is; `configuration.md` MUST say once that an earlier release's code-graph keys load and are ignored, named by `verify` and `doctor`; every existing leg on an edited file MUST keep its count (research.md R13.4).
- **FR-038**: README, DESIGN and CONTRIBUTING MUST name no grapher; DESIGN's "No native code graph, ever" MUST give way to a dated `### No code graph (2026-10-02)` naming no vendor; the headings MV-152 pins MUST stay.
- **FR-039**: `skills/multivac/**` MUST name no grapher, graph gate, `--graph` or `.multivac/ecosystem.json`; `.claude/skills/multivac/**` MUST be re-projected by `doors`, byte-identical (MV-72); the check that the skill restates no door clause MUST keep covering every door shape that remains.
- **FR-040**: CHANGELOG MUST gain an Unreleased entry that leads with "read before upgrading" and names MV-153, the ignored keys, the refused flags, what `doors` takes back, what `doctor` names, the saving and the loss, and the rows retired and amended.
- **FR-041**: History MUST stay: CHANGELOG's past entries, `specs/**`, `.multivac/changes/archive/**`, docs/audit-2026-08-18.md.

#### Measurements (US6)

- **FR-042**: Every figure MUST be re-measured on the change's tree, before the first edit and after the last (quickstart.md W5, W6): door bytes for this brain, for a consumer door per old grapher and for a brain holding code; hooks per edit and their cost; `change apply` time on an old codegraph config; the package's files and bytes; source lines and tests; and filled into MV-153's three slots and the CHANGELOG.
- **FR-043**: MV-153 and the CHANGELOG MUST state what is lost — transitive reach and multi-hop paths — with the measured call.

#### Tests

- **FR-044**: Tests that assert only a graph MUST go; a test whose title an existing leg reads MUST keep it, or the leg MUST move with the title in the same commit; each behaviour of FR-003, FR-007, FR-012 and FR-013–FR-021 MUST land with a test whose title MV-153 reads.

### Key Entities

- **Dropped key**: a config key an earlier release read — `grapher`, `grapher_auto`, `graphers`, `repos.<key>.grapher`; loaded, recorded, ignored.
- **Refresh hook of ours**: a Claude Code hook command beginning with the lock preamble multivac wrote; the only hook `doors` removes.
- **The ecosystem graph**: `.multivac/ecosystem.json`, rendered by earlier releases, read by nothing; removed by `doors`.
- **Leftover vendor**: what one vendor's earlier install left in one checkout — output directory, ignore file, platforms' skills, sections and hooks, `.gitignore` lines — with its removal recipe.
- **Row disposition**: per law row naming a graph — retire, amend or keep — with its lead or note and the legs that move, drop or stay.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Outside the record of what was dropped, the source names neither vendor, nor `.multivac/ecosystem.json`, nor the refresh lock (MV-153 legs 1–6 at 0), and the fourteen tombstones are 0.
- **SC-002**: A Claude Code session in this brain loads 2,638 bytes of door where it loaded 4,671 (`AGENTS.md` plus `.claude/CLAUDE.md`), ±5%.
- **SC-003**: A consumer door rendered from an old graphify or codegraph config is the size of a door with none (1,137 bytes measured, against 1,884 and 2,293); a brain door holding code, 2,645 against 4,594 and 4,921.
- **SC-004**: Each edit in this brain runs one hook (was two), and each search or read none (was one).
- **SC-005**: `change apply` on an old codegraph config takes no longer than on a config with none, within run-to-run spread (measured 425–590 ms against 592–796; 1,629–2,018 ms before).
- **SC-006**: The package ships three fewer files and at least 15% fewer packed bytes (measured 62 → 59, 288,664 → 230,151).
- **SC-007**: At least 3,000 source lines go net (measured 3,594), and the suite passes with 171 tests deleted and 11 added.
- **SC-008**: An old config holding all four keys, with values 0.15.0 refused, loads; `verify` and `doctor` each print exactly one line about them; every exit code equals the same brain's without the keys.
- **SC-009**: On an old brain, `doors` removes exactly the refresh hooks of ours, leaves every other hook byte-identical, removes `.multivac/ecosystem.json`, and a second run prints neither notice.
- **SC-010**: Following `doctor`'s printed removal in the two walks leaves only the config line; no file multivac did not write changed while multivac ran (checksums before and after).
- **SC-011**: Every commit on the branch passed main's pre-commit; `verify --strict --check` on the final tree exits 0, with MV-153's thirty legs green, fourteen `RETIRED … by MV-153` leads and thirty-four notes.
- **SC-012**: `site/content/**` names neither vendor nor `ecosystem.json`, names "grapher" once, and the old reference URL resolves to the moved page.
- **SC-013**: The two skill copies are byte-identical and lose the graph paragraph and section (≈ 1.3 KB).
- **SC-014**: The CHANGELOG's Unreleased entry names MV-153 and leads with "read before upgrading".
- **SC-015**: The constitution is 3.0.3 with Principle V naming harness and SDD entries, and holds no Sync Impact Report.

## Assumptions

- The human runs every lifecycle command; this change opened at `f156896` with MV-153 reserved, and its worktree is created by `change apply` from main.
- `mvac` on PATH, and so the pre-commit shim, is main's 0.15.0 until the merge (MV-92's ladder); CI runs the new build.
- The vendor facts are those #5 and #6 measured (graphify 0.9.29, codegraph 1.6.0) and this design re-checked; no other grapher is known to have been declared in a brain.
- History is not rewritten: the past CHANGELOG entries, `specs/**` and the archive keep naming graphers.
- No successor navigation feature is added; agents read the tree.
- `docs/audit-2026-08-18.md` is a dated record and stays.
