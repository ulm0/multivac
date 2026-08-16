# Implementation Plan: The merge keeps what it did not write

**Branch**: `the-merge-keeps-what-it-did-not-write` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-the-merge-keeps-what-it-did-not-write/spec.md`

## Summary

`src/doors/settings.ts` claims a hook entry whose command merely *contains* a
marker, then replaces that entry's whole `hooks` array and rewrites its
`matcher`. Ownership moves down one level — from the entry to the individual
hook object — and identity becomes exact rather than a substring test. An update
rewrites one hook's `command` and nothing else. A duplicate the old code left
behind is reported through the existing `doors` notice channel, never deleted.

## Technical Context

**Language/Version**: TypeScript, Node >= 24, ESM, `node:test`
**Primary Dependencies**: none new — `yaml` and `picomatch` remain the only two
**Storage**: `.claude/settings.json` in each door target's working tree
**Testing**: `pnpm test` (`node:test`, no frameworks), `node dist/cli.js verify --strict`
**Target Platform**: developer workstations and CI (macOS, Linux)
**Project Type**: single CLI package
**Performance Goals**: `verify` stays sub-second; the merge is a single in-memory pass over one small JSON document
**Constraints**: no network, no model, no new runtime dependency, English everywhere
**Scale/Scope**: two source files (`src/doors/settings.ts`, `src/commands/doors.ts`), one test file, two doc pages, two law rows

## Constitution Check

| Principle | Verdict | Why |
| --- | --- | --- |
| I. A claim nobody checks decays | PASS | MV-74 lands with anchor legs on the source, the tests and the published page: a positive leg on the ownership comment, a tombstone leg on the substring test that caused the bug, legs on the two tests that fail if it comes back. MV-52 is amended in the same change so its statement and its anchors describe the merge that now exists. |
| II. The tool never claims more than it checked | PASS | The duplicate case is exactly where this bites. The tool can prove a count; it cannot prove which of two byte-identical entries was the bug's leftover. It reports the count and refuses to choose — the report is not dressed up as a fix, and the notice says why it will not delete. |
| III. The law changes before the code | PASS | MV-74 is already filed `proposed` and dated 2026-08-16 by `change new`. MV-52's statement is amended in this same change with its date moved, because the behaviour it describes changes here. No invariant is relaxed to fit the code. |
| IV. Deterministic, offline, small | PASS | Pure string and object manipulation on already-read bytes. No process spawned, no path walked, no dependency added. The merge stays a single pass; nothing it does is measurable against the sub-second budget. |
| V. An invented integration is a lie | PASS | Identity is carried inside the `command` string, which the vendor documents as free-form shell. No key is invented in the vendor's schema — an undeclared field on a hook object would be exactly the guessed value this principle forbids. The registry entry for `claude` is not touched. |

No violations. No Complexity Tracking entries.

## Design decisions

### 1. The unit of ownership is the hook object, not the entry

The bug is a category error: the code owned an *entry* because one *hook* inside
it looked like the project's. An entry is a user-authored grouping — a matcher
plus the commands they want on it — and the project has no business owning one
it did not create. The project owns a command. So: find the hook whose command
is ours, rewrite that hook's `command` in place, and never touch the entry
around it. Mutating `command` on the existing object rather than replacing the
object also keeps any field the vendor supports and the project does not write
(a `timeout`, say) — a smaller diff that happens to be the more careful one.

### 2. Identity is exact, and there are two of them

`String.includes` is not identity: every superstring of the marker matched.

- **The check hook** is written as one fixed string and is recognised by whole
  string equality. `mvac verify --strict` is not `mvac verify`, so a user's
  variant is never claimed. A user who typed the exact same string is
  indistinguishable from the project and is treated as the project — harmless,
  because the update writes the same bytes back and leaves matcher and siblings
  alone.
- **The refresh hook** cannot use equality: its tail embeds the declared
  grapher's own refresh command, which is the very thing an update must be able
  to change. It is recognised by its generated head, `L=<the lock path>;`. That
  path lives under the project's own cache directory and is emitted by a code
  generator. It is not a string a person types by accident, and it is not a
  string that can appear in a hook whose tail the project did not write.

Two rules, so identity is a predicate passed in rather than a marker string
compared inside. That keeps the asymmetry visible at the call site instead of
hiding a `startsWith`-or-`===` branch inside the helper.

### 3. The matcher is written once, never rewritten

`doors` set `mine.matcher = matcher` on every update. There is no case where
that is required: the matcher on the project's own entry is already the one the
project wrote, and the matcher on anyone else's entry is not the project's to
touch. Dropping the assignment removes the destructive path entirely rather than
guarding it. The accepted cost is recorded in the spec: if the project's default
matcher ever changes, existing installations keep the old one.

### 4. Duplicates are reported, not removed

The change file asked the question and refused to assume the answer: "silently
deleting a hook entry is how this defect started." Report wins, for a reason
that survives restating — after the old code overwrote a foreign entry, the
survivor is byte-identical to the project's own entry. Nothing on disk
distinguishes "leftover of a bug" from "a second hook the user deliberately put
on a different matcher". A count is provable; the choice is not. So
`mergeClaudeSettings` returns `{ text, notices }`, `doors` folds the notices into
the ones it already prints per target, and the message names the event, the
count, and why the tool will not act.

The one place the tool still deletes is unchanged and stays justified: when the
grapher goes away, every refresh hook is removed, because that command is
machine-generated and provably the project's. Its entry is dropped only if it is
left with no hooks.

### 5. Where the report goes

`installHookConfig` in `src/commands/doors.ts` already collects a `notices`
array that `doors` prints per target, and already uses it for the settings-file
errors this module throws. The duplicate report joins it. No new output channel,
no new flag, no exit-code change — a duplicated hook wastes work, it does not
make the gate wrong.

## What this deliberately does not build

- **No repair command.** No `doors --fix-duplicates`, no interactive prompt. The
  notice tells a person what to open; they have an editor.
- **No matcher reconciliation.** See decision 3. A future change of the default
  matcher can carry its own migration if it ever needs one.
- **No schema key for ownership.** Writing an undocumented field into the
  vendor's settings file would trade a substring bug for a guess about someone
  else's parser (Principle V).
- **No doctor surfacing.** `doctor` does not read `.claude/settings.json` today
  and teaching it to would be a second reader of that file for one warning.
- **No version stamp in the command.** Tempting for future migrations, but it
  would change the command the docs quote, and it buys nothing this change
  needs.
- **No refactor of `mergeClaudeSettings` into a class or a settings model.** It
  is one function over one JSON document and stays that.

## Project Structure

### Documentation (this feature)

```
specs/003-the-merge-keeps-what-it-did-not-write/
├── plan.md              # This file
├── spec.md              # Feature specification
├── tasks.md             # Phased, dependency-ordered tasks
└── checklists/
    └── requirements.md  # Specification quality validation
```

No `research.md`: there is nothing to research — the vendor's hook format is
already documented in `site/content/docs/reference/integrations.md` with its
source link, and the defect was reproduced against `dist/` before the change was
filed.

No `data-model.md` / `contracts/`: the only contract is one exported function's
signature, stated here and pinned by its tests.

### Source Code (repository root)

```
src/doors/settings.ts        # ownership, identity, update, removal, duplicate count
src/commands/doors.ts        # folds the merge's notices into the per-target notices
test/doors/settings.test.ts  # the merge's tests
.multivac/invariants.md      # MV-74 enacted with legs; MV-52 amended
site/content/docs/reference/hooks.md         # the ownership rule, stated
site/content/docs/reference/integrations.md  # same rule where the merge is described
```

## Complexity Tracking

Not applicable — the Constitution Check has no violations to justify.
