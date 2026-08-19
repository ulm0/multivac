---
slug: the-engine-reads-one-way-round-two
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-71
    - MV-109
  adds:
    - MV-116
  retires: []
claims:
  - id: MV-116
    statement: "Both of MV-109's ceilings close: a heal never crosses the include's own file kind, so prose quoting a pattern is refused and named rather than becoming law; and a symlink or a gitlink is not file text, so it is enumerated by neither reader and cannot get two verdicts."
---

# The engine reads one way, round two

MV-109 stated two ceilings rather than closing them. Both close here.

**Self-heal could rewrite a code glob onto prose.** The `moved` path searches
the whole repo for a leg's pattern and rewrites the glob when it survives in
exactly one other file. It was fenced only against `.multivac/`, so
`site/`, `docs/` and `specs/` — every one of them prose that quotes patterns —
were legal heal targets. Healing onto prose retargets law at text that merely
talks about it, silently.

The fence comes from the leg itself: a heal may not cross the include's own
trailing extension. A `.ts` glob heals to a `.ts` file or does not heal. And
when the fences empty the candidate list, the report says what was refused
instead of claiming the pattern was found nowhere — a non-heal has to be
debuggable.

**A symlink got two verdicts.** A working-tree read follows the link and sees
the target's content; a ref read sees the link text. The same leg therefore
answered differently depending on which context evaluated it — including for
the `CLAUDE.md → AGENTS.md` door multivac installs itself. Git records mode
`120000` for a symlink and `160000` for a gitlink; neither is file text, and
both are filtered at the one point the two readers share.
