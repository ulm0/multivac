# Tasks: The project document is gated on existing

**Input**: [plan.md](plan.md), [spec.md](spec.md)

**Feature**: gate `change plan` on a declared project-level document existing,
being readable, being non-empty, and no longer carrying the tool's own fill-in
tokens — never on its content, never on its age.

Phases are dependency-ordered. Everything inside a phase may be done in any
order; a phase does not start until the one before it is done.

---

## Phase 1 — Law before code (Constitution III)

- [X] **T001** Amend the MV-76 row in `.multivac/invariants.md`, dated
  2026-08-16, to state the mechanism actually built: the `placeholder` fill-in
  tokens the tool asks the author to replace, plus empty and unreadable — NOT
  the whole-file equality MV-65 uses. State why the two artifacts take
  different checks (plan.md's `# Implementation Plan: [FEATURE]` is a line
  spec-kit never asks anyone to change; the constitution's `[ALL_CAPS]` tokens
  are ones it explicitly asks the author to replace) and why whole-file
  equality cannot be reused here (`copiedFrom` fails open by design).
- [X] **T002** Amend the MV-57 row in `.multivac/invariants.md`, dated
  2026-08-16, so the surviving sentence is that the document's CONTENT is never
  machine-judged and the sentence that goes is that its PRESENCE is never
  checked. Keep staleness stated as a report. Keep every existing MV-57 anchor
  leg resolvable — `doctor`'s wording does not change.
- [X] **T003** Amend `.specify/memory/constitution.md`: the Governance
  paragraph claims the document's presence is only reported. Correct it, bump
  to 1.0.1 (PATCH — a wording correction, no principle moved) and update the
  Sync Impact Report, as the amendment procedure requires.

**Done when**: both rows read as what will be built, and no row promises a
mechanism the code will not have.

---

## Phase 2 — The gate

- [X] **T010** In `src/adapters/sdd.ts`, add a project-document pass to
  `sddGate`, beside the ledger pass: for each `projectSteps` entry, when the
  gate point is `plan`, search the SDD roots and refuse when the document is
  missing/unreadable, empty, or still matches its declared `placeholder`.
  Each refusal names the path, the roots searched, the repo it was found in
  where there is one, the exact agent command, and the re-run line. The
  "still the template" refusal is worded distinctly from the "missing" one.
  Depends on T001–T002.
- [X] **T011** Keep the "this lifecycle command is not gated" early return
  honest: a point with no gating step, no ledger step and no project document
  still says so; a point that has only a project document must not.
  Depends on T010.
- [X] **T012** Update the `SddProjectStep` doc comment in
  `src/adapters/registry.ts` — it currently says "nothing ever gates on it".
  It is the sentence MV-57 is losing, in code. Depends on T010.
- [X] **T013** Correct every other place that states the old rule, since a
  paraphrase that says "never a gate" beside a gate is exactly the drift this
  project exists to catch: `src/commands/doctor.ts`'s header comment (its
  OUTPUT must stay byte-identical, and the MV-57 leg pinned to that comment
  moves with it), `skills/multivac/references/change.md`, and
  `site/content/docs/reference/graphers-and-sdd.md`. Re-run `multivac doors`
  so the `.claude/skills` copy stays byte-identical (MV-72). Depends on T010.
- [X] **T014** Make the brain door name what refuses, in
  `src/doors/brain.ts`: the project-law line said CREATE IT IF ABSENT in
  capitals and nothing checked it — the gap this change closes — while every
  per-change step line already carries its `[proof: …]`. Depends on T010.

**Done when**: `pnpm run build` is clean and `change plan` refuses in a repo
with no constitution.

---

## Phase 3 — The tests

Every branch added in Phase 2 ships with a test, in the style of
`test/change/sdd-gates.test.ts`.

- [X] **T020** Repair `speckit: its own longer flow drives the lifecycle`: it
  runs `change plan` under `sdd: speckit` with no constitution on disk, so it
  is now a legitimate refusal. Give it the constitution it should always have
  had, and assert the new gate reports it ok. Depends on T010.
- [X] **T021** New test — `plan refuses while the project document is absent
  or still the template`: absent → refused, naming path, roots and the
  `/speckit.constitution` command; a directory at the path → refused, never a
  crash; the untouched template → refused, worded as still-the-template and
  distinct from absent; empty → refused as empty; a written document → passes.
  Covers FR-001, FR-002, FR-003, FR-004, SC-005. Depends on T010.
- [X] **T022** New test — `a stale project document still reports, never
  gates`: a document older than the law's newest row passes the gate, and the
  off switches (`--no-sdd`, `sdd_auto: false`) and an adapter with no project
  step (`opsx`) are all unaffected. Covers FR-006, FR-007, FR-008.
  Depends on T010.
- [X] **T023** Confirm no other lifecycle point changed and `doctor`'s wording
  is untouched: the existing `doctor` and `sdd-gates` suites pass unmodified
  apart from T020. Covers FR-009, FR-010, SC-003. Depends on T020–T022.

**Done when**: `pnpm test` is green.

---

## Phase 4 — Close the loop

- [X] **T030** Point the MV-76 anchor legs at what was really written: the two
  code lines in `src/adapters/sdd.ts`, the `SddProjectStep` sentence in
  `src/adapters/registry.ts`, and the two test names. The drafted
  `src/commands/change.ts /gateProjectLaw/` leg is dropped — `change.ts` needs
  no edit, since every gate already routes through `sddGate`. Also correct
  this change's own file, which drafted the mechanism as MV-65's whole-file
  equality.
- [X] **T031** `pnpm install --silent && pnpm run build && pnpm test` green,
  then `node dist/cli.js verify --strict` exits 0. Depends on all of the above.
- [X] **T032** Commit on the branch `change apply` created, subject declarative,
  body explaining why the mechanism differs from the drafted one.
  Depends on T031.

---

## Dependency summary

```text
T001 ─┐
T002 ─┼─> T010 ─┬─> T011, T012, T013, T014
T003 ─┘         ├─> T020 ─┐
                ├─> T021 ─┼─> T023 ─> T030 ─> T031 ─> T032
                └─> T022 ─┘
```
