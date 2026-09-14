# Research: Vendor facts are true

Sources:
- The 2026-09-14 requirements synthesis: report §2.2 items 8, 22 and 24, §2.3
  items 25 and 27, and its cluster evidence. Those runs used an isolated HOME and
  `sandbox-exec (deny network*)`.
- The vendor lines below, re-read in the installed @fission-ai/openspec 1.13.0
  and @colbymchenry/codegraph 1.6.0.
- This repo at `b378d09`.

## R1: The scaffold's stated reason

- **Decision**: withdraw "reaches the network" and "downloads templates" at every
  live copy. Where a reason is still given, it is: *the init writes the vendor's
  files into the tree, and a re-run reverts files someone edited*. Who runs the
  init does not change.
- **Evidence**:
  - `specify init --help` 1.0.6 says initialization "does not need network
    access".
  - With the network denied (curl rc=6), `specify init --here --integration
    claude --force` exits 0 on 1.0.6, 0.16.5 and 0.9.4, and so does `openspec
    init` 1.13.0.
  - A re-run over edited files reverts the skills, templates, `common.sh` and
    `.specify/.gitignore`. It keeps the constitution (§2.3 item 27). This is a
    1.0.6 fact, so every copy that states the revert names 1.0.6.
- **Copies**: 16 statements (14 outside the law file, plus MV-51 and MV-75),
  plus 5 fixture lines. MV-87 cites MV-01 for the same premise.
  - `registry.ts:452`: the scaffold note gets the new reason, and "only the
    change lifecycle runs it" stays.
  - `registry.ts:276`: the `scaffold` field's doc said "which MV-01 keeps
    offline". It now cites MV-75 and the new reason. The first sweep missed
    it, because its grep never matched "offline".
  - `sdd.ts:224-225` and `:256`: the new reason.
  - `doctor.ts:218-219`: the comment says the init writes the vendor's files into
    the tree, and doctor is a report.
  - `doctor.ts:225`: the printed clause becomes
    `doctor never does (it writes the vendor's files into the tree)`.
  - `graphers-and-sdd.md:375-376`: the new reason. The transcripts at `:381` and
    `configuration.md:463` carry the new clause verbatim.
  - `doctor.test.ts:126` doc and `:142` assertion: move with the clause.
  - `sdd-gates.test.ts:85-86`: a real binary would depend on the host
    (Principle IV) and write a different tree per machine.
  - `sdd-gates.test.ts:693` and `:865`: the new reason.
  - MV-51 and MV-75: inline notes (R6).
  - Fixtures `sdd-gates.test.ts:717/:721`, `:888/:897` and `:972`: each becomes
    `error: permission denied`, with the stub and its assertion edited together.
- **Kept, because true**: `tracker.ts:14`, `roadmap.ts:169/:286`,
  `configuration.md:182` and MV-99. All of them are about `roadmap sync`.
- **Alternatives considered**:
  - A bare clause with no reason. Rejected: it invites the next false one.
  - Leaving `:972` (`error: no network`). Rejected: it is the same premise in a
    stub. It gets no leg, because the string is a legitimate failure message
    elsewhere.

## R2: MV-61's example

- **Decision**: MV-61 gets a note that withdraws the example and keeps the rule.
  The present leg `invariants.md:443` is deleted.
  - `registry.ts:584-588` becomes: "`query` is REAL: it was run against the
    shipped 0.9.29 binary and returns a BFS subgraph; the help lists it too, but a
    verb enters this table because it was run (MV-61)".
  - `registry.ts:604` drops "`query` is undocumented in the tool's own --help".
  - `graphers-and-sdd.md:117-119` says `query` is in the table because it was
    run against the shipped binary.
- **Evidence**: `graphify --help` 0.9.29 lists
  `query "<question>"  BFS traversal of graph.json for a question`.
- **Alternatives considered**: a present leg on the new comment. Not added:
  `/graphify query "<question>"/ unique` already pins the verb.

## R3: Network disclosure (Principle V)

- **Decision**: the notes disclose the network, and spell each opt-out the way
  the vendor spells it. No `env` field and no applied opt-out, since both belong
  to change 4. Neither note says multivac sets anything.
- **opsx 1.13.0**:
  - `telemetry/index.js:30` sets `POSTHOG_HOST = 'https://edge.openspec.dev'`.
    Lines `:62-80` list the opt-outs: `OPENSPEC_TELEMETRY=0`, `DO_NOT_TRACK=1`,
    `CI`.
  - `cli/index.js:136` calls `trackCommand` in preAction, so every command
    reports, including the `openspec validate` the gates run (`registry.ts:408`,
    `sdd.ts:406`).
  - `cli/index.js:243` checks `registry.npmjs.org` (`core/version-check.js:11`)
    on `update`. `DO_NOT_TRACK=1`, `OPENSPEC_TELEMETRY=0`, `CI` and
    `OPENSPEC_NO_UPDATE_CHECK` each skip it (`:30-38`).
  - The note must avoid MV-62's `unique` phrases (`TELEMETRY IS ON BY DEFAULT`,
    `codegraph telemetry off`), which are counted over the whole of `registry.ts`.
- **codegraph 1.6.0**:
  - `README.md:719-728` says it collects "which tools and commands get used,
    which languages get indexed". It says it collects "Never any code, paths, file
    or symbol names, queries, or IP addresses", and gives
    `codegraph telemetry off  # or: CODEGRAPH_TELEMETRY=0, or DO_NOT_TRACK=1`.
  - `npm-shim.js:18-21`: when the bundle is missing, the shim "falls back to
    downloading the matching bundle straight from GitHub Releases", and
    `CODEGRAPH_NO_DOWNLOAD=1` "disable[s] the network fallback".
  - Both MV-62 phrases stay, once each. The "literally true" sentence names
    `CODEGRAPH_NO_DOWNLOAD=1` too, because turning telemetry off leaves the
    fallback.
  - `lib/dist/upgrade/update-check.js:20-23,102-104` (platform package 1.6.0):
    the MCP server checks the latest GitHub release in the background, and
    `CODEGRAPH_NO_UPDATE_CHECK` or `DO_NOT_TRACK` turns it off. Only
    `mcp/index.js`, `mcp/session.js` and `mcp/tools.js` load it, so `init` and
    `sync` do not run it. multivac never starts that server, but the note names
    it, so the note names its network too.
- **Scope of the rule**: Principle V asks an entry to disclose "any network its
  automation performs". MV-121 therefore binds the commands multivac runs from
  an entry (a validator, a scaffold, a grapher's refresh). It does not bind
  harness entries, whose tools multivac never runs, or vendor commands no path
  runs, such as `specify self check`.

## R4: The remaining notes

- **The OpenSpec CLI**: 1.13.0's `cli/index.js` registers far more than five
  terminal verbs, among them `archive`, `status`, `instructions`, `new change`,
  `view`, `templates` and `schemas`. The note and the callout
  (`graphers-and-sdd.md:335-336`) stop listing verbs. They say the steps are
  `/opsx:` chat commands and that multivac runs only `openspec validate`, so the
  wording does not age with the vendor's list.
- **spec-kit and `.claude/settings.json`** (`registry.ts:446-452`): 1.0.6
  re-serializes the file as `json.dumps(…, indent=2) + "\n"` (events.py:2526).
  - A file multivac wrote (`settings.ts:284`) stays byte-identical.
  - Empty hook entries are dropped first:
    `{"hooks":{"PreToolUse":[]},"note":"café"}`
    became `{"note": "caf\u00e9"}` (26 bytes), with non-ASCII escaped.
  - A file holding only `{"hooks": {}}` is deleted (events.py:2586-2588).
- **Out of scope**: `--ignore-agent-tools`, exit 1 without `claude`, and the
  `--ai` download path in spec-kit 0.5.0. The registry's `--integration` exited 0
  offline even on 0.5.0. Leg 1 names the scaffold's own retired sentences, so a
  true, versioned sentence about 0.5.0's download path is not blocked.

## R5: Leg shapes

- **Decision**: five legs under MV-121, exactly as written here:

```text
<!-- @anchor MV-121 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /(init`? |command |[Ii]t )downloads (its )?templates|\(it reaches the network\\?\)|[Ii]t reaches the network, so only the change lifecycle|(because that command|which) reaches the network|`doors`, which MV-01 keeps/ absent -->
<!-- @anchor MV-121 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /absent from `?graphify --help|`?query`? is undocumented|absent from its own help output|lists only install/ absent -->
<!-- @anchor MV-121 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /`?init`? ?\/ ?`?update`? ?\/ ?`?list`? ?\/ ?`?show`? ?\// absent -->
<!-- @anchor MV-121 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /leaves `?\.claude\/settings\.json`? alone/ absent -->
<!-- @anchor MV-121 brain:.multivac/invariants.md /Amended 2026-09-14 by MV-121/ count=4 -->
```

  `multivac count` at `8401c9a` finds 14 matches for leg 1, in 7 files: the 14
  copies outside the law file, `registry.ts:276` among them. Legs 2, 3 and 4
  find 3, 2 and 1. All four read 0 after the edits, and leg 5 reads 4.

- **Rationale**:
  - G reads no history (`specs/**`, `.multivac/changes/**`, `CHANGELOG.md`,
    `docs/`) and not the law file, whose notes quote what they withdraw. It
    skips the vendor-authored `.claude/skills/speckit-*`, which `specify init`
    rewrites.
  - In leg 1, `\\?` catches the escaped `\)` in `doctor.test.ts:142`, and the
    pattern leaves the `roadmap sync` copies alone. Its `downloads` branch names
    the scaffold's own subjects (the init, that command, it), so a true,
    versioned statement of spec-kit 0.5.0's download path is not blocked.
  - Leg 1 also carries MV-51's and MV-75's withdrawn wording and the field
    doc's `` `doors`, which MV-01 keeps ``. These read 0 outside the law file.
    The true copy at `tracker.ts:15` has no backticks, so it does not match.
  - Leg 2 also carries the retired comment "lists only install/…".
  - Leg 3 stops at `show /`, because the site callout wraps before `validate`.
  - Leg 5 copies MV-120's count shape: lines are counted, and anchor lines are
    skipped. It counts four notes: MV-51, MV-61, MV-75 and MV-87.
  - New test text must not spell a retired phrase literally.
- **Alternatives considered**:
  - A bare `/reaches the network/`. Rejected: it fails four true copies.
  - A bare `/which MV-01 keeps offline/`. Rejected: `tracker.ts:15` says it
    truly, about `roadmap sync`.
  - The first draft had no leg on MV-75's or MV-51's wording, on the grounds
    that WITHDRAWN keeps the clause visible. That reason did not hold, because
    G never reads the law file, so both are now in leg 1.

## R6: Notes and the row

- **Notes**, each `**Amended 2026-09-14 by MV-121**:`
  - **MV-51**: "which reaches the network" is WITHDRAWN (measured offline). The
    scaffold still runs only from `change`.
  - **MV-61**: the help-output example is WITHDRAWN, because 0.9.29's `--help`
    lists `query`. The rule stands.
  - **MV-75**: "because that command reaches the network and MV-01 binds them" is
    WITHDRAWN. The three commands still never run the scaffold, because the init
    writes the vendor's files into the tree and a re-run reverts edited ones
    (specify 1.0.6).
  - **MV-87**: its "(MV-01)" citation covers the grapher's first build, whose
    refresh can reach the network (MV-62). It never covered the scaffold, which
    stays in the lifecycle for MV-75's reason. Audit N11 names MV-87 beside
    MV-51 and MV-75.
- **MV-121** (about 400 words, `specified | proposed | 2026-09-14`, no pipe,
  never the note literal):
  - A bold lead: a vendor fact is measured, names its version, and is retired at
    every copy.
  - The five facts, with their versions.
  - The rule: an entry, its comments or a copy state only what a named version
    did or its own source or docs state, and the entry or row that states it
    names that version. Principle V's disclosure, which MV-62 set for grapher
    refreshes, holds for every adapter: an entry names each network path reached
    by a command multivac runs from it, with the vendor's opt-out, and never
    claims multivac applies one. A false fact dies at every copy (MV-111), and at
    the rows that carried it (MV-120).
  - What is mechanical: the four `absent` legs and the count of four notes.
  - The ceilings:
    - Nothing re-measures a tool on upgrade.
    - The legs catch only these phrases.
    - The law file sits outside them.
    - The facts hold only for the versions named.
    - Applying opt-outs is not this row.

## R7: The bite while the change is open

- **Decision**: prove the bite in a scratch copy, as 044 R6 did.
- **Rationale**: while MV-121 is `proposed`, a broken leg reads pending and
  blocks nothing. In a scratch clone of the finished branch, set MV-121 to
  `active` and move the change file aside. Then restore one phrase for each of
  legs 1–4, and remove one note for leg 5. Each edit must give exit 1.
  Enactment stays a separate human commit (MV-81).
