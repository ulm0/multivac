// Managed edit of .claude/settings.json: add multivac's harness hook entries,
// preserve every key and entry we don't own. Idempotent.
//
// Two entries, two different jobs. `verify` is the gate: it runs at session
// start and after edits. The grapher refresh is NOT a gate — it is the
// agent's navigation aid, so it follows the agent's edits rather than the
// commit: fire-and-forget, output discarded, exit 0 whatever the tool did.

const HOOK_CMD = 'mvac verify';

/** Claude Code's file-editing tools — the default post-edit matcher. */
const EDIT_TOOLS = 'Edit|Write|MultiEdit';

/**
 * Coalescing lock, under the gitignored cache. Also identifies our entry.
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
 */
export function refreshHookCmd(refresh: string): string {
  return (
    `${REFRESH_HEAD} find "$L" -maxdepth 0 -mmin +30 -exec rmdir {} + 2>/dev/null; ` +
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

/** The gate: one fixed command, so the whole string is the identity. */
const ownsVerify: Owns = (c) => c === HOOK_CMD;

/**
 * The refresh: its tail carries the declared grapher's own command, which is
 * exactly what an update has to be able to change, so identity is the head
 * this module generates — a path under multivac's cache that nobody types.
 */
const ownsRefresh: Owns = (c) => c.startsWith(REFRESH_HEAD);

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
  for (const m of mine) {
    // Ours already: rewrite THIS hook and nothing else. Sibling commands stay,
    // fields we do not write (a `timeout`) stay, and the matcher is never
    // rewritten: it is written once, on the entry we create below, and belongs
    // to whoever holds it. `command` is a no-op on the gate — there identity IS
    // the whole command — and carries the refresh, whose tail is the grapher's
    // own command. `type` is a field we DO write, so a hook of ours that was
    // hand-typed without it gets completed rather than left malformed: the
    // harness runs no hook whose type is missing.
    m.hook.command = command;
    m.hook.type = 'command';
  }
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
    `.claude/settings.json: hooks.${event} runs \`${HOOK_CMD}\` ${n} times — verify fires ` +
    'once per copy. Delete the entries you do not want by hand; multivac removes no hook ' +
    'entry it did not write, because doing that silently is the defect this notice reports.'
  );
}

/**
 * Merge multivac's hook entries into settings.json content, and report what
 * only a human can settle. raw === null (absent file) starts from {}. Invalid
 * JSON throws — the caller notices and skips rather than clobbering a user file.
 *
 * `refresh` is the declared grapher's refresh command, and only when its
 * binary is present; null/undefined writes no refresh entry at all.
 */
export function mergeClaudeSettings(
  raw: string | null,
  opts: { refresh?: string | null; matcher?: string } = {},
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
    ensureEvent(hooks as Json, 'SessionStart', ownsVerify, HOOK_CMD, { gate: true }),
    ensureEvent(hooks as Json, 'PostToolUse', ownsVerify, HOOK_CMD, { matcher, gate: true }),
  ]) {
    if (added) notices.push(added);
  }
  if (opts.refresh) {
    ensureEvent(hooks as Json, 'PostToolUse', ownsRefresh, refreshHookCmd(opts.refresh), { matcher });
  } else {
    // No grapher declared, or its binary is gone: our hook goes with it —
    // a hook pointing at a missing tool is worse than no hook. Every match is
    // machine-generated and provably ours, so all of them go; the entry goes
    // only if we leave it with nothing.
    const list = (hooks as Json).PostToolUse;
    if (Array.isArray(list)) {
      for (const { entry, hooks: hs, hook } of ourHooks(list, ownsRefresh)) {
        drop(hs, hook);
        if (hs.length === 0) drop(list, entry);
      }
    }
  }
  return { text: JSON.stringify(settings, null, 2) + '\n', notices };
}
