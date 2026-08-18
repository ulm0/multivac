---
slug: the-tool-urges-the-parallelism-it-already-knows-about
status: planned
horizon: next
repos: {}
landing_order: []
invariants:
  touches: []
  adds: []
  retires: []
claims: []
---

# Urge the fan-out the tool already computes, and run the SDD chain unattended

Two omissions where multivac knows something and says nothing.

**Parallel agents.** Four signals are already computed and none is acted on:
sibling stages in `landing_order` state outright that two repos have no ordering
dependency; one worktree per repo is handed back by `change apply`, which is the
isolation that makes concurrent edits safe; `[P]` markers in the SDD tool's task
list mean exactly "different files, no dependency on incomplete work" and have
no consumer anywhere; and one phase per user story is that tool's own definition
of an independently testable increment.

Print the fan-out where the tool knows it — `change apply`, the moment the
worktrees exist. Two boundaries the row must carry: the same file is never
parallel, because two writers is a lost update; and the law does not
parallelise, because every change edits the invariants table, ids are reserved
one at a time, and stages serialise there by design. It urges and never gates,
for MV-27's reason — no artifact proves an agent ran two things at once.

**The SDD chain is not automatic.** The lifecycle prints each step and refuses to
move on without its artifact, but never tells the agent to keep going, so an
operator who has already decided to follow the flow is asked to say "continue"
once per step. Principle II forbids shelling out a fake subcommand to simulate
an agent step, and there is no binary — the steps are prompts. So the fix is in
what is printed and in the projected door: automatic by default with the opt-out
named on the same line, stopping only at a real question, never to ask
permission to continue.
