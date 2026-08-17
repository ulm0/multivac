# Implementation Plan: A finished change is not a pending one

**Branch**: `a-finished-change-is-not-a-pending-one` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-a-finished-change-is-not-a-pending-one/spec.md`

## Summary

Two halves, one predicate between them: *do this change's declared claims
resolve?*

**Half one.** `evaluateCore` in `src/commands/verify.ts` already computes
`pendingBy` (claim id → slug of the open change declaring it) and `claims`
(one `ClaimResult` per evaluated claim). MV-17's grace rewrites every
non-`ok` leg of a declared claim into `pending`, so a declared claim is
either `ok` or `pending` and nothing else — which makes "every declared claim
resolves" a single comparison. Invert `pendingBy` to slug → ids, keep the
slugs whose every id is `ok`, and cross that with the change file's own repo
statuses: all `landed`. Those slugs are finished, not pending. `--strict`
folds them into the same exit decision that already carries `gating` and
prints one line each naming the slug and `change close`.

**Half two.** `land` reads landing from the channel instead of from commit
containment. MV-53's `resolveSources` already reads a sibling repo at its
channel ref through `lsTree` + one `catFileBlobs`; the brain is its deliberate
exception, read as a working tree because that is the commit a `verify` run
gates. `land` asks a different question — *is this published?* — so it gets an
`atChannel` opt that switches the brain's own source to its channel ref, and
then reuses `evaluate` + `closeGate`, the same pair `close` already uses. Every
sentence it prints names the ref and its fetch age (MV-54), and an unresolved
claim is reported as "not landed, or not fetched", never as the first alone.
Nothing is derived: the read offers the conclusion and `--landed` stays the
human's assertion.

## Technical Context

**Language/Version**: TypeScript, Node >= 24, ESM, `node:test`
**Primary Dependencies**: none new — `yaml` and `picomatch` remain the only two
**Storage**: `.multivac/changes/*.md` (read), `.multivac/invariants.md` (read), git refs (read)
**Testing**: `pnpm test` (`node:test`, no frameworks), `node dist/cli.js verify --strict`
**Target Platform**: developer workstations and CI (macOS, Linux)
**Performance Goals**: `verify` stays sub-second — half one adds no file enumeration and no subprocess, only arithmetic over values `evaluateCore` already has
**Constraints**: no network, no model, no new runtime dependency, `git ls-files`/`ls-tree` for enumeration, tests must not depend on host configuration
**Scale/Scope**: two source files (`src/commands/verify.ts`, `src/commands/change.ts`), two test files, one law row amended with new legs

## Constitution Check

| Principle | Verdict | Why |
| --- | --- | --- |
| I. A claim nobody checks decays | PASS | MV-80 lands with six legs, each naming a contract rather than an implementation: two on `verify.ts` (the predicate's statement, "every declared claim resolves"; the verdict it prints, "finished, not pending"), two on `change.ts` (the published conclusion, the "not landed, or not fetched" limit MV-54 requires), and two on the tests by title. The row is amended in this same change and dated, because the built predicate carries a condition the drafted statement did not name. MV-17 is declared under `invariants.touches` and its own three legs are re-checked rather than assumed: the grace it describes is unchanged, and this feature adds a state *beside* pending rather than removing one. MV-53 and MV-54 are cited by the code that extends them and are neither amended nor weakened — `atChannel` is an additional read confined to `land`, not a change to what `verify` reads. |
| II. The tool never claims more than it checked | PASS | This is the principle the defect broke: `--strict` reported green while fourteen claims were excused. Three places where a proof is unavailable are written down rather than implied. (a) A run that evaluated only part of the legs — consumer-scoped, or claim-scoped — makes **no** finished verdict, because the verdict would be about bytes it never read. (b) A declared claim with no anchors produces no result and therefore never counts as resolved; those rows are already named as unanchored in the same output. (c) The channel read cannot distinguish "not landed" from "not fetched", so it says both, names the ref's age, and prints the fetching command — and it never writes the landed record, because a falsifiable record written from a local snapshot with no operator in the loop is the invented pass this project exists to catch. Every behaviour below is mutation-verified: the source is reverted, the build re-run, and the named test watched to fail. |
| III. The law changes before the code | PASS | MV-80 was reserved by `change new` and its statement was written before implementation. It is amended here — dated 2026-08-16, in this change, with the reason in the row — to state the landed condition the drafted sentence omitted, and to record the decision the change file left open (`--landed` offers, the human confirms). That is the row moving to describe what was built, not the code being relaxed to fit a leg: the predicate was **narrowed**, which makes the gate quieter and never greener on the state that motivated it, and the row says so. Nothing existing is relaxed — MV-17's grace, MV-18's containment evidence, MV-53's read rule and MV-54's freshness rule all keep their current statements and their current legs. MV-80 stays `proposed`: only a human enacts a row. |
| IV. Deterministic, offline, small | PASS | Half one spawns nothing: `finishedChanges` is a map inversion and a set membership test over values already in hand, and the repo statuses come from the change files `openChangeClaims` already parses on every run — the parse is shared, not repeated. Half two runs only inside `land`, which is not the pre-commit hook, and short-circuits on one `rev-parse` when the channel does not resolve; its read is `ls-tree` + one `cat-file --batch`, never a tree walk, never the network. No dependency is added. Tests build their own repositories under `tmpdir()` through the shared `gitInit`/`publishRepo` helpers and state their branch names, so nothing depends on the host's git configuration. |
| V. An invented integration is a lie | PASS | No adapter entry is added or touched, and nothing is derived from a tool's name. The channel ref comes from the configured value through the existing `channelRef`/`DEFAULT_CHANNEL` path, never guessed; the fetch age comes from the mtime of the repo's own `FETCH_HEAD` through the existing `lastFetchAge`, which is a fact on disk rather than an assumption about a forge. |

No violations. No Complexity Tracking entries.

## Design decisions

### 1. Finished is a three-part predicate, and the third part is why the gate is usable

```
finished(change) ⟺ declares ≥ 1 claim
                 ∧ every declared claim resolved `ok` in THIS run
                 ∧ every declared repo is recorded `landed`
```

The change file states the first two. The third is added here and the spec's
first Assumption carries the reason: the gate's only output is the instruction
`multivac change close <slug>`, and `cmdClose` refuses a change with any repo
not `landed` ("land every stage first"). A gate that prints an instruction the
same binary rejects is precisely how a real line stops being read — the failure
MV-80 exists to end.

It costs nothing against the damage. Every change that ever reached `close` had
all repos `landed`, because `close` will not run otherwise; the nine changes
that sat open were all closeable, so all nine satisfied it. What it buys is
silence on work in progress: without it the gate fires on every author's branch
at the moment their tests go green, which is not "finished and unclosed" but
"unlanded", the ordinary and correct state of work being written.

### 2. Vacuity is excluded by construction, not by a guard

`pendingBy` only ever contains claims, so a change declaring none never appears
in the inverted map and can never be judged. That is the implementation of "an
empty declaration does not read as finished by vacuity" — the alternative, an
`ids.length > 0` guard, would be unreachable code documenting a rule the data
structure already enforces. The comment says so; the test pins it.

Two changes declaring the same claim inherit the same rule for free: MV-17's
grace attributes a claim to the first open change alone, so the second is judged
on what is left to it, which may be nothing — and nothing is never finished.

### 3. One decision drives the line and the exit (MV-20's rule)

`evaluateCore` returns `finished: string[]`, and the exit code it computes
already folds it under `--strict`. `runVerify` prints ` · blocking` on each
finished line from the *same* condition and adds the same count to the summary's
`blocking` total. The existing `agrees()` invariant in the suite — a line marked
blocking exists exactly when the run gated — therefore holds unchanged.

### 4. `atChannel` switches one repo's read, in one command

```ts
// src/commands/verify.ts
export interface EvaluateOpts { …; atChannel?: boolean }
```

It is not a new read mechanism: `RepoScanner` already takes a ref, and
`resolveSources` already produces `ref:` for every sibling. The opt only
switches the brain's own source — MV-53's deliberate exception — from its
working tree to its channel, because "is this published?" cannot be answered by
the bytes the author has not pushed. Nothing else about `verify`'s read
changes, and no CLI flag exposes it: `land` is its only caller.

### 5. The landing verdict is per change, and `land` prints it once

The unit is the change, not the repo, because a `*` leg belongs to no single
repo and a per-repo split would have to invent an attribution. `cmdLand`
computes the evidence once and prints one line:

- with `--landed <repo>`: the record line cites the channel instead of the
  absent local merge, when the channel can speak;
- without: one `channel:` line stating what was seen and, when the claims
  resolve, the command that records it.

When the channel does not resolve, or the change declares no claims, the
evidence is `null` and every existing message — including MV-18's "no local
merge commit to confirm it" — prints byte-for-byte as before. That is why
MV-18's legs and the two existing `lifecycle-polish` assertions on that
sentence stay green without being touched.

### 6. `--landed` is not derived

The change file left this open. Decided against deriving, three reasons, all in
the spec's fifth Assumption: the negative is ambiguous by MV-54 (an unresolved
claim may mean unfetched), the positive is evidence and not proof (published
content does not prove *this* change published it), and the record is committed
state in the change file. The read offers; the flag stays the human's.

## Project Structure

```
src/commands/verify.ts     finishedChanges(), EvaluateOpts.atChannel,
                           resolveSources' brain-at-channel source, the
                           finished report line and its share of the exit
src/commands/change.ts     channelEvidence(), its two call sites in cmdLand
test/verify/verify.test.ts four tests: finished refused; work left still
                           pending; empty declaration; unlanded declaration
test/change/lifecycle-polish.test.ts  two tests: the channel as evidence,
                           and the unresolved-or-unfetched limit
.multivac/invariants.md    MV-80 amended and given its six legs
```

No new files, no new directories, no new exported module.

## Complexity Tracking

None. Two functions added, one optional field on an existing options
interface, no new abstraction and no new dependency.
