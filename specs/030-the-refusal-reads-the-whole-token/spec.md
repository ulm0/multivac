# Feature Specification: The refusal reads the whole token

**Feature Branch**: `the-refusal-reads-the-whole-token`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "A valued flag must be declared once and accepted in both written forms, `--repo api` and `--repo=api`, and refused when its value is missing or is itself a flag. Every command must read that one refusal, `change` included."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The equals form works again (Priority: P1)

An operator on 0.8.0 wrote `mvac init --provider=claude` in a script, in a
README, or in their shell history. They upgrade to 0.9.0 and the same line is
refused with exit 2.

**Why this priority**: it is a regression in a published release, it is silent
about being one — the message says the flag is unknown, when the flag is
declared — and it is the first command a new user runs.

**Independent Test**: run `init`, `verify`, `roadmap` and `change` with each
valued flag written both ways and confirm both forms are accepted and parse to
the same value.

**Acceptance Scenarios**:

1. **Given** a declared valued flag, **When** it is written `--name=value`,
   **Then** the command runs and the parsed value is `value`.
2. **Given** the same flag written `--name value`, **When** the command runs,
   **Then** the parsed value is identical to the equals form.
3. **Given** an undeclared flag written `--nope=1`, **When** any command is run,
   **Then** it is refused naming `--nope=1`, with exit 2, before any side
   effect.

---

### User Story 2 - A flag cannot eat the next flag (Priority: P1)

An operator means to run `mvac verify --strict` in a repo and types
`mvac verify --repo --strict`. Today `--repo` swallows `--strict` as its value:
the run is not strict, nothing is refused, and the exit code says the gate
passed.

**Why this priority**: it is `doctor --sttrict` — the defect MV-85 exists to end
— reintroduced inside the guard that ends it. A gate that reports it checked,
having checked less than it was asked to, is this project's own worst failure
mode.

**Independent Test**: run every command's valued flags with a flag-shaped next
token, and with no next token at all, and confirm both are refused.

**Acceptance Scenarios**:

1. **Given** a declared valued flag followed by a token beginning with `-`,
   **When** the command is run, **Then** it is refused naming the flag that is
   missing its value, with exit 2.
2. **Given** a declared valued flag as the last token, **When** the command is
   run, **Then** it is refused on the same ground and with the same exit code.
3. **Given** `--name=-value`, **When** the command is run, **Then** it is
   accepted: the value is inside the token and nothing was swallowed.

---

### User Story 3 - `change` refuses what every other command refuses (Priority: P1)

An operator runs `mvac change land points-expire api`, meaning to record `api`
as merged. The command exits 0 having recorded nothing: the surplus positional
is dropped in silence, in the one command that mutates the lifecycle record.
`change land points-expire -landed api` does the same.

**Why this priority**: `change` is the product verb. Its own comment, MV-85's
row and the exit table in the reference all promise a refusal it does not
perform, and the failure is invisible — the operator believes a landing was
recorded.

**Independent Test**: call every `change` subcommand with a surplus positional
and with a single-dash flag, and confirm the refusal and exit 2.

**Acceptance Scenarios**:

1. **Given** a `change` subcommand and more positionals than it declares,
   **When** it is run, **Then** it is refused naming the unexpected argument,
   with exit 2, before the change file is read or written.
2. **Given** a single-dash token such as `-landed`, **When** `change` is run,
   **Then** it is refused as an unknown flag rather than dropped.
3. **Given** `--no-sdd` or `--no-grapher`, **When** `change` is run, **Then**
   they keep working exactly as today.
4. **Given** `change new "<title>"` and `change new <slug> "<title>"`, **When**
   either is run, **Then** both stay legal.

---

### Edge Cases

- `--flag=` with an empty value: the token names a declared flag, so it is
  accepted and the parser decides what an empty value means. The refusal is
  about the surface, not about validation.
- A declared boolean written `--strict=false`: the name is declared, so it is
  accepted; the parser owns the negation.
- `--` on its own: it names no declared flag, so it is refused, as today.
- A value that legitimately begins with `-`: no command has one. Where a future
  one does, the equals form is the way to write it, and that is why the equals
  form is fixed in the same pass.
- Spec 029 recorded the swallow as intended — *"a flag's value that looks like a
  positional: the value is consumed as a value, as today"*. This change reverses
  that decision deliberately: preserving a behaviour is not the same as
  endorsing it, and the behaviour preserved was MV-85's own defect.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A token of the form `--name=value` MUST be matched against the
  declared surface by its name, not by the whole token.
- **FR-002**: A declared valued flag whose value is missing, or whose value is
  a token beginning with `-`, MUST be refused, naming the flag, with exit 2 and
  before any side effect.
- **FR-003**: A valued flag written `--name value` and `--name=value` MUST parse
  to the same value in every command that declares one.
- **FR-004**: Every command MUST reach the one shared refusal. No command may
  keep a private, narrower check.
- **FR-005**: `change` MUST refuse a surplus positional and a single-dash token,
  and MUST keep `--no-sdd`, `--no-grapher`, `change new "<title>"` and
  `change new <slug> "<title>"` working unchanged.
- **FR-006**: Refusal wording MUST stay each command's own, and refusals MUST
  keep exit 2 (MV-69, MV-85).
- **FR-007**: The change MUST add no runtime dependency and MUST be a net
  deletion of source lines.

### Key Entities

- **Declared surface**: the flags, valued flags and positional count a command
  states once, as data, and which both the parser and the refusal read.
- **Token**: one element of the argument vector, which may carry a flag name and
  its value together.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every valued flag in the CLI is accepted in both written forms —
  measured by a test that walks the command registry rather than a typed list.
- **SC-002**: No command line that names a declared flag is refused as unknown.
- **SC-003**: `verify --repo --strict` exits 2 instead of running a non-strict
  verify that reports success.
- **SC-004**: `change land <slug> api` exits 2 having written nothing, and the
  refusal names the argument.
- **SC-005**: The source is smaller after the change than before it.
- **SC-006**: The existing suite passes unchanged except where it asserted one
  of the three defects.

## Assumptions

- No command has, or will shortly have, a legitimate value beginning with `-`;
  where one appears, the equals form covers it.
- The refusal continues to run before the parser, per MV-104 — this change makes
  the refusal see more of the token, never less, and never delegates.
- `--help`/`-h` remain the dispatcher's answer and never reach a command.
- The one shared refusal keeps its optional per-command wording argument, so
  each command's sentence survives (MV-69).
