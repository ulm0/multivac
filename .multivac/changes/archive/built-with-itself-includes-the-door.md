---
slug: built-with-itself-includes-the-door
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-72
  retires: []
claims:
  - id: MV-72
    statement: The skill this repo ships and the skill its own harness reads are one tree, held identical by a test because no anchor can compare two trees.
---

# Built with itself includes the door

CONTRIBUTING says "multivac is built with itself. That is not a slogan." It was
a slogan for two of the integrations this repo ships. `.multivac/config.yml`
declared `doors: [agents]` and no grapher, so the only adapter exercised on the
tool's own repo was the canonical one every repo gets for free — while
`src/adapters/registry.ts` carries a `claude` entry with a door, a skill and a
post-edit hook config, and `knownGraphers` carries `graphify` with its artifact,
its refresh command and its query verbs.

This change declares both and commits what `doors` projects from them:

- `doors: [agents, claude]` — `CLAUDE.md`, `.claude/skills/multivac/`, and the
  managed `.claude/settings.json` hook merge.
- `grapher: graphify` — the brain door's query verbs (MV-61) and the
  backgrounded post-edit refresh entry (MV-52), which appears only because the
  binary is present.
- `sdd: speckit` — the tool's own flow in the brain door (MV-51, MV-55), and
  the gates that come with it: `change plan` refuses without
  `specs/*<slug>*/spec.md`, `change apply` without `plan.md` and `tasks.md`.
  Spec-kit declares no archive step, so `close` is not gated at all, and its
  `unfinished` ledger reads `specs/*<slug>*/tasks.md` — absent, which MV-63
  calls neither pass nor fail. That is why this change could be planned and
  applied before the declaration landed and can still be closed after it: the
  gates bind the next change, not this one. Spec-kit also declares no
  validator, so MV-66's missing-binary refusal has nothing to fire on; its CLI
  is `specify`, not `speckit`.

## Generated is not the same as disposable

Every file here is machine-written, and all of them are tracked. `AGENTS.md`
already was. The question each one asks is not "did a tool write this" but "is
there another copy of it in the repo".

`CLAUDE.md` has none in the strongest sense available: `doors` writes it as a
symlink to `AGENTS.md`, and git tracks it that way (mode `120000`). It is one
file under two names, so there is no second copy to drift.
`.claude/settings.json` has none either — it is the gate, tracked for the same
reason `.gitlab-ci.yml` is.

`.claude/skills/multivac/` has one — `skills/multivac/`, the tree
`package.json`'s `files` allowlist already ships (MV-68). Tracking the copy buys
a clone that is wired without running `doors`, and costs a second committed copy
of one tree that nothing would notice drifting: both copies keep whatever string
an anchor greps for. MV-72 is that missing check, and it is a test rather than
an anchor because comparing two trees is not something the anchor grammar can
say.

`graphify-out/` is tracked too, minus its `cache/`. This needed no amendment:
MV-50 already says the artifact is "left uncommitted, to land only in dedicated
chore commits" — it governs what multivac's refresh path does, which is never to
touch git, and leaves the committing to the project. So the graph lands here in
its own chore commit, exactly as that row describes.

## The door was saying more than the law does

The brain door printed `refreshed after your edits, never committed`, which is
a claim about the repo, not about multivac — and false in any repo that decides
to commit the artifact, starting with this one. It now says
`never staged or committed by multivac`, which is the thing MV-50 actually
guarantees and stays true either way. The site already used that wording.

## Friction found while doing this

Two defects, both reproduced, neither fixed here — they are their own changes.

**`doors` never prunes the skill copy.** A file planted in
`.claude/skills/multivac/references/` survives every later `doors` run
(`cpSync` copies, nothing deletes), so a reference file removed from
`skills/multivac/` stays in the copy forever. MV-72 will go red for it and the
only fix is `rm` by hand — the test is right, the projection is not.

**The `.claude/settings.json` merge can eat a foreign entry.** `ourEntry`
claims any hook entry whose command merely *contains* `mvac verify`, and the
update branch then replaces that entry's whole `hooks` array and rewrites its
`matcher`. A pre-existing `{matcher: 'Bash', hooks: [{command: 'mvac verify
--strict'}, {command: 'my-own-linter'}]}` came back as `{matcher:
'Edit|Write|MultiEdit', hooks: [{command: 'mvac verify'}]}` — the `--strict`,
the second command and the matcher all gone. Because the match is `Array.find`,
multivac's real entry then survives further down the list and `verify` fires
twice per edit. MV-52 says this merge "preserves foreign keys"; it preserves
foreign *keys* and not foreign *entries*.

## The reservation

MV-72 is filed `proposed`. A human enacts it.
