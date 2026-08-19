# Feature Specification: Presence is not identity

**Feature Branch**: `presence-is-not-identity`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "A projection must identify its own output before rewriting it, and a runner must identify the tool before executing it. A file that exists, a word that appears in a hook, a `dist/cli.js` that happens to be there — none is proof that this is ours."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A door never eats what the operator wrote (Priority: P1)

An operator keeps their own guidance in `.github/copilot-instructions.md`. They
add `copilot` to `doors:` and run `multivac doors`. The file is replaced
wholesale with multivac's stub, and every later `doors` run replaces it again.

**Why this priority**: it is silent, repeated destruction of user-authored
content, and both the docs and DESIGN promise the opposite — that the managed
block is the only thing multivac owns in a file.

**Independent Test**: write content into that file, run `doors`, and confirm the
content survives with the managed block added.

**Acceptance Scenarios**:

1. **Given** a `.github/copilot-instructions.md` with the operator's prose,
   **When** `doors` runs, **Then** the prose is intact and the managed block is
   added.
2. **Given** the same file with a managed block already in it, **When** `doors`
   runs again, **Then** only the block's contents change.
3. **Given** no such file, **When** `doors` runs, **Then** it is created with
   the frontmatter the format needs, exactly as today.

---

### User Story 2 - The hook runs multivac, or nothing (Priority: P1)

A consumer repo is itself a TypeScript CLI: it builds to `dist/cli.js` and has
`node_modules`. multivac's hook shim tests exactly those two paths, so on every
commit the hook executes **that project's** binary with `verify` as its
argument.

**Why this priority**: it is the tool executing somebody else's program under
its own name, in a pre-commit hook, on the most ordinary Node CLI layout there
is. What that program does with `verify` is not multivac's to predict.

**Independent Test**: create a repo with a `dist/cli.js` that writes a marker
file, install the hooks, commit, and confirm the marker is not written.

**Acceptance Scenarios**:

1. **Given** a repo whose `package.json` does not name multivac, **When** the
   hook runs, **Then** its `dist/cli.js` is not executed.
2. **Given** a repo whose `package.json` does name multivac, **When** the hook
   runs, **Then** the build is used, most-specific-first as MV-92 requires.
3. **Given** neither, **When** the hook runs, **Then** it falls through to the
   declared dependency and then to `mvac` on PATH, unchanged.

---

### User Story 3 - "Armed" means armed (Priority: P1)

A repo's pre-commit hook contains the line `# TODO: wire up multivac`. multivac
reports the hook as running multivac, `doctor --strict` reports the gate as
armed, and nothing runs.

**Why this priority**: it is the tool's own worst failure mode — reporting that
it checked, having checked nothing — and `--strict` exists precisely to be an
assertion rather than a description.

**Independent Test**: put the word in a comment and confirm the hook is reported
as NOT running multivac.

**Acceptance Scenarios**:

1. **Given** a hook mentioning multivac only in a comment, **When** `doctor`
   reports, **Then** it says the hook does not run multivac and prints the line
   to append.
2. **Given** a hook that runs it on a real line, **When** `doctor` reports,
   **Then** it says the hook runs multivac.

---

### User Story 4 - A shim we wrote is a shim we may rewrite (Priority: P2)

An operator sets `strict_pre_push: true` in a repo that uses husky, and runs
`doors`. Nothing changes: the existing shim is multivac's own, but it is
recognised only as "mentions multivac", so it is left alone forever. The strict
gate never arms there, and no later shim fix reaches it either.

**Why this priority**: it is a declared gate that silently never arms — the same
class as US3, one level down, and it also freezes every future shim change out
of a whole family of repos.

**Independent Test**: install alongside, set `strict_pre_push`, run again, and
confirm the pre-push shim now carries `--strict`.

**Acceptance Scenarios**:

1. **Given** an existing shim carrying multivac's own managed header, **When**
   hooks are installed again, **Then** it is regenerated with the current
   arguments.
2. **Given** an existing hook that is somebody else's, **When** hooks are
   installed, **Then** it is refused with the line to append, exactly as today.

---

### User Story 5 - `init` does not undo `doors` (Priority: P2)

`doctor` tells an operator to run `multivac init .`. They do. The strict
pre-push shim `doors` installed becomes a plain one, and the version record
`doors --adopt` is supposed to move is restamped — so MV-86's skew notice
disappears without the adoption it was asking for.

**Why this priority**: both are silent side effects of the command the tool
itself tells people to run.

**Independent Test**: set `strict_pre_push`, run `doors`, then `init .`, and
confirm the shim is still strict and the record is unchanged.

**Acceptance Scenarios**:

1. **Given** a brain whose config sets `strict_pre_push: true`, **When** `init`
   runs again, **Then** the pre-push shim still carries `--strict`.
2. **Given** a brain with an existing `.multivac/projected.yml`, **When** `init`
   runs again, **Then** the record is left exactly as it was.
3. **Given** a brain with no record, **When** `init` runs, **Then** it is
   written, as today.

---

### Edge Cases

- A `package.json` that is unreadable or not JSON: the repo has not proved it
  builds multivac, so the rung is skipped and the next one is tried.
- A hook whose only mention is inside a quoted string on a real line: treated as
  running multivac. The rule is "not in a comment", not a parser — and being
  wrong in that direction costs a false "wired" for a hook somebody wrote on
  purpose, not a silent pass for one nobody wired.
- A managed block that is malformed: the refusal must name the file. Today one
  mangled file aborts a multi-repo run with a message naming none of them.
- A stub door whose file exists but has no managed block: the block is appended,
  the existing content kept.
- A shim carrying multivac's header that somebody has hand-edited: it is
  regenerated, and the edit is lost. That is what the header says — *managed by
  `multivac doors`; regenerate, do not edit* — and the alternative is the defect
  this story exists to fix: a shim frozen at whatever version first wrote it. An
  operator who needs different behaviour has `strict_pre_push`, or a hook of
  their own, which is never rewritten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A projection that writes a tool-owned stub MUST read the existing
  file first and merge its managed block into it, never overwrite it.
- **FR-002**: Frontmatter MUST be written only when the file is created.
- **FR-003**: A runner MUST NOT execute a repo's `dist/cli.js` unless that
  repo's `package.json` names multivac.
- **FR-004**: The shim and its Node mirror MUST agree — both sides of the pair
  apply the same test.
- **FR-005**: "Runs multivac" MUST require the mention on a line that is not a
  comment, and MUST be decided in ONE place read by both the installer and
  `doctor`.
- **FR-006**: An existing hook carrying multivac's own managed header MUST be
  regenerated with the current arguments; a foreign hook MUST still be refused
  with the line to append.
- **FR-007**: `init` MUST install hooks with the strictness the config declares.
- **FR-008**: `init` MUST write `.multivac/projected.yml` only when it is
  absent.
- **FR-009**: A malformed managed block MUST be reported with the path of the
  file it is in.
- **FR-010**: MV-92 MUST state its ceiling: it chooses WHICH code runs, and says
  nothing about whether that code is current.

### Key Entities

- **Ownership marker**: the header multivac writes into every shim it
  generates — the thing that makes a shim identifiably ours.
- **Managed block**: the begin/end delimited region a projection owns inside a
  file it does not own.
- **Runner rung**: one candidate way to execute multivac, tried most-specific
  first (MV-92).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operator content in a stub door file survives an unlimited number
  of `doors` runs.
- **SC-002**: A repo whose `dist/cli.js` is not multivac's never has it executed
  by a multivac hook — measured by a `dist/cli.js` that would leave evidence.
- **SC-003**: A hook mentioning multivac only in a comment is reported as not
  running it, by both the installer and `doctor`.
- **SC-004**: `strict_pre_push` reaches an already-installed multivac shim.
- **SC-005**: `init` run twice leaves both the shim strictness and the version
  record exactly as `doors` left them.
- **SC-006**: A malformed managed block names its file.
- **SC-007**: The existing suite passes, with any test asserting the old
  behaviour updated rather than deleted.

## Assumptions

- A repo that builds multivac declares so in `package.json` — that is how the
  package is published and how this repo is laid out.
- The shim header has been stable and is written by every shim multivac
  generates, so it is a reliable ownership marker for hooks written by any
  version that had it.
- Reading one `package.json` per hook run is affordable: it is one file test on
  a path already being tested.
