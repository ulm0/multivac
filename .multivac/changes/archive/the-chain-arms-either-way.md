---
slug: the-chain-arms-either-way
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-44
  retires: []
claims:
  - id: MV-44
    statement: "The hook chain arms in every order: when .pre-commit-config.yaml exists and .git/hooks/<name> does not (the fresh-clone shape — `pre-commit install` refuses while core.hooksPath is set), the shim runs `pre-commit run --hook-stage <stage>` directly and preserves its exit code; with no pre-commit binary it warns loudly on stderr and never blocks; init and doctor name each arrangement's true state, including the uninstalled binary."
---

# The chain arms in every order

The unresolved medium from revalidation. The chained strategy assumed the
project's gate already lived in `.git/hooks/` — true on the machine where
`pre-commit install` had run, false on every fresh clone, which is the
common case. There, init reported "chained: .pre-commit-config.yaml runs
first" while the shim exec'd a `.git/hooks/pre-commit` that did not exist,
and `pre-commit install` refused to create it while `core.hooksPath` was
set. Deadlock: the project's gate could never arm, doctor saw no conflict,
and the init message was a lie.

Fix, at the shim: when `.pre-commit-config.yaml` exists and the legacy hook
file does not, fall back to `pre-commit run --hook-stage <stage>` — the
framework's documented no-install entry point — guarded by
`command -v pre-commit`. Exit code preserved: the project's gate blocks the
commit, not us. Binary absent = the same loud-warning-never-block posture
the shim already has for a missing multivac runner.

One computation (`preCommitGate` in install.ts) feeds the shim's Node
mirror, init's message and doctor's report, so they cannot disagree:

- hook installed → the normal run-time chain (unchanged)
- config only, binary present → "via `pre-commit run`" — named by init,
  reported by doctor
- config only, binary absent → init warns "the project's gate will not run
  until it is", doctor WARNING with the install fix

Husky and lefthook were checked for the same trap and do not have it.
Husky arms by claiming `core.hooksPath` itself; multivac installs alongside
into `.husky/` and leaves the variable unset, so both gates arm in either
order — covered by a test, not an assumption. Lefthook arms by writing hook
files, which the existing run-time chain picks up; it does not refuse on
`core.hooksPath`, so no fallback is warranted on the evidence we can test
(no lefthook binary in CI — recorded as friction, below).

Friction: lefthook's install behavior under a foreign `core.hooksPath`
(does it follow `--git-path hooks` into `.multivac/hooks/` and displace the
shim?) is untestable here without the binary; if it does, that is the
mirror image of this trap and deserves its own change.
