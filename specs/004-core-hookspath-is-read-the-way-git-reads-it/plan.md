# Implementation Plan: core.hooksPath is read the way git reads it

**Branch**: `core-hookspath-is-read-the-way-git-reads-it` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-core-hookspath-is-read-the-way-git-reads-it/spec.md`

## Summary

`src/hooks/install.ts` reads `core.hooksPath` as a repo-relative string and
builds every filesystem path with `join(repo, hooksPath)`. `join` with an
absolute second argument concatenates instead of replacing, so an absolute
hooksPath sends the shims to `<repo>/Users/…/.multivac/hooks/` while `init`
prints the absolute path as the place they went. `src/commands/doctor.ts`
repeats the same `join` when it looks for them, and repeats the same
text-equality test (`hp !== HOOKS_DIR`) when it decides whether the directory is
multivac's own.

One exported function, `resolveHooksPath`, applies git's own rule once and
answers both questions — which directory, and is it ours — and install and
doctor both call it. Nothing else about the strategies changes.

## Technical Context

**Language/Version**: TypeScript, Node >= 24, ESM, `node:test`
**Primary Dependencies**: none new — `yaml` and `picomatch` remain the only two
**Storage**: the repo's git config (`core.hooksPath`) and the directory it names
**Testing**: `pnpm test` (`node:test`, no frameworks), `node dist/cli.js verify --strict`
**Target Platform**: developer workstations and CI (macOS, Linux)
**Project Type**: single CLI package
**Performance Goals**: `verify` stays sub-second; the resolution is one `path.resolve` per call, no I/O
**Constraints**: no network, no model, no new runtime dependency, tests must not depend on host configuration
**Scale/Scope**: two source files (`src/hooks/install.ts`, `src/commands/doctor.ts`), one test file, two doc surfaces, two law rows

## Constitution Check

| Principle | Verdict | Why |
| --- | --- | --- |
| I. A claim nobody checks decays | PASS | MV-79 lands with legs on the resolver by name, a tombstone leg on the concatenating `join(repo, dir, name)` that caused the defect, a leg on doctor reading through the same resolver, legs on the two new tests by title, and legs on the two prose surfaces that state the rule. MV-37 is amended in the same change, and its six existing legs are re-checked rather than assumed — the code they name is exactly where the new truth lives. |
| II. The tool never claims more than it checked | PASS | This is the principle the defect broke, from both ends: `init` claimed an install that did not happen, and `doctor` claimed a missing shim that was present. Both claims become computed from the directory git will actually use. Where a proof is not available it is written down instead of implied: the spec and the checklist both record that nothing here models how a shim placed in another working copy's directory resolves its root at run time, and that identity is decided by resolving text, not by consulting the filesystem for symlinks or inode identity. No test is written that would pass without proving its claim — every behaviour below is mutation-verified by reverting the source and watching the named test fail. |
| III. The law changes before the code | PASS | MV-79 was reserved by `change new` and its statement is written before the implementation task runs; MV-37's row is amended, dated 2026-08-16, in this same change, and the change file declares it under `invariants.touches`. Nothing in the law is relaxed to fit the code — MV-37's false half ("installs alongside where the name is free", true only for a relative spelling) is replaced by a statement the fixed code satisfies. MV-14, MV-44 and MV-47 were read for the same question and are left alone, because none of them says anything about how the path is spelled; not amending a row that does not need it is part of the same discipline. |
| IV. Deterministic, offline, small | PASS | `path.resolve` on strings already in hand: no process spawned, no filesystem touched by the resolution itself, no dependency added, nothing measurable against the sub-second budget. The new tests build their own git repositories under `tmpdir()` through the shared `gitInit` helper and set `core.hooksPath` explicitly, so no assertion depends on the host's git configuration — which matters more than usual here, since the defect was first seen through a host's inherited configuration. |
| V. An invented integration is a lie | PASS | The resolution rule is not invented: `githooks(5)` states that git moves to the root of the working tree before running a hook, which is what a relative `core.hooksPath` is relative to, and `git config` returns an absolute value unchanged. No adapter entry is added or touched; nothing is derived from a tool's name. |

No violations. No Complexity Tracking entries.

## Design decisions

### 1. One resolver, exported, called from both sides

The defect existed in two places at once because two files each did their own
arithmetic on the same string. A shared function is not an abstraction added for
its own sake — it is the same reason `chainedHooks` and `preCommitGate` are
already shared: install and doctor must not be able to disagree about what git
will do. It returns both answers together because they are one question asked
twice:

```ts
export function resolveHooksPath(repo, configured): { dir: string; own: boolean }
```

`dir` is `resolve(repo, configured)` — `resolve` replaces on an absolute
argument, which is exactly git's rule, and falls back to resolving against the
repo root otherwise. `own` is `dir === resolve(repo, HOOKS_DIR)`.

Rejected: normalising the value at the single place it is read from git and
passing the resolved directory around. That would lose the configured spelling,
which `init` and `doctor` both print back to the user, and printing a rewritten
path at somebody whose config says something else is its own small lie.

### 2. Identity is decided after resolution, never on the text

`hooksPath !== HOOKS_DIR` and `hp === HOOKS_DIR` are string comparisons against
the literal `.multivac/hooks`. Every other spelling of the same directory —
`./.multivac/hooks`, the absolute path — read as a foreign gate. Comparing the
resolved paths makes the test say what it means. The consequence is deliberate
and is in the spec (FR-004): a repo that spelled its own multivac hooks
directory the long way now gets the `fresh`/`chained` strategies, including the
run-time chain of a pre-existing `.git/hooks` hook, which it never got before.

The normalisation that follows is accepted rather than accidental: the
fresh/chained path ends by writing `core.hooksPath = .multivac/hooks`, so an
absolute spelling of our own directory is rewritten to the relative one. It
names the same directory and the relative form travels with the clone, which is
why that directory was chosen in the first place. FR-005 keeps the guarantee
that matters — a value naming a directory multivac does not manage is never
rewritten.

### 3. The report keeps its wording; only the directory it reads changes

Considered and declined: a new `doctor` line for the absolute case (naming the
resolved directory beside the configured one, or warning when the resolved
directory falls outside the repo). Both were rejected. The configured value and
the resolved directory are the same string whenever the spelling is absolute,
so printing both is printing twice; and a hooksPath outside the repo is the
maintainer's own configuration, correctly honoured, not a degradation to warn
about. The defect was that doctor read the wrong directory — with that fixed,
`pre-commit runs multivac (<dir>)` is already the true report and `--strict`
stops failing a checkout whose gate is armed. Adding surface with no failure
behind it is the gold-plating this project's own principles argue against.

### 4. Where the shims go when the resolved directory is outside the repo

They go there. That directory is where git will look, so writing anywhere else
is the disarm this change exists to remove; `mkdir` is already recursive, and
the `init` notice prints the absolute path, which is the same string the
maintainer configured. Refusing instead would trade a silent disarm for a loud
one and leave the gate down either way.

## Project Structure

### Documentation (this feature)

```
specs/004-core-hookspath-is-read-the-way-git-reads-it/
├── plan.md              # this file
├── spec.md
├── tasks.md
└── checklists/
    └── requirements.md
```

No `research.md`, `data-model.md` or `contracts/`: there is no unknown to
research (the rule is stated in `githooks(5)` and cited above), no entity to
model beyond the three named in the spec, and no external contract — the only
interface is one exported function inside this package.

### Source (repository root)

```
src/hooks/install.ts        # resolveHooksPath + installAlongside + installHooks
src/commands/doctor.ts      # alongsideParts + hooksLine read through the resolver
test/init/coexist.test.ts   # every new case, in the existing file's style
DESIGN.md                   # the rule, stated where the strategies are explained
site/content/docs/reference/hooks.md   # the same rule on the published page
.multivac/invariants.md     # MV-79 stated, MV-37 amended and dated
```

## Complexity Tracking

No entries. Nothing in this plan adds a file, a dependency, an abstraction with
one caller, or a configuration value.
