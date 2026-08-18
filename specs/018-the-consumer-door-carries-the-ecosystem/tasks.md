# Tasks: A door in a code repo names the ecosystem

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: Foundational

- [X] T002 Add `role?: string` to `RepoEntry` in src/types.ts, documented as declared and never derived
- [X] T003 Parse `role` in `repoEntry()` in src/lib/config.ts, reduced to one line, and add it to the enumerating refusal message
- [X] T004 [P] Test that a role parses, that a multi-line role is reduced to one line, and that its absence is legal, in test/doors/ecosystem.test.ts

## Phase 3: US1 — the ecosystem list 🎯 MVP

- [X] T005 [US1] Add `ecosystemLines(config, repoKey)` to src/doors/consumer.ts building the brain's handle line plus one line per declared repo, marking the current one, with the role when declared
- [X] T006 [US1] Print the list only when more than one repo is declared, in src/doors/consumer.ts
- [X] T007 [P] [US1] Test that every declared repo appears, that the current one is marked, and that a repo absent from disk still appears, in test/doors/ecosystem.test.ts
- [X] T008 [P] [US1] Test that the brain's handle is named, in test/doors/ecosystem.test.ts
- [X] T009 [P] [US1] Test that a role appears when declared and that nothing is invented when it is not, in test/doors/ecosystem.test.ts
- [X] T010 [P] [US1] Test that a single-repo ecosystem prints no list, in test/doors/ecosystem.test.ts

## Phase 4: US2 — the refresh goes first

- [X] T011 [US2] Move the mount refresh to the first instruction in src/doors/consumer.ts, carrying the reason a present mount is not a current one, and keeping the staleness clause
- [X] T012 [P] [US2] Test that the refresh precedes the law, the list and the adapters, in test/doors/ecosystem.test.ts
- [X] T013 [P] [US2] Test that `staleness: block` still adds its clause, in test/doors/ecosystem.test.ts

## Phase 5: US3 — the adapters that apply here

- [X] T014 [US3] Extract the SDD block from `renderBrainDoor` into `sddLines(config, sdd?)` in src/doors/brain.ts, beside `grapherLines`, and call it from the brain door unchanged
- [X] T015 [US3] Call `sddLines` from the consumer door in src/doors/consumer.ts, resolved with the tool that applies to that repo
- [X] T016 [US3] Write the scaffolding clause as what the lifecycle does — runs the tool's own init where missing, or says why it could not — naming no single lifecycle step
- [X] T017 [P] [US3] Test that a sibling door names the declared SDD tool and its flow, in test/doors/ecosystem.test.ts
- [X] T018 [P] [US3] Test that a repo with `sdd: none` gets no SDD block, in test/doors/ecosystem.test.ts
- [X] T019 [P] [US3] Test that the brain's door is unchanged by the extraction, in test/doors/ecosystem.test.ts

## Phase 6: The law

- [X] T020 Write MV-93's statement into .multivac/invariants.md
- [X] T021 Amend MV-61 in place, dated: the graph block is printed by both doors since MV-90, not by the brain door alone
- [X] T022 Amend MV-87 in place, dated: the door is projected per DECLARED repo, present or not, unlike the adapter runs which are present-filtered
- [X] T023 Anchor MV-93 to `ecosystemLines` and the refresh-first line in src/doors/consumer.ts
- [X] T024 Anchor MV-93 to the role parse in src/lib/config.ts, matching the code as written
- [X] T025 Anchor MV-93 to `sddLines` in src/doors/brain.ts and to test/doors/ecosystem.test.ts
- [X] T026 Write MV-93's `absent` leg over the probe call shapes in src/doors/consumer.ts, narrow enough that a comment naming one cannot fail it
- [X] T027 Run `verify` and confirm MV-93 resolves and MV-61's amendment breaks no leg

## Phase 7: Documentation

- [X] T028 [P] Document `role` in site/content/docs/reference/configuration.md
- [X] T029 [P] Document what the consumer door now carries in site/content/docs/concepts/distribution.md
- [X] T030 Add the CHANGELOG entry

## Phase 8: Polish

- [X] T031 Run `pnpm test` and `verify --strict`
- [X] T032 Walk quickstart.md

## Dependencies

Phase 2 blocks US1. US2 and US3 are independent of US1 and of each other. Phase 6 follows the code its anchors point at.

## Parallel execution

US1, US2 and US3 touch the same two door files and one test file, so they serialise there; their test tasks are independent of one another once their implementation lands. T028 and T029 are independent documents.
