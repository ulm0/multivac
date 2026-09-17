# Feature Specification: The brain keeps its ecosystem's governance graph

**Feature Branch**: `064-ecosystem-graph` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 16 of the 2026-09-14 plan (point 10, decision D12a).

## Context: what was measured

Measured 2026-09-14 in a scratch directory, with graphify 0.9.29.

1. **No graph relates the ecosystem.** The data exists, offline and deterministic: the repos in the config, the law rows, the anchors, and the changes with their landing order. But it is spread across modules. The brain's code graph holds `.multivac/invariants.md` as 2 nodes and no row.
2. **`graphify merge-graphs` is not a way to get it.** It adds no cross-repo edge. It reverses edge direction. It tags by directory name.
3. **graphify can read multivac's own graph.** It reads a node-link JSON through `--graph`, offline and without writing, and `query`, `explain` and `path` all answer over it.
4. **A prototype renderer works.** It read the brain's declarations only and rendered this brain in about 40 ms, 373 nodes and 1148 links. Two runs gave the same bytes.

## User Scenarios & Testing

### US1 - The graph is rendered from declarations only (P1)
1. **Given** a brain, **when** the graph is rendered, **then** it is a directed node-link JSON with these nodes:
   - repo nodes, carrying path, url, role, channel, resolved SDD and grapher, and that repo's own graph artifact;
   - law nodes, carrying id, state, authority and line, never statement text;
   - anchor glob nodes;
   - change nodes, open, planned or archived.
   And these edges: declares, mounts, anchors, in_repo, lands_in, claims, touches, adds, retires, enacted_by.
2. The same inputs give the same bytes.
3. It holds nothing machine-dependent: no presence, sha or fetch age.

### US2 - It is kept where the brain is written (P1)
1. `doors` writes `.multivac/ecosystem.json`.
2. Every lifecycle bookkeeping commit in the brain re-renders it and commits it.
3. `close` puts it in the printed archive commit.
4. `land` commits it on a brain branch, with the graph.

### US3 - Drift is reported (P2)
1. **Given** a file that differs from the rendering, **when** `verify` runs from the brain, **then** it reports the file stale and names `multivac doors`. This never gates.

### US4 - The door names it (P2)
1. Where graphify resolves for the door's root, the door prints the `--graph` form of its query verbs. Otherwise it says the file is plain node-link JSON.

## Requirements
- **FR-001:** One renderer, `src/doors/ecosystem.ts`, with no new dependency.
- **FR-002:** DESIGN's "No native graph, ever" is amended: no native CODE graph, while multivac renders its own declarations.
