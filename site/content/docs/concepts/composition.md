---
title: Composition
weight: 8
---

multivac holds what must stay true. It does not decide what to build, and it
does not map your code. A spec-driven development tool answers the first, and
multivac is built to sit on top of it rather than beside it; your agent answers
the second by reading the tree.

| question | answered by | scope |
| --- | --- | --- |
| What should we build, and in what shape? | a **spec-driven development tool** | one feature |
| Where is this, and what reaches it? | **your agent**, reading the tree | one repo |
| What must stay true, and did it? | **multivac** | the ecosystem |

Three different questions. None of them substitutes for another, and a tool
that tried to answer all three would answer two of them worse than the tools
that already exist.

## Adapter first, fallback always

Declare a tool and the work goes through it: multivac adds the gate, the
pointer, and the few files it says it writes. Declare none and it works as it
always has.

- **With an SDD**, each change runs that tool's own flow, from the brain: the
  tool is set up once there, and with automation on its steps print once at
  each lifecycle point and the next command refuses without their artifacts.
  The change file cites the tool's directory instead of restating it.

The reason is your agent's context: the tool already carries its own flow, and
repeating it would be paid for on every change. multivac keeps no code graph,
so no door points your agent at one and no hook rebuilds one after each edit:
it searches the checkout it works in.

## Not competing is a rule here, not a posture

Every place multivac touches another tool is a place it could have
reimplemented that tool and deliberately did not. Those refusals are law,
checked on each commit where the hooks are armed, and in CI — which is a
stronger claim than a paragraph in a README:

- **The agent runs the steps** — an SDD's steps *instruct the agent*; multivac
  never shells out a fake `<binary> <step>` to simulate them.
- **The tool's own flow** — an adapter carries an ordered list of the tool's
  real steps, not a fixed propose/apply/archive triple multivac invented.
- **The tool's own verdict** — where a tool ships its own validator, its verdict
  is reused. multivac does not re-litigate another tool's rules.
- **No guessed contract** — the registry never invents a tool's contract: the
  paths an entry reads and the commands it runs are the vendor's documented
  ones, never derived from the tool's name.
- **The network, named** — an entry names any network its commands perform,
  because they run on someone else's machine.

What multivac adds is the part the tool does not: it **gates** on it.
Each SDD step declares the artifact that proves it ran, and the next lifecycle
command refuses without it. Steps that cannot be proven are declared ungateable
*with their reason* instead of being faked.

## Why an SDD tool is recommended

Without one, the lifecycle still binds — you just carry it unprompted and
unchecked. That is exploration mode, and it is a legitimate setting
(`sdd_auto: false`); it is not a better one.

With one declared, three things change:

1. The brain door prints that tool's real flow at session start, so the agent
   knows the shape of the work before it starts guessing.
2. `change plan` and `change apply` refuse until the artifacts that prove each
   step ran exist — a spec, a plan, a task list.
3. Where the tool keeps a ledger of its own work, `close` reads it. Both SDD
   tools ship a way to finish a step over their own objection; gating on the
   artifact alone accepts that silently.

**The cost, stated.** Declaring an SDD in a repo where that tool has never run
used to make the change that installs it unplannable: `plan` wanted an artifact
from a chat command that did not exist until the tool's own `init` had run. The
lifecycle now runs that init in the brain first, and prints it. The cost is the
vendor's files in your tree: spec-kit's commands and templates for your doors,
and for OpenSpec its `openspec/` directory and nothing else, since its steps are
its own terminal verbs, which every harness runs alike. Recommending a tool
without saying that would be selling you a hole.

## Not required

`verify`, `doctor` and `doors` work with no SDD declared, make no network
calls, and invoke no model. With none declared, the lifecycle still binds on its
own, code is not refused outside a change, and your agent searches the tree.
Adding one changes how cheaply the work is done well; it is not load-bearing
for the law itself.

## Next

How to configure one, field by field, is
[SDD tools](../../reference/sdd).
