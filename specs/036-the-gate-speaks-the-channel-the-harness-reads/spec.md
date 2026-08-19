# Feature Specification: The gate speaks the channel the harness reads

**Feature Branch**: `the-gate-speaks-the-channel-the-harness-reads`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "A red verify must reach the agent. Today the harness hooks deliver nothing, on either event."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A red law reaches the agent after an edit (Priority: P1)

An agent edits a file that breaks a blocking anchor. The `PostToolUse` hook
runs `mvac verify`, which prints its findings to stdout and exits 1. Claude
Code returns exit-2 stderr to the model and nothing else, so the agent sees
nothing, keeps working, and the commit gate refuses much later — or a human
does.

**Why this priority**: it is the product's own thesis — the agent reads the law
at the moment of action — with no delivery path. Every other law improvement is
invisible at the point of use until this exists.

**Independent Test**: run the projected command with a stub `mvac` that prints
to both streams and exits 1; confirm the exit code and which stream carries the
findings.

**Acceptance Scenarios**:

1. **Given** a red `verify` after an edit, **When** the hook runs, **Then** it
   exits 2 and the findings are on stderr.
2. **Given** a green `verify`, **When** the hook runs, **Then** it exits 0 and
   says nothing to the model.
3. **Given** an edit that breaks the config so `verify` cannot load it, **When**
   the hook runs, **Then** that failure reaches the model too.
4. **Given** no runnable `mvac`, **When** the hook runs, **Then** the failure
   reaches the model rather than passing silently.

---

### User Story 2 - Session start carries the law into context (Priority: P1)

A session opens on a brain whose law is red. The `SessionStart` hook runs and
its output is discarded, because Claude Code adds hook stdout to context only
on exit 0 and `verify` exited 1.

**Why this priority**: the first thing an agent should know is what is already
broken. It is also the event where blocking is impossible and would be wrong —
a session that cannot open is a session that cannot repair.

**Acceptance Scenarios**:

1. **Given** a red `verify` at session start, **When** the hook runs, **Then**
   it exits 0 and the findings are on stdout.
2. **Given** any failure at session start, **When** the hook runs, **Then** the
   session still opens.

---

### User Story 3 - An existing brain is upgraded, not duplicated (Priority: P1)

Every brain alive today carries the bare `mvac verify` entry. A `doors` run
must turn it into this event's command, in place.

**Why this priority**: ownership is exact-identity (MV-74). A new command
string that the merge does not recognise as ours means the old entry is left
untouched and the new one appended beside it — two gates, and a duplicate
notice about a mess multivac itself made.

**Acceptance Scenarios**:

1. **Given** a legacy bare entry on either event, **When** `doors` runs,
   **Then** it is rewritten in place, the matcher untouched, and there is one
   entry.
2. **Given** a hook of ours inside a user's own matcher entry, **When** `doors`
   runs, **Then** that entry is upgraded and the user's matcher is untouched.
3. **Given** the projection run twice, **When** the file is compared, **Then**
   it is byte-identical.

---

### Edge Cases

- A user's own hook that happens to run `mvac verify --strict`: not ours, never
  rewritten — identity is the whole string.
- Two legacy entries on one event: both count as ours, and the duplicate notice
  still reports them.
- A harness other than `claude`: none carries a hook config, so none has a read
  side. That is a ceiling, not an omission.
- A brain that never re-runs `doors`: it keeps the mute command, and nothing
  notices. `verify` does not read `.claude/settings.json`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `SessionStart` command MUST deliver `verify`'s output on the
  channel that event carries into context, and MUST NOT fail the session.
- **FR-002**: The `PostToolUse` command MUST deliver `verify`'s output on the
  channel that event returns to the model, and MUST map every failure to the
  exit the harness feeds back.
- **FR-003**: Ownership MUST stay exact-string identity (MV-74), widened to the
  commands multivac has written, so a re-run upgrades rather than appends.
- **FR-004**: A user's matcher, and any hook that is not ours, MUST NOT be
  touched.
- **FR-005**: The projection MUST stay idempotent.
- **FR-006**: The docs that quote these commands MUST quote what is projected.
- **FR-007**: No new runtime dependency, no new CLI surface, and no
  configuration key.

### Key Entities

- **Harness event**: `SessionStart` or `PostToolUse` — each with its own
  contract for what reaches the model.
- **Gate command**: the string projected for one event.
- **Ownership**: the exact set of command strings multivac may rewrite.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With a stub `mvac` that exits 1 printing to both streams, the
  post-edit command exits 2 and its output is on stderr — measured by running
  the projected string, not by reading it.
- **SC-002**: The same stub under the session command exits 0 with output on
  stdout.
- **SC-003**: With no `mvac` on PATH at all, the post-edit command still exits
  2 and says so.
- **SC-004**: A legacy bare entry on either event becomes that event's command,
  with one entry and the matcher unchanged.
- **SC-005**: Running the projection twice is byte-identical.
- **SC-006**: This repository's own `.claude/settings.json` carries the
  projected commands, written by the tool rather than by hand.
- **SC-007**: The suite passes, with tests that asserted the bare command
  updated rather than deleted.

## Assumptions

- Claude Code's contract is as measured: only exit-0 stdout at `SessionStart`,
  only exit-2 stderr at `PostToolUse`, reach the model. This is the vendor
  behaviour the audit recorded and the design re-measured with stubs.
- Blocking after an edit is wanted. The edit is already on disk; the block is a
  forced read in the same turn, not a revert. The owner asked for it.
- Wrapping belongs in the projected command rather than in a new `verify` mode:
  the two events need opposite mappings, so a flag would bake one harness's
  contract into the gate itself.
