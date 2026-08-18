# Feature Specification: The CLI is parsed by citty

**Feature Branch**: `the-cli-is-parsed-by-citty`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Why are we hand-rolling the CLI? Let's redo it with citty."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nothing a user types behaves differently (Priority: P1)

An operator upgrades and runs the commands they always run. Every flag, every
positional, every refusal and every exit code is what it was.

**Why this priority**: this is a change of implementation, not of behaviour. A
parser swap that quietly changes what a flag means, or what an unknown one does,
is the worst possible outcome — it is invisible until someone's script breaks.

**Independent Test**: run the whole existing suite unchanged. It calls every
command with real argument lists.

**Acceptance Scenarios**:

1. **Given** any command and any declared argument list, **When** it runs,
   **Then** the parsed values are what they were before.
2. **Given** an undeclared flag or an extra positional, **When** any command is
   run, **Then** it is refused with the command's own words and exit 2, before
   anything else happens.
3. **Given** `--help` or `-h` anywhere in the arguments, **When** any command is
   run, **Then** the dispatcher answers it before the command runs, exactly as
   today.

---

### User Story 2 - A command declares its arguments once (Priority: P1)

A maintainer adds a flag. Today that means editing the parse loop and the
declared surface, in two places, and nothing notices when they drift.

**Why this priority**: it is the only reason to take the dependency. If the
declaration is still written twice, the change bought nothing.

**Independent Test**: add a flag to any command by editing one declaration, and
confirm both the parse and the refusal follow.

**Acceptance Scenarios**:

1. **Given** a command's argument declaration, **When** the refusal decides what
   is undeclared, **Then** it reads that same declaration.
2. **Given** the same declaration, **When** values are parsed, **Then** the
   parser reads it too.

---

### Edge Cases

- A boolean the parser would negate with a `--no-` prefix: undeclared, so it is
  refused before the parser is reached. The declared surface stays the surface.
- A flag's value that looks like a positional (`--repo --strict`): the value is
  consumed as a value, as today.
- A command with no arguments at all: refuses everything and parses nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every command MUST declare its arguments exactly once, as data.
- **FR-002**: The refusal for an undeclared flag or positional MUST read that
  same declaration, MUST run before any parsing or side effect, and MUST keep
  its current wording and exit code.
- **FR-003**: Parsed values MUST be identical to today's for every declared
  argument form, including `--flag value` and `--flag=value`.
- **FR-004**: `--help` and `-h` MUST stay the dispatcher's answer, and the usage
  text MUST stay each command's own declaration (MV-69).
- **FR-005**: The runtime dependency count MUST be stated truthfully wherever it
  is pinned — the law row and the constitution — and the new dependency MUST
  itself carry no dependencies.
- **FR-006**: The published tarball MUST still carry the tool and nothing else.
- **FR-007**: The law row governing this MUST land in the same change; MV-02 and
  MV-85 MUST be amended in place rather than contradicted.

### Key Entities

- **The declaration**: what a command takes, as data. One object per command,
  read by the refusal and by the parser.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The existing test suite passes unchanged — no test's arguments or
  expectations are edited to accommodate the parser.
- **SC-002**: Adding a flag to a command touches exactly one declaration.
- **SC-003**: No command's output, exit code or refusal wording changes.
- **SC-004**: The installed dependency tree grows by exactly one package.

## Assumptions

- citty parses; it does not decide. Its silence about undeclared arguments is
  documented behaviour, not a bug to report, and the refusal in front of it is
  what makes the pair correct.
- The usage text stays hand-written. A generated one would say less than the
  prose these commands carry, and the site documents the current output.
- The dependency count is law because transitive weight is what it guards. Three
  is not two, and the row says so with a number rather than a feeling.
