# Data Model: The graph the agent asks is one that answers

No new persisted format. A grapher's ignore file gains one record line per append; four
registry fields are added and one removed; three resolvers, two derivations, one discovery and
one probe are added; the post-edit hook gains a follow form. The names below are the ones
`codegraph-worktrees-and-verbs` (#6) extends — `askAt`, `whereLines`, `graphPointer`, the follow
hook, `graphIgnoreLines`, `writeIgnores(…, lines)`, land's ignore step, `leftoverGraphs`, the
forced worktree removal — and are kept as written.

## Registry (src/adapters/registry.ts)

```ts
interface AdapterSpec {
  // ...existing: artifacts, artifactKind, shared, local, ignore, graphignoreFile, refresh, create, queries, harness, env, …
  // REMOVED: graphignore?: string[]  — the lines are derived (graphIgnoreLines), never listed
  /**
   * The file the grapher reads its ignore rules from. multivac appends the root's derived lines
   * there (MV-148) under a `# multivac:` record, before the first build and at `change land`.
   */
  graphignoreFile?: string;
  /**
   * MV-148. Run instead of `refresh` while the root's graph holds a node under a directory a
   * record line lists: the vendor's refresh refuses to shrink the graph (graphify 0.9.29: exit 1,
   * "Refusing to overwrite"). Same runner, env, lock and failure quoting as `refresh`.
   */
  rebuild?: string;
  /**
   * MV-148. How the verbs in `queries` are pointed at another checkout, `{checkout}` the
   * placeholder; appended to each verb as the agent types it. Measured: graphify 0.9.29 answers
   * byte for byte from any directory with `--graph <path>`; codegraph 1.6.0 with `-p <path>`, and
   * where no index is there, from the nearest index above it (exit 0) or not at all (exit 1).
   */
  askAt?: string;
  /** MV-148. The vendor's own removal of a local artifact, printed by `doctor`, never run. */
  remove?: string;
  harness?: {
    run: string;                                   // existing: 'graphify install --project --platform {key}'
    /** MV-148. The vendor's own uninstall per platform, printed by `doctor`, never run. */
    uninstall: string;
    platforms: Record<string, {
      key: string; probe: string; section: 'none' | 'own-door' | 'canonical'; redundant?: true;
      /**
       * MV-148. Printed before every other platform's uninstall: on graphify 0.9.29 gemini's
       * uninstall stops early, leaving its `BeforeTool` hook, when another platform's removed the
       * shared section first.
       */
      uninstallFirst?: true;
    }>;
    ignore?: string[];                             // existing: ['*.graphify-bak'], never removed
  };
}
```

| Entry | Field | Value |
| --- | --- | --- |
| graphify | `graphignore` | removed (was `['.claude/', '.multivac/', '.specify/', 'specs/', 'openspec/']`) |
| graphify | `graphignoreFile` | `'.graphifyignore'` (unchanged; MV-128's leg) |
| graphify | `rebuild` | `'graphify update . --force'` |
| graphify | `askAt` | `'--graph {checkout}/graphify-out/graph.json'` |
| graphify | `harness.uninstall` | `'graphify uninstall --project --platform {key}'` |
| graphify | `harness.platforms.gemini.uninstallFirst` | `true` |
| codegraph | `askAt` | `'-p {checkout}'` |
| codegraph | `remove` | `'codegraph uninit --force'` (without `--force` it prompts and removes nothing, 1.6.0) |
| codegraph | comment above `ignore` | the measured mechanism (no Markdown indexed; `.gitignore` through git; `codegraph.json` `exclude` on `sync`), in place of "No graphignore: no ignore file of codegraph's was verified"; no `graphignoreFile` |

A grapher declared under `graphers:` has none of the four; it is `shared`, and its removal is
removing its artifact.

## Resolution (src/adapters/detect.ts)

| Function | Answers | Rule |
| --- | --- | --- |
| `brainHoldsCode(cfg): boolean` | whether the brain holds code | some repos entry is the brain (`isBrain`) |
| `adapterFor(cfg, 'brain', 'grapher')` | the grapher at the brain root | `undefined` when `own === undefined` (no entry is the brain) — the guard, after #3's SDD guard; unchanged otherwise, a code repo keyed to the brain included |
| `askedGraphers(cfg): Map<string, string[]>` | which graphers an agent in the brain asks, and in which repos | per grapher, in config order: the brain's own (key of its `isBrain` entry) where it holds code, and each non-brain repo not marked `managed: false` resolving one; empty → the top level's resolved grapher mapped to `[]`; still empty → an empty map |
| `brainRefreshGrapher(cfg): string \| undefined` | which grapher the brain's post-edit hook runs | brain==code: `adapterFor(cfg, 'brain', 'grapher')`; code-less: the single name the non-brain, not-`managed: false` repos resolve, over the repos resolving one (a repo resolving none does not disagree); two or more names, or none → `undefined` |

All three read the top level only through `ownDecl` — no dotted or bracket read of
`sdd`/`grapher` (MV-122's leg, #3's leg). They are synchronous: "writable" is "not
`managed: false`"; a shallow or unsynced clone is named.

## Derivations (src/lib/code-in-change.ts)

`nonCodeGlobs(cfg, repoKey)`: the grapher loop takes every name the registry knows
(`grapherNames`) and every key of `cfg.graphers`, whichever resolves, adding each one's
`shared`, `local`, `graphignoreFile` and harness probe directories — mirroring #3's "every known
SDD's vendor state". Everything else unchanged (#4's `bodyGlobs` included).

`graphIgnoreLines(cfg, brain, scope, spec): string[]`:

1. `[]` when `spec.graphignoreFile` is unset.
2. Each glob of `nonCodeGlobs(cfg, scope)` of the form `<dir>/**`, `<dir>` one path segment with
   no glob character, written `/<dir>/`, minus the top directory of every known grapher's
   `local` globs (`graphify-out`, `.codegraph`) — graphify skips its own natively and indexes no
   `.db`.
3. In a code repo (not the brain), the mount: `/<mount>/` (`/.brain/` by default).
4. Every declared repo whose resolved path lies inside the root's directory, relative, `/<rel>/`.
5. Sorted, de-duplicated.

This brain at 92c4c08: `/.agents/ /.claude/ /.codex/ /.copilot/ /.cursor/ /.gemini/ /.husky/
/.multivac/ /.opencode/ /.specify/ /openspec/ /specs/` (12). A code repo: the same without
`/specs/`, plus `/.brain/`.

## Ignore writing and the rebuild (src/adapters/refresh.ts)

```ts
export const IGNORE_RECORD = '# multivac: kept out of the graph — ';
export async function writeIgnores(
  name: string, spec: AdapterSpec, dir: string, scope: string,
  lines: string[],                                   // graphIgnoreLines(…), or [] from the harness call
  opts?: { before?: string; gitignore?: boolean },   // before: 'the first build' (default); gitignore: true (default)
): Promise<boolean>;                                 // true when it appended to spec.graphignoreFile
export async function holdsIgnored(spec: AdapterSpec, dir: string): Promise<boolean>;
```

`writeIgnores`, for the grapher's ignore file, appends the lines not skipped, then one record
line `IGNORE_RECORD + <appended lines joined by ' '>`. A line `/x/` is skipped when the file
already holds, trimmed, `x/`, `/x/`, `x` or `/x` (with or without a leading `!`); when a line
starting with `IGNORE_RECORD` lists `/x/`; or when any line, negation stripped, names a path under
`x` (`x/…`, `/x/…`, `x/*`). For `.gitignore`, unless `opts.gitignore === false`, `spec.ignore`
exactly as today. It prints `graph <name> @ <scope>: wrote <file> (+N)[ and .gitignore (+M)]
before <before>` (N counts lines, never the record); the shared-graph `ignoredPaths` warning stays
on the first-build path only.

`holdsIgnored(spec, dir)`: reads files only (no git — MV-50/MV-52's leg). True when
`spec.graphignoreFile` holds record lines, the artifact parses as JSON, and some node's
`source_file` starts with `<x>/` for a `/x/` a record lists that no `!` line in the file
re-includes. Unreadable or unparsable → false.

`refreshGraph(name, dir, scope, graphers)`: on an installed root, `run = (spec.rebuild &&
await holdsIgnored(spec, dir)) ? spec.rebuild : spec.refresh`; everything else as today (lock,
env, failure quoting, MV-50, MV-58, MV-123, MV-124).

`ensureGraphs`: before a root's first build, `await writeIgnores(s.name, spec, s.dir, s.scope,
graphIgnoreLines(cfg, brain, s.scope, spec))` (both files, as today). `runHarnessInstalls` passes
`[]`.

## Leftovers (src/lib/repo-state.ts)

```ts
export interface LeftoverGraph {
  name: string;                     // the grapher
  kind: 'shared' | 'local' | 'declared';
  artifact?: string;                // present on disk
  tracked: boolean;                 // git tracks the artifact
  stateDir?: string;                // e.g. 'graphify-out', '.codegraph'
  ignoreFile?: string;              // e.g. '.graphifyignore', when present
  platforms: string[];              // harness platform keys whose probe is present, uninstallFirst first, then registry order
}
export async function leftoverGraphs(cfg: Config, dir: string): Promise<LeftoverGraph[]>;
```

`[]` when the brain holds code. Otherwise, for every name in `grapherNames` and every key of
`cfg.graphers`: the artifact, the `local` top directory, the `graphignoreFile` and every harness
platform's `probe`, declared door or not; one entry per grapher where any is present. Offline:
file existence and one `git ls-files` for `tracked`. No config key chooses among graphers.

Callers: `doctor` (one line each), `repos check` (a fact on the brain's line), `doors` and `init`
(both pass the result to `renderBrainDoor` — an `each` leg).

## Hook (src/doors/settings.ts, src/commands/doors.ts)

`refreshHookCmd(refresh, env, artifact, follow?)`: with `follow`, the toplevel test is
`[ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/<artifact>" ] && cd "$t" || exit 0; `
in place of `[ -n "$t" ] && [ -e "$t/<artifact>" ] && cd "$t"; `; nothing else changes. Without
`follow`, byte for byte today's. `installHookConfig(dir, hookConfig, refresh, env, notices,
artifact, follow)` passes it through.

`doors`' brain projection:

| Brain | Grapher projected | `follow` | Wired when |
| --- | --- | --- | --- |
| holds code | `adapterFor(cfg, 'brain', 'grapher')` | false | `missingRequired(spec, dir)` empty, as today |
| holds no code, one grapher over the writable code repos | `brainRefreshGrapher(cfg)` | true | `missingRequired(spec, root.dir)` empty for EVERY writable code repo resolving it |
| holds no code, several graphers | none | — | never; one notice |
| holds no code, binary not reachable from every repo | none | — | never; one notice |

## Doors (src/doors/brain.ts, src/doors/ecosystem.ts, src/doors/flow.ts)

- `const ASK = 'ASK IT BEFORE READING THE TREE RAW';` — one module constant, no period.
- `freshness(hooked: boolean): string` — the one ternary: `hooked ? 'refreshed after your edits' : 'refreshed at \`change land\` and \`change close\`'`. `grapherLines` calls it with `config.doors.some(postEdit)` (unchanged, so the consumer door is unchanged); `whereLines` with `postEdit && brainRefreshGrapher(config) === name`, and appends ` there` to the hooked phrase.
- `noQueryLine(name, indent)` — the one `has NO query command` literal.
- `whereLines(config, groups: Map<string, string[]>, holds: boolean): string[]` — contracts/cli-output.md *The brain door*: the head (code-less, or the siblings' when `holds`), then per group with a spec: the group line and its verbs (`askAt` rendered with `<checkout>` for `shared`, `<repo>` for `local`) or the no-query line; a group with no repo → the unresolved line, no verb; a name with no spec → nothing; no group rendered → `[]`.
- `renderBrainDoor(config, activeInvariants, leftovers: LeftoverGraph[] = [])`: code-less → `whereLines(config, askedGraphers(config), false)` in place of `grapherLines`; holds code → `grapherLines(…)`, then the brain==code line, then `whereLines` over the groups minus the brain's key; each leftover → its door line.
- `ecosystemGraphLines(cfg, 'brain', …)`: graphify's `--graph .multivac/ecosystem.json` verbs when `askedGraphers(cfg).has('graphify')`; a consumer key unchanged.
- flow.ts: `declared = (holds ? 1 : 0) + <non-brain repos>`; `const who = holds ? 'the brain or a repo the change names' : 'a repo the change names';`; a declared grapher no code root resolves → the declared-no-code-root row instead of "no grapher is declared"; the refresh row says "after each edit through the harness hook" only when `brainRefreshGrapher(cfg) === name` and a declared door has a post-edit hook.

## Pointer states (src/commands/change.ts `graphPointer(cfg, key, ws, abs)`)

`spec` = the key's grapher's entry; `ws` the workspace `apply` prints; `abs` the repo checkout.

| Condition | Line (contracts/cli-output.md) |
| --- | --- |
| grapher none, unverified, or no `askAt` | nothing |
| `ws` is the brain's own main checkout | nothing |
| `initState(spec, ws)` partial or unevaluable (or, used below, `abs`'s) | `its graph cannot be pointed at — <reason>` / `its index cannot be pointed at — <reason>` |
| shared, `ws` installed | `its graph: <askAt(ws)> — …relative to this checkout` |
| local, `ws === abs`, installed | `its index: <askAt(abs)> — …relative to this checkout` |
| shared, `ws !== abs`, `ws` missing, `abs` installed | base line (graphify) |
| local, `ws !== abs`, `abs` installed | base line (codegraph) — never `-p <ws>` |
| shared, `ws` missing, `abs` missing (or `ws === abs` missing) | none line (graphify) |
| local, not installed where asked | none line (codegraph) |

Paths absolute; a path holding whitespace is single-quoted.

## Land's ignore step (src/commands/change.ts `commitGraph`)

On the change's branch, before `refreshGraph`, for a verified grapher with a `graphignoreFile`:

| The ignore file at the branch checkout's HEAD | In the repo's own checkout | Land |
| --- | --- | --- |
| committed | any | `writeIgnores(…, graphIgnoreLines(…), { gitignore: false, before: 'the refresh at \`change land\`' })` |
| absent | absent | the same (creates it) |
| absent | present (untracked or committed elsewhere) | names it (contracts), writes nothing |
| present, untracked there | any | names it, writes nothing |

After the refresh: appended and no node under a recorded line → stage `[artifact, file]` (plus
`ECOSYSTEM_PATH` in a brain checkout); appended and a node still under one → restore the file
(`git checkout -- <file>` when tracked at HEAD, delete when land created it), warn, stage the
artifact alone as today.

## Worktree removal (src/commands/change.ts `removeWorktrees`)

`dirty` = `git status --porcelain` paths of the worktree. Every path matching the key's grapher
`local` globs (picomatch) → `['worktree', 'remove', '--force', wt]`; otherwise today's restore of
a lone shared artifact and today's `['worktree', 'remove', wt]`, keeping the worktree on failure.

## `init` (src/commands/init.ts)

`holdsFiles(dir): Promise<boolean>` — in a git repository, `lsFiles` ∪ `await untrackedFiles(dir)`
(git.ts; untracked and not ignored) has a path outside `.multivac/`; outside one, `readdir(dir)`
has an entry other than `.multivac` and `.git`. Read once, before any write; on a first run
`toolsInitWouldRun` passes the grapher only when true, and the same answer decides the brain
entry.

## States

| State of the brain | Grapher at the root | Door | `doctor` | Hook |
| --- | --- | --- | --- | --- |
| holds code | its own or the top level's | two lines + the brain==code line + siblings | status line per root, as today | the brain's, bytes unchanged |
| holds no code, no leftover | none | where-block | fact line (when a grapher is asked) | follow form, or none + notice |
| holds no code, leftover found | none | where-block + leftover line | fact line + leftover line per grapher | as above |
