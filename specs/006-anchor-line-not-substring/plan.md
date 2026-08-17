# Implementation Plan: The scan guard skips anchor lines, not every line saying @anchor

**Branch**: `anchor-line-not-substring` | **Date**: 2026-08-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-anchor-line-not-substring/spec.md`

## Summary

One predicate, in one place, consulted twice.

`src/anchor/parse.ts:60` already owns the only correct definition of what an
anchor line looks like — `/<!--\s*@anchor\b/` — and uses it to decide which
lines of the law and of the change files declare a leg.
`src/anchor/match.ts:94` answers the same question with a different, wider test
— `lines[i].includes('@anchor')` — and uses it to decide which lines of *every
scanned file* contribute no matches. The gap between the two tests is the
defect: every line that says the word without carrying the comment is declared
by nobody and scanned by nobody.

The fix is to delete the second test rather than to write a third. Export the
first as `ANCHOR_LINE` from `parse.ts`, and have `matchesInFile` skip on it.
After that the set of lines the reader calls anchors and the set the scanner
hides are the same set by construction, not by two authors agreeing.

Everything else follows: MV-82 lands stating what the guard is for and what its
reach must not become, pinned by four legs — the pattern's own definition line,
the scanner's use of it, a tombstone on the substring test, and the named check.

## Technical Context

**Language/Version**: TypeScript, Node >= 24, ESM, `node:test`
**Primary Dependencies**: none new — `yaml` and `picomatch` remain the only two
**Storage**: none — `matchesInFile` is pure over `(file, text, regex)`
**Testing**: `pnpm test` (`node:test`, no frameworks), `node dist/cli.js verify --strict`
**Target Platform**: developer workstations and CI (macOS, Linux)
**Performance Goals**: `verify` stays sub-second. The hot loop swaps one `String.prototype.includes` for one `RegExp.prototype.test` on a non-global literal, per line, on the same lines
**Constraints**: no network, no model, no new runtime dependency, `git ls-files` for enumeration, tests must not depend on host configuration
**Scale/Scope**: two source files (`src/anchor/parse.ts`, `src/anchor/match.ts`), one new test file (`test/anchor/match.test.ts`), one law row added with four legs

## Constitution Check

| Principle | Verdict | Why |
| --- | --- | --- |
| I. A claim nobody checks decays | PASS | MV-82 is reserved by `change new` and lands in this change, dated, stating both halves the spec requires: what the guard is FOR (an anchor's own regex text must not satisfy or break another leg) and what it must NOT become (a substring test for the word). Four legs, none of them a doc comment: `brain:src/anchor/parse.ts /export const ANCHOR_LINE = \/<!--/ unique` pins that the definition exists and that its pattern begins at the comment opener — change the shape and the leg breaks; `brain:src/anchor/match.ts /ANCHOR_LINE\.test\(lines\[i\]\)/` pins that the scanner consults that definition rather than a private one; `brain:src/anchor/match.ts /includes\('@anchor'\)/ absent` is the tombstone on the exact defect, so reverting the fix turns the gate red; `brain:test/anchor/match.test.ts /a source line that mentions @anchor in a comment is scanned/` pins the check by title. The fourth leg is itself a proof of the fix: before it, that test title's line contains `@anchor` and is therefore invisible to every leg, so the leg could not have matched. No existing row is amended: no row covers this behaviour today, which was checked against all 81. |
| II. The tool never claims more than it checked | PASS | The feature's ceiling is written into the row and the spec rather than left to be rediscovered: a line that forges `<!-- @anchor` inside a source comment still hides itself, because no line-shape test can distinguish a forged instruction from a quoted one. What the fix removes is the case an ordinary comment reaches by accident. Two proofs are run rather than asserted: (a) mutation — the source is reverted, `pnpm run build` re-run, and the named assertion watched to fail, then restored; (b) end-to-end — the evading line is appended to a real source file, built, and `verify --strict` watched to go red, then restored. The consequence of the widened scan is measured, not argued: the exact set of newly readable lines is enumerated before the change (10 lines across 5 files) and the full `verify --strict` is run after it, with any leg whose verdict moved reported and decided on its merits. |
| III. The law changes before the code | PASS | MV-82's statement is written into the change file before `change apply` opens the worktree, and the row lands in the same change as the behaviour, dated 2026-08-17. Nothing is relaxed: the guard is **narrowed**, so every line hidden after the change was hidden before it, and no leg becomes easier to satisfy. If the narrowing makes an existing `count=N` leg see more matches, the number is re-based in the row with the reason stated in the row — the law moving to describe what is true, not a leg being loosened to fit the code. MV-82 stays `proposed`; only a human enacts a row. |
| IV. Deterministic, offline, small | PASS | The diff is three lines of source: one exported constant, one import, one changed condition. No subprocess, no file enumeration, no network, no dependency. The regex literal is module-scope and carries no `g` flag, so it holds no `lastIndex` state between lines and the scan stays order-independent — a stateful literal here would make one file's verdict depend on the file scanned before it. The new test is `node:test` + `node:assert/strict` over the pure `matchesInFile`, with its inputs written inline, so it touches no filesystem and reads no host configuration. |
| V. An invented integration is a lie | PASS | No adapter, harness, grapher or SDD entry is added or touched. Nothing is derived from any tool's name. |

No violations. No Complexity Tracking entries.

## Design decisions

### 1. Export the parser's predicate; do not write a second one

The scanner and the reader ask what is verbally a different question — "is this
line an instruction rather than content?" versus "does this line declare a
leg?" — but any answer where they differ is a bug in one direction or the
other. Two independent expressions in two files is exactly how this defect was
born, so the fix is one exported constant:

```ts
// parse.ts
/** A line carrying an anchor comment. The one definition ... */
export const ANCHOR_LINE = /<!--\s*@anchor\b/;
```

`parse.ts:60` becomes `if (!ANCHOR_LINE.test(raw)) continue;` and
`match.ts:94` becomes `if (ANCHOR_LINE.test(lines[i])) continue;`.

Import direction is `match.ts → parse.ts`. Checked for cycles: `parse.ts`
imports `node:fs/promises`, `node:path`, `../lib/config.js`, `../lib/regex.js`
and `../types.js`; `lib/config.ts` imports `./paths.js` and `../types.js`.
Nothing in that closure imports `anchor/match.ts`, so no cycle is created.

The literal keeps `\b` after the keyword, matching the parser's current test
exactly: `@anchorage` in a comment is not an anchor and must be scanned.

### 2. The comment may sit anywhere in the line — the rejected alternative and why

`^\s*<!--\s*@anchor` would close a little more: it would make
`// <!-- @anchor -->` in a `.ts` file scannable again, since no compilable
source line begins with an HTML comment opener.

It was rejected on measurement. Enumerating every line in the repository that
carries `<!--\s*@anchor` but does not begin with it returns roughly a hundred
lines, and almost all of them are check-suite fixtures of the form:

```
    '<!-- @anchor INV-08 *:README.md /FLUXCAP/ absent -->',
```

Those are whole anchor lines quoted inside string literals — precisely User
Story 2's protected case. Under the line-start reading they become ordinary
content and their embedded search text goes live: a leg forbidding a token
would start finding it in the fixture that describes forbidding it. That is the
false-report class the guard exists to prevent, reintroduced at scale, and it
would also put the scanner's answer at odds with the reader's, which decision 1
exists to end.

The residue is stated rather than hidden: a forged anchor comment inside source
still hides its line. That is a deliberate forgery of a grammar construct, not
a word appearing in a comment, and a line-shape test cannot tell it from a
quotation.

### 3. The consequence is measured before and after, never assumed

Newly readable lines, enumerated at `a6036cd` — every tracked line containing
`@anchor` that does *not* carry `<!--\s*@anchor`:

| file | lines |
| --- | --- |
| `src/anchor/parse.ts` | 4 |
| `test/anchor/parse.test.ts` | 2 |
| `src/commands/change.ts` | 2 |
| `test/skill.test.ts` | 1 |
| `src/anchor/match.ts` | 1 |

Ten in total. Whether any of them moves a leg's verdict is decided by running
`verify --strict` after the change, not by reading them. Three outcomes are
planned for in advance: nothing moves, and the run is green; a `count=N` leg
sees more matches, and the number is re-based in the row with the reason; an
`absent` or `each!` leg fires, and that is a real finding about the code,
reported and fixed on its merits — never a reason to widen the skip back.

### 4. The SQL path is untouched

`matchesInFile` splits on `sqlStatements` for `*.sql` and returns before the
line loop. That branch never consulted the substring test and does not consult
`ANCHOR_LINE`. FR-005 is satisfied by not editing it, and the plan states this
so that "unchanged" is a decision rather than an oversight.

### 5. Tests: three cases, one of which is the evasion itself

`test/anchor/match.test.ts`, new, in the style of its siblings in
`test/anchor/` — `node:test`, `node:assert/strict`, inputs inline, direct
import of the function under test:

1. **`a source line that mentions @anchor in a comment is scanned`** — the
   evasion, verbatim from the reproduction: `const evade = "user.name"; //
   @anchor` against MV-04's pattern. One match at line 1. This is the assertion
   named in the mutation proof, and it is the assertion MV-82's fourth leg pins.
2. **a genuine anchor comment line is skipped** — a real row-and-leg pair from
   the law, scanned with a pattern the leg's own regex text would satisfy. Zero
   matches from the anchor line, one from the ordinary line beside it, so the
   test proves the skip is line-scoped rather than file-scoped.
3. **a docs page quoting the grammar does not satisfy a leg** — the fenced
   example shape used in `site/content/docs/guide/writing-anchors.md`. Zero
   matches.

A fourth guards decision 1's cycle-free, state-free choice: the same line
scanned twice returns the same answer, which fails if the literal ever gains a
`g` flag.

## Project Structure

### Documentation (this feature)

```
specs/006-anchor-line-not-substring/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

No `research.md`: nothing is unknown. No `data-model.md`: no entity is stored.
No `contracts/`: no interface crosses a process boundary — the only signature
that changes is one new export inside the package.

### Source Code (repository root)

```
src/anchor/
├── parse.ts     # + export const ANCHOR_LINE, used at the existing line 60
└── match.ts     # import it; matchesInFile skips on it instead of the substring

test/anchor/
└── match.test.ts   # new: the evasion, the genuine anchor, the quoted grammar

.multivac/
├── invariants.md                        # MV-82 stated + four legs
└── changes/anchor-line-not-substring.md # the change file
```

## Complexity Tracking

No entries. The change removes a special case rather than adding one, and the
line count of `src/` goes down by nothing and up by nothing that branches.
