# Data Model: multivac keeps no code graph

No format is persisted that was not before; one in-memory field is added (`Config.dropped`), one
module holds the record of what was dropped (`src/lib/dropped.ts`), and many types go. File and
line references are to `41e52c5` unless marked *prototype* (`$S/clone`, research.md).

## 1. What goes

| Type or field | Where (base) | Replaced by |
| --- | --- | --- |
| `GrapherDecl`; `RepoEntry.grapher`; `Config.grapher`, `grapherAuto`, `graphers` | src/types.ts | nothing; `Config.dropped` (§2) records the keys |
| `AdapterSpec` grapher fields: `graphignoreFile`, `graphignoreJson`, `graphignoreScope`, `codeOnly`, `remove`, `harness`, `artifactKind`, `rebuild`, `queries`, `askAt`; `kind: 'grapher'`; `automation: 'grapher-refresh'`; `GrapherQuery` (:367) | src/adapters/registry.ts | nothing |
| the graphify and codegraph entries; `knownGraphers`, `grapherNames` (:1394), `grapherSpec` (:1409), `unverifiedGrapher` (:1459) | src/adapters/registry.ts | the leftover table (§5), data only |
| `Detected.grapher` and its probe; the grapher kind of `ownDecl`, `adapterFor`, `adaptersByRoot` | src/adapters/detect.ts | `adapterFor` takes `'sdd'` alone |
| `RefreshHook`, `refreshHookCmd`, `refreshKey`, `ensureRefreshes`, `GRAPH_LOCK` | src/doors/settings.ts | `OUR_REFRESH_HEAD` (§3), `removeRefreshes` |
| `LeftoverGraph`, `leftoverNoun`, `leftoverGraphs` | src/lib/repo-state.ts | `LeftoverVendor`, `leftoverVendors` (§5) |
| `ECOSYSTEM_PATH` | src/lib/config.ts | `ECOSYSTEM_JSON` (§4), used only to remove the file |
| `toolsToRun(roots, { sdd, graphers })` (:38) | src/adapters/equip.ts | `toolsToRun(roots, { sdd })` |
| `missingTools(brain, cfg, { sdd, grapher })` (:69) | src/adapters/equip.ts | `missingTools(brain, cfg, sdd: boolean)` |
| `equip(brain, cfg, noSdd, only?)` (:92) | src/adapters/equip.ts | `equip(brain, cfg, noSdd)`, which runs `runScaffold` |
| `cmdClose(…, noGrapher)`; the `no-grapher` arg | src/commands/change.ts | nothing; citty's guard refuses the flag |
| `grapher` arg of `init`, `grapherRefusal` | src/commands/init.ts | nothing; the shared guard refuses the flag |

`brainHoldsCode` (src/adapters/detect.ts) stays: `init`'s flows and `change plan`'s brain line
use it. `holdsFiles` and `untrackedFiles` stay: `init` decides a brain holds code from tracked
and untracked files (MV-153, the behaviour MV-148 measured).

## 2. Dropped key and `Config.dropped`

| Field | Value |
| --- | --- |
| Keys | top-level `grapher`, `grapher_auto`, `graphers` (`DROPPED_KEYS`); per repo `grapher` (`DROPPED_REPO_KEY`), reported as `repos.<key>.grapher` |
| Validation | none: any value, any shape, loads; nothing is read from it |
| Known lists | the loader's top-level list spreads `...DROPPED_KEYS`; the repo-entry list is `'channel', DROPPED_REPO_KEY, 'managed', 'path', 'role', 'sdd', 'url'`, so neither refuses them as strays (MV-114) |
| `Config.dropped: string[]` | `DROPPED_KEYS.filter((k) => k in o)`, then `repoEntry` pushes `repos.<key>.grapher` for each entry declaring it, in config order |
| Lifetime | per load, in memory; never written |
| Readers | `verify` (brain checkout only: `!scope`) and `doctor`, through `droppedKeysLine` (§6) |

## 3. A refresh hook of ours

| Field | Value |
| --- | --- |
| Mark | `OUR_REFRESH_HEAD = 'L=.multivac/cache/graph-refresh.lock;'`, the head every refresh hook multivac wrote began with (MV-52, MV-74). Nothing else writes it |
| Identity | a command `c` with `c.startsWith(OUR_REFRESH_HEAD)`. A substring is not identity: a hook a human edited past the head is not ours |
| Where | every hook config `doors` merges — only the `claude` target declares one (`.claude/settings.json`) |
| Removal | `removeRefreshes(list)` drops each hook of ours from each entry, then each entry left with no hook; an entry holding anything else stays with it |
| Merge result | `mergeClaudeSettings(raw, { matcher })` → `{ text, notices, removed }`; `removed` is the count, which `installHookConfig` turns into one notice per file |
| Count without writing | `ourRefreshHooks(text)`: hooks of ours in a settings text, 0 for text that does not parse; `doctor` reads it per root |

State per hook: *present* → `doors` → *gone* (notice once); *edited past the head* → stays,
never counted; *a vendor's or a human's* → never touched.

## 4. The ecosystem graph

| Field | Value |
| --- | --- |
| Path | `ECOSYSTEM_JSON = '.multivac/ecosystem.json'`, in the brain only |
| Written by | nobody (was: `doors`, `init`, `commitBookkeeping`, `land`'s `commitGraph`, `close`) |
| Read by | nobody (was: `verify`'s staleness line, and agents told by the door) |
| Removed by | `doors`, in the brain checkout: `await rm(join(brainDir, ECOSYSTEM_JSON))` where it exists, then one line (contracts §3) |
| Named by | `doctor` while it exists |

## 5. The leftover table, and a finding

`LEFTOVER_VENDORS: Vendor[]`, measured data (graphify 0.9.29, codegraph 1.6.0; MV-131, MV-148,
MV-149):

| Vendor field | graphify | codegraph |
| --- | --- | --- |
| `dir` | `graphify-out` | `.codegraph` |
| `kind` | `shared` (committed by an earlier `land`) | `local` (built per checkout, never committed) |
| `ignoreFile` (named only beside `dir`) | `.graphifyignore` | `codegraph.json` |
| `gitignore` (lines an earlier multivac appended) | `graphify-out/*`, `!graphify-out/graph.json`, `*.graphify-bak` | `.codegraph/` |
| `uninstall` | `graphify uninstall --project --platform {key}` | — (its `uninit` reaches the network without its opt-outs; the removal is `rm -rf .codegraph`) |
| `platforms` (key, probe, files, flags) | gemini (`.gemini/skills/graphify/SKILL.md`; first; hooks), agents, claude (`.claude/skills/graphify/**`, `.claude/CLAUDE.md`; hooks), cursor (`.cursor/rules/graphify.mdc`), codex, opencode (`+ .opencode/plugins/graphify.js`, `.opencode/opencode.json`), copilot — each `.<dir>/skills/graphify/SKILL.md` but cursor's | none |
| `hookFiles` | `.claude/settings.json`, `.codex/hooks.json`, `.gemini/settings.json` | none |

The prototype's unused `remove: 'codegraph uninit --force'` field is not carried: the line prints
`rm -rf .codegraph`.

`LeftoverVendor` (one vendor in one checkout), built by `leftoverVendors(dir)` from file probes,
one read of `.gitignore` and one `git ls-files -z -- <paths found>`; no vendor runs:

| Field | Meaning |
| --- | --- |
| `vendor` | the table row |
| `dir?` | the output directory, when present |
| `ignoreFile?` | the ignore file, when present beside `dir` |
| `platforms` | the keys whose probe is present, `first` ones first |
| `gitignore` | the table's `.gitignore` lines still present |
| `tracked` | whether git tracks any path found |

A vendor with neither `dir` nor a platform yields no finding. `backupCopies(dir)` lists each
`<hookFile>.graphify-bak` present: the human's own pre-install copy (MV-148), named, never
removed.

Roots probed: by `doctor`, every root `sddRoots(brain, cfg)` lists that is not read-only (the
brain and each declared repo on disk); by `init` and `doors`, the directory whose door they
render.

`leftoverGlobs()`: every path in the table by name — `<dir>/**`, the ignore file, each hook file,
each platform's files — appended to `nonCodeGlobs` in every repo (`for (const g of
leftoverGlobs())`), so a removal is not code (MV-137).

## 6. The lines

| Function | Input | Output (contracts) |
| --- | --- | --- |
| `droppedKeysLine(keys)` | `Config.dropped` | §1's line body; `it`/`them` by count |
| verify's quiet clause | `Config.dropped` | `<keys> ignored (delete from .multivac/config.yml)` |
| `leftoverLine(l, scope, at, baks)` | a finding, its scope, its directory, its backup copies | §2's `leftover` line: what is there, why it misleads, the removal steps, the `.gitignore` lines (keeping `*.graphify-bak` while a copy exists), `codegraph.json`'s note, the review step after an uninstall |
| `leftoverDoorLine(l)` | a finding | §4's door line, or null when no platform was found |

## 7. Law records

| Record | Fields |
| --- | --- |
| Row disposition | ID, state at base, disposition (retire / amend / keep), lead or note text, legs kept / moved / dropped, tombstone (research.md R14.1–R14.3) |
| Retirement lead | `RETIRED 2026-10-02 by MV-153 — multivac keeps no code graph.` + `, never enacted` for MV-148 and MV-149 + the file-deletion sentence where an `absent` leg goes, then `Original claim, kept for history: ` and the statement |
| Note | `**Amended 2026-10-02 by MV-153**: …` appended after every earlier amendment |
| Leg move | old line → new line, or dropped, landing in the commit that changes the code or page it reads (research.md R13.3) |
| MV-153 | the row of research.md R14.4, `proposed`, and its thirty legs in that order |
