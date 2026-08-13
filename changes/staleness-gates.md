---
slug: staleness-gates
status: open
repos:
  self:
    status: branched
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-10
    - MV-11
  retires: []
claims:
  - id: MV-10
    statement: "With `staleness: block` in config, a pin behind the declared channel
      is a blocking verify failure (exit 1) with the sync command named. The
      default stays `report`; an unresolvable channel ref stays a report, never
      a guess and never a gate."
  - id: MV-11
    statement: "doors installs the pre-push shim with --strict when
      `strict_pre_push: true` is set in config; default remains the
      default-policy shim."
---

# stale pins gate verify

The gap: the design says a pin behind the declared channel FAILS verify; the
build only prints a report line. And `strictPrePush` exists in
`installHooks` but no config key reaches it — doors always installs the
default-policy pre-push.

The fix, opt-in (changing the default is an owner decision not yet made):

- `staleness: report|block` in `.multivac/config.yml`, default `report`.
  Under `block`, a resolvable pin behind its channel counts as a blocking
  failure: exit 1, with the actionable sync command in the line. Offline
  semantics unchanged — a channel ref that does not resolve locally is
  reported, never guessed, never gated.
- `strict_pre_push: true|false`, default false. When true, `doors` installs
  the pre-push shim as `verify --strict`.
- The consumer door's refresh line names the gate when `staleness: block`.
