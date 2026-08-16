# Implementation Plan: The SDD arrives with its own scaffold

**Branch**: `003-the-sdd-arrives-with-its-own-scaffold` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-the-sdd-arrives-with-its-own-scaffold/spec.md`

## Summary

An SDD adapter gains one optional declaration, `scaffold`: the artifact whose
absence means "this tool has never run here", and the vendor's own init command
verbatim. `runScaffold` (in `src/adapters/sdd.ts`) runs that command when the
artifact is absent from every SDD root, prints it before running, and returns
silently when it is present. `change new` and `gateSdd` — the one place `plan`,
`apply` and `close` route their refusals through — call it. `verify`, `doctor`
and `doors` never do: the command reaches the network and MV-01 binds those
three. `doctor` gains one clause naming the command the lifecycle will run, so
a declared-but-unscaffolded tool is reported where health is reported.

Only spec-kit gets an entry, because only spec-kit's init was verified by
running it. openspec gets a stated gap.

## Technical Context

**Language/Version**: TypeScript 5, ESM, Node ≥ 20 (`node:test`)

**Primary Dependencies**: none added. The two runtime deps stay `yaml` and
`picomatch` (MV-02). Everything here is `node:child_process`, `node:fs/promises`
and `node:path`.

**Storage**: the filesystem. The scaffold artifact's presence is the only state.

**Testing**: `node:test` with `assert/strict`, extending
`test/change/sdd-gates.test.ts`. The vendor binary is stubbed on `PATH`, as
`stubOpenspec` already does in that file — no test may run a real `specify`.

**Target Platform**: developer machines and CI, POSIX.

**Project Type**: single CLI package.

**Performance Goals**: unchanged. The added cost on the hot path is one `access`
per SDD root when the artifact is present, which is the skip case.

**Constraints**: `verify` stays sub-second and offline; the new subprocess lives
only in the change lifecycle. A failed scaffold must not throw.

**Scale/Scope**: two SDD adapters, one of which gains a scaffold; four source
files touched plus one test file and one site page.

## Constitution Check

*GATE: passed before design, re-checked after.*

| Principle | Bearing on this feature | Verdict |
| --- | --- | --- |
| **I. A claim nobody checks decays** | MV-75 is the row; five anchor legs bind it to `registry.ts` (the field and the verbatim command), `sdd.ts` (the routine), the three offline commands (`absent`), and the test that proves the behaviour. The legs are written against the names actually implemented, not aspirational ones. | PASS |
| **II. The tool never claims more than it checked** | Three ways this feature could lie, each closed: (a) a derived init command — refused, openspec gets no entry and says so; (b) "scaffolded" printed for a run that wrote nothing — the artifact is re-probed after the command and only its presence produces the success line; (c) a failed scaffold letting a gate through — the gate is evaluated afterwards on its own terms and still refuses. The constitution already names a tool's own scaffold as a permitted subprocess, alongside its validator. | PASS |
| **III. The law changes before the code** | MV-75 is already `proposed` in `.multivac/invariants.md`, reserved by `change new` and dated 2026-08-16, with its anchor legs drafted before this plan. This change adds law, it relaxes none. | PASS |
| **IV. Deterministic, offline, small** | The `absent` leg over `src/commands/{verify,doctor,doors}.ts` is what keeps MV-01 true mechanically rather than by review. No dependency is added. The tests stub the binary, so the suite stays offline and the sub-second budget is untouched — `verify` gains no work at all. | PASS |
| **V. An invented integration is a lie** | The whole feature is one registry field. `specify init --here --integration claude --force` was verified by running it in a scratch repository, and what it writes is recorded in the entry's note — including that the flag is `--integration`, not `--ai`, and that it does not touch `.claude/settings.json`. openspec's init is not recorded, because it was not run. The entry discloses the network the automation performs. | PASS |

Re-check after design: unchanged. No new dependency, no new module, no new
dispatch on an adapter's name — `scaffold` is read from the entry like every
other field.

## Project Structure

### Documentation (this feature)

```text
specs/003-the-sdd-arrives-with-its-own-scaffold/
├── spec.md
├── plan.md              # this file
├── tasks.md
└── checklists/
    └── requirements.md
```

No `research.md`, `data-model.md` or `contracts/`: the research is one verified
command recorded in the registry note, the data model is one interface of three
fields declared inline beside the interfaces it sits with, and the contract is
the anchor legs of MV-75. Writing empty ceremony files would be the "present
artifact that proves nothing" this project refuses elsewhere.

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── registry.ts      # + SddScaffold, AdapterSpec.scaffold, speckit entry,
│   │                    #   the stated gap for opsx
│   └── sdd.ts           # + runScaffold — probe, print, run, re-probe
└── commands/
    ├── change.ts        # cmdNew and gateSdd call runScaffold
    ├── doctor.ts        # reports the declared-but-unscaffolded state
    ├── verify.ts        # untouched — the absent leg proves it
    └── doors.ts         # untouched — the absent leg proves it

test/change/sdd-gates.test.ts   # five outcomes, vendor binary stubbed

site/content/docs/reference/graphers-and-sdd.md   # install ≠ scaffold
```

## Design Decisions

### 1. `scaffold` is a field on the adapter entry, not a new kind of step

An `SddStep` is something an **agent** runs in chat and the lifecycle only
prints (MV-51). The scaffold is a **terminal** command multivac itself runs.
Putting it in `steps` would have made the two indistinguishable at the point
they are consumed — `flowLines`, `sddInstructions` and the brain door would all
print it as a step for the agent — which is exactly the confusion MV-51 exists
to prevent. A sibling field keeps the two categories apart with no `kind`
discriminator and no branch anywhere that enumerates steps.

### 2. Two operative fields plus a note, and no defaulting

`artifact` and `run`, both stated. Neither is derived from the adapter name or
from `artifacts[0]`, even though for spec-kit they coincide — a default is how
`.specify` would silently become the answer for a tool whose init writes
somewhere else. The `note` records what running it actually wrote, so the next
reader can tell verification from assertion.

### 3. Absent everywhere ⇒ scaffold the brain; present anywhere ⇒ silence

The gates already search `sddRoots` (the brain plus every declared, present
repo), so presence is asked the same way, in the same places. When the artifact
is missing from all of them, only one root can be chosen to run in, and the
brain is the defensible one: it is where the lifecycle runs and where this
project's own `specs/` live. The printed line names every root that was
searched, so an operator whose specs belong in a sibling repo can see what
happened and run the init there themselves.

Present ⇒ **nothing printed**. A skip line on every `change plan` in every
already-scaffolded repo is noise on the overwhelmingly common path.

### 4. Reuse `toolVerdict` rather than a second subprocess helper

`toolVerdict` already: splits the command, resolves the binary on `PATH` and
then in `node_modules/.bin`, distinguishes missing-binary from failed, and
quotes the tool's own stderr three lines deep. Those are exactly the three
outcomes FR-009 and FR-010 ask for, and they are already tested. A second runner
would drift from the first.

### 5. Success is re-probed, never assumed

After the command returns, the artifact is probed again. Present ⇒ the success
line. Absent ⇒ a warning, carrying the tool's own message when it failed, or
saying it exited 0 and wrote nothing when it did not. One branch, two outcomes,
and no path that prints "scaffolded" without the artifact being there (FR-011).

### 6. Two call sites: `cmdNew` and `gateSdd`

`cmdNew` is the first moment the tool's steps are printed. `gateSdd` is the
single funnel for `plan`, `apply` and `close`, and calling it at the top means
the scaffold runs **before** the refusal it would otherwise cause is evaluated
(FR-006). `cmdLand` needs no call: by the time a change lands it has passed two
gates. Adding a third call site would run the same probe again for nothing.

### 7. A failed scaffold does not fail the command

Same shape as MV-50's failing grapher refresh: warn with the tool's own words,
hand the command back, continue. The lifecycle command then reaches its gate,
which refuses because the artifact it wanted is still missing. The gate stays
closed without a second mechanism deciding that it should.

### 8. `doctor` reports it and never runs it

`doctor` already prints `artifact missing (looked for .specify)`. It gains one
clause: that the lifecycle runs this exact command at `change new`, and that
doctor does not, because it reaches the network. That answers the spec's open
question in the affirmative at the cost of one string, and the `absent` anchor
leg keeps the "never runs it" half honest — the leg names the routine, and
`doctor` only ever names the registry field.

## What This Deliberately Does Not Build

- **No openspec scaffold.** Its CLI is documented as `init/update/list/show/
  validate`, but what `openspec init` writes, and which flags a non-interactive
  run needs, was not verified by running it. MV-59's rule and Principle V both
  say the gap is stated, not filled. A future change that runs it can add the
  entry in three lines.
- **No lock, no retry, no concurrency handling** around the scaffold. It runs
  once per repository, and the vendor's own init is the arbiter of a race. The
  grapher lock exists because a refresh fires after every edit; this does not.
- **No scaffolding of sibling repositories.** One repo, named in the output.
  Automatically initializing a foreign checkout the operator did not point at is
  a bigger promise than this change makes.
- **No version, freshness or completeness check** on the artifact. Presence is
  the declared signal. A half-written `.specify/` is spec-kit's to report when
  its own steps run.
- **No `--scaffold` / `--no-scaffold` flag.** The two switches that already
  govern every other piece of SDD automation — `--no-sdd` and `sdd_auto: false`
  — govern this one identically. A third switch would be a third thing to
  explain and a fourth state to test.
- **No install of the vendor binary.** Missing binary prints the install hint
  and stops. multivac still never installs foreign software; it runs a tool the
  operator installed and declared.

## Complexity Tracking

No constitutional deviation to justify. The feature adds one optional field,
one exported function and two call sites; it removes nothing and relaxes no
existing rule.
