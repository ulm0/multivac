# Reading `mvac verify`

Verify answers one question: **is what the law claims still true of the
code?** It runs no tests and judges no quality. Every verdict line names its
state, whether it blocks, and the fix; `vacuous` and `unevaluated` are never a
pass. `mvac help verify` has the flags; this page is the judgement the lines
cannot carry.

## `moved` is where the thinking is

A rewritten anchor is a normal edit on your branch, and the one outcome that
can quietly launder a mistake. Read the diff and ask which happened:

- **A rename or a file move.** The mechanism is the same and lives elsewhere.
  Let it ride on the same branch.
- **A second, different site.** The original was *deleted* and the pattern
  also matches somewhere unrelated: the claim reads green while the thing it
  guarded is gone.

Does the new location do the same job, and did the old one disappear in this
same change? If either answer is no, do not keep the rewrite: restore the code,
or amend the claim deliberately. `--check` reports a move instead of taking it.

## `broken` is a fork, not an error

The law and the code disagree, and nothing in the output says which is wrong.
Ask the human when your change does not make it obvious:

- **The code drifted.** The claim is still what the product promises. Fix the
  code, never the anchor: rewriting an anchor to match broken code is how a law
  table becomes decoration.
- **The claim aged.** The product changed. Then it is a change: the row edited
  and dated, in the same commit as the code — never an anchor quietly
  re-pointed to make the run green.

A broken `absent` leg has no fork: a mechanism declared dead came back, and
that is always the code's problem. `absent`, `count` and `each` block; `present`
and `unique` report until `--strict`. Tell a human who asks why red went
through: a rename mid-refactor should not kill a commit, and calling a retired
mechanism should.

## Where it reads from

From the brain, siblings are read at their channel ref, the ecosystem as
published, and the brain at its working tree; from a code repo, its own working
tree, the content about to be committed there. `--worktree` reads local state
everywhere, on purpose. From any directory of a checkout the run is its root's,
and a full report printed away from the root names it in a `root` line. A
session start and a commit through the git shims run quiet (`--quiet`, or
`MULTIVAC_QUIET=1`, which the shims export): one line when nothing is off, a
read that is not plain printed in full beneath it, and the whole report the
moment anything else is off.

A run prints a `read` line per repo, or on a quiet run a clause of its one
line; quote it when a result surprises. A `read` line states a fact, not what
to do about it:

- **FELL BACK to the working tree**: that verdict is about somebody's local
  branch. Fetch before you believe it.
- **An old `last fetch`**: verify never fetches, so a fix already merged
  upstream is not in the bytes judged. `mvac repos sync` refreshes every repo.
- **The brain behind its own channel**: an out-of-date law is judging a current
  ecosystem. Pull the brain before you believe any red.

## The lines that are not claims

`enact`, `code` and `ecosystem` answer questions about the commit, not the law,
and each says its fix. A `code` refusal is never a reason to skip the hook:
start the change and commit in its worktree. In CI the same line judges a
range: `verify --strict --range <base>..<head> --branch <name>`.

## Reporting a run to a human

Give the verdict, not the transcript: the exit code, the count, then only the
legs that need a decision. A wall of `ok` lines is noise; a `broken` leg
without the two options above is a problem handed over half-analysed.
