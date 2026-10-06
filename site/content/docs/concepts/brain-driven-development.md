---
title: Brain-driven development
weight: 2
---

The practice: **one brain repo from which the whole ecosystem is developed**.
The brain is a knowledge base — claims, law, and the
[ritual](../the-change#the-ritual) — and the code repos are
surfaces the change passes through. The practice was operated by hand for
months on a real production ecosystem — five repos, a ~5,400-line brain —
before multivac made it mechanism instead of discipline.

## Entry from anywhere, one protocol

The brain is not a place — it is a protocol, because it travels:

- **Enter the brain repo** → the brain door says how to work on the whole
  ecosystem: where every repo lives, the law, how a change enters, the ritual
  (`.multivac/ritual.md`), and `verify`.
- **Enter any code repo** → the brain is mounted there, and that repo's door
  says: consult the brain before any decision — and the feature you're
  building may not end in this repo. An agent standing in one surface knows
  the change may cross into others, and the brain tells it which.

Both entry points converge on the same state: work planned against the brain,
executed across whatever surfaces the feature touches.

## Three layers

| layer | carries | derivable from code? |
| --- | --- | --- |
| **Map** | what exists, what calls what, what contract it exposes | yes, and well |
| **Law** | what is non-negotiable and why | **no** — "a lawyer validated this sentence" lives in no AST |
| **Journal** | why a decision was reversed | **no** — it accumulates forward |

Only the map regenerates. For an existing ecosystem the agent therefore
drafts the map from `seed`'s inventory and **interviews for the law** — the
interview is the product, not an accessory. The journal is the asset, not the cost: the one
layer that cannot be regenerated, separated so it isn't always loaded.

The statements are in whatever language the team writes. The law table's
header row (`ID | statement | authority | state | date | source`) and its state
words are multivac's own schema and stay as written.

## The session is home

The consumer of the output is an agent about to write code, reading the run
in the same turn it will edit in — the last moment where being told a claim
is false still changes what gets written. Design consequences:

- **The message is the product, not the exit code.** Output says what is
  wrong *and what to do*. The exit code is what the invoking hook reads; the
  text is what the agent reads.
- **Self-healing is the normal mode.** The agent is already editing and
  reviews the diff on the spot; `moved` is not a special case.
- **Hard latency budget: under one second.** A hook that takes five seconds
  gets uninstalled. Hence `git ls-files` (`git ls-tree` for a ref) rather than
  walking the tree, and matching in process — one `RegExp` compiled from the
  anchor's POSIX ERE, run over the enumerated files. No subprocess per file (a
  ref read fetches each leg's blobs through one `git cat-file`), no external
  matcher, and nothing kept between runs: at this size the read is cheaper than the
  bookkeeping a cache would need to stay honest across a rebase.

## Enforcement: the ladder

If verification only runs when the agent remembers, the tool inherits the
failure mode it came to fix. The tool is agent-agnostic — no privileged
harness — so enforcement cannot live in any one harness's hook API. The
universal choke point is **git**: every agent, and the human, funnels through
the commit.

| layer | mechanism | coverage | strength |
| --- | --- | --- | --- |
| 0 | the door instructs: run `multivac verify` before acting | any agent that reads `AGENTS.md` | weak — obedience |
| 1 | **git hooks**: `pre-commit`, `pre-push` and `pre-merge-commit` run `verify`. Blocking-mode legs gate in every repo ([the exit matrix](../../reference/commands/#the-exit-matrix)); an enactment beside the code it anchors, law removal and a config edit made with no change open gate in the brain checkout; [code outside a change](../../reference/commands/#code-lands-in-a-change) gates in a brain checkout or a consumer's change worktree where `sdd_auto` is on and an SDD governs a declared repo, the brain's own when it is declared; in a consumer's own checkout, whose mounted brain can lag, a branch whose open change does not declare the repo gates in any run and a branch that is no open change only under `--strict` | **universal** — everything that commits | strong |
| 2 | harness hooks (session start, post-edit), shipped as data per harness | per harness | best UX — catches before the commit |

One rung asks and two enforce; there is no third, on purpose. Both enforcing
rungs fire inside the session, while the agent that broke the claim is still
there to fix it — a check that runs after the session has ended reports the
lie to whoever reads it next, with the code already written on top of it.

The two are not redundant; they catch different failure modes:

- **Harness hooks are the read side.** Session start catches a lying brain —
  and, in the brain checkout, a stale pin — before the agent conceives code on
  top of it.
- **Git hooks are the write side.** Commit time catches claims the edit
  broke, before they land.

**The harness is the ceiling; git is the floor.** Where harness hooks exist,
most drift is caught early and the git hook rarely fires. Where they don't —
"any coding agent" includes harnesses with no hook API at all — the git hook
is the floor every commit passes. A hook can be skipped, so where the forge
requires it, the merge request pipeline runs
`verify --strict --range <base>..<head> --branch <name>` once, at the head.
Where `sdd_auto` is on and an SDD governs a declared repo, the range adds one check:
the code in each non-merge commit must have gone through the branch of an open
change that declares the repo. In a consumer's own checkout the commit-time check refuses
a branch whose open change does not declare the repo, and leaves a branch that
no open change names to CI's `--strict` range run, because the mounted brain
can lag; a consumer's change worktree reads the brain itself and refuses both. The checks that read a commit being composed — enactment, config, law
removal — answer only inside a commit.

The hooks travel with the clone: `multivac init` and `multivac doors` point
`core.hooksPath` at a versioned `.multivac/hooks/` directory in each clone,
unless the repo already claims a hooks path of its own (a `core.hooksPath` or
husky) — then the shims go in beside it and `core.hooksPath` stays as it was.
The model is git-native throughout — anchors evaluate via
`git ls-files`, distribution is pin + staleness, the change is branch/MR — so
`init` runs `git init` where missing. A brain with no git has no floor:
`multivac doctor` shows its hooks unarmed (`core.hooksPath unset`).
