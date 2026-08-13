---
slug: hook-shim-fallback
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-14
  retires: []
claims:
  - id: MV-14
    statement: "The git hook shim resolves a runnable multivac in a fixed order —
      `mvac` on PATH, then `npx --no-install multivac`, then repo-local `node
      dist/cli.js` found relative to the hook itself — and only when none exists
      warns on stderr and exits 0, never blocking the commit. `doctor` reports
      the same order: hooks are active (naming the runner) or INACTIVE with the
      fix."
---

# The hook shim finds a runnable multivac or says so

The enforcement floor was silently inactive for everyone without `mvac` on
PATH — every build-from-source and npx user. The shim's first line was
`command -v mvac >/dev/null 2>&1 || exit 0`: no runner, no verify, no word
about it. `doctor` made it worse by printing `pre-commit ok`, which reported
the *file* and read as the *enforcement*.

The fix is one resolution order shared by the shim and doctor:

1. `mvac` on PATH,
2. `npx --no-install multivac` when `node_modules/multivac` is there (offline,
   never installs),
3. repo-local `node <repo>/dist/cli.js`, where `<repo>` comes from the hook's
   own `$0` — so a freshly built clone enforces itself,
4. otherwise a loud one-line stderr warning naming the fixes, and `exit 0`: a
   broken install must never wedge a commit.

The shim stays POSIX sh and spawns nothing before the runner (`${0%/*}` plus
builtin `cd`/`pwd`, no `dirname`). `findRunner` in `hooks/install.ts` is the
Node mirror of the same order; `doctor`'s hooks line calls it and prints
`active (<how>)` or `INACTIVE` with the fix.

Anchors for MV-14 live on the invariants row; the fixtures are
`test/init/hook-shim.test.ts`.
