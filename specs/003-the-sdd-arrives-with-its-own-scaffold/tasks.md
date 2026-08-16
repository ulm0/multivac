# Tasks: The SDD arrives with its own scaffold

**Input**: [plan.md](./plan.md), [spec.md](./spec.md)

**Branch**: `the-sdd-arrives-with-its-own-scaffold` (the worktree `change apply` hands back)

Phases are dependency-ordered. Everything inside a phase may be done in any
order; a phase does not start until the one before it is done. `[P]` marks work
that touches a different file from its siblings and can go in parallel.

---

## Phase 1 — The declaration (blocks everything)

- [X] **T001** Add `SddScaffold` to `src/adapters/registry.ts`: `artifact` (the
  repo-relative path whose absence means "not installed here"), `run` (the
  vendor's own init command, verbatim), `note` (what running it wrote, and how
  that was established). Document on the interface that the command is a
  terminal command multivac runs, never a step (MV-51).
  *Satisfies FR-001, FR-002.*
- [X] **T002** Add `scaffold?: SddScaffold` to `AdapterSpec`, in the SDD-only
  group beside `steps` and `projectSteps`, with the reason it is optional: an
  adapter whose init nobody verified declares none.
  *Satisfies FR-001. Anchor: `/scaffold\?: SddScaffold/ unique`.*
- [X] **T003** Fill in the `speckit` entry: artifact `.specify`, run
  `specify init --here --integration claude --force`, note recording the
  verified run — `.specify/**` (scripts, templates, `memory/constitution.md` as
  the unfilled template) plus ten `.claude/skills/speckit-*/SKILL.md`, and that
  it does not touch `.claude/settings.json`; the flag is `--integration`, not
  `--ai`.
  *Satisfies FR-002. Anchor: `/specify init --here --integration claude/ unique`.*
- [X] **T004** State the gap on `opsx`: a comment where the field would go
  saying `openspec init` exists in its CLI list but was not verified by running
  it, so no command is recorded (MV-59, Principle V).
  *Satisfies FR-008 (data half).*

## Phase 2 — The routine

- [X] **T005** Write `runScaffold(brain, cfg, noSdd)` in `src/adapters/sdd.ts`.
  Order, exactly: off-switch check → unknown adapter → probe every `sddRoot` →
  return silently when present → no `scaffold` declared ⇒ the stated gap →
  print the command → run it via `toolVerdict` → re-probe → success line, or the
  warning carrying the tool's own words. Never throws.
  *Satisfies FR-003, FR-004, FR-005, FR-008, FR-009, FR-010, FR-011, FR-012.*
- [X] **T006** Carry the doc comment sentence the anchor pins — "the scaffold is
  what makes the steps runnable" — and, with it, why this is not a step.
  *Anchor: `brain:src/adapters/sdd.ts /the scaffold is what makes the steps runnable/`.*

## Phase 3 — The call sites

- [X] **T007** Call `runScaffold` from `cmdNew` in `src/commands/change.ts`,
  immediately before the `new` steps are printed, so the steps it prints are
  runnable. *Satisfies FR-006.*
- [X] **T008** Call `runScaffold` at the top of `gateSdd` in the same file,
  before `sddGate`, so `plan`/`apply`/`close` scaffold before they refuse.
  *Satisfies FR-006, and FR-013 by construction — nothing about a step changes.*
- [X] **T009 [P]** `src/commands/doctor.ts`: extend the artifact-missing clause
  to name the command the lifecycle runs, and to say doctor never runs it
  because it reaches the network. Reference the registry field only; the routine
  is never imported. *Satisfies FR-014.*

## Phase 4 — The tests (each one fails if its branch is reverted)

- [X] **T010** Add a `specify` stub to the shared `bin` directory in
  `test/change/sdd-gates.test.ts`, in the same shape as `stubOpenspec`: writes
  `.specify/`, appends to a run-count file, exit code and behaviour switchable
  per test. No test may execute a real `specify`. *Satisfies SC-006.*
- [X] **T011** Test `a declared SDD that is not installed scaffolds itself`:
  artifact absent → `change new` prints the exact command and the roots it
  searched, the stub ran once, `.specify` exists afterwards.
  *Anchor: `brain:test/change/sdd-gates.test.ts /a declared SDD that is not installed scaffolds itself/.*
- [X] **T012 [P]** Test the skip: artifact present → the stub does not run
  again and no scaffold line is printed.
- [X] **T013 [P]** Test the failure: stub exits non-zero with a message on
  stderr → the tool's own words are printed, the command is handed back, the
  lifecycle command does not throw, and the following gate still refuses.
- [X] **T014 [P]** Test the silent success that wrote nothing: stub exits 0 and
  creates nothing → reported as a failure, never as a success.
- [X] **T015 [P]** Test the missing binary: `PATH` without `specify` → the
  install line is printed and nothing is executed.
- [X] **T016 [P]** Test the stated gap: `opsx` declared, `openspec/` absent →
  the honest "no init command recorded, none will be guessed" line, and no
  subprocess.
- [X] **T017 [P]** Test the off switches: `--no-sdd` and `sdd_auto: false` each
  suppress the scaffold entirely. *Satisfies FR-012.*

## Phase 5 — Law and docs

- [X] **T018** Reconcile the MV-75 anchor legs in `.multivac/invariants.md` with
  the names actually written, including the `absent` leg over
  `src/commands/{verify,doctor,doors}.ts`. *Satisfies FR-007.*
  **Outcome: no edit needed.** Every drafted leg resolves against the code as
  written — `SddScaffold`, the verbatim init command, `runScaffold` absent from
  the three offline commands, and both prose legs. One wording fix went the
  other way: the sentence the sdd.ts leg pins had been wrapped across two
  comment lines, and an anchor matches within a line, so the sentence was
  rewrapped rather than the leg weakened.
- [X] **T019 [P]** `site/content/docs/reference/graphers-and-sdd.md`: separate
  installing the tool (never) from running the tool's own setup here (the
  lifecycle, on your declaration), and document the five outcomes.
  *Satisfies FR-015.*

## Phase 6 — Verification

- [X] **T020** `pnpm run build && pnpm test` green.
- [X] **T021** `node dist/cli.js verify --strict` exits 0 with every MV-75 leg
  resolving.
- [X] **T022** Manual read-through of the three offline commands for any
  reference to the routine — the mechanical check is T018's `absent` leg, this
  is the human half of Principle IV.
