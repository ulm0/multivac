---
slug: the-gate-runs-what-you-built
status: open
horizon: now
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-92
  retires: []
claims:
  - id: MV-92
    statement: The gate runs the multivac that governs this checkout — the repo's own build first, its declared dependency second, whatever is on PATH last — and the build clears its output before compiling, so no check ever runs a file whose source is gone.
---

# The gate runs the code in this tree, not a copy of it

Two defects found while operating the tool, not by reading it. Same thesis:
a check that does not run the code in this tree is a check that can lie.

**The pre-commit hook runs whatever `multivac` is on PATH.** Committing in this
repo printed `this brain was brought to 0.7.0 and you are running 0.5.0` — the
hook shim resolved a stale global install rather than `dist/cli.js` from the
working tree. MV-86 caught the mismatch and said so, which is the row working;
the friction is that a repo developing multivac has its own gate judging it with
somebody else's copy, and a consumer repo has the same exposure whenever the
global drifts from the pin.

**`pnpm test` can pass or fail on leftovers from another branch.** `tsc` does not
delete output for sources that no longer exist, so `dist-test/` keeps compiled
tests from whatever branch was checked out before. Measured: after a rebase,
five failures from `test/init/reinit.test.ts` — a file absent from that branch.
The inverse is worse and silent: a deleted test keeps passing.

Both are small. The build clears its output directories before compiling, and
the hook resolves the multivac that belongs to the checkout it is gating —
naming which one it chose, because a gate that quietly picks a binary is the
same species of problem.
