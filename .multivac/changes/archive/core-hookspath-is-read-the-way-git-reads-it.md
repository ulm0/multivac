---
slug: core-hookspath-is-read-the-way-git-reads-it
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-37
    - MV-47
  adds:
    - MV-79
  retires: []
claims:
  - id: MV-79
    statement: "`core.hooksPath` is read the way git reads it, in git's order: every read goes through `git config --path`, so a leading `~` or `~user` expands to the home directory FIRST; what that leaves names the directory outright if it is absolute and otherwise resolves against the worktree root; and either spelling of this repo's own `.multivac/hooks` is recognised as multivac's. One read and one resolution serve `init` and `doctor`, so the directory the shims are written into is the directory the report reads them from and the directory git will run — never a path built by joining a repo root onto a value git would have expanded or taken whole."
  - id: MV-37
    statement: "`init` never silently disarms an existing hook set-up. Before touching `core.hooksPath` it detects `.git/hooks/<name>`, a foreign `core.hooksPath`, `.husky/`, `lefthook.yml` and `.pre-commit-config.yaml`; the shim chains a pre-existing `.git/hooks` hook first and preserves its exit code; a foreign hooksPath is never repointed — the shim installs alongside, into the directory that hooksPath resolves to per MV-79, where the name is free, and a taken name is a refusal carrying the exact line to add. `init` prints the strategy used; `doctor` reports the coexistence state from that same resolved directory."
---

# core.hooksPath is read the way git reads it

The friction left written down and unfixed at the end of
`changes/archive/doors-prunes-what-it-projects.md`, now its own change with
its own row.

`installHooks` treated `core.hooksPath` as repo-relative when git may return
it absolute. `join(repo, dir)` with an absolute `dir` concatenates rather
than replaces, so with `core.hooksPath` = `/Users/me/proj/.multivac/hooks`
the shims landed in `<repo>/Users/me/proj/.multivac/hooks/` — a literal
directory tree named after the machine's filesystem — while `init` printed
the absolute path as if that were where they went. `doctor` read the same
wrong path and reported both shims **missing** in a directory where they
were sitting. Live in this repo, in any worktree, which inherits the main
checkout's absolute `core.hooksPath` through the shared config:

```txt
hooks  core.hooksPath is /Users/…/multivac/.multivac/hooks (this repo's own gate
       — multivac installs alongside, never repoints) · pre-commit missing in
       /Users/…/multivac/.multivac/hooks · pre-push missing in …
```

Any repo whose owner simply set an absolute hooksPath gets the same, and there
it is worse than a wrong report: `init` says the gate is installed, nothing is
where git looks, and the commit goes unverified. For a tool whose whole value
is that a gate runs, a silently disarmed gate is the worst defect available.

## What changes

One computation, `resolveHooksPath` in `src/hooks/install.ts`, applying git's
own rule (githooks(5): git chdir's to the worktree root before running a hook,
so a relative hooksPath is relative to there):

- absolute in → that directory; relative in → resolved against the repo root;
- `own` is true when the result is this repo's `.multivac/hooks`, whichever
  way it was spelled, so an absolute spelling of our own dir is no longer
  mistaken for a foreign gate.

`installAlongside` writes into the resolved directory; `doctor`'s
`alongsideParts` and `hooksLine` read from it and decide `armed` on it. The
two sides cannot disagree because there is only one of them.

## Second round: the audit found the row half-true (2026-08-16)

An adversarial audit read the first round and found the fix stopped one
spelling short, plus two paragraphs of prose that stated something git does
not do. All four findings are reproduced below with the command that shows
them; none was taken on trust.

**Blocker — `--path` was missing, so a `~` spelling was the same defect with
a false green over it.** `resolveHooksPath` applied git's rule correctly, but
both call sites fed it the wrong input: `gitConfig` (`src/hooks/install.ts`)
and `hooksLine` (`src/commands/doctor.ts`) ran `git config <key>` without
`--path`, and plain `git config` returns the literal configured text. git
expands a leading `~`/`~user` to `$HOME` **before** anything else — verified
side by side in a scratch repo with `core.hooksPath = ~/mvac-tilde-hooks`:

```txt
git config core.hooksPath          → ~/mvac-tilde-hooks
git config --path core.hooksPath   → /Users/ulm0/mvac-tilde-hooks
```

So the literal `~/mvac…` arrived at `resolveHooksPath`, resolved
against the repo root, and `init` wrote the shims into a directory literally
named `~` **inside the checkout** while reporting success:

```txt
init:   hooks installed alongside into ~/mvac-tilde-hooks … core.hooksPath not touched
doctor: pre-commit runs multivac (~/mvac-tilde-hooks/pre-commit) · … · active (mvac on PATH)
on disk: <repo>/~/mvac-tilde-hooks/pre-commit     (git never looks here)
         /Users/ulm0/mvac-tilde-hooks             (does not exist)
```

git's own view was checked directly: a hook dropped by hand into
`$HOME/mvac-tilde-hooks/pre-commit` ran on `git commit` and blocked it, while
multivac's shims sat unread in the repo. Worse than before the first round,
because MV-79 now claimed the case was closed — a green that lies. Fixed by
reading with `git config --path` at both call sites, which performs exactly
git's own expansion (leading `~` only: `a~b` stays `a~b`, checked) and leaves
relative and absolute values byte-identical, so no existing behaviour moves.
One consequence is deliberate: for a `~` spelling the reported `dir` is now
git's reading of it — the expanded path, which is where the shims are — rather
than the configured text.

A value git itself cannot expand (`~nosuchuser/x`) makes `--path` exit 128 and
therefore reads here as unset. That is not handled specially and is not
claimed to be: git fatals on the same value for every hook-running command
(`git commit` → `fatal: failed to expand user dir`), so there is no live gate
to preserve.

**MV-79's statement was wrong about git.** It said an absolute value names that
directory and anything else resolves against the worktree root — leaving out
the step git takes first. The row now states the expansion, then the absolute
case, then the relative one, in git's order, and names `--path` as the
mechanism.

**`DESIGN.md` and `site/content/docs/reference/hooks.md` attributed the
worktree shape to the wrong branch.** Both said a `git worktree` inheriting its
main checkout's config is the "recognised as already ours" case. Checked
against a real linked worktree, in both spellings:

| main checkout's value | linked worktree reads | resolves to | strategy |
| --- | --- | --- | --- |
| `.multivac/hooks` | `.multivac/hooks` | the **worktree's** own dir | `fresh` — its own gate |
| `/…/main/.multivac/hooks` | the same absolute path | the **main checkout's** dir | `alongside` — a foreign gate |

A worktree inherits the value verbatim; only the relative spelling makes it
"ours". The absolute one is the other branch entirely — it installs alongside
into the main checkout's directory. Both paragraphs now say that, and so do
the comments in `resolveHooksPath` and `alongsideParts` that carried the same
loose phrasing.

**One mutation proof in the first round's report named the wrong assertion.**
Re-run: reverting `ours` in `doctor`'s `hooksLine` to `hp === HOOKS_DIR` fails
`our own hooks dir spelled absolutely is ours` at
`test/init/coexist.test.ts:637` — `assert.match(hooks, /core\.hooksPath ok/)`,
the first of the two, not the `--strict` assertion at `:648`. The result held;
only the narration was wrong.

### Mutation proofs, this round

Each reverted in `src/`, rebuilt (`pnpm run build` — the suite loads
`dist-test/`, so a mutation in `dist/` proves nothing), the named assertion
observed failing, restored, observed passing:

- drop `--path` from `gitConfigPath` (`src/hooks/install.ts`) ⇒ `a \`~\`
  core.hooksPath expands to $HOME` fails on
  `assert.ok(existsSync(join(expanded, name)), 'pre-commit is where git will look')`;
- drop `--path` from `hooksLine` (`src/commands/doctor.ts`) ⇒ the same test
  fails on
  `assert.ok(hooks.includes(\`core.hooksPath is ${expanded} \`), 'doctor names the path git will use')`;
- `const ours = hp === HOOKS_DIR` back in `hooksLine` ⇒ `our own hooks dir
  spelled absolutely is ours` fails on
  `assert.match(hooks, /core\.hooksPath ok/)` at `test/init/coexist.test.ts:637`.

The new test covers the tilde spelling end to end: install writes into
`$HOME/githooks` and nothing into a `~` directory, `core.hooksPath` is never
repointed, `git commit` under that `$HOME` runs the shim we wrote and the gate
refuses, and `doctor --strict` exits 0 naming the expanded path. `$HOME` is
pinned to a scratch directory for the duration (`withHome`), so the developer's
real home is never written to.

## What does NOT change

`doctor` gains no new sentence. The defect was that it read the wrong
directory, not that it lacked a line to print; with the resolution fixed the
existing wording — `pre-commit runs multivac (<dir>)` — is already the true
report, and `--strict` stops raising a false alarm on a checkout whose gate is
in fact armed. In this very worktree the line that surfaced the defect now
reads `pre-commit runs multivac (…) · pre-push runs multivac (…) · active
(mvac on PATH)`, and `doctor --strict` exits 0.

Three rows were read for the same question and two of them are left alone.
MV-14 (the runner order) and MV-44 (the pre-commit chain arming in every
order) say nothing about how the path is spelled, and neither statement
becomes false or overstated here; MV-44's arrangements simply now also reach a
repo that spelled our own hooksPath the long way, which its wording already
covers, and the tests exercise it under that spelling. Not amending a row that
does not need it is part of the discipline.

MV-47 keeps its statement: "`doctor --strict` exits 1 when the enforcement gate
is disarmed" is one-directional, and every disarm it names still exits 1 —
what changes is that a checkout whose gate is armed stops being counted as one.
Its third leg had to move, though: it pinned `hp === HOOKS_DIR && installed &&
runner`, the literal expression this change replaces, and a leg pointing at
deleted code proves nothing. It is repointed at `armed: ours && installed &&
runner` — the code that now carries the same claim — which is why MV-47 is
declared under `touches` even though its rule is unchanged.

## Friction, written down rather than worked around

`change apply` branches from the default branch (MV-13: the newer of local
`main` and its remote-tracking ref). When `new` and `plan` ran on a branch that
is not `main` — an agent's own checkout, here — the worktree it hands back is
branched from `main` and therefore arrives WITHOUT the change's declaration
file, without the reserved row, and without the `specs/<n>-<slug>/` artifacts
the SDD gates just checked. `apply` carries the declaration onto the branch only
when it is in the base. The recovery is a merge of the branch the bookkeeping
landed on, which is not printed anywhere. Not fixed here: it is
`src/commands/change.ts` and MV-13's territory, a different mechanism from this
row, and folding it in would put a fix nobody reviewed for it under a claim that
does not cover it. It wants its own change.

## Drafted anchors

Written as legs under their rows in `.multivac/invariants.md`, not repeated
here: `collectBrainAnchors` reads `.multivac/changes/*.md` as well as the law
table, so a drafted copy in this file would be evaluated twice as long as the
change is open. Named in prose instead, so the draft is still on the record:

MV-79 pins the resolver by name in the hooks module, keeps the concatenating
join out of it with a tombstone, pins `--path` at both call sites (the second
round's blocker — the resolver was right and its input was not), pins the
report reading through the same resolver, pins the four tests by title, and
pins the sentences in `DESIGN.md` and the site's hooks reference that state the
rule. MV-79's legs are the ones that would catch a regression;
MV-37 keeps its six existing legs, all of which still resolve — the row's
statement changed, the code they point at is where the new truth lives.
