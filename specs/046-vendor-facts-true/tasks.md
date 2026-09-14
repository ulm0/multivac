---

description: "Task list for vendor-facts-true"
---

# Tasks: Vendor facts are true

**Input**: Design documents from `specs/046-vendor-facts-true/`

**Where the work happens**: in the checkout `change apply vendor-facts-true`
prints (the change worktree, on branch `vendor-facts-true`). Exact wording for
each copy is in research.md R1–R4, and the legs are in R5.

**Tests first**: the only runtime change is `doctor`'s clause text, and the
registry notes are data read by tests. Each assertion is edited or added and
seen failing before the code or note it pins. New test text must never spell a
retired phrase literally, because MV-121's legs read `test/**`.

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build`, `node dist/cli.js verify --strict` (0 blocking broken), `node --test "dist-test/**/*.test.js"` all green. Record `multivac count` for legs 1–4 in research.md R5: 17, 3, 2, 1
- [X] T002 `node dist/cli.js change apply vendor-facts-true`; check the branch is `vendor-facts-true`, and link `node_modules` there (untracked) if the worktree lacks it

## Phase 2: Foundational — the law moves first (Principle III)

- [X] T003 Replace the RESERVED MV-121 row in .multivac/invariants.md with the stated rule (research R6 draft): authority `specified`, state `proposed`, date 2026-09-14, source `changes/vendor-facts-true.md`; ≤ ~400 words, no pipe, and no literal `Amended 2026-09-14 by MV-121`
- [X] T004 Add MV-121's five legs under its row in .multivac/invariants.md, exactly as research R5
- [X] T005 MV-51 in .multivac/invariants.md: append the `**Amended 2026-09-14 by MV-121**` note withdrawing "which reaches the network" (clause stays visible)
- [X] T006 MV-75 in .multivac/invariants.md: append the note withdrawing "because that command reaches the network and MV-01 binds them" and stating the replacement reason; its `absent` leg over `{verify,doctor,doors}.ts` is untouched
- [X] T007 MV-61 in .multivac/invariants.md: append the note withdrawing the help-output example and keeping the rule; delete the present leg `/absent from `graphify --help`/` (was :443)

## Phase 3: US1 — the scaffold's stated reason is true (P1)

- [X] T008 [US1] Test first: test/doctor/doctor.test.ts:142 asserts `doctor never does \(it writes the vendor's files into the tree\)`; rewrite the doc comment at :126. Build and run the file: it fails
- [X] T009 [US1] src/commands/doctor.ts:225 prints the new clause; rewrite the comment at :218-220. T008 passes
- [X] T010 [P] [US1] src/adapters/sdd.ts: runScaffold doc :224-225 and the comment at :256 give the replacement reason
- [X] T011 [P] [US1] src/adapters/registry.ts:452 speckit scaffold note: the replacement reason, "only the change lifecycle runs it" kept
- [X] T012 [P] [US1] test/change/sdd-gates.test.ts: comments :85-86, :693, :865 give the replacement reason; fixtures :717/:721, :888/:897 and :972 become `error: permission denied`, with each stub and its assertion edited together (FR-011)
- [X] T013 [P] [US1] site/content/docs/reference/graphers-and-sdd.md:375-376 gives the replacement reason; the transcript at :381 and site/content/docs/reference/configuration.md:463 carry the new clause verbatim
- [X] T014 [US1] `multivac count` on leg 1 reads 0; the lifecycle scaffold tests in sdd-gates.test.ts pass with no change to what they assert about who runs the init (SC-004)

## Phase 4: US2 — an entry names the network its tool reaches (P1)

- [X] T015 [US2] Test first in test/doctor/adapters.test.ts: extend `codegraph names its telemetry…` to also match `CODEGRAPH_TELEMETRY=0`, `DO_NOT_TRACK=1`, `GitHub Releases`, `CODEGRAPH_NO_DOWNLOAD=1`; add `opsx names its telemetry, because the gates run openspec validate` matching `edge\.openspec\.dev`, `openspec validate`, `registry\.npmjs\.org`, `OPENSPEC_TELEMETRY=0`, `DO_NOT_TRACK=1`. Both fail
- [X] T016 [US2] src/adapters/registry.ts:433 opsx note: the telemetry on every command, validator included, the npm check on `update`, and both opt-outs (research R3). It must not use MV-62's two `unique` phrases
- [X] T017 [US2] src/adapters/registry.ts:625 codegraph note: 1.6.0's never-collected list, `codegraph telemetry off` (or `CODEGRAPH_TELEMETRY=0`, or `DO_NOT_TRACK=1`), and the shim's GitHub Releases fallback with `CODEGRAPH_NO_DOWNLOAD=1`. `TELEMETRY IS ON BY DEFAULT` and `codegraph telemetry off` each stay exactly once in the file. T015 passes
- [X] T018 [US2] Read both notes: neither says multivac sets or applies an opt-out (FR-008)

## Phase 5: US3 — MV-61 states graphify's help as it is (P2)

- [X] T019 [P] [US3] src/adapters/registry.ts:584-588 comment and :604 note (research R2)
- [X] T020 [P] [US3] site/content/docs/reference/graphers-and-sdd.md:117-119 (research R2)
- [X] T021 [US3] `multivac count` on leg 2 reads 0; MV-61's remaining legs are green under `verify --strict`

## Phase 6: US4 — the remaining vendor notes match the tool (P3)

- [X] T022 [US4] src/adapters/registry.ts:433 opsx note, in the same edit as T016, and the callout at site/content/docs/reference/graphers-and-sdd.md:335-336: no five-verb list; the steps stay chat commands, and multivac runs only `openspec validate` (research R4)
- [X] T023 [US4] src/adapters/registry.ts:446-451 speckit comment: the three measured `.claude/settings.json` outcomes on specify 1.0.6 (research R4)
- [X] T024 [US4] `multivac count` on legs 3 and 4 reads 0

## Phase 7: US5 — the rule is law, with its limits stated (P3)

- [X] T025 [US5] Re-read MV-121 against the landed edits. The rule, the evidence and the ceilings are there. Its word count is ≤ ~400, and leg 5 reads 4
- [X] T026 [US5] Bite run in a scratch clone of the branch, never this repository: MV-121 set to `active`, the change file moved aside. Restore one retired phrase per leg 1–4 and remove one note for leg 5; each gives exit 1 on its leg (SC-006)

## Phase 8: Polish and verification

- [X] T027 MV-111 copy sweep beyond the legs' reach. Run `git grep -nE 'reaches the network|download|help output|--help|offline|MV-01|no network|network access'` outside `specs/`, `.multivac/changes/`, `CHANGELOG.md` and `docs/`, and classify every hit. The only vendor-fact hits left should be the `roadmap sync` copies (tracker.ts:14, roadmap.ts:169/:286, configuration.md:182, MV-99) and the WITHDRAWN clauses in MV-51/MV-61/MV-75 with their notes. The first run used the narrow pattern and missed `registry.ts:276`; T030 fixed it
- [X] T028 `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking broken, MV-121 `proposed`), then `node --test "dist-test/**/*.test.js"`, all green (SC-005). Commit by pathspec: the 9 files, the change file and specs/046-vendor-facts-true/{spec,plan,research,tasks}.md, never graphify-out/
- [X] T029 /speckit.converge until Converged; fix any drift on the branch (/speckit.analyze runs before implementing, as `change apply` prints)

## Phase 9: Review fixes

- [X] T030 `registry.ts:276`: the `scaffold` field doc cites MV-75 and the new reason instead of "which MV-01 keeps offline"; research R1 lists it, and the spec, plan and change file count 14 copies plus MV-51 and MV-75
- [X] T031 MV-87 in .multivac/invariants.md: a `**Amended 2026-09-14 by MV-121**` note scopes its MV-01 citation to the grapher's first build; the change file touches MV-87 and leg 5 reads 4
- [X] T032 MV-121 narrowed to Principle V's scope (commands multivac runs from an entry, citing MV-62), the version named by the entry or row, the count and the settings quote corrected; the change file's claim matches
- [X] T033 Leg 1 carries MV-51's and MV-75's withdrawn wording and `` `doors`, which MV-01 keeps ``, and its `downloads` branch names the scaffold's own subjects; leg 2 carries "lists only install"; every leg skips `.claude/skills/speckit-*/**`. Dry-run: 14, 3, 2, 1 at 8401c9a; 0, 0, 0, 0, 4 after
- [X] T034 Copies that state the revert name specify 1.0.6 (sdd.ts, sdd-gates.test.ts ×2); the site page, which MV-84 keeps free of version strings, says a re-run "can revert" and leaves the version to the registry note and MV-75; the settings comment states the measured pruning of empty hook entries; the codegraph note and its test name the MCP server's update check with `CODEGRAPH_NO_UPDATE_CHECK`
- [X] T035 Re-run the bite (T026) with the new legs, including MV-51's and MV-75's wording, the field doc's wording and "lists only install"; each gives exit 1

## After the tasks — the lifecycle, not the ledger

1. Merge `--no-ff`, then `change land vendor-facts-true --landed brain`.
2. `change close vendor-facts-true`: walk the ritual, and commit the archive with
   the pathspec it prints.
3. Enactment of MV-121 (alone in its own commit, MV-81) and any push belong to
   the human.

## Dependencies

- T002 precedes every edit, and T003–T007 precede every copy edit.
- T008 precedes T009, and T015 precedes T016 and T017.
- T016 and T022 are one edit of `registry.ts:433`.
- T011, T016/T022, T017, T019 and T023 all touch `registry.ts`, so they run in
  sequence despite [P] against other files.
- T013, T020 and T022's callout all touch `graphers-and-sdd.md`, so they run in
  sequence.
- T014, T021, T024 and T025 follow their phase's edits. T026–T029 come last.

## Parallel opportunities

- T010, T012 and T013 touch different files from each other and from T009.
- Phases 3–6 are independent, except for the shared files noted above.

## Implementation strategy

US1 and US2 are P1. US1 is the reason every operator is told, and US2 is a
Principle V breach already in force. US3 and US4 are single notes. US5's legs
describe every edit, so the change lands only as a whole.

> T002 and T029 were closed in the real lifecycle (2026-09-14): `change apply` created the worktree on branch `vendor-facts-true`; the reviewed prep commit cherry-picked cleanly, `verify --strict` 0 blocking, suite 588/588, and the stage-4 verifier plus the stage-5b spec/plan/tasks fidelity review found no remaining gap — converged.
