# Feature Specification: core.hooksPath is read the way git reads it

**Feature Branch**: `004-core-hookspath-is-read-the-way-git-reads-it`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "core.hooksPath is read the way git reads it:
absolute as-is, relative against the worktree root, one resolution for install
and doctor"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A repository whose hook directory is named absolutely gets a gate that actually runs (Priority: P1)

A maintainer has pointed their version control at a hook directory using a full
path from the root of the machine, which is a spelling their version control
accepts and uses as given. They then run the project's set-up command. Today the
set-up reports that it installed its check into that directory, and nothing is
there: the files were written into a directory built by pasting the full path
onto the end of the repository's own path, producing a tree inside the
repository named after the machine's filesystem. The commit that follows is not
checked, and nothing said so.

**Why this priority**: The whole value of the product is that a check runs
before a commit. A check that reports itself installed and is not installed is
worse than no check at all, because the maintainer stops looking. Every other
story in this feature is a narrower case of this one.

**Independent Test**: Configure a repository's hook directory as a full path
outside the repository, run the set-up, and look only in the configured
directory. The check files must be there, be runnable, and run the project's
verification. No directory named after any part of the full path may exist
inside the repository.

**Acceptance Scenarios**:

1. **Given** a repository whose hook directory setting is a full path to a
   directory outside it, **When** the set-up runs, **Then** the check files
   appear in that directory and nowhere else, and the setting is left as the
   maintainer wrote it.
2. **Given** the same repository, **When** the set-up runs, **Then** the notice
   naming the directory names the directory the files are actually in.
3. **Given** a repository whose hook directory setting is a plain name relative
   to the repository, **When** the set-up runs, **Then** the files appear in
   that directory inside the repository, exactly as before this feature.
4. **Given** either spelling, **When** the check file is run the way version
   control runs it, **Then** it locates the repository and runs the project's
   verification.

---

### User Story 2 - A checkout that inherited the hook directory of another checkout is reported honestly (Priority: P1)

A contributor makes a second working copy of a repository. The second copy
inherits the first copy's configuration, in which the hook directory is written
as a full path to the first copy's own project-managed hook directory. Running
the project's report in the second copy today lists both check files as
**missing** from a directory they are sitting in, and the strict form of the
report fails a checkout whose gate is in fact armed.

**Why this priority**: This is the shape that surfaced the defect, it is the one
every contributor to this project hits, and a report that cries wolf is trained
away exactly as fast as a report that stays silent.

**Independent Test**: Make a second working copy whose hook directory setting is
a full path naming a directory that contains the project's check files. Run the
report. It must say the checks run the project, not that they are missing, and
the strict form must not fail for that reason.

**Acceptance Scenarios**:

1. **Given** a hook directory named by a full path that holds the project's
   check files, **When** the report runs, **Then** it states that the checks run
   the project and names that directory.
2. **Given** the same, **When** the strict report runs and something can run the
   checks, **Then** it does not fail on the ground that a check is missing.
3. **Given** a hook directory named by a full path that holds a check the
   project did not write, **When** the report runs, **Then** it warns about that
   file and prints the exact line to add, as it does for a relative spelling.

---

### User Story 3 - The project's own hook directory is recognised whichever way it is spelled (Priority: P2)

A maintainer sets the hook directory to a full path that names the project's own
managed hook directory in that same repository — the same directory the project
would have chosen itself, written the long way. Today the project treats that as
somebody else's gate and coexists with it instead of owning it, which means the
chaining behaviour the project provides for a repository's pre-existing checks
never engages.

**Why this priority**: It is a correctness gap rather than a disarm — the checks
still end up in the right directory once Story 1 lands — so it ranks below the
two stories where a commit goes unchecked or a report lies. It is in scope
because the identity test and the path resolution are the same computation, and
leaving one half unfixed would keep the two halves able to disagree.

**Independent Test**: Set the hook directory to the full path of the project's
own managed directory in the same repository, run the set-up, and check which
arrangement it reports. It must report the arrangement it reports when the
setting is written the short way.

**Acceptance Scenarios**:

1. **Given** the hook directory set to the full path of the project's own
   directory in that repository, **When** the set-up runs, **Then** it reports
   the same arrangement as the equivalent short spelling and the checks chain
   the repository's own pre-existing check.
2. **Given** the same, **When** the report runs, **Then** it reports the
   directory as the project's own rather than as a foreign gate.

---

### Edge Cases

- The configured directory does not exist yet. The set-up creates it, at the
  resolved location, as it already does for a relative name.
- The configured directory lies outside the repository. The files are written
  there anyway, because that is where version control will look; the notice
  names the full path, so the maintainer can see that the project wrote outside
  the repository.
- The configured name is taken by a check the project did not write. Unchanged:
  the file is not touched and the refusal carries the exact line to add. Only
  the directory the project looks in changes.
- The configured name is taken by a check that already runs the project. Also
  unchanged: it is left alone and reported as already wired.
- A hook manager that claims the setting only when it installs. Unchanged: the
  setting is left unset and the checks go where that manager will look.
- A repository carrying the configuration file of a check framework the project
  already detects, with or without that framework installed, and with or without
  its check file present. Unchanged in every combination; the arrangement is
  decided after the directory is resolved, never before.
- The setting is absent. Unchanged: the project takes the directory.
- The setting names the project's own directory using a full path belonging to a
  *different* working copy. That is a foreign directory by this feature's rule,
  because it is not the directory this working copy manages; the project
  coexists with it and reports what is actually in it. This is the honest answer
  the report could not give before, and it is the extent of what is claimed —
  nothing here models how a check file in another working copy resolves its own
  location at run time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST resolve the configured hook directory the way
  version control resolves it: a value that starts from the root of the
  filesystem names that directory as given; any other value is resolved against
  the root of the working copy.
- **FR-002**: The system MUST write its check files into the resolved directory,
  and MUST NOT construct a target by appending a full path to the working copy's
  path.
- **FR-003**: The system MUST read its check files, when reporting, from the
  same resolved directory it writes them to. The resolution MUST be one
  computation shared by the set-up and the report, so the two cannot disagree
  about which directory version control will use.
- **FR-004**: The system MUST treat the configured directory as its own when,
  and only when, it resolves to the directory this working copy manages —
  regardless of how it was spelled.
- **FR-005**: The system MUST NOT change the configured value when it resolves
  to a directory the system does not manage.
- **FR-006**: The system's verdict on whether the gate is armed MUST be computed
  from the resolved directory, so that a checkout whose checks are present and
  runnable is not reported as disarmed, and a checkout whose checks are absent
  from the directory version control will use is.
- **FR-007**: Every arrangement the system already distinguishes — a
  pre-existing check chained first, a hook manager that claims the setting on
  install, a framework configuration with or without its binary, a taken name
  refused with the line to add, a name already running the project — MUST behave
  exactly as before for a directory named the relative way, and MUST behave the
  same way for the same directory named the absolute way.
- **FR-008**: The stated law MUST describe the resolution rule and MUST NOT
  claim the check is installed where the resolution says it is not; the
  behaviour and the law MUST land together.

### Key Entities

- **Configured hook directory** — the value the repository's configuration
  carries, in either spelling. Its text is the maintainer's; the project reads
  it and never rewrites it while it names a directory the project does not
  manage.
- **Resolved hook directory** — the single directory that value denotes, which
  is the directory version control will run checks from, the directory the
  set-up writes into, and the directory the report reads.
- **Managed hook directory** — the directory this working copy's project owns.
  Identity with it is decided after resolution, not by comparing text.

## Success Criteria *(mandatory)*

- **SC-001**: With the hook directory configured as a full path outside the
  repository, a set-up run leaves exactly 2 runnable check files in that
  directory and creates 0 directories inside the repository named after any
  segment of that path.
- **SC-002**: With the hook directory configured as a full path holding the
  project's checks, the report names 0 checks as missing, and the strict report
  raises 0 failures whenever something can run them.
- **SC-003**: The same repository configured with the relative spelling and with
  the absolute spelling of the same directory produces the same reported
  arrangement in 100% of the arrangements the project distinguishes.
- **SC-004**: Reverting the resolution in the source makes at least 1 named
  check fail, for each behaviour this feature claims — a claim with no failing
  check behind it is not claimed.
- **SC-005**: The project's whole check suite passes and the strict form of its
  own verification exits 0, with the law row for this behaviour resolving
  against the code.

## Assumptions

- Version control resolves a relative hook directory against the root of the
  working copy. This is what its documented behaviour states — it moves to the
  root of the working copy before running a check — and it is what the current
  behaviour already assumes for relative values; this feature keeps that half
  and fixes the other half.
- A directory that is the same directory is the same gate, whatever the spelling.
  Identity is decided by resolving both sides and comparing, not by following
  links or comparing filesystem identifiers; a path reached through a symbolic
  link is out of scope here and is not claimed.
- Writing into a configured directory outside the repository is correct rather
  than surprising: the maintainer named that directory as the one their version
  control runs checks from, and refusing to write there would leave the gate
  disarmed for the exact reason this feature exists.
- The report's model of what a check file will do at run time is unchanged.
  Reporting is about presence, ownership and whether anything can run the
  checks; nothing here claims a check file placed in another working copy's
  directory resolves that other copy or this one at run time, because that is
  not tested.
- No new report line is needed. The defect was that the report read the wrong
  directory, so correcting the directory makes the existing wording true; adding
  a sentence would be new surface with no failure behind it.
