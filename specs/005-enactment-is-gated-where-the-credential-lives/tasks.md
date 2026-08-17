# Tasks: enactment is gated where the credential lives

**Input**: [plan.md](plan.md), [spec.md](spec.md)
**Branch**: `enactment-is-gated-where-the-credential-lives`

Phases run in order. Within a phase, `[P]` marks tasks that touch different
files and can run in parallel.

## Phase 1: The law moves first (Principle III)

- [X] **T001** In `.multivac/invariants.md`, amend MV-81 in place, dated
  2026-08-16. Keep the ungateable declaration and both its reasons (MV-04, hooks
  run with the caller's permissions) and the forge merge button as where
  enforcement lives. Add what the drafted row did not say: **the limit** — the
  checkable half is decided from the index against HEAD, so it answers only
  while a commit is being composed and says so when it cannot, and it is not a
  security boundary. (FR-001, FR-011)
- [X] **T002** In the same row, add legs for what the drafted four do not
  reach: the index read (`'--cached'`, unique), the stated limit (`the index
  against HEAD`), the not-answered path (`not answered`), the `doctor` line, and
  the could-not-answer test. The four drafted legs stay exactly as written; all
  nine must resolve after Phase 4. The `doctor` leg is written as
  `/label\('enact'\) \+ ENACTMENT_UNGATEABLE/` and not as the sentence itself:
  the sentence lives in `verify.ts` (one string, two printers), so a leg on the
  phrase would have matched `doctor`'s *import* and stayed green with the line
  deleted — which is what the first draft of it did. (FR-003)
- [X] **T003** In `.multivac/changes/enactment-is-gated-where-the-credential-lives.md`,
  bring the `claims[0].statement` back into agreement with the amended row and
  add a short section recording the limit, so the change file and the law say
  the same thing. Do not touch the "Considered and declined" section. (FR-011)

Depends on: nothing. Blocks: Phase 4 (the legs T001–T002 name text Phase 3 and
Phase 4 write).

## Phase 2: Failing tests first (US1, US3)

Every test here must fail against the current code, and each is named so a
mutation proof can cite it by title.

- [X] **T004** In `test/verify/verify.test.ts`, add `a row enacted beside the
  code it anchors is refused`. Commit a brain whose law carries a `proposed` row
  anchored at `src/thing.ts`, and `src/thing.ts` itself. Then edit the law to
  `active`, edit `src/thing.ts`, `git add -A` without committing, and run
  verify: exit 1, the output names the row id, names `src/thing.ts`, carries
  `enactment lands in its own commit`, and prints `git restore --staged`.
  (US1 scenarios 1 and 5, FR-004, FR-005)
- [X] **T005** In the same file, add `a row enacted alone in its commit is not
  refused`. Same fixture, but stage only the law edit: exit 0, and the output
  says the row was enacted alone. Then also assert the law file itself is never
  counted as the code beside the row, by giving the row a second leg anchored at
  `.multivac/invariants.md` and staging the law alone again: still exit 0.
  (US1 scenario 2, FR-006)
- [X] **T006** In the same file, add `a row born active beside its code is
  refused on the same ground`. HEAD's law has no such row at all; the staged law
  introduces it already `active`, alongside the file it anchors: exit 1, naming
  the row. (US1 scenario 4)
- [X] **T007** In the same file, add `the enactment check says when it could not
  answer, and when it answered nothing`. With nothing staged: exit 0 and a line
  saying the question was not answered because nothing is staged, naming the
  index as what it reads. Then stage a code edit only, with the law untouched:
  exit 0 and a line saying no row was enacted — a different sentence from the
  first. (US3 scenarios 1 and 2, FR-008)

Depends on: nothing (they are written against behaviour Phase 3 adds and must
fail until it does). Blocks: Phase 3.

## Phase 3: The check (US1, US3)

- [X] **T008** In `src/anchor/parse.ts`, split the law-table parse out of
  `readClaimRows` into an exported `parseClaimRows(text: string): ClaimRow[]`,
  and make `readClaimRows` the file-reading wrapper over it. No behaviour
  change; the existing suite must stay green on its own. (plan §5)
- [X] **T009** In `src/commands/verify.ts`, add the exported
  `ENACTMENT_UNGATEABLE` string: who enacts is not a fact on disk, both reasons,
  the forge merge button as where enforcement is, and what verify checks
  instead. One string, so the two commands that print it cannot drift.
  (FR-001, FR-003)
- [X] **T010** In the same file, add `enactmentLine(brainDir, cfg, anchors)`
  returning the existing `Diagnostic` record (text + gates):
  1. `git diff --cached --name-only -z`; failure or empty ⇒ not answered, with
     the reason. This is the only git call in the ordinary path. (FR-008, FR-010)
  2. `.multivac/invariants.md` not among the staged paths ⇒ answered, no row
     enacted. Stop here — no further git call. (FR-010)
  3. `rev-parse HEAD` null ⇒ not answered (no previous state to compare).
  4. `cat-file blob HEAD:<law>` and `cat-file blob :<law>`, parsed with
     `parseClaimRows`; enacted = rows `active` in the index whose HEAD state is
     anything else, absent included. (FR-009)
  5. Offenders per row: staged paths other than the law file, matched by that
     row's anchors whose repo key is `brain`, `*`, or a config key that resolves
     to the brain. (FR-004, FR-006, FR-007)
  6. No offenders ⇒ enacted alone, exit unaffected. Offenders ⇒ one line naming
     every row with its files, `· blocking`, `enactment lands in its own
     commit`, and the `git restore --staged` fix. (FR-005)
- [X] **T011** In the same file, print that line in `runVerify` after the
  staleness block, feed `gates` into `finalExit` and into the `blocking` count
  the summary prints, and add a usage line describing the `enact` line. A
  consumer-scoped run gets the not-answered variant with its own reason: the law
  is not in that checkout's index. (FR-008, FR-012)

Depends on: Phase 2. Blocks: Phase 4.

## Phase 4: The declaration a reader meets (US2)

- [X] **T012 [P]** In `src/commands/doctor.ts`, import `ENACTMENT_UNGATEABLE`
  and add one `enact` line to `doctorReport`, beside the `hooks` line that
  reports what *is* armed. Static text, no git call. (FR-003)
- [X] **T013 [P]** In `site/content/docs/concepts/invariants.md`, extend the
  section "The agent proposes; the human enacts" with the declaration: the rule
  is **ungateable** here, both reasons, the forge merge button, and the half
  `verify` does check with its limit. Cite MV-81 by id. (FR-002)

Depends on: T009 for T012. T013 depends on nothing.

## Phase 5: Proof

- [X] **T014** `pnpm install --silent && pnpm run build && pnpm test` green, and
  `node dist/cli.js verify --strict` exit 0 with all nine MV-81 legs resolving.
  (FR-012, SC-003)

  336 tests pass, 0 fail. `verify --strict` exit 0; MV-81 sits in the `ok` count
  (80 ok), and the only `pending` rows belong to MV-80, held by a different open
  change.
- [X] **T015** Mutation-verify each behaviour: revert it in the TypeScript
  source, `pnpm run build`, confirm the **named** test fails on the **named**
  assertion, restore. One proof per behaviour: the refusal (T004), the
  alone-is-fine path and the law-file exclusion (T005), the born-active rule
  (T006), and the could-not-answer / answered-nothing distinction (T007).
  (Principle II)

  Run, one at a time, each reverted and rebuilt before the run and restored
  after — every one failed the named test alone, the other three staying green:

  | reverted | test that failed | assertion |
  | --- | --- | --- |
  | the refusal's `gates: true` → `false` | a row enacted beside the code it anchors is refused | `enactment beside its own code was allowed` — actual 0, expected 1 |
  | `staged.filter(p => p !== LAW_PATH)` → `staged` | a row enacted alone in its commit is not refused | `the law file counted as the code beside the row` — actual 1, expected 0 |
  | `was.get(id) !== 'active'` → `was.has(id) && was.get(id) !== 'active'` | a row born active beside its code is refused on the same ground | `a row born active skipped the same review` — actual 0, expected 1 |
  | the empty-index branch returning `nothing()` instead of `unanswered()` | the enactment check says when it could not answer, and when it answered nothing | `did not match /not answered — nothing staged, so no commit is being composed/`, input carried `no row enacted in this commit — nothing staged` |

  The `doctor` line has no unit test; it is pinned by an anchor leg, and that
  leg was mutation-verified the same way: deleting the line from
  `doctorReport` made MV-81's `doctor` leg stop resolving (reported `pending`,
  held by this open change per MV-17, and MV-81 dropped out of the `ok` count).
  It does **not** gate today, because MV-17 and `legGates` exempt a `proposed`
  row declared by an open change; `change close` runs claim-scoped, where
  pendency ends and the leg does gate. Stated rather than implied.
- [X] **T016** Time `verify` on this repository and record the wall clock; count
  the git invocations the check makes in the ordinary case. Must be sub-second
  and exactly one. (SC-005, FR-010)

  Measured, with a counting `git` shim first on PATH: **0.13 s / 0.13 s / 0.14 s**
  real over three runs. Ordinary case (a non-law file staged): 7 git calls for
  the whole run, of which the enactment check makes **1** — `diff --cached`, 0
  `cat-file blob`, and the single `rev-parse HEAD` in the log belongs to the
  pre-existing `read` line, not to this check. Law staged: 10 calls, i.e. the
  check makes **4** — `diff --cached`, one `rev-parse HEAD`, two `cat-file
  blob`. Both match the plan.
