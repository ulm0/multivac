# Research: Vendor state probes

Sources:
- Audit 2026-09-13 C10 and C22, and its codegraph-empty finding. The
  2026-09-14 requirements synthesis, §2.3 items 27-30, §5.1 and §6 row 4.
- The change file's measurements: spec-kit 1.0.6 and stubs, HOME isolated, PATH
  constructed.
- This repo at `1b3ad92`. All line numbers below are from that commit.

## R1: The probe

- **Evidence**:
  - Presence is asked by `artifactPresent` (detect.ts:18-27), called from
    refresh.ts:92, :183 and :260, sdd.ts:544, tracked.ts:65, and doctor.ts:224
    and :298. It is also asked by `pathExists(join(root.dir, sc.artifact))`
    (sdd.ts:244) and by `heldArtifact` (tracked.ts:24, doctor.ts:317).
  - This brain's `.specify/integration.json`, written by 0.16.4, holds
    `integration_state_schema: 1` and `installed_integrations: ["claude"]`,
    with `version`, `integration_settings`, `integration` and
    `default_integration` beside them.
  - This brain's `graphify-out/graph.json` is 4,470,315 bytes. `JSON.parse` of
    it averaged 27 ms over 5 runs.
- **Decision**: `src/lib/init-state.ts` exports
  `initState(spec: Pick<AdapterSpec, 'state'>, dir): Promise<InitState>`, where
  `InitState = { state: 'installed' | 'missing' | 'partial' | 'unevaluable'; reason?: string }`.
  For each of `state.files`, in order:
  1. `lstat` fails with ENOENT or ENOTDIR: absent, go to the next file. Any
     other error: unevaluable, `cannot read <file>: <code>`.
  2. `check: 'exists'`: installed when `stat` succeeds, and absent otherwise.
  3. `stat` is not a regular file (a directory, a broken link): partial,
     `<file> is not a file`.
  4. `check: 'file'`: installed.
  5. `check: 'json'`: a read error is unevaluable, `cannot read <file>: <code>`.
     A parse error is partial, `<file> does not parse as JSON`. For each
     `expect` key, a number must be equal (`<file>: <key> is not <n>`), and
     `'non-empty'` must be a non-empty array (`<file>: <key> is empty`).
     Otherwise installed.

  The first installed file wins. Otherwise the first unevaluable reason is
  returned, then the first partial reason. With neither, an `lstat`-present
  `state.dir` is partial, `<dir> is there and <files joined by " or "> is not`.
  With nothing at all, the root is missing.
- **Why its own file**: leg 2 (R10) holds one file to reading files, which a
  leg over detect.ts, home of `findBinary`'s `access` calls, would blur.
- **Rejected**:
  - `specify integration status`: a subprocess (MV-01), and 1.0.6 only.
  - Reading the first bytes of `graph.json`: a truncated file would pass.
  - Matching `installed_integrations` against `doors:`, which is the door map's
    change.

## R2: What each entry declares as its state

```ts
export interface StateProbe {
  dir?: string;                                     // the vendor's own directory
  files: string[];                                  // any one passing `check` is installed
  check: 'exists' | 'file' | 'json';
  expect?: Record<string, number | 'non-empty'>;    // json only
}
```

| entry | dir | files | check | expect |
| --- | --- | --- | --- | --- |
| speckit | `.specify` | `.specify/integration.json` | json | `integration_state_schema: 1`, `installed_integrations: 'non-empty'` |
| opsx | `openspec` | `openspec/config.yaml`, `openspec/config.yml` | file | |
| graphify | `graphify-out` | `graphify-out/graph.json` | json | |
| codegraph | `.codegraph` | `.codegraph/codegraph.db` | file | |
| declared grapher | none | `[decl.artifact]` | exists | |

- `state` is required on `AdapterSpec`, so a new entry cannot forget it.
- `SddScaffold.artifact` goes (registry.ts:205-206, :455). The scaffold runs
  where the probe says missing, which for speckit means `.specify` is absent,
  the same path. Two fields with one meaning would drift. sdd.ts's messages
  and flow.ts:73 read `spec.state.dir`, so their bytes do not change.
- `AdapterSpec.artifacts` stays: the doors (brain.ts:72, flow.ts:104, :108),
  the gate's refusal and `graphStale` name a grapher's artifact from it. Its
  comment (registry.ts:238) stops tying presence to the read capability. An
  SDD entry's `artifacts` loses its last reader, and removing it is out of
  scope.

## R3: shared, local, ignore, graph-ignore, artifact kind

- **Fields**: `shared`, `local`, `ignore` and `env` are required on
  `AdapterSpec`. `graphignore?` and `artifactKind?: 'shared' | 'local'` are for
  graphers. The kind is `artifactKind` because `kind` is already `'sdd' |
  'grapher'` (registry.ts:237).
- **Rule, stated in the type's comment**: a literal path beats a glob, and
  between two globs `local` wins. So `.specify/feature.json` is local under
  `.specify/**`, and `graphify-out/graph.json` is shared under
  `graphify-out/**`.

| entry | shared | local | ignore | graphignore | artifactKind |
| --- | --- | --- | --- | --- | --- |
| speckit | `.specify/**` | `.specify/feature.json`, `.specify/extensions/*/local-config.yml` | none | | |
| opsx | `openspec/config.yaml`, `openspec/config.yml`, `openspec/specs/**` | none | none | | |
| graphify | `graphify-out/graph.json` | `graphify-out/**` | `graphify-out/*`, `!graphify-out/graph.json` | `.claude/`, `.multivac/`, `.specify/`, `specs/`, `openspec/` | shared |
| codegraph | none | `.codegraph/**` | `.codegraph/` | not declared | local |
| declared grapher | `[decl.artifact]` | none | none | not declared | shared |

- speckit declares no `ignore` lines. spec-kit's own `.specify/.gitignore`
  already lists both local paths: it is in this brain (0.16.4), and 1.0.6's per
  the spec's assumptions. An install without it has no `integration.json`
  either, so it reads partial.
- **Rejected**:
  - Deriving `ignore` from `local`. Ignore order and `!` need a rule nothing
    reads yet.
  - Graph-ignore lines for codegraph, since no ignore file of its was verified.

## R4: Each surface

| site | today | after |
| --- | --- | --- |
| runScaffold (sdd.ts:239-282) | `.specify` there is silence | installed is silence. Missing runs the init as today, or states the no-init gap. Partial or unevaluable run nothing and warn: `sdd speckit: <scope> is partial — <reason> — the init is not run over it, since a re-run can revert edited files; run \`<run>\` in <scope> yourself`. opsx gets the reason, the install line and "will not guess one" |
| after the init (sdd.ts:269-281) | `.specify` there is scaffolded | installed is `scaffolded — <scope>:<dir> is there now`, as today. Otherwise `left no <dir> in <scope>` when missing, `left <dir> partial (<reason>) in <scope>` when partial, with the tool's words as today |
| project-document roots (sdd.ts:542-545) | `artifactPresent` | state is not missing. For speckit, the only entry with a project document, these are the same roots, since `.specify` holds the state file |
| refreshGraph (refresh.ts:92) | no artifact means create | unevaluable says `build and refresh skipped — <reason>` and returns. Otherwise `const first = st.state !== 'installed'` |
| ensureGraphs (refresh.ts:183) | skips a root with an artifact | skips an installed root |
| graphGate (refresh.ts:258-273) | artifact there is satisfied | installed is satisfied. Missing prints `no <artifact> — \`<create>\` there`, as today. Partial prints `<reason> — \`<create>\` there`. A local artifact adds `— a local artifact is built in each checkout`. Unevaluable prints `cannot be checked — <reason>` |
| graphTrackedGate (tracked.ts:60-74) | index, every artifact | skips local artifacts and roots that are not installed, then asks `inHead` (R5) |
| doctor sddLines (doctor.ts:224-231) | `artifact ok` / `artifact missing (looked for …)` | `installed`, `missing (no <dir>)`, `partial (<reason>)` or `unevaluable (<reason>)`. The MV-75 clause `declared but never run here; …` stays on missing, and partial names the init to run by hand |
| doctor grapherLines (doctor.ts:298-323) | `artifact ok · …`, `UNTRACKED →` | `installed (shared)` or `installed (local)` · binary · fresh or STALE. Missing or partial names the reason and the create command. A shared artifact missing from HEAD adds `· NOT COMMITTED → \`git -C <dir> add <art>\`, then commit it`. IGNORED keeps its words |

Exit codes are unchanged except the refusals this change adds.

## R5: The HEAD read

- **Measured** with git 2.55.0 in a scratch repo, as
  `git -C <repo>/sub cat-file -e HEAD:./g/graph.json` unless the row says
  otherwise:

  | state | exit |
  | --- | --- |
  | no commit yet | 128 |
  | staged, never committed (`ls-files --error-unmatch` exits 0) | 128 |
  | committed | 0 |
  | committed, then modified in the working tree | 0 |
  | committed, asked as `HEAD:g/graph.json` from `sub/` | 128 |
  | a committed directory, `HEAD:./g` | 0 |

- **Decision**:
  - `inHead(repo, path)` in git.ts replaces `isTracked` (:317-328), whose only
    callers are tracked.ts:67 and doctor.ts:318. It resolves
    `run(repo, ['cat-file', '-e', \`HEAD:./${path}\`])` to true, and a failure
    to false.
  - `./` keeps a root nested in a larger repo correct, as `ls-files` was.
  - `run` drops the ambient git environment (git.ts:110-119, MV-106).
  - The refusal line reads
    `<scope>: <art> is not committed — \`git -C <dir> add <art> && git -C <dir> commit -m "chore: commit the graph" -- <art>\``,
    a pathspec commit, so work already staged in that repo stays out of it (MV-50).
    The ignored line keeps `is ignored by .gitignore — remove the rule` and adds
    "and commit it".
- **Rejected**:
  - `ls-tree HEAD`, which needs output parsing.
  - The integrated ref, which waits for `land` to commit the graph.

## R6: codegraph's local artifact

- **Decision**:
  - `artifacts: ['.codegraph/codegraph.db']` and `artifactKind: 'local'`.
  - A clone holding `.codegraph/.gitignore` alone reads partial, so the build
    runs `codegraph init` (refresh.ts:93), never `sync`.
  - The tracked gate skips the root. The graph gate still needs it installed,
    so a local artifact is built in the checkout that closes.
  - The doors render `.codegraph/codegraph.db`, which moves per-root.test.ts:317
    and :321.
- **Unchanged**:
  - brain.ts:76, "you can track and commit it", for a shared artifact. What a
    door says about committing one belongs to the equip change, and the
    sentence is permissive. A local artifact's door says it is built in each
    checkout and never to commit it, and close's refresh line says
    `local artifact, never committed`, since inviting a commit contradicts
    MV-124 there.
  - `detectAdapters` (detect.ts:231-244) still proposes codegraph from
    `.codegraph`. A proposal never says the tool is initialised.
- **Ceiling**: `CODEGRAPH_DIR` moves the database, and such a root reads partial.

## R7: The opt-out environment

- **Evidence**: `toolVerdict` runs `execFileP(exe, args, { cwd })` (sdd.ts:164)
  for the scaffold and the validator, and the refresh passes
  `{ ...process.env, PATH }` (refresh.ts:120-123). `refreshHookCmd`
  (settings.ts:84-90) sets no variable. The notes at registry.ts:443 and :643
  say "nothing here sets either" and "nothing here sets any".
- **Decision**:
  - opsx `env: { DO_NOT_TRACK: '1', OPENSPEC_TELEMETRY: '0' }`, codegraph
    `env: { DO_NOT_TRACK: '1', CODEGRAPH_TELEMETRY: '0', CODEGRAPH_NO_DOWNLOAD: '1' }`,
    and speckit, graphify and a declared grapher `env: {}`.
  - sdd.ts:164 passes `env: { ...process.env, ...spec.env }`.
  - refresh.ts:122 passes `{ ...process.env, ...spec.env, PATH: … }`, and
    MV-123's `localBin(dir)]` leg still matches.
  - `refreshHookCmd(refresh, env = {})` builds
    `exported = Object.entries(env).map(([k, v]) => \`${k}=${v}\`).join(' ')`.
    It puts `` `export ${exported}; ` `` after the PATH segment when non-empty.
  - `mergeClaudeSettings`' opts gain `env` (:239, :276), and `installHookConfig`
    passes `spec.env` (doors.ts:155-167, :195, :244).
  - `REFRESH_HEAD` still leads, so `ownsRefresh` (settings.ts:112) owns the
    entry.
  - With no `env` the hook's bytes do not change, so this brain's
    `.claude/settings.json` (graphify) does not move.
  - A test holds every declared key and value to `^[A-Za-z0-9_]+$`, so nothing
    is quoted.
  - The notes say the entry's `env` sets them on every run multivac makes, and
    keep the variable names adapters.test.ts:258-275 match.
- **Rejected**:
  - A command prefix (`DO_NOT_TRACK=1 codegraph sync`). The user decided
    against it, and it changes the declared string and the first word MV-115's
    lookup reads.
  - `codegraph telemetry off`, which writes vendor state outside the repo.
  - An `env:` key for config-declared graphers, which nobody asked for.

## R8: Tests and fixtures

- **New**:
  - `test/lib/init-state.test.ts`: for each shipped adapter, none, directory
    only, a failing state file (0 bytes, truncated, schema 2, empty
    `installed_integrations`, a directory, a broken link) and the files a real
    init writes. Also an unreadable file (skipped under uid 0), a declared file
    and a declared directory, all with `process.env.PATH = ''` (SC-004).
  - `test/change/vendor-state.test.ts`: the five measured cases (SC-002) and the
    env recording (SC-003). Stubs append `$DO_NOT_TRACK $OPENSPEC_TELEMETRY
    $CODEGRAPH_TELEMETRY $CODEGRAPH_NO_DOWNLOAD` to a marker with the parent set
    to `DO_NOT_TRACK=0`.
- **Recorded**: `SPECKIT_INTEGRATION_JSON` in test/helpers/recorded.ts, this
  brain's 0.16.4 file verbatim. Every fixture standing for an installed speckit
  writes it: the sdd-gates stub (:104-106), doctor.test.ts:148, and
  ledger.test.ts:69 and :89. A stub codegraph writes `.codegraph/codegraph.db`
  on `init`. On `sync` without it, it prints `✗ CodeGraph not initialized` and
  exits 1 (1.6.0, requirements study).
- **binary-lookup.test.ts:58** appends `{}` to `graph.json`, which is not what
  graphify writes and parses as partial after a second run. It overwrites
  instead.
- **Inverted (SC-005)**:
  - a hand-made `.specify` reads partial: sdd-gates.test.ts:896 (web is warned
    and never run), and doctor.test.ts:148-151 and :240-247;
  - a staged-only graph is refused, and a codegraph clone runs its build (both
    new).
- **Wording moves**: doctor.test.ts :103, :140, :253, :303 and :310;
  grapher-tracked :86-99, :120-121, :138 and :187-215; per-root :317, :321,
  :332 and :354.

## R9: Law notes

Each note begins `**Amended 2026-09-14 by MV-124**:` and is appended at the
row's end.
- **MV-52**: the hook exports the entry's `env` after its PATH segment, outside
  the declared command, and `REFRESH_HEAD` stays its identity.
- **MV-62**: the opt-out is applied, not only given: the entry's `env` sets it
  on every run multivac makes and in the hook. A hand run is the operator's.
- **MV-75**: "the scaffold artifact whose absence means not installed here" is
  WITHDRAWN. The probe decides: the init runs only where missing, a partial or
  unevaluable root is warned with the reason and the init, never
  re-initialised, and `scaffolded` needs installed.
- **MV-87**: "lacks the artifact", "has it" and "no artifact" mean the probe
  does not find the vendor installed. The project-document gate asks every root
  not missing. An unevaluable root gets neither build nor refresh.
- **MV-90**: existence is the probe's installed, so a 0-byte `graph.json`
  refuses after the build. A local artifact means built in this checkout, and
  the tracked half is MV-103's, as amended.
- **MV-103**: shared artifacts only, of installed roots, read from HEAD
  (`cat-file -e HEAD:./<path>`). Staged is not committed. codegraph's local
  database is exempt. "untracked" becomes "not committed", and the line names
  the add and the commit.
- **MV-113** (found while implementing): its leg
  `brain:src/adapters/registry.ts /specs\/\*/ absent` matched opsx's shared
  `openspec/specs/**`. The leg moves to `/artifact: '[^']*\*/ absent`, the `*`
  inside a step or ledger artifact it guarded: 6 hits on the registry before
  MV-113 (`63fa7c0~1`) against the old leg's 4, and 0 now.
- **MV-121**: "and never claims multivac applies one" and "Applying the opt-outs
  … is not this row" are WITHDRAWN for the variables an entry's `env` declares.

## R10: MV-124's legs

```text
<!-- @anchor MV-124 brain:src/lib/init-state.ts /export async function initState\(/ unique -->
<!-- @anchor MV-124 brain:src/lib/init-state.ts /'(node:)?(child_process|https?|http2|net|tls|dgram)'|fetch\(/ absent -->
<!-- @anchor MV-124 brain:src/{adapters/sdd,adapters/refresh,adapters/tracked,commands/doctor}.ts /initState\(/ each -->
<!-- @anchor MV-124 brain:{src,test}/** /artifactPresent|heldArtifact|isTracked|scaffold\.artifact|sc\.artifact/ absent -->
<!-- @anchor MV-124 brain:src/lib/git.ts /'cat-file', '-e', `HEAD:\.\/\$\{path\}`/ unique -->
<!-- @anchor MV-124 brain:src/** /'--error-unmatch'/ absent -->
<!-- @anchor MV-124 brain:src/adapters/registry.ts /artifacts: \['\.codegraph\/codegraph\.db'\]/ unique -->
<!-- @anchor MV-124 brain:src/adapters/registry.ts /artifactKind: 'local'/ unique -->
<!-- @anchor MV-124 brain:src/adapters/tracked.ts /artifactKind === 'local'/ unique -->
<!-- @anchor MV-124 brain:src/adapters/registry.ts /integration_state_schema: 1/ unique -->
<!-- @anchor MV-124 brain:src/adapters/registry.ts /env: \{ DO_NOT_TRACK: '1'/ count=2 -->
<!-- @anchor MV-124 brain:src/adapters/{sdd,refresh}.ts /\.\.\.spec\.env/ each -->
<!-- @anchor MV-124 brain:src/doors/settings.ts /`export \$\{exported\}; `/ unique -->
<!-- @anchor MV-124 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /nothing here sets (either|any)|(graph\\?\.json|\$\{held\}) is untracked|UNTRACKED →|keeps its artifact untracked|artifact (ok|missing)( \([^)]*\))? ·|artifact missing (\\?\(looked for|→)|artifacts: \['\.codegraph'\]|`\\?\.codegraph` \||(at|has no) `\\?\.codegraph`/ absent -->
<!-- @anchor MV-124 brain:.multivac/invariants.md /Amended 2026-09-14 by MV-124/ count=8 -->
<!-- @anchor MV-124 brain:src/lib/init-state.ts /Object\.entries\(expect\)/ unique -->
<!-- @anchor MV-124 brain:src/adapters/sdd.ts /if \(before\.state !== 'missing'\) \{/ unique -->
<!-- @anchor MV-124 brain:src/adapters/refresh.ts /\.state === 'installed'\) continue; \/\/ already built here/ unique -->
<!-- @anchor MV-124 brain:src/adapters/refresh.ts /build and refresh skipped — / unique -->
<!-- @anchor MV-124 brain:src/adapters/tracked.ts /\.state !== 'installed'\) continue; \/\/ MV-90's refusal/ unique -->
<!-- @anchor MV-124 brain:src/commands/doors.ts /refresh, spec\?\.env \?\? \{\}, notices\)/ unique -->
```

- **Counts** from `multivac count` at `1b3ad92`:
  - leg 4: 28 in 8 files;
  - leg 6: 1 (git.ts);
  - leg 14: 46 lines in 10 files. Run alone, its four alternative groups give
    2 ("nothing here sets"), 12 (untracked), 29 (`artifact ok`/`missing`) and 4
    (`.codegraph` as the artifact), and one line matches two groups;
  - legs 12 and 15: 0.

  After the change, legs 4, 6 and 14 expect 0, and the rest 1, `each`, 2 or 8.
- **Legs 16–21** (added after review): a bite with legs 1–15 alone stayed
  green with the scaffold re-running over a partial root, the tracked gate
  asking roots not installed, `ensureGraphs` skipping a partial root, the probe
  ignoring `expect`, and doors passing no `env`. Each clause now has a `unique`
  leg on its code spelling, dry-run at 1, and so does the unevaluable skip's
  warning. Leg 2 also names `http2`, `tls`, `dgram` and the unprefixed module
  names, and matches 0.
- **Leg 14** matches output samples and code spellings, never the historical
  quotes: DESIGN.md:1201, sdd.ts:219, doctor.ts:189 and doctor.test.ts:221 say
  `` `artifact ok` `` with no ` ·`. The anchor-vacuity hint
  `file exists but is untracked` is a different feature and does not match.
- **Moved**:
  - MV-87 :671 → `brain:src/adapters/refresh.ts /const first = st\.state !== 'installed'/ unique`.
  - MV-103 :811 → `brain:src/lib/git.ts /export async function inHead\(/ unique`.
  - MV-103 :812 → `brain:src/commands/doctor.ts /NOT COMMITTED →/ unique`.
  - MV-103 :814 → `brain:test/change/grapher-tracked.test.ts /close proceeds once the graph is committed/`.
  - MV-103 :815 → `brain:src/adapters/refresh.ts /inHead|graphTrackedGate/ absent`.
  - MV-113 :891 → `brain:src/adapters/registry.ts /artifact: '[^']*\*/ absent`.
- **Unmoved and still green**: MV-52 :320, MV-62 :451-453, MV-75 :548-552,
  MV-87 :661, MV-90 :700 and MV-123's `localBin\(dir\)\]`.

## R11: The row (≤ ~400 words, `specified | proposed | 2026-09-14`, no pipe)

- **Lead**: the vendor's own state files decide whether an adapter is
  initialised, each entry declares what is shared and what is local, and the
  opt-outs are applied on every run.
- **Defects**: the change file's five, one clause each.
- **Rule**:
  - `initState` in `src/lib/init-state.ts` is the one probe, it reads files
    only, and it has four states;
  - the state file per shipped entry;
  - what the scaffold, the build, the gates and `doctor` do in each state;
  - `shared`, `local`, `ignore`, `graphignore` and `artifactKind` are declared;
  - the tracked gate asks HEAD for shared artifacts;
  - `env` is set on every run and in the hook.
- **Mechanical**: the twenty-one legs.
- **Ceilings**:
  - spec-kit before 0.16.4 was never measured and reads partial;
  - codegraph 1.6.0 and OpenSpec 1.13.0 layouts are reproduced by stubs;
  - `CODEGRAPH_DIR` reads partial;
  - a JSON file that is not a graph passes;
  - HEAD is not the integrated ref;
  - whether a vendor honours its opt-out was read, not measured;
  - nothing reads the shared, local and ignore lists yet;
  - the legs see spellings.

## R12: The bite while the change is open

In a scratch clone of the finished work, set MV-124 `active` and move the change
file aside. Each of these must give exit 1:
- `artifactPresent` back in sdd.ts (leg 4);
- `ls-files --error-unmatch` back in git.ts (leg 6);
- `...spec.env` removed from refresh.ts (leg 12);
- codegraph's `artifactKind: 'local'` removed (leg 8);
- "nothing here sets any" back in registry.ts (leg 14);
- one note removed (leg 15);
- the scaffold's guard changed to `=== 'unevaluable'` (leg 17);
- `ensureGraphs` skipping on `!== 'missing'` (leg 18);
- the tracked gate's not-installed skip removed (leg 20);
- the probe's `expect` check removed (leg 16);
- doors passing `{}` for the env (leg 21).
