---
slug: managed-repos
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
    - MV-87
    - MV-90
    - MV-103
    - MV-122
  adds:
    - MV-125
  retires: []
claims:
  - id: MV-125
    statement: "A repo multivac does not own is read, never written. A declared repo whose entry says `managed: false`, or whose clone git reports shallow (`git rev-parse --is-shallow-repository`, asked offline), is out of scope for every write multivac makes there: the SDD scaffold, the graph build and refresh, and the door and hooks `doors` projects. It is also out of scope for every gate that would demand a file there: the SDD step and project-document gates, the graph gate and the tracked gate. One function decides that scope for every surface. `doctor` and `repos` report such a repo as not managed or as a shallow, read-only clone, and never count it deficient. `repos sync --shallow` says the clone is read-only. `change plan` and `change apply` refuse a change that names one before anything is written. The brain is always in scope, shallow or not, and `managed: false` on its entry is refused by name."
---

# Managed repos

multivac writes into every declared repo it finds on disk, whether or not it
owns that repo. `repos sync --shallow` is documented as "for a repo you will
read but never land in", and nothing remembers that afterwards. Measured on
2026-09-14 against this build, in a scratch ecosystem with HOME isolated and
stubs for `specify` and `graphify` on a constructed PATH:

- **"Not ours" cannot be said.** A config with `repos.api.managed: false` is
  refused with `unknown key "repos.api.managed"`: `repos` and `verify` exit 2,
  and `doctor` and `doors` exit 1. The only per-repo switches, `sdd: none` and
  `grapher: none`, mean "no tool here". `doors` still projects a door and hooks
  into such a repo (read from source).
- **A shallow clone leaves no trace.** After `repos sync --shallow` printed
  `api: cloned … (shallow)`, `repos` printed `api present ../api` and `doctor`
  printed `speckit @ api: missing … change new runs the tool's own specify
  init` and `graphify @ api: missing → run graphify update . there`. No line
  said shallow. `git rev-parse --is-shallow-repository` answered `true`.
- **The lifecycle writes there anyway.** `change new probe`, for a change that
  names no repo, ran `specify init --here --integration claude --force
  --ignore-agent-tools` and `graphify update .` in that clone, on its `main`,
  and left both state files untracked there. Real spec-kit 1.0.6 writes 30
  files on that init (requirements study).
- **So does `doors`.** It wrote 11 files into the clone (`AGENTS.md`,
  `CLAUDE.md`, `.claude/settings.json`, six skill files, two hook shims) and
  set its `core.hooksPath`.
- **Close asks for a commit in it.** The tracked gate refused
  `change close probe` with `api: graphify-out/graph.json is not committed`,
  naming a `git add` and a `git commit` in the clone the sync called read-only.

The repos another team owns have protected branches. Equipping them writes
about 41 vendor files with no merge request to carry them (requirements study,
§2.5 item 44; audit N22). MV-125 adds `repos.<key>.managed`, a boolean that
defaults to true, and treats a shallow clone the same way at runtime. Such a
repo is read (verified, fetched, reported) and never written, and no gate
demands a file there. One function answers "may multivac write here?" for
every surface.

Out of scope, on purpose:
- Which managed repos a change may build, refresh or gate. That set stays
  every declared, present repo until the change that scopes it to the repos
  a change names.
- `repos check` and a clone's other states: not a repo, nested in another,
  unborn, or pointing at another remote.
- Running inits from `init` or `repos sync`, and committing vendor files.
- Removing a door or hooks projected before a repo became read-only, since
  removing them is a write. Recording `--shallow` anywhere but git's own
  clone is also out of scope.
- The ecosystem lists in the doors and flow.md, which still name every
  declared repo.
