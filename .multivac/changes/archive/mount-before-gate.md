---
slug: mount-before-gate
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-127
  retires: []
claims:
  - id: MV-127
    statement: "multivac creates the mount its gate depends on, and a repo whose brain it cannot reach is reported unverified, never blocked. `repos sync` adds the brain as a submodule at the configured `mount` in every declared repo that is cloned and writable and carries no gitlink there, leaves the gitlink and `.gitmodules` staged, and never commits in a consumer repo; a repo `readOnly` calls `managed: false` or shallow (MV-125) is skipped by name, and a mount that fails names its repo and is quoted by its cause (MV-123) without aborting the rest. The URL is hand-authored under `brain_url` and never derived from a git remote: `init` writes the key commented, carrying the detected origin as a suggestion, and with no declaration `repos sync` mounts nothing and names the key. `verify` in a checkout that carries a projected `.multivac/` door, has no config and reaches no brain warns that nothing was verified and exits 0 — the promise the hook shim already prints for a multivac it cannot run — while a checkout with no door keeps its exit 2 and its `multivac init .`. Every report of a missing mount names `multivac repos sync`, and `doors`, `doctor` and `verify` reach no network for any of it."
---

# A consumer is mounted before it is gated

`doors` arms a blocking pre-commit gate in every declared repo, and nothing in
multivac ever creates the thing that gate reads. Measured 2026-09-16, against
this build and against a real ecosystem of 42 declared repos:

- **The gate has a precondition the tool refuses to meet.** `verify` in a repo
  without `.multivac/config.yml` resolves the brain only as a subdirectory
  mount (`findMount`, `src/commands/verify.ts:714`). With no mount it exits 2:
  `no .multivac/config.yml in <dir> — run `multivac init .` to create it`. The
  shim `doors` wrote runs that command, so no commit can be made there — and
  the printed fix would scaffold a second brain.
- **No command mounts.** `git submodule add` appears nowhere in `src/` outside
  advice text (`src/commands/doctor.ts:464`, `src/doors/consumer.ts:64`,
  `src/commands/verify.ts:1014`). `repos sync` clones and fetches
  (`src/commands/repos.ts:83`) and stops there. The documentation declares the
  mount a manual step (`site/content/docs/reference/configuration.md`, `mount`).
- **A manual step done once drifts.** In that ecosystem the mount was created
  by hand on 2026-08-24, in a commit that added `.brain`, `.gitmodules` and the
  hooks together. Today 36 of 42 repos carry the gitlink, 3 carry the working
  directory with no gitlink committed, 2 are shallow and read-only, and 1 —
  declared after that batch — has nothing, and is the one whose commits are
  refused.
- **The shim promises the opposite of what happens.** Its own text reads "No
  runnable multivac never blocks a commit: it warns loudly and exits 0." A
  runnable multivac that cannot reach the brain exits 2.
- **The URL cannot be guessed.** That brain's own origin is
  `git@gh-work:Cencosud-Cencommerce/psr-brain.git`, a machine-local SSH alias,
  while its 36 working submodules record
  `git@github.com:Cencosud-Cencommerce/psr-brain.git`. Deriving the URL from
  `git remote get-url origin` would have written the alias into 42
  `.gitmodules` files, unusable for everyone else who clones.

The fix moves the mount from advice into `repos sync` — the one command
Principle IV already lets reach the network — behind a hand-authored
`brain_url`, and makes `verify` honour the shim's promise where it has no brain
to read. `doors`, `doctor` and `verify` stay offline; multivac stages the mount
and leaves the commit to the human, as it does with the graph.

Spec, plan and tasks: `specs/052-mount-before-gate/`.
