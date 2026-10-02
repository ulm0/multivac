// Managed edit of .claude/settings.json: add multivac's harness hook entries,
// preserve every key and entry we don't own. Idempotent.
//
// `verify` is the gate: it runs at session start and after edits, each event
// wrapped for the one channel Claude Code reads back (SESSION_GATE / EDIT_GATE
// below). It is the only hook multivac writes (MV-153): the post-edit refresh
// an earlier release wrote beside it is taken back (`removeRefreshes`).

import { OUR_REFRESH_HEAD } from '../lib/dropped.js';

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

type Json = Record<string, unknown>;

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
 *  settings file. Unreachable as `removeRefreshes` stands; the file is the reason. */
function drop(arr: unknown[], value: unknown): void {
  const i = arr.indexOf(value);
  if (i >= 0) arr.splice(i, 1);
}

/**
 * MV-153. Take back every post-edit refresh hook an earlier multivac wrote: a
 * hook, under any event, whose command starts with the lock that refresh
 * always took first. Only that hook goes, and its entry only where that leaves
 * the entry empty: a sibling command, a matcher and a hook a human edited past
 * that head stay theirs (MV-74), as does a vendor's own hook. Returns how many.
 */
function removeRefreshes(hooks: Json): number {
  let removed = 0;
  for (const list of Object.values(hooks)) {
    if (!Array.isArray(list)) continue;
    for (const m of ourHooks(list, (c) => c.startsWith(OUR_REFRESH_HEAD))) {
      drop(m.hooks, m.hook);
      if (m.hooks.length === 0) drop(list, m.entry);
      removed++;
    }
  }
  return removed;
}

/**
 * Rewrite one hook of ours in place, and nothing else. Sibling commands stay,
 * fields we do not write (a `timeout`) stay, and the matcher is never
 * rewritten: it is written once, on an entry this module creates, and belongs
 * to whoever holds it. `type` is a field we DO write, so a hook of ours that
 * was hand-typed without it gets completed rather than left malformed: the
 * harness runs no hook whose type is missing. The gate is rewritten here
 * (MV-74).
 */
function rewrite(m: Owned, command: string): void {
  m.hook.command = command;
  m.hook.type = 'command';
}

/**
 * Add (or update in place) one multivac hook; foreign entries never move.
 * Returns a notice when it had to add a copy beside one that already exists.
 *
 * `gate` says this hook has to COVER what `matcher` names. A hook of ours in
 * an entry with a different matcher is still ours to keep fresh, but it does
 * not gate the edit tools, and rewriting somebody's matcher is the defect this
 * module was fixed to stop doing — so the gate gets its own entry beside
 * theirs, and the caller is told.
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
 * `matcher` is the harness's post-edit matcher, the gate's. `removed` counts
 * the refresh hooks of an earlier multivac taken back (MV-153).
 */
export function mergeClaudeSettings(
  raw: string | null,
  opts: { matcher?: string } = {},
): { text: string; notices: string[]; removed: number } {
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
  const removed = removeRefreshes(hooks as Json);
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
  return { text: JSON.stringify(settings, null, 2) + '\n', notices, removed };
}
