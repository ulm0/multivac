---
slug: brain-first-class
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-12
  retires: []
claims:
  - id: MV-12
    statement: "A repo entry whose path resolves to the brain root IS the brain: it
      gets the brain door, never a consumer door, and is exempt from mount and
      pin checks. `brain` is a first-class repo key for config, change files and
      anchors; `*` stays reserved."
---

# brain==code is a first-class shape

The single-repo shape — the brain IS the code repo — is what every small OSS
project looks like, multivac included. Today it is a hack: `doors` overwrites
the brain door with a consumer door pointing at a mount that does not exist,
`doctor` suggests submoduling the repo into itself, and `change plan` rejects
the implicit `brain` key, forcing an alias (`self: .`).

The fix:

- `loadConfig` marks a repo entry whose `path` resolves to the brain root as
  `isBrain`. `brain` is accepted as a key when — and only when — it points at
  the brain root; pointed anywhere else it still collides with the implicit
  handle and is refused. `*` stays reserved outright.
- `doors` skips brain==code entries in the consumer loop (the brain door is
  already projected there) and leaves them out of the door's repo list.
- `doctor` reports them as `brain==code (this repo)` and runs no mount or pin
  check against them.
- `verify` evaluates them through the implicit brain handle only — no double
  scan, no staleness line.
- `change` resolves `brain` to the brain root even when the config does not
  declare it, so the lifecycle works in a brain that declares no repos.
- `init` writes the `brain: .` idiom, with its comment, when the repo it
  initializes already has tracked source.

The change file was declared with the `self: .` alias, because the fix that
makes `brain` a legal lifecycle key did not exist yet on main; it names
`brain` from the branch on, which is the point of the change.
