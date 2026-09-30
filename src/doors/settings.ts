// Managed edit of .claude/settings.json: add multivac's harness hook entries,
// preserve every key and entry we don't own. Idempotent.
//
// Two entries, two different jobs. `verify` is the gate: it runs at session
// start and after edits, each event wrapped for the one channel Claude Code
// reads back (SESSION_GATE / EDIT_GATE below). The grapher refresh is NOT a
// gate — it is the agent's navigation aid, so it follows the agent's edits
// rather than the commit: fire-and-forget, output discarded, exit 0 whatever
// the tool did.
//
// MV-149: one refresh hook per grapher the brain's session refreshes. A hook
// is ours by its head (`REFRESH_HEAD`) and a grapher's by the artifact its
// toplevel test names (`refreshKey`), so the merge rewrites each grapher's own
// hook in place and never takes a command a human typed.

/** The gate's engine — both gate commands below run exactly this. */
const VERIFY = 'mvac verify';

// MV-112. The wrappers are the delivery, not decoration. Claude Code's hook
// contract feeds the model ONLY exit-0 stdout at SessionStart and ONLY exit-2
// stderr at PostToolUse; every other exit shows stderr to the user and gives
// the model nothing. The bare command both events ran until this row exits 1
// with its findings on stdout — so on the one occasion the gate had something
// to say, neither event delivered a byte of it. Measured with a stub on a
// constructed PATH, not inferred.

/**
 * SessionStart: stderr merged into stdout, exit forced to 0 — findings are the
 * payload, and exit-0 stdout is the only channel that carries them into the
 * model's context. Forcing 0 is routing, not ignoring: the contract has no
 * blocking at session start, and a gate that could block here would lock a
 * session out of the repair it was opened to make.
 */
const SESSION_GATE = `${VERIFY} 2>&1 || true`;

/**
 * PostToolUse: everything to stderr, EVERY failure mapped to the one exit the
 * harness returns to the model as feedback it must answer. Every failure, not
 * only a red law: a ConfigError the edit itself caused is verify's own exit 2,
 * and a vanished binary is the shell's 127 — after an agent's edit each of
 * those is the agent's to see. The opposite of the commit shim's rule, and
 * deliberately: the shim protects a human's commit and degrades to a warning,
 * while this reports to the machine that just made the change. The edit is
 * already on disk, so the block is a forced read in the same turn, not a
 * revert.
 */
const EDIT_GATE = `${VERIFY} >&2 || exit 2`;

/** Claude Code's file-editing tools — the default post-edit matcher. */
const EDIT_TOOLS = 'Edit|Write|MultiEdit';

/**
 * Coalescing lock, under the gitignored cache. Also identifies our hooks.
 * Repo-relative on purpose: it is the lock for THAT checkout, and
 * `refreshGraph` takes the very same path so the hook and `change close`
 * cannot run a grapher over each other (src/adapters/refresh.ts).
 */
const CACHE = '.multivac/cache';
export const GRAPH_LOCK = `${CACHE}/graph-refresh.lock`;

/** The generated head of the refresh command — see `ownsRefresh`. */
const REFRESH_HEAD = `L=${GRAPH_LOCK};`;

type Json = Record<string, unknown>;

/**
 * The post-edit refresh command, for a grapher's `refresh` (`graphify update .`).
 *
 * Never blocks the agent's edit loop and never fails it:
 * - `mkdir` of a directory is the atomic lock — a refresh already running
 *   means this edit's hook exits immediately instead of thrashing a big repo.
 *   Skipping is right HERE and only here: the running refresh will pick this
 *   edit up too. `change close` takes the same lock and waits instead.
 * - the 30-minute sweep is a ceiling, not a liveness check: `find -mmin +30`
 *   cannot tell a killed process from a grapher still indexing a huge repo,
 *   so a refresh that outlives 30 minutes gets its lock swept and a second
 *   refresh may start beside it. The real fix is a pid in the lock; until a
 *   repo is slow enough to need it, 30 minutes is the bound we accept.
 * - the refresh runs in a background subshell with stdio detached, so the
 *   harness gets its exit the moment the hook is fired.
 * - the hook always exits 0: a foreign tool's failure is not the agent's.
 * - PATH gains `$PWD/node_modules/.bin` after the harness's own (MV-123):
 *   `doors` wires this hook when the one lookup finds the grapher, and that
 *   lookup also reads the root's node_modules/.bin, so a hook searching PATH
 *   alone would be wired for a binary it cannot reach. `$PWD` is the directory
 *   the relative lock above is taken in, so it carries that lock's ceiling.
 *   After `REFRESH_HEAD`, which stays the head `ownsRefresh` matches.
 * - `env`, the grapher entry's opt-outs (MV-124), is exported after PATH and
 *   before the refresh: a refresh that runs on every edit is the one place an
 *   opt-out named and never set costs the most (MV-62). Exported here rather
 *   than prefixed to the declared command, which stays the vendor's string and
 *   the first word MV-115's lookup reads. Empty exports nothing, so a hook for
 *   an entry declaring none keeps its bytes. The values are bare words (a test
 *   holds that), so nothing is quoted.
 * - `follow` (MV-148) is a follow hook of the brain: it runs only in the
 *   checkout holding the edited file, and only when that checkout holds the
 *   artifact and is no checkout of a brain; otherwise it exits 0 having run
 *   nothing. Without it, the hook of a brain's own grapher and a consumer's:
 *   the bytes they have always had, but for MV-149's exit when the edited file
 *   is in no repository.
 */
export function refreshHookCmd(
  refresh: string,
  env: Record<string, string> = {},
  artifact?: string,
  follow = false,
): string {
  const exported = Object.entries(env).map(([k, v]) => `${k}=${v}`).join(' ');
  // MV-140: the repo of the file just edited, when that repo holds the graph.
  // The hook ran in the session's directory, so an edit inside a named
  // sibling's worktree refreshed the brain's graph and left the sibling's
  // stale. The harness hands the payload on stdin; `file_path` is read in the
  // foreground, before the refresh is detached.
  //
  // MV-149: a file in no repository refreshes nothing. This form fell back to
  // the session's directory there, so every write of a scratch file outside
  // every checkout refreshed the session's graph. A payload naming no file
  // (`${f:-.}` is the session's directory) and a repository without the
  // artifact still stay where they were: stated ceilings.
  //
  // MV-148: in a brain that holds no code, "where it was" is the brain, and one
  // edit of a brain file built a graph there again after a human had removed
  // the install. The follow form stops instead of falling through, and skips a
  // toplevel carrying the brain's config — the brain itself, and each of its
  // change worktrees, whose toplevel is not the session's directory, so a
  // compare with `pwd` would miss them. A kept install is never refreshed by
  // it. Spelled out literally, no interpolation in the test, so the law can
  // read it; and never a forced rebuild — that is `change land`'s to decide.
  const here = artifact
    ? `f=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' | head -n 1); ` +
      `t=$(git -C "$(dirname "\${f:-.}")" rev-parse --show-toplevel 2>/dev/null); ` +
      (follow
        ? `[ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/${artifact}" ] && cd "$t" || exit 0; `
        : `[ -n "$t" ] || exit 0; [ -e "$t/${artifact}" ] && cd "$t"; `)
    : '';
  return (
    `${REFRESH_HEAD} ${here}PATH="$PATH:$PWD/node_modules/.bin"; ${exported ? `export ${exported}; ` : ''}` +
    `find "$L" -maxdepth 0 -mmin +30 -exec rmdir {} + 2>/dev/null; ` +
    `mkdir -p ${CACHE} && mkdir "$L" 2>/dev/null || exit 0; ` +
    `{ ${refresh}; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0`
  );
}

/**
 * Does this command belong to multivac? Identity is EXACT and it is a string
 * multivac itself writes — a substring of somebody else's command is not
 * identity. `mvac verify --strict` is a user's hook and stays theirs.
 */
type Owns = (command: string) => boolean;

/** The gate: three exact strings — the two per-event commands, and the bare
 *  engine every brain projected before them. Recognising the legacy string is
 *  the upgrade path: the merge rewrites a hook of ours in place, so a `doors`
 *  re-run turns an old entry into this event's gate rather than leaving it and
 *  appending a second one beside it. Identity stays exact — `mvac verify
 *  --strict` is a user's hook and stays theirs. */
const ownsVerify: Owns = (c) => c === VERIFY || c === SESSION_GATE || c === EDIT_GATE;

/**
 * The refresh: its tail carries the declared grapher's own command, which is
 * exactly what an update has to be able to change, so identity is the head
 * this module generates — a path under multivac's cache that nobody types.
 * Which grapher a hook of ours is for is a second question, `refreshKey`'s:
 * a command a human typed is never ours, whatever grapher or artifact it names.
 */
const ownsRefresh: Owns = (c) => c.startsWith(REFRESH_HEAD);

/** MV-140's toplevel test, `[ -e "$t/<artifact>" ]`, in every form `refreshHookCmd` writes. */
const ARTIFACT_TEST = /\[ -e "\$t\/([^"]+)" \]/;

/**
 * MV-149. The grapher a refresh hook is for: the artifact its toplevel test
 * names, written into every hook since MV-140, the follow form included. The
 * follow form's brain guard, `[ ! -e "$t/.multivac/config.yml" ]`, is not one:
 * its `!` keeps it from matching. `undefined` for a hook written before that
 * test existed, which names no grapher. It adds no byte to any hook.
 */
export function refreshKey(command: string): string | undefined {
  return ARTIFACT_TEST.exec(command)?.[1];
}

/** MV-149. One wanted refresh hook: `refreshHookCmd`'s arguments, which `doors` builds per grapher. */
export type RefreshHook = { refresh: string; env: Record<string, string>; artifact?: string; follow?: boolean };

/** One hook object of ours, with the entry and the array that hold it. */
type Owned = { entry: Json; hooks: unknown[]; hook: Json };

/**
 * Every hook object of ours in an event's list. The unit of ownership is the
 * HOOK, never the entry: an entry is the user's grouping — their matcher,
 * their commands — so the merge owns only the hook it wrote, and an entry of
 * theirs that merely mentions our command is read past, never claimed.
 */
function ourHooks(list: unknown[], owns: Owns): Owned[] {
  const found: Owned[] = [];
  for (const e of list) {
    if (typeof e !== 'object' || e === null) continue;
    const entry = e as Json;
    const hooks = entry.hooks;
    if (!Array.isArray(hooks)) continue;
    for (const h of hooks) {
      if (typeof h !== 'object' || h === null) continue;
      const hook = h as Json;
      if (typeof hook.command === 'string' && owns(hook.command)) {
        found.push({ entry, hooks, hook });
      }
    }
  }
  return found;
}

function eventList(hooks: Json, event: string): unknown[] {
  const list = (hooks[event] ??= []);
  if (!Array.isArray(list)) {
    throw new Error(
      `.claude/settings.json: hooks.${event} is not a list — fix it by hand, multivac only appends entries`,
    );
  }
  return list;
}

/** Remove one value from its array. Not there removes nothing: `indexOf` would
 *  hand `splice` a -1 and take the tail instead, and this is somebody's
 *  settings file. Unreachable as the callers stand; the file is the reason. */
function drop(arr: unknown[], value: unknown): void {
  const i = arr.indexOf(value);
  if (i >= 0) arr.splice(i, 1);
}

/**
 * Rewrite one hook of ours in place, and nothing else. Sibling commands stay,
 * fields we do not write (a `timeout`) stay, and the matcher is never
 * rewritten: it is written once, on an entry this module creates, and belongs
 * to whoever holds it. `command` carries the refresh, whose tail is the
 * grapher's own command. `type` is a field we DO write, so a hook of ours that
 * was hand-typed without it gets completed rather than left malformed: the
 * harness runs no hook whose type is missing. The gate and every refresh hook
 * are rewritten here (MV-74).
 */
function rewrite(m: Owned, command: string): void {
  m.hook.command = command;
  m.hook.type = 'command';
}

/**
 * MV-149. Keep one refresh hook per wanted grapher in an event's list, each
 * identified by the artifact its toplevel test names (`refreshKey`):
 *
 * 1. every hook of ours naming a wanted artifact is rewritten in place,
 *    copies included;
 * 2. a wanted grapher with no hook yet takes over, in place inside its entry,
 *    the first hook of ours naming no wanted artifact or none — its matcher,
 *    a `timeout` and the commands beside it kept;
 * 3. a wanted grapher still without one gets a new entry on `matcher`;
 * 4. every other hook of ours is removed, its entry only when that leaves it
 *    empty.
 *
 * An empty `wanted` removes every hook of ours: a hook pointing at a missing
 * tool is worse than no hook. Two keyless copies of ours, written before
 * MV-140's test, become one: step 2 takes the first, step 4 removes the other.
 * A second wanted hook naming an artifact already wanted is dropped — the
 * resolver lists one grapher per artifact, and two hooks with one key would
 * trade places on every run.
 */
function ensureRefreshes(list: unknown[], wanted: RefreshHook[], matcher: string): void {
  const ours = ourHooks(list, ownsRefresh);
  const keyOf = new Map(ours.map((m) => [m, refreshKey(m.hook.command as string)]));
  const want = wanted.filter((w, i) => wanted.findIndex((x) => x.artifact === w.artifact) === i);
  const keys = new Set(want.map((w) => w.artifact));
  const command = (w: RefreshHook): string => refreshHookCmd(w.refresh, w.env, w.artifact, w.follow);
  const kept = new Set<Owned>();
  const without: RefreshHook[] = [];
  for (const w of want) {
    const own = ours.filter((m) => keyOf.get(m) === w.artifact);
    for (const m of own) {
      rewrite(m, command(w));
      kept.add(m);
    }
    if (own.length === 0) without.push(w);
  }
  for (const w of without) {
    const free = ours.find((m) => !kept.has(m) && !keys.has(keyOf.get(m)));
    if (free) {
      rewrite(free, command(w));
      kept.add(free);
      continue;
    }
    // `hooks` before `matcher`: the key order every entry of ours was written in.
    list.push({ hooks: [{ type: 'command', command: command(w) }], matcher });
  }
  for (const m of ours) {
    if (kept.has(m)) continue;
    drop(m.hooks, m.hook);
    if (m.hooks.length === 0) drop(list, m.entry);
  }
}

/**
 * Add (or update in place) one multivac hook; foreign entries never move.
 * Returns a notice when it had to add a copy beside one that already exists.
 *
 * `gate` says this hook has to COVER what `matcher` names. A hook of ours in
 * an entry with a different matcher is still ours to keep fresh, but it does
 * not gate the edit tools, and rewriting somebody's matcher is the defect this
 * module was fixed to stop doing — so the gate gets its own entry beside
 * theirs, and the caller is told. The refresh takes no such requirement: it is
 * the agent's navigation aid, not a gate, so it rides wherever its hook sits.
 */
function ensureEvent(
  hooks: Json,
  event: string,
  owns: Owns,
  command: string,
  opts: { matcher?: string; gate?: boolean } = {},
): string | null {
  const { matcher, gate } = opts;
  const list = eventList(hooks, event);
  const mine = ourHooks(list, owns);
  // Ours already: rewrite THIS hook and nothing else (`rewrite`). `command`
  // is a no-op on the gate — there identity IS the whole command.
  for (const m of mine) rewrite(m, command);
  const covers = mine.some((m) => m.entry.matcher === matcher);
  if (mine.length > 0 && (!gate || covers)) return null;
  const entry: Json = { hooks: [{ type: 'command', command }] };
  if (matcher !== undefined) entry.matcher = matcher;
  list.push(entry);
  if (mine.length === 0) return null;
  const where = matcher === undefined ? 'unconditionally' : `on matcher \`${matcher}\``;
  return (
    `.claude/settings.json: hooks.${event} already runs \`${command}\`, but not ${where} — ` +
    'the gate has to cover what it gates, so multivac added its own entry beside yours ' +
    'rather than rewrite a matcher it does not own. Delete whichever you do not want by hand.'
  );
}

/**
 * A duplicate of the gate hook in one event — what the old substring-matching
 * merge left behind when it claimed a foreign entry and then appended its own
 * further down the list. Reported, never removed: the survivor is now
 * byte-identical to ours, so nothing on disk distinguishes a bug's leftover
 * from a second hook somebody wants. The count is provable; the choice is not.
 *
 * Read BEFORE this merge touches anything, so what it counts is what was found
 * on disk. A copy multivac adds itself in this run announces itself, in the
 * notice `ensureEvent` returns, and is not reported here as somebody's mess.
 */
function duplicateNotice(hooks: Json, event: string): string | null {
  const list = hooks[event];
  if (!Array.isArray(list)) return null;
  const n = ourHooks(list, ownsVerify).length;
  if (n < 2) return null;
  return (
    `.claude/settings.json: hooks.${event} runs \`${VERIFY}\` ${n} times — verify fires ` +
    'once per copy. Delete the entries you do not want by hand; multivac removes no hook ' +
    'entry it did not write, because doing that silently is the defect this notice reports.'
  );
}

/**
 * Merge multivac's hook entries into settings.json content, and report what
 * only a human can settle. raw === null (absent file) starts from {}. Invalid
 * JSON throws — the caller notices and skips rather than clobbering a user file.
 *
 * `refreshes` are the refresh hooks wanted, one per grapher, each only when
 * its binary is present (MV-149); none wanted removes every refresh hook of
 * ours. `refresh`, `env`, `artifact` and `follow` are one such hook, for a
 * caller wanting at most one: `refresh` the declared grapher's refresh command
 * (null/undefined wants none), `env` its opt-out environment, which the hook
 * exports (MV-124), `artifact` the one its toplevel test names (MV-140), and
 * `follow` a follow hook of the brain (MV-148). `refreshes` wins where both
 * are given.
 */
export function mergeClaudeSettings(
  raw: string | null,
  opts: {
    refreshes?: RefreshHook[];
    refresh?: string | null;
    matcher?: string;
    env?: Record<string, string>;
    artifact?: string;
    follow?: boolean;
  } = {},
): { text: string; notices: string[] } {
  let obj: unknown = {};
  if (raw !== null && raw.trim() !== '') {
    try {
      obj = JSON.parse(raw);
    } catch {
      throw new Error(
        '.claude/settings.json is not valid JSON — fix it, then rerun `multivac doors`',
      );
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(
      '.claude/settings.json top level must be an object — fix it, then rerun `multivac doors`',
    );
  }
  const settings = obj as Json;
  const hooks = (settings.hooks ??= {});
  if (typeof hooks !== 'object' || hooks === null || Array.isArray(hooks)) {
    throw new Error(
      '.claude/settings.json: "hooks" must be an object — fix it, then rerun `multivac doors`',
    );
  }
  const matcher = opts.matcher ?? EDIT_TOOLS;
  const notices: string[] = [];
  for (const event of ['SessionStart', 'PostToolUse']) {
    const dup = duplicateNotice(hooks as Json, event);
    if (dup) notices.push(dup);
  }
  for (const added of [
    ensureEvent(hooks as Json, 'SessionStart', ownsVerify, SESSION_GATE, { gate: true }),
    ensureEvent(hooks as Json, 'PostToolUse', ownsVerify, EDIT_GATE, { matcher, gate: true }),
  ]) {
    if (added) notices.push(added);
  }
  const wanted =
    opts.refreshes ??
    (opts.refresh ? [{ refresh: opts.refresh, env: opts.env ?? {}, artifact: opts.artifact, follow: opts.follow }] : []);
  ensureRefreshes(eventList(hooks as Json, 'PostToolUse'), wanted, matcher);
  return { text: JSON.stringify(settings, null, 2) + '\n', notices };
}
