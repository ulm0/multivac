# Reading `mvac verify`

`--help` tells you the flags. This tells you what to do with the answer,
which is the part that needs judgement.

Verify answers exactly one question: **is what the law claims still true of
the code?** It runs no tests, lints nothing, compiles nothing, and calls no
model. Every line it prints is about a claim, never about quality.

## The outcomes

| line | means | what you do |
| --- | --- | --- |
| `ok` | every leg of the claim resolved | nothing |
| `moved` | the pattern is gone from the declared glob but found elsewhere, and the anchor was rewritten to point there | **review it like any other edit** — see below |
| `broken` | the pattern is not where the claim says, and not anywhere the self-heal would accept | decide: fix the code, or amend the law |
| `pending` | a claim declared by an open change whose code is not written yet | nothing — this is the intended order |
| `vacuous` | the glob matched no tracked file, so the leg asserted nothing | fix the glob — a leg over nothing is not a passing leg |
| `unevaluated` | a declared repo is not on disk, so its legs were not read | `multivac repos sync`, then re-read |

Six states, not four. `vacuous` and `unevaluated` are the two that look like
silence: neither is a pass, and the summary counts them separately so that a
run judging nothing cannot be mistaken for a run judging everything.

`pending` is not a failure and never gates. Declaring the claims before the
code exists is the flow, not a mistake: `close` is what refuses until they
hold.

## `moved` is where the thinking is

A rewritten anchor is a normal edit on your branch and it is also the one
outcome that can quietly launder a mistake. Read the diff and ask which of
these two happened:

- **A rename or a file move.** The mechanism is the same, it lives somewhere
  else, the anchor now says so. Let it ride.
- **A second, different site.** The original call site was *deleted* and the
  pattern happens to also match somewhere unrelated. The anchor now points at
  code that was never the subject of the claim, and the claim reads green
  while the thing it guarded is gone.

The second is rare and expensive. Two questions separate them: does the new
location do the same job, and did the old one disappear in this same change?
If the answer to either is no, do not keep the rewrite — restore the code, or
amend the claim deliberately.

`--check` never writes, so a run you only want to *read* — a review pass, a
read-only checkout — reports the move instead of taking it.

## `broken` is a fork, not an error

A broken leg means the law and the code disagree. Nothing in the output tells
you which one is wrong, and guessing is the failure mode. Ask the human when
it is not obvious from the change you are making:

- **The code drifted.** The claim is still what the product promises. Fix the
  code, not the anchor. Rewriting an anchor to match broken code is how a law
  table becomes decoration.
- **The claim aged.** The product genuinely changed. Then this is a change,
  with a row edit and a date, in the same commit as the code — never an anchor
  quietly re-pointed to make the run green.

An `absent` leg breaking is the one case with no fork: a tombstone breaking
means a mechanism declared dead has come back. That is always the code's
problem.

## What gates and what only reports

Blocking by default: `absent`, `count`, `each`. Reporting: `present`,
`unique`, until `--strict`.

The asymmetry is deliberate and worth repeating to a human who asks why their
commit went through with red in the output — a rename mid-refactor should not
kill a commit, and calling a mechanism that was retired should.

## Where it reads from

This one surprises people, so say it out loud when you report a result:

- **From the brain:** sibling repos are read at their **channel ref**
  (`origin/main` by default), the brain at its working tree.
- **From a consumer repo:** its working tree — the content about to be
  committed there.

So a sibling parked on a half-finished branch cannot redden the brain's law,
and a green run in the brain is a statement about the ecosystem as published,
not about whatever is checked out locally. `--worktree` reads local state
across every repo instead, on purpose, when that is the question.

Every run prints a `read` line per repo naming the ref and its sha. Quote that
line when a result is surprising — it usually explains it.

## Reporting a run to a human

Give the verdict, not the transcript. The exit code, the count, and then only
the legs that need a decision. A wall of `ok` lines is noise; a `broken` leg
without the two options above is a problem handed over half-analysed.
