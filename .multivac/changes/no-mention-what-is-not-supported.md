---
slug: no-mention-what-is-not-supported
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-28
    - MV-31
  adds: []
  retires: []
claims:
  - id: MV-28
    statement: "Every registry entry is a harness multivac can actually own; there is no unsupported kind and no entry for a tool it cannot write a door for."
---

# Do not name what you do not support

`aider` was a registry entry of `kind: 'unsupported'`, carrying a careful note
about why `.aider.conf.yml` is not a file multivac should own. The note was
true. The entry was still wrong.

An entry is how this tool says **supported**. It shows up in `--provider`'s
legal values, in the reference table, in the count of what multivac integrates
with, and in `doctor`'s door line. Everyone who did not open the entry read it
as support; the ones who did got a paragraph explaining that none of it
applied. The honest-gap doctrine that put it there — better a stated gap than
an invented door — was aimed at the *format* of an entry we ship, not at
shipping an entry for something we do not.

An unknown name was never silent. It already answers with the list of what is
supported, which is the useful reply:

```txt
doors      nope: unknown target — known: agents, claude, cursor, opencode, codex, windsurf, gemini, copilot
```

So the entry is gone, and with it the `unsupported` kind and the two branches
that dispatched on it. A kind with no instances is speculation; it comes back
the day a harness needs it, with that harness and its own row. `reason` went
too — nothing else used it.

MV-31's count moves 9 → 8, and MV-28 keeps its rule about dispatching on
`kind` while dropping the clause about a kind that no longer exists. Two
`absent` legs now block the entry and the union member from returning quietly.

One note on the tombstone, because it bit twice in one session: the first
version forbade the *word* `unsupported` anywhere in the registry, which
immediately caught the comment explaining the removal. A tombstone marks a
retired mechanism, not a retired topic — it now matches the declaration form,
`kind: 'unsupported',` at the start of a line, and the prose that explains the
history is free to say the word. The tool also caught the regex dialect in
passing: `\s` is not POSIX ERE, and it said so with the replacement.
