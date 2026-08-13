---
title: Brain-driven development
weight: 1
---

The practice: **one brain repo from which the whole ecosystem is developed**.
The brain is a knowledge base — claims, law, ritual — and the code repos are
surfaces the change passes through. The practice was operated by hand for
months on a real production ecosystem — five repos, a ~5,400-line brain —
before multivac made it mechanism instead of discipline.

## Entry from anywhere, one protocol

The brain is not a place — it is a protocol, because it travels:

- **Enter the brain repo** → the brain door says how to work on the whole
  ecosystem: where every repo lives, the law, the ritual, landing order.
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

Only the map regenerates. For an existing ecosystem the tool therefore
generates the map and **interviews for the law** — the interview is the
product, not an accessory. The journal is the asset, not the cost: the one
layer that cannot be regenerated, separated so it isn't always loaded.

The brain's content is in whatever language the team writes. Nothing in the
parser assumes English headings.

## The session is home

The consumer of the output is an agent about to write code, not a CI pipeline
painting red for tomorrow. Design consequences:

- **The message is the product, not the exit code.** Output says what is
  wrong *and what to do*. Exit codes remain for optional CI use.
- **Self-healing is the normal mode.** The agent is already editing and
  reviews the diff on the spot; `moved` is not a special case.
- **Hard latency budget: under one second.** A hook that takes five seconds
  gets uninstalled. Hence `git ls-files` + `ripgrep`, never walking the tree,
  with a commit-sha-keyed cache in `.multivac/cache/`.

## Enforcement: the ladder

If verification only runs when the agent remembers, the tool inherits the
failure mode it came to fix. The tool is agent-agnostic — no privileged
harness — so enforcement cannot live in any one harness's hook API. The
universal choke point is **git**: every agent, and the human, funnels through
the commit.

| layer | mechanism | coverage | strength |
| --- | --- | --- | --- |
| 0 | the door instructs: run `multivac verify` before acting | any agent that reads `AGENTS.md` | weak — obedience |
| 1 | **git hooks**: `pre-commit` / `pre-push` run `verify` (default policy: only blocking modes gate) | **universal** — everything that commits | strong |
| 2 | harness hooks (session start, post-edit), shipped as data per harness | per harness | best UX — catches before the commit |
| 3 | CI | repos where humans commit | outer net |

Layers 1 and 2 catch different failure modes:

- **Harness hooks are the read side.** Session start catches a stale pin or a
  lying brain before the agent conceives code on top of it.
- **Git hooks are the write side.** Commit time catches claims the edit
  broke, before they land.

**The harness is the ceiling; git is the floor.** Where harness hooks exist,
most drift is caught early and the git hook rarely fires. Where they don't —
"any coding agent" includes harnesses with no hook API at all — the git hook
guarantees nothing false lands.

The hooks travel with the clone: `multivac init` points `core.hooksPath` at a
versioned `.multivac/hooks/` directory, so there is no install step to
forget. The model is git-native throughout — anchors evaluate via
`git ls-files`, distribution is pin + staleness, the change is branch/MR — so
`init` runs `git init` where missing, and a gitless brain is degraded
enforcement, flagged by `multivac doctor`.
