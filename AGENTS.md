<!-- multivac:begin -->
## multivac — brain door

This repo is the brain: the source of law and change for its ecosystem. It is also the code it governs — anchors target `brain:<glob>`.

- Law lives in `.multivac/invariants.md`. Cite rows by ID; a rule quoted without its ID does not bind.
- Every ecosystem decision enters as a change: see `.multivac/changes/` and run `multivac change`.
- The ritual — the closing ceremony no tool can check — is `.multivac/ritual.md`; `change close` prints it, you walk it.
- Check the law against the code before acting: `multivac verify`.
- How the repos, the law's rows, their anchors and the changes relate is `.multivac/ecosystem.json`, rendered from the brain's declarations. Ask it: `graphify query "<question>" --graph .multivac/ecosystem.json`, `graphify explain "<row id or change slug>" --graph .multivac/ecosystem.json`, `graphify path "<A>" "<B>" --graph .multivac/ecosystem.json`.
- A code graph is kept fresh for you by `graphify` at `graphify-out/graph.json` — refreshed after your edits, and committed on the change branch by `change land`.
  ASK IT BEFORE READING THE TREE RAW. `graphify query`, `graphify explain`, `graphify path` — how and when to use each is in the `## graphify` section graphify's own install writes into this file.
- Features gate through the `speckit` SDD, in that tool's OWN flow. The lifecycle prints each step and REFUSES to move on without the artifact that proves it ran; YOU run the steps:
  - project law `.specify/memory/constitution.md` — run /speckit.constitution in your agent to write the project principles — spec-kit ships .specify/memory/constitution.md as an unfilled template, so an untouched repo has no constitution, only a placeholder. CREATE IT IF ABSENT — `change plan` refuses while it is missing, empty or still the template.
    revisit: once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver (MAJOR removes/redefines, MINOR adds, PATCH clarifies) and prepend the Sync Impact Report. Spec-kit defines no cadence — `/speckit.plan`'s Constitution Check and `/speckit.analyze` only surface drift, they never edit the file
  - where a project document and an active row of `.multivac/invariants.md` disagree, the row wins: amend the document, or change the row through a change
  - `change new` → run /speckit.specify in your agent to write the spec for <slug> — give it <slug> as the short name so the feature directory matches [proof: specs/<n>-<slug>/spec.md — `change plan` refuses without it]
  - `change new` → run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers [ungateable: optional, and its `## Clarifications` session is written by the agent — an agent answering itself produces a byte-identical file, so the section proves text was added, never that a human answered]
  - `change plan` → run /speckit.plan in your agent to design <slug> (Constitution Check, research, data model, contracts) [proof: specs/<n>-<slug>/plan.md — `change apply` refuses without it]
  - `change plan` → run /speckit.tasks in your agent to break <slug> into phased tasks [proof: specs/<n>-<slug>/tasks.md — `change apply` refuses without it]
  - `change apply` → run /speckit.analyze in your agent for the cross-artifact consistency pass before implementing [ungateable: /speckit.analyze is STRICTLY READ-ONLY by its own spec — it writes zero bytes, so no file on disk can prove it ran]
  - `change apply` → run /speckit.implement in your agent to build <slug> [ungateable: implement's only claim of completion is every task marked [X] in tasks.md — the agent grading its own homework, not evidence the code exists or works]
  - `change apply` → run /speckit.converge in your agent until it reports Converged [ungateable: a clean converge is forbidden to touch tasks.md — the converged outcome is invisible to the filesystem, and its absence is indistinguishable from never having run it]
  the change lifecycle runs the tool's own init where it is missing, or says why it could not
<!-- multivac:end -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
