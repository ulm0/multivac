---
slug: the-declared-config-is-itself-invariant
status: planned
horizon: later
repos: {}
landing_order: []
invariants:
  touches: []
  adds: []
  retires: []
claims: []
---

# A config diff needs a change that declares it

The config decides which repos exist, which adapters bind and which gates run,
yet it can be edited by anyone at any time with nothing recording why. It is as
load-bearing as the law and it is governed by nothing.

Make a config diff require an open change that declares it. The traps are what
make or break this, and they are all real:

- multivac writes the config itself — `init`, `doors --adopt`, `repos sync`.
  Those writes must be exempt or the tool blocks itself, and the exemption must
  be expressed so it cannot be spoofed by a human editing by hand.
- the check runs in the pre-commit hook, so it stays offline and sub-second.
- a first-time init has no change and no law. Bootstrapping must work.
- what exactly is checked: that some change file names the config, or merely
  that a change is open? The weak reading is almost useless and the strong one
  is annoying. Pick one and defend it in the row.
