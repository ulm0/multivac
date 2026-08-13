// Managed edit of .claude/settings.json: add multivac's harness hook entries,
// preserve every key and entry we don't own. Idempotent.

const HOOK_CMD = 'mvac verify';

type Json = Record<string, unknown>;

function hasOurHook(list: unknown): boolean {
  return (
    Array.isArray(list) &&
    list.some(
      (e) =>
        typeof e === 'object' &&
        e !== null &&
        Array.isArray((e as Json).hooks) &&
        ((e as Json).hooks as unknown[]).some(
          (h) =>
            typeof h === 'object' &&
            h !== null &&
            typeof (h as Json).command === 'string' &&
            ((h as Json).command as string).includes(HOOK_CMD),
        ),
    )
  );
}

function ensureEvent(hooks: Json, event: string, matcher?: string): void {
  const list = (hooks[event] ??= []);
  if (!Array.isArray(list)) {
    throw new Error(
      `.claude/settings.json: hooks.${event} is not a list — fix it by hand, multivac only appends entries`,
    );
  }
  if (hasOurHook(list)) return;
  const entry: Json = { hooks: [{ type: 'command', command: HOOK_CMD }] };
  if (matcher !== undefined) entry.matcher = matcher;
  list.push(entry);
}

/**
 * Merge multivac's hook entries into settings.json content.
 * raw === null (absent file) starts from {}. Invalid JSON throws — the caller
 * notices and skips rather than clobbering a user file.
 */
export function mergeClaudeSettings(raw: string | null): string {
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
  ensureEvent(hooks as Json, 'SessionStart');
  ensureEvent(hooks as Json, 'PostToolUse', 'Edit|Write|MultiEdit');
  return JSON.stringify(settings, null, 2) + '\n';
}
