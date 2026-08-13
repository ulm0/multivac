---
slug: everything-multivac-owns
status: archived
repos:
  self:
    status: landed
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-12
  retires: []
claims:
  - id: MV-12
    statement: Everything multivac creates lives under .multivac/ — the law, the
      changes and the machinery; AGENTS.md at the repo root is the only
      exception. A brain still holding the law or changes/ at its root is
      migrated by init and named by doctor; a brain holding both layouts is an
      error.
---

# Everything multivac owns lives in .multivac/

The old split was "content at root, machinery in `.multivac/`". Wrong line: it
scattered multivac's own files through the user's repo. The line that matters
is **the user's content vs multivac's artifacts**. Everything the tool creates
and manages moves under `.multivac/`; `AGENTS.md` stays at the root because
harnesses read it there.

    <brain>/
      AGENTS.md                  the one exception
      <the user's own content>   untouched, wherever they keep it
      .multivac/
        config.yml
        invariants.md
        changes/  (+ archive/)
        hooks/
        cache/

Migration, because an existing brain must not break: the layout check runs
where every command already loads the brain (`loadConfig`). The old layout is
refused with the one command that fixes it — `multivac init .`, which moves
both with `git mv` so history follows — and a brain carrying both layouts is
refused with the merge-or-rename instruction. `doctor` prints that line
instead of a stack trace.

Anchors keep resolving against the repo tree, so a leg may point at the law's
own path: MV-12 anchors `brain:.multivac/invariants.md`, which is the proof
that the move did not break anchor path resolution.
