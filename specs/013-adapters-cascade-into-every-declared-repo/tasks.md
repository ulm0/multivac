---

description: "Task list for adapters-cascade-into-every-declared-repo"
---

# Tasks: Adapters cascade into every declared repo

**Input**: Design documents from `/specs/013-adapters-cascade-into-every-declared-repo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md — all written

**Tests**: REQUIRED. The constitution's Engineering Constraints say tests ship
with behaviour: "If it branches, loops, parses, or touches git, it ships with a
test." Every task below that adds a branch or a loop has a test task beside it.

**Organization**: Grouped by the three user stories in spec.md, each
independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3, mapping to spec.md
- Exact file paths in every description

## Path Conventions

Single project: `src/` and `test/` at the repository root. `pnpm test` builds
both tsconfigs and runs `node --test dist-test/**/*.test.js`.

---

## Phase 1: Setup

**Purpose**: Know the starting point, so any red later belongs to this change.

- [X] T001 Record the baseline: run `pnpm test` and `node dist/cli.js verify`, and note the counts (tests passing, claims anchored) in the change file `.multivac/changes/adapters-cascade-into-every-declared-repo.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The law row and the per-root primitive every story reads. The law
lands first because Principle III requires the row to change before the code.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 State MV-87 in `.multivac/invariants.md`, replacing the RESERVED text with the rule: a declared adapter is evaluated, acted on and reported PER ROOT — the brain plus every declared repo present on disk — and one root's artifact never answers for another's. Keep it `proposed`; a human enacts at close
- [X] T003 Amend MV-75 in place in `.multivac/invariants.md` with a dated correction: "runs it when the scaffold is missing" never said missing WHERE, and the implementation answered "in the brain, unless any other root has it"
- [X] T004 Amend MV-76 in place in `.multivac/invariants.md` with a dated correction: the project-document gate asks per root, and only of roots where the tool is installed
- [X] T005 [P] Add `sdd?: string` to `RepoEntry` in `src/types.ts`, documented beside the existing `grapher?: string`, with `none` called out as the opt-out
- [X] T006 Parse `repos.<key>.sdd` through `optString` in `repoEntry` in `src/lib/config.ts` and extend that function's refusal message to name the new key
- [X] T007 Resolve the adapter per root in `sddRoots` in `src/adapters/detect.ts`: `SddRoot` gains `sdd?: string` = `entry.sdd ?? cfg.sdd`, with the literal `none` resolving to `undefined`. The brain root takes the ecosystem's `sdd:`
- [X] T008 [P] Test the config key in `test/init/config.test.ts` (or the suite that owns config parsing): absent inherits, a name overrides, `none` resolves to no SDD, a non-string is refused by name
- [X] T009 [P] Test per-root resolution in `test/doctor/adapters.test.ts`: `sddRoots` returns brain plus declared present repos, each carrying its own resolved adapter, and an absent repo is not a root

**Checkpoint**: Every consumer can now ask "which SDD applies here" per root.

---

## Phase 3: User Story 1 - One repo's tooling stops standing in for the ecosystem's (Priority: P1) 🎯 MVP

**Goal**: Every declared, present root that lacks the SDD's artifact gets the
tool's own init; every root that has it is skipped in silence.

**Independent Test**: An ecosystem where exactly one repo carries the artifact
and every other root carries none — one lifecycle run leaves every root
equipped, and the equipped one untouched.

### Tests for User Story 1

- [X] T010 [P] [US1] Test in `test/change/sdd-gates.test.ts`: one repo has the artifact, four roots do not — the four are scaffolded and the one produces no line
- [X] T011 [P] [US1] Test in `test/change/sdd-gates.test.ts`: every root already equipped — nothing runs, nothing is printed
- [X] T012 [P] [US1] Test in `test/change/sdd-gates.test.ts`: a root whose init fails is reported in the tool's own words and the remaining roots are still attempted
- [X] T013 [P] [US1] Test in `test/change/sdd-gates.test.ts`: an init that exits 0 and writes nothing leaves that root reported as still not equipped
- [X] T014 [P] [US1] Test in `test/change/sdd-gates.test.ts`: a repo declaring `sdd: none` is never scaffolded and never named; a declared repo absent from disk is skipped and nothing is created for it
- [X] T015 [P] [US1] Test in `test/change/sdd-gates.test.ts`: `sdd_auto: false` and `--no-sdd` each leave every root untouched
- [X] T048 [P] [US1] Test in `test/change/sdd-gates.test.ts`: an adapter that declares no scaffold (opsx) states the gap once per root that lacks the artifact, naming the root and the install hint, and runs nothing — FR-013, which guards Principle V

### Implementation for User Story 1

- [X] T016 [US1] Rewrite `runScaffold` in `src/adapters/sdd.ts` to loop the roots: no early return on another root's artifact, and the init runs in each root that needs it rather than in `roots[0]`
- [X] T017 [US1] Keep the binary-absent check outside the loop in `src/adapters/sdd.ts` — one fact about the machine, said once, per contracts/cli-output.md
- [X] T018 [US1] Scope every message in `runScaffold` in `src/adapters/sdd.ts` to its root, matching the shapes in `specs/013-adapters-cascade-into-every-declared-repo/contracts/cli-output.md`
- [X] T019 [US1] Judge each root by its artifact, never by exit code, in `src/adapters/sdd.ts`, and continue to the next root after a failure
- [X] T049 [US1] Scope the no-declared-scaffold branch in `runScaffold` in `src/adapters/sdd.ts` to the root: one gap line per root lacking the artifact, still guessing no command (FR-013)
- [X] T020 [US1] Add the MV-87 anchors for the scaffold loop to `.multivac/invariants.md`, targeting `brain:src/adapters/sdd.ts` and the tests above

**Checkpoint**: The cascade works and is pinned. This alone is the MVP.

---

## Phase 4: User Story 2 - The report names the repo it is talking about (Priority: P2)

**Goal**: `doctor` reports the SDD per scope, and the project-document gate asks
per root.

**Independent Test**: In a mixed ecosystem, `doctor` prints one line per
declared, present root, and `change plan` refuses naming every root that lacks
the document.

### Tests for User Story 2

- [X] T021 [P] [US2] Test in `test/doctor/adapters.test.ts`: one repo equipped and four not — `doctor` prints one SDD line per root, each with its own verdict, and never reports a root on another root's files
- [X] T022 [P] [US2] Test in `test/doctor/adapters.test.ts`: the project-level document is reported per root, and a root with `sdd: none` gets the no-SDD line rather than a deficiency
- [X] T023 [P] [US2] Test in `test/doctor/adapters.test.ts`: the tool-level lines (the flow, which lifecycle commands gate) are still printed once, not per root
- [X] T024 [P] [US2] Test in `test/change/sdd-gates.test.ts`: two roots lack the constitution — `change plan` refuses and names both
- [X] T025 [P] [US2] Test in `test/change/sdd-gates.test.ts`: a root where the tool is not installed is not asked for the document and does not cause a refusal
- [X] T026 [P] [US2] Test in `test/change/sdd-gates.test.ts`: MV-76's two other refusals — empty, and still-the-unfilled-template — keep their exact sentences and gain the root's name

### Implementation for User Story 2

- [X] T027 [US2] Rewrite `sddLines` in `src/commands/doctor.ts` to loop the roots the way `grapherLines` in the same file already does: one artifact verdict per scope, the install/scaffold hint named per scope
- [X] T028 [US2] Keep `flowLines` and the gate summary printed once in `src/commands/doctor.ts` — they describe the adapter, not a checkout
- [X] T029 [US2] Report the project-level document per root in `projectDocLines` in `src/commands/doctor.ts`, and print the no-SDD line for a root that resolves to none
- [X] T030 [US2] Rewrite the project-document pass in `sddGate` in `src/adapters/sdd.ts` to ask every root where the tool is installed, refusing while any lacks it and naming each
- [X] T031 [US2] Pin `doctor`'s offline boundary rather than eyeballing it: assert against the existing MV-01 coverage that the per-scope SDD pass spawns no process (Principle IV) — a `stat` per root, as `grapherLines` does today
- [X] T032 [US2] Add the MV-87 and MV-76 anchors for the per-scope report and the per-root gate to `.multivac/invariants.md`

**Checkpoint**: The operator can name the unequipped repos from the output alone.

---

## Phase 5: User Story 3 - A declared repo that no change has touched still has a graph (Priority: P3)

**Goal**: Every declared, present repo without a graph gets its first build from
the change lifecycle.

**Independent Test**: An ecosystem where only the brain has a graph — one
lifecycle run leaves every declared, present repo with one.

### Tests for User Story 3

- [X] T033 [P] [US3] Test in `test/change/grapher-refresh.test.ts`: a scope with no artifact is BUILT with `create ?? refresh`; a scope with one is refreshed, as today
- [X] T034 [P] [US3] Test in `test/change/grapher-refresh.test.ts`: declared, present repos with no graph are all built, named by scope, including repos no change touched
- [X] T035 [P] [US3] Test in `test/change/grapher-refresh.test.ts`: a second run builds nothing — every artifact now exists
- [X] T036 [P] [US3] Test in `test/change/grapher-refresh.test.ts`: a scope whose grapher binary is missing reports the install hint, builds nothing, and does not fail the lifecycle

### Implementation for User Story 3

- [X] T037 [US3] Choose the command by artifact presence in `refreshGraph` in `src/adapters/refresh.ts`: `spec.create ?? spec.refresh` when the scope has none, `spec.refresh` when it does, and word the line "built" versus "refreshed" to match
- [X] T038 [US3] Call the graph ensure over every declared, present scope in `src/commands/change.ts` at BOTH points `runScaffold` already runs — `cmdNew` and the plan path — skipping scopes that already have an artifact. Calling it twice is self-limiting: the first call builds, the second finds the artifact and skips
- [X] T039 [US3] Leave the existing close-time refresh loop in `src/commands/change.ts` behaving as it does today for repos the change touched
- [X] T040 [US3] Add the MV-87 anchor for the first build to `.multivac/invariants.md`, targeting `brain:src/adapters/refresh.ts` and the tests above

**Checkpoint**: All three stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T041 [P] Document `repos.<key>.sdd` and its `none` opt-out in `site/content/docs/reference/configuration.md`
- [X] T042 [P] Update the `doctor` output in `site/content/docs/reference/commands.md` to the per-scope SDD lines
- [X] T043 [P] Update `site/content/docs/reference/integrations.md` where it describes where the scaffold runs
- [X] T044 [P] Record the per-root rule in `DESIGN.md` beside the existing adapter section
- [X] T045 Run `pnpm test` — every test green, including the ones added here
- [X] T046 Run `node dist/cli.js verify` — every claim anchored, `0 blocking broken`, MV-87's legs resolving against the code that just landed
- [X] T047 Walk `specs/013-adapters-cascade-into-every-declared-repo/quickstart.md` §3 against a real multi-repo brain: `doctor` before and after, then one lifecycle run, then a second run that is silent

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: after Setup — BLOCKS all three stories, because
  every one of them reads the per-root adapter resolution from T007
- **US1 (Phase 3)**: after Foundational. No dependency on US2 or US3
- **US2 (Phase 4)**: after Foundational. Its gate half (T030) reads "is the tool
  installed here", which US1 is what makes true in practice — but the code
  dependency is only on T007, so US2 is implementable and testable alone
- **US3 (Phase 5)**: after Foundational. Fully independent of US1 and US2 —
  different adapter kind, different files
- **Polish (Phase 6)**: after the stories that are being shipped

### Within Each Story

- Tests first, and they must fail before the implementation task lands
- The anchor task is last in each story: an anchor for code that is not there
  yet is a broken leg, and `verify` runs on every commit

### Parallel Opportunities

- T005 and T008/T009 touch different files from T006/T007 and are marked [P]
- Every test task inside a story is [P] against the others in that story
- US1, US2 and US3 can proceed in parallel once Phase 2 is done — they touch
  `sdd.ts`, `doctor.ts` and `refresh.ts` respectively, with US2's gate change and
  US1's scaffold change being the only pair sharing a file (`sdd.ts`, different
  functions)
- All of Phase 6's documentation tasks are [P] against each other

---

## Parallel Example: User Story 1

```bash
# The tests for US1, written together, all failing before T016:
Task: "one repo equipped, four not — the four are scaffolded"      # T010
Task: "every root equipped — silence"                              # T011
Task: "a failing init does not stop the remaining roots"           # T012
Task: "exit 0 with no artifact is not equipped"                    # T013
Task: "sdd: none is never scaffolded; an absent repo is skipped"   # T014
Task: "sdd_auto: false and --no-sdd leave every root untouched"    # T015
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup — know the baseline
2. Phase 2: Foundational — the row, then the per-root primitive
3. Phase 3: US1 — the cascade
4. **STOP and VALIDATE**: run quickstart §3 against a real brain. If one
   lifecycle run equips every root where today it equips none, the MVP is real
5. US2 and US3 are each a separate, shippable increment on top

### Incremental Delivery

1. Foundational → every consumer can ask per root
2. + US1 → the cascade works (MVP)
3. + US2 → the operator can see that it worked, and the gate stops accepting one
   repo's constitution for six
4. + US3 → a repo can be navigated before it is worked on
5. Polish → docs, then `verify`, then the hand check

---

## Notes

- Task IDs are stable, not positional: T048 and T049 sit in Phase 3 because
  `/speckit.analyze` found FR-013 uncovered, and renumbering 30 tasks to make
  the digits sequential would only invalidate every reference to them.
- The law row lands in Phase 2 and is enacted by a human at `change close`, not
  by any task here (Principle III; MV-26).
- Anchors are added as the code they name lands, never before: `verify` runs in
  the pre-commit hook and a leg pointing at absent code is a broken claim.
- Nothing in this list adds a runtime dependency, a module, or a subprocess
  outside the change lifecycle. If a task seems to need one, it is the wrong
  task — see `research.md` for the alternatives already rejected on those
  grounds.
</content>

---

## Phase 7: Convergence

- [X] T050 Add an MV-87 `absent` leg over `brain:src/commands/{verify,doctor,doors}.ts` for `(ensureGraphs|runScaffold)` in `.multivac/invariants.md`, so the offline boundary is pinned by the law rather than by reading the imports per FR-012 (partial)
- [X] T051 Have `grapherLines` in `src/commands/doctor.ts` call `graphScopes` from `src/adapters/refresh.ts` instead of enumerating the scopes itself, per plan: "the same list doctor reports over" (partial)
