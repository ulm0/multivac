# Contract: the consumer door

## A repo in a multi-repo ecosystem, with a declared SDD tool and grapher

```markdown
## multivac — consumer door

This repo belongs to an ecosystem; its brain is mounted at `.knowledge/`.

**First, before reading anything in it:** `git submodule update --init --remote .knowledge`
The pin stays where the last commit left it, so a present mount is not a current
one — unrefreshed, you decide against the law as it was weeks ago.

- Law: `.knowledge/.multivac/invariants.md` binds this repo. Cite rows by ID, never paraphrase without one.
- The change may cross repos: check the brain before assuming a change is local to this repo.
- Run `multivac verify` before acting; git hooks run it again at commit.

Repos in this ecosystem — these keys are what anchors and change files name:

- `brain` — the brain itself, mounted here at `.knowledge/`
- `api` — ../acme-api (this repo) · the contract every surface consumes
- `web` — ../acme-web · the customer-facing app
- `mobile` — ../acme-mobile

Features gate through the `speckit` SDD, in that tool's OWN flow. The lifecycle
prints each step and refuses to move on without the artifact that proves it ran;
the change lifecycle runs the tool's own init where it is missing, or says why
it could not.

- A code graph is kept fresh for you by `graphify` at `graphify-out/graph.json` — refreshed after your edits, never staged or committed by multivac.
  ASK IT BEFORE READING THE TREE RAW. …
```

`mobile` carries no role, so its line stops at the path. Nothing is invented.

## A single-repo ecosystem

No list at all: a heading over one row reading "(this repo)" is noise. The rest
of the door is unchanged.

## A repo that opts out of an adapter

`sdd: none` or `grapher: none` on that repo removes the corresponding block from
its door alone. Every other repo keeps it.

## Staleness set to block

The refresh line still carries its existing clause, unchanged:

```markdown
A pin behind its channel makes `verify` exit 1 here.
```

## What must never appear

The door makes no filesystem check and no network call — it renders from what
is declared. MV-93 carries an `absent` leg over the call shapes, narrow enough
that a comment mentioning one cannot fail it.
