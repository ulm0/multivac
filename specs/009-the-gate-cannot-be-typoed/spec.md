# Feature Specification: The gate cannot be typoed

**Feature Branch**: `the-gate-cannot-be-typoed`

**Created**: 2026-08-17

**Status**: Draft

**Input**: "Three commands swallow any unknown flag and exit 0. Fix it per your judgement."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A typo in CI does not go green (Priority: P1)

Someone writes `mvac doctor --sttrict` in a pipeline. Today the command runs
without the strict assertion, reports what it found, and exits 0. The pipeline
is green and the enforcement gate was never asserted to be armed. Nothing on
the screen says the flag was not understood.

After this change the command refuses, names the flag it did not recognise,
prints what it does take, and exits non-zero.

**Why this priority**: `doctor --strict` exists precisely to be an assertion
rather than a report. A typo silently downgrading an assertion to a report is
the tool telling you it checked when it did not — the exact failure the project
exists to prevent, committed by the project.

**Independent Test**: run each command with an argument it does not declare and
observe a refusal that names the argument, plus a non-zero exit.

**Acceptance Scenarios**:

1. **Given** `mvac doctor --sttrict`, **When** it runs, **Then** it refuses,
   names `--sttrict`, and exits 2 without producing a report.
2. **Given** `mvac doctor --strict`, **When** it runs, **Then** it behaves
   exactly as before.
3. **Given** any command and an argument it does not declare, **When** it runs,
   **Then** it exits 2 — the same code the reference already documents for a
   usage error.

---

### User Story 2 - A directory you named is not silently ignored (Priority: P1)

Someone runs `mvac doctor /path/to/other-repo`. Today the path is discarded and
the report describes the working directory instead. The output is a truthful
report about a repository the reader did not ask about, with nothing marking the
substitution.

**Why this priority**: equal to the flag case and the same defect. A wrong
answer that looks like a right answer is worse than a refusal, and here the
reader has no way to notice.

**Independent Test**: pass a positional argument to a command that declares
none; it refuses rather than proceeding on the working directory.

**Acceptance Scenarios**:

1. **Given** `mvac doctor /some/path`, **When** it runs, **Then** it refuses and
   names the argument, rather than reporting on the working directory.
2. **Given** `mvac seed /some/path`, **When** it runs, **Then** it proceeds —
   `seed` declares `[dir]` and that argument is understood.

---

### User Story 3 - The tenth command cannot forget (Priority: P2)

Someone adds a command. Its argv handling is written by hand, like the nine
before it. Three of those nine forgot to refuse an unknown argument; there is no
reason to expect the tenth author to remember.

**Why this priority**: P2 because it prevents the next occurrence rather than
fixing the current one, and P2 rather than P3 because the current occurrence is
evidence the mechanism is needed — this is not a hypothetical.

**Independent Test**: the check walks the command registry rather than a
hand-written list, so a command added without the refusal fails it.

**Acceptance Scenarios**:

1. **Given** a command added to the registry with no argument checking, **When**
   the project's tests run, **Then** they fail and name that command.

---

### Edge Cases

- **A flag that takes a value** (`--repo <key>`, `--landed <repo>`, `--provider
  a,b`). The value must not be mistaken for an unexpected positional.
- **`--help` and `-h`** are answered by the dispatcher before a command runs, so
  a command never sees them and must not need to know about them.
- **A positional that begins with `-`** — a path or a regex. Not currently
  reachable in any command's surface, and the rule must not silently mangle one:
  what a command declares is what decides.
- **The refusal must precede every side effect.** A command that refuses after
  writing files has still written them. `init`, `doors` and `seed` all write.
- **`count`'s first positional is a quoted anchor spec**, not a path, and can
  contain almost anything. It must keep working unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every command MUST refuse an argument it does not declare —
  whether that argument looks like a flag or a positional — and MUST NOT proceed.
- **FR-002**: The refusal MUST name the offending argument and MUST state what
  the command does accept.
- **FR-003**: The refusal MUST exit with the code the reference already
  documents for usage errors, so that the documented matrix becomes true rather
  than being rewritten to match the code.
- **FR-004**: The refusal MUST happen before any side effect — no file written,
  no repository read, no subprocess spawned.
- **FR-005**: Every argument a command declares MUST continue to be accepted,
  with behaviour unchanged.
- **FR-006**: A flag that takes a value MUST NOT have its value treated as an
  unexpected argument.
- **FR-007**: The check MUST be enforced across the whole command registry by a
  mechanism that covers commands added later without anyone remembering.
- **FR-008**: The rule MUST be stated as law and anchored, so a regression is
  refused by the verification the project already runs on every commit.

### Key Entities

- **Declared surface**: the arguments a command states it takes — already
  written down, because MV-69 requires every command to declare its own usage.
- **Undeclared argument**: anything else on the command line.
- **Usage refusal**: a message naming the argument, the accepted surface, and a
  non-zero exit, emitted before the command does anything.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All nine commands exit with the documented usage code when given
  an undeclared argument. Measured for every command, not a sample.
- **SC-002**: `mvac doctor --sttrict` produces no report and exits non-zero.
  Before this change it produced a full report and exited 0.
- **SC-003**: Every flag each command declares still works, with output
  unchanged from before the change.
- **SC-004**: A command added to the registry without argument checking fails
  the project's tests, and the failure names it.
- **SC-005**: No command writes a file, reads a repository or spawns a process
  before refusing.
- **SC-006**: The documented exit matrix and the measured exit codes agree for
  every command — the table is made true rather than edited.

## Assumptions

- The documented matrix is the intended contract and the code is what is wrong.
  Where they disagree, the code moves. Rewriting the reference to describe the
  inconsistency would put the inconsistency in the law's own documentation.
- `doctor` and `doors` genuinely take no directory argument. Adding one is a
  feature and belongs to its own change; this one refuses what is undeclared and
  does not extend any surface.
- Commands that already refuse correctly are left alone. Rewriting five working
  argv loops for uniformity would be a large diff with regression risk and no
  behaviour change; the law states the behaviour, and a test enforces it
  regardless of how each command implements it.
