---
slug: the-project-document-is-gated-on-existing
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-57
  adds:
    - MV-76
  retires: []
claims:
  - id: MV-76
    statement: A project-level document is gated on existing and on not still being the template, never on its content; staleness stays a report.
---

# The project document is gated on existing

MV-57 says the project-level document is "reported, never gated", and gives the
reason: "a constitution's content cannot be machine-judged". The reason is true
and the rule drawn from it is wider than the reason supports.

Three different questions hide behind "the constitution":

| question | machine-answerable | today |
| --- | --- | --- |
| is the file there | yes | reported |
| is it still the unfilled template | yes — `doctor` has a `placeholder` pattern | reported |
| is it stale, older than the law's newest row | yes | reported |
| are the principles any good | **no** | correctly not attempted |

Only the last one is unjudgeable. `doctor` already computes the first three and
prints them, so the machinery exists — what is missing is that nothing acts on
it. The door says `CREATE IT IF ABSENT` in capitals and no command has ever
refused for its absence, which is the same "prints it and checks none of it"
shape the ritual has, except the ritual says so about itself.

Found the ordinary way: this repo declared `sdd: speckit`, its door printed the
instruction, `doctor` reported the document missing, four lifecycle commands ran
green anyway, and the gap was noticed by a human reading the output rather than
by anything in the tool.

## What changes

`change plan` refuses while a declared `projectStep`'s artifact is missing or
unreadable, empty, or still carrying the fill-in tokens the tool's own template
ships — its declared `placeholder`, the pattern `doctor` already evaluates.

This paragraph first said "the same whole-file equality MV-65 already uses",
and building it proved that wrong twice over. `copiedFrom` FAILS OPEN when it
cannot read the template — deliberately, and eight tests in
`test/change/sdd-gates.test.ts` hold it there, because a real `plan.md` in a
repo with no template must pass — so reusing it would let an unwritten
constitution through exactly when the template is gone. And MV-65 chose
equality over a placeholder pin for a reason that inverts here: spec-kit's
`# Implementation Plan: [FEATURE]` heading is a line the tool never asks anyone
to change, while the constitution template's `[ALL_CAPS]` tokens are ones
`/speckit.constitution` explicitly instructs the author to replace. Same
project, opposite artifacts, opposite check. MV-76 states what was built.

Staleness stays a report. The law moving is not proof the principles need to,
and a gate there would refuse honest work on every unrelated row.

MV-57 is amended, not retired: the sentence that survives is that the document's
*content* is never machine-judged. The sentence that goes is that its *presence*
is never checked either.

## What merging MV-75 found

MV-75 landed while this branch was open, and `src/adapters/sdd.ts` merged with
no textual conflict into something semantically wrong: `runScaffold` runs
immediately before `sddGate` in the same command, and `specify init` writes
`.specify/memory/constitution.md` as the *unfilled template*. So a repo where
spec-kit had never run now had a constitution on disk one line before this gate
read it, written by nobody.

The gate was right and the fixture was not. The suite's stub `specify` wrote
`unfilled\n`, which matches no `[ALL_CAPS]` token, so the placeholder branch
never fired and `plan` went green on a document the scaffold had just invented —
this row's own test failing `0 !== 1`. Two facts, both checked: the scaffold did
run in that command (`specifyRuns().length === 1`, `scaffolded — brain:.specify
is there now`, the file present), and the gate passed it because the stub's
bytes were not the tool's bytes.

The fix is in the fixture, not in the gate: the stub now writes the template
with its tokens, and a test pins the interaction directly — scaffold and gate in
one command, the gate refusing *because it is the template*. Had the stub stayed
kinder than the tool, the whole of MV-76 would have been undone one layer down
by the command that runs in front of it. MV-76 is amended to say so.
