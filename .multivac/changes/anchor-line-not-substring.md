---
slug: anchor-line-not-substring
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-82
  retires: []
claims:
  - id: MV-82
    statement: "A leg skips a line only when that line carries a COMPLETE anchor comment: the opener the grammar defines, and the `-->` that closes it. The opener is one exported recogniser the parser and the matcher share, so the two cannot disagree about the SHAPE — they are not thereby the same set, and nothing here claims they are: the parser reads a handful of .md files, the scanner reads every tracked file in every repo, so the anchors are a strict subset of what the scan hides. The guard MUST NOT be a test for any fragment shorter than the whole comment. As the bare word `@anchor` it made every line of every file mentioning the word invisible to every leg; as the opener alone it left six further spellings that silence a leg with nothing but a missing terminator."
---

# The scan guard skips anchor lines, not every line saying @anchor

`matchesInFile` skipped any line whose text contained the substring `@anchor`,
in any file of any type. Reproduced against MV-04
(`brain:src/** /user\.(name|email)/ absent`) at a6036cd:

    appended `const evade = "user.name"; // @anchor` to src/lib/paths.ts
      -> verify --strict: ok 81, 0 blocking, exit 0
    removed only the ` // @anchor` suffix
      -> broken MV-04 [absent] ... 1 blocking, exit 1

For a tool whose entire value is that a gate ran, this is the worst available
defect: an agent under gate pressure neutralises any tombstone with a trailing
comment and the run reports green.

The guard's purpose is legitimate and stays. An anchor line carries its own
regex TEXT, so when a leg scans a file that holds anchor comments — the law
table itself, a change file, DESIGN.md, the docs page quoting the grammar, or a
test fixture built from anchor strings — that text must not satisfy (or break)
another leg. What was wrong was its reach: the substring, not the line shape.

The fix, first pass. `parse.ts` already owns the one definition of the opener's
shape — `/<!--\s*@anchor\b/`, the test at its line 60. Export it as
`ANCHOR_LINE` and have `matchesInFile` consult it, so the two cannot disagree
about the SHAPE and a source line that merely names the word is scanned again.
What that does NOT buy — the first draft of this file claimed it and it was
wrong — is set equality. `collectBrainAnchors` parses a handful of `.md` files;
the scanner reads every tracked file in every declared repo. The lines the law
calls anchors are a strict SUBSET of the lines the scanner hides, and no
arrangement of one constant changes that. One shared PATTERN is the claim; it
is weaker and it is true.

The fix, second pass — the opener alone is still a password. It needs no
terminator, may sit anywhere in the line, and works in a file of any type. Six
spellings silence a leg on that gap: the opener with nothing closing it, with
zero whitespace, with a tab, with a non-word character satisfying `\b`, and the
opener inside a plain or a template string literal that is no comment at all.
So the skip requires both halves, `ANCHOR_LINE` **and** the `-->` the parser
already demands before it will accept an anchor — an unterminated opener is not
an anchor to the reader either, so the scanner must not treat it as one. Cost,
measured before it was taken: exactly 3 lines repo-wide stop being hidden
(`.multivac/changes/anchor-line-not-substring.md` 1,
`specs/006-anchor-line-not-substring/plan.md` 1, `test/anchor/parse.test.ts` 1),
and re-scanning all 528 legs with the old guard and the new one produced
byte-identical match sets — no leg moved.

Honest ceiling, stated precisely rather than gestured at: a line still hides
itself if it carries BOTH the opener and the three characters `-->` — presence
on the line, not position after the opener. That is a fully forged anchor
comment, in a block comment, ahead of the code, or quoted in a string, and it
need not be a well-formed anchor at all, because the scanner tests shape and
never grammar. No test on one line's shape can close it: `test/verify/`'s
fixtures quote whole anchors inside string literals and MUST stay hidden, and a
forgery is byte-identical to them in shape. (Writing the forged form out here
would itself parse as a live anchor: this file is one of the two places the
reader looks.)

Rejected, and on the reason that was actually measured rather than the one first
written down: anchoring the pattern to line start (`^\s*<!--\s*@anchor`). The
count in the first draft was right and its consequence was not. 111 lines stop
being hidden, not "~100 fixture lines in `test/verify/`" — 61 are under
`test/verify/`, 34 under `test/anchor/`, 16 across 15 other files. Run it: one
leg's count moves (MV-40 `present` on `src/commands/count.ts`, 2 matches to 3),
no leg's verdict moves, `verify --strict` stays exit 0. "The false-report class
reopened at scale" is what was feared, not what the measurement showed. The
reason to refuse it is that it buys nothing against the case it targets: a
forgery written after the code stops hiding, a forgery written before it
(`<!--` opener, `-->`, then the code) hides exactly as it does now, and the
forger picks the placement. Meanwhile `parseAnchors` accepts an anchor anywhere
on a non-indented line, so line-start would make the scanner scan lines the
reader still reads as law — a real divergence, traded for nothing.

Drafted anchors for MV-82, as landed:

    <!-- @anchor MV-82 brain:src/anchor/parse.ts /export const ANCHOR_LINE = \/<!--/ unique -->
    <!-- @anchor MV-82 brain:src/anchor/parse.ts /!ANCHOR_LINE\.test\(raw\)/ -->
    <!-- @anchor MV-82 brain:src/anchor/match.ts /ANCHOR_LINE\.test\(lines\[i\]\)/ -->
    <!-- @anchor MV-82 brain:test/anchor/match.test.ts /a source line that mentions @anchor in a comment is scanned/ -->
    <!-- @anchor MV-82 brain:src/anchor/match.ts /lines\[i\]\.includes\('--/ unique -->
    <!-- @anchor MV-82 brain:test/anchor/match.test.ts /the terminator is required in any file type/ -->

The last two are the terminator half, and they are what the first four could not
say: reverting only the `-->` requirement leaves `ANCHOR_LINE.test(lines[i])` on
the line, so legs three and four stay green. A leg that survives the mutation
it is supposed to catch is the same decoration this change already threw out
once.

One more was drafted and withdrawn on measurement, not on taste — the tombstone
`brain:src/anchor/match.ts /includes\('@anchor'\)/ absent`. It validates at 0
matches with the fix in place, and it *also* validates at 0 matches with the fix
reverted: the reverted line contains the word, so under the reverted guard it
hides itself from every leg. A tombstone that is green in both states is
decoration, and the mutation run is what exposed it — `verify` under the revert
listed the three positive legs as not matching and said nothing about this one.
The defect's signature is that its own implementation is invisible to the law.
