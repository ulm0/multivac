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

- [X] T001 Confirm the baseline: run `pnpm run build && pnpm test` and record that 512 tests pass before any edit
- [X] T002 Record the three defects as they behave today by running the "before" block of `specs/030-the-refusal-reads-the-whole-token/quickstart.md`

## Phase 2: Foundational

**Blocking**: the law row lands first — Constitution III, law moves before code —
then the token model, because both US1 and US2 read it.

- [X] T003 Write the MV-105 row in `.multivac/invariants.md`, turning the reserved id into a stated rule, and anchor it to `src/lib/args.ts` and to `test/cli/unknown-args.test.ts` so the claim is pinned by the registry walk rather than by a typed list
- [X] T004 In `src/lib/args.ts`, resolve each dash-prefixed token to a `name` by splitting on the first `=` **only when the token begins with `--`**, per `data-model.md` — short-alias tokens stay whole because citty does not split them either
- [X] T005 In `src/lib/args.ts`, keep every refusal message naming the token **as the user typed it**, not the split name, so `--loud=1` is quoted in full

## Phase 3: User Story 1 — The equals form works again (P1)

**Goal**: a declared valued flag written `--name=value` runs, and parses to the
same value as `--name value`.

**Independent test**: `mvac init --provider=claude --quiet <dir>` exits 0 and
writes `claude` into the config; `mvac verify --repo=brain` scopes as
`--repo brain` does.

- [X] T006 [US1] In `src/lib/args.ts`, match the resolved `name` against `valued` and `flags`, accepting `--name=value` when `name` is declared and consuming no following token
- [X] T007 [US1] In `test/cli/args.test.ts`, assert the pair that was missing: one input asked of **both** readers — `undeclared` accepts `--repo=api` AND `parseArgs` binds `repo` to `api`, for the separated and the equals form alike; assert in the same test that a command's own `takes` sentence is still what the refusal renders (FR-006, MV-69)
- [X] T008 [US1] In `test/cli/args.test.ts`, assert `--strict=false` is accepted (declared boolean, citty owns negation) and `-r=api` is refused (citty parses its value as `=api`, so it is not a form the parser understands)
- [X] T009 [US1] In `test/cli/unknown-args.test.ts`, extend the registry walk so every command's declared valued flags are exercised in both written forms, and an undeclared `--nope=1` is refused with exit 2

## Phase 4: User Story 2 — A flag cannot eat the next flag (P1)

**Goal**: a declared valued flag whose value is missing or flag-shaped is
refused, naming the flag.

**Independent test**: `mvac verify --repo --strict` exits 2; `mvac verify --repo`
exits 2; neither runs a verify.

- [X] T010 [US2] In `src/lib/args.ts`, refuse a declared valued flag whose next token is absent or begins with `-`, naming the flag and keeping exit 2 at the call site
- [X] T011 [US2] In `test/cli/args.test.ts`, assert both shapes are refused, and assert the measured reason they must be: `parseArgs(['--repo','--strict'])` binds `repo` to `--strict`, and `parseArgs(['--repo'])` binds it to `''`
- [X] T012 [US2] In `test/cli/unknown-args.test.ts`, add the registry-walking case: for every command declaring a valued flag, the flag alone at the end of argv exits 2

## Phase 5: User Story 3 — `change` refuses what every other command refuses (P1)

**Goal**: the one command that mutates the lifecycle record reaches the shared
guard.

**Independent test**: `mvac change land <slug> api` exits 2 with the change file
byte-identical; `--no-sdd` and `--no-grapher` still work.

- [X] T013 [US3] In `src/commands/change.ts`, delete the private `CHANGE_FLAGS` check and call `undeclared('change', argv, …)` built from `surfaceFrom(ARGS)` — the `--no-sdd`/`--no-grapher` spellings need no special case, because `surfaceFrom` derives them from the ArgsDef keys `no-sdd` and `no-grapher`; what stays special is that the command reads those two literally from argv, since citty consumes the prefix and the declared key never arrives
- [X] T014 [US3] In `src/commands/change.ts`, compute the positional cap from the subcommand BEFORE calling the shared guard — `Surface.positionals` is one number — three for `new` (`new <slug> "<title>"`), two otherwise, so `change land <slug> api` is refused while `change new <slug> "<title>"` stays legal
- [X] T015 [US3] In `src/commands/change.ts`, delete the now-dead `CHANGE_FLAGS` constant and update the comment above the guard to describe what the code does
- [X] T016 [US3] In `test/cli/unknown-args.test.ts` (or `test/change/`), assert `change land <slug> api` and `change land <slug> -landed api` exit 2 and write nothing, and that `--no-sdd`, `--no-grapher`, `change new "<title>"` and `change new <slug> "<title>"` are unaffected

## Phase 6: Polish & Cross-Cutting

- [X] T017 Update `site/content/docs/reference/commands.md` wherever it states the refusal surface, so the documented behaviour and the code agree on the equals form and on the missing value
- [X] T018 Run `pnpm test` and confirm every test passes, with any test that asserted one of the three defects updated rather than deleted
- [X] T019 Confirm FR-007 from the diff: `git diff --stat main -- src/` shows more deletions than insertions
- [X] T020 Run `node dist/cli.js verify` and confirm 0 blocking broken, with MV-105 anchored

## Dependencies

- Phase 2 (T003–T005) blocks every user story: T003 is the law row, which
  Constitution III puts before the code, and T004–T005 are the token model all
  three stories read.
- US1 (T006–T009) and US2 (T010–T012) touch the same function; US2 depends on
  T004 but not on US1, and they are written in one pass.
- US3 (T013–T016) depends on the guard being correct, because `change` inherits
  whatever it does.

## Parallel opportunities

Genuinely parallel work is limited, because the change is deliberately confined
to two files:

- T007, T008 and T011 all edit `test/cli/args.test.ts` — sequential.
- T009 and T012 edit `test/cli/unknown-args.test.ts` — sequential with each
  other, parallel with the `args.test.ts` group. [P]
- T017 edits the site docs and is parallel with everything after T006. [P]

## Implementation strategy

MVP is User Story 1 alone: it fixes a published regression, and it is the only
one of the three that a user is hitting today without knowing why. US2 and US3
are the same function and the same commit, so shipping them together costs
nothing extra and closes the whole class.

Order: T001–T002 (baseline), T003 (the law row, first — Constitution III),
T004–T012 in one edit of `src/lib/args.ts` and its tests, then T013–T016 in
`src/commands/change.ts`, then the docs and the checks.
