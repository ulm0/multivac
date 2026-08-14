---
title: Philosophy
weight: 1
---

You are an agent. Someone is asking you to change a system that spans more
repos than fit in your context. Before you write a line, you read what the
project says about itself — a `CLAUDE.md`, a rules file, a wiki page, the
"non-negotiable rules" section someone wrote at the top of a service.

The question multivac exists to answer is: **is any of that still true?**

## A paraphrase ages silently

Every one of those documents is a paraphrase. Someone read the real
constraint and retyped it, in their own words, in a second place. The
retyping is the failure mode: the original can change and the copy has no way
to notice. Nothing breaks. No test goes red. The sentence just quietly starts
lying, and it keeps being loaded into every session, first, as context.

In the ecosystem this design was validated against, each consumer repo's
"non-negotiable rules" were hand transcriptions of the central law. A
mechanism that had been retired was still described **in present tense**
inside two of those rule sections eleven days after it died — plus five live
spec files. Nobody was careless. Paraphrase just has no mechanism for aging.

The alternative is a **citation**. Not "accounts are created by one
migration" retyped in four repos, but one claim with an ID, and everywhere
else a pointer to it. A citation has a property a paraphrase never has: it
can be checked, mechanically, right now, offline, with no model in the loop.

```
| INV-02 | Account rows are created by exactly one migration. | specified | active | 2026-08-13 | ADR-4 |
<!-- @anchor INV-02 api:sql/migrations/*.sql /CREATE TABLE accounts/ unique -->
```

The row is the claim. The comment under it is the anchor: a content-based
assertion about the code — *in that repo, in those files, exactly one line
matches this*. `mvac verify` evaluates it against the actual checkout. If
someone adds a second migration creating accounts, the claim goes red the
same day, not eleven days later.

That is the whole idea. Everything else is plumbing around it.

## Three layers, and which of them a machine can write

A brain has three layers, and they are not equally derivable:

| layer | what it is | derivable from code? |
| --- | --- | --- |
| **Map** | what exists, what calls what, what contract each thing exposes | **yes**, and well — this is what graphers and `mvac seed` produce |
| **Law** | what is non-negotiable, and why | **no** — "a lawyer validated this sentence" lives in no AST |
| **Journal** | why a decision was reversed | **no** — it accumulates forward, it cannot be recomputed |

This table is why multivac is not a documentation generator. Generating the
map is a solved problem and the tool delegates it: declare a grapher, the
graph refreshes itself, done. The law is the part no static analysis reaches,
because the interesting constraints are the ones that come from outside the
code — a regulator, a contract, a postmortem, a decision someone made in a
room. And the journal is the only layer that cannot be regenerated at all,
which makes it the asset rather than the cost.

So the tool's job is not "read the repo and write the docs". It is: **derive
the map, interview for the law, and then keep the law honest against the code
forever.**

## Who proposes, who enacts

An agent may draft. Only a human enacts.

That split is mechanical, not advisory. `mvac seed` produces a deterministic
inventory of boundaries — no interpretation, nothing that is law. Your agent
reads it and drafts rows in the `proposed` state. A `proposed` row is
reported by `verify` and **never blocks**, not even under `--strict`. It
becomes `active` when a human moves the state cell, which is a commit with a
name on it.

The reason is not ceremony. A model extracting invariants from a codebase
produces confident, plausible, wrong claims, and a wrong claim promoted to
law is worse than no claim: it now blocks correct code and licenses incorrect
code. So the verification path contains no model at all — no API key, no
network call, no inference — and the drafting path contains no authority.
The agent that drafts is yours, running in your harness, on your terms;
multivac validates and files what it produces and never calls a model itself.

## The ritual

Closing a change has two halves. One is mechanical, and multivac runs it:
the landing order held, every claim the change promised resolves green, no
invariant got quietly relaxed in code instead of amended in the law. `mvac
change close` refuses until that half passes.

The other half is the team's, and no tool can invent or check it — who
reviews what, who gets told, what ships before what when the reason is not
technical. That half lives in `.multivac/ritual.md`, written by the team in
plain prose, and `change close` prints it verbatim as a checklist after the
gate passes:

```txt
$ mvac change close points-expire
INV-07: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C ~/eco/brain add -A .multivac/changes && git commit -m "Archive the points-expire change"

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] The branch is pushed and an MR is open — nothing lands on main directly.
  - [ ] The MR description states the landing order and names every claim.
```

Printed, never parsed, never gating. An empty or absent ritual prints
nothing. It gets its own file rather than a section of the law because the
law is a machine-parsed table — `verify` reads its anchors, `change plan`
reads its state cells — and free-form prose inside a parsed table is how a
parser learns to lie.

## What follows from all this

- **Deterministic or nothing.** `verify` uses `git ls-files` and a regex
  engine. Same answer on your laptop, in the pre-commit hook, and in CI.
- **The message is the product, not the exit code.** A red leg says which
  file, which line, and what to do about it. The consumer is an agent about
  to act, not a dashboard someone checks tomorrow.
- **Asymmetric severity.** A tombstone — "this is dead, do not call it" —
  blocks. A presence check that fails because a file was renamed
  self-heals and exits 0. Noise that blocks gets disabled; a guard that
  never blocks gets ignored.
- **Enforcement degrades, it never locks you out.** A machine without the
  binary on `PATH` commits normally. See [Hooks](../../reference/hooks).
- **Unanchored claims are counted, not pretended verified.** `verify` prints
  the anchored percentage in its first line. Grep covers tombstones, not
  semantics, and the tool says so rather than implying coverage it does not
  have.

Next: [Brain-driven development](../brain-driven-development) for the
practice, or [Claims and anchors](../claims-and-anchors) for the grammar.
