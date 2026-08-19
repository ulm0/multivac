---
slug: presence-is-not-identity
status: open
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-92
  adds:
    - MV-108
  retires: []
claims:
  - id: MV-108
    statement: "A projection identifies its own output before rewriting it, and a runner identifies the tool before executing it. Presence is not identity: a file that exists, a string that appears in a hook, a `dist/cli.js` that happens to be there — none of them is proof that this is ours."
---

# Presence is not identity

MV-74 already recorded this defect class once, in the settings merge: *a
substring of somebody else's command is not identity*. The lesson was applied
to `.claude/settings.json` and nowhere else, so the same shape survives in five
more places, each one deciding "is this mine?" by presence.

- **The stub door overwrites a user's file.** `doors` writes
  `.github/copilot-instructions.md` with `writeFile`, wholesale, twenty lines
  below the branch that read-merge-writes `AGENTS.md`. The docs promise the
  managed block is the only thing multivac touches. Every `doors` run destroys
  whatever the operator wrote there.
- **Any `dist/cli.js` is run as multivac.** The hook shim and `findRunner` both
  accept `$root/dist/cli.js` + `node_modules` as "the tool this repo builds".
  A consumer repo that is itself a TypeScript CLI building to `dist/cli.js` —
  the most ordinary layout there is — has its OWN binary executed as multivac
  on every commit, with `verify` as its argument.
- **A comment arms `doctor --strict`.** "Runs multivac" is
  `/\bmvac\b|multivac/` over the hook's whole text, so a hook that merely
  mentions the word in a comment reports as wired, and `doctor --strict` says
  the gate is armed when nothing runs.
- **Alongside shims are write-once.** The same substring makes our own shim
  look foreign-but-wired, so it is never rewritten: `strict_pre_push` never
  arms in a husky repo, and no shim fix ever reaches one.
- **`init` re-runs quietly undo `doors`.** It installs hooks without
  `strictPrePush`, downgrading a strict pre-push shim to a plain one, and it
  restamps `.multivac/projected.yml` on every run — silencing MV-86's skew
  notice without the adoption that notice asks for. `doctor`'s own fix line is
  `run multivac init .`.

MV-92 is amended rather than extended: "a check runs the code in the tree it is
checking" is true of WHICH code is chosen and says nothing about whether that
code is current, or is even this tool. The first half is what this change
fixes; the second — a stale build — is stated as the row's ceiling instead of
being implied away.
