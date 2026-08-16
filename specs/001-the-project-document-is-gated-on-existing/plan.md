# Implementation Plan: The project document is gated on existing

**Branch**: `the-project-document-is-gated-on-existing` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-the-project-document-is-gated-on-existing/spec.md`

## Summary

`change plan` refuses while a declared `projectStep`'s artifact is absent,
unreadable, empty, or still carries the fill-in tokens the tool's own template
ships. Nothing else changes: staleness stays a report, `doctor`'s wording is
untouched, the two off switches turn this gate off exactly as they turn off
every other one, and an adapter with no `projectSteps` is unaffected.

The whole feature is one new pass inside `sddGate`, the function that already
runs the artifact pass and the ledger pass. It reuses the `placeholder` regex
that `SddProjectStep` already declares and `doctor` already reads.

## Technical Context

**Language/Version**: TypeScript 5, ES modules, Node 20+ (`node:` builtins only)

**Primary Dependencies**: none new. The two runtime dependencies (`yaml`,
`picomatch`) are untouched; this feature adds zero imports.

**Storage**: the filesystem. One `readFile` per declared project document per
searched root.

**Testing**: `node:test` with `assert/strict`, no frameworks. New cases go in
`test/change/sdd-gates.test.ts`, beside the gates they extend.

**Target Platform**: the `multivac` CLI, wherever it runs.

**Project Type**: single CLI package.

**Performance Goals**: no measurable change. `change plan` already reads
several files; this adds at most one small read per root.

**Constraints**: offline, no subprocess, no model. Unreadable must never
become a crash — the gate hardens the lifecycle, it must not become a new way
for it to throw.

**Scale/Scope**: two declared SDD adapters. One (`speckit`) has a project
step; the other (`opsx`) declares `projectSteps: []` and must stay untouched.

## Constitution Check

*GATE: passed before design, re-checked after.*

| Principle | How this feature satisfies it | Verdict |
| --- | --- | --- |
| I. A claim nobody checks decays | The claim enters as MV-76 with anchor legs on the code and both new tests; MV-57 is amended in the same change so the superseded half of its sentence stops binding. Every citation is by ID. | PASS |
| II. The tool never claims more than it checked | The gate judges only what a machine can decide: present, readable, non-empty, and free of the tokens the tool asks the author to replace. It never scores the principles. A document it cannot read is refused, not passed — an unevaluable gate refuses. The refusal for "still the template" is worded differently from the refusal for "missing", so the tool never claims to know more than it does. | PASS |
| III. The law changes before the code | The MV-76 row is already reserved and is amended, dated, to state the mechanism actually built; MV-57 is amended in the same change. No invariant is relaxed in code. | PASS |
| IV. Deterministic, offline, small | One `readFile` per root, no network, no subprocess, no model, no new dependency. `verify` is not on this path and stays sub-second. Tests depend on no host state — the new cases write their own constitution and template into a scratch repo. | PASS |
| V. An invented integration is a lie | No adapter entry is invented or widened. The feature acts on `placeholder`, which was already declared per tool and verified against a real `specify init`. `opsx` declares no project step and keeps behaving exactly as before. | PASS |

No violations, so Complexity Tracking below stays empty.

## Design decisions

### D1 — Recognize "nobody has written this" by the template's fill-in tokens, not by whole-file equality

The change file drafted this as "the same whole-file equality MV-65 uses".
An adversarial pass says that is wrong for this artifact, on two pieces of
evidence:

1. **Whole-file equality fails open, deliberately.** `copiedFrom` in
   `src/adapters/sdd.ts` returns `null` when the template cannot be read, and
   `test/change/sdd-gates.test.ts` asserts that behaviour: a genuinely
   authored `plan.md` in a repo with no template on disk must pass. That is
   correct for a per-feature artifact and it is exactly what FR-011 forbids
   here — "when the blank version cannot be located, the feature MUST NOT
   treat the document as written on that basis alone". Making `copiedFrom`
   strict was measured against the suite: 8 of 18 tests in that file break.
   The per-feature gate's fail-open is load-bearing and stays.

2. **MV-65 chose equality for the opposite reason to the one that applies
   here.** Its entry says so: spec-kit's `# Implementation Plan: [FEATURE]`
   heading "is a line the tool never asks anyone to change", so a real plan
   keeps it and a regex on it would refuse honest work forever. The
   constitution template inverts that. `[PROJECT_NAME]`,
   `[PRINCIPLE_1_NAME]`, `[PRINCIPLE_1_DESCRIPTION]` are tokens
   `/speckit.constitution` explicitly instructs the author to replace. A
   written constitution carries none of them — verified against this repo's
   own, which matches the pattern zero times, and against the shipped
   `.specify/templates/constitution-template.md`, which matches on almost
   every line.

So the check is the `placeholder` ERE that `SddProjectStep` already declares
and `doctor` already evaluates. It needs no second file to be readable, so it
cannot fail open, and it is one regex against text already in memory.

**Consequence for the law**: the MV-76 row must be amended, dated, to say
this. Weakening the code to match a drafted sentence would be the wrong way
round.

### D2 — Empty is refused too, with no declaration needed

Same reasoning MV-65 gives for step artifacts: a project document is never
legitimately empty, whatever the tool. This costs one `trim()` and covers the
case where the file was created by `touch` or truncated.

### D3 — Unreadable is refused, and shares the "missing" refusal

A directory at the document's path, a broken symlink, and a permission error
are all "not a written document". Reading the file directly — rather than
probing for existence and then reading — collapses all three into one path:
`readText` returns `null`, no root satisfies the document, and the refusal
says it is missing or unreadable. The document's path carries no `*` segment,
so `artifactHit`'s glob machinery is not needed here.

### D4 — The gate is `plan`, and only `plan`

The project document is what `/speckit.plan`'s own Constitution Check reads.
Refusing later would let the planning happen against nothing, which is the
defect. Refusing earlier — at `new` — would block writing the spec on a
document the spec does not depend on. `plan` is the first lifecycle point at
which the absence changes the outcome of the work, and it is where the change
file put it.

This is one constant in `src/adapters/sdd.ts` with its reason stated, not a
new per-adapter field. Principle V says adapters are data, but this is not
per-tool data: it is the lifecycle's decision, identical for every tool, and a
field that only ever holds one value is configuration for a constant.

### D5 — The pass lives beside the ledger pass, not inside the artifact loop

The artifact loop is per-change and slug-interpolated; the project document is
per-project and has no slug. It also has a different notion of "untouched".
Folding it into the artifact loop would mean branching inside every iteration
on which kind of thing is being checked. A separate loop, like the ledger
pass that already sits there for the same kind of reason, is shorter and
reads as what it is.

### D6 — Staleness stays out of the gate entirely

`doctor` computes the STALE verdict by comparing the document's mtime to the
law's newest row. The gate never reads mtime and never reads the law. The law
moving is not proof the principles must move, and a gate there would refuse
honest work on every unrelated row. This is stated in FR-006 and pinned by its
own test.

## What this deliberately does not build

- **No content judgement.** Nothing counts principles, checks headings,
  measures length, or parses the version. FR-005.
- **No staleness gate.** See D6.
- **No new refusal at `apply`, `land` or `close`.** FR-009.
- **No change to `doctor`.** Its three verdicts already exist and its wording
  is anchored by MV-57. FR-010.
- **No new adapter field.** See D4.
- **No change to `copiedFrom` or to the per-feature artifact gate.** Its
  fail-open is correct for what it checks and is asserted by eight tests.
- **No auto-creation of the document.** Writing principles is an authoring
  task; the tool names the command and stops.

## Project Structure

### Documentation (this feature)

```text
specs/001-the-project-document-is-gated-on-existing/
├── spec.md                    # written
├── plan.md                    # this file
├── tasks.md                   # phased tasks
└── checklists/requirements.md # spec validation actually run
```

### Source Code (repository root)

```text
src/adapters/sdd.ts             # the new project-document pass inside sddGate
src/adapters/registry.ts        # SddProjectStep doc comment: gated now, not only reported
src/commands/doctor.ts          # comment only — the report's OUTPUT is byte-identical
src/doors/brain.ts              # the door line names what refuses, like every step line
.multivac/invariants.md         # MV-76 amended to the built mechanism; MV-57 amended
.specify/memory/constitution.md # Governance sentence about presence; PATCH bump
test/change/sdd-gates.test.ts   # absent / directory / template / empty / written; staleness; off switches
site/content/docs/reference/graphers-and-sdd.md  # the gate documented
skills/multivac/references/change.md             # "a report, never a gate" corrected (+ .claude copy)
```

**Structure Decision**: no new files. The feature is a pass inside an existing
function, its data is an existing declared field, and its tests extend the
file that already owns SDD gating. The prose files above are the same claim
stated where it was previously stated wrongly — a sentence that says "never a
gate" beside a gate is the drift this project exists to catch.

## Complexity Tracking

> No Constitution Check violation, nothing to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
