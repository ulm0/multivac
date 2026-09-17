# Feature Specification: The project document's state is read one way, asked for without urging, and outranked by the law

**Feature Branch**: `060-constitution-state` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 12 of the 2026-09-14 plan (R4, decisions D9 to D11).

## Context: what was measured

Measured 2026-09-16 with spec-kit 1.0.7 and openspec 1.13.0.

1. **The template test refuses written documents.** The gate, `doctor` and `repos check` decide "still the template" with the pattern `\[[A-Z0-9_]+\]`. A written constitution that cites `[1]` or `[API]`, or keeps the template's HTML comments, matches it and is refused.
2. **spec-kit records its template.** `specify init --here --integration claude --force --ignore-agent-tools` writes `.specify/memory/.constitution-template.json` with the template's sha256. That sha256 is the sha256 of the `constitution.md` it installs. The template carries 20 fill-in tokens, from `[PROJECT_NAME]` to `[LAST_AMENDED_DATE]`.
3. **`change new` never asks for the document.** It prints the per-change steps, each with "run the chain through without asking". It prints nothing about a constitution that is still the template. `change plan` then refuses on it.
4. **flow.md omits the project-document gate.**
5. **openspec has a project context.** `openspec init` writes `openspec/config.yaml` with a commented, optional `context:`. openspec injects it into every artifact and ignores it above 51200 bytes. The registry says openspec has no project-level document.
6. **Nothing says which wins.** Nothing says what happens when a project document and a row of the law disagree.

## User Scenarios & Testing

### US1 - One verdict, measured against the tool's own template (P1)
1. **Given** a constitution byte-identical to the template spec-kit recorded, **then** it is `template`.
2. **Given** a constitution still carrying one of the template's own tokens outside HTML comments, **then** it is `template` and the refusal names the token.
3. **Given** a written constitution that keeps the template's HTML comments, or cites `[1]` or `[API]`, **then** it is `written`.
4. The gate, `doctor` and `repos check` use the same verdict.

### US2 - `change new` asks for the document, with the human (P1)
1. **Given** an installed root whose project document is not written, **when** `change new` runs, **then** it prints the step for that root, without "run the chain through without asking", saying the principles come from the human.

### US3 - flow.md shows the gate (P2)
1. **Given** speckit, **then** flow.md lists `change plan` refusing while the constitution is missing, empty or still the template.

### US4 - openspec's context is reported, never gated (P2)
1. **Given** opsx, **then** `doctor` and `repos check` report `openspec/config.yaml` `context:` as written or missing, and `change plan` never refuses on it.

### US5 - The law outranks a project document (P2)
1. The brain door says that where a project document and an active row disagree, the row wins.

## Requirements
- **FR-001:** `projectDocVerdict(path, doc)` returns missing, empty, template or written, with the reason. Template means the sha256 matches the recorded template, or a declared token remains outside HTML comments.
- **FR-002:** A report-only document (opsx `context:`) is read as a YAML key, is never gated, and is never a failure in `repos check`.
- **FR-003:** `change new` prints one line per installed, writable root whose gated document is not written, with no continue-without-asking suffix.
- **FR-004:** flow.md renders the project-document gate from the registry.
- **FR-005:** The door carries the precedence sentence. A new row states it.

## Assumptions
- A document full of `TBD` passes. That ceiling is stated.
- Who wrote the document stays ungateable.
