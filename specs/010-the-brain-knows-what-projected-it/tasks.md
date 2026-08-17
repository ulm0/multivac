---

description: "Task list for the-brain-knows-what-projected-it"
---

# Tasks: A brain knows what projected it

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/notice.md](./contracts/notice.md), [quickstart.md](./quickstart.md)

---

## Phase 1: Foundational

- [X] T001 `src/lib/version.ts`: read the record and the floor, compare three
      integers, return `{ level, line } | null`. No dependency — `yaml` is
      already present. A malformed floor is refused by name (FR-010).
- [X] T002 Colour via `src/lib/out.ts`'s existing `red`/`yellow`, which already
      honour `NO_COLOR` and a non-TTY. The line must read correctly without them.

## Phase 2: US1 + US2 — the notice (P1)

- [X] T003 [US1] Call it once from `main()` in `src/cli.ts`, before the command
      runs — one call site, not nine (research D5). Stderr.
- [X] T004 [US2] The three severities and the absent-record case, per
      `contracts/notice.md`. Red outranks yellow.
- [X] T005 [US1] `init` writes `.multivac/projected.yml` with the running
      version at creation.

## Phase 3: US3 — only the explicit act (P2)

- [X] T006 [US3] `doors --adopt`: re-project, then record. Declare the flag so
      MV-85's refusal covers a typo of it.
- [X] T007 [US3] Confirm bare `doors` leaves the file byte-identical and the
      notice standing. **This is the decision the design turns on** — if it
      restamps, the notice goes quiet without the upgrade being taken.

## Phase 4: Tests

- [X] T008 `test/cli/version-skew.test.ts`: walk the registry — with a stale
      record every command prints the notice, and **no command's exit code
      differs** with it present or absent (SC-002).
- [X] T009 Assert no command but `init` and `doors --adopt` changes the file:
      compare bytes before and after, for every command (SC-004).
- [X] T010 Absent record produces the mildest notice, never red (SC-005).
- [X] T011 A malformed floor is refused, naming the accepted form (SC-006).
- [X] T012 Mutation: break each half, confirm the named test fails, restore.

## Phase 5: Law and docs

- [X] T013 Write MV-86. State the rule, the reason (the stale global binary that
      ran for weeks here, and MV-82 hiding itself from it), the **ceiling** —
      provenance, not integrity: a hand-edited door leaves the record as fresh
      as ever — and that nothing is refused. Leave it `proposed`.
- [X] T014 Legs, each validated with `count` before being written.
- [X] T015 Prove a leg bites: revert a half, `verify --strict` names MV-86.
- [X] T016 This repo's own `.multivac/projected.yml`, and `requires:` documented
      in the seeded config as a commented example — never written live, since
      the tool must not author a human's decision.
- [X] T017 Site: the configuration reference gains both fields; `CHANGELOG.md`
      under Unreleased.
- [X] T018 `pnpm run build && pnpm test && verify --strict`; land; close.

### After close

MV-86 is offered for enactment. Only a human enacts a row.

---

## What the run recorded

**The law stopped the work twice, and both times it was right.**

1. **MV-85's and MV-29's legs pinned `undeclared('doors', argv, {})`** — the
   *contents* of doors' surface. Declaring `--adopt` changed it and both rows
   went red. MV-85's leg was simply pointed at the wrong thing and now pins the
   refusal call; the row is about refusing, not about what any one command
   accepts.
2. **MV-29 actually became false.** It claimed "`doors` takes no flags **at
   all**", and `doors --adopt` is a flag. The clause is withdrawn with a dated
   note rather than the code being quietly bent around it. It was never the
   claim worth making: what protects a reader is that the site names no flag the
   binary does not accept, and MV-85 now enforces that for **every** command
   instead of it resting on one command happening to have an empty surface.
   `MV-29` and `MV-85` are declared under `touches`.

**The test found a defect I had just written, and it was the dangerous kind.**
Wiring the notice into `main()` made every command call `version()`, which read
`../package.json` relative to its own module — correct from `dist/`, wrong from
`dist-test/src/`. **Every command threw** in the test build. Two fixes, and the
second is the one that matters:

- the whole notice block is guarded, because **a notice must never be able to
  take down the command it decorates**;
- `selfVersion()` walks up until it finds a manifest whose name is `multivac`,
  and is now the single place that knows this. Three callers had hardcoded a
  depth and two were wrong outside `dist/` — including `--version` itself, which
  was already latently broken there before this change.

**SC-002 is measured, not asserted.** Two brains identical but for the record —
one current, one stale — and every command in the registry is run against both.
The exit codes must match. A test that only checked the notice text would let a
future edit turn the warning into a gate with nobody noticing, which is exactly
the design decision the operator made.

**SC-003 demonstrated by hand**, since it is the hinge of the design: bare
`doors` left the record byte-identical and the notice standing; `doors --adopt`
moved it and the notice stopped.

**This repository adopted its own version**: `.multivac/projected.yml` says
0.3.0, written by `doors --adopt`, and is anchored by MV-86 so a brain that
loses its record is a broken leg here.

**MV-84 refused the commit, and taught something.** The documentation examples
wrote `requires: ">=0.3.0"` and `version: 0.3.0` — real semver literals, and
MV-84 pins exactly one across the whole site. The row cannot tell an example
from a claim, and on inspection it should not have to: **an example carrying a
real version invites a reader to copy a number that will be stale**, which is
the class of defect MV-84 exists to prevent. Both became `X.Y.Z`, which is also
what the notice itself prints. The ratchet was not worked around.
