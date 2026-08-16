# Feature Specification: The merge keeps what it did not write

**Feature Branch**: `003-the-merge-keeps-what-it-did-not-write`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "The managed settings merge owns only the entry it
wrote: a foreign entry whose command merely mentions the marker is left alone,
hooks array and matcher intact."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A hook the user wrote survives the merge (Priority: P1)

Someone has already configured their agent harness by hand. One of their hook
entries runs the same tool the project installs, but with their own flag, beside
a second command of their own, on a matcher they chose. They then run the
command that projects the project's doors into the repository. Today that run
silently rewrites their entry: their flag disappears, their second command
disappears, and their matcher is replaced. Nothing is printed, and the file they
edited by hand no longer says what they wrote.

**Why this priority**: This is data loss in a file the user owns, caused by a
command whose entire promise is that it preserves what it does not own. Every
other story is a consequence of this one.

**Independent Test**: Start from a settings file containing a hand-written entry
whose command mentions the project's tool with extra arguments, alongside a
second unrelated command and a non-default matcher. Run the projection. The
hand-written entry must come back byte-for-byte: same arguments, same second
command, same matcher.

**Acceptance Scenarios**:

1. **Given** an entry whose only command is the project's tool plus extra
   arguments, **When** the projection runs, **Then** that entry is unchanged and
   the project's own entry is added separately.
2. **Given** an entry that mixes the project's tool with a second, unrelated
   command, **When** the projection runs, **Then** both commands survive in the
   same entry, in the same order.
3. **Given** an entry with a matcher the user chose, **When** the projection
   runs, **Then** the matcher is exactly what the user wrote.
4. **Given** an entry the project itself wrote earlier, **When** the projection
   runs again, **Then** the file is unchanged — re-running still adds nothing.

---

### User Story 2 - The tool's own entry is still kept current (Priority: P1)

The project's post-edit refresh entry embeds a command that comes from the
declared graph tool. When that tool changes, or its command changes, the entry
must be brought up to date rather than duplicated — that is why the merge
updates rather than always appending. The update must reach the one command the
project wrote and nothing else in the same entry.

**Why this priority**: Without it, the fix for Story 1 would be "never update
anything", which turns every change of the declared tool into a stale hook or a
second entry. The two must hold together or the merge is not a merge.

**Independent Test**: Run the projection with one graph tool, then again with a
different one. The refreshing entry must carry the new command, exactly once,
with any commands the user added to that same entry still present.

**Acceptance Scenarios**:

1. **Given** a settings file the project wrote with graph tool A, **When** the
   projection runs with graph tool B, **Then** exactly one refreshing command
   exists and it names B.
2. **Given** the project's refreshing entry with a user's own command added
   beside it, **When** the projection updates the refreshing command, **Then**
   the user's command is still there, unchanged.
3. **Given** the project's refreshing entry, **When** the projection runs with no
   graph tool declared, **Then** the refreshing command is removed and any
   sibling command in that entry survives, in an entry that survives with it.

---

### User Story 3 - A repository already damaged by the old behaviour is told, not silently edited (Priority: P2)

Repositories that ran the old projection may now hold two entries that both run
the project's check: the foreign entry the old code claimed and overwrote, and
the project's own entry further down the same list. The check therefore runs
twice on every edit. Running the fixed projection must make that state visible to
the person who can judge it, and must not resolve it by deleting an entry.

**Why this priority**: It affects only repositories that already ran the broken
version, and the check running twice is wasteful rather than wrong. It ranks
below correctness but above nothing, because a silent double-run is exactly the
kind of thing nobody ever notices.

**Independent Test**: Start from a settings file holding two entries that both
carry the project's check command. Run the projection. The output names the
duplication and the event it is in; the file still holds both entries.

**Acceptance Scenarios**:

1. **Given** two entries in one event that both carry the project's check
   command, **When** the projection runs, **Then** a notice names the event and
   the number of copies, and the file still contains both.
2. **Given** the notice, **When** the reader follows it, **Then** it says the
   duplicate must be removed by hand and why the tool will not remove it.
3. **Given** a settings file with exactly one copy, **When** the projection runs,
   **Then** no duplication notice is printed.

---

### Edge Cases

- **A command that merely starts with the project's command.** The project's
  check command followed by a flag of the user's is the user's hook, not the
  project's. It must not be claimed. The same goes for a command that contains
  the project's command anywhere inside it.
- **A user who typed the project's command exactly.** Byte-identical to what the
  project writes, so it is indistinguishable from the project's own entry and is
  treated as the project's. Nothing is lost: the update writes back the same
  bytes, and neither the entry's matcher nor its sibling commands are touched.
- **The event list holds entries that are not objects, or objects with no
  commands.** They are skipped, never claimed, never rewritten.
- **A hook object carrying fields the project does not write** (for example a
  timeout). Updating the project's command must not drop them.
- **The event key exists but is not a list.** Already refused with a message that
  says to fix it by hand; that behaviour is retained.
- **The refreshing entry is the only member of its entry and the graph tool goes
  away.** The now-empty entry is dropped; an entry that still holds a user's
  command is kept.
- **More than two copies.** The notice reports the real count.
- **The removal path finds several of the project's own refreshing commands.**
  All of them are removed, because that command is machine-generated and cannot
  have been typed by a person.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The merge MUST identify the entry it owns by a string the project
  itself writes, matched exactly — never by testing whether a foreign command
  merely contains that string.
- **FR-002**: The check hook MUST be identified by its whole command being equal
  to the command the project writes. A command with anything appended, prepended
  or inserted MUST NOT be claimed.
- **FR-003**: The refresh hook MUST be identified by the leading portion the
  project generates verbatim — the portion naming the coalescing lock under the
  project's own cache directory — because its tail carries the declared graph
  tool's command and changes when that tool changes.
- **FR-004**: An update MUST rewrite only the command of the hook it owns. Sibling
  hooks in the same entry MUST be left in place and in order, and any other field
  on the owned hook MUST be preserved.
- **FR-005**: An update MUST NOT write the entry's matcher. A matcher is written
  once, when the project creates its own entry, and is never rewritten
  afterwards.
- **FR-006**: When the project owns no hook in an event, it MUST append a new
  entry rather than modify an existing one.
- **FR-007**: The merge MUST remain idempotent: running it twice over its own
  output MUST produce identical bytes.
- **FR-008**: When more than one hook in one event satisfies the check hook's
  identity, the merge MUST report the event and the number of copies and MUST NOT
  delete any of them.
- **FR-009**: The duplication report MUST reach the person running the projection
  through the same notice channel the command already uses for settings problems.
- **FR-010**: When no graph tool is declared or its binary is absent, the merge
  MUST remove every hook it owns for the refresh, and MUST remove the containing
  entry only when that entry has no hooks left.
- **FR-011**: The published documentation describing this merge MUST state the
  ownership rule, so that what the tool claims to preserve and what it preserves
  are the same sentence.
- **FR-012**: The law row describing the merge MUST say that it preserves foreign
  entries, not only foreign keys, and the new row MUST be anchored to the code
  and tests that make it true.

### Key Entities

- **Event list** — the ordered list of entries under one harness event
  (`SessionStart`, `PostToolUse`). Order is the user's; the project only appends.
- **Entry** — one object in an event list: an optional matcher plus an ordered
  list of hooks. An entry may be the user's, the project's, or shared.
- **Hook** — one object inside an entry carrying a command. This, not the entry,
  is the unit of ownership.
- **Identity string** — the exact text the project writes into a command and
  recognises again. There are two, one per hook the project installs.

## Success Criteria *(mandatory)*

- **SC-001**: Given a hand-written entry containing the project's tool name with
  extra arguments, a second command and a custom matcher, running the projection
  twice leaves that entry byte-identical to how the user wrote it — 0 characters
  changed.
- **SC-002**: After a projection run over a file the project already wrote, the
  number of hooks running the project's check in any single event is exactly the
  number that were there before — the merge adds a second copy in 0 cases.
- **SC-003**: Changing the declared graph tool and re-running leaves exactly 1
  refreshing command, and it names the new tool.
- **SC-004**: A settings file carrying a duplicate produced by the old behaviour
  yields exactly 1 notice naming the event, and the file still holds both entries
  afterwards.
- **SC-005**: The project's own checks pass and complete in under one second, and
  the law row for this behaviour resolves against the code.

## Assumptions

- The harness reads its settings file as JSON with an object at the top level and
  a list per event; that contract is unchanged by this feature and is already
  enforced with its own messages.
- A command byte-identical to the one the project writes is the project's. There
  is no way to distinguish it from the project's own, and treating it as foreign
  would produce a second identical hook on every run.
- Rewriting a matcher is not needed to keep the project's hook correct. If the
  set of edit tools the project matches on ever changes, existing installations
  keep the matcher they have; that is accepted here and is not part of this
  feature.
- The person running the projection reads its notices. The duplicate report is
  delivered there rather than as a failure, because a duplicated hook is wasteful
  rather than unsafe and the tool refuses to delete a hook entry it did not
  provably write.
