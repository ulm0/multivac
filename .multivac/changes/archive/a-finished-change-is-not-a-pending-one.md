---
slug: a-finished-change-is-not-a-pending-one
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-17
  adds:
    - MV-80
  retires: []
claims:
  - id: MV-80
    statement: "A change whose every declared claim already resolves is finished, not pending: verify refuses it as unclosed, and landing is read from the channel ref rather than from commit containment."
---

# A finished change is not a pending one

Nine changes sat open in this brain, five of them since before the session that
closed them. Their code had landed weeks earlier. Every one of their claims
resolved. Nothing was wrong except that nobody had run `close`.

MV-17 is what made that expensive: a claim listed by an open change is pending,
and pending never blocks — not under `--strict`, not in a blocking mode. So for
**fourteen claims**, breaking the code they pin printed as informational and
exited 0. `verify --strict` had been green the whole time, and part of that
green was grace rather than proof.

The failure hides itself. The longer a finished change stays open, the longer
its claims are not enforced, and the thing that would have told you is the same
line that has been scrolling past on every commit:

```
14 claims held pending by open changes ... — not gating;
close or delete the change to unmask them
```

Printed every run. Ignored every run. Same shape as the ritual, except the
ritual admits it is unverifiable and this is not.

## The distinction the tool does not make

A change opened five minutes ago with no code written and a change whose every
claim resolves are both "pending, never blocks". They are not the same state:

> A change whose every declared claim already resolves is not pending.
> It is **finished, and unclosed**.

That is decidable with what verify already computes, on the working tree, with
no remote and no fetch. `--strict` refuses it, names the slug, and says `close
it` — turning a notice that gets ignored into something that stops.

## Landing, read from the channel

The second half removes the reason the first half keeps happening. `close`
presupposes the change landed, and `land --landed <repo>` is a human assertion
because MV-18 could find no local evidence: this project squashes, so the
branch's commits are never ancestors of the default branch and containment
always fails.

But "did it land" does not need the forge. MV-53 already built the machinery:
the brain reads every declared repo **at its channel ref**, with `ls-tree` and
one `cat-file --batch`, because the law is about the ecosystem as published.
Point that at the brain's own channel and the question answers itself — if the
declared claims resolve against `origin/main`, the work is published, however
it got there. Squash breaks commit containment; it does not break content.

MV-54 sets the honest limit and it must be carried: a channel ref is only as
true as the last fetch, so an unresolved claim there may mean "not landed" or
may mean "not fetched", and the report has to name the ref's age rather than
pretend freshness.

## Open for the spec

Whether `land --landed` becomes derivable rather than asserted, or whether the
channel read only *offers* the conclusion and a human still confirms it. The
first removes a command nobody runs; the second keeps a human in the one place
this tool has always kept one. The plan decides, with the reason written down.

Not in scope: closing automatically. `close` archives files and prints a commit
the operator runs, because nothing lands on `main` directly and the branch is
theirs. Detecting that a change is finished is mechanical; deciding where its
archive commit goes is not.
