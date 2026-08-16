---
title: Adoption
weight: 7
---

Four names get used for how you start — `init`, seed, discovery, interview —
and two of them are commands while two are conversations. That asymmetry is
why the order gets guessed wrong, so start there:

| | what it is | who runs it |
| --- | --- | --- |
| `mvac init` | a command | you, once |
| **discovery** | a protocol | the agent, following the skill |
| `mvac seed` | a command, *inside* discovery | the agent |
| **interview** | a protocol, *after* seed | the agent asking, a human answering |
| `mvac doors` | a command | the agent, at the end |

There is no `mvac interview`. Seed names files; it cannot say what they mean.
The interview is where a human says which of those files carry rules and why,
and it happens **after** seed rather than instead of it — seed's output is the
interview's input.

## The arc

```
mvac init
   │
   └── session zero — one question: does this already exist as code?
          │
          ├── yes → discovery: seed → read by category → the three open
          │         questions → interview → map + proposed rows →
          │         validate in blast-radius batches → mvac doors
          │
          └── no  → interview: the loop → the boundaries → the
                    non-negotiables and their why → what is published
                    → the first slice, landed as the first change
          │
   steady state: change new → plan → apply → land → close
```

The two branches are asymmetric on purpose. `doors` is an explicit step only on
the existing-code path, because there are repos already sitting there needing a
door. On the from-scratch path there is nothing to project onto yet: greenfield
`apply` creates each repo with its first commit and its door already written.
And if you passed `--provider` to `init`, that projection already happened in
the same run — `doors` is for adopting a harness *later*.

## What each phase buys

- **`init`** — the brain exists and the git hooks are armed. `verify` now runs
  without you, at session start and at commit. It does not read your code, does
  not interview anyone, and writes zero law: the table is empty on purpose, and
  the door says so.
- **seed** — a deterministic inventory of where architecture actually lives:
  policy gates, workspace graph, deploy manifests, models, decisions. Nothing in
  it is law. Its value is that it is *complete and boring* — you stop wondering
  what you missed.
- **the interview** — the reasons, which are not in the code. A `REVOKE UPDATE`
  in a migration suggests a rule; only a person knows whether it is a promise or
  an accident someone never cleaned up.
- **proposed rows, validated in batches** — law that a human answered for.
  Ordered by blast radius: money and data-loss first, then published promises,
  then internal contracts, then conventions.
- **`doors`** — every repo and every harness knows where the brain is and what
  binds, in its own format, from one canonical source.
- **steady state** — every decision enters as a change, and `close` refuses to
  archive until the claims it declared actually hold.

## Where you start

- **An ecosystem that already exists in code** — the common case. `init`, then
  the discovery path. Expect the interview to be the slow part; it is also the
  part that decides whether the law is true.
- **One repo that is both brain and code** — same path, `repos: { brain: . }`.
  Anchors target `brain:<glob>` and there is no mount or pin to check. This site
  and the tool that builds it are that case.
- **Nothing built yet** — the interview path. Decide the first slice only.
  A speculative spec is a brain that lies from day one.

## What changes per case, and what does not

- **A repo with opinions already** — an `AGENTS.md`, husky, `pre-commit`, a
  foreign `core.hooksPath`, a `.gitignore` that would swallow the brain. `init`
  checks before it writes, chains an existing hook rather than replacing it,
  refuses rather than clobber, and prints the strategy it used.
- **A declared repo not on disk** — seed reports it unevaluated rather than
  guessing. `mvac repos sync` clones it.
- **A repo that does not exist at all** — legal. Declare it in a change;
  greenfield `apply` creates it.
- **Adopting a harness three months in** — one line in `.multivac/config.yml`
  plus `mvac doors`. Never re-run `init`.
- **A consumer repo** — no config of its own; it resolves the brain through the
  mount and verifies its own working tree, scoped to its anchors.

What does **not** change is the steady state. Every path above converges on the
same five subcommands, and from there the shape of the work is identical
regardless of how you arrived.

## Next

The step-by-step version of session zero, with real output, is in the guide:
[Session zero](../../guide/session-zero). Why multivac leans on spec-driven
tools and code graphers instead of replacing them is
[Composition](../composition).
