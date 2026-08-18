---

description: "Task list for the-refusal-reads-the-whole-token"
---

# Tasks: The refusal reads the whole token

**Input**: Design documents from `specs/030-the-refusal-reads-the-whole-token/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/refusal.md, quickstart.md

**Tests**: requested. This repo's constitution says behaviour ships with a test,
and the defect being fixed shipped because the previous change's tests asked
each reader about a different input. Test tasks are therefore not optional here.

**Organization**: by user story, in priority order. All three stories are P1 and
all three land in the same two files, so they are sequential rather than
parallel — the [P] marker is used only where files genuinely differ.

## Phase 1: Setup

- [ ] T001 Confirm the baseline: run `pnpm run build && pnpm test` and record that 512 tests pass before any edit
- [ ] T002 Record the three defects as they behave today by running the "before" block of `specs/030-the-refusal-reads-the-whole-token/quickstart.md`

## Phase 2: Foundational

**Blocking**: the token model lands first, because both US1 and US2 read it.

- [ ] T003 In `src/lib/args.ts`, resolve each dash-prefixed token to a `name` by splitting on the first `=` **only when the token begins with `--`**, per `data-model.md` — short-alias tokens stay whole because citty does not split them either
- [ ] T004 In `src/lib/args.ts`, keep every refusal message naming the token **as the user typed it**, not the split name, so `--loud=1` is quoted in full

## Phase 3: User Story 1 — The equals form works again (P1)

**Goal**: a declared valued flag written `--name=value` runs, and parses to the
same value as `--name value`.

**Independent test**: `mvac init --provider=claude --quiet <dir>` exits 0 and
writes `claude` into the config; `mvac verify --repo=brain` scopes as
`--repo brain` does.

- [ ] T005 [US1] In `src/lib/args.ts`, match the resolved `name` against `valued` and `flags`, accepting `--name=value` when `name` is declared and consuming no following token
- [ ] T006 [US1] In `test/cli/args.test.ts`, assert the pair that was missing: one input asked of **both** readers — `undeclared` accepts `--repo=api` AND `parseArgs` binds `repo` to `api`, for the separated and the equals form alike
- [ ] T007 [US1] In `test/cli/args.test.ts`, assert `--strict=false` is accepted (declared boolean, citty owns negation) and `-r=api` is refused (citty parses its value as `=api`, so it is not a form the parser understands)
- [ ] T008 [US1] In `test/cli/unknown-args.test.ts`, extend the registry walk so every command's declared valued flags are exercised in both written forms, and an undeclared `--nope=1` is refused with exit 2

## Phase 4: User Story 2 — A flag cannot eat the next flag (P1)

**Goal**: a declared valued flag whose value is missing or flag-shaped is
refused, naming the flag.

**Independent test**: `mvac verify --repo --strict` exits 2; `mvac verify --repo`
exits 2; neither runs a verify.

- [ ] T009 [US2] In `src/lib/args.ts`, refuse a declared valued flag whose next token is absent or begins with `-`, naming the flag and keeping exit 2 at the call site
- [ ] T010 [US2] In `test/cli/args.test.ts`, assert both shapes are refused, and assert the measured reason they must be: `parseArgs(['--repo','--strict'])` binds `repo` to `--strict`, and `parseArgs(['--repo'])` binds it to `''`
- [ ] T011 [US2] In `test/cli/unknown-args.test.ts`, add the registry-walking case: for every command declaring a valued flag, the flag alone at the end of argv exits 2

## Phase 5: User Story 3 — `change` refuses what every other command refuses (P1)

**Goal**: the one command that mutates the lifecycle record reaches the shared
guard.

**Independent test**: `mvac change land <slug> api` exits 2 with the change file
byte-identical; `--no-sdd` and `--no-grapher` still work.

- [ ] T012 [US3] In `src/commands/change.ts`, delete the private `CHANGE_FLAGS` check and call `undeclared('change', argv, …)` built from `surfaceFrom(ARGS)`, adding the two literal `--no-` spellings to the accepted flags because citty consumes that prefix before the command sees it
- [ ] T013 [US3] In `src/commands/change.ts`, cap positionals per subcommand — three for `new` (`new <slug> "<title>"`), two otherwise — so `change land <slug> api` is refused while `change new <slug> "<title>"` stays legal
- [ ] T014 [US3] In `src/commands/change.ts`, delete the now-dead `CHANGE_FLAGS` constant and update the comment above the guard to describe what the code does
- [ ] T015 [US3] In `test/cli/unknown-args.test.ts` (or `test/change/`), assert `change land <slug> api` and `change land <slug> -landed api` exit 2 and write nothing, and that `--no-sdd`, `--no-grapher`, `change new "<title>"` and `change new <slug> "<title>"` are unaffected

## Phase 6: Polish & Cross-Cutting

- [ ] T016 Write the MV-105 row in `.multivac/invariants.md` — the reserved id becomes a stated rule — and anchor it to `src/lib/args.ts` and to `test/cli/unknown-args.test.ts`, so the claim is pinned by the registry walk rather than by a typed list
- [ ] T017 Update `site/content/docs/reference/commands.md` wherever it states the refusal surface, so the documented behaviour and the code agree on the equals form and on the missing value
- [ ] T018 Run `pnpm test` and confirm every test passes, with any test that asserted one of the three defects updated rather than deleted
- [ ] T019 Confirm FR-007 from the diff: `git diff --stat main -- src/` shows more deletions than insertions
- [ ] T020 Run `node dist/cli.js verify` and confirm 0 blocking broken, with MV-105 anchored

## Dependencies

- Phase 2 (T003–T004) blocks every user story: all three read the resolved token.
- US1 (T005–T008) and US2 (T009–T011) touch the same function; US2 depends on
  T003 but not on US1, and they are written in one pass.
- US3 (T012–T015) depends on the guard being correct, because `change` inherits
  whatever it does.
- T016 must land in the same commit as the code it anchors, or before it —
  Constitution III, law moves before code.

## Parallel opportunities

Genuinely parallel work is limited, because the change is deliberately confined
to two files:

- T006, T007 and T010 all edit `test/cli/args.test.ts` — sequential.
- T008 and T011 edit `test/cli/unknown-args.test.ts` — sequential with each
  other, parallel with the `args.test.ts` group. [P]
- T017 edits the site docs and is parallel with everything after T005. [P]

## Implementation strategy

MVP is User Story 1 alone: it fixes a published regression, and it is the only
one of the three that a user is hitting today without knowing why. US2 and US3
are the same function and the same commit, so shipping them together costs
nothing extra and closes the whole class.

Order: T001–T004, then T005–T011 in one edit of `src/lib/args.ts`, then
T012–T015, then the law row and the docs.
