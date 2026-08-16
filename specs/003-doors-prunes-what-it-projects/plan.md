# Implementation Plan: doors prunes what it projects

**Branch**: `doors-prunes-what-it-projects` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-doors-prunes-what-it-projects/spec.md`

## Summary

`installSkill` in `src/commands/doors.ts` copies `<packageRoot>/skills/multivac`
into `<target>/<dirname(entry.skill)>` and never deletes, so the projection
accretes. It becomes a mirror: before the copy, every entry under the projected
directory that the source does not have — by path *and* by kind — is removed.
The removal is scoped to that one directory, computed from the registry entry
that declared it, and never to its parent, where other tools install their own
skills. No new command, no flag, no prompt: the run that notices is the run that
removes.

## Technical Context

**Language/Version**: TypeScript on Node >= 24
**Primary Dependencies**: none added — `node:fs` (`readdirSync`, `rmSync`, `cpSync`) and `node:path` only; `yaml` and `picomatch` stay the two runtime deps
**Storage**: files in the target working tree
**Testing**: `node:test`, no frameworks, run by `pnpm test`
**Target Platform**: any repo `doors` projects into, brain and consumers alike
**Project Type**: single project (CLI)
**Performance Goals**: one extra directory listing per target; `doors` is not on `verify`'s sub-second path but stays offline and subprocess-free here
**Constraints**: no network, no model, no new dependency; removal never leaves the projected directory
**Scale/Scope**: one function in `doors.ts`, one bound assertion in the registry test, two tests in the doors suite, one law row already written

## Constitution Check

*Checked against `.specify/memory/constitution.md` v1.0.0.*

| Principle | Verdict | How |
| --- | --- | --- |
| I — A claim nobody checks decays | **Pass** | MV-73 is anchored to the comment that states the rule in `doors.ts` and to the two tests that exercise it — the removal and the bound. The row is cited by ID in the code comment |
| II — The tool never claims more than it checked | **Pass** | The one thing that cannot be known — whether a file under the projected directory was written by a user or by an older version of the skill — is decided in the open (FR-007) rather than guessed at by a heuristic. Nothing reports success it did not check: when the source is unavailable the run removes nothing and keeps printing the existing notice |
| III — The law changes before the code | **Pass** | MV-73's row and its anchor legs were written in `.multivac/invariants.md`, dated 2026-08-16, before this plan and before any code; the row and the behaviour land in the same change |
| IV — Deterministic, offline, small | **Pass** | Two directory listings and `rmSync`; no network, no model, no subprocess, no dependency. `verify` is untouched, so its sub-second budget is unaffected. Git is not involved at all |
| V — An invented integration is a lie | **Pass** | The projected directory comes from the registry entry's own `skill` field, so the behaviour is dispatched on the entry's kind and applies to every harness that declares one. No entry is named in the code. The bound that keeps a prune inside its own directory is enforced as a rule about the *data*, in the registry test |

**Post-design re-check**: unchanged. No principle needs a deviation, and the
Complexity Tracking section below is empty for that reason.

## Project Structure

### Documentation (this feature)

```
specs/003-doors-prunes-what-it-projects/
├── spec.md
├── plan.md              # this file
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```
src/commands/doors.ts            # installSkill becomes a mirror — modified
test/doors/doors.test.ts         # removal + bound tests — modified
test/doors/registry.test.ts      # a skill path names a directory of its own — modified
.multivac/invariants.md          # MV-73 anchor legs — modified
```

**Structure Decision**: no new module. The mirror is four lines of set
arithmetic inside the function that already owns the copy; extracting it into
`src/doors/` would put a helper with one caller behind an import, and the thing
that makes it correct — that its destination is the same path the copy writes to
— is only obvious while the two sit together.

## Design decisions

### Remove first, then copy

The obvious orders are all wrong in a way that matters:

- **Delete the whole directory, then copy.** The simplest mirror there is, and
  it opens a window where a correct projection is gone and its replacement has
  not arrived. If `cpSync` throws halfway — a permission, a full disk — the user
  is left with less than they started with, for a command that was supposed to
  write a door.
- **Copy, then remove what the source lacks.** Never loses anything, but it
  cannot resolve the type conflict: `cpSync` fails when the projection holds a
  *file* where the source holds a *directory*, so the run dies before the pass
  that would have fixed it.
- **Remove first, then copy** — chosen. The removal only ever touches entries
  the source does not have, or has with a different kind. Neither is something a
  subsequent copy failure could leave missing: everything the source still holds
  survives the removal untouched and is then overwritten in place. The window of
  loss does not exist, and the type conflict is resolved before the copy that
  would have failed on it.

### Compare path *and* kind

The keep-set maps each source entry's relative path to `'dir'` or `'file'`. A
projection entry survives only when the source has that exact path with that
exact kind; anything else — absent, or present with the other kind, or neither a
file nor a directory — is removed. Two lines more than a path-only set, and it
is what turns "the projection ends up as what the source says" from a claim into
the thing the code does.

### The bound is a rule about the data, not a branch in the code

The destination is `join(dir, dirname(entry.skill))`, straight from the registry
entry. If some future entry declared `skill: 'SKILL.md'`, that expression would
resolve to the repository root and the mirror would delete the user's repository.
The fix is not a runtime guard — a branch that can only fire on a bug in data
this repository ships, and that no user could ever reach — but an assertion in
`test/doors/registry.test.ts`, beside the ones that already require every entry
to cite a vendor doc and to have a kind `doors` can write. A bad entry then fails
CI on the day it is added, which is the only day it can exist. This is what
"adapters are data" means when the data is dangerous: check the data.

### The projected directory is multivac's, wholly

The open question the change raised is answered in the spec (Story 3, FR-007):
a file a user adds under the projected directory is removed, exactly as a
retired file is. The reason is Principle II. Nothing on disk says who wrote a
file; preserving "user files" means inferring authorship from a name pattern or
a timestamp and then acting on the inference as if it were known. The rule that
can be stated truthfully is the one implemented: the directory has one source,
and its content is that source. The user's supported places — a sibling
directory under the same parent, and the unmanaged parts of `AGENTS.md` — are
both left alone, and the sibling case is a test rather than a promise.

### What is deliberately not built

- No backup or trash directory. A file that is byte-identical to something in
  the package is not worth a recovery mechanism, and a half-deleted tree with a
  hidden restore path is harder to reason about than a mirror.
- No `--dry-run`, no prompt, no confirmation. FR-010: a mirror you have to ask
  for is not one.
- No ignore-list, no `.multivac-keep`, no ownership manifest. Every one of them
  is a way to make the tool claim it knows which files are the user's.
- No change to what is copied, to the registry, or to any other target's
  projection. `doors` writes the same bytes it wrote yesterday; it just stops
  keeping the ones it no longer writes.

## Complexity Tracking

No constitutional violation requires justification; the table above is clean and
this section is intentionally empty.
