---
slug: the-project-document-is-gated-on-existing
status: open
repos:
  brain:
    status: planned
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
    statement: "A project-level document is gated on existing and on not still being the template, never on its content; staleness stays a report."
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

`change plan` refuses while a declared `projectStep`'s artifact is absent, or is
still byte-identical to the template the tool ships — the same whole-file
equality MV-65 already uses for step artifacts, and for the same reason: an
existence check is the weakest proof available, and spec-kit hands the template
out as part of `init`.

Staleness stays a report. The law moving is not proof the principles need to,
and a gate there would refuse honest work on every unrelated row.

MV-57 is amended, not retired: the sentence that survives is that the document's
*content* is never machine-judged. The sentence that goes is that its *presence*
is never checked either.
