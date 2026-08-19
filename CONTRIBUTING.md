# Contributing to multivac

multivac is built with itself. That is not a slogan: this repo is its own
brain, its rules are anchored invariants in `.multivac/invariants.md`, and CI
re-verifies them on every push. Contributions go through the same loop.

## Touching the site

The site's discoverability surface is checked on every commit, and a change
that removes it fails (MV-100). Concretely: every section landing authors its
own `description`, the site declares a fallback so no page can be
description-less, a card image is declared, the crawler file names the sitemap,
and the origin stays absolute.

The check walks the content tree rather than reading a list, so a section added
next week is covered without anybody remembering to add it. If you add one,
give it a description longer than a label — the theme otherwise derives one
from whatever prose comes first, and a description nobody wrote is a
description nobody checked.

What it cannot check: whether the description is any good, and whether a given
network renders the card. Those are yours and theirs respectively.

## Getting set up

```sh
git clone git@gitlab.com:ulm0/multivac.git && cd multivac
pnpm install          # pnpm only — a preinstall guard refuses npm and yarn
pnpm run build
pnpm test
node dist/cli.js verify --strict
```

Node >= 24. The last two commands are two of the three CI jobs; the third
builds the site.

## The loop

Ship your change **through the tool**:

```sh
node dist/cli.js change new "Fix the thing"    # scaffolds the change, reserves an id
# edit .multivac/changes/fix-the-thing.md: which repos, landing order,
# which invariants it touches, and which claims it makes true — with anchors
node dist/cli.js change plan  fix-the-thing    # resolves repos, prints the landing graph
node dist/cli.js change apply fix-the-thing    # a worktree per repo, branched for you
# ... write the code and the tests in the worktree it names ...
node dist/cli.js change land  fix-the-thing --landed brain
node dist/cli.js change close fix-the-thing    # verifies the claims, archives, prints the ritual
```

Declaring claims **before** the code exists is the intended flow, not a
mistake: they report as pending until you build them, and `close` is the gate
that says you did.

`apply` gives each repo its own git worktree, so two changes in flight never
share a checkout — that mechanism exists because two agents once corrupted
each other's branches in this very repo.

Then push the branch and open a merge request. Nothing lands on `main`
directly.

## What we ask

- **English everywhere** — code, comments, docs, the site, commit messages,
  change files. No exceptions.
- **Tests with behavior.** `node:test`, no frameworks. If it branches, loops,
  parses, or touches git, it ships with a test.
- **`pnpm test` and `verify --strict` green** before you open the MR.
- **A pinned runtime dependency count.** MV-02 states the number and the names;
  read it there rather than here. Adding one more is a conversation, not a
  commit — and the row moves before the package does.
- **Deterministic core.** `verify`, `doctor` and `doors` make no network calls
  and never invoke a model. The only LLM touchpoints are optional helpers.
- **Sub-second `verify`.** It runs in a pre-commit hook. Enumerate files with
  `git ls-files`; never walk the tree.
- **An invariant is never relaxed in code.** If a rule is in the way, change
  the rule first — in `.multivac/invariants.md`, in the same change, dated.

## Friction is a finding

If the tool fights you while you use it, that is a bug report, not a bad day.
Say what you tried, what it did, and what it should have done. Most of what
this project has fixed came from exactly that — the concurrency work exists
because two agents corrupted each other's branches, and we wrote it down
instead of working around it.

## Adding a harness, a grapher or an SDD tool

Adapters are **data, not code**: an entry in `src/adapters/registry.ts`. Add
what the vendor's own documentation says it reads — the exact path, the
format, its hook mechanism — and cite the source in your MR. **If you cannot
verify a format from a primary source, add no entry at all** — not an entry
marked unsupported. There is no such kind (MV-28): an entry is how this tool
says "supported", and it shows up in `--provider`'s legal values, in the
reference table and in the count of what multivac integrates with. `aider` sat
there as unsupported, carrying a long note explaining why none of it applied,
and read as support to everyone who did not open it. A missing integration is
an honest gap; an invented one is a lie the tool exists to prevent.

## Merge requests

Say what landed, in what order it must land if it crosses repos, and which
claims the change made true. If the change taught you something that is not
yet law, say that too — either it becomes a row, or it becomes a line in the
backlog.
