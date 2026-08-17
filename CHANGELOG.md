# Changelog

What changed in each release, for the people who install multivac. The
reasoning behind each decision lives in `.multivac/changes/archive/` — that is
the brain's own ledger, written for the people changing the tool.

Every entry names the invariant it made true, because a rule quoted without its
ID does not bind.

This file is the only copy. The documentation site mounts it rather than
keeping a second one (MV-78).

## 0.2.0 — 2026-08-17

Three of these change behaviour for anyone already running the tool. Read the
first two before upgrading.

**Changed — read before upgrading**

- `change plan` now **refuses** while the SDD's project-level document is
  missing, empty, or still the unfilled template its own tool shipped. A repo
  that declares `sdd:` and has never written its constitution will start being
  refused where it used to pass. Staleness stays a report: a document older than
  the law's newest row is named, never gated. (MV-76, amending MV-57)
- The lifecycle now **runs the SDD's own init** when its scaffold is absent —
  for spec-kit, `specify init --here --integration <harness> --force`, which
  reaches the network. It runs only from `change`, never from `verify`,
  `doctor` or `doors`, which stay offline (MV-01). This closes a deadlock:
  declaring an SDD in a repo where that tool has never run used to make the
  change that installs it unplannable. (MV-75)
- `doors` now **deletes** files under the skill directory it projects when the
  source no longer ships them — including one you put there yourself, because
  nothing on disk records who wrote it. The prune is bounded to multivac's own
  skill directory and never its parent, so a sibling tool's skills are untouched.
  (MV-73)

**Fixed**

- `core.hooksPath` is read the way git reads it. An absolute or `~`-spelled
  value was joined onto the repo root, so the hook shims landed in a directory
  tree named after the machine's filesystem while `init` printed the real path
  as the place they went and `doctor` called them missing from the directory
  they were sitting in. **The enforcement gate was disarmed in silence** for any
  repo with an absolute hooksPath — every `git worktree` inherits one. Every
  read now goes through `git config --path`, and directory identity is decided
  after resolution rather than by comparing text. (MV-79, amending MV-37)
- The managed `.claude/settings.json` merge no longer replaces a hook entry it
  did not write. It claimed any entry whose command merely *contained*
  `mvac verify`, then overwrote that entry's whole hooks array and its matcher —
  deleting a user's own commands and flags. Ownership is now the individual
  hook, matched exactly; where that leaves an event ungated, multivac adds its
  own entry beside yours and says so. (MV-74, amending MV-52)

**Added**

- A changelog, on both surfaces. This file is the only copy; the documentation
  site mounts it rather than keeping a second one. (MV-78)
- The version the site advertises is pinned to the version the package declares.
  (MV-77)
- `Adoption` and `Composition` in the docs: the arc from `init` to steady state
  and which phase buys what, and why spec-driven tools and code graphers are
  built on rather than competed with.

## 0.1.1 — 2026-08-16

**Fixed**

- Enumeration counts each tracked file once. A tree mid-merge keeps three index
  entries per conflicted path, so every match inside such a file was counted
  three times: a `count=2` leg reported `found 6` and advised ratcheting to 6 —
  advice that, followed, would have written a corrupted number into the law over
  an unrelated merge. Runs taken mid-merge now say so instead of judging a tree
  nobody will commit. (MV-71)

**Added**

- `--help` on any command prints that command's own flags and arguments. Five of
  nine commands previously printed only a one-line description; `init --help`
  said nothing about `[dir]`, `--provider`, `--sdd`, `--grapher` or `--quiet`.
  Where a flag's legal values come from the adapter registry they are rendered
  from it, so a new adapter cannot leave the help behind. (MV-69)
- `init --provider <name>` now writes that harness's door, skill and hooks in the
  same run, instead of recording a name and leaving a second command to be
  discovered. (MV-70)

**Removed**

- `aider` is no longer an adapter entry. It sat there marked unsupported,
  carrying a note explaining at length why none of it applied, and read as
  support to everyone who did not open it. An unknown name already gets the list
  of what is supported, which is the answer that helps. (MV-28)

**Documentation**

- The integrations reference says why `doors` is a list of doors to project and
  not a list of providers to choose from.

## 0.1.0 — 2026-08-16

**Added**

- First release. `npx multivac init` scaffolds a brain, arms the git hooks, and
  writes the canonical `AGENTS.md` door.
- Published by trusted publishing (OIDC) on a `v<semver>` tag only, and the job
  refuses unless the tag equals the version in `package.json`. No long-lived
  publish token exists to leak or rotate, and a release is a decision somebody
  makes rather than a side effect of a merge. The published tarball carries
  `dist` and `skills` by allowlist — this repo's own brain, site and tests never
  ship. (MV-68)
