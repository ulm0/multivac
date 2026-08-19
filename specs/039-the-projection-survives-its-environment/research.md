# Phase 0 — Research: The projection survives its environment

## Measurement 1 — the worktree

On git 2.55:

| context | `--git-dir` | `--git-common-dir` | `hooks/` under it |
| --- | --- | --- | --- |
| ordinary checkout | `.git` | `.git` | yes / yes |
| linked worktree | `.git/worktrees/wt` | `.git` | **no** / yes |

So the shim's chain probe finds nothing in a worktree and the repo's own gate
is skipped — while the docstring above it says worktrees resolve.

**Decision**: `--git-common-dir`, in the shim and in `gitHooksDir`, and rewrite
the docstring.

**Rationale**: `hooks/` is not a per-worktree path in git, so the common dir is
the right answer everywhere, and the two spellings are identical outside a
worktree — the swap is a no-op there, measured before proposing it.

## Measurement 2 — two dialects for one string

`refreshHookCmd` embeds the declared command raw into a shell line for the
harness hook. `refreshGraph` runs `split(' ')` and execs the parts as argv. A
command with a quoted argument, a redirect or `&&` therefore works after an
edit and breaks at close.

**Decision**: `refreshGraph` runs the declared string through a shell too.

**Rationale**: the string is the operator's, and it is already a shell line on
its other runner. Making the two agree by teaching the argv path to parse
shell would be a shell parser; making them agree by using a shell is one flag.

**Ceiling**: `binaryPresent` still probes the FIRST WORD of the declared
command, so a command that begins with `env` or a variable assignment is probed
wrongly. That is MV-59's existing behaviour and is stated rather than fixed.

## Measurement 3 — one file ends the run

`applyManagedBlock` throws, and no caller catches. `doors` iterates repos, so
the third repo's mangled door starves the fourth, fifth and sixth of a door and
of hooks. `init` has the same throw between its config write and the law table.

**Decision**: catch at every call site and turn the throw into that file's
notice.

**Rationale**: the notice already names the file (MV-108). What was missing is
that the caller kept going.

Duplicate marker pairs are refused rather than half-updated: updating the first
leaves an agent reading two doors that diverge, and the tool has no basis for
choosing which is the real one.

## Measurement 4 — presence is not armed

`doctor` tests that our shim file exists. A shim edited down to `exit 0` is
reported installed, and `--strict` calls the gate armed — the same
presence-is-not-identity class MV-108 closed for foreign hooks, still open for
our own.

**Decision**: read the file and apply the shared `runsMultivac` predicate.

## Constitution and law

- **MV-37** — the repo's own hook runs first and its exit code wins. Made true
  in a worktree.
- **MV-59** — the grapher's declared command is the operator's. Its
  first-word probe is the stated ceiling.
- **MV-73** — narrowed to the mirror it actually prunes.
- **MV-108** — presence is not identity, applied to our own shim.
