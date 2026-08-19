---
slug: the-engine-reads-one-way
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-05
    - MV-53
  adds:
    - MV-109
  retires: []
claims:
  - id: MV-109
    statement: "The dialect gate refuses what it cannot honour, and every reader of a file reads it the same way: a bare `[:class:]` is a translation mistake rather than a pattern, a CRLF line is a line, and `count` reads the bytes `verify` reads and says which."
---

# The engine reads one way

Three places where the deterministic core answers a question with something
other than the answer.

**`[:class:]` outside a bracket expression compiles to nonsense, silently.**
`compileAnchorRegex` translates `[:name:]` wherever it appears, so the canonical
forgot-the-outer-bracket mistake — `/PIN[:digit:]/` instead of
`/PIN[[:digit:]]/` — becomes `/PIN0-9/`, which matches only the literal text
`PIN0-9`. Written as an `absent` leg, that is green forever while real
violations sit in the glob: the false green this tool exists to prevent, in a
blocking mode, with no diagnostic anywhere. GNU grep ships a dedicated error for
exactly this input. The same gate is an eight-entry denylist, so lookaheads,
lazy quantifiers, backreferences and `\t` — none of them POSIX ERE — compile
happily and mean something different to git grep than they do here.

**A CRLF line is not a line.** `matchesInFile` splits on `\n` only, so every
line in a CRLF file keeps a trailing `\r`. A `$`-anchored pattern never matches,
and an exact-line pattern never matches, in a file that looks completely normal
to its author.

**`count` and `verify` read different bytes.** `count` builds its own scanner
handles — under a comment that says "targets exactly as verify builds them" —
with no ref, so it reads working trees while `verify` reads each sibling repo at
its channel (MV-53). A `count=N` pinned from `count` can therefore disagree with
the number `verify` computes, and `count` prints no `read` line, so nothing on
screen explains the gap. The tool's own advice is to ratchet a count from what
`count` reports.

Out of scope, and named so they are not read as fixed: symlinked files still
diverge between a worktree read and a ref read (a ref read sees the link text),
and self-heal is still fenced only against `.multivac/`, so prose quoting a
pattern elsewhere remains a legal heal target.
