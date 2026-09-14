---
slug: one-resolver-per-root
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-50
    - MV-56
    - MV-59
    - MV-87
    - MV-90
    - MV-114
  adds:
    - MV-122
  retires: []
claims:
  - id: MV-122
    statement: "Every surface that runs, gates, reports or renders an adapter resolves it for each root through one function: a declared repo's own `sdd:` or `grapher:` first, the ecosystem's otherwise, and the brain's own entry where it has one; `none` means no adapter of that kind, for both kinds, and is never read as an adapter's name; and `init` refuses a `--grapher` that is neither verified nor declared under `graphers:` in the config already there, before it creates anything."
---

# One resolver per root

Twelve functions in nine source files read `sdd:` or `grapher:` themselves,
and they disagree. Only one of them knows `none`, and only for the SDD.
Measured on 2026-09-14 against this build, in scratch ecosystems with no
vendor binary on PATH:

- **The gate and the printed steps read only the ecosystem's `sdd:`.** With no
  top-level `sdd:` and `repos.web.sdd: speckit`, `change plan` passes with no
  spec and no constitution, `change new` prints no step, and flow.md says no
  SDD is declared. Web's own door says the lifecycle REFUSES. With `sdd: opsx`
  and `repos.web.sdd: speckit`, the gate asks web for
  `openspec/changes/<slug>/proposal.md` and never sees the spec that is there.
- **An opted-out repo still proves a step.** With `repos.web.sdd: none`, a
  `specs/001-x/spec.md` in web satisfies `change plan`:
  `sdd speckit: web: specs/001-x/spec.md ok`.
- **`none` is a token for one kind and a name for the other.** The
  configuration page says `grapher: none` means "do not graph this repo".
  `doctor` prints `grapher "none" is not verified` with the fields to declare,
  `doors` prints the same notice, and the refresh at `change close` goes
  through the same unverified path in its source. A top-level
  `sdd: none` puts "Features gate through the `none` SDD … REFUSES" in the
  door, flow.md calls `none` an unknown SDD tool, and the gate prints
  `sdd none: unknown adapter`.
- **The brain ignores its own `grapher:`.** Under `grapher: graphify`,
  `repos.brain.grapher: codegraph` still resolves the brain to graphify. With
  no top-level grapher, `repos.brain.grapher: graphify` builds nothing, gates
  nothing and leaves the graph block out of the brain door. The SDD side reads
  the brain's entry for the scaffold and `doctor`, and nowhere else.
- **`init --grapher` checks nothing.** `init --grapher graphfy` exits 0, writes
  `grapher: graphfy`, says nothing about it, and projects a door with no graph
  block, while `init --sdd speckti` exits 2. MV-114's ceiling says the flag is
  checked against the registry, and the comment above the `--sdd` check says
  the flag is checked later. Neither check exists.

MV-122 makes one function the only reader: a repo's own value first, the
ecosystem's otherwise, the brain's own entry where it has one, and `none` for
either kind means no adapter. Each adapter is judged by its own steps, in the
roots that resolve to it. A global-only config behaves exactly as before.

Out of scope, on purpose:
- Which roots a change must hold proof in, or build and refresh. That set stays
  the brain plus every declared repo on disk until a later change narrows it to
  the repos the change names. Until then, a root that resolves to a different
  adapter asks for that adapter's proof too.
- Looking binaries up before running them, and refusing when one is missing.
- `managed: false`, and init's other refusals that still follow `git init`.
- DESIGN.md's "notice, feature off, exit 0". The unused `policy()` and
  `detect()` go, but the sentence they mirror belongs to the binary change.
