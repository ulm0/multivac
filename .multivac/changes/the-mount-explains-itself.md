---
slug: the-mount-explains-itself
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-49
  retires: []
claims:
  - id: MV-49
    statement: "`verify` from a consumer repo whose mount directory (`.brain` or `.knowledge`) is present but is not a brain — no `.multivac/config.yml`, because the submodule pin predates the brain's migration or points at the wrong commit — names the stale pin and says to update the submodule or fix the pin; it never advises `init`, which would scaffold a second brain beside the mount. `init` stays the hint only when no mount is in reach at all. The site's verify reference documents the stale-mount message."
---

# The mount explains itself

Running `mvac verify` from inside a consumer repo (one that mounts the brain at
`.knowledge/` or `.brain/`) whose submodule pin predates the brain's `.multivac/`
migration printed `no .multivac/config.yml in <repo> — run multivac init .`. The
true cause was a stale mount: the mounted directory has no `.multivac/` at all,
so `findMount` did not recognise it as a brain and verify fell through to the
"run init" hint. Following that advice would create a SECOND brain in the
consumer instead of using the mounted one.

`findStaleMount` now catches the case: a mount-shaped subdirectory (`.brain` or
`.knowledge`) that is not a brain is diagnosed as a stale/empty pin —
`<mount> is mounted but is not a multivac brain … update the submodule or fix
the pin` — never as a repo that needs `init`. A real mounted brain still
resolves and scopes as before, and a bare repo with no mount in reach still
gets the `init` hint.
