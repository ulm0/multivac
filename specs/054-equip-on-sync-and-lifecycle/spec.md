# Feature Specification: Every command that sets a repo up equips it

**Feature Branch**: `054-equip-on-sync-and-lifecycle`

**Created**: 2026-09-16

**Status**: Draft

**Input**: Requirements 2, 3 and 1 of the 2026-09-14 plan, change 7: SDD and grapher init in all declared repos, and a missing binary fails the command that would run it.

## Context: what was measured

Measured 2026-09-16 on multivac 0.13.0, with `HOME` isolated, spec-kit 1.0.7 and graphify 0.9.29 installed. The setup was a brain declaring `sdd: speckit`, `grapher: graphify` and a sibling repo `api` on disk.

1. **`repos sync` equips nothing.** It fetched both repos, exited 0 and left `api` with no `.specify/` and no `graphify-out/graph.json`.
2. **`change new` finds a missing binary after it has committed.** With `specify` off `PATH`, it committed `change open: demo`, then printed that `specify init` cannot be run in `api`, then printed the steps that need it, and exited 0.
3. **`change plan` and `change apply` equip before they clone.** Their SDD gate calls `runScaffold` and `ensureGraphs` before the clone loop (`src/commands/change.ts`), so a repo cloned or created there is equipped only by the next command.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - `repos sync` equips every repo it can write in (Priority: P1)

**Independent Test**: stub vendors on `PATH`, a declared sibling with neither tool, run `repos sync`, find both installed in the sibling.

**Acceptance Scenarios**:

1. **Given** a declared, writable sibling on disk where the SDD and grapher are missing, **When** `repos sync` runs, **Then** the SDD's recorded init and the graph's first build run there. The same happens for a repo `repos sync` just cloned.
2. **Given** a read-only repo (`managed: false` or shallow), **Then** nothing runs there.
3. **Given** a tool that would run in some repo and cannot be found, **Then** `repos sync` names it with MV-123's line, still equips and syncs everything else, and exits 1.
4. **Given** every tool installed everywhere, **Then** a second `repos sync` runs neither tool.

### User Story 2 - `change new` refuses a tool it would run and cannot find, before it writes (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a declared SDD missing in a repo on disk and its binary absent, **When** `change new` runs, **Then** it exits 1 naming the tool, the repo and where to get it. No change file, no reserved row and no commit are made.
2. **Given** `--no-sdd`, **Then** the SDD is not required. A grapher it would build still is.
3. **Given** the tool installed wherever it is declared, **Then** a missing binary is not a refusal.

### User Story 3 - `change plan` and `change apply` equip what they clone or create (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a declared repo `plan` clones, **When** `plan` finishes, **Then** the SDD and grapher have been run in it.
2. **Given** a greenfield repo `apply` creates, **When** `apply` finishes, **Then** the same.

### Edge Cases

- A repo with no `url:` that is not on disk is not equipped and requires nothing.
- `sdd: none` or `grapher: none` on a repo requires and runs nothing there.
- Sync's `--shallow` clones are read-only, so a CI recipe of `repos sync --shallow && repos check` needs no vendor binary.

## Requirements *(mandatory)*

- **FR-001**: `repos sync` MUST equip, after cloning and fetching, every declared repo on disk that is not read-only, through the same function the lifecycle uses.
- **FR-002**: `repos sync` MUST exit 1 when a tool it would run cannot be found, and MUST NOT stop syncing or equipping the rest.
- **FR-003**: `change new` MUST refuse, with exit 1 and before any write, when a tool the equip step would run cannot be found in any repo on disk.
- **FR-004**: `change plan` MUST equip after its clone loop, and `change apply` after its clone and greenfield loop.
- **FR-005**: One predicate MUST decide which tool runs where, and init, `change new` and `repos sync` MUST all use it.
- **FR-006**: `verify`, `doctor` and `doors` MUST still run no vendor.

## Success Criteria *(mandatory)*

- **SC-001**: One `repos sync` leaves every declared, writable repo on disk with its SDD installed and its graph built.
- **SC-002**: No change is ever committed whose printed steps need a tool the machine does not have.

## Assumptions

- Declaring a tool at ecosystem level is consent to run it in every writable declared repo (decision D2a of 2026-09-14). `managed: false` is the opt-out.
- Committing what the tools write in sibling repos is change 10. Here the files are left in each working tree, as the lifecycle already leaves them.
