# Tasks: A declared grapher leaves a graph, or close refuses

**Input**: Design documents from `specs/015-the-graph-is-a-gate-not-a-suggestion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

**Tests**: included — the constitution requires tests to ship with behaviour.

**Organization**: grouped by user story. US1 alone is the gate.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` is green and `node dist/cli.js verify` reports 0 blocking broken before any edit

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Add `grapherAuto` to the `Config` interface in src/types.ts, documented with its yml key the way `sddAuto` is
- [X] T003 Parse `grapher_auto` in src/lib/config.ts through the same boolean path `sdd_auto` uses, defaulting to true and failing on a non-boolean
- [X] T004 Add the per-root verdict type and `graphGate(brain, cfg, slug, noGrapher)` to src/adapters/refresh.ts, returning `{ ok, lines }` the way `sddGate` does
- [X] T005 [P] Test that `grapher_auto` parses, defaults to true and refuses a non-boolean, in test/change/grapher-gate.test.ts

**Checkpoint**: the switch exists and the gate function is callable. Nothing calls it yet.

---

## Phase 3: User Story 1 — Closing tells me the graph is missing (Priority: P1) 🎯 MVP

**Goal**: `change close` refuses while a declared, present root has no graph, naming every offender at once.

**Independent test**: delete the graph in one declared repo, close a change, confirm the refusal names that repo and the command that builds one there.

- [X] T006 [US1] Run the build-where-missing pass inside `graphGate` before evaluating, in src/adapters/refresh.ts, so the first close in a fresh ecosystem builds rather than refuses
- [X] T007 [US1] Compute one verdict per root in `graphGate` in src/adapters/refresh.ts — satisfied, missing, unevaluable, out-of-scope — over `graphScopes(brain, cfg)` and no second enumeration
- [X] T008 [US1] Emit the missing-root refusal in src/adapters/refresh.ts: a count line, one line per offending root naming its artifact and run command, per contracts/cli-output.md
- [X] T009 [US1] Emit the two escape hatches on the line after any refusal in src/adapters/refresh.ts, in the wording `sddGate` already uses
- [X] T010 [US1] Call the gate from `cmdClose` in src/commands/change.ts before the archive, returning 1 on refusal, beside the existing SDD gate call
- [X] T011 [US1] Add `--no-grapher` to the `change` flag loop and usage in src/commands/change.ts, and thread it to `cmdClose`
- [X] T012 [US1] Honour `grapher_auto: false` and `--no-grapher` in `graphGate` in src/adapters/refresh.ts, each stating out loud that the gate was skipped
- [X] T013 [P] [US1] Test that close refuses with two ungraphed roots, naming both in one message with their commands, in test/change/grapher-gate.test.ts
- [X] T014 [P] [US1] Test that close proceeds when every root holds a graph, in test/change/grapher-gate.test.ts
- [X] T015 [P] [US1] Test that a declared but absent repo is not counted as a gap, in test/change/grapher-gate.test.ts
- [X] T016 [P] [US1] Test both switches: close proceeds and says the gate was skipped, in test/change/grapher-gate.test.ts
- [X] T017 [P] [US1] Test that the change file is still present and unarchived after a refusal, in test/change/grapher-gate.test.ts

**Checkpoint**: US1 ships alone — declaring a grapher now obliges something.

---

## Phase 4: User Story 2 — A gate that cannot be evaluated refuses (Priority: P2)

**Goal**: an absent binary refuses; an unverified adapter does not.

- [X] T018 [US2] Refuse in `graphGate` when the declared adapter's binary is not on PATH, naming the binary and the install hint, in src/adapters/refresh.ts
- [X] T019 [US2] Report an unverified adapter with the fields to declare and refuse nothing, in src/adapters/refresh.ts
- [X] T020 [P] [US2] Test that an absent binary refuses the close, naming binary and install hint, in test/change/grapher-gate.test.ts
- [X] T021 [P] [US2] Test that an unverified adapter name reports and does not refuse, in test/change/grapher-gate.test.ts

---

## Phase 5: User Story 3 — Out of scope is not a gap (Priority: P3)

**Goal**: a repo opted out, or an ecosystem with no grapher, is quiet.

- [X] T022 [US3] Word the out-of-scope verdict in src/adapters/refresh.ts with the line `doctor` already uses, and exclude it from the refusal count
- [X] T023 [P] [US3] Test that a repo with `grapher: none` closes clean and is described as out of scope, in test/change/grapher-gate.test.ts
- [X] T024 [P] [US3] Test that an ecosystem with no grapher declared prints nothing about graphs at close, in test/change/grapher-gate.test.ts

---

## Phase 6: User Story 4 — The agent is told the graph is there (Priority: P2)

**Goal**: a declared grapher reaches the projected door.

- [X] T025 [US4] ~~Add the optional query-verb field to the grapher registry entry~~ — already there: `GrapherQuery` and the `queries` field, with graphify's three verbs
- [X] T026 [US4] ~~Fill that field for graphify~~ — already filled, and verified against the shipped binary rather than its `--help`
- [X] T027 [US4] Widen `grapherLines(config)` in src/doors/brain.ts to take the grapher name that applies, so one rendering serves both doors and neither can drift from the other
- [X] T028 [US4] Carry that block into the consumer door in src/doors/consumer.ts, resolved per repo — the override first, the ecosystem's otherwise — and pass the repo key from both callers in src/commands/doors.ts and src/commands/change.ts
- [X] T029 [P] [US4] Test that a sibling repo's door names the tool, its artifact and its verbs, in test/change/grapher-gate.test.ts
- [X] T030 [P] [US4] Test that a repo with its own grapher override gets THAT tool in its door, in test/change/grapher-gate.test.ts
- [X] T031 [P] [US4] Test that a repo opted out with `grapher: none` gets no graph block, in test/change/grapher-gate.test.ts

---

## Phase 7: The refresh reaches every declared repo (FR-014)

- [X] T032 Delete `cmdClose`'s hand-rolled scope list in src/commands/change.ts and call `graphScopes(brain, cfg)` instead
- [X] T033 [P] Test that a repo the change never declared is still refreshed at close, in test/change/grapher-gate.test.ts

---

## Phase 8: The law

- [X] T034 Write MV-90's statement into .multivac/invariants.md — a declared grapher leaves a graph in every declared, present root or close refuses; existence never freshness; two switches; an unevaluable gate refuses and an unverified adapter does not
- [X] T035 Amend MV-87 in place with a dated correction: reaching every root is now required at close, and the refresh covers every declared root rather than the repos a change touched
- [X] T036 Anchor MV-90 to `graphGate` and the verdict type in src/adapters/refresh.ts
- [X] T037 Anchor MV-90 to the gate call and `--no-grapher` in src/commands/change.ts
- [X] T038 Anchor MV-90 to `grapher_auto` in src/lib/config.ts and src/types.ts
- [X] T039 Anchor MV-90 to `projectGraphLines` in src/doors/brain.ts and the registry field in src/adapters/registry.ts
- [X] T040 Anchor MV-90 to test/change/grapher-gate.test.ts
- [X] T041 Write MV-90's `absent` leg over src/commands/{verify,doctor,doors}.ts for `graphGate`, so the gate cannot reach the offline commands
- [X] T042 Run `node dist/cli.js verify` and confirm MV-90 resolves with every leg ok

---

## Phase 9: Documentation

- [X] T043 [P] Document close's new refusal and `--no-grapher` in site/content/docs/reference/commands.md
- [X] T044 [P] Document `grapher_auto` in site/content/docs/reference/configuration.md
- [X] T045 [P] Document that a declared grapher now obliges an artifact, and what the door says, in site/content/docs/reference/graphers-and-sdd.md
- [X] T046 Add the CHANGELOG.md entry naming the gate, the switch, the flag, the widened refresh and the door block

---

## Phase 10: Polish

- [X] T047 Run `pnpm test` and confirm every test passes
- [X] T048 Run `node dist/cli.js verify --strict` and confirm exit 0 with MV-90 resolving
- [X] T049 Confirm `verify`, `doctor` and `doors` still spawn no foreign process and reach no network
- [X] T050 Walk quickstart.md and confirm each scenario matches contracts/cli-output.md

---

## Dependencies

Phase 2 blocks everything. US1 is the MVP and depends only on Phase 2. US2 and US3 refine US1's verdict set and depend on T007. US4 is independent of the gate entirely — it touches the registry, the door projection and init, and could ship alone. Phase 7 is independent of all four. Phase 8 follows the code its anchors point at.

## Parallel execution

US4 (T025–T031) touches `registry.ts`, `doors/brain.ts` and `init.ts`; US1–US3 touch `refresh.ts` and `change.ts`; Phase 7 touches `change.ts`. US4 runs concurrently with the rest. They share one test file, which is where they serialise.

Within each story the `[P]` test tasks are independent of each other.

Phase 9's three site documents are independent files: T043, T044 and T045 in parallel.

## Implementation strategy

Ship US1 first: it is the gate, and it is what makes declaring a grapher mean something. US2 and US3 make it honest at the edges. US4 closes the loop by telling the agent the artifact exists — without it the gate enforces something nobody was told to read. Phase 7 is a deletion and can land at any point.

---

## Phase 11: From the analysis pass

Two gaps the cross-artifact pass found before implementation.

- [X] T051 Test that a stale-but-present graph does not refuse, pinning FR-012's existence-not-freshness boundary in test/change/grapher-gate.test.ts
- [X] T052 Exempt `change close --abandon` from the gate in src/commands/change.ts — an abandoned change made no claims and landed nothing, so demanding an artifact from it punishes dropping work; state the exemption in MV-90
- [X] T053 ~~Carry the graph block into the consumer door~~ — folded into T027/T028 once the brain door turned out to already render it
- [X] T054 Anchor MV-90 to the consumer door's graph block in src/doors/consumer.ts
