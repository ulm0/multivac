---

description: "Task list for the-gate-cannot-be-typoed"
---

# Tasks: The gate cannot be typoed

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/declared-surface.md](./contracts/declared-surface.md),
[quickstart.md](./quickstart.md)

**Tests**: yes. The registry-walking test is the deliverable that outlives the
change; the fixes are the smaller half.

---

## Phase 1: Foundational

- [X] T001 Write `src/lib/args.ts`: one exported function that takes `argv`, the
      command's declared bare flags, its valued flags and its positional
      maximum, and returns either `null` or the refusal line. Ten lines, no
      dependency. A valued flag consumes the next argument so it is not counted
      as a positional (FR-006).

**Checkpoint**: the helper exists and is used by nothing.

---

## Phase 2: US1 + US2 — the four commands (P1)

- [X] T002 [US1] `doctor`: refuse anything but `--strict`, and refuse every
      positional — it declares none and reports on `ctx.cwd`. Before
      `doctorReport` is called.
- [X] T003 [US1] `doors`: it declares no arguments and takes `_argv`. Refuse any
      argument, before `loadConfig`.
- [X] T004 [US1] `seed`: refuse any flag; keep `[dir]`. Before the inventory
      runs and before the report is written.
- [X] T005 [US1] `init`: it already refuses correctly but throws, and the
      dispatcher maps a throw to 1. Return the usage code instead. Do not change
      the message — it already names the flag and lists the known ones.
- [X] T006 [US2] Confirm by hand, per `quickstart.md`: `doctor /tmp` and
      `doors /tmp` refuse; `seed /tmp` proceeds.

**Checkpoint**: the four measured wrong now measure right, and the five that
were right are untouched.

---

## Phase 3: US3 — the tenth command (P2)

- [X] T007 [US3] Write `test/cli/unknown-args.test.ts`: import the command
      registry, and for **every** command run it with `--zzz-not-a-flag` in a
      fresh temp directory. Assert the usage exit code **and** that the
      directory is unchanged — a command that refuses after writing has still
      written (FR-004, SC-005).
- [X] T008 [US3] Prove the test fails when it should: revert one of T002–T005,
      run it, confirm the named command fails; restore. **A test seen only green
      has not been tested.**

---

## Phase 4: Law

- [X] T009 Write MV-85, replacing the `RESERVED` placeholder. State the rule as
      **behaviour** — a command refuses what it does not declare — and not as
      "every command calls this helper", so a correct hand-rolled loop satisfies
      it. State the measurement: four of nine wrong, and that an earlier count of
      one was a zsh word-splitting artefact in the probe, not a property of the
      tool. State the **ceiling**: the check compares the command line against
      what a command *declares*, so a command that declares a flag and then
      ignores it passes everything here. Leave the row `proposed`.
- [X] T010 Add the legs, each validated with `count` before being written.
- [X] T011 Prove a leg bites: revert a fix, `verify --strict` names MV-85;
      restore.

---

## Phase 5: Docs and close

- [X] T012 `site/content/docs/reference/commands.md`: the exit matrix said `2`
      for a usage error while four commands did otherwise. The table needed no
      edit — the code moved to it. Add the positional refusal to `doctor`'s and
      `doors`' entries, since that is a surface change a reader must know.
- [X] T013 `CHANGELOG.md` under **Changed — read before upgrading**: this can
      newly refuse a command line that worked. `mvac doctor .` refused where it
      used to report on the working directory. Name it plainly.
- [X] T014 `pnpm run build && pnpm test && node dist/cli.js verify --strict`.
- [X] T015 Land, `change land --landed brain`, `change close`.

### After close

MV-85 stays `proposed`. Only a human enacts a row.

## Notes

- Never `--no-verify`. A refusing hook is the finding.
- Measure with a function, never an unquoted variable in a zsh loop (research
  D0). The first measurement of this defect was wrong for exactly that reason.

---

## What the run recorded

**A fifth command, found by the test rather than by the report.** The brief named
three; `init` made four. The registry test then failed on **`count`**, which
exits 2 correctly but printed only its usage block and never said which argument
it had not understood — FR-002, violated by a command nobody had flagged. Fixed
in the same change. A test that walks the registry finds what a report of
individual sightings does not.

**MV-29 broke, and it was right to.** Its leg pinned
`async function run(_argv: string[]` in `doors.ts` — the **unused parameter** as
evidence that `doors` ignores its arguments. Reading `argv` renamed it, and the
row went red on the first verify.

The row's claim — "`doors` takes no flags at all" — was not relaxed; it was
strengthened, from *ignores them* to *refuses them*. What was wrong was the
anchor: it pinned the **mechanism** that happened to imply the claim rather than
the claim itself. The leg moved to `undeclared('doors', argv, {})` — the
declaration of an empty surface, a positive statement of the same rule — and the
row carries a dated clause saying so. `MV-29` is declared under `touches`.

That amendment paid for itself immediately: reverting the `doors` fix now gives
**exit 1**, and not from MV-85, which is `proposed` and only reports. It is
MV-29, already `active`, catching it.

**Mutation, both halves:**

- `doctor`'s refusal reverted → 3 tests fail, naming `doctor`.
- The positional check in `args.ts` disabled → the directory test fails, naming
  `doctor` and `doors`; the valued-flag unit test fails too, which is the check
  that the fix did not simply stop counting.
- Restored → 5/5, and `pnpm test` 365/365.

**A measurement in the earlier report was wrong, and the tool was not at fault.**
The first pass reported "only `init` is wrong" from a zsh loop using unquoted
`$c`. zsh does not word-split parameter expansions, so every probe passed one
string and measured *unknown command* — which correctly exits 2 — nine times.
Re-measured with `probe() { node dist/cli.js "$@"; }`: four wrong, not one. Both
numbers are on the record in MV-85's row and in research D0, because a
correction that erases the wrong number teaches nobody how it was reached.
