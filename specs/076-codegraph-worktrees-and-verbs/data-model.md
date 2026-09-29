# Data Model: codegraph answers for the checkout it is asked in

No new persisted format of multivac's own. A code repo's common `info/exclude` may gain the
grapher's ignore lines; a consumer's `codegraph.json` gains spliced lines; `.claude/settings.json`
holds one refresh hook per grapher. Two registry fields and one module are added; one resolver
replaces #5's; one predicate, one merge step, one splice and one normaliser are added. The names
graph-answers-where-asked (#5) defines — `askAt`, `whereLines`, `graphPointer`, `freshness`,
`refreshHookCmd(…, follow)`, `installHookConfig`, `projectInto`, `brainRefreshGrapher`,
`graphIgnoreLines(cfg, brain, scope, spec)`, `writeIgnores(name, spec, dir, scope, lines, opts?)`,
`holdsIgnored`, land's ignore step, `leftoverGraphs`, the forced worktree removal — are used as
#5's artifacts write them (research.md R0).

## Registry (src/adapters/registry.ts)

```ts
interface AdapterSpec {
  // ...existing, and #5's: askAt, rebuild, remove, graphignoreFile, harness.uninstall, …
  /**
   * MV-149. The ignore file is a JSON object and the lines go into `key`'s array, spliced
   * into its text, never re-serialised. `reads` are every pattern list the tool defines; any
   * of them naming a line makes it the human's, and the line is skipped.
   */
  graphignoreJson?: { key: string; reads: string[] };
  /**
   * MV-149. `'structure'`: only the lines that change what the tool indexes — the mount in a
   * code repo whose brain holds code, and the nested declared repos. Absent: #5's full
   * derived set.
   */
  graphignoreScope?: 'structure';
}
```

| Entry | Field | Value |
| --- | --- | --- |
| codegraph | `graphignoreFile` | `'codegraph.json'` |
| codegraph | `graphignoreJson` | `{ key: 'exclude', reads: ['exclude', 'include', 'includeIgnored', 'deprioritize'] }` |
| codegraph | `graphignoreScope` | `'structure'` |
| codegraph | `queries` | the four verbs of research.md R18, with the measurement comment above them |
| codegraph | comment above `ignore` (#5's measured mechanism) | the 1.6.0 `codegraph.json` facts of research.md R12 |
| codegraph | comment above `artifacts` | the 1.6.0 layout (FR-010): `.codegraph/codegraph.db`, `.codegraph/.gitignore` = `*`, `!.gitignore`, WAL mode with `-wal`/`-shm` possibly present, relative paths, a worktree `init` writing nothing outside it, `query` borrowing silently and `status` warning; `change apply` builds it in each change worktree |
| codegraph | comment above `queries` ("Handing this a sentence returns nothing useful") | rewritten: a sentence returns name matches for its words (1,435 B for one sentence) |
| codegraph | `note` | #4's sentence ("The `codegraph query` a door prints … (MV-147).") replaced by the disclosure of contracts/cli-output.md *The codegraph entry* |
| — | `GrapherQuery` doc | keeps "a symbol lookup by name"; adds that codegraph's verbs take a symbol |

graphify gains neither field: its ignore file stays `.graphifyignore`, a text file, with #5's
full derived set.

## The splice (src/lib/json-splice.ts, new, pure)

```ts
export type SpliceResult =
  | { ok: true; text: string; added: string[] }          // text === raw when added is empty
  | { ok: false; why: string };                          // raw left as it is
export function spliceJsonList(raw: string, json: { key: string; reads: string[] }, lines: string[]): SpliceResult;
export function namedBy(parsed: unknown, reads: string[], line: string): string | undefined; // the list naming it, if any
```

| Input | Result |
| --- | --- |
| `''`, whitespace, or no file (the caller passes `''`) | `{\n  "exclude": [\n    "<line>"\n  ]\n}\n` (38 B for `/.brain/`) |
| not JSON, comments, a BOM, a top-level array, `exclude` not an array, a non-string element | `{ ok: false, why }` |
| object, key absent | `"exclude": [<lines>]` inserted after the last top-level member, or into `{}`, at the top-level members' indentation |
| object, key an empty array | `"<line>"` inserted |
| inline array | `, "<line>"` before `]` |
| multi-line array | `,` + the file's EOL + the previous element's indentation + the quoted line |
| duplicate top-level key | the LAST occurrence (what JSON.parse and codegraph keep) |
| a line some `reads` list names (R15 spellings, negated, or a path under it) | not inserted; the caller reports the list |

Invariants: output with the inserted spans removed equals the input; the output parses; a second
call adds nothing; a line is quoted with `JSON.stringify(line)`; no object is serialised (the
`absent` leg on `JSON.stringify(<name>, null`). No fs, no git.

## Derivations (src/lib/code-in-change.ts)

`mountDir(cfg): string | undefined` — `posix.normalize(cfg.mount)`, a leading `./` and a
trailing `/` stripped; `undefined` for an absolute path or one starting with `..`.

`graphIgnoreLines(cfg, brain, scope, spec)` (#5's): with `spec.graphignoreScope === 'structure'`,
only `/<mountDir(cfg)>/` in a code repo when `brainHoldsCode(cfg)`, and each declared repo nested
inside the root, `/<rel>/`; sorted, de-duplicated; `[]` otherwise. Without it, #5's derived set,
its mount line now from `mountDir` too. `[]` when `spec.graphignoreFile` is unset (as #5).

| Root | graphify (#5's set) | codegraph |
| --- | --- | --- |
| consumer of a brain that holds code, `mount: .brain` or `./.brain` | #5's set, `/.brain/` among it | `/.brain/` |
| consumer of a code-less brain | #5's set, `/.brain/` among it (#5 writes the mount in every code repo) | `[]` → no file (the mount holds no code codegraph indexes: `nodes 3 {'src': 3}`) |
| brain that holds code, no nested repo | #5's derived set (12 lines in this brain) | `[]` → no file |
| brain that holds code, a declared repo at `packages/api` | …, `/packages/api/` | `/packages/api/` |
| `mount: /abs/brain` or `../brain` | no mount line | no mount line |

## Ignore writing (src/adapters/refresh.ts)

`writeIgnores(name, spec, dir, scope, lines, opts?)` (#5's, returns whether it appended) gains a
branch on `spec.graphignoreJson`: read `<dir>/<graphignoreFile>` (`''` when missing), call
`spliceJsonList`; on `ok: false` leave the file and `warn` the malformed line; for each line a
non-`key` list names, `say` the skip line; write only when `added` is non-empty; print #5's
`wrote codegraph.json (+N)[ and .gitignore (+M)] before <before>`. The `.gitignore` half is
unchanged (`opts.gitignore !== false`). No record line (JSON holds none). No git.

`readIgnoreLines(spec, dir): { lines: string[]; malformed?: string } ` — exported, the one reader
`doctor` and land use: branches on `graphignoreJson` (the four lists, spellings normalised as
R15) or #5's text file (lines, negations, records).

`holdsIgnored(spec, dir)` (#5's): returns `false` first unless `spec.rebuild` is declared.

`runDeclared(spec, run, dir)`: `const p = execFileP('sh', ['-c', run], { cwd, env }); p.child.stdin?.end(); await p;`.

## Resolution (src/adapters/detect.ts)

| Function | Answers | Rule |
| --- | --- | --- |
| `brainRefreshGraphers(cfg): { name: string; follow: boolean }[]` (replaces #5's `brainRefreshGrapher`) | which graphers the brain's session refreshes | brain holds code: `adapterFor(cfg, 'brain', 'grapher')` with `follow: false` if any; then, in config order, each distinct grapher the non-brain repos not marked `managed: false` resolve, `follow: true`. Code-less: those alone. A name with no registry or config entry is skipped (unverified); a grapher whose `artifacts[0]` equals one already listed is dropped and reported by `doors` |
| `hookRefreshes(cfg, name): boolean` | whether "after your edits" is true of `name` | `cfg.doors.some((d) => doorTargets[d]?.hookConfig?.postEdit) && brainRefreshGraphers(cfg).some((g) => g.name === name)`. Introduced over #5's `brainRefreshGrapher(cfg) === name` first (byte-neutral), then over the list |

Both read the top level only through `ownDecl` (MV-122's and #3's legs stay at 0), synchronously;
a shallow or unsynced clone is still listed; `doors` never projects into one (MV-125).

## The hook merge (src/doors/settings.ts)

```ts
export type RefreshHook = { refresh: string; env: Record<string, string>; artifact?: string; follow?: boolean };
const ARTIFACT_TEST = /\[ -e "\$t\/([^"]+)" \]/;
export function refreshKey(command: string): string | undefined; // the artifact a hook of ours names; undefined for a keyless (pre-MV-140) one
export function mergeClaudeSettings(raw: string | null, opts?: {
  refreshes?: RefreshHook[];                 // the list; takes precedence
  refresh?: string; env?: Record<string, string>; artifact?: string; follow?: boolean; // one-element sugar, today's callers
  matcher?: string;
}): { text: string; notices: string[] };
function rewrite(m: Mine, command: string): void;   // m.hook.command = command; m.hook.type = 'command'; — shared with ensureEvent
function ensureRefreshes(hooks: Entry[], wanted: RefreshHook[], matcher: string): void;
```

`ensureRefreshes`, with `ours` = every hook whose command starts with `REFRESH_HEAD`, keyed by
`refreshKey`:

1. For each wanted `w`, every hook of ours whose key is `w.artifact` → `rewrite(m, refreshHookCmd(w.refresh, w.env, w.artifact, w.follow))`, copies included.
2. Each wanted grapher with no hook yet takes over, in place inside its entry, the first hook of ours whose key is unwanted or missing (matcher, `timeout` and sibling commands kept).
3. Each wanted grapher still without one → a new entry `{ matcher, hooks: [{ type: 'command', command }] }`.
4. Every other hook of ours is removed, its entry only when emptied. `wanted = []` removes every hook of ours.

A command not starting with `REFRESH_HEAD` is never ours, whatever it names. Two keyless copies
of ours: step 2 takes the first, step 4 removes the second.

## Wiring (src/commands/doors.ts)

```ts
function refreshHookOf(spec: AdapterSpec, follow: boolean): RefreshHook {
  return { refresh: spec.refresh, env: spec.env ?? {}, artifact: spec.artifacts[0], follow };
}
async function installHookConfig(dir: string, hookConfig: HookConfig, refreshes: RefreshHook[], notices: string[]): Promise<void>;
// passes `refreshes: hookConfig.postEdit ? refreshes : []` to mergeClaudeSettings
```

| Projection | Hooks passed | Each kept when |
| --- | --- | --- |
| brain that holds code | `brainRefreshGraphers(cfg)` — its own (`follow: false`) + others (`follow: true`) | own: `missingRequired(spec, dir)` empty; follow: `missingRequired(spec, root.dir)` empty for every writable code repo resolving it (#5's rule) |
| code-less brain | `brainRefreshGraphers(cfg)`, all `follow: true` | as the follow row |
| consumer | its own grapher, `follow: false` | `missingRequired(spec, dir)` empty, as today |
| two graphers, one artifact | the first listed only | the notice of contracts/cli-output.md |

#5's "one hook runs one command" notice is removed; #5's unreachable notice stays, per grapher.

## Apply (src/commands/change.ts)

`indexWorktree(brain, cfg, key, ws, abs)`, called once in `cmdApply`'s workspace loop after
`ensureWorkspace` and the carry, before `work here`:

1. `name = adapterFor(cfg, key, 'grapher')`, `spec = grapherSpec(name, cfg.graphers)`; return
   when there is no spec or `spec.artifactKind !== 'local'` (a config-declared grapher is
   `shared`; the registry's kind decides, never the name).
2. `missing = (await missingRequired(spec, ws)).length > 0`. If `missing` and `(await
   initState(spec, abs)).state !== 'installed'`: return — `equip`'s build of the repo's own
   checkout printed MV-123's line.
3. If not `missing`: `await excludeLocalOutputs(ws, spec, key)` — only where a build or sync
   follows.
4. `await refreshGraph(name, ws, \`${key} worktree\`, cfg.graphers)` (or `key` when `ws ===
   abs`) — builds (`create`) where not installed, syncs (`refresh`) where installed; on a lookup
   miss it prints the skip line itself (the repo's own checkout being indexed, `equip` printed
   none); warns, never throws.

It never calls `writeIgnores`.

`excludeLocalOutputs(dir, spec, key)`:

1. `missing = spec.ignore.filter(line => git -C dir check-ignore -q line` exits non-zero`)`; return when empty.
2. `common = resolve(dir, (await gitRun(dir, ['rev-parse', '--git-common-dir'])).trim())`; read `<common>/info/exclude` (`''` when missing), `mkdir -p <common>/info`.
3. Append each line of `missing` not already a line of the file; `say` the exclude line of contracts/cli-output.md naming what was appended. Nothing appended → nothing printed.

## Pointer states (src/commands/change.ts `graphPointer(cfg, key, ws, abs)`, #5's)

| Condition | Line |
| --- | --- |
| grapher none, unverified, or no `askAt` | nothing (#5) |
| `ws` is the brain's own main checkout | nothing (#5) |
| `initState(spec, ws)` (or `abs`'s, when asked) partial or unevaluable | #5's `its … cannot be pointed at — <reason>` |
| shared, any | #5's rows, unchanged |
| **local, `ws` installed** (a worktree or in place) | `its index: -p <ws> — <fresh>; paths in its answers are relative to this checkout`; `<fresh>` = `hookRefreshes(cfg, name) ? 'refreshed after your edits' : 'as of this apply, refreshed again at \`change land\`'` |
| local, `ws !== abs`, `ws` not installed, `abs` installed | #5's codegraph base line, unchanged — never `-p <ws>` |
| local, installed nowhere asked | #5's codegraph none lines, unchanged |

## Land (src/commands/change.ts `commitGraph`)

| Artifact | Checkout state | Land |
| --- | --- | --- |
| shared | any | #5's path, unchanged (detached HEAD refused; ignored artifact refused; `[art, file]` staged) |
| local | read-only | `true`, nothing (existing check) |
| local | detached HEAD, or another branch | `true`, silent |
| local | the change's branch | #5's ignore step (one `writeIgnores(…, { gitignore: false, before: 'the refresh at \`change land\`' })` call, shared with the shared path) and the alone commit below; lookup miss → `true`, silent; else `excludeLocalOutputs(dir, spec, key)` and `refreshGraph(name, dir, key, cfg.graphers)`; commit no index |
| local, the step would write | `codegraph.json` committed at HEAD, or absent there and in the repo's own checkout | `check-ignore -q codegraph.json` hits → the refusal line (a warning), nothing written, land goes on — no index waits on it; else append; appended → `commitBookkeeping(dir, ['codegraph.json'], 'graph: <slug> — codegraph keeps <lines> out of its index')` |
| local, the step may not write | untracked in the repo's own checkout, or untracked at the branch checkout | nothing written, nothing said (`doctor` names it) |

## Close (src/commands/change.ts `removeWorktrees`)

Unchanged from #5: the worktree's index is ignored through the common `info/exclude`, so the
porcelain is empty and a plain `git worktree remove` succeeds; #5's forced removal (every dirty
path under `local` globs) stays as the second defence.

## Doors (src/doors/brain.ts, src/doors/flow.ts)

- The list header in `grapherLines`: `\`  ${ASK}. These are this tool's own verbs, not a generic one — each line says what it answers:\`` (#5's `ASK` stem constant).
- #5's brain==code line for a local `askAt`: contracts/cli-output.md *A brain that holds code*; its conditional clauses are quoted strings (research.md R23).
- `whereLines` (#5's): `askAt` rendered `<checkout>` for every grapher; the local group line of the contract; freshness `freshness(hookRefreshes(config, name))` + ` there`; a sibling group whose grapher is the brain's own AND whose verbs `grapherLines` listed above (no section cited) prints its group line and the dedup line instead of the verbs.
- flow.ts's refresh row, for a local artifact: `, and in each change worktree at \`change apply\`` after the artifact, and `where it is synced and never committed` in place of `where it is committed on the change branch`; "after each edit through the harness hook, and " only when `hookRefreshes(config, name)`. The row still ends `at \`change close\`, in <roots>`.

## Doctor (src/commands/doctor.ts) and leftovers (src/lib/repo-state.ts)

- Refresh path (FR-016, FR-011): per grapher `hookRefreshes` lists, and, for a local artifact, apply builds / land syncs / never committed (contracts).
- `leftoverGraphs(cfg, dir, key = 'brain')` (#5's, one more argument): `key === 'brain'` → #5's semantics (`[]` when the brain holds code). Another key → the known graphers other than the one that key resolves, whose artifact is present in `dir` (file existence only). A `graphignoreFile` alone counts only beside the grapher's artifact or state directory (FR-024).
- The two-artifact fact (FR-017): for each writable root, each entry of `leftoverGraphs(cfg, root.dir, root.key)` whose grapher `hookRefreshes(cfg, g.name)` → the appended fact with #5's removal; computed in doctor.ts, repo-state.ts stays offline.
- The `codegraph.json` facts (FR-023): per writable root whose grapher has `graphignoreJson`, from `readIgnoreLines` and `graphIgnoreLines`, and one git read of whether the file is tracked at HEAD (in doctor.ts, never refresh.ts).

## States of a worktree index

```text
(no index) --change apply, binary found--> built --edit + follow hook--> synced
    |                                        |--re-run apply / change land--> synced
    |--binary not found--> (no index; fallback line; one missing-binary line)
    |--change land, binary found--> built (after the exclude step)
built/synced --change close--> removed with the worktree
```

| Checkout | Index | Pointer | Close |
| --- | --- | --- | --- |
| worktree, built | installed, excluded through the common `info/exclude` | `its index: -p <wt> — <fresh>` | plain removal |
| worktree, not built | none | #5's base or none line | plain removal |
| in place | synced at apply and land | `its index: -p <abs> — <fresh>` | nothing removed |
| brain's own main checkout | as `repos sync` / `equip` left it | nothing | — |
