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
    - MV-32
  retires: []
claims:
  - id: MV-32
    statement: Everything multivac creates lives under .multivac/ — the law, the
      changes and the machinery; AGENTS.md at the repo root is the only
      exception. init migrates a brain that still keeps them at the root,
      announcing every path before it moves it and using git mv so history
      follows, and it refuses rather than overwrite an occupied target. It
      never moves a file multivac did not write: a root invariants.md or
      changes/ counts as multivac's only in a directory that already has
      .multivac/config.yml AND whose file parses as multivac's own law table
      or change file. Only two files that both parse as multivac's law are
      ambiguous, and that error names the one that wins; doctor reports the
      legacy layout with the command that fixes it and moves nothing itself.
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
refused with the one command that fixes it — `multivac init .`, which lists
every path before moving it and uses `git mv` so history follows. `doctor`
prints that line instead of a stack trace, and moves nothing itself.

The trap the prover found: `invariants.md` and `changes/` are ordinary names.
A first version keyed the migration on the name alone, so `mvac init .` in an
ordinary repo that kept its own `changes/` `git mv`d the user's directory into
`.multivac/`. Two conditions now gate every move — the directory is already a
brain (`.multivac/config.yml`), *and* the content reads as multivac's own (the
six-column law header, or a parseable change file) — and anything that fails
either is left alone in silence. That is also why a brain whose author keeps
their own root `invariants.md` is a healthy steady state and not an error:
only two files that both read as multivac's law are ambiguous.
