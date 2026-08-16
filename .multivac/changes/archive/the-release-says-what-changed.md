---
slug: the-release-says-what-changed
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-78
  retires: []
claims:
  - id: MV-78
    statement: "The changelog is one document with two surfaces: the repo's CHANGELOG.md and the site's changelog page carry the same entries, and the version the package declares has one."
---

# The release says what changed

This repo has published two versions and has never said what was in either.
`.multivac/changes/archive/` records every decision in full, and none of it is
readable by someone who installed the tool: the archive is the brain's own
ledger, written for the people changing multivac, not for the people using it.

Two surfaces need it and they are read by different people. `CHANGELOG.md` at
the repo root is what a contributor and every git-shaped tool looks for. The
site is what a user reads before upgrading. Keeping two hand-written copies of
the same list is the drift MV-72 already had to be written for, one directory
over.

## The rule

One document, two surfaces, and a released version has an entry:

- `CHANGELOG.md` at the repo root is the source.
- The site's changelog page carries the same entries — it may add only what
  Hugo needs to render it.
- The version `package.json` declares appears in it. A release nobody wrote a
  line for is not released, it escaped.

## Why a test again

Both halves are two-file questions and the anchor grammar has no way to ask
one. An anchor cannot compare the repo's changelog to the site's, and it cannot
be told "whatever `package.json` currently says". This is the same reason
MV-02, MV-22, MV-72 and MV-77 are tests with anchors beside them rather than
anchors alone — the legs prove the surfaces still exist and still have the
shape the test parses; the test does the comparing.

## Scope

Writing the entries is authorship and stays a human-or-agent job, exactly as
the constitution's content does. Nothing here generates a changelog from commit
messages: a generated list of subjects is not a description of what changed,
and this repo already keeps its reasoning somewhere better.

## Found while doing it

`change new` reserved MV-77 twice — once on the `site-version` branch and once
on `main` — because each branch carries its own law table and the reservation
lock is per checkout. MV-26's row says the mechanism exists so "two agents both
picking the next one" cannot collide, and quotes the failure mode as "nobody
finds out until the merge". That is precisely what happened, on one machine,
with one agent. The claim is stronger than the mechanism, and the gap belongs
in its own change rather than this one.
