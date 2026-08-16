# Changelog

What changed in each release, for the people who install multivac. The
reasoning behind each decision lives in `.multivac/changes/archive/` — that is
the brain's own ledger, written for the people changing the tool.

Every entry names the invariant it made true, because a rule quoted without its
ID does not bind.

This file is the only copy. The documentation site mounts it rather than
keeping a second one (MV-78).

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
