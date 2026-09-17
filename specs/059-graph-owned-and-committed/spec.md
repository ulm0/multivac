# Feature Specification: The graph is committed on the change branch, for the repos the change names

**Feature Branch**: `059-graph-owned-and-committed` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 11 of the 2026-09-14 plan (decisions D3a and D7a). A shared graph is committed on the change's branch at `land`, the lifecycle acts on the graph only in the brain and the repos a change names, and `close` no longer leaves a refreshed graph floating.

## Context: what was measured

Measured in this repository on changes 052 to 058 (2026-09-16), with graphify 0.9.29.

1. **Every close left the graph dirty.** `change close` refreshed `graphify-out/graph.json` in the checkout after printing its archive commit, so each close needed a separate hand-made `graph: refresh after closing` commit.
2. **The branch never carried its own graph.** The graph was refreshed and committed in the change worktree by hand before every merge.
3. **The lifecycle wrote in repos a change never named.** The first build, the harness install, both graph gates and the refresh at close reached every declared repo on disk. A close could refuse over a repo it never touched, and a refresh left a modified graph in a repo nobody was working in.
4. **Five derived files were versioned here.** `manifest.json`, `GRAPH_REPORT.md`, `.graphify_labels.json`, its `.sig` and `.graphify_root` sit in git beside `graph.json`, and each refresh modifies them.

## User Scenarios & Testing

### US1 - `land` commits the graph on the change's branch (P1)
1. **Given** a ready repo with a worktree on the change branch and a shared grapher, **when** `change land <slug>` reports, **then** the graph is refreshed in that worktree and, when it changed, committed there by pathspec, before the push line.
2. **Given** the shared artifact is ignored in that repo, **then** `land` names the rule, prints no push line for it, and exits 1.
3. **Given** the worktree is on a detached HEAD, **then** it refuses the same way.
4. **Given** a read-only repo, a local artifact, or no grapher, **then** nothing is refreshed or committed there.

### US2 - The lifecycle's graph work reaches the brain and the named repos only (P1)
1. **Given** a declared repo the change does not name, **when** `new`, `plan`, `apply` or `close` runs, **then** no graph is built, installed, judged or refreshed there.
2. **Given** the same repo, **when** `repos sync` runs, **then** it still gets its first graph.

### US3 - `close` leaves nothing floating (P1)
1. **Given** a close whose refresh changes the brain's shared graph, **then** the printed archive commit carries that path.
2. **Given** a named repo whose refreshed graph changed, **then** close prints the pathspec commit for it.
3. **Given** a change worktree whose only uncommitted file is the shared graph, **then** close restores that file and removes the worktree.

### US4 - multivac versions only graph.json (P2)
1. The other graphify outputs are removed from the index and ignored.

## Requirements
- **FR-001:** `land` refreshes and commits the shared graph on the change branch of each ready repo, by pathspec and through the hooks.
- **FR-002:** An ignored artifact or a detached HEAD is refused by name, with exit 1.
- **FR-003:** `graphScopes` accepts the change's keys. The lifecycle passes them to the build, the harness install, both gates and the close refresh. `repos sync` passes none.
- **FR-004:** `close` refreshes before it prints the archive commit, adds a changed brain graph to that commit, and prints a commit for each named repo whose graph changed.
- **FR-005:** The refresh module still never invokes git.

## Assumptions
- A squash-merged or remote-merged branch leaves the worktree behind; close restores the graph file only when it is the worktree's only change.
- The SDD scaffold keeps its current reach; only the graph work is narrowed.
