<!-- multivac:begin -->
## multivac — brain door

This repo is the brain: the source of law and change for its ecosystem. It is also the code it governs — anchors target `brain:<glob>`.

- Law lives in `.multivac/invariants.md`. Cite rows by ID; a rule quoted without its ID does not bind.
- Every ecosystem decision enters as a change: see `.multivac/changes/` and run `multivac change`.
- The ritual — the closing ceremony no tool can check — is `.multivac/ritual.md`; `change close` prints it, you walk it.
- Check the law against the code before acting: `multivac verify`.
- A code graph is kept fresh for you by `graphify` at `graphify-out/graph.json` — refreshed after your edits, never staged or committed by multivac.
  ASK IT BEFORE READING THE TREE RAW. It answers in one call what grep takes many, and it is this tool's verbs, not a generic one:
  - `graphify query "<question>"` — a question in plain words — returns the subgraph that answers it, walked outward from the best-matching nodes
  - `graphify explain "<node>"` — one node and its neighbours, described in prose
  - `graphify path "<A>" "<B>"` — the shortest path between two nodes — how A actually reaches B
- Features gate through the `speckit` SDD, in that tool's OWN flow. The lifecycle prints each step and REFUSES to move on without the artifact that proves it ran; YOU run the steps:
  - project law `.specify/memory/constitution.md` — run /speckit.constitution in your agent to write the project principles — spec-kit ships .specify/memory/constitution.md as an unfilled template, so an untouched repo has no constitution, only a placeholder. CREATE IT IF ABSENT — `change plan` refuses while it is missing, empty or still the template.
    revisit: once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver (MAJOR removes/redefines, MINOR adds, PATCH clarifies) and prepend the Sync Impact Report. Spec-kit defines no cadence — `/speckit.plan`'s Constitution Check and `/speckit.analyze` only surface drift, they never edit the file
  - `change new` → run /speckit.specify in your agent to write the spec for <slug> — give it <slug> as the short name so the feature directory matches [proof: specs/*<slug>*/spec.md — `change plan` refuses without it]
  - `change new` → run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers [ungateable: optional, and its `## Clarifications` session is written by the agent — an agent answering itself produces a byte-identical file, so the section proves text was added, never that a human answered]
  - `change plan` → run /speckit.plan in your agent to design <slug> (Constitution Check, research, data model, contracts) [proof: specs/*<slug>*/plan.md — `change apply` refuses without it]
  - `change plan` → run /speckit.tasks in your agent to break <slug> into phased tasks [proof: specs/*<slug>*/tasks.md — `change apply` refuses without it]
  - `change apply` → run /speckit.analyze in your agent for the cross-artifact consistency pass before implementing [ungateable: /speckit.analyze is STRICTLY READ-ONLY by its own spec — it writes zero bytes, so no file on disk can prove it ran]
  - `change apply` → run /speckit.implement in your agent to build <slug> [ungateable: implement's only claim of completion is every task marked [X] in tasks.md — the agent grading its own homework, not evidence the code exists or works]
  - `change apply` → run /speckit.converge in your agent until it reports Converged [ungateable: a clean converge is forbidden to touch tasks.md — the converged outcome is invisible to the filesystem, and its absence is indistinguishable from never having run it]
<!-- multivac:end -->
