---
slug: vendor-facts-true
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-51
    - MV-61
    - MV-75
    - MV-87
  adds:
    - MV-121
  retires: []
claims:
  - id: MV-121
    statement: "The registry's vendor facts are measured: what an entry, its comments or any copy of them says a vendor tool reaches, writes or lists is what a named version did when run or what that version's own source or docs state, and the entry or row stating it names that version; every entry names each network path reached by a command multivac runs from it, with the vendor's own opt-out (Principle V, MV-62); and a fact found false is retired at every copy, with an `absent` leg on the retired phrase."
---

# Vendor facts are true

Five things the registry says about vendor tools are false, and some of them
are law. Measured on 2026-09-14 with HOME isolated, and with the network denied
by `sandbox-exec (deny network*)` wherever a network claim was tested.

- **The scaffold does not reach the network.** Sixteen places give that as the
  reason `specify init` stays out of `verify`, `doctor` and `doors`: the
  registry note and the `scaffold` field's doc, `runScaffold`'s doc and
  comment, `doctor`'s comment and the clause it prints, MV-51, MV-75, two
  reference pages (three places), and five places in two test files, one of
  them an assertion on the printed clause.
  MV-87 cites MV-01 for the same premise.
  `specify init --help` 1.0.6 says initialization "does not need network
  access". specify 1.0.6, 0.16.5 and 0.9.4, and `openspec init` 1.13.0, all
  exit 0 with the network denied. Who runs the scaffold stays the same. Only
  the reason changes: the init writes the vendor's files into the tree, and
  running specify 1.0.6 again reverts files someone edited.
- **MV-61 anchors a false example.** It says graphify's `query` is "absent
  from its own help output", and a present leg pins that phrase in
  `registry.ts`. `graphify --help` 0.9.29 lists `query "<question>"`. The rule
  itself still holds: a verb goes into the table only after someone runs it.
- **Two entries hide network traffic (Principle V).** By default every
  `openspec` command sends PostHog telemetry to `edge.openspec.dev`. That
  includes `openspec validate`, which the gates run. `openspec update` also
  checks `registry.npmjs.org`. The opsx entry says none of this. The codegraph
  entry names its telemetry, but it leaves out `CODEGRAPH_TELEMETRY=0`, its
  never-collected list is an older one, and it never mentions that the npm shim
  downloads the platform bundle from GitHub Releases when the optional
  dependency is missing (`CODEGRAPH_NO_DOWNLOAD=1` turns that off). The MCP
  server the note names checks GitHub for a newer release
  (`CODEGRAPH_NO_UPDATE_CHECK` turns that off).
- **OpenSpec's terminal CLI is larger than the note says.** The note gives
  `init/update/list/show/validate`. 1.13.0 also ships terminal `archive`,
  `new change`, `status` and `instructions`, and the registry already quotes
  `openspec archive --yes` a few lines above that note.
- **spec-kit does not leave `.claude/settings.json` alone.** 1.0.6 drops empty
  hook entries and re-serializes the rest. The result is byte-identical to the
  file multivac writes. A file formatted another way gets rewritten, and a file
  holding only `{"hooks": {}}` gets deleted.

MV-121 turns these into law. Vendor facts carry the version they were measured
on, and a retired fact gets MV-111's device, an `absent` leg on each retired
phrase.

Out of scope, on purpose:
- Moving the scaffold into `init`. That needs MV-75's "change lifecycle alone"
  amended.
- Setting the opt-outs in the environment multivac spawns tools with. This
  change only discloses them.
- The `--ignore-agent-tools` the registry argv lacks.
- Recording an opsx scaffold.
- The `refresh` that SDD entries carry and no code path runs. That is registry
  shape, not a vendor fact, and each belongs to a later change.
