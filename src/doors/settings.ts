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

/** Coalescing lock, under the gitignored cache. Also identifies our entry. */
const CACHE = '.multivac/cache';
const LOCK = `${CACHE}/graph-refresh.lock`;

type Json = Record<string, unknown>;

/**
 * The post-edit refresh command, for a grapher's `refresh` (`graphify update .`).
 *
 * Never blocks the agent's edit loop and never fails it:
 * - `mkdir` of a directory is the atomic lock — a refresh already running
 *   means this edit's hook exits immediately instead of thrashing a big repo.
 *   A lock left behind by a killed process is cleared after 30 minutes.
 * - the refresh runs in a background subshell with stdio detached, so the
 *   harness gets its exit the moment the hook is fired.
 * - the hook always exits 0: a foreign tool's failure is not the agent's.
 */
export function refreshHookCmd(refresh: string): string {
  return (
    `L=${LOCK}; find "$L" -maxdepth 0 -mmin +30 -exec rmdir {} + 2>/dev/null; ` +
    `mkdir -p ${CACHE} && mkdir "$L" 2>/dev/null || exit 0; ` +
    `{ ${refresh}; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0`
  );
}

/** Our entry in an event's list, found by the marker its command carries. */
function ourEntry(list: unknown[], marker: string): Json | undefined {
  return list.find(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      Array.isArray((e as Json).hooks) &&
      ((e as Json).hooks as unknown[]).some(
        (h) =>
          typeof h === 'object' &&
          h !== null &&
          typeof (h as Json).command === 'string' &&
          ((h as Json).command as string).includes(marker),
      ),
  ) as Json | undefined;
}

/** Add (or update in place) one multivac entry; foreign entries never move. */
function ensureEvent(
  hooks: Json,
  event: string,
  marker: string,
  command: string,
  matcher?: string,
): void {
  const list = (hooks[event] ??= []);
  if (!Array.isArray(list)) {
    throw new Error(
      `.claude/settings.json: hooks.${event} is not a list — fix it by hand, multivac only appends entries`,
    );
  }
  const mine = ourEntry(list, marker);
  if (mine) {
    // Ours already: rewrite the command so a changed grapher is not stale.
    mine.hooks = [{ type: 'command', command }];
    if (matcher !== undefined) mine.matcher = matcher;
    return;
  }
  const entry: Json = { hooks: [{ type: 'command', command }] };
  if (matcher !== undefined) entry.matcher = matcher;
  list.push(entry);
}

/**
 * Merge multivac's hook entries into settings.json content.
 * raw === null (absent file) starts from {}. Invalid JSON throws — the caller
 * notices and skips rather than clobbering a user file.
 *
 * `refresh` is the declared grapher's refresh command, and only when its
 * binary is present; null/undefined writes no refresh entry at all.
 */
export function mergeClaudeSettings(
  raw: string | null,
  opts: { refresh?: string | null; matcher?: string } = {},
): string {
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
  ensureEvent(hooks as Json, 'SessionStart', HOOK_CMD, HOOK_CMD);
  ensureEvent(hooks as Json, 'PostToolUse', HOOK_CMD, HOOK_CMD, matcher);
  if (opts.refresh) {
    ensureEvent(hooks as Json, 'PostToolUse', LOCK, refreshHookCmd(opts.refresh), matcher);
  } else {
    // No grapher declared, or its binary is gone: our entry goes with it —
    // a hook pointing at a missing tool is worse than no hook.
    const list = (hooks as Json).PostToolUse;
    if (Array.isArray(list)) {
      const mine = ourEntry(list, LOCK);
      if (mine) list.splice(list.indexOf(mine), 1);
    }
  }
  return JSON.stringify(settings, null, 2) + '\n';
}
