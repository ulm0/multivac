---

description: "Task list for the-engine-reads-one-way"
---

# Tasks: The engine reads one way

**Input**: Design documents from `specs/033-the-engine-reads-one-way/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dialect.md, quickstart.md

**Tests**: requested. Two of the three defects are false verdicts, so the tests
assert VERDICTS — a refusal, and an identical answer over LF and CRLF twins —
rather than the shape of the code that produces them.

## Phase 1: Setup

- [ ] T001 Baseline: `pnpm run build && pnpm test`, record the count
- [ ] T002 Reproduce all three with the "before" block of quickstart.md

## Phase 2: Foundational

- [ ] T003 Write MV-109 in `.multivac/invariants.md`, and amend MV-05 and MV-53 in place to say what each now covers; anchor MV-109 to the gate, the split, `count`, and their tests

## Phase 3: User Story 1 — a mistyped class is refused (P1)

- [ ] T004 [US1] In `src/lib/regex.ts`, extend the existing character walk with bracket-expression state, so "is this `[:name:]` inside `[…]`" is answerable
- [ ] T005 [US1] Refuse a bare `[:name:]` with grep's own wording, and refuse `(?`, lazy quantifiers, backreferences and alphabetic escapes with no ERE meaning, each naming what is wrong
- [ ] T006 [US1] In `test/helpers/regex.test.ts`, pin every refusal AND every accepted form, including `[[:digit:]x]` inside a larger bracket expression
- [ ] T007 [US1] Prove SC-002 from this brain's own corpus: every anchor in `.multivac/invariants.md` still compiles

## Phase 4: User Story 2 — a CRLF line is a line (P1)

- [ ] T008 [US2] In `src/anchor/match.ts`, split on `/\r?\n/`
- [ ] T009 [US2] In `test/anchor/`, assert an LF file and its CRLF twin produce identical verdicts and identical line numbers

## Phase 5: User Story 3 — `count` reads what `verify` reads (P1)

- [ ] T010 [US3] Export `resolveSources` from `src/commands/verify.ts`
- [ ] T011 [US3] In `src/commands/count.ts`, delete the handle loop and use `resolveSources`, constructing each scanner with the ref it returns
- [ ] T012 [US3] In `src/commands/count.ts`, print the `read` line per repo, the sentence `resolveSources` already produces
- [ ] T013 [US3] In `test/cli/count.test.ts`, assert count and verify agree for a sibling parked off its channel, and that count names what it read

## Phase 6: Polish & Cross-Cutting

- [ ] T014 Update `site/content/docs/guide/writing-anchors.md` and `reference/commands.md` where they state the dialect and what `count` reads
- [ ] T015 `pnpm test` green, any test asserting the old behaviour updated rather than deleted
- [ ] T016 `node dist/cli.js verify`: 0 blocking broken, MV-109 anchored

## Dependencies

- T003 precedes the code (Constitution III).
- T004 blocks T005. T010 blocks T011 and T012.
- The three stories touch different files and are otherwise independent. [P]

## Parallel opportunities

- US1 (`regex.ts`), US2 (`match.ts`) and US3 (`count.ts`) are three files. [P]
- T014 is documentation. [P]

## Implementation strategy

MVP is US1 alone: it is the false green, in a blocking mode, that the gate
exists to prevent. US2 and US3 are the same sentence — one reader, one answer —
applied to lines and to repos.
