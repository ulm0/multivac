# Changelog

What changed in each release, for the people who install multivac. The
reasoning behind each decision lives in `.multivac/changes/archive/` — that is
the brain's own ledger, written for the people changing the tool.

Every entry names the invariant it made true, because a rule quoted without its
ID does not bind.

This file is the only copy. The documentation site mounts it rather than
keeping a second one (MV-78).

## 0.3.0 — 2026-08-17

One behaviour changed in a way that can newly refuse a repository that was
passing. Read the first item before upgrading.

**Changed — read before upgrading**

- The anchor scanner **skips a line only when that line carries a complete
  anchor comment** — the opener the grammar defines, and the `-->` that closes
  it. Until now it skipped any line containing the substring `@anchor`
  anywhere, so `const evade = "user.name"; // @anchor` in your source was
  invisible to every leg: an `absent` tombstone over that pattern reported
  green at exit 0, and the same line without the seven-character suffix broke
  it. Those lines are now scanned. **If your repository has source, fixtures or
  docs mentioning `@anchor` outside a real anchor comment, a tombstone or a
  `count=N` ratchet over them can start refusing — that is the defect being
  fixed, not a regression.** `mvac count '<the leg>'` shows you the new match
  set before you decide.

  The ceiling, stated rather than implied: a line carrying **both** the opener
  and `-->` still hides, anywhere on the line, in any file, whether or not it
  is a well-formed anchor. The scanner tests shape and never grammar, because
  the fixtures that quote whole anchors inside string literals must keep
  hiding and a forgery is byte-identical to them in shape. Closing that needs
  something which is not a test on one line's shape. (MV-82)

**Documentation**

- The site sets its own type, and serves it from its own origin. Two variable
  faces — one for human language, one for machine output — with the width axis
  carrying the distinction, both stored in the repository with their licences.
  No typeface is fetched from a third party at page load, which is the same
  promise `verify` makes about the network. Nothing an installed tool does
  changes. (MV-83)
- Twenty-one statements across the site, `DESIGN.md` and the shipped skill were
  found to contradict the code and were corrected. The install page told
  readers the binary prints `1.0.0`, that the package is `private: true` and
  that it is unreleased — none of which has ever been true of a published
  multivac. Others miscounted the door registry, the command list, the door
  kinds and the leg states, or quoted output the tool does not print. (MV-84)
- The site's pages now carry **exactly one** version string, and a test holds
  it equal to the manifest. The three pinned version sites — tag, manifest,
  badge — were already held equal by MV-68 and MV-77; nothing covered a version
  somebody typed into prose, which is how `1.0.0` survived on the install page
  under a law table with 83 anchored rows. (MV-84)

## 0.2.0 — 2026-08-17

Five of these change behaviour for anyone already running the tool. Read this
section before upgrading.

**Changed — read before upgrading**

- `verify --strict` now **refuses a change that is finished but not closed** —
  every declared claim resolving and every declared repo recorded landed — and
  names it with the command that fixes it. Until now such a change was
  indistinguishable from one opened seconds ago: both reported `pending`, and
  pending never blocks. That grace hid fourteen claims in this repo for weeks.
  If you carry finished-but-unclosed changes, `--strict` will start refusing
  them, in CI too. `change close <slug>` is the whole fix. A change declaring no
  claims is never finished, and staleness of any kind is untouched. (MV-80)
- `verify` now **refuses a commit that flips a law row to `active` alongside the
  code that row anchors**. A rule and its evidence arriving under one hand is a
  rule nobody reviewed on its own. Commit the law file alone, then the code. The
  check reads the index against `HEAD`, so it answers only while a commit is
  being composed, and says so when it cannot answer rather than passing
  silently. (MV-81)
- `change land` now reads whether the work landed from the **channel ref**
  instead of commit containment, which a squashing forge defeats every time, and
  reports the ref, its sha and how long ago it was fetched. It offers the
  conclusion; recording it stays yours. (MV-80)

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
- `doctor` now states, in its own report, that who enacts a law row cannot be
  checked by this tool — identity is not a fact on disk — and names where it is
  enforced instead. Declared ungateable with its reason rather than left absent
  from the law. (MV-81)
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
