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
    statement: "A leg skips a line only when that line carries an anchor comment — the `<!-- @anchor` opener the grammar defines — decided by one exported recogniser that the parser and the matcher share, so the set of lines the law calls anchors and the set the scan hides can never drift apart. The guard MUST NOT be a substring test for the word `@anchor`: that reach made every line of every file that merely mentioned the word invisible to every leg, so seven characters of trailing comment silenced any `absent`, `unique`, `count` or `each!` tombstone and verify still reported green."
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

The fix. `parse.ts` already owns the one definition of what an anchor line looks
like — `/<!--\s*@anchor\b/`, the test at its line 60. Export it as
`ANCHOR_LINE` and have `matchesInFile` skip on the same predicate. One constant,
two callers, no drift: the matcher hides exactly the lines the parser calls
anchors, and a source line that merely names the word is scanned again.

Rejected: anchoring the pattern to line start (`^\s*<!--\s*@anchor`). It closes
a little more, but it un-hides ~100 test-fixture lines that quote whole anchors
inside string literals (`test/verify/verify.test.ts` and friends) — reopening
the exact false-positive class the guard exists to prevent, and diverging the
matcher's answer from the parser's. Honest ceiling, stated rather than hidden:
forging an anchor comment — the HTML opener plus the keyword — inside a source
comment still hides that line. That is not a substring slip but a deliberate
forgery of a grammar construct, and no line-shape test can tell a forged anchor
from a quoted one. (Writing the forged form out here would itself parse as a
live anchor: this file is one of the two places the reader looks.)

Consequence checked, not assumed: 10 lines across 5 files stop being hidden
(`src/anchor/parse.ts` 4, `src/commands/change.ts` 2, `src/anchor/match.ts` 1,
`test/anchor/parse.test.ts` 2, `test/skill.test.ts` 1). Full `verify --strict`
after the fix decides whether any existing leg changes verdict.

Drafted anchors for MV-82:

    <!-- @anchor MV-82 brain:src/anchor/parse.ts /export const ANCHOR_LINE = \/<!--/ unique -->
    <!-- @anchor MV-82 brain:src/anchor/match.ts /ANCHOR_LINE\.test\(lines\[i\]\)/ -->
    <!-- @anchor MV-82 brain:src/anchor/match.ts /includes\('@anchor'\)/ absent -->
    <!-- @anchor MV-82 brain:test/anchor/match.test.ts /a source line that mentions @anchor in a comment is scanned/ -->
