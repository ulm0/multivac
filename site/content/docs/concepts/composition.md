---
title: Composition
weight: 8
---

multivac holds what must stay true. It does not decide what to build, and it
does not know where your code is. Two other kinds of tool answer those, and
multivac is built to sit on top of them rather than beside them.

| question | answered by | scope |
| --- | --- | --- |
| What should we build, and in what shape? | a **spec-driven development tool** | one feature |
| Where is this, and what reaches it? | a **code grapher** | one repo |
| What must stay true, and did it? | **multivac** | the ecosystem |

Three different questions. None of them substitutes for another, and a tool
that tried to answer all three would answer two of them worse than the tools
that already exist.

## Not competing is a rule here, not a posture

Every place multivac touches another tool is a place it could have
reimplemented that tool and deliberately did not. Those refusals are law, with
IDs, checked on every commit — which is a stronger claim than a paragraph in a
README:

- **MV-51** — an SDD's steps *instruct the agent*; multivac never shells out a
  fake `<binary> <step>` to simulate them.
- **MV-55** — an adapter carries **the tool's own flow**, an ordered list of its
  real steps, not a fixed propose/apply/archive triple multivac invented.
- **MV-56** — where a tool ships its own validator, **its verdict is reused**.
  multivac does not re-litigate another tool's rules.
- **MV-59** — the registry never invents a grapher's contract. A tool whose
  artifact path and refresh command are not documented by its vendor is reported
  UNVERIFIED, with the fields to declare, rather than guessed from its name.
- **MV-61** — query verbs are printed **verbatim per tool**. `graphify query`
  takes a question in words; `codegraph query` takes a symbol. A door that said
  "query the graph" would be wrong for one of them with no way to tell which.
- **MV-62** — an entry names any network its refresh performs, because that
  refresh runs on someone else's machine on every edit.

What multivac adds is the part neither of the others does: it **gates** on them.
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
makes the change that installs it unplannable: `plan` wants an artifact from a
chat command that does not exist until the tool's own `init` has run. Today the
way through is one `--no-sdd`, said out loud. Recommending a tool without saying
that would be selling you a hole.

## Why a grapher helps

An agent that does not know a graph exists will grep, and grep is the wrong
instrument for "what reaches this" — it finds strings, not paths. One graph
query answers in a single call what a search takes many, and the answer is a
subgraph rather than a pile of line hits.

The reason it stays current is that the refresh follows **your edits, not your
commits**: `doors` wires it into the harness's post-edit hook, backgrounded and
coalesced behind a lock, so the map is fresh for the next question you ask it.
`change close` runs the same refresh as a safety net for edits made outside a
harness. Git hooks never refresh — they run `verify` only.

Two constraints keep this honest. The refresh module never invokes git, so the
artifact is left uncommitted and graph output lands only in dedicated chore
commits, if your project commits it at all. And a grapher multivac has not
verified gets no derived paths and no invented verbs — it is reported
UNVERIFIED until its contract is declared, which any project can do in its own
config without a merge request against multivac.

## Neither is required

`verify`, `doctor` and `doors` work with no SDD and no grapher declared, make no
network calls, and invoke no model. Adding either changes how cheaply the work
is done well; neither is load-bearing for the law itself.

## Next

How to configure both, field by field, is
[Graphers and SDD](../../reference/graphers-and-sdd).
