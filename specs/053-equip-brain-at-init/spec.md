# Feature Specification: init equips the brain it scaffolds

**Feature Branch**: `053-equip-brain-at-init`

**Created**: 2026-09-16

**Status**: Draft

**Input**: Requirements 1–3 and 6 of the 2026-09-14 plan (`internal/requirements-2026-09-14/report.md`, change 6): "`npx multivac@latest init --provider claude --sdd speckit --grapher graphify` does not initialise spec-kit or build the graph"; check binaries at init and fail pointing at the vendor; the SDD and grapher files get committed.

## Context: what was measured

Measured 2026-09-16 against multivac 0.12.0, with `HOME` isolated:

1. **A declared SDD and grapher leave nothing behind.** In a fresh git repo,
   `init --sdd speckit --grapher graphify --quiet .` exits 0 and creates neither
   `.specify/` nor `graphify-out/`. The result is the same with `specify` and
   `graphify` on `PATH` and with `PATH=/usr/bin:/bin`.
2. **The tools exist, but only the change lifecycle calls them.** `runScaffold`
   (`src/adapters/sdd.ts`) runs the vendor's own init where the probe finds it
   missing. `ensureGraphs` (`src/adapters/refresh.ts`) builds a graph where none
   exists. Both are called only from `change` (`gateSdd` in
   `src/commands/change.ts`). MV-51 says the scaffold "runs only from `change`".
3. **A missing binary is found out late.** Without the binary, init exits 0.
   The first lifecycle command then warns per repo, after the brain, its config
   and its door already exist.
4. **Step zero sweeps the user's own work in.** init ends with
   `0. commit what was just written: git add -A && git commit -m "multivac init"`.
   In a brain==code repo with uncommitted work, that commit takes the work along
   with multivac's files.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Declaring the tools at init installs them in the brain (Priority: P1)

A person runs `init --sdd speckit --grapher graphify`. When it finishes, the
brain has spec-kit initialised (its state file says so) and a graph built, and
the next lifecycle command has nothing to install first.

**Independent Test**: stub `specify` and `graphify` on `PATH`, run init, find
`.specify/integration.json` and `graphify-out/graph.json`.

**Acceptance Scenarios**:

1. **Given** a repo where spec-kit has never run and `specify` is found, **When**
   `init --sdd speckit` runs, **Then** the vendor's own init runs once in the
   brain and init reports it scaffolded.
2. **Given** a repo with no graph and `graphify` found, **When**
   `init --grapher graphify` runs, **Then** the first build runs in the brain and
   the graph exists afterwards.
3. **Given** a brain where both are already installed, **When** init runs
   again, **Then** neither tool runs.
4. **Given** `sdd_auto: false` in a kept config, **When** init runs, **Then** the
   SDD init does not run, exactly as in the lifecycle.
5. **Given** an adapter with no recorded init (opsx), or an unverified grapher,
   **When** init runs, **Then** nothing is executed for it, and the same line
   the lifecycle prints says so.

### User Story 2 - A tool init would run and cannot find is refused before anything is written (Priority: P1)

**Independent Test**: `PATH=/usr/bin:/bin`, run `init --sdd speckit`, observe
exit 1, the vendor's repository named, and no `.multivac/` and no `.git/`
created.

**Acceptance Scenarios**:

1. **Given** `--sdd speckit` and no `specify` found, **When** init runs,
   **Then** it exits 1 and names the binary, the install line and the vendor's
   repository. Nothing is created: no `.git` where there was none, and no
   `.multivac`.
2. **Given** `--grapher graphify` and no `graphify` found, **Then** the same.
3. **Given** a binary init would not run, because the tool is already installed,
   has no recorded init, or `sdd_auto` is false, **When** it is missing,
   **Then** init does not refuse.
4. **Given** a re-run whose kept config declares the tool, **Then** the check is
   the same as for a flag.

### User Story 3 - Step zero commits what init wrote, and only that (Priority: P1)

**Independent Test**: a brain==code repo with an uncommitted edit to a tracked
file and an untracked file of the user's. After init, step zero's pathspec names
neither of them and does name `.multivac`, `AGENTS.md`, the vendor's shared
files and the graph.

**Acceptance Scenarios**:

1. **Given** uncommitted user work, **When** init prints step zero, **Then** the
   command is `git add -- <paths init wrote> && git commit`. It never uses `-A`,
   and the user's paths are not in it.
2. **Given** a vendor path declared `local` (`.specify/feature.json`,
   `graphify-out/**` apart from `graph.json`), **Then** it is not in the pathspec.

### Edge Cases

- A binary that exists only in the brain's `node_modules/.bin` counts as found
  (MV-123's lookup).
- A tool that exits 0 and writes no state file is reported the way the lifecycle
  reports it, and init's exit code is unchanged: the brain exists, and the next
  `change` re-tries.
- `--quiet` does not hide a refusal or a failed tool.

## Requirements *(mandatory)*

- **FR-001**: init MUST run the declared SDD's recorded init in the brain when
  the vendor's state probe reports it missing and `sdd_auto` is on, using the
  same function the lifecycle uses.
- **FR-002**: init MUST build the declared grapher's graph in the brain when the
  probe reports none, using the same function the lifecycle uses.
- **FR-003**: Before writing anything, init MUST look up, with MV-123's lookup,
  the required binaries of each tool FR-001 or FR-002 would run. If one is
  missing, init MUST exit 1 with MV-123's missing-binary line.
- **FR-004**: FR-003 MUST NOT refuse over a tool init would not run.
- **FR-005**: Step zero MUST name exactly the paths init created or changed,
  minus each resolved adapter's `local` paths that are not also `shared` by
  literal path, and MUST NOT use `git add -A`.
- **FR-006**: The rule that the scaffold runs "only from `change`" MUST be
  amended at every copy (MV-111), and `verify`, `doctor` and `doors` MUST still
  never run it.

## Success Criteria *(mandatory)*

- **SC-001**: `init --sdd speckit --grapher graphify` with both tools available
  leaves an installed spec-kit and a graph in the brain in one command.
- **SC-002**: With a required tool missing, init leaves the directory as it
  found it and exits 1 naming where to get the tool.
- **SC-003**: Running step zero verbatim never commits a path init did not write.

## Assumptions

- Only the brain is equipped here. `repos sync` and the lifecycle equipping
  sibling repos is change 7. init equips whatever `runScaffold` and `ensureGraphs`
  already reach, which on a fresh brain is the brain alone.
- The harness project install (`graphify install --project`) and the
  door→integration map are change 8.
- Writing ignore lines for vendor-local files is change 10. Step zero leaves
  those files out; it does not ignore them.
