---
slug: the-sdd-gates-its-own-flow
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-51
  adds:
    - MV-55
    - MV-56
    - MV-57
  retires: []
claims:
  - id: MV-55
    statement: "An SDD adapter carries the tool's OWN flow, never a fixed triple: `projectSteps` (project-level documents, each with when to revisit) plus an ordered `steps` array of arbitrary length, every step bound to a lifecycle point (`new`/`plan`/`apply`/`land`/`close`) rather than to a propose/apply/archive name. The lifecycle prints the steps of its own point, in order, `<slug>` interpolated; the brain door and `doctor` project the same flow. OpenSpec declares no project-level document — the honest gap is stated, not invented — while spec-kit's constitution is declared with its amendment rule."
  - id: MV-56
    statement: "Every SDD step declares the artifact that proves it ran, `<slug>` interpolated: `change plan` refuses while the propose-equivalent artifact is missing, `change apply` while the plan/tasks artifact is, `change close` while the archive-equivalent has not happened. Each refusal names the exact agent command to run and the artifact path it looked for. A step the tool cannot leave an artifact for is declared `ungateable` with its reason and is never gated — the message says so instead of faking it, and a lifecycle point no step gates says the gate does not exist for this tool. Where the tool ships its own validator its verdict is REUSED (`openspec validate --json`), never reimplemented, and the lifecycle shells out for validation only, never to fake an agent-run step. `sdd_auto: false` and `--no-sdd` turn every gate off."
  - id: MV-57
    statement: "The project-level document is reported, never gated: `doctor` names it present or missing with the exact agent command that creates it, and calls it STALE when the law's newest row is newer than the file — a product whose law moved while its constitution did not. It stays a report because a constitution's content cannot be machine-judged, and the brain door tells the agent to create it if absent so `init` and `doors` carry the instruction."
---

# The SDD gates its own flow

`agentSteps` was `{propose, apply, archive}` — OpenSpec's shape imposed on every
tool. Spec Kit's real flow is longer (specify → clarify → plan → checklist →
tasks → analyze → implement → converge) and it carries a project-level
constitution that is written once and amended as the product moves. A fixed
triple could not say that.

And nothing checked. The lifecycle printed an instruction and moved on — the
same discipline-that-nothing-verifies this tool exists to end.

So: the registry's SDD specs carry `projectSteps` and an ordered `steps` array,
each step bound to a lifecycle point and declaring the artifact that PROVES it
ran. `change plan`/`apply`/`close` refuse while the artifact for their point is
missing, naming the command and the path. A step whose tool leaves no artifact
(`/speckit.analyze` writes zero bytes by design; a clean `/speckit.converge` is
forbidden to touch `tasks.md`) is declared `ungateable` with the reason and is
never gated. Where the tool ships a validator — `openspec validate --json` —
its verdict is reused rather than reimplemented. `sdd_auto: false` and
`--no-sdd` turn the gates off entirely, which is exploration mode.
