---
slug: the-sdd-tells-the-agent
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-51
  retires: []
claims:
  - id: MV-51
    statement: "The SDD steps instruct the agent instead of shelling out: the registry's SDD adapter specs carry `agentSteps` — per-step chat instructions verified against each tool's own docs (`/opsx:propose|apply|archive` for opsx; `/speckit.specify` then `/speckit.plan`+`/speckit.tasks`+`/speckit.implement` for speckit, which has no archive equivalent — the gap is stated, never invented). `change new`/`apply`/`close` print the declared SDD's instruction for that step when `sdd_auto` is on and `--no-sdd` is not passed; the lifecycle never invokes a fake `<binary> <step>` subcommand. The brain door carries the flow so the agent knows it at session start, and doctor reports sdd_auto plus what the agent is expected to run."
---

# The SDD tells the agent

`runSdd` used to run `<binary> <step>` for propose/apply/archive. For OpenSpec
those are `/opsx:` CHAT commands, not `openspec` subcommands — so the call hit
"binary not found" and skipped, a silent lie the registry note already
admitted.

Now the lifecycle instructs the agent (owner decision): the registry's SDD
specs carry `agentSteps` — exact per-tool instruction strings, `<slug>`
interpolated at emit time — and `change new`/`apply`/`close` print the
propose/apply/archive instruction instead of spawning anything. A step with no
agent-run equivalent (spec-kit has no archive) says so honestly. The brain
door projects the flow so a session knows at start which command runs at which
lifecycle step, and `doctor`'s sdd line reports whether `sdd_auto` is on and
what the agent runs.
