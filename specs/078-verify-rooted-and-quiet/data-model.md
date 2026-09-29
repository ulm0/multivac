# Data Model: A run reads the checkout that holds where it was asked, and says one line when nothing is off

No new persisted format and no new config key. One resolution type and its resolver, a hook
payload contract on the door target, two optional fields on the command context and one on the
command, a required quiet decision on every report line and read, a tap on the two print
functions, one git read and one config-free walk. `.claude/settings.json` and every gate string
are unchanged; the git shims gain three lines. Names below are the ones the legs of research.md
R16 pin; a spelling a leg reads is given exactly.

## Resolution (src/commands/verify.ts)

```ts
/** MV-151. What a run asked from `start` reads: the checkout that holds it. */
export type Root =
  | { kind: 'brain'; brain: string; top: string | null }           // top: the git toplevel, null outside a work tree
  | { kind: 'consumer'; brain: string; dir: string; via: 'mount' }  // dir: the consumer's scope directory
  | { kind: 'consumer'; brain: string; dir: string; via: 'worktree'; slug: string; key: string }
  | { kind: 'door'; top: string }
  | { kind: 'none'; message: string };

export async function resolveRoot(start: string): Promise<Root>;
```

**Order** (FR-003, FR-004, FR-014–FR-018), each step taken only when every earlier one found
nothing:

| Step | Asks | Gives |
| --- | --- | --- |
| 0 | `existsSync(start)`; `real = realpathSync(start)`; `top = await toplevel(real)` (a `ToplevelError` becomes a `ConfigError`, exit 2) | — |
| 1 | the first `d` from `real` up to and including `top` (only `real` when `top` is null) holding `.multivac/config.yml` | `{ kind: 'brain', brain: d, top }` |
| 2 | `top === null`: `findMount(real)` | `none`: `<start> is in no git repository — …; the brain at <child> verifies from there`, or `noConfig(start)` |
| 3 | `const wt = worktreeBrain(top);` (MV-138's moved leg) | `consumer` via `worktree`, `dir: top` |
| 4 | for each `d` from `real` up to, not including, `top`: `const m = await namedMount(d);` | `consumer` via `mount`, `dir: d` |
| 5 | `findMount(top) ?? (await declaredMount(top))` | `consumer` via `mount`, `dir: top` |
| 6 | `const unnamed = findMount(real);` | `consumer` via `mount`, `dir: real` |
| 7 | `findStaleMount(real) ?? findStaleMount(top)` | throws `staleError(host, stale, from?)` — MV-49's text, ` Run it in <host>.` when the host is not `real` |
| 8 | `if (await hasProjectedDoor(top)) return { kind: 'door', top };` (MV-127's moved leg) | `door` |
| 9 | `await superproject(top)`: its stale pin is `top` → `staleError(sup, top, top)`; it holds a brain or a mount → `none`, `<top> is a submodule of <sup>, which multivac verifies from there — nothing was verified here` | throw / `none` |
| 10 | `samePath(real, top)` | `none`: `noConfig(start)`, today's text |
| 11 | otherwise | `none`: `<start> is inside <top>, which no brain governs — nothing was verified` (a start holding a child brain was taken at step 6) |

Helpers, all in verify.ts beside `worktreeBrain`, `findMount` and `findStaleMount`, whose
bodies are unchanged:

| Function | Contract |
| --- | --- |
| `noConfig(dir)` | `` no .multivac/config.yml in <dir> — run `multivac init .` to create it `` |
| `namedMount(dir)` | `findMount(dir)` accepted only when that brain's `readConfig(m).mount` resolves from `dir` to `m` (`samePath`); a config that does not read is not a mount |
| `declaredMount(top)` | the `path =` lines of `top/.gitmodules` that contain a `/` (below the first level), hold a config, and whose brain's `mount:` resolves from `top` to them; exactly one such line, else null |
| `staleError(host, stale, from?)` | a `ConfigError` with MV-49's text relative to `host`, plus ` Run it in ${host}.` when `from` is given |
| `followable(root)` | `true` for `consumer` and `door`; for `brain`, `root.top !== null && samePath(root.brain, root.top)`; `false` for `none` (critic gap 7) |
| `rootedBrain(start)` | `resolveRoot(start)`'s `brain` when its kind is `brain`, else `start`; a throw gives `start` |
| `siblingBase(brainDir)` | `return worktreeBrain(brainDir)?.brain ?? brainDir;` — the main checkout, for wording |
| `siblingDir(brainDir, key, path)` | critic gap 1: with `wt = worktreeBrain(brainDir)` null, `resolve(brainDir, path)`; else `const own = join(wt.brain, '.multivac', 'worktrees', wt.slug, key);` and `existsSync(own) ? own : resolve(wt.brain, path)` |
| `mountHost(brainDir, cfg)` | the host when `toplevel(brainDir)` is `brainDir` and `samePath(resolve(toplevel(dirname(brainDir)), cfg.mount), brainDir)`; else null; asked lazily, only when a sibling is missing |
| `consumerSource(key, dir)` | the consumer's own read, one sentence for `verify` and `count`: `<key>: working tree <wt> — this checkout, the content about to be committed here`, `clause: plainTree(key, wt, '')` |

## Git and config (src/lib/git.ts, src/lib/config.ts)

```ts
export class ToplevelError extends Error {}
/** Null only for "not a git repository" or "must be run in a work tree"; any other refusal throws with git's line. */
export async function toplevel(dir: string): Promise<string | null>;   // execFileP('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { env: cleanEnv() })
export async function superproject(top: string): Promise<string | null>; // --show-superproject-working-tree, same env; any failure → null

/** The brain whose checkout holds `dir`, without git; null at a checkout root and past the first `.git`. */
export function enclosingBrain(dir: string): string | null;
```

`ToplevelError`'s message: `git rev-parse --show-toplevel failed in <dir>: <gitFailure(stderr)>`.
`readConfig`'s catch: `const holder = enclosingBrain(brainDir);` — with a holder, `no
.multivac/config.yml in <dir> — it is inside the brain at <holder>; run this there`; without,
today's text. Imports gain `existsSync` and `dirname`.

## Door target (src/adapters/registry.ts)

```ts
/**
 * MV-151. How a harness tells a hook command what fired it, as measured in its own binary: a
 * variable set only in hook processes, and the JSON on stdin — the field naming the event, the
 * two events multivac's gates run on, the dotted path of the edited file and of the session's
 * directory. `verify` reads it only when `env` is set, so a terminal, CI and a git hook run from
 * the agent's shell never read stdin.
 */
export interface HookPayload {
  env: string;
  event: string;
  session: string;
  edit: string;
  file: string;
  cwd: string;
}

export interface DoorTarget {
  // ...existing
  hookConfig?: { path: string; shape: string; postEdit?: string; payload?: HookPayload };
}
```

The claude target, on one physical line under a comment citing Claude Code 2.1.283's binary
(hook processes receive `CLAUDE_PROJECT_DIR`; payloads carry `hook_event_name:"PostToolUse",
tool_name, tool_input` and `hook_event_name:"SessionStart", source`, and `session_id,
transcript_path, cwd`; hooks for forwarded commands start in the home directory and must use
`$CLAUDE_PROJECT_DIR` or the `cwd` field; the agent's Bash tool environment carries no
`CLAUDE_PROJECT_DIR`):

```ts
payload: { env: 'CLAUDE_PROJECT_DIR', event: 'hook_event_name', session: 'SessionStart', edit: 'PostToolUse', file: 'tool_input.file_path', cwd: 'cwd' },
```

No other target declares one. The field is never serialised: `installHookConfig` reads
`hookConfig.path` and `hookConfig.postEdit` (as codegraph-worktrees-and-verbs leaves it).

## Command context (src/types.ts, src/cli.ts)

```ts
export interface CommandContext {
  cwd: string;
  /** MV-151. The environment a command reads its own switches from; the dispatcher passes the process's, a test its own. */
  env?: Record<string, string | undefined>;
  /** MV-151. A harness hook's payload on stdin, read only when asked; null when there is none. */
  stdin?: () => Promise<string | null>;
}
export interface Command {
  // ...existing
  /** MV-151. Runs at the root `resolveRoot` finds, so the dispatcher's notice reads that brain. */
  rooted?: true;
}

export async function main(argv: string[], cwd: string,
  io: { env?: Record<string, string | undefined>; stdin?: () => Promise<string | null> } = {}): Promise<number>;
function readStdin(): Promise<string | null>; // null on a TTY; null after 2,000 ms on a pipe nobody closes
```

The entry point calls `main(process.argv.slice(2), process.cwd(), { env: process.env, stdin:
readStdin })`; `cmd.run(rest, { cwd, env: io.env, stdin: io.stdin })`. `rooted: true` is set on
`verify`, `count`, `doctorCommand`, `doorsCommand` and `roadmap`.

**The notice** (FR-033–FR-035): the command is looked up before the notice; for a rooted command
`const root = await resolveRoot(cwd).catch(() => null)`, the config read from `root.brain` when
its kind is `brain` or `consumer`, else from `cwd`; `found = versionNotice(brain, version(),
raw)`; `const n = root?.kind === 'consumer' && found?.level !== 'red' ? null : found;` then the
unchanged `if (n) warn(paint(n))`. The whole block stays inside today's guard.

## The hook's question (src/commands/verify.ts)

```ts
/** MV-151. What the harness hook that ran this asked, through the payload its door target declares. */
async function hookAsk(ctx: CommandContext): Promise<{ session: boolean; file: string | null; dir: string | null }>;
```

- Called only when `a.dir === undefined`. It finds the first door target whose `payload.env` is
  set in `ctx.env`; with none, or no `ctx.stdin`, it returns `{ session: false, file: null, dir:
  null }` without reading.
- It reads `ctx.stdin()`, parses JSON (any failure → nothing asked), and reads fields by dotted
  path. `dir`: the payload's `cwd` when it is a string naming an existing directory, else
  `ctx.env[payload.env]` when it names one, else null (critic gap 7).
- `event === payload.session` → `session: true`; `event === payload.edit` and a non-empty string
  at `payload.file` → `file`; anything else → neither.

In `runVerify`:

```ts
const hook = a.dir === undefined ? await hookAsk(ctx) : { session: false, file: null, dir: null };
const quiet = a.quiet === true || ctx.env?.MULTIVAC_QUIET === '1' || hook.session;
const warnedBefore = warnings();
const asked = a.dir !== undefined ? resolve(ctx.cwd, a.dir) : (hook.dir ?? ctx.cwd);
// ...the range block, unchanged...
const followed = hook.file === null ? null : await resolveRoot(dirname(resolve(asked, hook.file)));
const root = followed !== null && followable(followed) ? followed : await resolveRoot(asked);
```

Then a switch on `root.kind`: `none` throws its message (exit 2); `door` prints MV-127's warning
naming `root.top` and returns 0; `consumer` via `worktree` keeps MV-138's undeclared-key text;
`consumer` via `mount` sets `lagging` and loads with `sddDeclaration: 'report'`; `brain` keeps
the `--repo` warning.

## The quiet decision (src/commands/verify.ts, src/lib/code-in-change.ts, src/anchor/evaluate.ts)

```ts
interface Diagnostic {
  text: string;
  gates: boolean;
  /** MV-151. '' adds nothing to the one line, a clause folds into it, null is off: the whole report prints. Required. */
  quiet: string | null;
}
export interface CodeLine { text: string; gates: boolean; quiet: string | null; }
export interface RepoSource {
  key: string; dir: string | null; ref?: string; line: string;
  /** MV-151. The read as a clause of the one line, or null when it is not plain and prints beneath. Required. */
  clause: string | null;
  /** MV-151. For a repo not on disk: what its legs say to do. */
  why?: string;
}
interface OpenChanges {
  pendingBy: Map<string, string>;
  landed: Set<string>;
  // changes: … (change-file-cites)
  /** MV-151. Open change files that did not parse: silent in the full report; they keep a run from being quiet. */
  unparsed: string[];
}
export interface EvaluateOptions { /* ...existing */ missing?: string; } // a leg's detail for a repo not on disk; absent → today's
```

| Producer | `quiet` |
| --- | --- |
| a parse diagnostic line | null |
| the blank after parse diagnostics | `''` |
| the brain header `<n> claims · <m> anchored (<p>%)` / `unanchored: <ids>` | the same text (clauses) |
| the consumer header `scoped to repo …` / `<m> of <n> brain claims anchor into "<key>"` | `''` / `<m> of <n> brain claims anchor into "<key>" · brain at <dir>[ (the change worktree for <slug>)]` |
| the root line | `''` (never on the one line) |
| a `read` line | `''`; `clause` null pushes the full line to the lines beneath |
| a count line | `''` for `ok`, null otherwise |
| a leg line; a finished line (change-file-cites' variant included); the pending and drift summaries | null |
| `stalenessLines` | null on every line; the call site folds a non-gating line to `''` and pushes it beneath, and a gating one stays null |
| `configLine` (every branch) | null |
| `enactmentLine` | `enact not answered (nothing staged)`, `enact not answered (no commit here yet)`, `enact none (law untouched)`; everything else (index unreadable, no row reached active, enacts, refuses) null |
| the consumer's enact line | `enact not answered (decided in the brain)` |
| `lawDeath` | null |
| the ecosystem line | `` .multivac/ecosystem.json stale (`multivac doors`) `` or `` .multivac/ecosystem.json absent (`multivac doors`) `` |
| `codeInChangeLine` | `code → <slug>` for "lands in open change <slug>" with nothing skipped; null for every other return |
| `mountedRefusalLine` | null |
| the summary | the summary itself, which leads the line |

**Read clauses** (`plainTree(key, wt, extra)`: plain only with a commit and `extra === ''`):
the brain's own and a brain==code key's `<key> <branch> @ <sha> (working tree)` or `<key>
detached @ <sha> (working tree)`; a sibling at its channel with a fetch age, not off channel and
not mid-merge `<key> <channel> @ <sha> (last fetch <age> ago)`; a consumer's `consumerSource`.
Null: fell back, `--worktree`, off channel, parked, never fetched here, behind its own channel,
mid-merge, not on disk, no commits, `brainAtChannel`.

**The missing sibling** (`resolveSources`): `host ??= await mountHost(brainDir, cfg)`; with a
host, `why` = `repo not on disk beside this mount — verify from a brain checkout` and the line
`<key>: not on disk beside this mount — nothing read; verify in <host> for its verdict, or from
a brain checkout`; without, the fix `` run `multivac repos sync` `` plus ` in <siblingBase>` when
that is not `brainDir`, on both. `evaluateCore` passes `missing: <the first missing source's
why>`.

## The tap (src/lib/out.ts)

```ts
let tap: ((err: boolean, line: string) => void) | null = null;
let warned = 0;
export function tapOutput(t: ((err: boolean, line: string) => void) | null): void;
export const warnings = (): number => warned;
// say(line): tap ? tap(false, line) : console.log(line)
// warn(line): warned++; tap ? tap(true, line) : console.error(line)
```

Colour and every other helper are unchanged.

## The run's output (states)

```text
quiet off ──► every line printed as it is made (no buffer, no tap), exactly as before
quiet on  ──► tapOutput(buffer both streams) ─► emit(text, quiet) for every line
             ├─ finalExit ≠ 0, blocking ≠ 0, ev.unparsed.length > 0 || orphan,
             │  warnings() !== warnedBefore, or any buffered quiet === null
             │      ──► tapOutput(null); replay buffer in order (say / warn)   = the full report
             └─ otherwise ──► tapOutput(null); say([summary, ...rest].join(' · '));
                              for each unplain line: say(line)                  = the one line (+ lines beneath)
a throw   ──► replay the buffer, then rethrow; finally: tapOutput(null)
```

`orphan` = some parsed anchor whose claim ID names no row (`!states.has(x.claimId)`).
`unplain` holds, in order, each read line whose `clause` is null and each non-gating stale line
(`else if (quiet) unplain.push(d.text);`). In verify.ts only three direct `say(` remain: the
non-quiet `emit`, the one line and the lines beneath it.

## Flags and usage

`ARGS.quiet = { type: 'boolean', description: 'one line when nothing is off; the full report
otherwise' }`; `TAKES` gains `, --quiet`. The usage lines gain `--quiet`, say that `[dir]` is any
directory of a checkout, and qualify the read-line sentence (contracts/cli-output.md).

## Shims (src/hooks/install.ts)

`shim()` inserts, after the chain block (or the non-chain `root=` line) and before `# The build
is used only when this repo IS multivac`:

```sh
# One line when nothing is off; the full report otherwise. An env var, not a
# flag: a binary that predates it ignores it and prints in full.
export MULTIVAC_QUIET=1
```

The emitted lines hold no row ID, no version string, neither `graph` nor `refresh`, and no
`--git-common-dir`. `SHIM_HEADER` and MV-108's identity are unchanged. `.multivac/hooks/*` is
regenerated by `multivac doors`.

## Test helper (test/helpers/fixture.ts)

```ts
/** MV-151. The process environment without the two switches a developer may export, plus `extra`. */
export function scrubbedEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv;
```

## `count`, `doctor`, `doors`, `roadmap`

| Command | Change |
| --- | --- |
| `count` | `root = await resolveRoot(startDir)`; `none` prints its message, exit 2; `door` prints `<top> carries a multivac door but no brain is mounted here — nothing to count against`, exit 2; `loadConfig(brainDir, root.kind === 'brain' ? {} : { sddDeclaration: 'report' })`; `consumerKey` is the worktree's key or `resolveRepoKey(cfg, root.brain, root.dir)`; the sources are `resolveSources(brainDir, cfg, false)` (MV-109's line, kept) with the consumer's own key replaced by `await consumerSource(consumerKey, root.dir)`; imports drop `findMount`, `existsSync` and `CONFIG_PATH` where unused |
| `doctor` | `const brain = await rootedBrain(ctx.cwd);`, then `if (!samePath(brain, ctx.cwd)) say(…)` printing `root      <brain> (asked from <dir>)`, then `doctorReport(brain, strict)`; the five sites iterate `[key, e]` and read `e.isBrain ? brain : siblingDir(brain, key, e.path)` (`presentRepoDirs` still skips `isBrain`); `reposLine`'s clone advice gains ` in <siblingBase(brain)>` when that is not `brain` |
| `doors` | `const brainDir = await rootedBrain(ctx.cwd);`, then `if (!samePath(brainDir, ctx.cwd)) say(…)` printing `root: <brainDir> (asked from <dir>)` |
| `roadmap` | `const brain = await rootedBrain(ctx.cwd);`, then `if (!samePath(brain, ctx.cwd)) say(…)` printing `root: <brain> (asked from <dir>)` |

## Validation (tests)

- `Root` for every fixture of spec US1–US4: kind, `brain`, `dir`, and the message for `none`.
- `followable` is false for `none` and for a brain whose `top` is not itself; true for a
  repository brain, a mount, a brain change worktree, a consumer and a door.
- `siblingDir` from a brain change worktree returns the change's own worktree for a key when it
  exists — in the default layout and with a path whose last segment is not the key — and the
  main checkout's sibling otherwise; from the main checkout it is `resolve(brainDir, path)`.
- Every `Diagnostic`, `CodeLine` and `RepoSource` producer sets its field (the compiler refuses
  otherwise); the quiet run equals the loud one byte for byte whenever it is not one line.
- `hookAsk` never calls `stdin` with `[dir]` given or no marker set (a throwing stub proves it);
  unparsable JSON and a `Stop` event are ignored; `dir` falls back from `cwd` to the marker's
  value to null.
- The three shims each hold `export MULTIVAC_QUIET=1` once, after the chain block and before
  the first runner, and match `MV-[0-9]+` nowhere.
- `scrubbedEnv()` holds neither switch whatever the process exports.
