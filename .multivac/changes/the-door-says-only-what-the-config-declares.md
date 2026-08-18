---
slug: the-door-says-only-what-the-config-declares
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-91
  adds:
    - MV-101
  retires: []
claims:
  - id: MV-101
    statement: The door `init` writes names an adapter only where the config declares one, so `init` and `doors` project the same door from the same repo — a flag the config does not answer is reported and never rendered.
---

# The door says only what the config declares

MV-91 ended the case where a flag DISAGREED with the config. The case where
the config answers NOTHING is still open, and it fails the same way.

Measured on a fresh build of `main` at 4d25ae2:

    $ mvac init --quiet .              # no --sdd, so the config declares none
    $ mvac init --sdd speckit .
    init: .multivac/config.yml kept — edit it directly, then `multivac doors`
    init:   --sdd speckit is not in it: add `sdd: speckit` there, then `multivac doors`
    $ grep -c '^sdd:' .multivac/config.yml
    0
    $ grep -o 'Features gate through the `[a-z]*` SDD' AGENTS.md
    Features gate through the `speckit` SDD

The run says the flag did not take effect and writes a door where it did. Then:

    $ mvac doors                       # nothing edited in between
    $ grep -o 'Features gate through the `[a-z]*` SDD' AGENTS.md
    (nothing)

`doors` reads the config alone, so it removes the block `init` just wrote. Two
commands, one repo, two different doors, and which one you get depends on which
ran last.

**Why it happens.** `init.ts` resolves the door as `declared?.sdd ?? f.sdd`.
MV-91's row calls that ordering "belt and braces" — safe because the refusal
above it means the two can no longer disagree. That is true for the row where
the config DECLARES an adapter, and false for the row where it declares none:
there `declared?.sdd` is undefined, the `??` falls through to the flag, and the
flag reaches the door it was just reported as not reaching.

**Why it matters more than it looks.** The door is the file an agent reads
first. This one names an SDD the law does not declare — the exact shape MV-91
exists to end — and it is worse than the disagreement MV-91 caught, because
nothing in the repo records the choice: the config is empty, so the next
`doors` silently reverts it and no diff explains why the agent's instructions
changed.

**The fix is one operator.** `declared?.sdd ?? f.sdd` becomes the config's
answer when there is a config, and the flag only on a first run — which is what
MV-91's own prose already says: *the config is authoritative on a re-run*.

**What stays.** The report is right and does not move: a flag naming an adapter
the config declares none of is reported with how to make it stick, never
refused, because nothing disagrees. After this change the report is also TRUE.
