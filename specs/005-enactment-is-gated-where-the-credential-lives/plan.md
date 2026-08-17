# Implementation Plan: enactment is gated where the credential lives

**Branch**: `enactment-is-gated-where-the-credential-lives` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-enactment-is-gated-where-the-credential-lives/spec.md`

## Summary

"The agent proposes; the human enacts" lives as prose in
`skills/multivac/SKILL.md` and `site/content/docs/concepts/invariants.md`,
anchored in neither, and it cannot be anchored: MV-04 forbids multivac from
fabricating git identity, so an agent commits as the person, and a git hook runs
with the caller's permissions, so a pre-commit gate is one the same process can
skip. MV-81 therefore declares that half **ungateable with its reason** — the
shape this repo already uses for `/speckit.analyze` and a clean
`/speckit.converge` — and names the forge's merge button as where enforcement
actually is. `doctor` prints the same sentence, from the same string, because
`doctor --strict` is the report that asserts the gate is armed and its silence
about this rule would read as coverage.

The checkable half is not *who* but *when*. A row that goes `proposed → active`
in the same commit that writes the code it anchors is a rule nobody reviewed on
its own. `verify` reads **tracked files**, which show a state, never a state
*change* — so the check is built on `git diff --cached`, which is populated
exactly while a commit is being composed. That is a real limit, so `verify`
prints one `enact` line on every run saying which of three things happened:
it could not answer (with the reason), it answered and no row was enacted, or it
answered and a row was enacted — alone (pass) or beside its code (refusal,
exit 1).

## Technical Context

**Language/Version**: TypeScript, Node >= 24, ESM, `node:test`
**Primary Dependencies**: none new — `yaml` and `picomatch` remain the only two
**Storage**: git's own index and object store; `.multivac/invariants.md`
**Testing**: `pnpm test` (`node:test`, no frameworks), `node dist/cli.js verify --strict`
**Target Platform**: developer workstations and CI (macOS, Linux)
**Performance Goals**: `verify` stays sub-second — 1 `git` call in the ordinary case (the law untouched), 4 in the worst case
**Constraints**: no network, no model, no new runtime dependency, `git ls-files`-style enumeration only, never a tree walk
**Scale/Scope**: two source files (`src/commands/verify.ts`, `src/commands/doctor.ts`), one shared parse helper in `src/anchor/parse.ts`, one test file, two doc surfaces, one law row

## Constitution Check

| Principle | Verdict | Why |
| --- | --- | --- |
| I. A claim nobody checks decays | PASS | MV-81 lands with legs on the refusal message and the ungateable declaration in `src/commands/verify.ts` by phrase, on the `doctor` line that reprints it, on the new test by title, and on the site concept page that states the rule to a reader. The one part with no leg is the part that has no artifact — and that absence is the row's own subject, stated in the row rather than left as a gap. |
| II. The tool never claims more than it checked | PASS | This principle is the feature. The uncheckable half is declared ungateable **with both its reasons** and names where enforcement lives, instead of being faked with a pre-commit gate the same process can skip. The checkable half states its own limit twice — in the row and in the `enact` line — and when it cannot answer it says so rather than staying quiet and letting a green run imply it checked. Nothing here claims to identify who authored a commit. Every behaviour below is mutation-verified: the source is reverted, `pnpm run build` is re-run, and the named test is watched to fail. |
| III. The law changes before the code | PASS | MV-81 was reserved by `change new` and its statement was written before this plan. The row is amended in this same change, dated 2026-08-16, to state the limit the implementation actually has (index-only, inside a commit, not a security boundary) and to add the `doctor` leg — an addition, never a relaxation. The row's claim in `.multivac/changes/enactment-is-gated-where-the-credential-lives.md` is kept byte-consistent with it, which `change close` checks. The declined CODEOWNERS proposal stays recorded in the change file and is not reopened. |
| IV. Deterministic, offline, small | PASS | `git diff --cached --name-only -z` and, only when the law file is among the staged paths, `rev-parse HEAD` plus two `cat-file blob` reads. No network, no model, no tree walk, no new dependency. The ordinary commit — one that does not touch the law — costs exactly one git call and stops. The new tests build their own repositories under `tmpdir()` through the shared `gitInit` helper, which pins the branch name, so no assertion depends on host configuration. |
| V. An invented integration is a lie | PASS | No adapter entry is added or touched. The forge's merge button is named as a fact about where enforcement lives, not modelled, queried or automated — multivac makes no call to any forge here, and the row says the enforcement is somewhere multivac is not. |

No violations. No Complexity Tracking entries.

## Design decisions

### 1. The index is the only honest source, and the limit is printed

`verify` sees the world through `git ls-files`: tracked content, one snapshot.
A snapshot can say a row *is* `active`; it cannot say the row *became* `active`
in the commit being made. The question MV-81 asks is about a transition, so the
evidence has to be a comparison, and the only comparison available offline
without inventing a reference is HEAD against the index — which is exactly what
a pre-commit hook is standing in the middle of.

Rejected: comparing the working tree's law against the channel ref (MV-53). It
would answer on any run, which is the attraction, but it answers a *different*
question — "has this branch enacted a row since it forked" — which is true for
every commit after the enacting one, so the refusal would follow the branch
around forever and the only way to clear it would be to merge. It also depends
on how recently the operator fetched, making the verdict a function of network
history.

Rejected: staying silent when nothing is staged. A check whose scope is
narrower than its output implies is the exact failure this project exists to
prevent. One line, on every run, naming which of the three outcomes happened.

### 2. The offence is "beside the code it anchors", so the anchors define it

For each newly-`active` row, the offending set is the staged paths matched by
that row's own anchors, restricted to anchors whose repo key names this
checkout (`brain`, `*`, and any config key that resolves to the brain — the
alias rule MV-12 already established). `.multivac/invariants.md` is always
excluded: it necessarily carries the state change, and counting it would make
enactment impossible rather than separate. Anchors naming a sibling repo
contribute nothing, because those files are not in this commit.

Rejected: refusing any commit that touches the law alongside anything else. That
is a wider rule than MV-81 states and would refuse ordinary, harmless commits —
a row's `source` link fixed while a README typo is fixed. The row says "beside
the code it anchors" and the check says exactly that.

### 3. A row born `active` counts as an enactment

`before.get(id) !== 'active'` treats a row absent from HEAD's law as
not-previously-active, so a row that appears already `active` is an enactment.
That is the stronger offence, not a loophole: the lifecycle files new rows
`proposed`, so a row born in force skipped the same review, and the check
that catches the transition must catch the shortcut around it.

### 4. One sentence, two printers

`ENACTMENT_UNGATEABLE` is a single exported string in `src/commands/verify.ts`.
`doctor` imports and prints it. Principle I's reason for existing is that a
paraphrase ages silently — two hand-written copies of the declaration in two
commands is precisely that, and this repo has already been bitten by it (MV-79's
`join` lived in two files and the two disagreed). `doctor` already imports from
`hooks/install.ts` and `anchor/parse.ts` for the same reason.

The string lives in `verify.ts` because it is verify's own statement about what
verify can and cannot check; `doctor`, whose job is "what is armed", reports it.

### 5. `parseClaimRows` split out of `readClaimRows`

`readClaimRows(brainDir)` reads a file and parses it. This check needs the same
parse applied to two blobs that are not files on disk. The parse moves into an
exported `parseClaimRows(text)`; `readClaimRows` becomes the file-reading
wrapper over it. No behaviour changes and no second parser is written — a second
parser of the law table is how the two would eventually disagree about what a
row's state is.

## Project Structure

### Documentation (this feature)

```text
specs/005-enactment-is-gated-where-the-credential-lives/
├── plan.md              # this file
├── spec.md
├── tasks.md
└── checklists/
    └── requirements.md
```

No `research.md`: nothing here needed investigation beyond reading git's own
behaviour for `diff --cached` and `cat-file blob :path`, both of which are
exercised directly by the tests. No `data-model.md` or `contracts/`: the feature
adds no persisted entity and no external interface — the law table's row shape
and the anchor grammar are both pre-existing and unchanged.

### Source Code (repository root)

```text
src/
├── anchor/
│   └── parse.ts         # parseClaimRows split out of readClaimRows
└── commands/
    ├── verify.ts        # ENACTMENT_UNGATEABLE + enactmentLine + the exit contribution
    └── doctor.ts        # one `enact` line, printing that same string

test/
└── verify/
    └── verify.test.ts   # four tests, matching the file's existing captured()/setLaw() style

site/content/docs/concepts/invariants.md   # the declaration a reader meets
.multivac/invariants.md                    # MV-81, amended and dated
```

## Complexity Tracking

No entries. No principle required a justification.
