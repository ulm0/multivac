# Tasks: A finished change is not a pending one

**Input**: [plan.md](plan.md), [spec.md](spec.md)
**Branch**: `a-finished-change-is-not-a-pending-one`

Phases run in order. Within a phase, `[P]` marks tasks that touch different
files and can run in parallel.

## Phase 1: The law moves first (Principle III)

- [X] **T001** In `.multivac/invariants.md`, amend MV-80 in place, dated
  2026-08-16. The drafted statement says "a change whose every declared claim
  already resolves is finished"; the built predicate adds a third condition —
  every declared repo recorded `landed` — because `close` refuses a change with
  a repo outstanding and the gate must not print an instruction the same binary
  rejects. Record that narrowing, and record the decision the change file left
  open: the channel read OFFERS the conclusion, `--landed` stays the human's
  assertion, because MV-54 makes the negative ambiguous and published content
  does not prove authorship. Authority `open` / state `proposed` — a human
  enacts. (FR-001, FR-005, FR-010, FR-013)
- [X] **T002** In the same file, give MV-80 its legs: the two drafted on
  `src/commands/verify.ts` (`/every declared claim resolves/`, `/finished, not
  pending/`), the two drafted on `test/verify/verify.test.ts` by test title, and
  two new ones on `src/commands/change.ts` for half two — the published
  conclusion and the MV-54 limit it must carry. Add the
  `test/change/lifecycle-polish.test.ts` leg naming the channel-evidence test.
  (FR-013)

Depends on: nothing. Blocks: Phase 5 (the legs name files Phases 2–4 create).

## Phase 2: Failing tests first — the gate (US1, US2)

Every test here must fail against the current code, and each is named so a
mutation proof can cite it by title.

- [X] **T003** In `test/verify/verify.test.ts`, extend the local `writeChange`
  helper so a test can state each declared repo's status and can declare zero
  claims. Keep its current call sites working unchanged. (US1, US2)
- [X] **T004** In the same file, add `a finished change is refused as unclosed,
  not excused as pending`. An open change declaring one claim whose anchor
  resolves, with its one declared repo `landed`: `--strict` exits 1, the output
  names the slug, says `finished, not pending`, and prints
  `multivac change close <slug>`; the same run without `--strict` exits 0.
  (US1 scenarios 1 and 2, FR-001, FR-002, FR-003, FR-007)
- [X] **T005** In the same file, add `a change with work left is still pending,
  and still does not block`. An open change declaring two claims, one resolving
  and one not, repo `landed`: `--strict` exits 0, the unresolved claim still
  reports `declared by open change <slug>`, and the slug is never named as
  finished. (US1 scenario 3, FR-001, FR-004)
- [X] **T006** In the same file, add `an empty declaration is not finished by
  vacuity, and neither is an unlanded one`. Three shapes in one test: a change
  declaring zero claims, a change whose declared claim carries no anchor at all,
  and a change whose claim resolves while its repo is still `planned`. None is
  named as finished; `--strict` exits 0 in each. (US1 scenario 4, US2 scenarios
  1 and 2, FR-004, FR-005)

Depends on: T003. Blocks: Phase 4.

## Phase 3: Failing tests first — landing from the channel (US3)

- [X] **T007** In `test/change/lifecycle-polish.test.ts`, add `land reads
  landing from the channel: published bytes are the evidence a squash
  destroys`. A brain==code repo published through the shared `publishRepo`
  helper, with a law row whose anchor resolves against the published tree and a
  change declaring that claim: `land <slug>` prints a `channel:` line naming
  `origin/main`, its short sha, its fetch age and the record-it command; `land
  <slug> --landed brain` cites the channel as the evidence and does not print
  the absent-local-merge sentence. (US3 scenarios 1 and 2, FR-008, FR-009)
- [X] **T008** In the same file, add `an unresolved claim at the channel is not
  landed OR not fetched, and land says both`. Same fixture, with the anchored
  code committed only on the change branch and never pushed: `land --landed
  brain` still records the landing, and the report names the ref, its age, both
  possibilities and the fetching command. (US3 scenario 3, FR-009, FR-010)

Depends on: nothing (different file from Phase 2). Blocks: Phase 4. `[P]` with
Phase 2.

## Phase 4: The behaviour (US1, US2, US3)

- [X] **T009** In `src/commands/verify.ts`, widen `openChangeClaims` to return
  the repo statuses it already parses alongside `pendingBy`, so the landed
  condition costs no second read. (FR-001, FR-014)
- [X] **T010** In the same file, add `finishedChanges`: invert `pendingBy` to
  slug → claim ids, keep the slugs whose every id resolved `ok` and whose every
  declared repo is `landed`. Its doc comment states the contract — "every
  declared claim resolves" — and says why vacuity is excluded by construction
  rather than by a guard. (FR-001, FR-004, FR-005)
- [X] **T011** In the same file, call it from `evaluateCore` for whole-brain
  runs only — never when `scope` or `claimIds` is set — put `finished` on the
  `Evaluated` record, and fold it into the exit code under `--strict` so the
  line and the exit come from one decision. (FR-002, FR-003, FR-006, FR-007)
- [X] **T012** In the same file, print one line per finished change in
  `runVerify`: the slug, `finished, not pending`, how many claims it holds off
  the gate, and `multivac change close <slug>`. Mark it ` · blocking` under
  `--strict` from the same condition that gated, and add its count to the
  summary total. (FR-002, FR-007, FR-012)
- [X] **T013** In the same file, add `atChannel` to `EvaluateOpts` and make
  `resolveSources` read the brain's own repo at its channel ref under it —
  MV-53's exception, switched only for the question `land` asks. An
  unresolvable channel leaves the working-tree read exactly as it is. Export
  `fmtAge` so `land` names the ref's age in the same words `verify` does.
  (FR-008, FR-009)
- [X] **T014** In `src/commands/change.ts`, add `channelEvidence`: null when the
  change declares no claims or the brain's channel does not resolve, otherwise
  `evaluate(..., { claimIds, atChannel: true })` through `closeGate`, returning
  the sentence and whether it resolved. The unresolved sentence carries both
  possibilities and the fetching command (MV-54). (FR-008, FR-009, FR-011)
- [X] **T015** In the same file, call it from `cmdLand` at its two points: the
  `--landed` record line cites the channel when it can speak and otherwise
  prints today's message untouched; the report prints one `channel:` line with
  the record-it command. Nothing is written, refused or archived. (FR-010,
  FR-011, FR-012)

Depends on: Phases 2 and 3. Blocks: Phase 5.

## Phase 5: Proof and close-out

- [X] **T016** `pnpm run build && pnpm test` green.
- [X] **T017** Mutation-verify every behaviour: revert it in the TypeScript
  source, rebuild, confirm the NAMED test fails with the expected assertion,
  restore. Eight proofs ran, all confirmed:
  1. the finished predicate (`finished` forced to `[]`) → *a finished change is
     refused as unclosed…* @ `assert.equal(strict.code, 1)`, actual 0;
  2. the landed condition (`open.landed.has(slug) &&` dropped) → *an empty
     declaration is not finished by vacuity…* @ `assert.equal(code, 0)`,
     actual 1 — `still-mine`, repo `planned`, read as finished;
  3. the vacuity exclusion — an **insertion**, not a revert, because the
     exclusion is by construction: seeding `declared` from `open.landed` gives
     a claims-free change an empty id list, which `every` satisfies → same test
     @ `assert.equal(code, 0)`, actual 1;
  4. the strict-only exit (`opts.strict === true &&` dropped) → *a finished
     change is refused as unclosed…* @ `assert.equal(plain.code, 0)`, actual 1;
  5. the channel read (`atChannel` forced false) → *an unresolved claim at the
     channel…* @ its `not every declared claim resolves…` match: `land` read
     the working tree and announced unpublished work as published;
  6. the ref's age (MV-54) (`(${age})` dropped) → *land reads landing from the
     channel…* @ its `channel:` match;
  7. the summary count (`+ finishedBlocking` dropped) → *a finished change is
     refused as unclosed…* @ the `1 blocking broken · exit 1 · 1 finished
     change unclosed` match, actual `0 blocking broken · exit 1` — MV-20's
     line-and-exit disagreement, caught;
  8. the offer-not-derive decision — an **insertion** again: making the report
     write `landed` when the channel resolves → *land reads landing from the
     channel…* @ `assert.equal(…repos.brain.status, 'planned')`, actual
     `landed`. (SC-006)
- [X] **T018** `node dist/cli.js verify --strict` exits 0 with MV-80's six legs
  resolving, and this change is NOT named as finished — its repo is `branched`,
  not `landed`, which is Phase 1's whole point demonstrated on itself. (SC-007)
- [X] **T019** Commit on the branch `change apply` created, repo style, with the
  co-author trailer. No push, no MR, no `change close`.

Depends on: Phase 4.
