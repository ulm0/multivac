# Tasks: A roadmap item is a change that has not started yet

**Input**: Design documents from `specs/014-roadmap-is-a-change-not-yet-started/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

**Tests**: included. The constitution requires tests to ship with behaviour — "if it branches, loops, parses, or touches git, it ships with a test".

**Organization**: grouped by user story. US1 alone is a shippable roadmap.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel — different files, no dependency on incomplete work
- **[Story]**: US1, US2, US3 per spec.md

## Path Conventions

Single project. `src/` and `test/` at the repository root, site content under `site/content/docs/`.

---

## Phase 1: Setup

**Purpose**: nothing to initialise — the project, its toolchain and its test harness already exist. This phase confirms the starting line rather than building one.

- [X] T001 Confirm `pnpm test` is green and `node dist/cli.js verify` reports 0 blocking broken before any edit, from the worktree root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the change file must be able to hold the new state before any command can read or write it. Every user story depends on this phase.

- [X] T002 Widen the `status` union to `'planned' | 'open' | 'archived'` on the `ChangeFile` interface in src/change/file.ts
- [X] T003 Accept `planned` in `normalizeChange`'s status validation in src/change/file.ts, and rewrite the error to name all three accepted values
- [X] T004 Add the optional `horizon?: 'now' | 'next' | 'later'` field to the `ChangeFile` interface in src/change/file.ts
- [X] T005 Validate `horizon` in `normalizeChange` in src/change/file.ts — absent is legal in every state, an unknown value is an error naming the three accepted values
- [X] T006 Emit `horizon` from `serializeChange` in src/change/file.ts only when set, so no existing change file grows a null line on its next rewrite
- [X] T007 Add `scaffoldPlanned(slug, title, horizon)` to src/change/file.ts, returning a `ParsedChange` with status `planned`, empty repos/landing_order/invariants/claims, and a body that names `multivac change new <slug>` as the step that starts it
- [X] T008 Add the `assertStarted(parsed)` guard to src/change/file.ts, throwing a `ChangeError` reading `<slug> is planned, not started — start it first: multivac change new <slug>`
- [X] T009 [P] Test the widened status union, the horizon validation and the round-trip of both through parse/serialize in test/change/roadmap.test.ts
- [X] T010 [P] Test that a change file with no horizon serializes without a horizon line, in test/change/roadmap.test.ts

**Checkpoint**: the change file parses, validates and round-trips the new state. No command uses it yet.

---

## Phase 3: User Story 1 — Write an intention down without starting it (Priority: P1) 🎯 MVP

**Goal**: an operator records an intention with one command and reads the list back, grouped by horizon, with the in-flight count kept separate.

**Independent test**: record three intentions on different horizons, run `roadmap`, confirm all three are listed under their horizons and that no branch, worktree or invariant id was created for any of them.

- [X] T011 [US1] Create src/commands/roadmap.ts with the `Command` shape the registry expects — name, help, usage, run — dispatching a bare invocation to the listing and `add` to the recorder
- [X] T012 [US1] Register `roadmap` in the `commands` array in src/commands/index.ts, between `change` and `helpCommand`
- [X] T013 [US1] Implement the roadmap read in src/commands/roadmap.ts — scan `.multivac/changes/*.md`, never `archive/`, parse each, partition into planned and open, and skip an unparseable file rather than crashing the listing
- [X] T014 [US1] Implement the listing output in src/commands/roadmap.ts — `roadmap: <n> planned`, horizons in the order now/next/later with empty horizons omitted, slugs alphabetical within a horizon, each line carrying the slug and the title read from the body's first heading
- [X] T015 [US1] Implement the in-flight line in src/commands/roadmap.ts — the count of open changes and their slugs, printed under its own label so intention is never read as progress
- [X] T016 [US1] Implement the empty-roadmap line in src/commands/roadmap.ts naming `multivac roadmap add` as the way to record one
- [X] T017 [US1] Implement `roadmap add <slug> "<title>" [--horizon now|next|later]` in src/commands/roadmap.ts — default horizon `later`, write via `scaffoldPlanned` and `saveChange`, commit the single change-file path through `commitBookkeeping`, reserve no id and take no law lock
- [X] T018 [US1] Implement `roadmap add`'s refusals in src/commands/roadmap.ts — already planned, already open, already archived, unknown horizon — each naming the state found and the command that moves forward
- [X] T019 [US1] Reject unknown flags in src/commands/roadmap.ts through the shared flag-refusal helper the other commands use, so a typo is refused rather than ignored
- [X] T020 [P] [US1] Test that `roadmap add` creates exactly one file, leaves the law table untouched and creates no branch, in test/change/roadmap.test.ts
- [X] T021 [P] [US1] Test the listing order — horizons now/next/later, alphabetical within, empty horizons omitted — in test/change/roadmap.test.ts
- [X] T022 [P] [US1] Test the in-flight count against a fixture holding both planned and open changes, in test/change/roadmap.test.ts
- [X] T023 [P] [US1] Test the empty-roadmap output and the four `roadmap add` refusals in test/change/roadmap.test.ts
- [X] T024 [P] [US1] Test that an unparseable change file is skipped by the listing rather than crashing it, in test/change/roadmap.test.ts

**Checkpoint**: US1 is shippable on its own — a roadmap that lives in the brain, with no tracker and no promotion.

---

## Phase 4: User Story 2 — Start a recorded intention without duplicating it (Priority: P2)

**Goal**: `change new` on a planned slug promotes the file that is already there, reserving the id at that moment, and every later lifecycle step refuses a change that has not started.

**Independent test**: record an intention, edit its body by hand, start it, and confirm one file exists for the slug, that it is open, that the hand-written prose is byte-identical and that an id was reserved at promotion.

- [X] T025 [US2] Replace `cmdNew`'s unconditional refusal on an existing change path in src/commands/change.ts with a read: a planned file is promoted, a file in any other state keeps the existing refusal
- [X] T026 [US2] Implement promotion inside `cmdNew`'s existing `withLawLock` section in src/commands/change.ts — load the planned file, set status to `open`, reserve the id, record it in `invariants.adds` without discarding a hand-written entry, save, and commit under a message naming the promotion
- [X] T027 [US2] Print the promotion in src/commands/change.ts — `promoted <path> — planned since it was recorded, now open` in place of `created`, followed by the reservation line and the three edits exactly as they print today
- [X] T028 [US2] Say that a title argument is ignored on promotion in src/commands/change.ts, because the body already carries the one recorded with the intention
- [X] T029 [US2] Call `assertStarted` at the top of `cmdPlan`, `cmdApply`, `cmdLand` and `cmdClose` in src/commands/change.ts, after the change loads and before any other work
- [X] T030 [P] [US2] Test that promotion leaves exactly one file for the slug, flips it to open and preserves the body byte for byte, in test/change/roadmap.test.ts
- [X] T031 [P] [US2] Test that no id is reserved by `roadmap add` and one is reserved at promotion, by reading `.multivac/invariants.md` before and after each, in test/change/roadmap.test.ts
- [X] T032 [P] [US2] Test that `change new` on a slug with no planned file behaves exactly as before, in test/change/roadmap.test.ts
- [X] T033 [P] [US2] Test that `change plan`, `apply`, `land` and `close` each refuse a planned change with the message naming `change new`, in test/change/roadmap.test.ts

**Checkpoint**: intention and implementation are one document with one history.

---

## Phase 5: User Story 3 — A roadmap never delays a release (Priority: P3)

**Goal**: planned changes are invisible to every check that refuses a release or a landing, and no refusal anywhere cites absence from the roadmap.

**Independent test**: with several planned changes and no open change, `verify --strict` reports zero unclosed changes and exits 0; adding more planned changes does not move the number.

- [X] T034 [US3] Make the open-only skip in `openChangeClaims` in src/commands/verify.ts deliberate rather than incidental — keep the comparison as it is and state in the comment that a planned change contributes neither a pending claim nor a landed repo, citing MV-89
- [X] T035 [P] [US3] Test that `verify --strict` reports zero unclosed changes with planned changes present and no open change, in test/change/roadmap.test.ts
- [X] T036 [P] [US3] Test that adding planned changes does not change the blocking count, in test/change/roadmap.test.ts
- [X] T037 [P] [US3] Test that a planned change contributes no pending claim even when its frontmatter declares one by hand, in test/change/roadmap.test.ts

**Checkpoint**: the roadmap is safe to fill.

---

## Phase 6: The law

**Purpose**: the row lands in the same change as the behaviour, and its anchors resolve against the code.

- [X] T038 Write MV-89's statement into .multivac/invariants.md — a change may exist before it starts; planned reserves no id, opens no branch and never counts as unclosed; starting one promotes the file already there
- [X] T039 Anchor MV-89 to the widened status union and the horizon validation in src/change/file.ts
- [X] T040 Anchor MV-89 to `scaffoldPlanned` and `assertStarted` in src/change/file.ts
- [X] T041 Anchor MV-89 to the promotion branch in src/commands/change.ts and to the `assertStarted` calls, with the count the four call sites require
- [X] T042 Anchor MV-89 to the open-only skip in src/commands/verify.ts, the leg that makes a planned change non-blocking
- [X] T043 Anchor MV-89 to src/commands/roadmap.ts and to test/change/roadmap.test.ts
- [X] T044 Write MV-89's `absent` leg over `brain:src/**` for a refusal citing absence from the roadmap, so the sentence cannot be introduced without the law failing
- [X] T045 Run `node dist/cli.js verify` and confirm MV-89 resolves with every leg ok and 0 blocking broken

---

## Phase 7: Documentation

**Purpose**: the site documents the tool as it is. A state the docs do not mention is a state nobody finds.

- [X] T046 [P] Document the state in front of the lifecycle in site/content/docs/concepts/the-change.md — what planned is, what it reserves, and why it never blocks a release
- [X] T047 [P] Document recording an intention and starting it later in site/content/docs/guide/running-changes.md, including the promotion of a hand-edited body
- [X] T048 [P] Document the `roadmap` command, its `add` form, its `--horizon` flag and its output in site/content/docs/reference/commands.md
- [X] T049 Add the CHANGELOG.md entry naming the new state, the new command and the law row

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T050 Run `pnpm test` and confirm every test passes, from the worktree root
- [X] T051 Run `node dist/cli.js verify --strict` and confirm it exits 0 with MV-89 resolving
- [X] T052 Walk quickstart.md end to end in a scratch checkout and confirm every scenario produces the output contracts/cli-output.md specifies
- [X] T053 Confirm the runtime dependency count is still two and that no command added here reaches the network

---

## Dependencies

- Phase 2 (T002–T010) blocks every user story: no command can read a state the file cannot hold.
- US1 (T011–T024) depends only on Phase 2. It is the MVP and ships alone.
- US2 (T025–T033) depends on Phase 2. It does not depend on US1 — promotion works whether or not the listing exists — but shipping it without US1 would leave a state nothing can create.
- US3 (T034–T037) depends only on Phase 2.
- Phase 6 (the law) depends on the code its anchors point at: T039–T043 follow the phases that create those lines.
- Phase 7 and Phase 8 come last.

## Parallel execution

Within Phase 2, T009 and T010 are independent test tasks over one new file — write them together, in that file.

US1, US2 and US3 touch different source files (`roadmap.ts`, `change.ts`, `verify.ts`) and can be built concurrently once Phase 2 lands. They share one test file, which is the one place they serialise.

Inside each story the `[P]` test tasks are independent of each other and of nothing else once their implementation tasks are done.

Phase 7's three site documents are independent files: T046, T047 and T048 in parallel.

## Implementation strategy

Ship US1 first and stop there if the day runs out: a roadmap that records and lists intentions is useful with nothing else built. US2 turns it from a list into a lifecycle. US3 is the safety property that lets an operator fill the list without fear, and it is mostly a test and a comment because the code already behaves.

---

## Phase 9: Convergence

Two gaps found assessing the code against the spec. Both are `partial`: the
behaviour exists and is unpinned.

- [X] T054 Test that `roadmap add` refuses a slug already archived, naming the archive path, per FR-010 (partial) in test/change/roadmap.test.ts
- [X] T055 Test that the roadmap command reaches no network — no fetch, no http import, no request — per FR-015 (partial) in test/change/roadmap.test.ts

---

## Phase 10: Convergence (second pass)

One gap the first pass missed, because the spec never named the skill: the
projected skill is what an agent loads to learn the tool, and a command it does
not name is a command nobody runs.

- [X] T056 Document the planned state and the roadmap command in skills/multivac/SKILL.md, in the steady-state rhythm (missing)
- [X] T057 Document the state, promotion and the never-a-precondition rule in skills/multivac/references/change.md (missing)
