# Tasks: The scan guard skips anchor lines, not every line saying @anchor

**Input**: Design documents from `specs/006-anchor-line-not-substring/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md)

**Tests**: included and mandatory — the constitution's Engineering Constraints
require behaviour to ship with a check, and SC-003 requires a named check that
fails when the change is reverted.

**Organization**: phased. Phase 1 records the defect as measured facts, so the
fix is judged against evidence rather than against the report. Phases 3 and 4
are the two user stories, and they are deliberately separable: Phase 3 can go
green while Phase 4 is red (that is the over-wide fix), and Phase 4 can go green
while Phase 3 is red (that is today). Both must hold.

**Path convention**: repository root is the change worktree
`.multivac/worktrees/…` that `change apply` prints.

---

## Phase 1: Reproduction (blocking — no edit before it)

- [X] T001 Build the tree at the base commit: `pnpm install --frozen-lockfile`
  then `pnpm run build`.
- [X] T002 Reproduce the evasion against MV-04. Append
  `const evade = "user.name"; // @anchor` to `src/lib/paths.ts`, run
  `node dist/cli.js verify --strict`, record the exit code and the leg's
  verdict. Expected, and to be confirmed rather than assumed: green.
- [X] T003 Reproduce the control. Replace that line with the same statement
  minus the ` // @anchor` suffix, run the same command, record the exit code and
  the verdict. Expected: MV-04 broken, blocking, exit 1. Restore
  `src/lib/paths.ts` to its committed content and confirm a clean `git diff`.
- [X] T004 Enumerate the blast radius before touching anything: every tracked
  line containing `@anchor` that does not carry `<!--\s*@anchor`, counted per
  file. Record the table in [plan.md](plan.md) §3.
- [X] T005 Enumerate the rejected alternative's blast radius: every tracked line
  carrying `<!--\s*@anchor` that does not begin with it. Record the finding and
  the rejection in [plan.md](plan.md) §2.

**Checkpoint**: the defect is a measurement, the fix's cost is a number, and
the wider alternative is refused for a stated reason.

---

## Phase 2: The shared predicate (foundational — blocks Phases 3 and 4)

- [X] T006 In `src/anchor/parse.ts`, export the anchor-line predicate as
  `ANCHOR_LINE`, with a doc comment saying it is the one definition and naming
  both callers. Rewrite the existing test at the top of the anchor branch to use
  it, so the parser has no second copy.
- [X] T007 In `src/anchor/match.ts`, import `ANCHOR_LINE` and replace the
  substring test in `matchesInFile`'s line loop with it. Update the function's
  doc comment to say anchor *comment* lines, and say why the skip exists.
- [X] T008 `pnpm run build` — both `tsconfig.json` and `tsconfig.test.json`
  compile clean.

**Checkpoint**: one definition, two callers, no cycle, tree builds.

---

## Phase 3: User Story 1 — the evasion is closed (Priority: P1)

**Goal**: a line that mentions the keyword is ordinary content.

**Independent test**: FR-002, SC-001 — the same violating line reports the same
verdict with and without a trailing comment naming the keyword.

- [X] T009 [US1] Add `test/anchor/match.test.ts` with the assertion
  `a source line that mentions @anchor in a comment is scanned`: the
  reproduction's exact line against MV-04's pattern, expecting one match at
  line 1.
- [X] T010 [US1] Add the state-free assertion: scanning the same line twice
  returns the same result, which fails if `ANCHOR_LINE` ever gains a `g` flag.
- [X] T011 [US1] End-to-end proof, not only the unit: append the evading line to
  `src/lib/paths.ts`, `pnpm run build`, run `node dist/cli.js verify --strict`,
  confirm it is now RED with MV-04 named at that file and line, restore and
  confirm clean.

**Checkpoint**: US1 is independently demonstrable at the CLI, not just in a unit
test.

---

## Phase 4: User Story 2 — the law can still describe itself (Priority: P1)

**Goal**: an anchor comment line, wherever it is quoted, contributes no matches.

**Independent test**: FR-004, SC-004 — a documentation page quoting the grammar
satisfies a forbidding leg whose search text the example contains.

- [X] T012 [US2] Add the assertion that a genuine `<!-- @anchor … -->` line is
  skipped, with an ordinary line beside it that does match, so the test proves
  the skip is line-scoped and not file-scoped.
- [X] T013 [US2] Add the assertion that a docs page quoting the grammar in a
  fenced example yields no match for a pattern the example contains.
- [X] T014 [US2] Run the full `node dist/cli.js verify --strict` and compare
  every leg's verdict against the Phase 1 baseline. Report any leg that moved
  and decide it on its merits; re-base a `count` only in the row, with the
  reason in the row.

**Checkpoint**: both P1 stories hold at once — the pair that no single-sided fix
satisfies.

---

## Phase 5: The law (Priority: P1 — Constitution III)

- [X] T015 State MV-82 in `.multivac/invariants.md`: what the guard is for and
  what its reach must not become, dated, sourced to the change file.
- [X] T016 Write MV-82's legs — the definition's own line (`unique`), the
  reader's use of it, the scanner's use of it, the tombstone on the substring
  test (`absent`), and the named check from T009. Validate each with
  `node dist/cli.js count` before committing to it, so no leg is written blind,
  and drop any that cannot fire — a leg green in both states is decoration.
- [X] T017 Confirm no existing row already covers this behaviour, so that
  `adds` is honest and nothing needed `touches`.

---

## Phase 6: Proof and polish

- [X] T018 `pnpm test` — the whole suite green, with the new file's assertions
  named in the output.
- [X] T019 Mutation-verify: revert the change in `src/anchor/match.ts`,
  `pnpm run build`, watch the named assertion from T009 fail, restore, rebuild.
  Name the exact failing assertion in the report.
- [X] T020 Time `node dist/cli.js verify --strict` and report the wall clock:
  the pre-commit budget is sub-second (Constitution IV).
- [X] T021 Commit on the branch `change apply` made, repo style, with the
  `Co-Authored-By` trailer. No push, no merge request, no `change close`.

---

## Dependencies

- Phase 1 blocks everything: no edit before the defect is measured.
- Phase 2 blocks Phases 3 and 4.
- Phases 3 and 4 are independent of each other and both must pass — that
  independence is the point, since either alone is satisfiable by a wrong fix.
- Phase 5 depends on T009 for the test leg's title and on T014 for whether any
  count needs re-basing.
- Phase 6 depends on all of the above.

## Implementation strategy

Minimum viable scope is the whole of Phases 2–5: the fix without the law row
violates Constitution III, and the law row without a leg that can fire is a rule
nothing checks. Phase 6's mutation and timing steps are not polish in the
optional sense — SC-003 and SC-005 are success criteria, and T019 is what
demoted the drafted tombstone from a pin to decoration.
