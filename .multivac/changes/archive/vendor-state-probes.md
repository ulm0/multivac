---
slug: vendor-state-probes
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-52
    - MV-62
    - MV-75
    - MV-87
    - MV-90
    - MV-103
    - MV-113
    - MV-121
  adds:
    - MV-124
  retires: []
claims:
  - id: MV-124
    statement: "Whether an SDD or grapher adapter is initialised in a root is answered by one offline probe of the vendor's own state files, never by a path being there: speckit by a `.specify/integration.json` that parses with `integration_state_schema` 1 and a non-empty `installed_integrations`, opsx by `openspec/config.yaml` or `openspec/config.yml`, graphify by a `graphify-out/graph.json` that parses as JSON, codegraph by `.codegraph/codegraph.db`. Each entry declares which of its paths are shared, and so committed, and which are local, and a grapher declares its artifact shared or local. The tracked gate asks the committed HEAD for a shared artifact and never asks for a local one. Every command multivac runs or wires for an entry carries the opt-out environment that entry declares."
---

# Vendor state probes

Every surface decides a vendor is initialised because a path is there. A
directory made by hand counts, and so does a file the vendor never finished.
Measured on 2026-09-14 against this build, in scratch repos with HOME isolated,
stubs on a constructed PATH, and spec-kit 1.0.6 where named:

- **A hand-made directory is an install.** After `mkdir .specify` in a brain
  declaring speckit, the scaffold ran 0 times and `doctor` printed
  `speckit @ brain: artifact ok · binary ok`. In the same directory
  `specify integration status` 1.0.6 exits 1 with
  `error integration-state-missing: .specify/integration.json is missing.`
  A real 1.0.6 init writes that file with `integration_state_schema: 1` and
  `installed_integrations: ["claude"]`, and this brain's own copy, written by
  0.16.4, carries both keys. opsx is judged by `openspec/specs` or
  `openspec/changes` being there (read from source).
- **A graph that is not JSON is a graph.** With a committed 0-byte
  `graphify-out/graph.json`, the graph gate and the tracked gate both passed
  and no build ran.
- **Staged is not committed.** With `graph.json` added to the index and never
  committed, the tracked gate passed and `doctor` printed
  `artifact ok · binary ok · fresh`, while
  `git cat-file -e HEAD:graphify-out/graph.json` failed. A clone of that
  commit has no graph (audit C22).
- **codegraph's graph is a database nobody commits.** codegraph 1.6.0 writes
  `.codegraph/` with its own `.gitignore`, so `git add .codegraph`, the fix
  MV-103's refusal prints, commits that `.gitignore` alone (requirements study).
  In a fresh clone of such a repo, with a stub codegraph, no build ran, both
  gates passed, and close's refresh ran `codegraph sync`. On 1.6.0 that exits 1
  with `✗ CodeGraph not initialized`, and close only warns. Tracking the
  artifact, as MV-103 demands, would mean un-ignoring an SQLite file.
- **The opt-outs are named and never applied.** A stub recording its
  environment saw `DO_NOT_TRACK`, `CODEGRAPH_TELEMETRY` and
  `CODEGRAPH_NO_DOWNLOAD` unset when close ran `codegraph sync`. The
  `openspec validate` the apply gate runs inherits the same environment, and so
  does the post-edit hook that runs a refresh on every edit (both read from
  source). MV-62 exists because of that hook.

MV-124 makes one probe answer "is this vendor initialised here", from the
vendor's own state files, in four states: installed, missing, partial and
unevaluable. The scaffold runs only where nothing of the tool is there, since
on 1.0.6 a re-run reverts edited files. A graph is built wherever it is not
installed. Each entry declares its shared and local paths, its ignore lines,
the grapher's default ignore lines and its opt-out environment. codegraph's
artifact becomes `.codegraph/codegraph.db` and is local, so the tracked gate
leaves it alone, and the gate reads HEAD, not the index.

Out of scope, on purpose:
- Writing any ignore file or `.graphifyignore`, and running an init from
  `init` or `repos sync`. Those belong to the change that equips roots, which
  reads what this one declares.
- Committing shared paths, and `land` committing `graph.json` so that close
  can read the integrated ref instead of HEAD.
- Which integration keys the doors need, and the harness files an integration
  or `graphify install --project` writes (`.claude/skills/**`, its backup
  file).
- `codegraph init -y`, `CODEGRAPH_DIR`, scoping gates to the repos a change
  names, `managed: false`, `repos check` and the project document's state.
